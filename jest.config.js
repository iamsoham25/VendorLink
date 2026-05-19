// jest.config.js - Jest testing configuration
module.exports = {
  // Use jsdom so browser-like globals (localStorage) are available during tests
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/node_modules/**',
    '!server/logs/**',
    '!server/**/*.test.js',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],
  setupFilesAfterEnv: ['<rootDir>/server/__tests__/setup.js'],
  testTimeout: 10000,
  verbose: true,
};
