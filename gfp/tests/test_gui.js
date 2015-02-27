import Config from 'gfp/config';
import {NodeData, SearchGui} from 'gfp/gui';
import {Filter} from 'gfp/filter';

suite('NodeData', () => {
  test('cache', () => {
    class TestData extends NodeData {
      *children(){yield 1; yield 2; yield 3;}
      url(){return 'url';}
    }
    let children = sinon.spy(TestData.prototype, 'children');
    let url = sinon.spy(TestData.prototype, 'url');
    let testData = new (NodeData.cache(TestData))();
    assert.deepEqual(testData.children, [1, 2, 3]);
    assert.deepEqual(testData.children, [1, 2, 3]);
    sinon.assert.calledOnce(children);
    assert.equal(testData.url, 'url');
    assert.equal(testData.url, 'url');
    sinon.assert.calledOnce(url);
  });
});

suite('SearchGui', () => {
  let self = {};
  let createSearchGui = (filters, nodeDatas) => {
    self.filtersProp = sinon.stub(Config, 'filters', {get: () => filters, set: sinon.stub()});
    self.searchGui = new SearchGui();
    self.searchGui.nodeDatas = nodeDatas;
    self.searchGui.filterResults(true);
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
    test('empty', () => {
      createSearchGui([], []);
      assert.deepEqual(self.searchGui.nodeDatas, []);
      sinon.assert.notCalled(self.filtersProp.set);
    });
    test('filtered', () => {
      createSearchGui([{text: 'a$$b$$c'}].map(Filter.fromObject), [{children: [], url: 'a', title: 'b', summary: 'c'}]);
      assert.deepEqual(self.searchGui.nodeDatas, []);
      sinon.assert.called(self.filtersProp.set);
    });
    test('not filtered', () => {
      // XXX

    });
  });
  test('addFromResult', () => {
    // XXX test filter is saved

  });
});
