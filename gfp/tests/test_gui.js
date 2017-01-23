import sinon from 'sinon'
import {assert} from 'chai'

import Config from 'gfp/config'
import {Filter} from 'gfp/filter'
import {NodeData, SearchGui} from 'gfp/gui'

suite('SearchGui', () => {
  this.sandbox = sinon.sandbox.create()
  let createSearchGui = (filters, nodeData) => {
    this.sandbox.stub(window, 'GM_getValue').withArgs('filters').returns(JSON.stringify(filters))
    this.config = new Config()
    this.searchGui = new SearchGui(this.NewData, this.config)
    this.searchGui.nodeData = nodeData
    this.sandbox.stub(this.searchGui, 'hideResult')
    this.sandbox.stub(this.searchGui, 'addFilterLink')
  }
  setup(() => {
    this.existingData = Object.assign(new NodeData(), {
      children: [
        Object.assign(new NodeData(), {url: 'a1', title: 'b1', summary: 'c1'}),
        Object.assign(new NodeData(), {url: 'a2', title: 'b2', summary: 'c2'}),
      ],
    })
    this.NewData = function(){return Object.assign(new NodeData(), {
      *getChildren(){
        yield Object.assign(new NodeData(), {url: 'a1', title: 'b1', summary: 'c1'})
        yield Object.assign(new NodeData(), {url: 'a2', title: 'b2', summary: 'c2'})
      },
    })}
  })
  teardown(() => this.sandbox.restore())
  suite('filter changes updates matcher', () => {
    test('push', () => {
      createSearchGui({}, {})
      sinon.spy(this.searchGui.matcher, 'add')
      let filter = Filter.fromText('a')
      this.config.filters.add(filter)
      assert.calledOnce(this.searchGui.matcher.add)
      assert.calledWithExactly(this.searchGui.matcher.add, filter)
    })
    test('remove', () => {
      createSearchGui({}, {})
      sinon.spy(this.searchGui.matcher, 'remove')
      let filter = Filter.fromText('a')
      this.config.filters.add(filter)
      this.config.filters.remove([filter])
      assert.calledOnce(this.searchGui.matcher.remove)
      assert.calledWithExactly(this.searchGui.matcher.remove, filter)
    })
  })
  suite('filterResults', () => {
    test('only processes new results when node is specified', () => {
      createSearchGui({}, this.existingData)
      this.sandbox.spy(this.searchGui.matcher, 'matchesAny')
      this.searchGui.filterResults({})
      assert.callCount(this.searchGui.matcher.matchesAny, 3)
      assert.equal(this.searchGui.nodeData.children.length, 3)
    })
    test('only processes existing results when node is not specified', () => {
      createSearchGui({}, this.existingData)
      this.sandbox.spy(this.searchGui.matcher, 'matchesAny')
      this.searchGui.filterResults()
      assert.callCount(this.searchGui.matcher.matchesAny, 3)
      assert.equal(this.searchGui.nodeData.children.length, 2)
    })
    test('config is not updated if there is no match', () => {
      createSearchGui({'a0$$b0$$c0': {}}, this.existingData)
      this.sandbox.spy(this.config.filters, 'update')
      this.sandbox.spy(this.config, 'flushFilters')
      this.searchGui.filterResults()
      assert.notCalled(this.config.filters.update)
      assert.notCalled(this.config.flushFilters)
    })
    test('config is updated on match', () => {
      createSearchGui({'a1$$b1$$c1': {}}, this.existingData)
      this.sandbox.spy(this.config.filters, 'update')
      this.sandbox.spy(this.config, 'flushFilters')
      this.searchGui.filterResults()
      assert.equal(this.config.filters._filters[0].hitCount, 1)
      assert.isAbove(this.config.filters._filters[0].lastHit, 0)
      assert.calledOnce(this.config.filters.update)
      assert.calledWithExactly(this.config.filters.update, this.config.filters._filters[0])
      assert.calledOnce(this.config.flushFilters)
    })
    test('blacklist matches hide results', () => {
      createSearchGui({'a1$$b1$$c1': {}}, this.existingData)
      this.searchGui.filterResults()
      assert.calledOnce(this.searchGui.hideResult)
      assert.calledWithExactly(
        this.searchGui.hideResult, this.searchGui.nodeData.children[0], this.config.filters._filters[0]
      )
    })
    test('filter links are added to shown results', () => {
      createSearchGui({'@@a1$$b1$$c1': {}}, this.existingData)
      this.searchGui.filterResults()
      assert.callCount(this.searchGui.addFilterLink, 2)
    })
    test('container is hidden if all its children are hidden', () => {
      createSearchGui({'a1$$b1$$c1': {}, 'a2$$b2$$c2': {}}, this.existingData)
      this.searchGui.filterResults()
      assert.callCount(this.searchGui.hideResult, 3)
      assert.calledWithExactly(this.searchGui.hideResult, this.searchGui.nodeData)
    })
  })
})
