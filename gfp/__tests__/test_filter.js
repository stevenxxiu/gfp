import { BlockingFilter, MultiRegExpFilter, RegExpFilter, WhitelistFilter } from 'gfp/filter'
import { ActiveFilter, Filter, InvalidFilter } from 'gfp/lib/filterClasses'

describe('Filter', () => {
  describe('fromObject', () => {
    test('ActiveFilter', () => {
      const filter = Filter.fromObject('a', {
        disabled: true,
        hitCount: 1,
        lastHit: 1,
      })
      expect(filter.disabled).toBe(true)
      expect(filter.hitCount).toBe(1)
      expect(filter.lastHit).toBe(1)
    })
    test('InvalidFilter', () => {
      expect(Filter.fromObject('a$invalid')).toBeInstanceOf(InvalidFilter)
    })
  })
  describe('toObject', () => {
    test('ActiveFilter', () => {
      const filter = new ActiveFilter('text')
      filter._disabled = true
      filter._hitCount = 1
      filter._lastHit = 1
      expect(filter.toObject()).toStrictEqual({
        disabled: true,
        hitCount: 1,
        lastHit: 1,
      })
    })
    test('InvalidFilter', () => {
      const filter = new InvalidFilter('text')
      expect(filter.toObject()).toStrictEqual({})
    })
  })
})

RegExpFilter.prototype.toTestObject = function () {
  const obj = {}
  if (this.regexp !== null) {
    obj.regexp = this.regexp.toString()
  }
  if (this.matchCase) {
    obj.matchCase = true
  }
  if (this.collapse) {
    obj.collapse = true
  }
  return obj
}

describe('RegExpFilter', () => {
  describe('fromParts', () => {
    test('plain', () => {
      expect(RegExpFilter.fromParts('a*b', '').toTestObject()).toStrictEqual({
        regexp: /a.*b/i.toString(),
      })
      expect(RegExpFilter.fromParts('/a.*b/', '').toTestObject()).toStrictEqual({ regexp: /a.*b/i.toString() })
      expect(RegExpFilter.fromParts('/a.*b/', 'match_case,COLLAPSE').toTestObject()).toStrictEqual({
        regexp: /a.*b/.toString(),
        matchCase: true,
        collapse: true,
      })
    })
    test('types', () => {
      expect(RegExpFilter.fromParts('a', 'invalid')).toBeInstanceOf(InvalidFilter)
    })
  })
  test('matches', () => {
    const filter = RegExpFilter.fromParts('a*c', '')
    expect(filter.matches('abc')).toBe(true)
    expect(filter.matches('b')).toBe(false)
  })
})

MultiRegExpFilter.prototype.toTestObject = function () {
  const obj = this.toObject()
  obj.filters = []
  for (const subFilter of this.filters) {
    const subObj = subFilter.toTestObject()
    delete subObj.regexp
    if (subFilter.index) {
      subObj.index = subFilter.index
    }
    if (subFilter.dataIndex) {
      subObj.dataIndex = subFilter.dataIndex
    }
    obj.filters.push(subObj)
  }
  return obj
}

describe('MultiRegExpFilter', () => {
  test('collapse', () => {
    expect(MultiRegExpFilter.fromText('a').collapse).toBe(false)
    expect(MultiRegExpFilter.fromText('a$$b').collapse).toBe(false)
    expect(MultiRegExpFilter.fromText('a$COLLAPSE').collapse).toBe(true)
    expect(MultiRegExpFilter.fromText('a$$b$COLLAPSE').collapse).toBe(true)
  })
  describe('fromText', () => {
    test('plain', () => {
      expect(MultiRegExpFilter.fromText('').toTestObject()).toStrictEqual({
        filters: [],
      })
      expect(MultiRegExpFilter.fromText('a').toTestObject()).toStrictEqual({
        filters: [{}],
      })
      expect(MultiRegExpFilter.fromText('a$$').toTestObject()).toStrictEqual({
        filters: [{}],
      })
      expect(MultiRegExpFilter.fromText('a$$$$b').toTestObject()).toStrictEqual({
        filters: [{}, { index: 2, dataIndex: 1 }],
      })
    })
    test('options', () => {
      expect(MultiRegExpFilter.fromText('$MATCH_CASE').toTestObject()).toStrictEqual({ filters: [] })
      expect(MultiRegExpFilter.fromText('a$MATCH_CASE').toTestObject()).toStrictEqual({
        filters: [{ matchCase: true }],
      })
      expect(MultiRegExpFilter.fromText('a$$b$MATCH_CASE').toTestObject()).toStrictEqual({
        filters: [{}, { index: 1, dataIndex: 1, matchCase: true }],
      })
    })
    test('types', () => {
      expect(MultiRegExpFilter.fromText('a')).toBeInstanceOf(BlockingFilter)
      expect(MultiRegExpFilter.fromText('@@a')).toBeInstanceOf(WhitelistFilter)
      expect(MultiRegExpFilter.fromText('a$invalid')).toBeInstanceOf(InvalidFilter)
    })
  })
})
