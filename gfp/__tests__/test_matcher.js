import {MultiRegExpFilter, RegExpFilter} from 'gfp/filter'
import {CombinedMultiMatcher, MultiMatcher, SubMatcher} from 'gfp/matcher'

SubMatcher.prototype.toTestObject = function(){
  return Array.from(this.filterByKeyword.entries()).sort()
}

describe('SubMatcher', () => {
  let matcher
  beforeEach(() => matcher = new SubMatcher())
  test('constructor_', () => {
    expect(matcher.filterByKeyword.size).toBe(0)
  })
  test('isSlowFilter', () => {
    expect(SubMatcher.isSlowFilter(RegExpFilter.fromText('a'))).toBe(true)
    expect(SubMatcher.isSlowFilter(RegExpFilter.fromText(' aaa '))).toBe(false)
  })
  describe('add', () => {
    test('filters with the same keyword', () => {
      const filters = [' aaa ', ' aaa b', ' aaa c'].map(RegExpFilter.fromText)
      matcher.add(filters[0])
      matcher.add(filters[1])
      matcher.add(filters[2])
      expect(matcher.toTestObject()).toStrictEqual([['aaa', [filters[0], filters[1], filters[2]]]])
    })
    test('prefer keywords with lower counts', () => {
      const filters = [' aaa ', ' aaa bbb ', ' aaa ccc '].map(RegExpFilter.fromText)
      matcher.add(filters[0])
      matcher.add(filters[1])
      matcher.add(filters[2])
      expect(matcher.toTestObject()).toStrictEqual([['aaa', filters[0]], ['bbb', filters[1]], ['ccc', filters[2]]])
    })
    test('then prefer longer keywords', () => {
      const filter = RegExpFilter.fromText(' aaa bbbb ')
      matcher.add(filter)
      expect(matcher.toTestObject()).toStrictEqual([['bbbb', filter]])
    })
    test('then prefer earlier keywords', () => {
      const filter = RegExpFilter.fromText(' aaa bbb ')
      matcher.add(filter)
      expect(matcher.toTestObject()).toStrictEqual([['aaa', filter]])
    })
    test('regexp filters', () => {
      const filters = ['/a/', '/b/'].map(RegExpFilter.fromText)
      matcher.add(filters[0])
      matcher.add(filters[1])
      expect(matcher.toTestObject()).toStrictEqual([['', [filters[0], filters[1]]]])
    })
  })
  describe('remove', () => {
    test('only filter', () => {
      const filter = RegExpFilter.fromText('a')
      matcher.add(filter)
      matcher.remove(filter)
      expect(matcher.toTestObject()).toStrictEqual([])
    })
    test('first of two filters with the same keyword', () => {
      const filters = [' aaa ', ' aaa b'].map(RegExpFilter.fromText)
      matcher.add(filters[0])
      matcher.add(filters[1])
      matcher.remove(filters[0])
      expect(matcher.toTestObject()).toStrictEqual([['aaa', filters[1]]])
    })
    test('second of two filters with the same keyword', () => {
      const filters = [' aaa ', ' aaa b'].map(RegExpFilter.fromText)
      matcher.add(filters[0])
      matcher.add(filters[1])
      matcher.remove(filters[1])
      expect(matcher.toTestObject()).toStrictEqual([['aaa', filters[0]]])
    })
    test('one of three filters with the same keyword', () => {
      const filters = [' aaa ', ' aaa b', ' aaa c'].map(RegExpFilter.fromText)
      matcher.add(filters[0])
      matcher.add(filters[1])
      matcher.add(filters[2])
      matcher.remove(filters[2])
      expect(matcher.toTestObject()).toStrictEqual([['aaa', [filters[0], filters[1]]]])
    })
    test('non-existent filter with a non-existent keyword', () => {
      const filters = [' aaa ', ' bbb '].map(RegExpFilter.fromText)
      matcher.add(filters[0])
      matcher.remove(filters[1])
      expect(matcher.toTestObject()).toStrictEqual([['aaa', filters[0]]])
    })
    test('non-existent filter with a keyword used by a single filter', () => {
      const filters = [' aaa ', ' aaa b'].map(RegExpFilter.fromText)
      matcher.add(filters[0])
      matcher.remove(filters[1])
      expect(matcher.toTestObject()).toStrictEqual([['aaa', filters[0]]])
    })
    test('non-existent filter with a keyword used by two filters', () => {
      const filters = [' aaa ', ' aaa b', ' aaa c'].map(RegExpFilter.fromText)
      matcher.add(filters[0])
      matcher.add(filters[1])
      matcher.remove(filters[2])
      expect(matcher.toTestObject()).toStrictEqual([['aaa', [filters[0], filters[1]]]])
    })
  })
  test('hasFilter', () => expect(() => matcher.hasFilter()).toThrow('not implemented'))
  test('getKeywordForFilter', () => expect(() => matcher.getKeywordForFilter()).toThrow('not implemented'))
})

