module.exports = {
  printWidth: 80,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  importOrder: ['^@core/(.*)$', '^@server/(.*)$', '^@ui/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
