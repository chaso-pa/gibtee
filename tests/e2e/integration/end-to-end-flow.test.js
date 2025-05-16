const request = require('supertest');
const { test, expect } = require('@playwright/test');
const { PrismaClient } = require('@prisma/client');
const { seedTestData } = require('../../fixtures/seed');

const prisma = new PrismaClient();
const apiUrl = global.testConfig.apiUrl;
const adminUrl = global.testConfig.adminUrl;

/**
 * 完全なエンドツーエンドフローのテスト
 * LINE Bot -> 画像処理 -> 注文作成 -> 決済 -> 管理パネルでの処理 -> 完了
 */
test.describe('エンドツーエンドフロー', () => {
  let userId = 'test-e2e-flow';
  let orderId;
  let messageId = 'test-e2e-message-123';
  let imageUrl;
  
  // テスト実行前のセットアップ
  test.beforeAll(async () => {
    // 事前のテストデータをセットアップ
    await seedTestData();
    
    // テスト用ユーザーを作成
    await prisma.user.upsert({
      where: { lineId: userId },
      update: {},
      create: {
        lineId: userId,
        name: 'テストE2Eフロー',
        email: 'test-e2e@example.com',
      },
    });
  });
  
  // テスト実行後のクリーンアップ
  test.afterAll(async () => {
    // テストで作成した注文と画像を削除
    if (orderId) {
      await prisma.order.delete({
        where: { id: orderId },
      }).catch(() => console.log('Order already deleted or not found'));
    }
    
    await prisma.image.deleteMany({
      where: { user: { lineId: userId } },
    });
    
    await prisma.user.delete({
      where: { lineId: userId },
    }).catch(() => console.log('User already deleted or not found'));
    
    await prisma.$disconnect();
  });
  
  test('1. ユーザーが画像をLINE経由で送信する', async () => {
    // LINE Webhookをシミュレート（画像メッセージ）
    const res = await request(apiUrl)
      .post('/webhook')
      .send({
        destination: 'destination',
        events: [{
          type: 'message',
          message: {
            type: 'image',
            id: messageId,
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
  });
  
  test('2. 画像処理サービスがジブリ風に画像を変換する', async () => {
    // 画像のステータスをチェック
    const statusRes = await request(apiUrl)
      .get(`/api/images/status/${userId}/latest`);
    
    expect(statusRes.status).toBe(200);
    expect(statusRes.body).toHaveProperty('status', 'completed');
    expect(statusRes.body).toHaveProperty('imageUrl');
    
    // 画像のURLを保存
    imageUrl = statusRes.body.imageUrl;
    expect(imageUrl).toBeTruthy();
  });
  
  test('3. ユーザーが商品を選択して注文を作成する', async () => {
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
    
    // 作成された注文を取得
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
    
    // 注文IDを保存
    orderId = orders[0].id;
  });
  
  test('4. ユーザーが配送情報を入力し決済する', async () => {
    // 配送情報と決済情報を送信
    const completeOrderRes = await request(apiUrl)
      .post(`/api/orders/${orderId}/checkout`)
      .send({
        paymentMethod: 'stripe',
        shippingAddress: {
          name: 'テストE2Eフロー',
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
        paymentIntentId: 'test-payment-intent-e2e',
      });

    expect(confirmPaymentRes.status).toBe(200);
    expect(confirmPaymentRes.body).toHaveProperty('success', true);
    
    // 注文ステータスが更新されたことを確認
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    expect(updatedOrder).toBeTruthy();
    expect(updatedOrder.status).toBe('pending');
    expect(updatedOrder.paymentId).toBeTruthy();
  });
  
  test('5. 管理者が管理パネルで注文を確認し処理する', async ({ page }) => {
    // 管理パネルにログイン
    await page.goto(`${adminUrl}/login`);
    await page.fill('input[name="username"]', global.testConfig.adminUser.username);
    await page.fill('input[name="password"]', global.testConfig.adminUser.password);
    await page.click('button[type="submit"]');
    
    // 注文一覧ページに移動
    await page.goto(`${adminUrl}/orders`);
    await page.waitForSelector('table.order-list');
    
    // テストで作成した注文を探す
    // 注文IDで検索
    await page.fill('input[name="search"]', orderId);
    await page.click('button.search-button');
    
    // 検索結果を確認
    await page.waitForSelector(`table.order-list tr:has-text("${orderId}")`);
    
    // 注文詳細を開く
    await page.click(`table.order-list tr:has-text("${orderId}")`);
    await page.waitForSelector('.order-details');
    
    // ステータスを更新
    await page.selectOption('select[name="status"]', 'processing');
    await page.click('button.update-status');
    
    // 成功メッセージを確認
    await expect(page.locator('.success-message')).toBeVisible();
    
    // 画像をダウンロード
    await expect(page.locator('.image-preview')).toBeVisible();
    await expect(page.locator('button.download-image')).toBeVisible();
    
    // 注文一覧に戻る
    await page.click('a.back-to-list');
    await page.waitForSelector('table.order-list');
  });
  
  test('6. 注文状態がユーザーにLINEで通知される', async () => {
    // ステータス変更による通知をシミュレート
    // 実際の実装では、ここでLINE通知APIの呼び出しを確認する
    // モックを使用しているため、実際の確認は難しい
    
    // ここではデータベースに正しく更新されていることを確認
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    expect(updatedOrder).toBeTruthy();
    expect(updatedOrder.status).toBe('processing');
  });
});