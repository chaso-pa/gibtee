const { test, expect } = require('@playwright/test');

test.describe('管理パネル認証', () => {
  test('管理者は正しい認証情報でログインできる', async ({ page }) => {
    // ログインページにアクセス
    await page.goto(`${global.testConfig.adminUrl}/login`);
    
    // ログインフォームが表示されていることを確認
    await expect(page.locator('form')).toBeVisible();
    
    // 認証情報を入力
    await page.fill('input[name="username"]', global.testConfig.adminUser.username);
    await page.fill('input[name="password"]', global.testConfig.adminUser.password);
    
    // ログインボタンをクリック
    await page.click('button[type="submit"]');
    
    // ダッシュボードにリダイレクトされたことを確認
    await page.waitForURL(`${global.testConfig.adminUrl}/dashboard`);
    
    // ダッシュボードの要素が表示されていることを確認
    await expect(page.locator('.dashboard-container')).toBeVisible();
  });
  
  test('無効な認証情報ではログインできない', async ({ page }) => {
    // ログインページにアクセス
    await page.goto(`${global.testConfig.adminUrl}/login`);
    
    // 無効な認証情報を入力
    await page.fill('input[name="username"]', 'wrong-user');
    await page.fill('input[name="password"]', 'wrong-password');
    
    // ログインボタンをクリック
    await page.click('button[type="submit"]');
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('.error-message')).toBeVisible();
    
    // ログインページに留まっていることを確認
    await expect(page).toHaveURL(`${global.testConfig.adminUrl}/login`);
  });
  
  test('ログアウト機能が正しく動作する', async ({ page }) => {
    // まずログイン
    await page.goto(`${global.testConfig.adminUrl}/login`);
    await page.fill('input[name="username"]', global.testConfig.adminUser.username);
    await page.fill('input[name="password"]', global.testConfig.adminUser.password);
    await page.click('button[type="submit"]');
    
    // ダッシュボードにリダイレクトされたことを確認
    await page.waitForURL(`${global.testConfig.adminUrl}/dashboard`);
    
    // ログアウトボタンをクリック
    await page.click('button.logout-button');
    
    // ログインページにリダイレクトされたことを確認
    await page.waitForURL(`${global.testConfig.adminUrl}/login`);
  });
});