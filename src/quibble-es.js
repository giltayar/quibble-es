const path = require('path')

/**
 *
 * @param {string} modulePath
 * @param {any} defaultExportReplacement
 * @param {{[x: string]: any}} namedExportReplacements
 */
module.exports = async function quibble(
  modulePath,
  defaultExportReplacement,
  namedExportReplacements,
) {
  const callerFile = hackErrorStackToGetCallerFile()
  if (!globalThis.__quibble)
    globalThis.__quibble = {quibbledModules: new Map(), stubModuleGeneration: 1}

  if (!globalThis.__quibble.quibbledModules) {
    globalThis.__quibble.quibbledModules = new Map()
    ++globalThis.__quibble.stubModuleGeneration
  }

  const fullModulePath = isBareSpecifier(modulePath)
    ? await dummyImportModuleToGetAtPath(modulePath)
    : path.resolve(path.dirname(callerFile), modulePath)

  globalThis.__quibble.quibbledModules.set(fullModulePath, {
    defaultExportReplacement,
    namedExportReplacements,
  })
}

module.exports.esmImportWithPath = async function esmImportWithPath(importPath) {
  const callerFile = hackErrorStackToGetCallerFile()
  const importPathIsBareSpecifier = isBareSpecifier(importPath)

  const modulePath = importPathIsBareSpecifier
    ? await dummyImportModuleToGetAtPath(importPath)
    : path.resolve(path.dirname(callerFile), importPath)

  const fullImportPath = importPathIsBareSpecifier
    ? importPath
    : path.resolve(path.dirname(callerFile), importPath)
  return {
    modulePath,
    module: await import(fullImportPath + '?__quibbleoriginal'),
  }
}

module.exports.reset = function reset(hard) {
  if (!globalThis.__quibble) return

  delete globalThis.__quibble.quibbledModules
  if (hard) {
    ignoredCallerFiles = new Set()
  }
}

let ignoredCallerFiles = new Set()

module.exports.ignoreCallsFromThisFile = function ignoreCallsFromThisFile(file) {
  if (file == null) {
    file = hackErrorStackToGetCallerFile(false)
  }
  ignoredCallerFiles.add(file)
}

async function dummyImportModuleToGetAtPath(modulePath) {
  try {
    await import(modulePath + (modulePath.includes('?') ? '&' : '?') + '__quibbleresolvepath')
  } catch (error) {
    if (error.code === 'QUIBBLE_RESOLVED_PATH') {
      return error.resolvedPath
    } else {
      throw error
    }
  }

  throw new Error(
    'Node.js is not running with the Quibble loader. Run node with "--loader=quibble"',
  )
}

function isBareSpecifier(modulePath) {
  const firstLetter = modulePath[0]
  if (firstLetter === '.' || firstLetter === '/') {
    return false
  }

  if (!modulePath.includes(':')) {
    return true
  }

  try {
    new URL(modulePath)
  } catch (error) {
    if (error.code === 'ERR_INVALID_URL') {
      return false
    } else {
      throw error
    }
  }

  return true
}

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
      .filter((f) => !includeGlobalIgnores || !ignoredCallerFiles.has(f))
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
