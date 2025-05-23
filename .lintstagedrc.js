module.exports = {
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{md,html,css,json}": [
    "prettier --write"
  ]
};