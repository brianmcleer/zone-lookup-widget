/**
 * Multi-layer lookup cascade.
 *
 * A generic three-step point lookup for phased or tiered programs where a
 * single zone layer is not enough (service conversions, districting overlaps,
 * tiered eligibility, and similar):
 *
 * Step 1 - cascadePriorityUrl: a hit here short-circuits the cascade and
 *          renders cascadePriorityTemplate (falls back to resultTemplate).
 *          A priority-layer hit always wins, including where its polygons
 *          overlap the primary layer, so overlapping boundaries resolve
 *          deterministically instead of erroring.
 * Step 2 - cascadePrimaryUrl: the main zone layer. A miss on both layers
 *          returns empty features so the widget shows the outside-area card.
 * Step 3 - cascadeLookupUrl + cascadeLookupField: the field value at the
 *          point, translated through the cascadeValueMap JSON object (keys
 *          matched case-insensitively), is exposed to resultTemplate as
 *          {__mappedValue}; the matched key itself as {__lookupValue}.
 *
 * A lookup that cannot be resolved (missing lookup config, no field value,
 * or no matching key in the map) throws CascadeError carrying
 * cascadeUnresolvedMessage (falls back to errorMessage).
 *
 * Performance:
 *  - All three exact-intersect queries fire in parallel; buffered retries
 *    (30 m, absorbing geocoder points dropped in the road right-of-way just
 *    outside zone polygons) run only for layers that missed and only when
 *    their answer still matters, also in parallel.
 *  - FeatureLayer instances are cached per URL for the session, so each
 *    layer's service-metadata fetch happens once, not on every search.
 *  - The lookup-layer query requests only cascadeLookupField and no geometry.
 */
export class CascadeError extends Error {}

const layerCache = new Map<string, any>()
const getLayer = (FeatureLayer: any, url: string) => {
    let lyr = layerCache.get(url)
    if (!lyr) {
        lyr = new FeatureLayer({ url })
        layerCache.set(url, lyr)
    }
    return lyr
}

export async function runCascade(FeatureLayer: any, baseQuery: any, config: any) {
    const unresolved = (): never => {
        throw new CascadeError(config.cascadeUnresolvedMessage || config.errorMessage)
    }
    if (!config.cascadePrimaryUrl) return unresolved()

    const hasLookupCfg = Boolean(config.cascadeLookupUrl && config.cascadeLookupField)
    const lookupQuery = {
        ...baseQuery,
        outFields: hasLookupCfg ? [config.cascadeLookupField] : baseQuery.outFields,
        returnGeometry: false
    }

    // Buffered retry distance. 0 disables the retry, so only exact
    // point-in-polygon matches count.
    const rawBuf = config.bufferMeters
    const bufferMeters = rawBuf === undefined || rawBuf === null ? 30 : Number(rawBuf)
    const run = (url: string, q: any, buffered: boolean) =>
        getLayer(FeatureLayer, url).queryFeatures(
            buffered && bufferMeters > 0 ? { ...q, distance: bufferMeters, units: 'meters' } : q
        )
    const hit = (r: any) => Boolean(r && r.features && r.features.length > 0)

    // Round 1: all exact-intersect queries in parallel.
    let [priority, primary, lookup] = await Promise.all([
        config.cascadePriorityUrl ? run(config.cascadePriorityUrl, baseQuery, false) : null,
        run(config.cascadePrimaryUrl, baseQuery, false),
        hasLookupCfg ? run(config.cascadeLookupUrl, lookupQuery, false) : null
    ])

    // Round 2: buffered retries, in parallel, only where the answer matters.
    if (bufferMeters > 0 && !hit(priority) && !hit(primary)) {
        const [priorityB, primaryB] = await Promise.all([
            config.cascadePriorityUrl ? run(config.cascadePriorityUrl, baseQuery, true) : null,
            run(config.cascadePrimaryUrl, baseQuery, true)
        ])
        if (priorityB) priority = priorityB
        primary = primaryB
    }

    // Step 1: priority layer wins.
    if (hit(priority)) return { result: priority, priority: true, meta: {} }

    // Step 2: outside both layers -> outside-area card (not an error).
    if (!hit(primary)) return { result: primary, priority: false, meta: {} }

    // Step 3: lookup field value -> mapped display text.
    if (!hasLookupCfg) return unresolved()
    if (!hit(lookup) && bufferMeters > 0) {
        lookup = await run(config.cascadeLookupUrl, lookupQuery, true)
    }
    const raw = lookup?.features?.[0]?.attributes?.[config.cascadeLookupField]
    const lookupValue = raw == null ? '' : String(raw).trim()
    if (!lookupValue) return unresolved()

    let valueMap: Record<string, any> = {}
    try {
        valueMap = JSON.parse(config.cascadeValueMap || '{}')
    } catch {
        return unresolved()
    }
    const key = Object.keys(valueMap).find(
        k => k.trim().toLowerCase() === lookupValue.toLowerCase()
    )
    const mappedValue = key ? String(valueMap[key]).trim() : ''
    if (!mappedValue) return unresolved()

    return {
        result: primary,
        priority: false,
        meta: { __lookupValue: key, __mappedValue: mappedValue }
    }
}
