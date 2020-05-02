import quibble from './quibble-es.js'

//@ts-ignore
export default quibble
export const reset = quibble.reset
export const ignoreCallsFromThisFile = quibble.ignoreCallsFromThisFile

/**
 * @param {string} specifier
 * @param {object} context
 * @param {string} context.parentURL
 * @param {string[]} context.conditions
 * @param {function} defaultResolve
 * @returns {Promise<{url: string}>}
 */
export async function resolve(specifier, context, defaultResolve) {
  const resolveResult = await defaultResolve(
    specifier.replace('?__quibbleresolvepath', ''),
    context,
    defaultResolve,
  )

  if (specifier.includes('__quibbleresolvepath')) {
    const resolvedPath = new URL(resolveResult.url).pathname
    const error = new Error()
    error.code = 'QUIBBLE_RESOLVED_PATH'
    error.resolvedPath = resolvedPath
    throw error
  }

  if (!globalThis.__quibble || !globalThis.__quibble.quibbledModules) {
    return resolveResult
  }

  const stubModuleGeneration = globalThis.__quibble.stubModuleGeneration

  return {
    url: `${resolveResult.url}?__quibble=${stubModuleGeneration}`,
  }
}

/**
 * @param {string|Buffer} source
 * @param {object} context
 * @param {string} context.url
 * @param {string} context.format
 * @param {function} defaultTransformSource
 * @returns {Promise<{source: string|Buffer}>} response
 */
export async function transformSource(source, context, defaultTransformSource) {
  const {url} = context
  const urlUrl = new URL(url)
  const shouldBeQuibbled = urlUrl.searchParams.get('__quibble')

  if (!shouldBeQuibbled) {
    return defaultTransformSource(source, context, defaultTransformSource)
  } else {
    const stubsInfo = getStubsInfo(urlUrl)

    if (stubsInfo) {
      return {source: transformModuleSource(stubsInfo)}
    } else {
      return defaultTransformSource(source, context, defaultTransformSource)
    }
  }
}

/**
 *
 * @param {URL} moduleUrl
 * @returns {[string, {defaultExportReplacement: any, namedExportReplacements: {[name: string]: any}}]|undefined}
 */
function getStubsInfo(moduleUrl) {
  if (!globalThis.__quibble) return undefined

  const moduleFilepath = moduleUrl.pathname

  return [...globalThis.__quibble.quibbledModules.entries()].find(([m]) => m === moduleFilepath)
}

/**
 * @param {[string, {defaultExportReplacement: any, namedExportReplacements: {[name: string]: any}}]} stubInfo
 * @returns {string}
 */
function transformModuleSource([moduleKey, stubs]) {
  return `
${Object.keys(stubs.namedExportReplacements || {})
  .map(
    (name) =>
      `export let ${name} = globalThis.__quibble.quibbledModules.get(${JSON.stringify(
        moduleKey,
      )}).namedExportReplacements["${name}"]`,
  )
  .join(';\n')};
${
  stubs.defaultExportReplacement
    ? `export default globalThis.__quibble.quibbledModules.get(${JSON.stringify(
        moduleKey,
      )}).defaultExportReplacement;`
    : ''
}
`
}
