module.exports = {
  extends: ["expo", "prettier"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
  },
  settings: {
    "import/resolver": {
      typescript: {
        project: "./tsconfig.json", // Point to your tsconfig with the @/* alias
        alwaysTryTypes: true,
      },
    },
  },
};
