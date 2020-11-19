module.exports = {
  env: { es2020: true },
  extends: ["react-app", "eslint:recommended"],
  plugins: ["babel", "@typescript-eslint"],
  parser: "@typescript-eslint/parser",
  rules: {
    "@typescript-eslint/no-redeclare": "off",
    "babel/camelcase": ["warn", { ignoreDestructuring: true }],
    "babel/no-unused-expressions": "warn",
    "no-debugger": "off",
    "no-redeclare": "off",
    "no-unused-expressions": "off",
    "no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
  },
}
