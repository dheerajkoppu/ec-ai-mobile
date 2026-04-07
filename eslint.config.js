// Minimal flat config for ESLint v9/v10.
// Used when the project's local ESLint v8 devDependency is not yet installed
// and npx falls back to the latest release. Run `npm install` to restore the
// full rule set from .eslintrc.js via the locally pinned ESLint v8.
module.exports = [
  {
    ignores: ["node_modules/**", ".expo/**", "dist/**", "android/**", "ios/**"],
  },
];
