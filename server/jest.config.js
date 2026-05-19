// server/jest.config.js - Jest config for backend tests
module.exports = {
  testEnvironment: 'jsdom',
  // Use a dedicated setup file outside of __tests__ so Jest doesn't try to run it
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  testTimeout: 10000,
  verbose: true,
};
