import {MultiRegExpFilter, RegExpFilter} from 'gfp/filter';
import {CombinedMultiMatcher, MultiMatcher, SubMatcher} from 'gfp/matcher';

SubMatcher.prototype.toTestObject = function(){
  return Array.from(this.filterByKeyword.entries()).sort();
};

suite('Submatcher', () => {
  test('not implemented', () => {
    let subMatcher = new SubMatcher();
    assert.throws(() => subMatcher.remove());
    assert.throws(() => subMatcher.hasFilter());
    assert.throws(() => subMatcher.getKeywordForFilter());
  });
  test('isSlowFilter', () => {
    assert.isTrue(SubMatcher.isSlowFilter(RegExpFilter.fromText('a')));
    assert.isFalse(SubMatcher.isSlowFilter(RegExpFilter.fromText(' aaa ')));
  });
});

suite('MultiMatcher', () => {
  test('constructor', () => {
    let matcher = new MultiMatcher(2);
    assert.equal(matcher.matchers.length, 2);
  });
  suite('add', () => {
    test('text', () => {
      let matcher = new MultiMatcher(1);
      let filter0 = MultiRegExpFilter.fromText(' aaa ');
      matcher.add(filter0);
      assert.deepEqual(matcher.matchers[0].toTestObject(), [['aaa', filter0.filters[0]]]);
      let filter1 = MultiRegExpFilter.fromText(' aaa bbb ');
      matcher.add(filter1);
      assert.deepEqual(matcher.matchers[0].toTestObject(), [['aaa', [filter0.filters[0], filter1.filters[0]]]]);
      let filter2 = MultiRegExpFilter.fromText(' aaa ccc ');
      matcher.add(filter2);
      assert.deepEqual(matcher.matchers[0].toTestObject(), [
        ['aaa', [filter0.filters[0], filter1.filters[0], filter2.filters[0]]]
      ]);
    });
    test('regexp', () => {
      let matcher = new MultiMatcher(1);
      let filter = MultiRegExpFilter.fromText('/a/');
      matcher.add(filter);
      assert.deepEqual(matcher.matchers[0].toTestObject(), [['', filter.filters[0]]]);
    });
    test('multi filter', () => {
      let matcher = new MultiMatcher(2);
      let filter0 = MultiRegExpFilter.fromText(' aaa ');
      let filter1 = MultiRegExpFilter.fromText('$$ bbb ');
      matcher.add(filter0);
      matcher.add(filter1);
      assert.deepEqual(matcher.matchers[0].toTestObject(), [['aaa', filter0.filters[0]]]);
      assert.deepEqual(matcher.matchers[1].toTestObject(), [['bbb', filter1.filters[0]]]);
    });
    test('clear', () => {
      let matcher = new MultiMatcher(2);
      matcher.add(MultiRegExpFilter.fromText('a$$b'));
      matcher.clear();
      assert.deepEqual(matcher.matchers[0].toTestObject(), []);
      assert.deepEqual(matcher.matchers[1].toTestObject(), []);
    });
  });
  test('isSlowFilter', () => {
    assert.isTrue(MultiMatcher.isSlowFilter(MultiRegExpFilter.fromText('a$$ aaa ')));
    assert.isFalse(MultiMatcher.isSlowFilter(MultiRegExpFilter.fromText(' aaa $$ aaa ')));
  });
  suite('matchesAny', () => {
    suite('single filter', () => {
      let matcher;
      let attrs = [0, 1, 2, 3];
      setup(() => matcher = new MultiMatcher(4));
      test('[0]', () => {
        let filter = MultiRegExpFilter.fromText('a');
        matcher.add(filter);
        assert.equal(matcher.matchesAny(['a', '', '', ''], attrs), filter);
        assert.isNull(matcher.matchesAny(['b', '', '', ''], attrs));
      });
      test('[1]', () => {
        let filter = MultiRegExpFilter.fromText('$$a');
        matcher.add(filter);
        assert.equal(matcher.matchesAny(['', 'a', '', ''], attrs), filter);
        assert.isNull(matcher.matchesAny(['', 'b', '', ''], attrs));
      });
      test('[0, 1]', () => {
        let filter = MultiRegExpFilter.fromText('a$$a');
        matcher.add(filter);
        assert.equal(matcher.matchesAny(['a', 'a', '', ''], attrs), filter);
        assert.isNull(matcher.matchesAny(['a', 'b', '', ''], attrs));
        assert.isNull(matcher.matchesAny(['b', 'a', '', ''], attrs));
      });
      test('[0, 2]', () => {
        let filter = MultiRegExpFilter.fromText('a$$$$a');
        matcher.add(filter);
        assert.equal(matcher.matchesAny(['a', '', 'a', ''], attrs), filter);
        assert.isNull(matcher.matchesAny(['a', '', 'b', ''], attrs));
        assert.isNull(matcher.matchesAny(['b', '', 'a', ''], attrs));
      });
      test('[0, 3]', () => {
        let filter = MultiRegExpFilter.fromText('a$$$$$$a');
        matcher.add(filter);
        assert.equal(matcher.matchesAny(['a', '', '', 'a'], attrs), filter);
        assert.isNull(matcher.matchesAny(['a', '', '', 'b'], attrs));
        assert.isNull(matcher.matchesAny(['b', '', '', 'a'], attrs));
      });
    });
    test('multiple filters', () => {
      let matcher = new MultiMatcher(2);
      let attrs = [0, 1];
      let filter0 = MultiRegExpFilter.fromText('a$$a');
      let filter1 = MultiRegExpFilter.fromText('a$$b');
      matcher.add(filter0);
      matcher.add(filter1);
      assert.equal(matcher.matchesAny(['a', 'a'], attrs), filter0);
      assert.equal(matcher.matchesAny(['a', 'b'], attrs), filter1);
    });
  });
});

