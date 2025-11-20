const dotenv = require("dotenv");
const nextJest = require("next/jest.js");

dotenv.config({
  path: ".env.development",
});

const jestConfigFactory = nextJest({
  dir: ".",
});

const jestConfig = jestConfigFactory({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 60000,
});

module.exports = jestConfig;
