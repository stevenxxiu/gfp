import {cache, bisect, pad, addStyleResolve, indexOfSorted, popMany} from 'gfp/utils'

describe('utils', () => {
  afterEach(() => jest.resetAllMocks())
  test('addStyleResolve', () => {
    global.GM_getResourceText = jest.fn()
    global.GM_getResourceText.mockImplementation(resourceName =>
      resourceName == 'some-css' ? 'body{background-image: url("images/image.png");}' : null
    )
    global.GM_getResourceURL = jest.fn()
    global.GM_getResourceURL.mockImplementation(resourceName =>
      resourceName == 'some-css/images/image.png' ?
        'greasemonkey-script:94242686-1400-4dce-982a-090cbfef7ba1/image.png' : null
    )
    global.GM_addStyle = jest.fn()
    addStyleResolve('some-css')
    expect(global.GM_addStyle).toBeCalledWith(`body{
      background-image: url("greasemonkey-script:94242686-1400-4dce-982a-090cbfef7ba1/image.png");
    }`.replace(/\n\s*/g, ''))
    expect(global.GM_addStyle).toHaveBeenCalledTimes(1)
  })
  test('pad', () => {
    expect(pad(1, 3)).toBe('001')
    expect(pad(1234, 3)).toBe('1234')
  })
  test('cache', () => {
    const obj = {a: 1}
    cache(obj, 'b', 2)
    expect(obj.b).toBe(2)
  })
  describe('bisect', () => {
    test('values', () => {
      expect(bisect([0, 1, 2, 3, 4], 0, (x, y) => x - y)).toBe(1)
      expect(bisect([0, 1, 2, 3, 4], -1, (x, y) => x - y)).toBe(0)
      expect(bisect([0, 1, 2, 3, 4], 4, (x, y) => x - y)).toBe(5)
      expect(bisect([0, 1, 2, 3, 4], 5, (x, y) => x - y)).toBe(5)
    })
    test('hilo', () => {
      expect(() => bisect([], 0, (x, y) => x - y, -1)).toThrow()
      expect(bisect([0, 1, 2, 3, 4], 0, (x, y) => x - y, 1, 3)).toBe(1)
    })
  })
  test('indexOfSorted', () => {
    expect(indexOfSorted([0, 1, 2, 3, 4, 5], [0, 3, 5], (x, y) => x - y)).toStrictEqual([0, 3, 5])
    expect(indexOfSorted([0, 1, 2, 3, 4, 5], [3, 3], (x, y) => x - y)).toStrictEqual([3, 3])
    expect(indexOfSorted([0, 1, 2, 3, 4, 5], [0, 3.5, 4], (x, y) => x - y)).toStrictEqual([0, -1, 4])
    expect(indexOfSorted([0, 1, 2, 3, 4, 5], [], (x, y) => x - y)).toStrictEqual([])
    expect(indexOfSorted([], [0, 1, 2], (x, y) => x - y)).toStrictEqual([-1, -1, -1])
  })
  test('popMany', () => {
    expect(popMany([0, 1, 2], [])).toStrictEqual([0, 1, 2])
    expect(popMany([0, 1, 2, 3, 4, 5], [2, 1, 0])).toStrictEqual([3, 4, 5])
    expect(popMany([0, 1, 2, 3, 4, 5], [5, 4, 3])).toStrictEqual([0, 1, 2])
    expect(popMany([0, 1, 2, 3, 4, 5], [0, 0, 0])).toStrictEqual([1, 2, 3, 4, 5])
  })
})
