import Config from 'gfp/config';
import {SearchGui} from 'gfp/gui';
import {Filter} from 'gfp/filter';

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
