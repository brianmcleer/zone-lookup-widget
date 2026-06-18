/** @jsx jsx */
/** @jsxFrag React.Fragment */
import {
  React,
  jsx,
  css,
  type AllWidgetProps,
  DataSourceComponent,
  type DataSource,
  type FeatureLayerDataSource
} from 'jimu-core'
import {
  JimuMapViewComponent,
  type JimuMapView,
  loadArcGISJSAPIModules
} from 'jimu-arcgis'
import { Button, TextInput, Tooltip, Loading, LoadingType, Alert } from 'jimu-ui'
import { type IMConfig } from '../config'
import defaultMessages from './translations/default'

// ---------- Inline SVG icons (no jimu-icons module deps) ----------

const Svg = (
  props: { size?: number, className?: string, paths: React.ReactNode, strokeWidth?: number }
) => (
  <svg
    width={props.size ?? 16} height={props.size ?? 16}
    viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={props.strokeWidth ?? 2}
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true" focusable="false" className={props.className}
  >
    {props.paths}
  </svg>
)

const SearchSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} paths={<><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>} />
)
const PinSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} paths={<><path d="M12 22s7-7.58 7-13a7 7 0 1 0-14 0c0 5.42 7 13 7 13z" /><circle cx="12" cy="9" r="2.5" /></>} />
)
const CloseSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} strokeWidth={2.2} size={p.size ?? 14} paths={<path d="M18 6 6 18M6 6l12 12" />} />
)
const HelpSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} size={p.size ?? 14} paths={<><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 1 1 5.8 1c0 2-3 2-3 4" /><line x1="12" y1="17" x2="12.01" y2="17" /></>} />
)
const CrosshairSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} paths={<><circle cx="12" cy="12" r="9" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></>} />
)
const MapClickSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} paths={<><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6z" /><path d="M9 3v15M15 6v8" /><circle cx="17.5" cy="16.5" r="2" fill="currentColor" /></>} />
)
const HistorySvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} size={p.size ?? 14} paths={<><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 7v5l3 2" /></>} />
)
const ShareSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} size={p.size ?? 14} paths={<><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.6" y1="13.5" x2="15.4" y2="17.5" /><line x1="15.4" y1="6.5" x2="8.6" y2="10.5" /></>} />
)
const PrintSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} size={p.size ?? 14} paths={<><path d="M6 9V2h12v7" /><rect x="6" y="14" width="12" height="8" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /></>} />
)
const CheckSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} size={p.size ?? 14} paths={<polyline points="20 6 9 17 4 12" />} />
)
const MapPinOffSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} size={p.size ?? 24} paths={<><path d="M5.43 5.43A8.06 8.06 0 0 0 4 10c0 6 8 12 8 12a29.94 29.94 0 0 0 5-5" /><path d="M19.18 13.52A8.66 8.66 0 0 0 20 10a8 8 0 0 0-8-8 7.88 7.88 0 0 0-3.52.82" /><path d="M9.13 9.13A2.78 2.78 0 0 0 9 10a3 3 0 0 0 3 3 2.78 2.78 0 0 0 .87-.13" /><path d="M14.9 9.25a3 3 0 0 0-2.15-2.16" /><line x1="2" y1="2" x2="22" y2="22" /></>} />
)
const LinkSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} size={p.size ?? 16} paths={<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></>} />
)
const MailSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} size={p.size ?? 16} paths={<><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>} />
)
const MessageSvg = (p: { size?: number, className?: string }) => (
  <Svg {...p} size={p.size ?? 16} paths={<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />} />
)

const { useState, useRef, useCallback, useEffect } = React

// ---------- Template + value helpers ----------

const escapeHtml = (s: any): string => {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

// ---------- WCAG contrast helper ----------
// Pick black or white text for any background, guaranteeing at least 4.5:1
// against the full-opacity background color. Used for the hero badge so admin
// color choices (or dark themes) can't break readability.
const readableTextColor = (rgb: [number, number, number]): string => {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  const L = 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])
  return L > 0.5 ? '#1a1a1a' : '#ffffff'
}

const formatValue = (value: any, field?: any): string => {
  if (value === null || value === undefined || value === '') return ''
  if (field && (field.type === 'date' || field.type === 'esriFieldTypeDate')) {
    try { return new Date(value).toLocaleDateString() } catch (_e) { /* fall through */ }
  }
  return String(value)
}

const renderTemplate = (
  template: string,
  attributes: { [k: string]: any },
  fields: any[] = []
): string => {
  if (!template) return ''
  return template.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, fieldName) => {
    if (!(fieldName in attributes)) return ''
    const field = fields.find((f: any) => f.name === fieldName)
    return escapeHtml(formatValue(attributes[fieldName], field))
  })
}

// ---------- Recent searches (localStorage) ----------

interface RecentSearch {
  address: string
  x: number
  y: number
  ts: number
}

const recentsKey = (widgetId: string) => `zoneLookup.recents.${widgetId}`

