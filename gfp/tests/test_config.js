import config from 'gfp/config';
import {Filter} from 'gfp/filter';

suite('Config', () => {
  let self = {sandbox: sinon.sandbox.create()};
  teardown(() => self.sandbox.restore());
  suite('filter changes updates json', () => {
    test('push', () => {
      config.filters.push(Filter.fromText('a'));
      assert.deepEqual(config.filtersObject, {'a': {}});
    });
    test('remove', () => {
      let filter = Filter.fromText('a');
      config.filters.push(filter);
      config.filters.remove(filter);
      assert.deepEqual(config.filtersObject, {});
    });
    test('update', () => {
      let filter = Filter.fromText('a');
      config.filters.push(filter);
      filter.hitCount++;
      config.filters.update(filter);
      assert.deepEqual(config.filtersObject, {'a': {hitCount: 1}});
    });
  });
  test('flushAllowHidden calls GM_setValue', () => {
    self.sandbox.spy(window, 'GM_setValue');
    config.flushAllowHidden();
    assert.calledOnce(window.GM_setValue);
  });
  test('flushFilters calls GM_setValue', () => {
    self.sandbox.spy(window, 'GM_setValue');
    config.flushFilters();
    assert.calledOnce(window.GM_setValue);
  });
});
