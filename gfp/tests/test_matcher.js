import {assert} from 'chai'

import {MultiRegExpFilter, RegExpFilter} from 'gfp/filter'
import {CombinedMultiMatcher, MultiMatcher, SubMatcher} from 'gfp/matcher'

SubMatcher.prototype.toTestObject = function(){
  return Array.from(this.filterByKeyword.entries()).sort()
}

suite('SubMatcher', () => {
  setup(() => this.matcher = new SubMatcher())
  test('constructor', () => {
    assert.equal(this.matcher.filterByKeyword.size, 0)
  })
  test('isSlowFilter', () => {
    assert.isTrue(SubMatcher.isSlowFilter(RegExpFilter.fromText('a')))
    assert.isFalse(SubMatcher.isSlowFilter(RegExpFilter.fromText(' aaa ')))
  })
  suite('add', () => {
    test('filters with the same keyword', () => {
      let filters = [' aaa ', ' aaa b', ' aaa c'].map(RegExpFilter.fromText)
      this.matcher.add(filters[0])
      this.matcher.add(filters[1])
      this.matcher.add(filters[2])
      assert.deepEqual(this.matcher.toTestObject(), [['aaa', [filters[0], filters[1], filters[2]]]])
    })
    test('prefer keywords with lower counts', () => {
      let filters = [' aaa ', ' aaa bbb ', ' aaa ccc '].map(RegExpFilter.fromText)
      this.matcher.add(filters[0])
      this.matcher.add(filters[1])
      this.matcher.add(filters[2])
      assert.deepEqual(this.matcher.toTestObject(), [['aaa', filters[0]], ['bbb', filters[1]], ['ccc', filters[2]]])
    })
    test('then prefer longer keywords', () => {
      let filter = RegExpFilter.fromText(' aaa bbbb ')
      this.matcher.add(filter)
      assert.deepEqual(this.matcher.toTestObject(), [['bbbb', filter]])
    })
    test('then prefer earlier keywords', () => {
      let filter = RegExpFilter.fromText(' aaa bbb ')
      this.matcher.add(filter)
      assert.deepEqual(this.matcher.toTestObject(), [['aaa', filter]])
    })
    test('regexp filters', () => {
      let filters = ['/a/', '/b/'].map(RegExpFilter.fromText)
      this.matcher.add(filters[0])
      this.matcher.add(filters[1])
      assert.deepEqual(this.matcher.toTestObject(), [['', [filters[0], filters[1]]]])
    })
  })
  suite('remove', () => {
    test('only filter', () => {
      let filter = RegExpFilter.fromText('a')
      this.matcher.add(filter)
      this.matcher.remove(filter)
      assert.deepEqual(this.matcher.toTestObject(), [])
    })
    test('first of two filters with the same keyword', () => {
      let filters = [' aaa ', ' aaa b'].map(RegExpFilter.fromText)
      this.matcher.add(filters[0])
      this.matcher.add(filters[1])
      this.matcher.remove(filters[0])
      assert.deepEqual(this.matcher.toTestObject(), [['aaa', filters[1]]])
    })
    test('second of two filters with the same keyword', () => {
      let filters = [' aaa ', ' aaa b'].map(RegExpFilter.fromText)
      this.matcher.add(filters[0])
      this.matcher.add(filters[1])
      this.matcher.remove(filters[1])
      assert.deepEqual(this.matcher.toTestObject(), [['aaa', filters[0]]])
    })
    test('one of three filters with the same keyword', () => {
      let filters = [' aaa ', ' aaa b', ' aaa c'].map(RegExpFilter.fromText)
      this.matcher.add(filters[0])
      this.matcher.add(filters[1])
      this.matcher.add(filters[2])
      this.matcher.remove(filters[2])
      assert.deepEqual(this.matcher.toTestObject(), [['aaa', [filters[0], filters[1]]]])
    })
    test('non-existent filter with a non-existent keyword', () => {
      let filters = [' aaa ', ' bbb '].map(RegExpFilter.fromText)
      this.matcher.add(filters[0])
      this.matcher.remove(filters[1])
      assert.deepEqual(this.matcher.toTestObject(), [['aaa', filters[0]]])
    })
    test('non-existent filter with a keyword used by a single filter', () => {
      let filters = [' aaa ', ' aaa b'].map(RegExpFilter.fromText)
      this.matcher.add(filters[0])
      this.matcher.remove(filters[1])
      assert.deepEqual(this.matcher.toTestObject(), [['aaa', filters[0]]])
    })
    test('non-existent filter with a keyword used by two filters', () => {
      let filters = [' aaa ', ' aaa b', ' aaa c'].map(RegExpFilter.fromText)
      this.matcher.add(filters[0])
      this.matcher.add(filters[1])
      this.matcher.remove(filters[2])
      assert.deepEqual(this.matcher.toTestObject(), [['aaa', [filters[0], filters[1]]]])
    })
  })
  test('hasFilter', () => assert.throws(() => this.matcher.hasFilter(), 'not implemented'))
  test('getKeywordForFilter', () => assert.throws(() => this.matcher.getKeywordForFilter(), 'not implemented'))
})

