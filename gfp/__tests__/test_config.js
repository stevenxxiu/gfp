import Config from 'gfp/config'
import {Filter} from 'gfp/filter'

describe('Config', () => {
  let config
  beforeEach(() => {
    window.GM_getValue = jest.fn().mockImplementation((name, value) => value)
    window.GM_setValue = jest.fn()
    config = new Config()
  })
  afterEach(() => jest.resetAllMocks())
  describe('filter', () => {
    const filters = [Filter.fromText('a'), Filter.fromText('b'), Filter.fromText('c')]
    test('length', () => {
      config.filters.setValue(Array.from(filters))
      expect(config.filters.length).toBe(3)
    })
    test('add', () => {
      config.filters.setValue([filters[2], filters[0]])
      config.filters.add(filters[1])
      expect(Array.from(config.filters)).toStrictEqual(filters)
    })
    test('remove', () => {
      config.filters.setValue(Array.from(filters))
      config.filters.remove([filters[2], filters[0]])
      expect(Array.from(config.filters)).toStrictEqual([filters[1]])
    })
    test('setValue', () => {
      config.filters.setValue(Array.from(filters).reverse())
      expect(Array.from(config.filters)).toStrictEqual(filters)
    })
    test('observe unobserve', () => {
      const callbacks = [jest.fn(), jest.fn()]
      config.filters.observe(callbacks[0])
      config.filters.observe(callbacks[1])
      config.filters.setValue([])
      config.filters.unobserve(callbacks[1])
      config.filters.setValue([])
      expect(callbacks[0]).toHaveBeenCalledTimes(2)
      expect(callbacks[1]).toHaveBeenCalledTimes(1)
    })
  })
  describe('filter changes updates json', () => {
    test('add', () => {
      config.filters.add(Filter.fromText('a'))
      expect(config.filtersObject).toStrictEqual({'a': {}})
    })
    test('remove', () => {
      const filter = Filter.fromText('a')
      config.filters.add(filter)
      config.filters.remove([filter])
      expect(config.filtersObject).toStrictEqual({})
    })
    test('update', () => {
      const filter = Filter.fromText('a')
      config.filters.add(filter)
      filter.hitCount++
      config.filters.update(filter)
      expect(config.filtersObject).toStrictEqual({'a': {hitCount: 1}})
    })
  })
  test('flushAllowHidden calls GM_setValue', () => {
    config.flushAllowHidden()
    expect(GM_setValue).toHaveBeenCalledTimes(1)
  })
  test('flushFilters calls GM_setValue', () => {
    config.flushFilters()
    expect(GM_setValue).toHaveBeenCalledTimes(1)
  })
})
