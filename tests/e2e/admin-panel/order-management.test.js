const { test, expect } = require('@playwright/test');
const { seedTestData } = require('../../fixtures/seed');

test.describe('管理パネル注文管理', () => {
  test.beforeAll(async () => {
    // テスト用データを事前にセットアップ
    await seedTestData();
  });
  
  test.beforeEach(async ({ page }) => {
    // 各テストの前にログインしておく
    await page.goto(`${global.testConfig.adminUrl}/login`);
    await page.fill('input[name="username"]', global.testConfig.adminUser.username);
    await page.fill('input[name="password"]', global.testConfig.adminUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${global.testConfig.adminUrl}/dashboard`);
  });
  
  test('注文一覧が正しく表示される', async ({ page }) => {
    // 注文一覧ページにアクセス
    await page.goto(`${global.testConfig.adminUrl}/orders`);
    
    // 注文テーブルが表示されるのを待つ
    await page.waitForSelector('table.order-list');
    
    // 注文が少なくとも１件以上表示されていることを確認
    const orderCount = await page.locator('table.order-list tbody tr').count();
    expect(orderCount).toBeGreaterThan(0);
    
    // 注文の特定のカラムが表示されていることを確認
    await expect(page.locator('table.order-list th:has-text("Order ID")')).toBeVisible();
    await expect(page.locator('table.order-list th:has-text("Status")')).toBeVisible();
    await expect(page.locator('table.order-list th:has-text("Customer")')).toBeVisible();
    await expect(page.locator('table.order-list th:has-text("Total")')).toBeVisible();
  });
  
  test('注文詳細画面で注文情報を閲覧できる', async ({ page }) => {
    // 注文一覧ページにアクセス
    await page.goto(`${global.testConfig.adminUrl}/orders`);
    
    // 最初の注文をクリック
    await page.click('table.order-list tbody tr:first-child');
    
    // 詳細ページが表示されていることを確認
    await page.waitForSelector('.order-details');
    
    // 注文詳細の各種情報が表示されていることを確認
    await expect(page.locator('.order-details h2:has-text("Order Details")')).toBeVisible();
    await expect(page.locator('.order-status')).toBeVisible();
    await expect(page.locator('.customer-info')).toBeVisible();
    await expect(page.locator('.order-items')).toBeVisible();
    await expect(page.locator('.shipping-address')).toBeVisible();
  });
  
  test('注文ステータスを更新できる', async ({ page }) => {
    // 注文一覧ページにアクセス
    await page.goto(`${global.testConfig.adminUrl}/orders`);
    
    // 処理中ステータスの注文を探す
    await page.click('table.order-list tbody tr:has-text("processing")');
    
    // 詳細ページが表示されるのを待つ
    await page.waitForSelector('.order-details');
    
    // 現在のステータスを確認
    const currentStatus = await page.locator('select[name="status"]').inputValue();
    expect(currentStatus).toBe('processing');
    
    // ステータスを「印刷中」に更新
    await page.selectOption('select[name="status"]', 'printing');
    await page.click('button.update-status');
    
    // 成功メッセージを確認
    await expect(page.locator('.success-message')).toBeVisible();
    
    // ステータスが更新されたことを確認
    const updatedStatus = await page.locator('select[name="status"]').inputValue();
    expect(updatedStatus).toBe('printing');
  });
  
  test('高解像度画像をダウンロードできる', async ({ page }) => {
    // 注文一覧ページにアクセス
    await page.goto(`${global.testConfig.adminUrl}/orders`);
    
    // 画像がある注文を選択
    await page.click('table.order-list tbody tr:first-child');
    
    // 詳細ページが表示されるのを待つ
    await page.waitForSelector('.order-details');
    
    // 画像プレビューが表示されていることを確認
    await expect(page.locator('.image-preview')).toBeVisible();
    
    // ダウンロードボタンが表示されていることを確認
    await expect(page.locator('button.download-image')).toBeVisible();
    
    // ダウンロードをテスト
    // ダウンロードイベントを監視
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.download-image');
    const download = await downloadPromise;
    
    // ダウンロードされたファイル名を確認
    const fileName = download.suggestedFilename();
    expect(fileName).toMatch(/\.(png|jpg|jpeg)$/); // 画像ファイルであることを確認
  });
});