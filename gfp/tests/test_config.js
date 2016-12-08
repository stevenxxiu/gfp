import sinon from 'sinon'
import {assert} from 'chai'

import Config from 'gfp/config'
import {Filter} from 'gfp/filter'

suite('Config', () => {
  this.sandbox = sinon.sandbox.create()
  setup(() => this.config = new Config())
  teardown(() => this.sandbox.restore())
  suite('filter', () => {
    let filters = [Filter.fromText('a'), Filter.fromText('b'), Filter.fromText('c')]
    test('length', () => {
      this.config.filters.setValue(Array.from(filters))
      assert.equal(this.config.filters.length, 3)
    })
    test('add', () => {
      this.config.filters.setValue([filters[2], filters[0]])
      this.config.filters.add(filters[1])
      assert.deepEqual(Array.from(this.config.filters), filters)
    })
    test('remove', () => {
      this.config.filters.setValue(Array.from(filters))
      this.config.filters.remove([filters[2], filters[0]])
      assert.deepEqual(Array.from(this.config.filters), [filters[1]])
    })
    test('setValue', () => {
      this.config.filters.setValue(Array.from(filters).reverse())
      assert.deepEqual(Array.from(this.config.filters), filters)
    })
    test('observe unobserve', () => {
      let callbacks = [sinon.spy(), sinon.spy()]
      this.config.filters.observe(callbacks[0])
      this.config.filters.observe(callbacks[1])
      this.config.filters.setValue([])
      this.config.filters.unobserve(callbacks[1])
      this.config.filters.setValue([])
      assert.callCount(callbacks[0], 2)
      assert.callCount(callbacks[1], 1)
    })
  })
  suite('filter changes updates json', () => {
    test('add', () => {
      this.config.filters.add(Filter.fromText('a'))
      assert.deepEqual(this.config.filtersObject, {'a': {}})
    })
    test('remove', () => {
      let filter = Filter.fromText('a')
      this.config.filters.add(filter)
      this.config.filters.remove([filter])
      assert.deepEqual(this.config.filtersObject, {})
    })
    test('update', () => {
      let filter = Filter.fromText('a')
      this.config.filters.add(filter)
      filter.hitCount++
      this.config.filters.update(filter)
      assert.deepEqual(this.config.filtersObject, {'a': {hitCount: 1}})
    })
  })
  test('flushAllowHidden calls GM_setValue', () => {
    this.sandbox.spy(global, 'GM_setValue')
    this.config.flushAllowHidden()
    assert.calledOnce(global.GM_setValue)
  })
  test('flushFilters calls GM_setValue', () => {
    this.sandbox.spy(global, 'GM_setValue')
    this.config.flushFilters()
    assert.calledOnce(global.GM_setValue)
  })
})
