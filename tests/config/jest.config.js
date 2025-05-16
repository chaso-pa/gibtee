module.exports = {
  preset: 'jest-playwright-preset',
  testMatch: ['**/tests/e2e/**/*.test.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['./tests/config/jest.setup.js'],
  testTimeout: 30000, // E2Eテストは長めのタイムアウトが必要
};