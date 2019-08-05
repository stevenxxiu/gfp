import Config from 'gfp/config'
import {Filter} from 'gfp/filter'
import {NodeData, SearchGui} from 'gfp/gui'

describe('SearchGui', () => {
  let config, searchGui, existingData, NewData
  const createSearchGui = (filters, nodeData) => {
    global.GM_getValue = jest.fn().mockImplementation((name) => name == 'filters' ? JSON.stringify(filters) : '')
    config = new Config()
    searchGui = new SearchGui(NewData, config)
    searchGui.nodeData = nodeData
    searchGui.hideResult = jest.fn()
    searchGui.addFilterLink = jest.fn()
  }
  beforeEach(() => {
    global.GM_addStyle = () => null
    global.GM_setValue = () => null
    existingData = Object.assign(new NodeData(), {
      children: [
        Object.assign(new NodeData(), {url: 'a1', title: 'b1', summary: 'c1'}),
        Object.assign(new NodeData(), {url: 'a2', title: 'b2', summary: 'c2'}),
      ],
    })
    NewData = function(){return Object.assign(new NodeData(), {
      *getChildren(){
        yield Object.assign(new NodeData(), {url: 'a1', title: 'b1', summary: 'c1'})
        yield Object.assign(new NodeData(), {url: 'a2', title: 'b2', summary: 'c2'})
      },
    })}
  })
  afterEach(() => jest.resetAllMocks())
  describe('filter changes updates matcher', () => {
    test('push', () => {
      createSearchGui({}, {})
      jest.spyOn(searchGui.matcher, 'add')
      const filter = Filter.fromText('a')
      config.filters.add(filter)
      expect(searchGui.matcher.add.mock.calls).toHaveLength(1)
      expect(searchGui.matcher.add).toBeCalledWith(filter)
    })
    test('remove', () => {
      createSearchGui({}, {})
      jest.spyOn(searchGui.matcher, 'remove')
      const filter = Filter.fromText('a')
      config.filters.add(filter)
      config.filters.remove([filter])
      expect(searchGui.matcher.remove.mock.calls).toHaveLength(1)
      expect(searchGui.matcher.remove).toBeCalledWith(filter)
    })
  })
  describe('filterResults', () => {
    test('only processes new results when node is specified', () => {
      createSearchGui({}, existingData)
      jest.spyOn(searchGui.matcher, 'matchesAny')
      searchGui.filterResults({})
      expect(searchGui.matcher.matchesAny.mock.calls).toHaveLength(3)
      expect(searchGui.nodeData.children).toHaveLength(3)
    })
    test('only processes existing results when node is not specified', () => {
      createSearchGui({}, existingData)
      jest.spyOn(searchGui.matcher, 'matchesAny')
      searchGui.filterResults()
      expect(searchGui.matcher.matchesAny.mock.calls).toHaveLength(3)
      expect(searchGui.nodeData.children).toHaveLength(2)
    })
    test('config is not updated if there is no match', () => {
      createSearchGui({'a0$$b0$$c0': {}}, existingData)
      jest.spyOn(config.filters, 'update')
      jest.spyOn(config, 'flushFilters')
      searchGui.filterResults()
      expect(config.filters.update).not.toHaveBeenCalled()
      expect(config.flushFilters).not.toHaveBeenCalled()
    })
    test('config is updated on match', () => {
      createSearchGui({'a1$$b1$$c1': {}}, existingData)
      jest.spyOn(config.filters, 'update')
      jest.spyOn(config, 'flushFilters')
      searchGui.filterResults()
      expect(config.filters._filters[0].hitCount).toBe(1)
      expect(config.filters._filters[0].lastHit).toBeGreaterThan(0)
      expect(config.filters.update.mock.calls.length).toBe(1)
      expect(config.filters.update).toBeCalledWith(config.filters._filters[0])
      expect(config.flushFilters.mock.calls.length).toBe(1)
    })
    test('blacklist matches hide results', () => {
      createSearchGui({'a1$$b1$$c1': {}}, existingData)
      searchGui.filterResults()
      expect(searchGui.hideResult.mock.calls.length).toBe(1)
      expect(searchGui.hideResult).toBeCalledWith(searchGui.nodeData.children[0], config.filters._filters[0])
    })
    test('filter links are added to shown results', () => {
      createSearchGui({'@@a1$$b1$$c1': {}}, existingData)
      searchGui.filterResults()
      expect(searchGui.addFilterLink.mock.calls).toHaveLength(2)
    })
    test('container is hidden if all its children are hidden', () => {
      createSearchGui({'a1$$b1$$c1': {}, 'a2$$b2$$c2': {}}, existingData)
      searchGui.filterResults()
      expect(searchGui.hideResult.mock.calls).toHaveLength(3)
      expect(searchGui.hideResult).toBeCalledWith(searchGui.nodeData)
    })
  })
})
