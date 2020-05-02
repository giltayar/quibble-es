'use strict'
const path = require('path')
const {describe, it, afterEach} = require('mocha')
const {expect, use} = require('chai')
const quibble = require('../../src/quibble-es.js')
use(require('chai-subset'))

describe('quibble cjs esmImportWithPath (unit)', function () {
  afterEach(() => quibble.reset())

  it('should support importing esm and returning the path for a relative url', async () => {
    const {modulePath, module} = await quibble.esmImportWithPath('./a-module.mjs')

    expect(modulePath).to.equal(path.join(__dirname, 'a-module.mjs'))
    expect({...module}).to.containSubset({
      default: 'default-export',
      namedExport: 'named-export',
      life: 42,
    })
    expect(module.namedFunctionExport()).to.equal('named-function-export')
  })

  it('should support importing esm and returning the path for a bare specifier', async () => {
    // This test that `is-promise` is a dual-mode module where
    // the entry points are index.js and index.mjs. If thie changes in the future, you
    // can always create a module of your own and put it in node_modules.
    const {modulePath, module} = await quibble.esmImportWithPath('is-promise')

    expect(modulePath).to.equal(require.resolve('is-promise').replace('.js', '.mjs'))
    const {default: isPromise, ...rest} = module
    expect(rest).to.eql({})
    expect(isPromise(Promise.resolve())).to.be.true
    expect(isPromise(42)).to.be.false
  })

  it('should support importing esm and returning the path even when relative path quibbled', async () => {
    quibble('./a-module.mjs', 'default-export-replacement', {
      namedExport: 'replacement',
      life: 41,
      namedFunctionExport: () => 'export replacement',
    })
    const {modulePath, module} = await quibble.esmImportWithPath('./a-module.mjs')

    expect(modulePath).to.equal(path.join(__dirname, 'a-module.mjs'))
    expect({...module}).to.containSubset({
      default: 'default-export',
      namedExport: 'named-export',
      life: 42,
    })
    expect(module.namedFunctionExport()).to.equal('named-function-export')
  })

  it('should support importing esm and returning the path even when bare-specifier quibbled', async () => {
    // This test that `is-promise` is a dual-mode module where
    // the entry points are index.js and index.mjs. If thie changes in the future, you
    // can always create a module of your own and put it in node_modules.
    quibble('is-promise', 42)
    const {modulePath, module} = await quibble.esmImportWithPath('is-promise')

    expect(modulePath).to.equal(require.resolve('is-promise').replace('.js', '.mjs'))
    const {default: isPromise, ...rest} = module
    expect(rest).to.eql({})
    expect(isPromise(Promise.resolve())).to.be.true
    expect(isPromise(42)).to.be.false
  })
})
