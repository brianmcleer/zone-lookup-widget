/* Use Experience Builder's TypeScript, not another widget dependency. */
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')
function loadTs(relativePath) {
  const filename = path.join(root, relativePath)
  const source = fs.readFileSync(filename, 'utf8')
  const result = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
    fileName: filename,
    reportDiagnostics: true
  })
  const errors = (result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error)
  if (errors.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(errors, {
    getCurrentDirectory: () => root, getCanonicalFileName: p => p, getNewLine: () => '\n'
  }))
  const module = { exports: {} }
  const wrapper = vm.runInThisContext(`(function(require, module, exports) {${result.outputText}\n})`, { filename })
  wrapper(require, module, module.exports)
  return module.exports
}
module.exports = { loadTs, root }
