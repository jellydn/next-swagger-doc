module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
  },
  extends: ['airbnb'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'import/no-extraneous-dependencies': 'warn',
    'import/no-unresolved': 'warn',
    'import/extensions': 'warn',
  },
};
