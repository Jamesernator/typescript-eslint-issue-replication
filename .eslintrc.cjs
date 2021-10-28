"use strict";
const path = require("path");
const createEslintConfig = require("@jamesernator/eslint-config");

module.exports = createEslintConfig({
    project: path.join(__dirname, "./tsconfig.json"),
});