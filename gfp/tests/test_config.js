import sinon from 'sinon'
import {assert} from 'chai'

import Config from 'gfp/config'
import {Filter} from 'gfp/filter'

suite('Config', () => {
  let self = {sandbox: sinon.sandbox.create()}
  setup(() => self.config = new Config())
  teardown(() => self.sandbox.restore())
  suite('filter', () => {
    let filters = [Filter.fromText('a'), Filter.fromText('b'), Filter.fromText('c')]
    test('length', () => {
      self.config.filters.setValue(Array.from(filters))
      assert.equal(self.config.filters.length, 3)
    })
    test('add', () => {
      self.config.filters.setValue([filters[2], filters[0]])
      self.config.filters.add(filters[1])
      assert.deepEqual(Array.from(self.config.filters), filters)
    })
    test('remove', () => {
      self.config.filters.setValue(Array.from(filters))
      self.config.filters.remove([filters[2], filters[0]])
      assert.deepEqual(Array.from(self.config.filters), [filters[1]])
    })
    test('setValue', () => {
      self.config.filters.setValue(Array.from(filters).reverse())
      assert.deepEqual(Array.from(self.config.filters), filters)
    })
    test('observe unobserve', () => {
      let callbacks = [sinon.spy(), sinon.spy()]
      self.config.filters.observe(callbacks[0])
      self.config.filters.observe(callbacks[1])
      self.config.filters.setValue([])
      self.config.filters.unobserve(callbacks[1])
      self.config.filters.setValue([])
      assert.callCount(callbacks[0], 2)
      assert.callCount(callbacks[1], 1)
    })
  })
  suite('filter changes updates json', () => {
    test('add', () => {
      self.config.filters.add(Filter.fromText('a'))
      assert.deepEqual(self.config.filtersObject, {'a': {}})
    })
    test('remove', () => {
      let filter = Filter.fromText('a')
      self.config.filters.add(filter)
      self.config.filters.remove([filter])
      assert.deepEqual(self.config.filtersObject, {})
    })
    test('update', () => {
      let filter = Filter.fromText('a')
      self.config.filters.add(filter)
      filter.hitCount++
      self.config.filters.update(filter)
      assert.deepEqual(self.config.filtersObject, {'a': {hitCount: 1}})
    })
  })
  test('flushAllowHidden calls GM_setValue', () => {
    self.sandbox.spy(global, 'GM_setValue')
    self.config.flushAllowHidden()
    assert.calledOnce(global.GM_setValue)
  })
  test('flushFilters calls GM_setValue', () => {
    self.sandbox.spy(global, 'GM_setValue')
    self.config.flushFilters()
    assert.calledOnce(global.GM_setValue)
  })
})
