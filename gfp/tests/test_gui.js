import Config from 'gfp/config';
import {NodeData, ResultsData, SearchGui} from 'gfp/gui';
import {Filter} from 'gfp/filter';
import {CombinedMultiMatcher} from 'gfp/matcher';

suite('SearchGui', () => {
  let self = {};
  let createSearchGui = (filters, nodeData) => {
    self.filters = filters.map(Filter.fromObject);
    self.filtersProp = sinon.stub(Config, 'filters', {get: () => self.filters, set: sinon.stub()});
    self.searchGui = new SearchGui();
    self.searchGui.nodeData = nodeData;
  };
  setup(() => {
    window.GM_addStyle = () => {};
    self.allowHiddenProp = sinon.stub(Config, 'allowHidden', {get: () => true});
    self.hideResult = sinon.stub(SearchGui.prototype, 'hideResult');
    self.addFilterLink = sinon.stub(SearchGui.prototype, 'addFilterLink');
    self.matchesAny = sinon.spy(CombinedMultiMatcher.prototype, 'matchesAny');
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
    self.allowHiddenProp.restore();
    self.hideResult.restore();
    self.addFilterLink.restore();
    if(self.filtersProp)
      self.filtersProp.restore();
    self.matchesAny.restore();
  });
  suite('filterResults', () => {
    test('only processes new results when node is specified', () => {
      createSearchGui([], self.existingData);
      let getChildren = sinon.stub(ResultsData.prototype, 'getChildren', self.newData.getChildren);
      self.searchGui.filterResults({});
      sinon.assert.callCount(self.matchesAny, 3);
      assert.equal(self.searchGui.nodeData.children.length, 3);
      getChildren.restore();
    });
    test('only processes existing results when node is not specified', () => {
      createSearchGui([], self.existingData);
      self.searchGui.filterResults();
      sinon.assert.callCount(self.matchesAny, 3);
      assert.equal(self.searchGui.nodeData.children.length, 2);
    });
    test('config is not updated if there is no match', () => {
      createSearchGui([{text: 'a0$$b0$$c0'}], self.existingData);
      self.searchGui.filterResults();
      sinon.assert.notCalled(self.filtersProp.set);
    });
    test('config is updated on match', () => {
      createSearchGui([{text: 'a1$$b1$$c1'}], self.existingData);
      self.searchGui.filterResults();
      assert.equal(self.filters[0].hitCount, 1);
      assert.isAbove(self.filters[0].lastHit, 0);
      sinon.assert.calledOnce(self.filtersProp.set);
    });
    test('results are hidden on blacklist match', () => {
      createSearchGui([{text: 'a1$$b1$$c1'}], self.existingData);
      self.searchGui.filterResults();
      sinon.assert.calledOnce(self.hideResult);
      sinon.assert.calledWithExactly(self.hideResult, self.searchGui.nodeData.children[0], self.filters[0]);
    });
    test('filter links are added on all other results', () => {
      createSearchGui([{text: '@@a1$$b1$$c1'}], self.existingData);
      self.searchGui.filterResults();
      sinon.assert.callCount(self.addFilterLink, 2);
    });
    test('container is hidden if all its children are hidden', () => {
      createSearchGui([{text: 'a1$$b1$$c1'}, {text: 'a2$$b2$$c2'}], self.existingData);
      self.searchGui.filterResults();
      sinon.assert.callCount(self.hideResult, 3);
      sinon.assert.calledWithExactly(self.hideResult, self.searchGui.nodeData);
    });
  });
});
