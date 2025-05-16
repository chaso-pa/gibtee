const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const { simulateGhibliStyleTransfer } = require('../../fixtures/images');

const prisma = new PrismaClient();
const apiUrl = global.testConfig.apiUrl;

describe('LINE Bot ユーザーフロー', () => {
  let userId = 'test-user-flow';
  let orderId;
  
  beforeAll(async () => {
    // テスト用データのセットアップ
    await prisma.user.upsert({
      where: { lineId: userId },
      update: {},
      create: {
        lineId: userId,
        name: 'テストユーザーフロー',
        email: 'test-flow@example.com',
      },
    });
  });

  afterAll(async () => {
    // テスト後のクリーンアップ
    await prisma.order.deleteMany({
      where: { user: { lineId: userId } },
    });
    await prisma.image.deleteMany({
      where: { user: { lineId: userId } },
    });
    await prisma.user.delete({
      where: { lineId: userId },
    });
    await prisma.$disconnect();
  });

  test('ユーザーが画像をアップロードし、正常に処理される', async () => {
    // LINE Webhookをシミュレート（画像メッセージ）
    const res = await request(apiUrl)
      .post('/webhook')
      .send({
        destination: 'destination',
        events: [{
          type: 'message',
          message: {
            type: 'image',
            id: 'test-message-id-123',
          },
          source: {
            userId,
            type: 'user',
          },
          timestamp: Date.now(),
        }],
      });

    expect(res.status).toBe(200);
    
    // 必要に応じて画像処理の完了を待つ
    // 実際の実装では非同期処理のため、ポーリングやコールバックが必要かもしれない
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 画像のステータスをチェック
    const statusRes = await request(apiUrl)
      .get(`/api/images/status/${userId}/latest`);
    
    expect(statusRes.status).toBe(200);
    expect(statusRes.body).toHaveProperty('status', 'completed');
    expect(statusRes.body).toHaveProperty('imageUrl');

    // 処理された画像のURLを保存
    const imageUrl = statusRes.body.imageUrl;
    expect(imageUrl).toBeTruthy();
  });
  
  test('ユーザーが商品を選択し注文できる', async () => {
    // LINE Webhookをシミュレート（商品選択メッセージ）
    const selectItemRes = await request(apiUrl)
      .post('/webhook')
      .send({
        destination: 'destination',
        events: [{
          type: 'postback',
          postback: {
            data: 'action=select_item&itemId=tshirt-m',
          },
          source: {
            userId,
            type: 'user',
          },
          timestamp: Date.now(),
        }],
      });

    expect(selectItemRes.status).toBe(200);

    // 注文情報が保存されているか確認
    const orders = await prisma.order.findMany({
      where: {
        user: { lineId: userId },
        status: 'cart',
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    expect(orders.length).toBeGreaterThan(0);
    expect(orders[0].items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'tshirt-m',
      }),
    ]));

    // 作成された注文IDを保存
    orderId = orders[0].id;

    // 決済処理をシミュレート
    const completeOrderRes = await request(apiUrl)
      .post(`/api/orders/${orderId}/checkout`)
      .send({
        paymentMethod: 'stripe',
        shippingAddress: {
          name: 'テストユーザー',
          postalCode: '123-4567',
          prefecture: '東京都',
          city: '渋谷区',
          address: '1-2-3',
          phone: '090-1234-5678',
        },
      });

    expect(completeOrderRes.status).toBe(200);
    expect(completeOrderRes.body).toHaveProperty('success', true);
    expect(completeOrderRes.body).toHaveProperty('paymentUrl');

    // 決済完了をシミュレート
    const confirmPaymentRes = await request(apiUrl)
      .post(`/api/payments/${orderId}/confirm`)
      .send({
        paymentIntentId: 'test-payment-intent-123',
      });

    expect(confirmPaymentRes.status).toBe(200);
    expect(confirmPaymentRes.body).toHaveProperty('success', true);

    // 注文が正常に処理されたか確認
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    expect(updatedOrder).toBeTruthy();
    expect(updatedOrder.status).toBe('pending');
    expect(updatedOrder.paymentId).toBeTruthy();
  });
});