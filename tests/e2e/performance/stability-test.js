/**
 * 安定性テスト
 * 長時間の実行でシステムが安定しているか確認
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const apiUrl = global.testConfig.apiUrl;

// テスト実行時間（ミリ秒）
const TEST_DURATION = 30000; // 30秒
// リクエスト間隔（ミリ秒）
const REQUEST_INTERVAL = 500; // 0.5秒

describe('安定性テスト', () => {
  let testUser;
  let responseTimes = [];
  
  beforeAll(async () => {
    // テスト用ユーザーの作成
    testUser = await prisma.user.create({
      data: {
        lineId: 'stability-test-user',
        name: '安定性テストユーザー',
        email: 'stability-test@example.com',
      },
    });
  });
  
  afterAll(async () => {
    // テスト用ユーザーの削除
    await prisma.user.delete({
      where: { id: testUser.id },
    }).catch(() => {}); // エラーを無視
    await prisma.$disconnect();
  });
  
  test('長時間の繰り返しリクエストで安定しているか', async () => {
    jest.setTimeout(TEST_DURATION + 10000); // テストタイムアウトを延長
    
    const startTime = Date.now();
    let iteration = 0;
    
    // 繰り返しリクエストを実行
    while (Date.now() - startTime < TEST_DURATION) {
      iteration++;
      const requestStartTime = Date.now();
      
      // APIリクエストを実行
      const res = await request(apiUrl)
        .get('/api/products')
        .expect(200);
      
      const requestTime = Date.now() - requestStartTime;
      responseTimes.push(requestTime);
      
      // 一定間隔でリクエスト
      await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL));
    }
    
    // 結果の分析
    const totalRequests = responseTimes.length;
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / totalRequests;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    console.log(`安定性テスト結果:`);
    console.log(`実行時間: ${(Date.now() - startTime) / 1000}秒`);
    console.log(`総リクエスト数: ${totalRequests}`);
    console.log(`平均応答時間: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`最大応答時間: ${maxResponseTime}ms`);
    console.log(`最小応答時間: ${minResponseTime}ms`);
    
    // リクエストがすべて成功したことを確認
    expect(totalRequests).toBeGreaterThan(0);
    
    // 安定性の判定: 最大応答時間が平均の3倍以内
    expect(maxResponseTime).toBeLessThan(avgResponseTime * 3);
  });
});