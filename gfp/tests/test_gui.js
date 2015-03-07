import config from 'gfp/config';
import {Filter} from 'gfp/filter';
import {NodeData, ResultsData, SearchGui} from 'gfp/gui';

suite('SearchGui', () => {
  let self = {sandbox: sinon.sandbox.create()};
  let createSearchGui = (filters, nodeData) => {
    self.sandbox.stub(window, 'GM_getValue').withArgs('filters').returns(JSON.stringify(filters));
    config.constructor.call(config);
    self.searchGui = new SearchGui();
    self.searchGui.nodeData = nodeData;
    self.sandbox.stub(self.searchGui, 'hideResult');
    self.sandbox.stub(self.searchGui, 'addFilterLink');
  };
  setup(() => {
    self.existingData = Object.assign(new NodeData(), {
      children: [
        Object.assign(new NodeData(), {url: 'a1', title: 'b1', summary: 'c1'}),
        Object.assign(new NodeData(), {url: 'a2', title: 'b2', summary: 'c2'}),
      ]
    });
    self.newData = Object.assign(new NodeData(), {
      *getChildren(){
        yield Object.assign(new NodeData(), {url: 'a1', title: 'b1', summary: 'c1'});
        yield Object.assign(new NodeData(), {url: 'a2', title: 'b2', summary: 'c2'});
      }
    });
  });
  teardown(() => self.sandbox.restore());
  suite('filter changes updates matcher', () => {
    test('push', () => {
      createSearchGui({}, {});
      sinon.spy(self.searchGui.matcher, 'add');
      let filter = Filter.fromText('a');
      config.filters.push(filter);
      assert.calledOnce(self.searchGui.matcher.add);
      assert.calledWithExactly(self.searchGui.matcher.add, filter);
    });
    test('remove', () => {
      createSearchGui({}, {});
      sinon.spy(self.searchGui.matcher, 'remove');
      let filter = Filter.fromText('a');
      config.filters.push(filter);
      config.filters.remove(filter);
      assert.calledOnce(self.searchGui.matcher.remove);
      assert.calledWithExactly(self.searchGui.matcher.remove, filter);
    });
  });
  suite('filterResults', () => {
    test('only processes new results when node is specified', () => {
      createSearchGui({}, self.existingData);
      self.sandbox.spy(self.searchGui.matcher, 'matchesAny');
      self.sandbox.stub(ResultsData.prototype, 'getChildren', self.newData.getChildren);
      self.searchGui.filterResults({});
      assert.callCount(self.searchGui.matcher.matchesAny, 3);
      assert.equal(self.searchGui.nodeData.children.length, 3);
    });
    test('only processes existing results when node is not specified', () => {
      createSearchGui({}, self.existingData);
      self.sandbox.spy(self.searchGui.matcher, 'matchesAny');
      self.searchGui.filterResults();
      assert.callCount(self.searchGui.matcher.matchesAny, 3);
      assert.equal(self.searchGui.nodeData.children.length, 2);
    });
    test('config is not updated if there is no match', () => {
      createSearchGui({'a0$$b0$$c0': {}}, self.existingData);
      self.sandbox.stub(config, 'flushFilters');
      self.searchGui.filterResults();
      assert.notCalled(config.flushFilters);
    });
    test('config is updated on match', () => {
      createSearchGui({'a1$$b1$$c1': {}}, self.existingData);
      self.sandbox.stub(config, 'flushFilters');
      self.searchGui.filterResults();
      assert.equal(config.filters.get(0).hitCount, 1);
      assert.isAbove(config.filters.get(0).lastHit, 0);
      assert.calledOnce(config.flushFilters);
    });
    test('blacklist matches hide results', () => {
      createSearchGui({'a1$$b1$$c1': {}}, self.existingData);
      self.searchGui.filterResults();
      assert.calledOnce(self.searchGui.hideResult);
      assert.calledWithExactly(self.searchGui.hideResult, self.searchGui.nodeData.children[0], config.filters.get(0));
    });
    test('filter links are added to shown results', () => {
      createSearchGui({'@@a1$$b1$$c1': {}}, self.existingData);
      self.searchGui.filterResults();
      assert.callCount(self.searchGui.addFilterLink, 2);
    });
    test('container is hidden if all its children are hidden', () => {
      createSearchGui({'a1$$b1$$c1': {}, 'a2$$b2$$c2': {}}, self.existingData);
      self.searchGui.filterResults();
      assert.callCount(self.searchGui.hideResult, 3);
      assert.calledWithExactly(self.searchGui.hideResult, self.searchGui.nodeData);
    });
  });
});
