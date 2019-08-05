// for jest tests
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
  ],
  plugins: [
    ['module-resolver', {root: ['.']}],
  ],
}
