import config from 'gfp/config';
import {Filter} from 'gfp/filter';

suite('Config', () => {
  test('filter push updates json', () => {
    config.filters.push(Filter.fromText('a'));
    assert.deepEqual(config.filtersObject, {'a': {}});
  });
  test('filter remove updates json', () => {
    let filter = Filter.fromText('a');
    config.filters.push(filter);
    config.filters.remove(filter);
    assert.deepEqual(config.filtersObject, {});
  });
  test('filter update updates json', () => {
    let filter = Filter.fromText('a');
    config.filters.push(filter);
    filter.hitCount++;
    config.filters.update(filter);
    assert.deepEqual(config.filtersObject, {'a': {hitCount: 1}});
  });
  test('flushAllowHidden calls GM_setValue', () => {
    sinon.spy(window, 'GM_setValue');
    config.flushAllowHidden();
    assert.calledOnce(window.GM_setValue);
    window.GM_setValue.restore();
  });
  test('flushFilters calls GM_setValue', () => {
    sinon.spy(window, 'GM_setValue');
    config.flushFilters();
    assert.calledOnce(window.GM_setValue);
    window.GM_setValue.restore();
  });
});
