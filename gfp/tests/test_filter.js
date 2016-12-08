import {assert} from 'chai'

import {BlockingFilter, MultiRegExpFilter, RegExpFilter, WhitelistFilter} from 'gfp/filter'
import {ActiveFilter, Filter, InvalidFilter} from 'gfp/lib/filterClasses'

suite('Filter', () => {
  suite('fromObject', () => {
    test('ActiveFilter', () => {
      let filter = Filter.fromObject('a', {disabled: true, hitCount: 1, lastHit: 1})
      assert.isTrue(filter.disabled)
      assert.equal(filter.hitCount, 1)
      assert.equal(filter.lastHit, 1)
    })
    test('InvalidFilter', () => {
      assert.instanceOf(Filter.fromObject('a$invalid'), InvalidFilter)
    })
  })
  suite('toObject', () => {
    test('ActiveFilter', () => {
      let filter = new ActiveFilter('text')
      filter._disabled = true
      filter._hitCount = 1
      filter._lastHit = 1
      assert.deepEqual(filter.toObject(), {disabled: true, hitCount: 1, lastHit: 1})
    })
    test('InvalidFilter', () => {
      let filter = new InvalidFilter('text')
      assert.deepEqual(filter.toObject(), {})
    })
  })
})

RegExpFilter.prototype.toTestObject = function(){
  let obj = {}
  if(this.regexp !== null)
    obj.regexp = this.regexp.toString()
  if(this.matchCase)
    obj.matchCase = true
  if(this.collapse)
    obj.collapse = true
  return obj
}

suite('RegExpFilter', () => {
  suite('fromParts', () => {
    test('plain', () => {
      assert.deepEqual(RegExpFilter.fromParts('a*b', '').toTestObject(), {regexp: /a.*b/i.toString()})
      assert.deepEqual(RegExpFilter.fromParts('/a.*b/', '').toTestObject(), {regexp: /a.*b/i.toString()})
      assert.deepEqual(RegExpFilter.fromParts('/a.*b/', 'match_case,COLLAPSE').toTestObject(), {
        regexp: /a.*b/.toString(), matchCase: true, collapse: true,
      })
    })
    test('types', () => {
      assert.instanceOf(RegExpFilter.fromParts('a', 'invalid'), InvalidFilter)
    })
  })
  test('matches', () => {
    let filter = RegExpFilter.fromParts('a*c', '')
    assert.isTrue(filter.matches('abc'))
    assert.isFalse(filter.matches('b'))
  })
})

MultiRegExpFilter.prototype.toTestObject = function(){
  let obj = this.toObject()
  obj.filters = []
  for(let subFilter of this.filters){
    let subObj = subFilter.toTestObject()
    delete subObj.regexp
    if(subFilter.index)
      subObj.index = subFilter.index
    if(subFilter.dataIndex)
      subObj.dataIndex = subFilter.dataIndex
    obj.filters.push(subObj)
  }
  return obj
}

suite('MultiRegExpFilter', () => {
  test('collapse', () => {
    assert.isFalse(MultiRegExpFilter.fromText('a').collapse)
    assert.isFalse(MultiRegExpFilter.fromText('a$$b').collapse)
    assert.isTrue(MultiRegExpFilter.fromText('a$COLLAPSE').collapse)
    assert.isTrue(MultiRegExpFilter.fromText('a$$b$COLLAPSE').collapse)
  })
  suite('fromText', () => {
    test('plain', () => {
      assert.deepEqual(MultiRegExpFilter.fromText('').toTestObject(), {filters: []})
      assert.deepEqual(MultiRegExpFilter.fromText('a').toTestObject(), {filters: [{}]})
      assert.deepEqual(MultiRegExpFilter.fromText('a$$').toTestObject(), {filters: [{}]})
      assert.deepEqual(MultiRegExpFilter.fromText('a$$$$b').toTestObject(), {filters: [{}, {index: 2, dataIndex: 1}]})
    })
    test('options', () => {
      assert.deepEqual(MultiRegExpFilter.fromText('$MATCH_CASE').toTestObject(), {filters: []})
      assert.deepEqual(MultiRegExpFilter.fromText('a$MATCH_CASE').toTestObject(), {filters: [{matchCase: true}]})
      assert.deepEqual(MultiRegExpFilter.fromText('a$$b$MATCH_CASE').toTestObject(), {
        filters: [{}, {index: 1, dataIndex: 1, matchCase: true}],
      })
    })
    test('types', () => {
      assert.instanceOf(MultiRegExpFilter.fromText('a'), BlockingFilter)
      assert.instanceOf(MultiRegExpFilter.fromText('@@a'), WhitelistFilter)
      assert.instanceOf(MultiRegExpFilter.fromText('a$invalid'), InvalidFilter)
    })
  })
})
