import sinon from 'sinon'
import {assert} from 'chai'

import {MultiRegExpFilter, RegExpFilter} from 'gfp/filter'
import {CombinedMultiMatcher, MultiMatcher, SubMatcher} from 'gfp/matcher'

SubMatcher.prototype.toTestObject = function(){
  return Array.from(this.filterByKeyword.entries()).sort()
}

suite('SubMatcher', () => {
  let self = {}
  setup(() => {
    self.matcher = new SubMatcher()
  })
  test('constructor', () => {
    assert.equal(self.matcher.filterByKeyword.size, 0)
  })
  test('isSlowFilter', () => {
    assert.isTrue(SubMatcher.isSlowFilter(RegExpFilter.fromText('a')))
    assert.isFalse(SubMatcher.isSlowFilter(RegExpFilter.fromText(' aaa ')))
  })
  suite('add', () => {
    test('filters with the same keyword', () => {
      let filters = [' aaa ', ' aaa b', ' aaa c'].map(RegExpFilter.fromText)
      self.matcher.add(filters[0])
      self.matcher.add(filters[1])
      self.matcher.add(filters[2])
      assert.deepEqual(self.matcher.toTestObject(), [['aaa', [filters[0], filters[1], filters[2]]]])
    })
    test('prefer keywords with lower counts', () => {
      let filters = [' aaa ', ' aaa bbb ', ' aaa ccc '].map(RegExpFilter.fromText)
      self.matcher.add(filters[0])
      self.matcher.add(filters[1])
      self.matcher.add(filters[2])
      assert.deepEqual(self.matcher.toTestObject(), [['aaa', filters[0]], ['bbb', filters[1]], ['ccc', filters[2]]])
    })
    test('then prefer longer keywords', () => {
      let filter = RegExpFilter.fromText(' aaa bbbb ')
      self.matcher.add(filter)
      assert.deepEqual(self.matcher.toTestObject(), [['bbbb', filter]])
    })
    test('then prefer earlier keywords', () => {
      let filter = RegExpFilter.fromText(' aaa bbb ')
      self.matcher.add(filter)
      assert.deepEqual(self.matcher.toTestObject(), [['aaa', filter]])
    })
    test('regexp filters', () => {
      let filters = ['/a/', '/b/'].map(RegExpFilter.fromText)
      self.matcher.add(filters[0])
      self.matcher.add(filters[1])
      assert.deepEqual(self.matcher.toTestObject(), [['', [filters[0], filters[1]]]])
    })
  })
  suite('remove', () => {
    test('only filter', () => {
      let filter = RegExpFilter.fromText('a')
      self.matcher.add(filter)
      self.matcher.remove(filter)
      assert.deepEqual(self.matcher.toTestObject(), [])
    })
    test('first of two filters with the same keyword', () => {
      let filters = [' aaa ', ' aaa b'].map(RegExpFilter.fromText)
      self.matcher.add(filters[0])
      self.matcher.add(filters[1])
      self.matcher.remove(filters[0])
      assert.deepEqual(self.matcher.toTestObject(), [['aaa', filters[1]]])
    })
    test('second of two filters with the same keyword', () => {
      let filters = [' aaa ', ' aaa b'].map(RegExpFilter.fromText)
      self.matcher.add(filters[0])
      self.matcher.add(filters[1])
      self.matcher.remove(filters[1])
      assert.deepEqual(self.matcher.toTestObject(), [['aaa', filters[0]]])
    })
    test('one of three filters with the same keyword', () => {
      let filters = [' aaa ', ' aaa b', ' aaa c'].map(RegExpFilter.fromText)
      self.matcher.add(filters[0])
      self.matcher.add(filters[1])
      self.matcher.add(filters[2])
      self.matcher.remove(filters[2])
      assert.deepEqual(self.matcher.toTestObject(), [['aaa', [filters[0], filters[1]]]])
    })
    test('non-existent filter with a non-existent keyword', () => {
      let filters = [' aaa ', ' bbb '].map(RegExpFilter.fromText)
      self.matcher.add(filters[0])
      self.matcher.remove(filters[1])
      assert.deepEqual(self.matcher.toTestObject(), [['aaa', filters[0]]])
    })
    test('non-existent filter with a keyword used by a single filter', () => {
      let filters = [' aaa ', ' aaa b'].map(RegExpFilter.fromText)
      self.matcher.add(filters[0])
      self.matcher.remove(filters[1])
      assert.deepEqual(self.matcher.toTestObject(), [['aaa', filters[0]]])
    })
    test('non-existent filter with a keyword used by two filters', () => {
      let filters = [' aaa ', ' aaa b', ' aaa c'].map(RegExpFilter.fromText)
      self.matcher.add(filters[0])
      self.matcher.add(filters[1])
      self.matcher.remove(filters[2])
      assert.deepEqual(self.matcher.toTestObject(), [['aaa', [filters[0], filters[1]]]])
    })
  })
  test('hasFilter', () => assert.throws(() => self.matcher.hasFilter(), 'not implemented'))
  test('getKeywordForFilter', () => assert.throws(() => self.matcher.getKeywordForFilter(), 'not implemented'))
})

