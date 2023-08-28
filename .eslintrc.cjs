module.exports = {
  extends: ['productsway'],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'vite.config.ts'],
  parserOptions: {
    project: ['./tsconfig.json'],
  },
};