const loadRecents = (widgetId: string): RecentSearch[] => {
  try {
    const raw = window.localStorage.getItem(recentsKey(widgetId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (_e) { return [] }
}

const saveRecents = (widgetId: string, list: RecentSearch[]) => {
  try { window.localStorage.setItem(recentsKey(widgetId), JSON.stringify(list)) }
  catch (_e) { /* quota / disabled — silently ignore */ }
}

// ---------- Types ----------

interface Suggestion { text: string, magicKey: string, isCollection?: boolean }
type ClickMode = 'idle' | 'armed'

// ---------- Component ----------

const Widget = (props: AllWidgetProps<IMConfig>) => {
  const { config, useDataSources, useMapWidgetIds, id } = props

  // ---- State ----
  const [address, setAddress] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState(defaultMessages.searching)
  const [resultFeature, setResultFeature] = useState<{ attributes: any, fields: any[] } | null>(null)
  const [resultHtml, setResultHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [outsideArea, setOutsideArea] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)
  const [shareMenuOpen, setShareMenuOpen] = useState(false)
  const [recents, setRecents] = useState<RecentSearch[]>([])
  const [clickMode, setClickMode] = useState<ClickMode>('idle')

  // ---- Refs ----
  const mapViewRef = useRef<JimuMapView | null>(null)
  const graphicsLayerRef = useRef<any>(null)
  const dataSourceRef = useRef<FeatureLayerDataSource | null>(null)
  const modulesRef = useRef<any>(null)
  const shareMenuRef = useRef<HTMLDivElement | null>(null)
  const shareTriggerRef = useRef<HTMLButtonElement | null>(null)
  const suggestTimerRef = useRef<number | null>(null)
  const suggestSeqRef = useRef(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const clickHandleRef = useRef<any>(null)
  const clickModeRef = useRef<ClickMode>('idle') // mirrored for closures in handlers

  // Keep ref in sync with state for handlers attached via JSAPI watchers
  useEffect(() => { clickModeRef.current = clickMode }, [clickMode])

  const inputId = `zl-address-${id}`
  const listboxId = `zl-listbox-${id}`
  const resultsId = `zl-results-${id}`

  // ---- Load recents on mount ----
  useEffect(() => {
    if (config.enableRecentSearches) setRecents(loadRecents(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // ---- JSAPI modules ----
  const ensureModules = useCallback(async () => {
    if (modulesRef.current) return modulesRef.current
    const [
      locator, FeatureLayer, GraphicsLayer, Graphic,
      SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol, Point
    ] = await loadArcGISJSAPIModules([
      'esri/rest/locator',
      'esri/layers/FeatureLayer',
      'esri/layers/GraphicsLayer',
      'esri/Graphic',
      'esri/symbols/SimpleFillSymbol',
      'esri/symbols/SimpleMarkerSymbol',
      'esri/symbols/SimpleLineSymbol',
      'esri/geometry/Point'
    ])
    modulesRef.current = {
      locator, FeatureLayer, GraphicsLayer, Graphic, Point,
      SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol
    }
    return modulesRef.current
  }, [])

  useEffect(() => { void ensureModules() }, [ensureModules])

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current)
      const map = mapViewRef.current?.view?.map
      if (graphicsLayerRef.current && map) {
        map.remove(graphicsLayerRef.current)
        graphicsLayerRef.current = null
      }
      try { clickHandleRef.current?.remove?.() } catch (_e) { /* noop */ }
      clickHandleRef.current = null
    }
  }, [])

  // ---- Click outside closes suggestions ----
  useEffect(() => {
    if (!showSuggestions) return
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showSuggestions])

  // ---- Map view subscription ----
  const onActiveViewChange = useCallback(async (jmv: JimuMapView) => {
    // Remove handler from prior view if any
    try { clickHandleRef.current?.remove?.() } catch (_e) { /* noop */ }
    clickHandleRef.current = null

    mapViewRef.current = jmv
    if (!jmv) return
    const mods = await ensureModules()
    if (!graphicsLayerRef.current) {
      graphicsLayerRef.current = new mods.GraphicsLayer({
        id: `zone-lookup-graphics-${id}`,
        listMode: 'hide'
      })
      jmv.view.map.add(graphicsLayerRef.current)
    }

    // Attach a permanent click listener that only acts when click-mode is armed
    clickHandleRef.current = jmv.view.on('click', (event: any) => {
      if (clickModeRef.current !== 'armed') return
      event.stopPropagation?.()
      void runMapClickLookup(event.mapPoint)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, ensureModules])

  // ---- Data source subscription ----
  const onDsCreated = useCallback((ds: DataSource) => {
    dataSourceRef.current = ds as FeatureLayerDataSource
  }, [])

  // ---- Helpers ----
  const clearGraphics = useCallback(() => { graphicsLayerRef.current?.removeAll() }, [])
  const focusInput = useCallback(() => {
    (document.getElementById(inputId) as HTMLInputElement | null)?.focus()
  }, [inputId])
  const focusResults = useCallback(() => {
    window.setTimeout(() => {
      (document.getElementById(resultsId) as HTMLDivElement | null)?.focus()
    }, 50)
  }, [resultsId])

  const buildSearchExtent = useCallback(() => {
    if (config.constrainSearch === 'mapExtent' && mapViewRef.current?.view?.extent) {
      return mapViewRef.current.view.extent
    } else if (
      config.constrainSearch === 'layerExtent' &&
      dataSourceRef.current?.layer?.fullExtent
    ) {
      return dataSourceRef.current.layer.fullExtent
    }
    return undefined
  }, [config.constrainSearch])

  // ---- Persist a recent search ----
  const pushRecent = useCallback((entry: RecentSearch) => {
    if (!config.enableRecentSearches) return
    setRecents(prev => {
      const filtered = prev.filter(r =>
        r.address.toLowerCase() !== entry.address.toLowerCase()
      )
      const next = [entry, ...filtered].slice(0, Math.max(1, config.maxRecentSearches || 5))
      saveRecents(id, next)
      return next
    })
  }, [config.enableRecentSearches, config.maxRecentSearches, id])

  const clearRecents = useCallback(() => {
    setRecents([])
    saveRecents(id, [])
  }, [id])

  // ---- Suggestions ----
  const fetchSuggestions = useCallback(async (text: string) => {
    if (!text || text.trim().length < 3) {
      setSuggestions([]); setShowSuggestions(false); return
    }
    try {
      const { locator } = await ensureModules()
      const seq = ++suggestSeqRef.current
      const params: any = { text, maxSuggestions: 6 }
      const ext = buildSearchExtent()
      if (ext) params.searchExtent = ext

      const results = await locator.suggestLocations(config.geocodeUrl, params)
      if (seq !== suggestSeqRef.current) return

      const list: Suggestion[] = (results || []).map((r: any) => ({
        text: r.text, magicKey: r.magicKey, isCollection: r.isCollection
      }))
      setSuggestions(list)
      setShowSuggestions(list.length > 0)
      setActiveIndex(-1)
    } catch (e) {
      console.warn('Zone Lookup suggest error:', e)
      setSuggestions([]); setShowSuggestions(false)
    }
  }, [config.geocodeUrl, ensureModules, buildSearchExtent])

  const onAddressChange = useCallback((value: string) => {
    setAddress(value)
    setError(null)
    setOutsideArea(false)
    if (suggestTimerRef.current) window.clearTimeout(suggestTimerRef.current)
    suggestTimerRef.current = window.setTimeout(() => {
      void fetchSuggestions(value)
    }, 250)
  }, [fetchSuggestions])

  // ---- Core: spatial lookup for a known geometry point ----
  const runLookupForPoint = useCallback(async (point: any, displayLabel?: string) => {
    setLoading(true)
    setLoadingMessage(defaultMessages.searching)
    setError(null)
    setOutsideArea(false)
    setResultHtml(null)
    setResultFeature(null)
    setStatusMsg(defaultMessages.searching)
    clearGraphics()

    try {
      const mods = await ensureModules()
      const { FeatureLayer, Graphic, SimpleFillSymbol, SimpleMarkerSymbol, SimpleLineSymbol } = mods

      const ds = dataSourceRef.current
      const layerUrl = (ds as any)?.url || (ds?.getDataSourceJson() as any)?.url
      if (!layerUrl) {
        setError(config.errorMessage); setStatusMsg(config.errorMessage); return
      }

      const queryLayer = new FeatureLayer({ url: layerUrl })

      // Two-step query: try exact point-in-polygon first; if nothing hits,
      // retry with a small buffer (30m) to catch geocoder precision issues
      // — e.g., a geocoded point that lands in the road right-of-way just
      // outside the parcel polygon, or boundary jitter on the layer side.
      const baseQuery: any = {
        geometry: point,
        spatialRelationship: 'intersects',
        outFields: ['*'],
        returnGeometry: true
      }
      let result = await queryLayer.queryFeatures(baseQuery)
      if (!result.features || result.features.length === 0) {
        result = await queryLayer.queryFeatures({
          ...baseQuery,
          distance: 30,
          units: 'meters'
        })
      }

      const pinSym = new SimpleMarkerSymbol({
        style: 'circle', color: [255, 80, 80, 0.95], size: 10,
        outline: { color: [255, 255, 255, 1], width: 1.5 }
      })

      if (!result.features || result.features.length === 0) {
        setOutsideArea(true)
        setStatusMsg(config.outsideAreaMessage)
        if (graphicsLayerRef.current) {
          graphicsLayerRef.current.add(new Graphic({ geometry: point, symbol: pinSym }))
          await mapViewRef.current?.view?.goTo({ target: point, zoom: config.zoomLevel })
        }
        return
      }

      const feature = result.features[0]
      const fields = (result as any).fields || queryLayer.fields || []
      // Inject a special `__searchedAddress` token so the result template can
      // reference the address the user typed alongside real feature attributes
      // (e.g. "{__searchedAddress} is in {LAYER}").
      const attributesWithMeta = {
        ...feature.attributes,
        __searchedAddress: displayLabel || ''
      }
      const html = renderTemplate(config.resultTemplate, attributesWithMeta, fields)
      setResultHtml(html)
      setResultFeature({ attributes: feature.attributes, fields })
      setStatusMsg('Results found.')

      if (displayLabel) {
        pushRecent({
          address: displayLabel,
          x: point.longitude ?? point.x,
          y: point.latitude ?? point.y,
          ts: Date.now()
        })
      }

      if (graphicsLayerRef.current) {
        const polySym = new SimpleFillSymbol({
          color: config.highlightFillColor as any,
          outline: new SimpleLineSymbol({
            color: config.highlightOutlineColor as any,
            width: config.highlightOutlineWidth || 2
          })
        })
        graphicsLayerRef.current.add(new Graphic({ geometry: feature.geometry, symbol: polySym }))
        graphicsLayerRef.current.add(new Graphic({ geometry: point, symbol: pinSym }))
        await mapViewRef.current?.view?.goTo({ target: point, zoom: config.zoomLevel })
      }

      focusResults()
    } catch (e) {
      console.error('Zone Lookup error:', e)
      setError(config.errorMessage)
      setStatusMsg(config.errorMessage)
    } finally {
      setLoading(false)
    }
  }, [config, ensureModules, clearGraphics, focusResults, pushRecent])

  // ---- Pick a suggestion ----
  const selectSuggestion = useCallback(async (s: Suggestion) => {
    setAddress(s.text)
    setSuggestions([])
    setShowSuggestions(false)
    setActiveIndex(-1)
    if (s.isCollection) {
      void fetchSuggestions(s.text)
      return
    }
    try {
      const { locator } = await ensureModules()
      const candidates = await locator.addressToLocations(config.geocodeUrl, {
        address: { SingleLine: s.text },
        magicKey: s.magicKey,
        outFields: ['*'],
        maxLocations: 1
      })
      if (!candidates || candidates.length === 0) {
        setError(config.noAddressMessage); setStatusMsg(config.noAddressMessage); return
      }
      await runLookupForPoint(candidates[0].location, s.text)
    } catch (e) {
      console.error('Zone Lookup select error:', e)
      setError(config.errorMessage); setStatusMsg(config.errorMessage)
    }
  }, [config, ensureModules, runLookupForPoint, fetchSuggestions])

  // ---- Enter on typed text without a picked suggestion ----
  const submitTypedAddress = useCallback(async () => {
    const value = address.trim()
    if (!value) return
    setShowSuggestions(false)
    setLoading(true)
    setLoadingMessage(defaultMessages.searching)
    setError(null)
    setStatusMsg(defaultMessages.searching)
    try {
      const { locator } = await ensureModules()
      const params: any = {
        address: { SingleLine: value },
        outFields: ['*'],
        maxLocations: 1
      }
      const ext = buildSearchExtent()
      if (ext) params.searchExtent = ext
      const candidates = await locator.addressToLocations(config.geocodeUrl, params)
      if (!candidates || candidates.length === 0) {
        setError(config.noAddressMessage); setStatusMsg(config.noAddressMessage); return
      }
      await runLookupForPoint(candidates[0].location, value)
    } catch (e) {
      console.error('Zone Lookup submit error:', e)
      setError(config.errorMessage); setStatusMsg(config.errorMessage)
    } finally {
      setLoading(false)
    }
  }, [address, config, ensureModules, buildSearchExtent, runLookupForPoint])

  // ---- Reverse geocode helper (point -> address text) ----
  const reverseGeocode = useCallback(async (point: any): Promise<string> => {
    try {
      const { locator } = await ensureModules()
      const res = await locator.locationToAddress(config.geocodeUrl, { location: point })
      return res?.address || ''
    } catch (_e) { return '' }
  }, [config.geocodeUrl, ensureModules])

  // ---- Use my location ----
  const handleMyLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError(defaultMessages.geoUnsupported)
      setStatusMsg(defaultMessages.geoUnsupported)
      return
    }
    setLoading(true)
    setLoadingMessage(defaultMessages.geolocating)
    setStatusMsg(defaultMessages.geolocating)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const mods = await ensureModules()
          const point = new mods.Point({
            longitude: pos.coords.longitude,
            latitude: pos.coords.latitude
          })
          const addressText = await reverseGeocode(point)
          if (addressText) setAddress(addressText)
          await runLookupForPoint(point, addressText || `(${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)})`)
        } catch (e) {
          console.error('Zone Lookup geolocate error:', e)
          setError(config.errorMessage)
          setLoading(false)
        }
      },
      (err) => {
        const msg = err.code === err.PERMISSION_DENIED
          ? defaultMessages.geoDenied
          : defaultMessages.geoUnavailable
        setError(msg)
        setStatusMsg(msg)
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [config.errorMessage, ensureModules, reverseGeocode, runLookupForPoint])

  // ---- Click-map mode handlers ----
  const toggleClickMode = useCallback(() => {
    setClickMode(prev => prev === 'armed' ? 'idle' : 'armed')
  }, [])

  // Apply / remove crosshair cursor on the map container while armed
  useEffect(() => {
    const container = mapViewRef.current?.view?.container as HTMLElement | undefined
    if (!container) return
    if (clickMode === 'armed') container.style.cursor = 'crosshair'
    else container.style.cursor = ''
    return () => { if (container) container.style.cursor = '' }
  }, [clickMode])

  const runMapClickLookup = useCallback(async (mapPoint: any) => {
    if (!mapPoint) return
    setClickMode('idle')
    const addressText = await reverseGeocode(mapPoint)
    if (addressText) setAddress(addressText)
    await runLookupForPoint(
      mapPoint,
      addressText || `(${(mapPoint.latitude ?? mapPoint.y).toFixed(5)}, ${(mapPoint.longitude ?? mapPoint.x).toFixed(5)})`
    )
  }, [reverseGeocode, runLookupForPoint])

  // ---- Recent search click ----
  const runRecent = useCallback(async (r: RecentSearch) => {
    setAddress(r.address)
    const mods = await ensureModules()
    const point = new mods.Point({ longitude: r.x, latitude: r.y })
    await runLookupForPoint(point, r.address)
  }, [ensureModules, runLookupForPoint])

  // ---- Reset ----
  const handleReset = useCallback(() => {
    setAddress(''); setSuggestions([]); setShowSuggestions(false); setActiveIndex(-1)
    setResultHtml(null); setResultFeature(null); setError(null); setOutsideArea(false); setStatusMsg('')
    setShareFeedback(null)
    clearGraphics(); focusInput()
  }, [clearGraphics, focusInput])

  // ---- Share ----
  const buildShareText = useCallback(() => {
    if (!resultFeature) return address || ''
    const titleField = config.heroTitleField
    const subField = config.heroSubtitleField
    const titleVal = titleField
      ? formatValue(resultFeature.attributes[titleField], resultFeature.fields.find(f => f.name === titleField))
      : ''
    const subVal = subField
      ? formatValue(resultFeature.attributes[subField], resultFeature.fields.find(f => f.name === subField))
      : ''
    const lines = [
      address && `Address: ${address}`,
      titleVal && `Zone: ${titleVal}`,
      subVal && subVal
    ].filter(Boolean)
    return lines.join('\n')
  }, [resultFeature, address, config.heroTitleField, config.heroSubtitleField])

  const handleShare = useCallback(async () => {
    setShareMenuOpen(prev => !prev)
    setShareFeedback(null)
  }, [])

  const getShareUrl = useCallback(() => {
    // Prefer admin-provided shareUrl, then referrer (covers iframe embeds where
    // window.location.href is the embedded URL, not the host page), then current URL.
    return (config as any).shareUrl || document.referrer || window.location.href
  }, [config])

  const handleCopyLink = useCallback(async () => {
    setShareMenuOpen(false)
    const url = getShareUrl()
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setShareFeedback(defaultMessages.linkCopied)
      } else {
        setShareFeedback(defaultMessages.shareUnavailable)
      }
    } catch (_e) {
      setShareFeedback(defaultMessages.shareUnavailable)
    }
    window.setTimeout(() => setShareFeedback(null), 2500)
  }, [getShareUrl])

  const handleEmailShare = useCallback(() => {
    setShareMenuOpen(false)
    const text = buildShareText()
    const url = getShareUrl()
    const subject = encodeURIComponent((config as any).shareEmailSubject || defaultMessages.shareEmailSubject)
    const body = encodeURIComponent(`${text}\n\n${url}`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }, [buildShareText, getShareUrl, config])

  const handleSmsShare = useCallback(() => {
    setShareMenuOpen(false)
    const text = buildShareText()
    const url = getShareUrl()
    const body = encodeURIComponent(`${text}\n${url}`)
    window.location.href = `sms:?body=${body}`
  }, [buildShareText, getShareUrl])

  const handleNativeShare = useCallback(async () => {
    setShareMenuOpen(false)
    const text = buildShareText()
    const url = getShareUrl()
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: defaultMessages.resultsHeading,
          text,
          url
        })
      }
    } catch (_e) {
      // AbortError when user cancels share sheet — ignore
    }
  }, [buildShareText, getShareUrl])

  // Close share menu on outside click or Escape
  useEffect(() => {
    if (!shareMenuOpen) return
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        shareMenuRef.current && !shareMenuRef.current.contains(target) &&
        shareTriggerRef.current && !shareTriggerRef.current.contains(target)
      ) {
        setShareMenuOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShareMenuOpen(false)
        shareTriggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [shareMenuOpen])

  const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  // ---- Print ----
  const handlePrint = useCallback(() => {
    // The print stylesheet (below) scopes output to the result card
    const root = containerRef.current
    if (root) root.classList.add('zl-printing')
    window.setTimeout(() => {
      try { window.print() } finally {
        window.setTimeout(() => root?.classList.remove('zl-printing'), 500)
      }
    }, 50)
  }, [])

  // ---- Keyboard nav in combobox ----
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % suggestions.length); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIndex(i => (i <= 0 ? suggestions.length - 1 : i - 1)); return }
      if (e.key === 'Escape')    { e.preventDefault(); setShowSuggestions(false); setActiveIndex(-1); return }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < suggestions.length) void selectSuggestion(suggestions[activeIndex])
        else void submitTypedAddress()
        return
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      void submitTypedAddress()
    }
  }, [showSuggestions, suggestions, activeIndex, selectSuggestion, submitTypedAddress])

  // ---- Theme via CSS variables ----
  // EB's stylesheet exposes --primary, --surface-1, --gray-100..900, etc. and
  // re-binds them per active theme, so we read those instead of useTheme()'s
  // typed token tree (which changes shape across EB versions).

  // ---- Highlight color as CSS for the hero badge ----
  // The map polygon uses the configured alpha (so the basemap shows through),
  // but the hero badge uses the FULL-opacity color so contrast is predictable
  // and matches what readableTextColor() computes against.
  const fc = config.highlightFillColor as any
  const heroBadgeBg = fc ? `rgb(${fc[0]}, ${fc[1]}, ${fc[2]})` : 'var(--primary)'
  const oc = config.highlightOutlineColor as any
  const heroBadgeBorder = oc ? `rgba(${oc[0]}, ${oc[1]}, ${oc[2]}, ${oc[3] ?? 1})` : 'transparent'
  // Compute readable text color so admin color choices and dark themes
  // can't accidentally break WCAG 1.4.3 contrast on the hero badge.
  const heroTextColor = fc ? readableTextColor([fc[0], fc[1], fc[2]]) : 'inherit'

  // ---- Brand color overrides (chrome / top UI) ----
  // When brandPrimaryColor is set, override --primary and --primary-100 at the
  // widget root so all existing CSS that uses var(--primary) adapts automatically.
  // Tint is a low-alpha version of the brand color used for the active suggestion
  // background and the click-map banner.
  const bpc = config.brandPrimaryColor as any
  const bhc = config.brandHeadingColor as any
  const brandRootStyle: Record<string, string> = {}
  if (bpc) {
    brandRootStyle['--primary'] = `rgb(${bpc[0]}, ${bpc[1]}, ${bpc[2]})`
    brandRootStyle['--primary-100'] = `rgba(${bpc[0]}, ${bpc[1]}, ${bpc[2]}, 0.10)`
  }
  if (bhc) {
    brandRootStyle['--zl-heading'] = `rgb(${bhc[0]}, ${bhc[1]}, ${bhc[2]})`
  }

  // ---- Hero values resolved from feature attributes ----
  const heroTitleVal = (resultFeature && config.heroTitleField)
    ? formatValue(resultFeature.attributes[config.heroTitleField], resultFeature.fields.find((f: any) => f.name === config.heroTitleField))
    : ''
  const heroSubtitleVal = (resultFeature && config.heroSubtitleField)
    ? formatValue(resultFeature.attributes[config.heroSubtitleField], resultFeature.fields.find((f: any) => f.name === config.heroSubtitleField))
    : ''
  const showHero = !!(heroTitleVal || heroSubtitleVal)

  // ---- Styles ----
  const styles = css`
    height: auto;
    min-height: 0;
    overflow: visible;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;

    /* Iframe mode: fill the parent's available height and stretch the result-slot
       cards to take up remaining vertical space. Activated by adding the
       .zl-iframe-mode class to the root via config.iframeMode. */
    &.zl-iframe-mode {
      height: 100%;
      min-height: 100%;
    }
    &.zl-iframe-mode .zl-placeholder-card,
    &.zl-iframe-mode .zl-result-card,
    &.zl-iframe-mode .zl-outside-card {
      flex: 1;
    }
    /* On narrow viewports (mobile-ish), tighten root padding so the iframe
       doesn't lose horizontal space to gutters. */
    @media (max-width: 480px) {
      &.zl-iframe-mode { padding: 12px; gap: 8px; }
    }

    .zl-intro { font-size: 0.95rem; line-height: 1.5; color: var(--zl-heading, var(--gray-700, inherit)); }
    .zl-intro p:last-child { margin-bottom: 0; }

    /* Branded header banner (when headerStyle = 'banner') */
    .zl-banner {
      margin: -16px -16px 16px -16px;
      padding: 16px 18px 18px 18px;
      background: ${brandRootStyle['--zl-heading'] || 'var(--primary, #0079c1)'};
      color: ${bhc ? readableTextColor([bhc[0], bhc[1], bhc[2]]) : '#ffffff'};
      border-radius: 0;
    }
    .zl-banner-title {
      font-size: 1.15rem;
      font-weight: 700;
      line-height: 1.2;
      margin: 0 0 6px 0;
      letter-spacing: -0.005em;
      color: inherit;
    }
    .zl-banner .zl-intro {
      color: inherit;
      font-size: 0.9rem;
      opacity: 0.95;
    }
    .zl-banner .zl-intro p:last-child { margin-bottom: 0; }
    .zl-banner .zl-intro a {
      color: inherit;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .zl-banner .zl-intro a:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    @media (forced-colors: active) {
      .zl-banner {
        border: 1px solid CanvasText;
        background: Canvas;
        color: CanvasText;
      }
    }

    .zl-section-head {
      display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
    }
    .zl-section-title { font-size: 0.875rem; font-weight: 600; letter-spacing: 0.01em; margin: 0; color: var(--zl-heading, inherit); }
    .zl-pin-icon { color: var(--primary, #0079c1); }
    .zl-help-trigger {
      margin-left: auto;
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 50%;
      cursor: help; color: var(--gray-700);
      background: transparent; border: none; padding: 0;
      transition: background-color 120ms ease;
    }
    .zl-help-trigger:hover, .zl-help-trigger:focus-visible {
      background: var(--gray-200);
    }
    .zl-help-trigger:focus-visible {
      outline: 2px solid var(--primary, #0079c1); outline-offset: 2px;
    }

    .zl-combo { position: relative; width: 100%; max-width: 480px; }
    .zl-search-shell {
      position: relative;
      width: 100%;
      background: #ffffff;
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      overflow: hidden;
      transition: border-color 120ms ease, box-shadow 120ms ease;
    }
    .zl-search-shell:hover {
      border-color: rgba(0, 0, 0, 0.35);
    }
    .zl-search-shell:focus-within {
      border-color: var(--primary, #0079c1);
      box-shadow: 0 0 0 3px rgba(0, 131, 189, 0.15);
    }
    .zl-search-leading {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 38px;
      color: rgba(0, 0, 0, 0.45);
      pointer-events: none;
    }
    .zl-search-shell .jimu-input {
      flex: 1;
      min-width: 0;
      width: auto !important;
      padding: 0 !important;
      margin: 0 !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }
    .zl-search-shell .jimu-input input,
    .zl-search-shell input {
      width: 100% !important;
      height: 38px !important;
      line-height: 38px !important;
      padding: 0 !important;
      font-size: 14px !important;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      outline: none !important;
      border-radius: 0 !important;
      color: inherit !important;
    }
    .zl-search-shell input:focus,
    .zl-search-shell .jimu-input input:focus {
      box-shadow: none !important;
      outline: none !important;
      border: none !important;
    }
    .zl-search-trailing {
      flex-shrink: 0;
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 38px;
      margin-right: 4px;
      border: none; background: transparent;
      cursor: pointer; color: rgba(0, 0, 0, 0.4);
      transition: color 120ms ease;
    }
    .zl-search-trailing:hover, .zl-search-trailing:focus-visible {
      color: rgba(0, 0, 0, 0.65);
      background: transparent;
    }
    .zl-search-trailing:focus-visible {
      outline: 2px solid var(--primary, #0079c1); outline-offset: -2px;
    }

    .zl-listbox {
      position: absolute; top: 100%; left: 0; right: 0; z-index: 1000;
      max-height: 280px; overflow-y: auto;
      background: #ffffff;
      color: inherit;
      border: 1px solid rgba(0, 0, 0, 0.2);
      border-top: none;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      list-style: none; padding: 0; margin: -1px 0 0 0;
      animation: zl-fade-in 100ms ease-out;
    }
    @keyframes zl-fade-in { from { opacity: 0; } to { opacity: 1; } }
    .zl-suggestion {
      padding: 8px 10px; cursor: pointer; font-size: 14px; line-height: 1.4;
      display: flex; align-items: center; gap: 10px;
      transition: background-color 80ms ease;
    }
    .zl-suggestion .zl-sugg-icon { flex-shrink: 0; color: rgba(0, 0, 0, 0.45); }
    .zl-suggestion:hover,
    .zl-suggestion[aria-selected="true"] {
      background: rgba(0, 0, 0, 0.06);
    }
    .zl-suggestion[aria-selected="true"] .zl-sugg-icon { color: var(--primary); }
    .zl-suggestion-empty {
      padding: 8px 10px; font-style: italic;
      color: rgba(0, 0, 0, 0.6); font-size: 14px;
    }

    /* Action chip row (My location / Click map) */
    .zl-search-row {
      display: flex; align-items: stretch; gap: 8px; flex-wrap: wrap;
    }
    .zl-search-row .zl-combo {
      flex: 1 1 240px; min-width: 240px; max-width: 480px;
    }
    .zl-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: stretch; }
    .zl-action-chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 0 14px; font-size: 0.85rem;
      min-height: 38px;
      border: 1px solid var(--gray-300);
      background: transparent; border-radius: 999px;
      color: var(--primary, #0079c1); cursor: pointer;
      transition: background-color 120ms ease, border-color 120ms ease;
    }
    .zl-action-chip:hover, .zl-action-chip:focus-visible {
      background: var(--primary-100, #e9f3fa);
      border-color: var(--primary, #0079c1);
    }
    .zl-action-chip:focus-visible {
      outline: 2px solid var(--primary, #0079c1); outline-offset: 1px;
    }
    .zl-action-chip[aria-pressed="true"] {
      background: var(--primary);
      border-color: var(--primary);
      color: var(--white, #fff);
    }
    .zl-action-chip:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Click-mode banner */
    .zl-clickmode-banner {
      padding: 8px 12px; border-radius: 8px;
      background: var(--primary-100);
      border: 1px dashed var(--primary);
      font-size: 0.85rem; color: var(--primary);
      display: flex; align-items: center; gap: 8px;
    }

    /* Recent searches */
    .zl-recents { display: flex; flex-direction: column; gap: 6px; }
    .zl-recents-head {
      display: flex; align-items: center; gap: 8px;
      color: var(--gray-700);
    }
    .zl-recents-title {
      font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em;
      font-weight: 600; margin: 0; color: inherit;
    }
    .zl-recents-clear {
      margin-left: auto; background: transparent; border: 1px solid transparent;
      color: var(--gray-700);
      font-size: 0.75rem; cursor: pointer;
      padding: 6px 10px; border-radius: 4px;
      min-height: 28px;
    }
    .zl-recents-clear:hover, .zl-recents-clear:focus-visible {
      background: var(--gray-200);
    }
    .zl-recents-clear:focus-visible {
      outline: 2px solid var(--primary, #0079c1); outline-offset: 1px;
    }
    .zl-recents-list {
      display: flex; flex-direction: column; gap: 2px;
      list-style: none; padding: 0; margin: 0;
    }
    .zl-recents-list li { margin: 0; padding: 0; }
    .zl-recent-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 10px; border-radius: 6px;
      background: transparent; border: 1px solid transparent;
      cursor: pointer; text-align: left;
      font-size: 0.875rem; color: inherit;
      width: 100%; min-height: 32px;
      transition: background-color 100ms ease;
    }
    .zl-recent-item:hover, .zl-recent-item:focus-visible {
      background: var(--gray-100);
    }
    .zl-recent-item:focus-visible {
      outline: 2px solid var(--primary, #0079c1); outline-offset: 1px;
    }
    .zl-recent-item .zl-recent-icon { color: var(--gray-600); flex-shrink: 0; }
    .zl-recent-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Status row */
    .zl-status-row {
      display: flex; align-items: center; gap: 10px; min-height: 24px;
      color: var(--gray-700); font-size: 0.875rem;
    }
    .zl-spacer { flex: 1; }

    /* Result card with hero */
    .zl-result-card {
      border-radius: 10px;
      border: 1px solid var(--gray-300);
      background: var(--surface-1, #fff);
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      min-height: 340px;
      display: flex;
      flex-direction: column;
    }
    .zl-result-card .zl-result-body { flex: 1; }
    .zl-result-card:focus-visible {
      outline: 2px solid var(--primary); outline-offset: 2px;
    }

    /* Outside-area card — shown when an address geocodes but doesn't intersect any zone */
    .zl-outside-card {
      border-radius: 10px;
      border: 1px solid rgba(217, 119, 6, 0.35);
      background: rgba(254, 243, 199, 0.4);
      padding: 18px 20px;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      min-height: 340px;
    }
    .zl-outside-icon {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px; height: 40px;
      border-radius: 50%;
      background: rgba(217, 119, 6, 0.18);
      color: rgb(180, 83, 9);
    }
    .zl-outside-content { flex: 1; min-width: 0; }
    .zl-outside-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 6px 0;
      color: inherit;
      line-height: 1.3;
    }
    .zl-outside-message {
      font-size: 0.9rem;
      line-height: 1.5;
      margin: 0 0 12px 0;
      color: inherit;
    }
    .zl-outside-action {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      min-height: 32px;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid currentColor;
      background: transparent;
      border-radius: 999px;
      color: rgb(146, 64, 14);
      cursor: pointer;
      transition: background-color 120ms ease;
    }
    .zl-outside-action:hover, .zl-outside-action:focus-visible {
      background: rgba(217, 119, 6, 0.12);
    }
    .zl-outside-action:focus-visible {
      outline: 2px solid currentColor;
      outline-offset: 2px;
    }

    @media (forced-colors: active) {
      .zl-outside-card { border: 1px solid CanvasText; }
      .zl-outside-icon { background: Canvas; color: CanvasText; border: 1px solid CanvasText; }
    }

    /* Placeholder card — shown before any search to keep the widget height
       stable in iframe embeds and to give the empty state a branded feel.
       min-height is pinned to match the result/outside-area cards so the
       widget doesn't grow when results appear. */
    .zl-placeholder-card {
      border-radius: 10px;
      border: 1px dashed var(--gray-300, rgba(0, 0, 0, 0.18));
      background: var(--surface-1, #ffffff);
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 12px;
      min-height: 340px;
    }
    .zl-placeholder-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 56px; height: 56px;
      border-radius: 50%;
      background: rgba(0, 131, 189, 0.08);
      color: var(--primary, #0079c1);
    }
    .zl-placeholder-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
      color: var(--zl-heading, inherit);
      line-height: 1.2;
    }
    .zl-placeholder-message {
      font-size: 0.9rem;
      margin: 0;
      line-height: 1.5;
      color: var(--gray-700, inherit);
      max-width: 360px;
    }
    @media (forced-colors: active) {
      .zl-placeholder-card { border: 1px solid CanvasText; }
      .zl-placeholder-icon { background: Canvas; border: 1px solid CanvasText; color: CanvasText; }
    }

    .zl-hero {
      padding: 14px 16px;
      background: ${heroBadgeBg};
      border-left: 4px solid ${heroBadgeBorder};
      color: ${heroTextColor};
    }
    .zl-hero-title {
      font-size: 1.35rem; font-weight: 700; line-height: 1.15; margin: 0;
      letter-spacing: -0.01em; color: inherit;
    }
    .zl-hero-subtitle {
      font-size: 0.95rem; font-weight: 500; margin-top: 4px;
      color: inherit;
    }

    .zl-result-toolbar {
      display: flex; align-items: center; justify-content: flex-end;
      gap: 6px; padding: 8px 12px;
      border-bottom: 1px solid var(--gray-200);
      background: var(--surface-1);
    }
    .zl-toolbar-btn {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 6px 12px; font-size: 0.8rem;
      border: 1px solid transparent;
      background: transparent; border-radius: 4px;
      color: var(--gray-700);
      cursor: pointer;
      min-height: 32px;
      transition: background-color 100ms ease;
    }
    .zl-toolbar-btn:hover, .zl-toolbar-btn:focus-visible {
      background: var(--gray-100);
      color: inherit;
    }
    .zl-toolbar-btn:focus-visible {
      outline: 2px solid var(--primary); outline-offset: 1px;
    }

    .zl-result-body {
      padding: 16px;
    }
    .zl-result-body > :first-child { margin-top: 0; }
    .zl-result-body > :last-child { margin-bottom: 0; }

    .zl-share-feedback {
      font-size: 0.8rem; color: var(--primary);
      display: inline-flex; align-items: center; gap: 4px;
    }

    /* Share menu (popover with copy link, email, sms, native share) */
    .zl-share-menu {
      position: relative;
      display: inline-block;
    }
    .zl-share-popover {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      z-index: 1100;
      min-width: 200px;
      background: var(--surface-1, #ffffff);
      border: 1px solid rgba(0, 0, 0, 0.12);
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.04);
      padding: 4px;
      animation: zl-fade-in 100ms ease-out;
    }
    .zl-share-menuitem {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 8px 10px;
      font-size: 0.9rem;
      text-align: left;
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      color: inherit;
      min-height: 36px;
      transition: background-color 80ms ease;
    }
    .zl-share-menuitem:hover,
    .zl-share-menuitem:focus-visible {
      background: var(--gray-100, rgba(0, 0, 0, 0.05));
    }
    .zl-share-menuitem:focus-visible {
      outline: 2px solid var(--primary, #0079c1);
      outline-offset: -2px;
    }
    .zl-share-menuitem .zl-share-icon {
      flex-shrink: 0;
      color: var(--gray-700, rgba(0, 0, 0, 0.6));
    }

    @media (forced-colors: active) {
      .zl-share-popover { border: 1px solid CanvasText; }
      .zl-share-menuitem:hover, .zl-share-menuitem:focus-visible {
        background: Highlight; color: HighlightText;
      }
    }

    .sr-only {
      position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
      overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
    }

    /* Respect users who request reduced motion (WCAG 2.3.3) */
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
        scroll-behavior: auto !important;
      }
    }

    /* Windows High Contrast / forced-colors mode (WCAG 1.4.11) */
    @media (forced-colors: active) {
      .zl-help-trigger:focus-visible,
      .zl-search-trailing:focus-visible,
      .zl-action-chip:focus-visible,
      .zl-recents-clear:focus-visible,
      .zl-recent-item:focus-visible,
      .zl-toolbar-btn:focus-visible,
      .zl-result-card:focus-visible {
        outline: 2px solid CanvasText;
        outline-offset: 2px;
      }
      .zl-action-chip[aria-pressed="true"] {
        background: Highlight;
        color: HighlightText;
        border-color: Highlight;
      }
      .zl-suggestion[aria-selected="true"] {
        background: Highlight;
        color: HighlightText;
        forced-color-adjust: none;
      }
      .zl-result-card { border-color: CanvasText; }
      .zl-clickmode-banner { border-style: solid; }
    }

    /* Print: hide everything except the result card */
    @media print {
      .zl-printing > :not(.zl-result-card) { display: none !important; }
      .zl-result-card { box-shadow: none; border: 1px solid #999; }
      .zl-result-toolbar { display: none !important; }
    }
  `

  const useDs = useDataSources?.[0]
  const mapWidgetId = useMapWidgetIds?.[0]
  const showRecents = config.enableRecentSearches && !address && !resultHtml && !error && recents.length > 0
  const armed = clickMode === 'armed'

  return (
    <div
      className={`widget-zone-lookup jimu-widget${config.iframeMode ? ' zl-iframe-mode' : ''}`}
      css={styles}
      ref={containerRef}
      aria-busy={loading}
      style={brandRootStyle as any}
    >
      {mapWidgetId && (
        <JimuMapViewComponent
          useMapWidgetId={mapWidgetId}
          onActiveViewChange={onActiveViewChange}
        />
      )}

      {useDs && (
        <DataSourceComponent
          useDataSource={useDs}
          widgetId={id}
          onDataSourceCreated={onDsCreated}
        />
      )}

      {/* Header: banner with optional title, or plain intro */}
      {config.headerStyle === 'banner' && (config.headerTitle || config.intro) ? (
        <div className="zl-banner" role="banner">
          {config.headerTitle && (
            <h2 className="zl-banner-title">{config.headerTitle}</h2>
          )}
          {config.intro && (
            <div className="zl-intro" dangerouslySetInnerHTML={{ __html: config.intro }} />
          )}
        </div>
      ) : (
        config.intro && (
          <div className="zl-intro" dangerouslySetInnerHTML={{ __html: config.intro }} />
        )
      )}

      {/* Search section: label on top, search bar + action chips on one row */}
      <div>
        <div className="zl-section-head">
          <PinSvg size={16} className="zl-pin-icon" />
          <label className="zl-section-title" htmlFor={inputId}>{config.addressLabel}</label>
          {config.addressTooltip && (
            <Tooltip title={config.addressTooltip} placement="top">
              <button
                type="button"
                className="zl-help-trigger"
                aria-label={`${defaultMessages.helpIconLabel}: ${config.addressTooltip}`}
              >
                <HelpSvg size={14} />
              </button>
            </Tooltip>
          )}
        </div>

        <div className="zl-search-row">
          <div
            className="zl-combo"
            role="combobox"
            aria-haspopup="listbox"
            aria-owns={listboxId}
            aria-expanded={showSuggestions}
          >
            <div className="zl-search-shell">
              <span className="zl-search-leading" aria-hidden="true">
                <SearchSvg size={16} />
              </span>
              <TextInput
                id={inputId}
                ref={inputRef as any}
                type="text"
                value={address}
                onChange={(e: any) => onAddressChange(e.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true) }}
                placeholder={config.addressPlaceholder}
                disabled={loading}
                autoComplete="off"
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-activedescendant={activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined}
                aria-required="true"
              />
              {address && !loading && (
                <Tooltip title={config.resetTooltip} placement="top">
                  <button
                    type="button"
                    className="zl-search-trailing"
                    onClick={handleReset}
                    aria-label={config.resetLabel}
                  >
                    <CloseSvg size={14} />
                  </button>
                </Tooltip>
              )}
            </div>

            {showSuggestions && (
              <ul
                id={listboxId}
                className="zl-listbox"
                role="listbox"
                aria-label={defaultMessages.suggestionsLabel}
              >
                {suggestions.length === 0 && (
                  <li className="zl-suggestion-empty" role="option" aria-disabled="true">
                    {defaultMessages.noSuggestions}
                  </li>
                )}
                {suggestions.map((s, idx) => (
                  <li
                    key={`${s.magicKey}-${idx}`}
                    id={`${listboxId}-opt-${idx}`}
                    className="zl-suggestion"
                    role="option"
                    aria-selected={idx === activeIndex}
                    onMouseDown={(e) => { e.preventDefault(); void selectSuggestion(s) }}
                  >
                    <PinSvg size={14} className="zl-sugg-icon" />
                    <span>{s.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(config.enableMyLocation || config.enableMapClick) && (
            <div className="zl-actions">
              {config.enableMyLocation && (
                <Tooltip title={defaultMessages.useMyLocationTooltip} placement="top">
                  <button
                    type="button"
                    className="zl-action-chip"
                    onClick={handleMyLocation}
                    disabled={loading || !useDs}
                  >
                    <CrosshairSvg size={14} />
                    <span>{defaultMessages.useMyLocation}</span>
                  </button>
                </Tooltip>
              )}
              {config.enableMapClick && (
                <Tooltip
                  title={mapWidgetId ? defaultMessages.clickMapTooltip : defaultMessages.clickMapNeedsMap}
                  placement="top"
                >
                  <button
                    type="button"
                    className="zl-action-chip"
                    onClick={toggleClickMode}
                    disabled={loading || !useDs || !mapWidgetId}
                    aria-pressed={armed}
                  >
                    <MapClickSvg size={14} />
                    <span>{defaultMessages.clickMap}</span>
                  </button>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>

      {armed && (
        <div className="zl-clickmode-banner" role="status">
          <MapClickSvg size={14} />
          <span>{defaultMessages.clickMapActive}</span>
        </div>
      )}

      {/* Recent searches (shown when input empty and no result yet) */}
      {showRecents && (
        <section className="zl-recents" aria-labelledby={`${id}-recents-title`}>
          <div className="zl-recents-head">
            <HistorySvg size={12} />
            <h3 id={`${id}-recents-title`} className="zl-recents-title">
              {defaultMessages.recentSearches}
            </h3>
            <button
              type="button"
              className="zl-recents-clear"
              onClick={clearRecents}
              aria-label={`${defaultMessages.clearRecent} ${defaultMessages.recentSearches.toLowerCase()}`}
            >
              {defaultMessages.clearRecent}
            </button>
          </div>
          <ul className="zl-recents-list">
            {recents.map(r => (
              <li key={`${r.address}-${r.ts}`}>
                <button
                  type="button"
                  className="zl-recent-item"
                  onClick={() => void runRecent(r)}
                >
                  <HistorySvg size={14} className="zl-recent-icon" />
                  <span className="zl-recent-text">{r.address}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Status row: only the Clear button. Loading state lives inside the placeholder card. */}
      {config.showResetButton && address && !loading && (
        <div className="zl-status-row">
          <span className="zl-spacer" />
          <Button type="tertiary" size="sm" onClick={handleReset}>
            {config.resetLabel}
          </Button>
        </div>
      )}

      <div role="status" aria-live="polite" className="sr-only">{statusMsg}</div>

      {outsideArea && (
        <div className="zl-outside-card" role="alert">
          <div className="zl-outside-icon" aria-hidden="true">
            <MapPinOffSvg size={22} />
          </div>
          <div className="zl-outside-content">
            <h2 className="zl-outside-title">{config.outsideAreaHeading || defaultMessages.outsideAreaHeading}</h2>
            <p className="zl-outside-message">{config.outsideAreaMessage}</p>
            <button
              type="button"
              className="zl-outside-action"
              onClick={handleReset}
            >
              {config.tryAnotherAddressLabel || defaultMessages.tryAnotherAddress}
            </button>
          </div>
        </div>
      )}

      {error && (
        <Alert form="basic" type="warning" text={error} withIcon closable={false} />
      )}

      {/* Pre-search & loading placeholder: same card stays visible from idle through loading
          and gets swapped for the result card only when the result lands. Keeps widget
          height stable in iframe embeds with no disappear/reappear flash. */}
      {!resultHtml && !outsideArea && !error && (
        <div className="zl-placeholder-card" role={loading ? 'status' : 'region'} aria-label={defaultMessages.placeholderHeading} aria-live={loading ? 'polite' : undefined}>
          {loading ? (
            <>
              <div className="zl-placeholder-icon zl-placeholder-icon-loading" aria-hidden="true">
                <Loading type={LoadingType.Donut} width={28} height={28} />
              </div>
              <h3 className="zl-placeholder-title">{loadingMessage}</h3>
            </>
          ) : (
            <>
              <div className="zl-placeholder-icon" aria-hidden="true">
                <PinSvg size={28} />
              </div>
              <h3 className="zl-placeholder-title">
                {config.placeholderHeading || defaultMessages.placeholderHeading}
              </h3>
              <p className="zl-placeholder-message">
                {config.placeholderMessage || defaultMessages.placeholderMessage}
              </p>
            </>
          )}
        </div>
      )}

      {/* Result card with optional hero header + toolbar + body */}
      {resultHtml && (
        <div
          id={resultsId}
          ref={resultsRef}
          className="zl-result-card"
          tabIndex={-1}
          role="region"
          aria-label={defaultMessages.resultsHeading}
        >
          {showHero && (
            <div className="zl-hero">
              {heroTitleVal && <h2 className="zl-hero-title">{heroTitleVal}</h2>}
              {heroSubtitleVal && <div className="zl-hero-subtitle">{heroSubtitleVal}</div>}
            </div>
          )}

          {(config.enableShare || config.enablePrint) && (
            <div className="zl-result-toolbar" role="toolbar" aria-label={defaultMessages.resultActionsLabel}>
              <span className="zl-share-feedback" role="status" aria-live="polite">
                {shareFeedback && (
                  <>
                    <CheckSvg size={12} /> {shareFeedback}
                  </>
                )}
              </span>
              {config.enableShare && (
                <div className="zl-share-menu">
                  <Tooltip title={defaultMessages.shareTooltip} placement="top">
                    <button
                      type="button"
                      className="zl-toolbar-btn"
                      onClick={handleShare}
                      ref={shareTriggerRef}
                      aria-haspopup="menu"
                      aria-expanded={shareMenuOpen}
                    >
                      <ShareSvg size={14} />
                      <span>{defaultMessages.share}</span>
                    </button>
                  </Tooltip>
                  {shareMenuOpen && (
                    <div
                      className="zl-share-popover"
                      role="menu"
                      aria-label={defaultMessages.shareMenuLabel}
                      ref={shareMenuRef}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="zl-share-menuitem"
                        onClick={handleCopyLink}
                      >
                        <LinkSvg size={16} className="zl-share-icon" />
                        <span>{defaultMessages.shareCopyLink}</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="zl-share-menuitem"
                        onClick={handleEmailShare}
                      >
                        <MailSvg size={16} className="zl-share-icon" />
                        <span>{defaultMessages.shareEmail}</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="zl-share-menuitem"
                        onClick={handleSmsShare}
                      >
                        <MessageSvg size={16} className="zl-share-icon" />
                        <span>{defaultMessages.shareSms}</span>
                      </button>
                      {hasNativeShare && (
                        <button
                          type="button"
                          role="menuitem"
                          className="zl-share-menuitem"
                          onClick={handleNativeShare}
                        >
                          <ShareSvg size={16} className="zl-share-icon" />
                          <span>{defaultMessages.shareMore}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {config.enablePrint && (
                <Tooltip title={defaultMessages.printTooltip} placement="top">
                  <button type="button" className="zl-toolbar-btn" onClick={handlePrint}>
                    <PrintSvg size={14} />
                    <span>{defaultMessages.print}</span>
                  </button>
                </Tooltip>
              )}
            </div>
          )}

          <div className="zl-result-body" dangerouslySetInnerHTML={{ __html: resultHtml }} />
        </div>
      )}

      {!useDs && (
        <Alert form="basic" type="info" text={defaultMessages.noLayerConfigured} withIcon closable={false} />
      )}
      {!mapWidgetId && (
        <Alert form="basic" type="info" text={defaultMessages.noMapConfigured} withIcon closable={false} />
      )}
    </div>
  )
}

export default Widget
