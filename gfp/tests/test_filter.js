import {BlockingFilter, MultiRegExpFilter, RegExpFilter, WhitelistFilter} from 'gfp/filter';
import {ActiveFilter, InvalidFilter} from 'gfp/lib/filterClasses';

suite('Filter', () => {
  suite('toObject', () => {
    test('ActiveFilter', () => {
      let filter = new ActiveFilter('text');
      filter._disabled = true;
      filter._hitCount = 1;
      filter._lastHit = 1;
      assert.deepEqual(filter.toObject(), {text: 'text', disabled: true, hitCount: 1, lastHit: 1});
    });
    test('InvalidFilter', () => {
      let filter = new InvalidFilter('text');
      assert.deepEqual(filter.toObject(), {text: 'text'});
    });
  });
});

RegExpFilter.prototype.toTestObject = function(){
  let obj = {};
  if(this.regexp !== null)
    obj.regexp = this.regexp.toString();
  if(this.matchCase)
    obj.matchCase = true;
  if(this.collapse)
    obj.collapse = true;
  return obj;
};

suite('RegExpFilter', () => {
  suite('fromParts', () => {
    test('plain', () => {
      assert.deepEqual(RegExpFilter.fromParts('a*b', '').toTestObject(), {regexp: /a.*b/i.toString()});
      assert.deepEqual(RegExpFilter.fromParts('/a.*b/', '').toTestObject(), {regexp: /a.*b/i.toString()});
      assert.deepEqual(RegExpFilter.fromParts('/a.*b/', 'match_case,COLLAPSE').toTestObject(), {
        regexp: /a.*b/.toString(), matchCase: true, collapse: true
      });
    });
    test('types', () => {
      assert.instanceOf(RegExpFilter.fromParts('a', 'INVALID'), InvalidFilter);
    });
  });
  test('matches', () => {
    let filter = RegExpFilter.fromParts('a*c', '');
    assert.isTrue(filter.matches('abc'));
    assert.isFalse(filter.matches('b'));
  });
});

MultiRegExpFilter.prototype.toTestObject = function(){
  let obj = this.toObject();
  obj.filters = [];
  for(let subFilter of this.filters){
    let subObj = subFilter.toTestObject();
    delete subObj.regexp;
    if(subFilter.index)
      subObj.index = subFilter.index;
    if(subFilter.dataIndex)
      subObj.dataIndex = subFilter.dataIndex;
    obj.filters.push(subObj);
  }
  return obj;
};

suite('MultiRegExpFilter', () => {
  test('collapse', () => {
    assert.isFalse(MultiRegExpFilter.fromText('a').collapse);
    assert.isFalse(MultiRegExpFilter.fromText('a$$b').collapse);
    assert.isTrue(MultiRegExpFilter.fromText('a$COLLAPSE').collapse);
    assert.isTrue(MultiRegExpFilter.fromText('a$$b$COLLAPSE').collapse);
  });
  suite('fromText', () => {
    test('plain', () => {
      assert.deepEqual(MultiRegExpFilter.fromText('').toTestObject(), {text: '', filters: []});
      assert.deepEqual(MultiRegExpFilter.fromText('a').toTestObject(), {text: 'a', filters: [{}]});
      assert.deepEqual(MultiRegExpFilter.fromText('a$$').toTestObject(), {text: 'a$$', filters: [{}]});
      assert.deepEqual(MultiRegExpFilter.fromText('a$$$$b').toTestObject(), {
        text: 'a$$$$b', filters: [{}, {index: 2, dataIndex: 1}]
      });
    });
    test('options', () => {
      assert.deepEqual(MultiRegExpFilter.fromText('$MATCH_CASE').toTestObject(), {
        text: '$MATCH_CASE', filters: []
      });
      assert.deepEqual(MultiRegExpFilter.fromText('a$MATCH_CASE').toTestObject(), {
        text: 'a$MATCH_CASE', filters: [{matchCase: true}]
      });
      assert.deepEqual(MultiRegExpFilter.fromText('a$$b$MATCH_CASE').toTestObject(), {
        text: 'a$$b$MATCH_CASE', filters: [{}, {index: 1, dataIndex: 1, matchCase: true}]
      });
    });
    test('types', () => {
      assert.instanceOf(MultiRegExpFilter.fromText('a'), BlockingFilter);
      assert.instanceOf(MultiRegExpFilter.fromText('@@a'), WhitelistFilter);
      assert.instanceOf(MultiRegExpFilter.fromText('a$INVALID'), InvalidFilter);
    });
  });
});
