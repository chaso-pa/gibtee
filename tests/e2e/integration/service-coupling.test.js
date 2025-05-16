const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const apiUrl = global.testConfig.apiUrl;

/**
 * サービス間の結合テスト
 * 各サービスが連携して正しく動作しているか確認する
 */
describe('サービス間結合テスト', () => {
  let userId = 'test-coupling';
  
  beforeAll(async () => {
    // テスト用データのセットアップ
    await prisma.user.upsert({
      where: { lineId: userId },
      update: {},
      create: {
        lineId: userId,
        name: 'テスト結合',
        email: 'test-coupling@example.com',
      },
    });
  });

  afterAll(async () => {
    // テスト後のクリーンアップ
    await prisma.image.deleteMany({
      where: { user: { lineId: userId } },
    });
    await prisma.order.deleteMany({
      where: { user: { lineId: userId } },
    });
    await prisma.user.delete({
      where: { lineId: userId },
    });
    await prisma.$disconnect();
  });

  test('LINE Botと画像処理サービスの連携', async () => {
    // LINEからの画像メッセージをシミュレート
    const res = await request(apiUrl)
      .post('/webhook')
      .send({
        destination: 'destination',
        events: [{
          type: 'message',
          message: {
            type: 'image',
            id: 'test-coupling-image-123',
          },
          source: {
            userId,
            type: 'user',
          },
          timestamp: Date.now(),
        }],
      });

    expect(res.status).toBe(200);
    
    // 画像処理の完了を待つ
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 画像のステータスを確認
    const statusRes = await request(apiUrl)
      .get(`/api/images/status/${userId}/latest`);
    
    expect(statusRes.status).toBe(200);
    expect(statusRes.body).toHaveProperty('status', 'completed');
    expect(statusRes.body).toHaveProperty('imageUrl');
  });

  test('注文サービスと決済サービスの連携', async () => {
    // 注文作成
    const orderRes = await request(apiUrl)
      .post('/api/orders')
      .send({
        userId,
        items: [{ id: 'tshirt-m', quantity: 1 }],
      });

    expect(orderRes.status).toBe(200);
    expect(orderRes.body).toHaveProperty('orderId');
    
    const orderId = orderRes.body.orderId;
    
    // 決済情報の送信
    const checkoutRes = await request(apiUrl)
      .post(`/api/orders/${orderId}/checkout`)
      .send({
        paymentMethod: 'stripe',
        shippingAddress: {
          name: 'テスト結合',
          postalCode: '123-4567',
          prefecture: '東京都',
          city: '渋谷区',
          address: '1-2-3',
          phone: '090-1234-5678',
        },
      });

    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body).toHaveProperty('success', true);
    expect(checkoutRes.body).toHaveProperty('paymentUrl');
    
    // 決済完了のシミュレート
    const confirmRes = await request(apiUrl)
      .post(`/api/payments/${orderId}/confirm`)
      .send({
        paymentIntentId: 'test-payment-coupling',
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body).toHaveProperty('success', true);
    
    // 注文状態の確認
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    expect(order).toBeTruthy();
    expect(order.status).toBe('pending');
    expect(order.paymentId).toBeTruthy();
  });

  test('管理パネルAPIとデータベースの連携', async () => {
    // 管理パネルAPIを使用して注文ステータスを更新
    // まずテスト対象の注文を取得
    const orders = await prisma.order.findMany({
      where: {
        user: { lineId: userId },
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    expect(orders.length).toBeGreaterThan(0);
    const orderId = orders[0].id;
    
    // 管理パネルのステータス更新APIを利用
    const updateRes = await request(apiUrl)
      .patch(`/api/admin/orders/${orderId}`)
      .send({
        status: 'processing',
      })
      .set('Authorization', `Bearer ${global.testConfig.adminUser.token}`);

    expect(updateRes.status).toBe(200);
    
    // データベースの更新を確認
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    expect(updatedOrder).toBeTruthy();
    expect(updatedOrder.status).toBe('processing');
  });

  test('通知サービスとデータベースの連携', async () => {
    // 通知サービスをテスト
    // まずテスト対象の注文を取得
    const orders = await prisma.order.findMany({
      where: {
        user: { lineId: userId },
      },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    expect(orders.length).toBeGreaterThan(0);
    const orderId = orders[0].id;
    
    // 通知送信APIを利用
    const notifyRes = await request(apiUrl)
      .post(`/api/notifications/order-status`)
      .send({
        orderId,
        status: 'shipped',
        message: '商品を発送しました',
      })
      .set('Authorization', `Bearer ${global.testConfig.adminUser.token}`);

    expect(notifyRes.status).toBe(200);
    
    // データベースの更新を確認
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    expect(updatedOrder).toBeTruthy();
    expect(updatedOrder.status).toBe('shipped');
    
    // 通知履歴の確認
    const notifications = await prisma.notification.findMany({
      where: {
        orderId,
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].message).toContain('商品を発送');
  });
});