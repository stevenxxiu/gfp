import config from 'gfp/config';
import {NodeData, ResultsData, SearchGui} from 'gfp/gui';
import {CombinedMultiMatcher} from 'gfp/matcher';

suite('SearchGui', () => {
  let self = {};
  let createSearchGui = (filters, nodeData) => {
    sinon.stub(window, 'GM_getValue').withArgs('filters').returns(JSON.stringify(filters));
    config.constructor.call(config);
    self.searchGui = new SearchGui();
    self.searchGui.nodeData = nodeData;
  };
  setup(() => {
    sinon.stub(config, 'flushFilters');
    sinon.stub(SearchGui.prototype, 'hideResult');
    sinon.stub(SearchGui.prototype, 'addFilterLink');
    sinon.spy(CombinedMultiMatcher.prototype, 'matchesAny');
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
  teardown(() => {
    window.GM_getValue.restore();
    config.flushFilters.restore();
    SearchGui.prototype.hideResult.restore();
    SearchGui.prototype.addFilterLink.restore();
    CombinedMultiMatcher.prototype.matchesAny.restore();
  });
  suite('filterResults', () => {
    test('only processes new results when node is specified', () => {
      createSearchGui({}, self.existingData);
      let getChildren = sinon.stub(ResultsData.prototype, 'getChildren', self.newData.getChildren);
      self.searchGui.filterResults({});
      assert.callCount(CombinedMultiMatcher.prototype.matchesAny, 3);
      assert.equal(self.searchGui.nodeData.children.length, 3);
      getChildren.restore();
    });
    test('only processes existing results when node is not specified', () => {
      createSearchGui({}, self.existingData);
      self.searchGui.filterResults();
      assert.callCount(CombinedMultiMatcher.prototype.matchesAny, 3);
      assert.equal(self.searchGui.nodeData.children.length, 2);
    });
    test('config is not updated if there is no match', () => {
      createSearchGui({'a0$$b0$$c0': {}}, self.existingData);
      self.searchGui.filterResults();
      assert.notCalled(config.flushFilters);
    });
    test('config is updated on match', () => {
      createSearchGui({'a1$$b1$$c1': {}}, self.existingData);
      self.searchGui.filterResults();
      assert.equal(config.filters.get(0).hitCount, 1);
      assert.isAbove(config.filters.get(0).lastHit, 0);
      assert.calledOnce(config.flushFilters);
    });
    test('results are hidden on blacklist match', () => {
      createSearchGui({'a1$$b1$$c1': {}}, self.existingData);
      self.searchGui.filterResults();
      assert.calledOnce(self.searchGui.hideResult);
      assert.calledWithExactly(self.searchGui.hideResult, self.searchGui.nodeData.children[0], config.filters.get(0));
    });
    test('filter links are added on all other results', () => {
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
