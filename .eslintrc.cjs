module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
  },
  extends: ["airbnb"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint"],
  rules: {
    "import/no-extraneous-dependencies": "warn",
    "import/no-unresolved": "warn",
    "import/extensions": "warn",
    "react/jsx-filename-extension": "warn",
    "react/react-in-jsx-scope": "warn",
    "react/button-has-type": "warn",
    "react/function-component-definition": "warn",
    "react/prop-types": "warn",
    "import/prefer-default-export": "warn",
    "react/jsx-props-no-spreading": "warn",
    "jsx-a11y/html-has-lang":"warn"
  },
};
