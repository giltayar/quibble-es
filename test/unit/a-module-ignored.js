'use strict'

module.exports = async function () {
  return await import('./a-module-ignored.mjs')
}
