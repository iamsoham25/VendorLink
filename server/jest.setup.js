// server/jest.setup.js - Jest environment setup (moved out of __tests__)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost/vendorlink-test';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests

// Mock MongoDB for testing
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue(true),
  connection: {
    on: jest.fn(),
  },
}));
