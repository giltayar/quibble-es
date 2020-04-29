const quibble = require('../../src/quibble-es.js')
const {describe, it, afterEach} = require('mocha')
const {expect, use} = require('chai')
use(require('chai-subset'))

describe('quibble cjs (unit)', function () {
  afterEach(() => quibble.reset())

  it('should work even if used from cjs', async () => {
    const cjsImporingMjs = require('./a-module')
    const result1 = await cjsImporingMjs()
    expect(result1).to.containSubset({
      default: 'default-export',
      namedExport: 'named-export',
      life: 42,
    })
    expect(result1.namedFunctionExport()).to.equal('named-function-export')

    quibble('./a-module.mjs', 'default-export-replacement', {
      namedExport: 'replacement',
      life: 41,
      namedFunctionExport: () => 'export replacement',
    })

    const result2 = await cjsImporingMjs()
    expect(result2).to.containSubset({
      default: 'default-export-replacement',
      namedExport: 'replacement',
      life: 41,
    })
    expect(result2.namedFunctionExport()).to.equal('export replacement')

    quibble.reset()
    const result3 = await cjsImporingMjs()
    expect(result3).to.containSubset({
      default: 'default-export',
      namedExport: 'named-export',
      life: 42,
    })
    expect(result3.namedFunctionExport()).to.equal('named-function-export')

    quibble('./a-module.mjs', 'default-export-replacement 2', {
      namedExport: 'replacement 2',
      life: 40,
      namedFunctionExport: () => 'export replacement 2',
    })
    const result4 = await cjsImporingMjs()

    expect(result4).to.containSubset({
      default: 'default-export-replacement 2',
      namedExport: 'replacement 2',
      life: 40,
    })
    expect(result4.namedFunctionExport()).to.equal('export replacement 2')
  })
})
