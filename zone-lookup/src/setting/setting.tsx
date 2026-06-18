/** @jsx jsx */
/** @jsxFrag React.Fragment */
import {
    React,
    jsx,
    css,
    Immutable,
    type UseDataSource,
    type IMUseDataSource,
    AllDataSourceTypes,
    DataSourceManager,
    type DataSource,
    type FeatureLayerDataSource
} from 'jimu-core'
import { type AllWidgetSettingProps } from 'jimu-for-builder'
import {
    MapWidgetSelector,
    SettingSection,
    SettingRow
} from 'jimu-ui/advanced/setting-components'
import { DataSourceSelector } from 'jimu-ui/advanced/data-source-selector'
import {
    Button,
    TextInput,
    TextArea,
    NumericInput,
    Select,
    Option,
    Switch,
    Tooltip,
    Icon,
    Alert
} from 'jimu-ui'
import { ColorPicker } from 'jimu-ui/basic/color-picker'
import { type IMConfig, type ColorRGBA, type SearchConstraint } from '../config'
import defaultMessages from './translations/default'

// jimu-ui ships an info icon SVG we can reuse for help affordances.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const infoOutlinedIcon = require('jimu-icons/svg/outlined/suggested/info.svg')

const { useState, useEffect, useCallback, useRef } = React

// ---------- Color helpers (RGBA <-> CSS string) ----------

const arrayToRgba = (arr: any): string => {
    return `rgba(${arr?.[0] ?? 0}, ${arr?.[1] ?? 0}, ${arr?.[2] ?? 0}, ${arr?.[3] ?? 1})`
}

const rgbaStringToArray = (str: string): ColorRGBA => {
    if (!str) return [0, 0, 0, 1]
    const rgbaMatch = str.match(/rgba?\(([^)]+)\)/i)
    if (rgbaMatch) {
        const parts = rgbaMatch[1].split(',').map(s => parseFloat(s.trim()))
        return [
            Math.round(parts[0] || 0),
            Math.round(parts[1] || 0),
            Math.round(parts[2] || 0),
            parts[3] !== undefined ? parts[3] : 1
        ]
    }
    const h = str.replace('#', '')
    if (h.length === 6 || h.length === 8) {
        return [
            parseInt(h.substring(0, 2), 16),
            parseInt(h.substring(2, 4), 16),
            parseInt(h.substring(4, 6), 16),
            h.length === 8 ? parseInt(h.substring(6, 8), 16) / 255 : 1
        ]
    }
    return [0, 0, 0, 1]
}

// ---------- XML import/export ----------
// A flat XML schema where each child element corresponds to one Config key.
// Strings that may contain markup (intro, resultTemplate) round-trip via CDATA.
// useMapWidgetIds and useDataSources are intentionally excluded — they reference
// app-specific IDs that would be meaningless in a different app.

type SerializableFieldType = 'string' | 'number' | 'boolean' | 'rgba'
const CONFIG_SCHEMA: Record<string, SerializableFieldType> = {
    geocodeUrl: 'string',
    constrainSearch: 'string',
    zoomLevel: 'number',
    highlightFillColor: 'rgba',
    highlightOutlineColor: 'rgba',
    highlightOutlineWidth: 'number',
    addressLabel: 'string',
    addressPlaceholder: 'string',
    addressTooltip: 'string',
    submitLabel: 'string',
    submitTooltip: 'string',
    resetLabel: 'string',
    resetTooltip: 'string',
    showResetButton: 'boolean',
    intro: 'string',
    resultTemplate: 'string',
    noAddressMessage: 'string',
    outsideAreaMessage: 'string',
    errorMessage: 'string',
    heroTitleField: 'string',
    heroSubtitleField: 'string',
    enableMyLocation: 'boolean',
    enableMapClick: 'boolean',
    enableRecentSearches: 'boolean',
    enableShare: 'boolean',
    enablePrint: 'boolean',
    maxRecentSearches: 'number',
    brandPrimaryColor: 'rgba',
    brandHeadingColor: 'rgba',
    headerTitle: 'string',
    headerStyle: 'string',
    placeholderHeading: 'string',
    placeholderMessage: 'string',
    outsideAreaHeading: 'string',
    tryAnotherAddressLabel: 'string',
    shareEmailSubject: 'string',
    iframeMode: 'boolean'
}

