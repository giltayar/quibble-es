import {ignoreCallsFromThisFile} from '../../src/quibble-esm.mjs'
export const life = 42
export const namedExport = 'named-export'
export const namedFunctionExport = () => 'named-function-export'

ignoreCallsFromThisFile()

export default 'default-export'
