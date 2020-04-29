const path = require('path')

/**
 *
 * @param {string} modulePath
 * @param {any} defaultExportReplacement
 * @param {{[x: string]: any}} namedExportReplacements
 */
module.exports = function quibble(modulePath, defaultExportReplacement, namedExportReplacements) {
  const callerFile = hackErrorStackToGetCallerFile()
  if (!globalThis.__quibble)
    globalThis.__quibble = {quibbledModules: new Map(), isReset: false, stubModuleGeneration: 1}

  if (globalThis.__quibble.isReset) {
    globalThis.__quibble.isReset = false
    ++globalThis.__quibble.stubModuleGeneration
  }

  const fullModulePath = path.resolve(path.dirname(callerFile), modulePath)

  globalThis.__quibble.quibbledModules.set(fullModulePath, {
    defaultExportReplacement,
    namedExportReplacements,
  })
}

module.exports.reset = function reset() {
  if (!globalThis.__quibble) return

  globalThis.__quibble.isReset = true
}

var ignoredCallerFiles = []

// Copied and modified for ESM from https://github.com/testdouble/quibble/blob/master/lib/quibble.js
function hackErrorStackToGetCallerFile(includeGlobalIgnores) {
  if (includeGlobalIgnores == null) {
    includeGlobalIgnores = true
  }
  var originalFunc = Error.prepareStackTrace
  try {
    Error.prepareStackTrace = function (_e, stack) {
      return stack
    }
    var e = new Error()
    //@ts-ignore
    const stack = /**@type {any[]}*/ (e.stack)
    var currentFile = convertUrlToPath(stack[0].getFileName())

    return stack
      .map((s) => s.getFileName())
      .filter((f) => !!f)
      .map(convertUrlToPath)
      .filter((f) => path.isAbsolute(f))
      .filter((f) => !includeGlobalIgnores || !ignoredCallerFiles.includes(f))
      .find((f) => f !== currentFile)
  } finally {
    Error.prepareStackTrace = originalFunc
  }

  function convertUrlToPath(fileUrl) {
    try {
      const p = new URL(fileUrl).pathname
      return p
    } catch (error) {
      if (error.code === 'ERR_INVALID_URL') {
        return fileUrl
      } else {
        throw error
      }
    }
  }
}
