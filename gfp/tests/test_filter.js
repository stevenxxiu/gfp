import {BlockingFilter, MultiRegExpFilter, RegExpFilter, WhitelistFilter} from 'gfp/filter';
import {ActiveFilter, InvalidFilter} from 'gfp/lib/filterClasses';

suite('Filter', () => {
  test('ActiveFilter toObject', () => {
    let filter = new ActiveFilter('text');
    filter._disabled = true;
    filter._hitCount = 1;
    filter._lastHit = 1;
    assert.deepEqual(filter.toObject(), {text: 'text', disabled: true, hitCount: 1, lastHit: 1});
  });
  test('InvalidFilter toObject', () => {
    let filter = new InvalidFilter('text');
    assert.deepEqual(filter.toObject(), {text: 'text'});
  });
});

suite('RegExpFilter', () => {
  test('fromParts', function(){
    let filter;

    filter = RegExpFilter.fromParts('a*b', '');
    assert.strictEqual(filter.regexp.toString(), /a.*b/i.toString());
    assert.isFalse(filter.matchCase);
    assert.isFalse(filter.collapse);

    filter = RegExpFilter.fromParts('/abc/', 'match_case,COLLAPSE');
    assert.strictEqual(filter.regexp.toString(), /abc/.toString());
    assert.isTrue(filter.matchCase);
    assert.isTrue(filter.collapse);
  });
  test('matches', function(){
    let filter = RegExpFilter.fromParts('a*c', '');
    assert.isTrue(filter.matches('abc'));
    assert.isFalse(filter.matches('b'));
  });
});

assert.multiRegExpFilter = function(src, dest, message){
  let res = src.toObject();
  res.filters = [];
  for(let filter of src.filters){
    if(filter === null){
      res.filters.push(null);
    }else{
      let obj = {};
      if(filter.text !== null)
        obj.text = filter.text;
      if(filter.collapse)
        obj.collapse = true;
      if(filter.matchCase)
        obj.matchCase = true;
      res.filters.push(obj);
    }
  }
  assert.deepEqual(res, dest, message);
};

suite('MultiRegExpFilter', () => {
  test('collapse', function(){
    let filter;

    filter = MultiRegExpFilter.fromText('a$COLLAPSE');
    assert.isTrue(filter.collapse);

    filter = MultiRegExpFilter.fromText('a$$b$COLLAPSE');
    assert.isTrue(filter.collapse);
  });
  test('fromText', function(){
    let filter;

    filter = MultiRegExpFilter.fromText('a');
    assert.instanceOf(filter, BlockingFilter);
    assert.multiRegExpFilter(filter, {text: 'a', filters: [{}]});

    filter = MultiRegExpFilter.fromText('@@a');
    assert.instanceOf(filter, WhitelistFilter);
    assert.multiRegExpFilter(filter, {text: '@@a', filters: [{}]});

    filter = MultiRegExpFilter.fromText('');
    assert.multiRegExpFilter(filter, {text: '', filters: []});

    filter = MultiRegExpFilter.fromText('a$MATCH_CASE');
    assert.multiRegExpFilter(filter, {text: 'a$MATCH_CASE', filters: [{matchCase: true}]});

    filter = MultiRegExpFilter.fromText('a$$');
    assert.multiRegExpFilter(filter, {text: 'a$$', filters: [{}]});

    filter = MultiRegExpFilter.fromText('a$$b$MATCH_CASE');
    assert.multiRegExpFilter(filter, {text: 'a$$b$MATCH_CASE', filters: [{}, {matchCase: true}]});

    filter = MultiRegExpFilter.fromText('a$$$$');
    assert.multiRegExpFilter(filter, {text: 'a$$$$', filters: [{}]});

    filter = MultiRegExpFilter.fromText('a$$$$b$MATCH_CASE');
    assert.multiRegExpFilter(filter, {text: 'a$$$$b$MATCH_CASE', filters: [{}, null, {matchCase: true}]});
  });
});
