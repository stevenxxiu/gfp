import {BlockingFilter, MultiRegExpFilter, RegExpFilter, WhitelistFilter} from 'gfp/filter';
import {ActiveFilter, InvalidFilter} from 'gfp/lib/filterClasses';
import QUnit from 'qunit';

QUnit.module('Filter');

QUnit.test('ActiveFilter toObject', function(assert){
  let filter = new ActiveFilter('text');
  filter._disabled = true;
  filter._hitCount = 1;
  filter._lastHit = 1;
  assert.deepEqual(filter.toObject(), {text: 'text', disabled: true, hitCount: 1, lastHit: 1});
});

QUnit.test('InvalidFilter toObject', function(assert){
  let filter = new InvalidFilter('text');
  assert.deepEqual(filter.toObject(), {text: 'text'});
});

QUnit.test('RegExpFilter fromParts', function(assert){
  let filter;

  filter = RegExpFilter.fromParts('a*b', '');
  assert.strictEqual(filter.regexp.toString(), /a.*b/i.toString());
  assert.strictEqual(filter.matchCase, false);
  assert.strictEqual(filter.collapse, false);

  filter = RegExpFilter.fromParts('/abc/', 'match_case,COLLAPSE');
  assert.strictEqual(filter.regexp.toString(), /abc/.toString());
  assert.strictEqual(filter.matchCase, true);
  assert.strictEqual(filter.collapse, true);
});

QUnit.test('RegExpFilter matches', function(assert){
  let filter = RegExpFilter.fromParts('a*c', '');
  assert.ok(filter.matches('abc'));
  assert.ok(!filter.matches('b'));
});

QUnit.extend(QUnit.assert, {
  multiRegExpFilter: function(src, dest, msg){
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
    QUnit.assert.deepEqual(res, dest, msg);
  }
});

QUnit.test('MultiRegExpFilter collapse', function(assert){
  let filter;

  filter = MultiRegExpFilter.fromText('a$COLLAPSE');
  assert.ok(filter.collapse === true);

  filter = MultiRegExpFilter.fromText('a$$b$COLLAPSE');
  assert.ok(filter.collapse === true);
});

QUnit.test('MultiRegExpFilter fromText', function(assert){
  let filter;

  filter = MultiRegExpFilter.fromText('a');
  assert.ok(filter instanceof BlockingFilter);
  assert.multiRegExpFilter(filter, {text: 'a', filters: [{}]});

  filter = MultiRegExpFilter.fromText('@@a');
  assert.ok(filter instanceof WhitelistFilter);
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