suite('MultiMatcher', () => {
  let self = {attrs: [0, 1]}
  setup(() => self.matcher = new MultiMatcher(2))
  test('constructor', () => {
    assert.equal(self.matcher.matchers.length, 2)
  })
  test('isSlowFilter', () => {
    assert.isTrue(MultiMatcher.isSlowFilter(MultiRegExpFilter.fromText('a$$ aaa ')))
    assert.isFalse(MultiMatcher.isSlowFilter(MultiRegExpFilter.fromText(' aaa $$ aaa ')))
  })
  test('add', () => {
    let filter = MultiRegExpFilter.fromText('a$$b')
    self.matcher.add(filter)
    assert.equal(self.matcher.matchers[0].toTestObject().length, 1)
    assert.equal(self.matcher.matchers[1].toTestObject().length, 1)
  })
  test('remove', () => {
    let filter = MultiRegExpFilter.fromText('a$$b')
    self.matcher.add(filter)
    self.matcher.remove(filter)
    assert.equal(self.matcher.matchers[0].toTestObject().length, 0)
    assert.equal(self.matcher.matchers[1].toTestObject().length, 0)
  })
  test('clear', () => {
    self.matcher.add(MultiRegExpFilter.fromText('a$$b'))
    self.matcher.clear()
    assert.equal(self.matcher.matchers[0].toTestObject().length, 0)
    assert.equal(self.matcher.matchers[1].toTestObject().length, 0)
  })
  suite('matchesAny', () => {
    suite('single filter', () => {
      let self = {attrs: [0, 1, 2, 3]}
      setup(() => self.matcher = new MultiMatcher(4))
      test('[0]', () => {
        let filter = MultiRegExpFilter.fromText('a')
        self.matcher.add(filter)
        assert.equal(self.matcher.matchesAny(['a', '', '', ''], self.attrs), filter)
        assert.isNull(self.matcher.matchesAny(['b', '', '', ''], self.attrs))
      })
      test('[1]', () => {
        let filter = MultiRegExpFilter.fromText('$$a')
        self.matcher.add(filter)
        assert.equal(self.matcher.matchesAny(['', 'a', '', ''], self.attrs), filter)
        assert.isNull(self.matcher.matchesAny(['', 'b', '', ''], self.attrs))
      })
      test('[0, 1]', () => {
        let filter = MultiRegExpFilter.fromText('a$$a')
        self.matcher.add(filter)
        assert.equal(self.matcher.matchesAny(['a', 'a', '', ''], self.attrs), filter)
        assert.isNull(self.matcher.matchesAny(['a', 'b', '', ''], self.attrs))
        assert.isNull(self.matcher.matchesAny(['b', 'a', '', ''], self.attrs))
      })
      test('[0, 2]', () => {
        let filter = MultiRegExpFilter.fromText('a$$$$a')
        self.matcher.add(filter)
        assert.equal(self.matcher.matchesAny(['a', '', 'a', ''], self.attrs), filter)
        assert.isNull(self.matcher.matchesAny(['a', '', 'b', ''], self.attrs))
        assert.isNull(self.matcher.matchesAny(['b', '', 'a', ''], self.attrs))
      })
      test('[0, 3]', () => {
        let filter = MultiRegExpFilter.fromText('a$$$$$$a')
        self.matcher.add(filter)
        assert.equal(self.matcher.matchesAny(['a', '', '', 'a'], self.attrs), filter)
        assert.isNull(self.matcher.matchesAny(['a', '', '', 'b'], self.attrs))
        assert.isNull(self.matcher.matchesAny(['b', '', '', 'a'], self.attrs))
      })
    })
    test('multiple filters', () => {
      let filters = ['a$$a', 'a$$b'].map(MultiRegExpFilter.fromText)
      self.matcher.add(filters[0])
      self.matcher.add(filters[1])
      assert.equal(self.matcher.matchesAny(['a', 'a'], self.attrs), filters[0])
      assert.equal(self.matcher.matchesAny(['a', 'b'], self.attrs), filters[1])
    })
  })
})

