const path = require('path')

module.exports = {
  root: true,
  parser: 'babel-eslint',
  plugins: ['import', 'jest', 'promise', 'sonarjs', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:promise/recommended',
    'plugin:sonarjs/recommended',
    'prettier',
    'plugin:prettier/recommended',
  ],
  rules: {
    'max-len': ['error', 120],
    'comma-dangle': ['error', 'always-multiline'],
    'linebreak-style': ['error', 'unix'],
    'no-console': 'off',
    'no-constant-condition': ['error', { checkLoops: false }],
    'no-empty': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-trailing-spaces': 'error',
    'jsx-quotes': 'error',
    quotes: ['error', 'single', { avoidEscape: true }],
    semi: ['error', 'never'],
  },
  env: {
    es6: true,
    amd: true,
    node: true,
    browser: true,
    jest: true,
  },
  globals: {
    GM_addStyle: true,
    GM_getResourceText: true,
    GM_getResourceURL: true,
    GM_getValue: true,
    GM_setValue: true,
    GM_registerMenuCommand: true,
  },
  overrides: [
    {
      files: ['gfp/header.js'],
      rules: {
        'max-len': 'off',
      },
    },
  ],
  settings: {
    'import/resolver': {
      webpack: {
        config: path.join(__dirname, '/webpack.config.js'),
        'config-index': 1,
      },
    },
  },
}
