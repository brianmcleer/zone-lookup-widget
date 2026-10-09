import { __locale } from './i18n-t'
/**
 * Pure result-template helpers. Shared with settings; do not import the Maps SDK,
 * React, a browser global, or an expression evaluator into this module.
 *
 * {FIELD} inserts escaped text. {{#if FIELD}}...{{else}}...{{/if}} selects HTML
 * using field presence, not JavaScript truthiness. This is not an Arcade engine.
 */
export type TemplateErrorCode =
    'invalidDirective' | 'unexpectedElse' | 'duplicateElse' |
    'unexpectedClose' | 'missingClose' | 'tooDeep'

export class TemplateSyntaxError extends Error {
    readonly code: TemplateErrorCode

    constructor (code: TemplateErrorCode) {
        // Fixed messages only: the existing error telemetry must not receive
        // template text, field names, addresses, or feature attribute values.
        super(`Invalid result template (${code}).`)
        this.name = 'TemplateSyntaxError'
        this.code = code
    }
}

type Attributes = Record<string, unknown>
interface TemplateField { name: string; type?: string }
interface ConditionalNode {
    kind: 'if'
    field: string
    thenNodes: TemplateNode[]
    elseNodes: TemplateNode[]
}
type TemplateNode = { kind: 'text'; text: string } | ConditionalNode
interface Frame { node: ConditionalNode; parent: TemplateNode[]; hasElse: boolean }

const MAX_DEPTH = 64
const FIELD_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/

export const escapeHtml = (value: unknown): string => {
    if (value === null || value === undefined) return ''
    return String(value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export const formatValue = (value: any, field?: TemplateField): string => {
    if (value === null || value === undefined || value === '') return ''
    if (field && (field.type === 'date' || field.type === 'esriFieldTypeDate')) {
        try {
            // Preserve the existing UTC date-only formatting.
            return new Date(value).toLocaleDateString(__locale(), {
                year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
            })
        } catch (_e) { /* Keep the original text when it cannot be formatted. */ }
    }
    return String(value)
}

/** Blank strings count as empty; 0 and false are populated values. */
export const hasTemplateValue = (value: unknown): boolean =>
    value !== null && value !== undefined &&
    !(typeof value === 'string' && value.trim() === '')

/** Parse the author's template before inserting data, so data cannot add logic. */
const parseTemplate = (template: string): TemplateNode[] => {
    const root: TemplateNode[] = []
    const stack: Frame[] = []
    let current = root
    let offset = 0
    const directives = /\{\{([\s\S]*?)\}\}/g
    let match: RegExpExecArray | null

    const addText = (text: string): void => {
        if (!text) return
        // Detect a reserved directive whose closing braces were omitted.
        if (/\{\{\s*(?:#|\/|else\b)/.test(text)) {
            throw new TemplateSyntaxError('invalidDirective')
        }
        current.push({ kind: 'text', text })
    }

    while ((match = directives.exec(template)) !== null) {
        addText(template.slice(offset, match.index))
        const directive = match[1].trim()
        const open = /^#if\s+(.+)$/.exec(directive)
        if (open && FIELD_NAME.test(open[1])) {
            if (stack.length >= MAX_DEPTH) throw new TemplateSyntaxError('tooDeep')
            const node: ConditionalNode = {
                kind: 'if', field: open[1], thenNodes: [], elseNodes: []
            }
            current.push(node)
            stack.push({ node, parent: current, hasElse: false })
            current = node.thenNodes
        } else if (directive === 'else') {
            const frame = stack[stack.length - 1]
            if (!frame) throw new TemplateSyntaxError('unexpectedElse')
            if (frame.hasElse) throw new TemplateSyntaxError('duplicateElse')
            frame.hasElse = true
            current = frame.node.elseNodes
        } else if (directive === '/if') {
            const frame = stack.pop()
            if (!frame) throw new TemplateSyntaxError('unexpectedClose')
            current = frame.parent
        } else if (/^(?:#|\/|else\b)/.test(directive)) {
            throw new TemplateSyntaxError('invalidDirective')
        } else {
            // Non-directive double braces keep their pre-existing token behavior.
            addText(match[0])
        }
        offset = directives.lastIndex
    }
    addText(template.slice(offset))
    if (stack.length) throw new TemplateSyntaxError('missingClose')
    return root
}

/** A code, not untrusted template text, for translated builder validation. */
export const validateTemplate = (template: string): TemplateErrorCode | null => {
    try {
        parseTemplate(template || '')
        return null
    } catch (error) {
        if (error instanceof TemplateSyntaxError) return error.code
        throw error
    }
}

export const renderTemplate = (
    template: string,
    attributes: Attributes | null | undefined,
    fields: TemplateField[] = []
): string => {
    if (!template) return ''
    const nodes = parseTemplate(template)
    const values = attributes || {}
    const names = new Map<string, string>()
    for (const name of Object.keys(values)) {
        if (!names.has(name.toLowerCase())) names.set(name.toLowerCase(), name)
    }
    const fieldByName = new Map<string, TemplateField>()
    const fieldByLowerName = new Map<string, TemplateField>()
    for (const field of fields || []) {
        if (!field || typeof field.name !== 'string') continue
        fieldByName.set(field.name, field)
        if (!fieldByLowerName.has(field.name.toLowerCase())) {
            fieldByLowerName.set(field.name.toLowerCase(), field)
        }
    }
    const resolveName = (name: string): string | undefined =>
        Object.prototype.hasOwnProperty.call(values, name) ? name : names.get(name.toLowerCase())
    const read = (name: string): unknown => {
        const key = resolveName(name)
        return key === undefined ? undefined : values[key]
    }
    const insertValues = (text: string): string =>
        text.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, name: string) => {
            const key = resolveName(name)
            if (key === undefined) return ''
            return escapeHtml(formatValue(values[key],
                fieldByName.get(key) || fieldByLowerName.get(key.toLowerCase())))
        })
    const renderNodes = (items: TemplateNode[]): string => items.map(node =>
        node.kind === 'text'
            ? insertValues(node.text)
            : renderNodes(hasTemplateValue(read(node.field)) ? node.thenNodes : node.elseNodes)
    ).join('')
    return renderNodes(nodes)
}