suite('CombinedMultiMatcher', () => {
  let self = {attrs: [0]}
  setup(() => self.matcher = new CombinedMultiMatcher(1))
  test('constructor', () => {
    let matcher = new CombinedMultiMatcher(2)
    assert.equal(matcher.blacklist.matchers.length, 2)
    assert.equal(matcher.whitelist.matchers.length, 2)
  })
  test('isSlowFilter', () => {
    assert.isTrue(CombinedMultiMatcher.isSlowFilter(MultiRegExpFilter.fromText('a$$ aaa ')))
    assert.isFalse(CombinedMultiMatcher.isSlowFilter(MultiRegExpFilter.fromText(' aaa $$ aaa ')))
  })
  suite('add', () => {
    test('blacklist', () => {
      self.matcher.add(MultiRegExpFilter.fromText('a'))
      assert.equal(self.matcher.blacklist.matchers[0].toTestObject().length, 1)
      assert.equal(self.matcher.whitelist.matchers[0].toTestObject().length, 0)
    })
    test('whitelist', () => {
      self.matcher.add(MultiRegExpFilter.fromText('@@a'))
      assert.equal(self.matcher.blacklist.matchers[0].toTestObject().length, 0)
      assert.equal(self.matcher.whitelist.matchers[0].toTestObject().length, 1)
    })
  })
  suite('remove', () => {
    test('blacklist', () => {
      let filter = MultiRegExpFilter.fromText('a')
      self.matcher.add(filter)
      self.matcher.remove(filter)
      assert.equal(self.matcher.blacklist.matchers[0].toTestObject().length, 0)
    })
    test('whitelist', () => {
      let filter = MultiRegExpFilter.fromText('@@a')
      self.matcher.add(filter)
      self.matcher.remove(filter)
      assert.equal(self.matcher.whitelist.matchers[0].toTestObject().length, 0)
    })
  })
  test('clear', () => {
    self.matcher.add(MultiRegExpFilter.fromText('a'))
    self.matcher.add(MultiRegExpFilter.fromText('@@a'))
    self.matcher.clear()
    assert.deepEqual(self.matcher.blacklist.matchers[0].toTestObject(), [])
    assert.deepEqual(self.matcher.whitelist.matchers[0].toTestObject(), [])
  })
  test('matchesAny', () => {
    let filter0 = MultiRegExpFilter.fromText('a')
    let filter1 = MultiRegExpFilter.fromText('@@b')
    self.matcher.add(filter0)
    self.matcher.add(filter1)
    assert.equal(self.matcher.matchesAny(['a'], self.attrs), filter0)
    assert.equal(self.matcher.matchesAny(['b'], self.attrs), filter1)
  })
})