describe('MultiMatcher', () => {
  let attrs, matcher
  beforeEach(() => {attrs = [0, 1]; matcher = new MultiMatcher(2)})
  test('constructor_', () => {
    expect(matcher.matchers.length).toBe(2)
  })
  test('isSlowFilter', () => {
    expect(MultiMatcher.isSlowFilter(MultiRegExpFilter.fromText('a$$ aaa '))).toBe(true)
    expect(MultiMatcher.isSlowFilter(MultiRegExpFilter.fromText(' aaa $$ aaa '))).toBe(false)
  })
  test('add', () => {
    const filter = MultiRegExpFilter.fromText('a$$b')
    matcher.add(filter)
    expect(matcher.matchers[0].toTestObject()).toHaveLength(1)
    expect(matcher.matchers[1].toTestObject()).toHaveLength(1)
  })
  test('remove', () => {
    const filter = MultiRegExpFilter.fromText('a$$b')
    matcher.add(filter)
    matcher.remove(filter)
    expect(matcher.matchers[0].toTestObject()).toHaveLength(0)
    expect(matcher.matchers[1].toTestObject()).toHaveLength(0)
  })
  test('clear', () => {
    matcher.add(MultiRegExpFilter.fromText('a$$b'))
    matcher.clear()
    expect(matcher.matchers[0].toTestObject()).toHaveLength(0)
    expect(matcher.matchers[1].toTestObject()).toHaveLength(0)
  })
  describe('matchesAny', () => {
    describe('single filter', () => {
      beforeEach(() => {attrs = [0, 1, 2, 3]; matcher = new MultiMatcher(4)})
      test('[0]', () => {
        const filter = MultiRegExpFilter.fromText('a')
        matcher.add(filter)
        expect(matcher.matchesAny(['a', '', '', ''], attrs)).toBe(filter)
        expect(matcher.matchesAny(['b', '', '', ''], attrs)).toBeNull()
      })
      test('[1]', () => {
        const filter = MultiRegExpFilter.fromText('$$a')
        matcher.add(filter)
        expect(matcher.matchesAny(['', 'a', '', ''], attrs)).toBe(filter)
        expect(matcher.matchesAny(['', 'b', '', ''], attrs)).toBeNull()
      })
      test('[0, 1]', () => {
        const filter = MultiRegExpFilter.fromText('a$$a')
        matcher.add(filter)
        expect(matcher.matchesAny(['a', 'a', '', ''], attrs)).toBe(filter)
        expect(matcher.matchesAny(['a', 'b', '', ''], attrs)).toBeNull()
        expect(matcher.matchesAny(['b', 'a', '', ''], attrs)).toBeNull()
      })
      test('[0, 2]', () => {
        const filter = MultiRegExpFilter.fromText('a$$$$a')
        matcher.add(filter)
        expect(matcher.matchesAny(['a', '', 'a', ''], attrs)).toBe(filter)
        expect(matcher.matchesAny(['a', '', 'b', ''], attrs)).toBeNull()
        expect(matcher.matchesAny(['b', '', 'a', ''], attrs)).toBeNull()
      })
      test('[0, 3]', () => {
        const filter = MultiRegExpFilter.fromText('a$$$$$$a')
        matcher.add(filter)
        expect(matcher.matchesAny(['a', '', '', 'a'], attrs)).toBe(filter)
        expect(matcher.matchesAny(['a', '', '', 'b'], attrs)).toBeNull()
        expect(matcher.matchesAny(['b', '', '', 'a'], attrs)).toBeNull()
      })
    })
    test('multiple filters', () => {
      const filters = ['a$$a', 'a$$b'].map(MultiRegExpFilter.fromText)
      matcher.add(filters[0])
      matcher.add(filters[1])
      expect(matcher.matchesAny(['a', 'a'], attrs)).toBe(filters[0])
      expect(matcher.matchesAny(['a', 'b'], attrs)).toBe(filters[1])
    })
  })
})

describe('CombinedMultiMatcher', () => {
  let attrs, matcher
  beforeEach(() => {attrs = [0]; matcher = new CombinedMultiMatcher(1)})
  test('constructor_', () => {
    const matcher = new CombinedMultiMatcher(2)
    expect(matcher.blacklist.matchers).toHaveLength(2)
    expect(matcher.whitelist.matchers).toHaveLength(2)
  })
  test('isSlowFilter', () => {
    expect(CombinedMultiMatcher.isSlowFilter(MultiRegExpFilter.fromText('a$$ aaa '))).toBe(true)
    expect(CombinedMultiMatcher.isSlowFilter(MultiRegExpFilter.fromText(' aaa $$ aaa '))).toBe(false)
  })
  describe('add', () => {
    test('blacklist', () => {
      matcher.add(MultiRegExpFilter.fromText('a'))
      expect(matcher.blacklist.matchers[0].toTestObject()).toHaveLength(1)
      expect(matcher.whitelist.matchers[0].toTestObject()).toHaveLength(0)
    })
    test('whitelist', () => {
      matcher.add(MultiRegExpFilter.fromText('@@a'))
      expect(matcher.blacklist.matchers[0].toTestObject()).toHaveLength(0)
      expect(matcher.whitelist.matchers[0].toTestObject()).toHaveLength(1)
    })
  })
  describe('remove', () => {
    test('blacklist', () => {
      const filter = MultiRegExpFilter.fromText('a')
      matcher.add(filter)
      matcher.remove(filter)
      expect(matcher.blacklist.matchers[0].toTestObject()).toHaveLength(0)
    })
    test('whitelist', () => {
      const filter = MultiRegExpFilter.fromText('@@a')
      matcher.add(filter)
      matcher.remove(filter)
      expect(matcher.whitelist.matchers[0].toTestObject()).toHaveLength(0)
    })
  })
  test('clear', () => {
    matcher.add(MultiRegExpFilter.fromText('a'))
    matcher.add(MultiRegExpFilter.fromText('@@a'))
    matcher.clear()
    expect(matcher.blacklist.matchers[0].toTestObject()).toStrictEqual([])
    expect(matcher.whitelist.matchers[0].toTestObject()).toStrictEqual([])
  })
  test('matchesAny', () => {
    const filter0 = MultiRegExpFilter.fromText('a')
    const filter1 = MultiRegExpFilter.fromText('@@b')
    matcher.add(filter0)
    matcher.add(filter1)
    expect(matcher.matchesAny(['a'], attrs)).toBe(filter0)
    expect(matcher.matchesAny(['b'], attrs)).toBe(filter1)
  })
})
