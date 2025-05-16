/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'services/**/*.{js,ts}',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.jsx?$': 'babel-jest',
  },
  testTimeout: 30000,
  setupFilesAfterEnv: ['./tests/config/jest.setup.js'],
  globalSetup: './tests/config/globalSetup.js',
  globalTeardown: './tests/config/globalTeardown.js',
  coverageDirectory: 'coverage',
};