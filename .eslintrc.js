module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native'],
  settings: {
    react: { version: 'detect' },
  },
  env: {
    es2022: true,
    node: true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-require-imports': 'off',
    'react-native/no-raw-text': 'off',
    'react-native/no-inline-styles': 'warn',
  },
  ignorePatterns: ['node_modules/', '.expo/', 'dist/', 'babel.config.js', 'metro.config.js'],
};
