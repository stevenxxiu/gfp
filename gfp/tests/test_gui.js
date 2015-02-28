import Config from 'gfp/config';
import {SearchGui} from 'gfp/gui';
import {Filter} from 'gfp/filter';
import {clone} from 'gfp/tests/utils';

suite('SearchGui', () => {
  let self = {};
  let createSearchGui = (filters, nodeData) => {
    self.filters = filters.map(Filter.fromObject);
    self.nodeData = clone(nodeData);
    self.filtersProp = sinon.stub(Config, 'filters', {get: () => self.filters, set: sinon.stub()});
    self.searchGui = new SearchGui();
    self.searchGui.nodeData = nodeData;
    self.searchGui.filterResults();
  };
  setup(() => {
    window.GM_addStyle = () => {};
    self.allowHiddenProp = sinon.stub(Config, 'allowHidden', {get: () => true});
    self.hideResult = sinon.stub(SearchGui.prototype, 'hideResult');
  });
  teardown(() => {
    self.allowHiddenProp.restore();
    self.hideResult.restore();
    if(self.filtersProp)
      self.filtersProp.restore();
  });
  suite('filterResults', () => {
    suite('empty', () => {
      test('new results', () => {
        createSearchGui([], {*getChildren(){}, url: null, title: null, summary: null});
        assert.deepEqual(self.searchGui.nodeData, Object.assign({}, self.nodeData, {children: []}));
        sinon.assert.notCalled(self.filtersProp.set);
      });
      test('previous results', () => {
        createSearchGui([], {children: [], url: null, title: null, summary: null});
        assert.deepEqual(self.searchGui.nodeData, self.nodeData);
        sinon.assert.notCalled(self.filtersProp.set);
      });
    });
    suite('non-empty', () => {
      test('new results', () => {
        createSearchGui([{text: 'a1$$b1$$c1'}], {
          *getChildren(){
            yield {children: [], url: 'a1', title: 'b1', summary: 'c1'};
            yield {children: [], url: 'a2', title: 'b2', summary: 'c2'};
          }, url: null, title: null, summary: null
        });
        assert.deepEqual(self.searchGui.nodeData, Object.assign({}, self.nodeData, {
          children: [{children: [], url: 'a2', title: 'b2', summary: 'c2'}]
        }));
        sinon.assert.calledOnce(self.hideResult);
        sinon.assert.calledWithExactly(self.hideResult, self.nodeData.getChildren().next().value, self.filters[0]);
        sinon.assert.calledOnce(self.filtersProp.set);
      });
      test('previous results', () => {
        createSearchGui([{text: 'a1$$b1$$c1'}], {
          children: [
            {children: [], url: 'a1', title: 'b1', summary: 'c1'},
            {children: [], url: 'a2', title: 'b2', summary: 'c2'},
          ], url: null, title: null, summary: null
        });
        assert.deepEqual(self.searchGui.nodeData, Object.assign({}, self.nodeData, {
          children: [{children: [], url: 'a2', title: 'b2', summary: 'c2'}]
        }));
        sinon.assert.calledOnce(self.hideResult);
        sinon.assert.calledWithExactly(self.hideResult, self.nodeData.children[0], self.filters[0]);
        sinon.assert.calledOnce(self.filtersProp.set);
      });
      test('whitelist', () => {
        createSearchGui([{text: '@@a1$$b1$$c1'}], {
          children: [
            {children: [], url: 'a1', title: 'b1', summary: 'c1'},
            {children: [], url: 'a2', title: 'b2', summary: 'c2'},
          ], url: null, title: null, summary: null
        });
        assert.deepEqual(self.searchGui.nodeData, Object.assign({}, self.nodeData, {
          children: [{children: [], url: 'a2', title: 'b2', summary: 'c2'}]
        }));
        sinon.assert.notCalled(self.hideResult);
        sinon.assert.calledOnce(self.filtersProp.set);
      });
    });
  });
  test('addFromResult', () => {
    // XXX test filter is saved

  });
});
