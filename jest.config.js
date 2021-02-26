module.exports = {
  clearMocks: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  globalSetup: "<rootDir>/jest.setup.js",
  coveragePathIgnorePatterns: [
    "/cli/",
    "/node_modules/",
    "/tests/",
    "/src/storage"
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testEnvironment: "node",
};
