const { test, expect } = require('@playwright/test');
const { seedTestData } = require('../../fixtures/seed');

test.describe('管理パネル画像エクスポート機能', () => {
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
    
    // 画像エクスポートページに移動
    await page.goto(`${global.testConfig.adminUrl}/image-export`);
  });
  
  test('画像エクスポートページが正しく表示される', async ({ page }) => {
    // ページのタイトルを確認
    await expect(page.locator('h1:has-text("Image Export")')).toBeVisible();
    
    // フィルタリングオプションが表示されていることを確認
    await expect(page.locator('select[name="status"]')).toBeVisible();
    await expect(page.locator('input[name="dateRange"]')).toBeVisible();
    
    // 画像リストが表示されていることを確認
    await expect(page.locator('.image-grid')).toBeVisible();
  });
  
  test('画像をフィルタリングできる', async ({ page }) => {
    // 初期状態の画像数を取得
    const initialImageCount = await page.locator('.image-card').count();
    
    // ステータスでフィルタリング
    await page.selectOption('select[name="status"]', 'processing');
    await page.click('button.apply-filter');
    
    // フィルタリング後の画像数を確認
    await page.waitForSelector('.image-card'); // 結果が更新されるまで待つ
    const filteredImageCount = await page.locator('.image-card').count();
    
    // フィルタリング前後で表示数が変わっていることを期待
    // 注：実際のデータによっては同じ場合もあり得る
    expect(filteredImageCount).not.toBeGreaterThan(initialImageCount);
    
    // リセットボタンをクリック
    await page.click('button.reset-filter');
    
    // リセット後の画像数を確認
    await page.waitForSelector('.image-card');
    const resetImageCount = await page.locator('.image-card').count();
    
    // リセット後は初期状態に戻ることを期待
    expect(resetImageCount).toBe(initialImageCount);
  });
  
  test('高解像度画像をバッチ処理でダウンロードできる', async ({ page }) => {
    // 複数の画像を選択
    await page.click('.image-card:nth-child(1) input[type="checkbox"]');
    await page.click('.image-card:nth-child(2) input[type="checkbox"]');
    
    // 選択された画像数を確認
    const selectedCount = await page.locator('.selected-count').innerText();
    expect(selectedCount).toContain('2'); // 「2個の画像が選択されています」のようなテキスト
    
    // ダウンロードボタンが有効になっていることを確認
    await expect(page.locator('button.batch-download')).toBeEnabled();
    
    // 一括ダウンロードをテスト
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.batch-download');
    const download = await downloadPromise;
    
    // ダウンロードされたファイル名を確認（ZIPファイルを想定）
    const fileName = download.suggestedFilename();
    expect(fileName).toMatch(/\.zip$/);
  });
  
  test('印刷用フォーマットでエクスポートできる', async ({ page }) => {
    // エクスポート設定を表示
    await page.click('button.export-options');
    
    // 印刷用フォーマットを選択
    await page.selectOption('select[name="exportFormat"]', 'print');
    
    // 解像度を選択
    await page.selectOption('select[name="resolution"]', 'high');
    
    // 画像を選択
    await page.click('.image-card:first-child input[type="checkbox"]');
    
    // エクスポートボタンをクリック
    const downloadPromise = page.waitForEvent('download');
    await page.click('button.export-selected');
    const download = await downloadPromise;
    
    // ダウンロードされたファイル名を確認
    const fileName = download.suggestedFilename();
    // 印刷用フォーマットのファイル名を確認
    expect(fileName).toMatch(/print.*\.(tif|pdf)$/i);
  });
});