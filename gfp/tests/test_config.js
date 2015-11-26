import config from 'gfp/config'
import {Filter} from 'gfp/filter'

suite('Config', () => {
  let self = {sandbox: sinon.sandbox.create()}
  teardown(() => {self.sandbox.restore(); config.filters.setValue([])})
  suite('filter', () => {
    let filters = [Filter.fromText('a'), Filter.fromText('b'), Filter.fromText('c')]
    test('length', () => {
      config.filters.setValue(Array.from(filters))
      assert.equal(config.filters.length, 3)
    })
    test('add', () => {
      config.filters.setValue([filters[2], filters[0]])
      config.filters.add(filters[1])
      assert.deepEqual(Array.from(config.filters), filters)
    })
    test('remove', () => {
      config.filters.setValue(Array.from(filters))
      config.filters.remove([filters[2], filters[0]])
      assert.deepEqual(Array.from(config.filters), [filters[1]])
    })
    test('setValue', () => {
      config.filters.setValue(Array.from(filters).reverse())
      assert.deepEqual(Array.from(config.filters), filters)
    })
    test('observe unobserve', () => {
      let callbacks = [sinon.spy(), sinon.spy()]
      config.filters.observe(callbacks[0])
      config.filters.observe(callbacks[1])
      config.filters.setValue([])
      config.filters.unobserve(callbacks[1])
      config.filters.setValue([])
      assert.callCount(callbacks[0], 2)
      assert.callCount(callbacks[1], 1)
    })
  })
  suite('filter changes updates json', () => {
    test('add', () => {
      config.filters.add(Filter.fromText('a'))
      assert.deepEqual(config.filtersObject, {'a': {}})
    })
    test('remove', () => {
      let filter = Filter.fromText('a')
      config.filters.add(filter)
      config.filters.remove([filter])
      assert.deepEqual(config.filtersObject, {})
    })
    test('update', () => {
      let filter = Filter.fromText('a')
      config.filters.add(filter)
      filter.hitCount++
      config.filters.update(filter)
      assert.deepEqual(config.filtersObject, {'a': {hitCount: 1}})
    })
  })
  test('flushAllowHidden calls GM_setValue', () => {
    self.sandbox.spy(window, 'GM_setValue')
    config.flushAllowHidden()
    assert.calledOnce(window.GM_setValue)
  })
  test('flushFilters calls GM_setValue', () => {
    self.sandbox.spy(window, 'GM_setValue')
    config.flushFilters()
    assert.calledOnce(window.GM_setValue)
  })
})
