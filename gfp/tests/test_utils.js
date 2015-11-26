import {cache, bisect, pad, addStyleResolve, indexOfSorted} from 'gfp/utils'

suite('utils', () => {
  let self = {sandbox: sinon.sandbox.create()}
  teardown(() => self.sandbox.restore())
  test('cache', () => {
    let obj = {a: 1}
    cache(obj, 'b', 2)
    assert.equal(obj.b, 2)
  })
  suite('bisect', () => {
    test('values', () => {
      assert.equal(bisect([0, 1, 2, 3, 4], 0, (x, y) => x - y), 1)
      assert.equal(bisect([0, 1, 2, 3, 4], -1, (x, y) => x - y), 0)
      assert.equal(bisect([0, 1, 2, 3, 4], 4, (x, y) => x - y), 5)
      assert.equal(bisect([0, 1, 2, 3, 4], 5, (x, y) => x - y), 5)
    })
    test('hilo', () => {
      assert.throw(() => bisect([], 0, (x, y) => x - y, -1))
      assert.equal(bisect([0, 1, 2, 3, 4], 0, (x, y) => x - y, 1, 3), 1)
    })
  })
  test('pad', () => {
    assert.equal(pad(1, 3), '001')
    assert.equal(pad(1234, 3), '1234')
  })
  test('addStyleResolve', () => {
    self.sandbox.stub(window, 'GM_getResourceText').withArgs('some-css')
      .returns('body{background-image: url("images/image.png");}')
    self.sandbox.stub(window, 'GM_getResourceURL').withArgs('some-css/images/image.png')
      .returns('greasemonkey-script:94242686-1400-4dce-982a-090cbfef7ba1/image.png')
    self.sandbox.stub(window, 'GM_addStyle')
    addStyleResolve('some-css')
    assert.calledWithExactly(window.GM_addStyle, `body{
      background-image: url("greasemonkey-script:94242686-1400-4dce-982a-090cbfef7ba1/image.png");
    }`.replace(/\n\s*/g, ''))
    assert.calledOnce(window.GM_addStyle)
  })
  test('indexOfSorted', () => {
    assert.deepEqual(indexOfSorted([0, 1, 2, 3, 4, 5], [0, 3, 5], (x, y) => x - y), [0, 3, 5])
    assert.deepEqual(indexOfSorted([0, 1, 2, 3, 4, 5], [3, 3], (x, y) => x - y), [3, 3])
    assert.deepEqual(indexOfSorted([0, 1, 2, 3, 4, 5], [0, 3.5, 4], (x, y) => x - y), [0, -1, 4])
    assert.deepEqual(indexOfSorted([0, 1, 2, 3, 4, 5], [], (x, y) => x - y), [])
    assert.deepEqual(indexOfSorted([], [0, 1, 2], (x, y) => x - y), [-1, -1, -1])
  })
})
