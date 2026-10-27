module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ['eslint:recommended', 'plugin:react-hooks/recommended'],
  plugins: ['react'],
  settings: { react: { version: 'detect' } },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  ignorePatterns: ['dist', 'node_modules'],
  rules: {
    'react/jsx-uses-vars': 'error',
    'react/react-in-jsx-scope': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'react-hooks/exhaustive-deps': 'warn',
  },
}