const escapeXml = (s: string): string => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')

const wrapCdata = (s: string): string => `<![CDATA[${String(s ?? '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`

const serializeValue = (value: any, type: SerializableFieldType): string => {
    switch (type) {
        case 'string': {
            const s = value == null ? '' : String(value)
            // Use CDATA if the value contains XML metacharacters; cheaper to read in raw editors.
            return /[<>&]/.test(s) ? wrapCdata(s) : escapeXml(s)
        }
        case 'number': return String(Number(value) || 0)
        case 'boolean': return value ? 'true' : 'false'
        case 'rgba': {
            const a = value as any
            return `${a?.[0] ?? 0},${a?.[1] ?? 0},${a?.[2] ?? 0},${a?.[3] ?? 1}`
        }
    }
}

const deserializeValue = (text: string, type: SerializableFieldType): any => {
    switch (type) {
        case 'string': return text ?? ''
        case 'number': {
            const n = parseFloat(text)
            return isFinite(n) ? n : 0
        }
        case 'boolean': return text === 'true' || text === '1'
        case 'rgba': {
            const parts = String(text).split(',').map(s => parseFloat(s.trim()))
            return [
                Math.round(parts[0] || 0),
                Math.round(parts[1] || 0),
                Math.round(parts[2] || 0),
                parts[3] !== undefined && isFinite(parts[3]) ? parts[3] : 1
            ]
        }
    }
}

const buildConfigXml = (config: any): string => {
    const lines: string[] = []
    lines.push('<?xml version="1.0" encoding="UTF-8"?>')
    lines.push(`<ZoneLookupConfig version="1.0" exportedAt="${new Date().toISOString()}">`)
    for (const key of Object.keys(CONFIG_SCHEMA)) {
        const type = CONFIG_SCHEMA[key]
        const raw = config?.[key]
        if (raw === undefined) continue
        const serialized = serializeValue(raw, type)
        lines.push(`  <${key}>${serialized}</${key}>`)
    }
    lines.push('</ZoneLookupConfig>')
    return lines.join('\n')
}

const parseConfigXml = (xmlText: string): { updates: Record<string, any>, count: number } | null => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlText, 'application/xml')
    if (doc.getElementsByTagName('parsererror').length > 0) return null

    const root = doc.documentElement
    if (!root || root.nodeName !== 'ZoneLookupConfig') return null

    const updates: Record<string, any> = {}
    let count = 0
    for (const key of Object.keys(CONFIG_SCHEMA)) {
        const el = root.getElementsByTagName(key)[0]
        if (!el) continue
        const text = el.textContent ?? ''
        updates[key] = deserializeValue(text, CONFIG_SCHEMA[key])
        count++
    }
    return { updates, count }
}

const triggerDownload = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---------- Component ----------

