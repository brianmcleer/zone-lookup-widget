const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { loadTs, root } = require('./load-ts.cjs')
const { renderTemplate, formatValue, escapeHtml, hasTemplateValue, validateTemplate, TemplateSyntaxError } =
  loadTs('src/runtime/template.ts')
const conditional = '{{#if Municipality}}Incorporated {Municipality}{{else}}Unincorporated {Township} Township{{/if}}'

test('populated Municipality takes precedence over Township', () => {
  assert.equal(renderTemplate(conditional, { Municipality: 'Example City', Township: 'Example' }), 'Incorporated Example City')
})
for (const [label, value] of [['null', null], ['undefined', undefined], ['empty text', ''], ['spaces', '   '], ['tabs and newlines', '\t\n']]) {
  test(`${label} Municipality uses Township`, () => {
    assert.equal(renderTemplate(conditional, { Municipality: value, Township: 'Example' }), 'Unincorporated Example Township')
  })
}
test('missing Municipality uses Township', () => {
  assert.equal(renderTemplate(conditional, { Township: 'Example' }), 'Unincorporated Example Township')
})
for (const value of [0, false, '0', 'false', 'NULL', 'null', [], {}]) {
  test(`presence is not truthiness: ${JSON.stringify(value)}`, () => {
    assert.equal(hasTemplateValue(value), true)
    assert.equal(renderTemplate('{{#if Value}}populated{{else}}empty{{/if}}', { Value: value }), 'populated')
  })
}
test('case-insensitive lookup works for conditions, tokens, and date metadata', () => {
  assert.equal(renderTemplate(conditional, { MUNICIPALITY: 'Example City', TOWNSHIP: 'Example' }), 'Incorporated Example City')
  assert.equal(renderTemplate('{pickup_date}', { PICKUP_DATE: Date.UTC(2026, 9, 20) }, [{ name: 'Pickup_Date', type: 'esriFieldTypeDate' }]), 'October 20, 2026')
})
test('exact case wins when two keys differ only by capitalization', () => {
  assert.equal(renderTemplate('{name}/{NAME}', { name: 'first', NAME: 'second' }), 'first/second')
})
test('no else is needed for optional text', () => {
  assert.equal(renderTemplate('A{{#if X}}:{X}{{/if}}B', {}), 'AB')
  assert.equal(renderTemplate('A{{#if X}}:{X}{{/if}}B', { X: 'yes' }), 'A:yesB')
})
test('nested branches handle both fields blank', () => {
  const nested = '{{#if Municipality}}Incorporated {Municipality}{{else}}{{#if Township}}Unincorporated {Township} Township{{else}}Area information unavailable{{/if}}{{/if}}'
  assert.equal(renderTemplate(nested, {}), 'Area information unavailable')
  assert.equal(renderTemplate(nested, { Township: 'Example' }), 'Unincorporated Example Township')
  assert.equal(renderTemplate(nested, { Municipality: 'City' }), 'Incorporated City')
})
test('independent sibling blocks do not share state', () => {
  const template = '{{#if A}}A{{else}}a{{/if}}|{{#if B}}B{{else}}b{{/if}}'
  assert.equal(renderTemplate(template, { A: 1 }), 'A|b')
  assert.equal(renderTemplate(template, { B: 1 }), 'a|B')
})
test('multiline blocks and spaces inside directive braces are accepted', () => {
  assert.equal(renderTemplate('{{ #if\nMunicipality }}{Municipality}{{ else }}none{{ /if }}', { Municipality: 'City' }), 'City')
})
test('attribute HTML and quotes are escaped, author HTML stays intact', () => {
  assert.equal(renderTemplate('<p title="{Value}">{Value}</p>', { Value: '<b>"A&B\'</b>' }),
    '<p title="&lt;b&gt;&quot;A&amp;B&#39;&lt;/b&gt;">&lt;b&gt;&quot;A&amp;B&#39;&lt;/b&gt;</p>')
})
test('inserted values cannot become directives or a second field lookup', () => {
  const value = '{{#if Hidden}}{Hidden}{{/if}}'
  assert.equal(renderTemplate('{{#if Value}}{Value}{{/if}}', { Value: value, Hidden: 'private' }), value)
})
test('inherited object properties are not feature fields', () => {
  const attrs = Object.create({ Municipality: 'prototype value' })
  attrs.Township = 'Example'
  assert.equal(renderTemplate(conditional, attrs), 'Unincorporated Example Township')
  assert.equal(renderTemplate('{constructor}|{toString}|{__proto__}', {}), '||')
})
test('null attribute dictionaries and missing tokens are harmless', () => {
  assert.equal(renderTemplate('a{Missing}b', null), 'ab')
  assert.equal(renderTemplate('a{Missing}b', undefined), 'ab')
  assert.equal(renderTemplate('', {}), '')
})
test('legacy double-braced fields keep their old substitution behavior', () => {
  assert.equal(renderTemplate('{{FIELD}}', { FIELD: 'value' }), '{value}')
})
test('legacy date output is UTC and does not move to the prior day', () => {
  for (const type of ['date', 'esriFieldTypeDate']) {
    assert.equal(formatValue(Date.UTC(2026, 9, 20), { name: 'Date', type }), 'October 20, 2026')
  }
  assert.equal(formatValue(null), '')
  assert.equal(formatValue(false), 'false')
  assert.equal(formatValue(0), '0')
})
test('existing searched-address and cascade metadata tokens still render', () => {
  assert.equal(renderTemplate('{__searchedAddress}: {LAYER} / {Zone}', { __searchedAddress: '123 Example St', LAYER: 'Regular', Zone: 2 }), '123 Example St: Regular / 2')
})
const invalidCases = [
  ['{{#if X}}yes', 'missingClose'],
  ['{{else}}', 'unexpectedElse'],
  ['{{/if}}', 'unexpectedClose'],
  ['{{#if X}}a{{else}}b{{else}}c{{/if}}', 'duplicateElse'],
  ['{{#if}}a{{/if}}', 'invalidDirective'],
  ['{{#if X == 1}}a{{/if}}', 'invalidDirective'],
  ['{{#unless X}}a{{/unless}}', 'invalidDirective'],
  ['{{#if X', 'invalidDirective'],
  ['{{#if X}}a{{/if}', 'invalidDirective'],
  ['{{#if X}}a{{else if Y}}b{{/if}}', 'invalidDirective'],
  ['{{#if $feature.X}}a{{/if}}', 'invalidDirective'],
  ['{{#if 1X}}a{{/if}}', 'invalidDirective']
]
for (const [template, code] of invalidCases) {
  test(`invalid syntax produces a controlled ${code} error: ${template}`, () => {
    assert.equal(validateTemplate(template), code)
    assert.throws(() => renderTemplate(template, {}), error => error instanceof TemplateSyntaxError && error.code === code)
  })
}
test('64 nesting levels work and deeper input fails predictably', () => {
  const nested = depth => '{{#if X}}'.repeat(depth) + 'yes' + '{{/if}}'.repeat(depth)
  assert.equal(renderTemplate(nested(64), { X: 1 }), 'yes')
  assert.equal(validateTemplate(nested(65)), 'tooDeep')
})
test('parser errors never include author template text or values', () => {
  try { renderTemplate('{{#if Private_Field}}secret text', { Private_Field: 'sensitive value' }) }
  catch (error) { assert.equal(error.message, 'Invalid result template (missingClose).') }
})
test('the shipping default template matches the legacy renderer', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8'))
  const attrs = { ZONE_NAME: 'Example', NAME: 'A&B', __searchedAddress: '123 Example St' }
  const expected = config.resultTemplate.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, key) => escapeHtml(attrs[key]))
  assert.equal(renderTemplate(config.resultTemplate, attrs), expected)
})
test('builder example uses exactly the supported syntax', () => {
  const defaults = loadTs('src/setting/translations/default.ts').default
  assert.equal(validateTemplate(defaults.conditionalTemplateExample), null)
  assert.match(renderTemplate(defaults.conditionalTemplateExample, { Municipality: null, Township: 'Example' }), /Unincorporated Example Township/)
})