suite('MultiMatcher', () => {
  setup(() => {this.attrs = [0, 1]; this.matcher = new MultiMatcher(2)})
  test('constructor', () => {
    assert.equal(this.matcher.matchers.length, 2)
  })
  test('isSlowFilter', () => {
    assert.isTrue(MultiMatcher.isSlowFilter(MultiRegExpFilter.fromText('a$$ aaa ')))
    assert.isFalse(MultiMatcher.isSlowFilter(MultiRegExpFilter.fromText(' aaa $$ aaa ')))
  })
  test('add', () => {
    let filter = MultiRegExpFilter.fromText('a$$b')
    this.matcher.add(filter)
    assert.equal(this.matcher.matchers[0].toTestObject().length, 1)
    assert.equal(this.matcher.matchers[1].toTestObject().length, 1)
  })
  test('remove', () => {
    let filter = MultiRegExpFilter.fromText('a$$b')
    this.matcher.add(filter)
    this.matcher.remove(filter)
    assert.equal(this.matcher.matchers[0].toTestObject().length, 0)
    assert.equal(this.matcher.matchers[1].toTestObject().length, 0)
  })
  test('clear', () => {
    this.matcher.add(MultiRegExpFilter.fromText('a$$b'))
    this.matcher.clear()
    assert.equal(this.matcher.matchers[0].toTestObject().length, 0)
    assert.equal(this.matcher.matchers[1].toTestObject().length, 0)
  })
  suite('matchesAny', () => {
    suite('single filter', () => {
      setup(() => {this.attrs = [0, 1, 2, 3]; this.matcher = new MultiMatcher(4)})
      test('[0]', () => {
        let filter = MultiRegExpFilter.fromText('a')
        this.matcher.add(filter)
        assert.equal(this.matcher.matchesAny(['a', '', '', ''], this.attrs), filter)
        assert.isNull(this.matcher.matchesAny(['b', '', '', ''], this.attrs))
      })
      test('[1]', () => {
        let filter = MultiRegExpFilter.fromText('$$a')
        this.matcher.add(filter)
        assert.equal(this.matcher.matchesAny(['', 'a', '', ''], this.attrs), filter)
        assert.isNull(this.matcher.matchesAny(['', 'b', '', ''], this.attrs))
      })
      test('[0, 1]', () => {
        let filter = MultiRegExpFilter.fromText('a$$a')
        this.matcher.add(filter)
        assert.equal(this.matcher.matchesAny(['a', 'a', '', ''], this.attrs), filter)
        assert.isNull(this.matcher.matchesAny(['a', 'b', '', ''], this.attrs))
        assert.isNull(this.matcher.matchesAny(['b', 'a', '', ''], this.attrs))
      })
      test('[0, 2]', () => {
        let filter = MultiRegExpFilter.fromText('a$$$$a')
        this.matcher.add(filter)
        assert.equal(this.matcher.matchesAny(['a', '', 'a', ''], this.attrs), filter)
        assert.isNull(this.matcher.matchesAny(['a', '', 'b', ''], this.attrs))
        assert.isNull(this.matcher.matchesAny(['b', '', 'a', ''], this.attrs))
      })
      test('[0, 3]', () => {
        let filter = MultiRegExpFilter.fromText('a$$$$$$a')
        this.matcher.add(filter)
        assert.equal(this.matcher.matchesAny(['a', '', '', 'a'], this.attrs), filter)
        assert.isNull(this.matcher.matchesAny(['a', '', '', 'b'], this.attrs))
        assert.isNull(this.matcher.matchesAny(['b', '', '', 'a'], this.attrs))
      })
    })
    test('multiple filters', () => {
      let filters = ['a$$a', 'a$$b'].map(MultiRegExpFilter.fromText)
      this.matcher.add(filters[0])
      this.matcher.add(filters[1])
      assert.equal(this.matcher.matchesAny(['a', 'a'], this.attrs), filters[0])
      assert.equal(this.matcher.matchesAny(['a', 'b'], this.attrs), filters[1])
    })
  })
})

suite('CombinedMultiMatcher', () => {
  setup(() => {this.attrs = [0]; this.matcher = new CombinedMultiMatcher(1)})
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
      this.matcher.add(MultiRegExpFilter.fromText('a'))
      assert.equal(this.matcher.blacklist.matchers[0].toTestObject().length, 1)
      assert.equal(this.matcher.whitelist.matchers[0].toTestObject().length, 0)
    })
    test('whitelist', () => {
      this.matcher.add(MultiRegExpFilter.fromText('@@a'))
      assert.equal(this.matcher.blacklist.matchers[0].toTestObject().length, 0)
      assert.equal(this.matcher.whitelist.matchers[0].toTestObject().length, 1)
    })
  })
  suite('remove', () => {
    test('blacklist', () => {
      let filter = MultiRegExpFilter.fromText('a')
      this.matcher.add(filter)
      this.matcher.remove(filter)
      assert.equal(this.matcher.blacklist.matchers[0].toTestObject().length, 0)
    })
    test('whitelist', () => {
      let filter = MultiRegExpFilter.fromText('@@a')
      this.matcher.add(filter)
      this.matcher.remove(filter)
      assert.equal(this.matcher.whitelist.matchers[0].toTestObject().length, 0)
    })
  })
  test('clear', () => {
    this.matcher.add(MultiRegExpFilter.fromText('a'))
    this.matcher.add(MultiRegExpFilter.fromText('@@a'))
    this.matcher.clear()
    assert.deepEqual(this.matcher.blacklist.matchers[0].toTestObject(), [])
    assert.deepEqual(this.matcher.whitelist.matchers[0].toTestObject(), [])
  })
  test('matchesAny', () => {
    let filter0 = MultiRegExpFilter.fromText('a')
    let filter1 = MultiRegExpFilter.fromText('@@b')
    this.matcher.add(filter0)
    this.matcher.add(filter1)
    assert.equal(this.matcher.matchesAny(['a'], this.attrs), filter0)
    assert.equal(this.matcher.matchesAny(['b'], this.attrs), filter1)
  })
})
