const { test } = require('node:test')
const assert = require('node:assert/strict')
const { loadTs } = require('./load-ts.cjs')
const { buildHelpSections } = loadTs('src/runtime/helpSections.ts')
const messages = loadTs('src/runtime/translations/default.ts').default
const labels = {
  address: 'Address', myLocation: 'Use my location', clickMap: 'Click map',
  share: 'Share', print: 'Print', reset: 'Reset', tryAnother: 'Try another address',
  recentSearches: 'Recent searches', clearRecent: 'Clear'
}
const t = (key, values = {}) => {
  assert.equal(typeof messages[key], 'string', `Missing translation: ${key}`)
  return messages[key].replace(/\{(\w+)\}/g, (match, name) => values[name] === undefined ? match : values[name])
}
const flags = ['myLocation', 'mapClick', 'mapConnected', 'hero', 'share', 'print', 'recentSearches', 'resetButton']
function features(on) { return { ...Object.fromEntries(flags.map(k => [k, on])), labels } }
function checkGuide(f) {
  const sections = buildHelpSections(t, f)
  assert.equal(new Set(sections.map(s => s.key)).size, sections.length)
  assert.equal(new Set(sections.map(s => s.icon)).size, sections.length)
  assert.deepEqual(sections.filter(s => s.ordered).map(s => s.key), ['start'])
  const text = sections.map(s => [s.title, s.intro || '', ...s.body].join(' ')).join(' ')
  assert.doesNotMatch(text, /\{\w+\}|[\u2013\u2014]|\b(?:instance|session|persist|sync|toggle|modal)\b/i)
  assert.ok(sections.find(s => s.key === 'result').body.includes(messages.helpResultConditional))
  assert.equal(sections.find(s => s.key === 'trouble').body.at(-1), messages.helpTroubleContact)
  assert.equal(sections.some(s => s.key === 'actions'), f.share || f.print)
  assert.equal(sections.some(s => s.key === 'ways'), f.myLocation || f.mapClick)
  assert.equal(sections.some(s => s.key === 'recent'), f.recentSearches)
  if (!f.share) assert.ok(!text.includes(messages.helpActionsShare.split('{name}')[0] + labels.share))
}
test('help works with all features on', () => checkGuide(features(true)))
test('help works with all optional features off', () => checkGuide(features(false)))
for (const flag of flags) test(`help works with only ${flag} enabled`, () => checkGuide({ ...features(false), [flag]: true }))
test('custom button labels reach the help guide', () => {
  const f = features(true)
  f.labels = { ...labels, share: 'Send this answer', reset: 'Start again' }
  const text = JSON.stringify(buildHelpSections(t, f))
  assert.match(text, /Send this answer/)
  assert.match(text, /Start again/)
})