suite('CombinedMultiMatcher', () => {
  test('constructor', () => {
    let matcher = new CombinedMultiMatcher(2);
    assert.equal(matcher.blacklist.matchers.length, 2);
    assert.equal(matcher.whitelist.matchers.length, 2);
  });
  test('clear', () => {
    let matcher = new CombinedMultiMatcher(1);
    matcher.add(MultiRegExpFilter.fromText('a'));
    matcher.add(MultiRegExpFilter.fromText('@@a'));
    matcher.clear();
    assert.equal(matcher.blacklist.matchers[0].toTestObject().length, 0);
    assert.equal(matcher.whitelist.matchers[0].toTestObject().length, 0);
  });
  suite('add', () => {
    let matcher;
    setup(() => matcher = new CombinedMultiMatcher(1));
    test('blacklist', () => {
      matcher.add(MultiRegExpFilter.fromText('a'));
      assert.equal(matcher.blacklist.matchers[0].toTestObject().length, 1);
      assert.equal(matcher.whitelist.matchers[0].toTestObject().length, 0);
    });
    test('whitelist', () => {
      matcher.add(MultiRegExpFilter.fromText('@@a'));
      assert.equal(matcher.blacklist.matchers[0].toTestObject().length, 0);
      assert.equal(matcher.whitelist.matchers[0].toTestObject().length, 1);
    });
  });
  test('isSlowFilter', () => {
    assert.isTrue(CombinedMultiMatcher.isSlowFilter(MultiRegExpFilter.fromText('a$$ aaa ')));
    assert.isFalse(CombinedMultiMatcher.isSlowFilter(MultiRegExpFilter.fromText(' aaa $$ aaa ')));
  });
  test('matchesAny', () => {
    let matcher = new CombinedMultiMatcher(1);
    let attrs = [0];
    let filter0 = MultiRegExpFilter.fromText('a');
    let filter1 = MultiRegExpFilter.fromText('@@b');
    matcher.add(filter0);
    matcher.add(filter1);
    assert.equal(matcher.matchesAny(['a'], attrs), filter0);
    assert.equal(matcher.matchesAny(['b'], attrs), filter1);
  });
});
