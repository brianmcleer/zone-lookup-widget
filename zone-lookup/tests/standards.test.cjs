const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const ts = require('typescript')
const { loadTs, root } = require('./load-ts.cjs')
const preserved = require('./preserved-files.json')
for (const [file, expected] of Object.entries(preserved)) {
  test(`preserved original file: ${file}`, () => {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')
    assert.equal(hash, expected)
  })
}
test('manifest, package and both npm lock version fields agree', () => {
  const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))
  const manifest = read('manifest.json'), pkg = read('package.json'), lock = read('package-lock.json')
  assert.equal(manifest.version, pkg.version)
  assert.equal(lock.version, pkg.version)
  assert.equal(lock.packages[''].version, pkg.version)
  assert.deepEqual(manifest.dependency, ['jimu-arcgis'])
  assert.equal(manifest.author, 'Brian McLeer')
  assert.equal(pkg.author, 'Brian McLeer')
  assert.deepEqual(pkg.dependencies, {})
  assert.ok(['exb-widget', 'experience-builder', 'exb'].every(k => pkg.keywords.includes(k)))
})
test('Emotion JSX compiler settings remain automatic, not classic', () => {
  const text = fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8')
  const config = ts.parseConfigFileTextToJson('tsconfig.json', text).config
  assert.equal(config.compilerOptions.jsx, 'react-jsx')
  assert.equal(config.compilerOptions.jsxImportSource, '@emotion/react')
  assert.equal(config.compilerOptions.noEmit, true)
  assert.equal(config.compilerOptions.paths, undefined)
})
test('new template module stays SDK-free and has no expression execution', () => {
  const source = fs.readFileSync(path.join(root, 'src/runtime/template.ts'), 'utf8')
  assert.doesNotMatch(source, /\b(?:import|require)\s*(?:\(|['"{*])/)
  assert.doesNotMatch(source, /\beval\s*\(|new\s+Function\b|\bwindow\b|\bdocument\b/)
})
test('settings imports no Maps SDK module and uses the shared validator and tokens', () => {
  const source = fs.readFileSync(path.join(root, 'src/setting/setting.tsx'), 'utf8')
  assert.doesNotMatch(source, /from ['"](?:esri\/|@arcgis\/)/)
  assert.match(source, /validateTemplate\(config.resultTemplate/)
  assert.match(source, /aria-invalid=\{templateError/)
  assert.match(source, /const tokens = useTokens\(\)/)
  assert.match(source, /border: 1px solid \$\{tokens.divider\}/)
})
test('runtime keeps all attributes, renders the selected cascade template and announces errors', () => {
  const source = fs.readFileSync(path.join(root, 'src/runtime/widget.tsx'), 'utf8')
  assert.match(source, /outFields: \['\*'\]/)
  assert.match(source, /renderTemplate\(selectedTemplate, attributesWithMeta, fields\)/)
  assert.match(source, /e instanceof TemplateSyntaxError/)
  assert.match(source, /role="status" aria-live="polite" aria-atomic="true"/)
})
test('all TypeScript and TSX source files transpile with automatic Emotion JSX', () => {
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
    e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])
  for (const file of walk(path.join(root, 'src')).filter(f => /\.tsx?$/.test(f) && !f.endsWith('.d.ts'))) {
    const result = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      fileName: file, reportDiagnostics: true,
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, jsxImportSource: '@emotion/react', module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext }
    })
    assert.equal((result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0, file)
    if (file.endsWith('.tsx')) assert.match(result.outputText, /@emotion\/react\/jsx-runtime/, file)
  }
})
