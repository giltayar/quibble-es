import quibble from '../../src/quibble-esm.mjs'
import mocha from 'mocha'
import chai from 'chai'
import chaiSubset from 'chai-subset'

const {describe, it, afterEach} = mocha
const {expect, use} = chai
use(chaiSubset)

describe('quibble esm (unit)', function () {
  afterEach(() => quibble.reset())

  it('should mock a module', async () => {
    quibble('./a-module.mjs', 'default-export-replacement', {
      namedExport: 'replacement',
      life: 41,
      namedFunctionExport: () => 'export replacement',
    })

    const result = await import('./a-module.mjs')
    expect({...result}).to.containSubset({
      default: 'default-export-replacement',
      namedExport: 'replacement',
      life: 41,
    })
    expect(result.namedFunctionExport()).to.equal('export replacement')
  })

  it('should mock a module after it is used unmocked', async () => {
    const result1 = await import('./a-module.mjs')
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

    const result2 = await import('./a-module.mjs')
    expect(result2).to.containSubset({
      default: 'default-export-replacement',
      namedExport: 'replacement',
      life: 41,
    })
    expect(result2.namedFunctionExport()).to.equal('export replacement')
  })

  it('should reset', async () => {
    quibble('./a-module.mjs', 'default-export-replacement', {
      namedExport: 'replacement',
      life: 41,
      namedFunctionExport: () => 'export replacement',
    })
    await import('./a-module.mjs')

    quibble.reset()

    const result = await import('./a-module.mjs')
    expect({...result}).to.containSubset({
      default: 'default-export',
      namedExport: 'named-export',
      life: 42,
    })
    expect(result.namedFunctionExport()).to.equal('named-function-export')
  })

  it('should reset a mocked module', async () => {
    quibble('./a-module.mjs', 'default-export-replacement', {
      namedExport: 'replacement',
      life: 41,
      namedFunctionExport: () => 'export replacement',
    })

    await import('./a-module.mjs')
    quibble.reset()

    const result = await import('./a-module.mjs')
    expect(result).to.containSubset({
      default: 'default-export',
      namedExport: 'named-export',
      life: 42,
    })
    expect(result.namedFunctionExport()).to.equal('named-function-export')
  })

  it('should remock a module after reset', async () => {
    quibble('./a-module.mjs', 'default-export-replacement', {
      namedExport: 'replacement',
      life: 41,
      namedFunctionExport: () => 'export replacement',
    })

    await import('./a-module.mjs')
    quibble.reset()

    quibble('./a-module.mjs', 'default-export-replacement 2', {
      namedExport: 'replacement 2',
      life: 40,
      namedFunctionExport: () => 'export replacement 2',
    })
    const result = await import('./a-module.mjs')

    expect(result).to.containSubset({
      default: 'default-export-replacement 2',
      namedExport: 'replacement 2',
      life: 40,
    })
    expect(result.namedFunctionExport()).to.equal('export replacement 2')
  })

  it('should mock bare-specifier modules', async () => {
    quibble('is-promise', 42)

    const {default: defaultExport, ...named} = await import('is-promise')

    expect(defaultExport).to.equal(42)
    expect(named).to.eql({})
  })
})