const Setting = (props: AllWidgetSettingProps<IMConfig>) => {
    const { config, onSettingChange, id, useDataSources, useMapWidgetIds } = props

    const [fields, setFields] = useState<any[]>([])
    const [fieldsLoading, setFieldsLoading] = useState(false)
    const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    // ---- Load fields from the configured zone layer ----
    useEffect(() => {
        const ds = useDataSources?.[0]
        if (!ds) { setFields([]); return }
        let cancelled = false
        setFieldsLoading(true)
        DataSourceManager.getInstance()
            .createDataSourceByUseDataSource(ds)
            .then((dataSource: DataSource) => {
                if (cancelled) return
                const fl = dataSource as FeatureLayerDataSource
                const schema = fl.getSchema()
                const fieldList: any[] = schema?.fields
                    ? Object.keys(schema.fields).map(k => (schema.fields as any)[k])
                    : []
                setFields(fieldList)
            })
            .catch(() => { if (!cancelled) setFields([]) })
            .finally(() => { if (!cancelled) setFieldsLoading(false) })
        return () => { cancelled = true }
    }, [useDataSources])

    // ---- Update helpers ----

    const updateConfig = useCallback(<K extends keyof IMConfig>(key: K, value: any) => {
        onSettingChange({ id, config: config.set(key as any, value) })
    }, [config, id, onSettingChange])

    const onMapWidgetSelected = useCallback((mapWidgetIds: string[]) => {
        onSettingChange({ id, useMapWidgetIds: mapWidgetIds })
    }, [id, onSettingChange])

    const onDataSourceChange = useCallback((newDs: UseDataSource[] | IMUseDataSource[]) => {
        const arr: any = newDs
        onSettingChange({ id, useDataSources: arr })
    }, [id, onSettingChange])

    const onColorChange = useCallback((key: 'highlightFillColor' | 'highlightOutlineColor' | 'brandPrimaryColor' | 'brandHeadingColor', value: string) => {
        updateConfig(key, rgbaStringToArray(value))
    }, [updateConfig])

    const onColorClear = useCallback((key: 'brandPrimaryColor' | 'brandHeadingColor') => {
        updateConfig(key, undefined)
    }, [updateConfig])

    const appendToken = useCallback((fieldName: string) => {
        const token = `{${fieldName}}`
        updateConfig('resultTemplate', (config.resultTemplate || '') + token)
    }, [config.resultTemplate, updateConfig])

    // ---- Import / Export handlers ----

    const handleExport = useCallback(() => {
        const xml = buildConfigXml(config)
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
        triggerDownload(`zone-lookup-config-${stamp}.xml`, xml, 'application/xml')
    }, [config])

    const handleImportClick = useCallback(() => {
        setImportStatus(null)
        fileInputRef.current?.click()
    }, [])

    const handleFileSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        // Reset the input so the same file can be picked again later
        if (fileInputRef.current) fileInputRef.current.value = ''

        const reader = new FileReader()
        reader.onerror = () => setImportStatus({ type: 'error', text: defaultMessages.importErrorParse })
        reader.onload = () => {
            const text = String(reader.result || '')
            const parsed = parseConfigXml(text)
            if (!parsed) {
                setImportStatus({ type: 'error', text: defaultMessages.importErrorParse })
                return
            }
            if (parsed.count === 0) {
                setImportStatus({ type: 'error', text: defaultMessages.importErrorEmpty })
                return
            }
            onSettingChange({ id, config: (config as any).merge(parsed.updates) })
            setImportStatus({ type: 'success', text: `${defaultMessages.importSuccess} (${parsed.count})` })
            window.setTimeout(() => setImportStatus(null), 4000)
        }
        reader.readAsText(file)
    }, [config, id, onSettingChange])

    // ---- Theme via CSS variables ----
    // EB's stylesheet exposes --primary, --surface-1, --gray-100..900, etc. and
    // re-binds them per active theme.

    const styles = css`
    /* Hint text under SettingRows — styled per EB conventions */
    .hint {
      color: var(--gray-700);
      font-size: 0.8125rem;
      line-height: 1.35;
      padding: 2px 0 8px;
      display: flex;
      gap: 6px;
      align-items: flex-start;
    }
    .hint .jimu-icon {
      flex-shrink: 0;
      margin-top: 2px;
      color: var(--gray-600);
    }

    /* Token chip area — theme-aware container */
    .zl-token-panel {
      width: 100%;
      border: 1px solid var(--gray-400);
      border-radius: 4px;
      background: var(--surface-1, var(--gray-100));
      padding: 8px;
    }
    .zl-token-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      max-height: 180px;
      overflow-y: auto;
    }
    .zl-token-empty {
      color: var(--gray-700);
      font-size: 0.8125rem;
      font-style: italic;
      padding: 4px 0;
    }
    .zl-token-btn code {
      font-family: monospace;
      font-size: 0.8125rem;
    }

    /* Textareas — force taller defaults; users can still resize via drag handle */
    textarea.zl-textarea-template,
    .zl-textarea-template textarea {
      width: 100%;
      height: 320px;
      min-height: 320px;
      font-family: monospace;
      font-size: 0.85rem;
    }
    textarea.zl-textarea-intro,
    .zl-textarea-intro textarea {
      width: 100%;
      height: 200px;
      min-height: 200px;
      font-family: monospace;
      font-size: 0.85rem;
    }
  `

    /** Small helper — renders a hint line under a SettingRow with an info icon. */
    const Hint = ({ children }: { children: React.ReactNode }) => (
        <div className="hint">
            <Icon icon={infoOutlinedIcon} size={12} className="jimu-icon" />
            <span>{children}</span>
        </div>
    )

    return (
        <div className="widget-setting-zone-lookup" css={styles}>

            {/* ---- MAP ---- */}
            <SettingSection title={defaultMessages.mapSection}>
                <SettingRow flow="wrap" label={defaultMessages.selectMap}>
                    <MapWidgetSelector
                        useMapWidgetIds={useMapWidgetIds}
                        onSelect={onMapWidgetSelected}
                    />
                </SettingRow>
                <Hint>{defaultMessages.selectMapHint}</Hint>
            </SettingSection>

            {/* ---- ZONE LAYER ---- */}
            <SettingSection title={defaultMessages.dataSection}>
                <SettingRow flow="wrap" label={defaultMessages.selectLayer}>
                    <DataSourceSelector
                        types={Immutable([AllDataSourceTypes.FeatureLayer])}
                        useDataSources={useDataSources}
                        mustUseDataSource
                        onChange={onDataSourceChange}
                        widgetId={id}
                    />
                </SettingRow>
                <Hint>{defaultMessages.selectLayerHint}</Hint>
            </SettingSection>

            {/* ---- GEOCODER ---- */}
            <SettingSection title={defaultMessages.geocoderSection}>
                <SettingRow flow="wrap" label={defaultMessages.geocodeUrl}>
                    <TextInput
                        value={config.geocodeUrl}
                        onChange={(e: any) => updateConfig('geocodeUrl', e.target.value)}
                        placeholder="https://.../GeocodeServer"
                        className="w-100"
                    />
                </SettingRow>
                <Hint>{defaultMessages.geocodeUrlHint}</Hint>

                <SettingRow flow="wrap" label={defaultMessages.constrainSearch}>
                    <Select
                        value={config.constrainSearch}
                        onChange={(e: any) => updateConfig('constrainSearch', e.target.value as SearchConstraint)}
                        className="w-100"
                    >
                        <Option value="none">{defaultMessages.constrainNone}</Option>
                        <Option value="mapExtent">{defaultMessages.constrainMap}</Option>
                        <Option value="layerExtent">{defaultMessages.constrainLayer}</Option>
                    </Select>
                </SettingRow>
            </SettingSection>

            {/* ---- TEMPLATE ---- */}
            <SettingSection title={defaultMessages.templateSection}>
                <SettingRow flow="wrap" label={defaultMessages.introLabel}>
                    <TextArea
                        className="zl-textarea-intro"
                        value={config.intro}
                        onChange={(e: any) => updateConfig('intro', e.target.value)}
                        placeholder="<p>Enter your address to see your zone.</p>"
                    />
                </SettingRow>
                <Hint>{defaultMessages.introHint}</Hint>

                <SettingRow flow="wrap" label={defaultMessages.resultTemplate}>
                    <TextArea
                        className="zl-textarea-template"
                        value={config.resultTemplate}
                        onChange={(e: any) => updateConfig('resultTemplate', e.target.value)}
                        placeholder="<h3>Zone Info</h3><p><strong>Zone:</strong> {ZONE_NAME}</p>"
                        aria-describedby="zl-template-help"
                    />
                </SettingRow>
                <Hint>
                    <span id="zl-template-help">{defaultMessages.resultTemplateHint}</span>
                </Hint>

                <SettingRow flow="wrap" label={defaultMessages.availableFields}>
                    <div className="zl-token-panel">
                        {fieldsLoading && <div className="zl-token-empty">{defaultMessages.fieldsLoading}</div>}
                        {!fieldsLoading && fields.length === 0 && (
                            <div className="zl-token-empty">{defaultMessages.availableFieldsEmpty}</div>
                        )}
                        {!fieldsLoading && fields.length > 0 && (
                            <div className="zl-token-list" role="list">
                                {fields.map((f: any) => (
                                    <Tooltip
                                        key={f.name}
                                        title={`${f.alias || f.name} (${f.type}) — click to insert`}
                                        placement="top"
                                    >
                                        <Button
                                            size="sm"
                                            type="tertiary"
                                            className="zl-token-btn"
                                            role="listitem"
                                            onClick={() => appendToken(f.name)}
                                            aria-label={`Insert token for field ${f.alias || f.name}`}
                                        >
                                            <code>{`{${f.name}}`}</code>
                                        </Button>
                                    </Tooltip>
                                ))}
                            </div>
                        )}
                    </div>
                </SettingRow>
            </SettingSection>

            {/* ---- LABELS & MESSAGES ---- */}
            <SettingSection title={defaultMessages.textSection}>
                <SettingRow flow="wrap" label={defaultMessages.addressLabel}>
                    <TextInput
                        value={config.addressLabel}
                        onChange={(e: any) => updateConfig('addressLabel', e.target.value)}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.addressPlaceholder}>
                    <TextInput
                        value={config.addressPlaceholder}
                        onChange={(e: any) => updateConfig('addressPlaceholder', e.target.value)}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.addressTooltip}>
                    <TextInput
                        value={config.addressTooltip}
                        onChange={(e: any) => updateConfig('addressTooltip', e.target.value)}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.submitLabel}>
                    <TextInput
                        value={config.submitLabel}
                        onChange={(e: any) => updateConfig('submitLabel', e.target.value)}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.submitTooltip}>
                    <TextInput
                        value={config.submitTooltip}
                        onChange={(e: any) => updateConfig('submitTooltip', e.target.value)}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow label={defaultMessages.showResetButton}>
                    <Switch
                        checked={config.showResetButton}
                        onChange={(e: any) => updateConfig('showResetButton', e.target.checked)}
                        aria-label={defaultMessages.showResetButton}
                    />
                </SettingRow>
                <SettingRow label={defaultMessages.iframeMode}>
                    <Switch
                        checked={!!(config as any).iframeMode}
                        onChange={(e: any) => updateConfig('iframeMode', e.target.checked)}
                        aria-label={defaultMessages.iframeMode}
                    />
                </SettingRow>
                {(config as any).iframeMode && (
                    <SettingRow flow="wrap">
                        <small className="text-muted">{defaultMessages.iframeModeHint}</small>
                    </SettingRow>
                )}
                {config.showResetButton && (
                    <>
                        <SettingRow flow="wrap" label={defaultMessages.resetLabel}>
                            <TextInput
                                value={config.resetLabel}
                                onChange={(e: any) => updateConfig('resetLabel', e.target.value)}
                                className="w-100"
                            />
                        </SettingRow>
                        <SettingRow flow="wrap" label={defaultMessages.resetTooltip}>
                            <TextInput
                                value={config.resetTooltip}
                                onChange={(e: any) => updateConfig('resetTooltip', e.target.value)}
                                className="w-100"
                            />
                        </SettingRow>
                    </>
                )}
                <SettingRow flow="wrap" label={defaultMessages.noAddressMessage}>
                    <TextInput
                        value={config.noAddressMessage}
                        onChange={(e: any) => updateConfig('noAddressMessage', e.target.value)}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.outsideAreaMessage}>
                    <TextInput
                        value={config.outsideAreaMessage}
                        onChange={(e: any) => updateConfig('outsideAreaMessage', e.target.value)}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.errorMessage}>
                    <TextInput
                        value={config.errorMessage}
                        onChange={(e: any) => updateConfig('errorMessage', e.target.value)}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.placeholderHeading}>
                    <TextInput
                        value={(config as any).placeholderHeading || ''}
                        onChange={(e: any) => updateConfig('placeholderHeading', e.target.value)}
                        placeholder={defaultMessages.placeholderHeadingPlaceholder}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.placeholderMessage}>
                    <TextInput
                        value={(config as any).placeholderMessage || ''}
                        onChange={(e: any) => updateConfig('placeholderMessage', e.target.value)}
                        placeholder={defaultMessages.placeholderMessagePlaceholder}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.outsideAreaHeading}>
                    <TextInput
                        value={(config as any).outsideAreaHeading || ''}
                        onChange={(e: any) => updateConfig('outsideAreaHeading', e.target.value)}
                        placeholder={defaultMessages.outsideAreaHeadingPlaceholder}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.tryAnotherAddressLabel}>
                    <TextInput
                        value={(config as any).tryAnotherAddressLabel || ''}
                        onChange={(e: any) => updateConfig('tryAnotherAddressLabel', e.target.value)}
                        placeholder={defaultMessages.tryAnotherAddressLabelPlaceholder}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.shareEmailSubject}>
                    <TextInput
                        value={(config as any).shareEmailSubject || ''}
                        onChange={(e: any) => updateConfig('shareEmailSubject', e.target.value)}
                        placeholder={defaultMessages.shareEmailSubjectPlaceholder}
                        className="w-100"
                    />
                </SettingRow>
            </SettingSection>

            {/* ---- APPEARANCE ---- */}
            <SettingSection title={defaultMessages.appearanceSection}>
                <SettingRow flow="wrap" label={defaultMessages.zoomLevel}>
                    <NumericInput
                        value={config.zoomLevel}
                        min={0}
                        max={23}
                        step={1}
                        onChange={(value: number) => updateConfig('zoomLevel', value)}
                        className="w-100"
                    />
                </SettingRow>
                <SettingRow label={defaultMessages.highlightFill}>
                    <ColorPicker
                        color={arrayToRgba(config.highlightFillColor)}
                        onChange={(value: string) => onColorChange('highlightFillColor', value)}
                    />
                </SettingRow>
                <SettingRow label={defaultMessages.highlightOutline}>
                    <ColorPicker
                        color={arrayToRgba(config.highlightOutlineColor)}
                        onChange={(value: string) => onColorChange('highlightOutlineColor', value)}
                    />
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.highlightOutlineWidth}>
                    <NumericInput
                        value={config.highlightOutlineWidth}
                        min={0}
                        max={20}
                        step={0.5}
                        onChange={(value: number) => updateConfig('highlightOutlineWidth', value)}
                        className="w-100"
                    />
                </SettingRow>
            </SettingSection>

            {/* ---- BRAND COLORS (apply to the top UI / chrome) ---- */}
            <SettingSection title={defaultMessages.brandSection}>
                <div style={{ fontSize: 12, color: 'var(--gray-700)', padding: '0 0 8px 0' }}>
                    {defaultMessages.brandSectionHint}
                </div>
                <SettingRow label={defaultMessages.brandPrimaryColor}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ColorPicker
                            color={arrayToRgba(config.brandPrimaryColor as any)}
                            onChange={(value: string) => onColorChange('brandPrimaryColor', value)}
                        />
                        {config.brandPrimaryColor && (
                            <Button
                                type="tertiary"
                                size="sm"
                                onClick={() => onColorClear('brandPrimaryColor')}
                                aria-label={defaultMessages.brandColorClear}
                            >
                                {defaultMessages.brandColorClear}
                            </Button>
                        )}
                    </div>
                </SettingRow>
                <SettingRow label={defaultMessages.brandHeadingColor}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ColorPicker
                            color={arrayToRgba(config.brandHeadingColor as any)}
                            onChange={(value: string) => onColorChange('brandHeadingColor', value)}
                        />
                        {config.brandHeadingColor && (
                            <Button
                                type="tertiary"
                                size="sm"
                                onClick={() => onColorClear('brandHeadingColor')}
                                aria-label={defaultMessages.brandColorClear}
                            >
                                {defaultMessages.brandColorClear}
                            </Button>
                        )}
                    </div>
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.headerStyle}>
                    <Select
                        value={config.headerStyle || 'plain'}
                        onChange={(e: any) => updateConfig('headerStyle', (e.target.value || 'plain') as any)}
                        className="w-100"
                    >
                        <option value="plain">{defaultMessages.headerStylePlain}</option>
                        <option value="banner">{defaultMessages.headerStyleBanner}</option>
                    </Select>
                </SettingRow>
                {config.headerStyle === 'banner' && (
                    <SettingRow flow="wrap" label={defaultMessages.headerTitle}>
                        <TextInput
                            value={config.headerTitle || ''}
                            onChange={(e: any) => updateConfig('headerTitle', e.target.value)}
                            placeholder={defaultMessages.headerTitlePlaceholder}
                            className="w-100"
                        />
                    </SettingRow>
                )}
            </SettingSection>

            {/* ---- HERO ---- */}
            <SettingSection title={defaultMessages.heroSection}>
                <Hint>{defaultMessages.heroSectionHint}</Hint>
                <SettingRow flow="wrap" label={defaultMessages.heroTitleField}>
                    <Select
                        value={config.heroTitleField || ''}
                        onChange={(e: any) => updateConfig('heroTitleField', e.target.value || '')}
                        className="w-100"
                        disabled={fields.length === 0}
                    >
                        <Option value="">{defaultMessages.noField}</Option>
                        {fields.map((f: any) => (
                            <Option key={`title-${f.name}`} value={f.name}>
                                {f.alias || f.name}
                            </Option>
                        ))}
                    </Select>
                </SettingRow>
                <SettingRow flow="wrap" label={defaultMessages.heroSubtitleField}>
                    <Select
                        value={config.heroSubtitleField || ''}
                        onChange={(e: any) => updateConfig('heroSubtitleField', e.target.value || '')}
                        className="w-100"
                        disabled={fields.length === 0}
                    >
                        <Option value="">{defaultMessages.noField}</Option>
                        {fields.map((f: any) => (
                            <Option key={`sub-${f.name}`} value={f.name}>
                                {f.alias || f.name}
                            </Option>
                        ))}
                    </Select>
                </SettingRow>
            </SettingSection>

            {/* ---- FEATURES ---- */}
            <SettingSection title={defaultMessages.featuresSection}>
                <SettingRow label={defaultMessages.enableMyLocation}>
                    <Switch
                        checked={config.enableMyLocation}
                        onChange={(e: any) => updateConfig('enableMyLocation', e.target.checked)}
                        aria-label={defaultMessages.enableMyLocation}
                    />
                </SettingRow>
                <SettingRow label={defaultMessages.enableMapClick}>
                    <Switch
                        checked={config.enableMapClick}
                        onChange={(e: any) => updateConfig('enableMapClick', e.target.checked)}
                        aria-label={defaultMessages.enableMapClick}
                    />
                </SettingRow>
                <SettingRow label={defaultMessages.enableRecentSearches}>
                    <Switch
                        checked={config.enableRecentSearches}
                        onChange={(e: any) => updateConfig('enableRecentSearches', e.target.checked)}
                        aria-label={defaultMessages.enableRecentSearches}
                    />
                </SettingRow>
                {config.enableRecentSearches && (
                    <SettingRow flow="wrap" label={defaultMessages.maxRecentSearches}>
                        <NumericInput
                            value={config.maxRecentSearches}
                            min={1}
                            max={20}
                            step={1}
                            onChange={(value: number) => updateConfig('maxRecentSearches', value)}
                            className="w-100"
                        />
                    </SettingRow>
                )}
                <SettingRow label={defaultMessages.enableShare}>
                    <Switch
                        checked={config.enableShare}
                        onChange={(e: any) => updateConfig('enableShare', e.target.checked)}
                        aria-label={defaultMessages.enableShare}
                    />
                </SettingRow>
                <SettingRow label={defaultMessages.enablePrint}>
                    <Switch
                        checked={config.enablePrint}
                        onChange={(e: any) => updateConfig('enablePrint', e.target.checked)}
                        aria-label={defaultMessages.enablePrint}
                    />
                </SettingRow>
            </SettingSection>

            {/* ---- IMPORT / EXPORT ---- */}
            <SettingSection title={defaultMessages.importExportSection}>
                <Hint>{defaultMessages.importExportHint}</Hint>
                <SettingRow flow="wrap">
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%' }}>
                        <Tooltip title={defaultMessages.exportTooltip} placement="top">
                            <Button type="primary" size="sm" onClick={handleExport}>
                                {defaultMessages.exportConfig}
                            </Button>
                        </Tooltip>
                        <Tooltip title={defaultMessages.importTooltip} placement="top">
                            <Button type="secondary" size="sm" onClick={handleImportClick}>
                                {defaultMessages.importConfig}
                            </Button>
                        </Tooltip>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xml,application/xml,text/xml"
                            onChange={handleFileSelected}
                            style={{ display: 'none' }}
                            aria-hidden="true"
                            tabIndex={-1}
                        />
                    </div>
                </SettingRow>
                {importStatus && (
                    <div
                        style={{ marginTop: 8 }}
                        role={importStatus.type === 'success' ? 'status' : 'alert'}
                        aria-live={importStatus.type === 'success' ? 'polite' : 'assertive'}
                    >
                        <Alert
                            form="basic"
                            type={importStatus.type === 'success' ? 'success' : 'warning'}
                            text={importStatus.text}
                            withIcon
                            closable={false}
                        />
                    </div>
                )}
            </SettingSection>
        </div>
    )
}

export default Setting