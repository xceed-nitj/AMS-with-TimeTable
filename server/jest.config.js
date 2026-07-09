module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/setup-env.js"],
  testTimeout: 30000, // first mongod spawn on Windows can be slow
  maxWorkers: "50%",
};
