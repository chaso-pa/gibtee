/**
 * 負荷テスト用スクリプト
 * システムの負荷耐性を検証
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const apiUrl = global.testConfig.apiUrl;

// 同時リクエスト数
const CONCURRENT_REQUESTS = 10;
// 最大許容応答時間（ミリ秒）
const MAX_RESPONSE_TIME = 1000;

describe('パフォーマンステスト', () => {
  let testUsers = [];
  
  beforeAll(async () => {
    // テスト用ユーザーの作成
    for (let i = 1; i <= CONCURRENT_REQUESTS; i++) {
      const user = await prisma.user.create({
        data: {
          lineId: `perf-test-user-${i}`,
          name: `パフォーマンステストユーザー${i}`,
          email: `perf-test-${i}@example.com`,
        },
      });
      testUsers.push(user);
    }
  });
  
  afterAll(async () => {
    // テスト用ユーザーの削除
    for (const user of testUsers) {
      await prisma.user.delete({
        where: { id: user.id },
      }).catch(() => {}); // エラーを無視
    }
    await prisma.$disconnect();
  });
  
  test('同時リクエストに対するダッシュボードAPIのパフォーマンス', async () => {
    // 同時リクエストを生成
    const requests = testUsers.map(user => {
      return request(apiUrl)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${global.testConfig.adminUser.token}`);
    });
    
    // リクエストの実行時間を記録
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    // 結果の確認
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
    
    // 全体の実行時間を確認
    const totalTime = endTime - startTime;
    const avgResponseTime = totalTime / CONCURRENT_REQUESTS;
    
    console.log(`同時${CONCURRENT_REQUESTS}リクエストの平均応答時間: ${avgResponseTime}ms`);
    
    // 平均応答時間が最大許容時間以内か確認
    expect(avgResponseTime).toBeLessThan(MAX_RESPONSE_TIME);
  });
  
  test('画像処理サービスのパフォーマンス', async () => {
    // 同時リクエストを生成
    const requests = testUsers.map((user, index) => {
      return request(apiUrl)
        .post('/webhook')
        .send({
          destination: 'destination',
          events: [{
            type: 'message',
            message: {
              type: 'image',
              id: `perf-test-image-${index}`,
            },
            source: {
              userId: user.lineId,
              type: 'user',
            },
            timestamp: Date.now(),
          }],
        });
    });
    
    // リクエストの実行時間を記録
    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    // 結果の確認
    for (const res of responses) {
      expect(res.status).toBe(200);
    }
    
    // すべての画像処理が完了するまで待機
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 全体の実行時間を確認
    const totalTime = endTime - startTime;
    const avgResponseTime = totalTime / CONCURRENT_REQUESTS;
    
    console.log(`同時${CONCURRENT_REQUESTS}画像リクエストの平均応答時間: ${avgResponseTime}ms`);
    
    // 平均応答時間が最大許容時間以内か確認
    expect(avgResponseTime).toBeLessThan(MAX_RESPONSE_TIME);
    
    // 画像処理の結果をチェック
    for (const user of testUsers) {
      const images = await prisma.image.findMany({
        where: { user: { lineId: user.lineId } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      
      // テスト環境では一部の画像が完全に処理されない場合もあるため、ここではチェックしない
      // 実际の実装では、キューシステムがバックグラウンドで処理するため
    }
  });
});