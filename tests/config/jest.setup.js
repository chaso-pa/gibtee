// MSWのセットアップ
const { server } = require('../mocks/server');

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// データベースクリーンアップ
const { cleanupDatabase } = require('../utils/db-cleanup');

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  await cleanupDatabase();
});

// テスト用のグローバル設定
global.testConfig = {
  apiUrl: process.env.TEST_API_URL || 'http://localhost:3001',
  adminUrl: process.env.TEST_ADMIN_URL || 'http://localhost:3000',
  testUser: {
    lineId: 'test-user-line-id',
    name: 'Test User',
  },
  adminUser: {
    username: 'admin',
    password: 'test-admin-password',
  }
};