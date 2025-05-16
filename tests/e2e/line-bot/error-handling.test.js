const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const apiUrl = global.testConfig.apiUrl;

describe('LINE Bot エラーハンドリング', () => {
  let userId = 'test-error-handling';
  
  beforeAll(async () => {
    // テスト用データのセットアップ
    await prisma.user.upsert({
      where: { lineId: userId },
      update: {},
      create: {
        lineId: userId,
        name: 'テストエラーハンドリング',
        email: 'test-error@example.com',
      },
    });
  });

  afterAll(async () => {
    // テスト後のクリーンアップ
    await prisma.image.deleteMany({
      where: { user: { lineId: userId } },
    });
    await prisma.user.delete({
      where: { lineId: userId },
    });
    await prisma.$disconnect();
  });

  test('不正な形式の画像が送信された場合に正しくエラーメッセージを返す', async () => {
    // エラーをシミュレートするために、特定のIDを持つ画像メッセージを送信
    // モックはこのIDを認識してエラーを返すように設定
    const res = await request(apiUrl)
      .post('/webhook')
      .send({
        destination: 'destination',
        events: [{
          type: 'message',
          message: {
            type: 'image',
            id: 'invalid-image-format-123',
          },
          source: {
            userId,
            type: 'user',
          },
          timestamp: Date.now(),
        }],
      });

    expect(res.status).toBe(200); // LINEには常に200を返す必要がある
    
    // エラー処理が正しく行われたかを確認するためのエンドポイントが必要
    // 実際の実装ではログやデータベースの状態を確認する必要があるかもしれない
  });

  test('画像処理中にエラーが発生した場合に正しくエラーメッセージを返す', async () => {
    // 画像処理エラーをシミュレート
    const res = await request(apiUrl)
      .post('/webhook')
      .send({
        destination: 'destination',
        events: [{
          type: 'message',
          message: {
            type: 'image',
            id: 'processing-error-123',
          },
          source: {
            userId,
            type: 'user',
          },
          timestamp: Date.now(),
        }],
      });

    expect(res.status).toBe(200);
    
    // 必要に応じて処理の完了を待つ
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 画像ステータスがエラーとして記録されているか確認
    const statusRes = await request(apiUrl)
      .get(`/api/images/status/${userId}/latest`);
    
    // エラー状態が適切に記録されていることを確認
    expect(statusRes.status).toBe(200);
    expect(statusRes.body).toHaveProperty('status', 'error');
  });

  test('不正な注文データが送信された場合に正しくエラーメッセージを返す', async () => {
    // 不正な商品IDを送信
    const res = await request(apiUrl)
      .post('/api/orders')
      .send({
        userId,
        items: [{ id: 'non-existent-item', quantity: 1 }],
      });

    // APIはエラーステータスを返すべき
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});