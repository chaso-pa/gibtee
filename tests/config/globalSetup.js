const { PrismaClient } = require('@prisma/client');
const { seedTestData } = require('../fixtures/seed');

/**
 * Jestのグローバルセットアップ
 * すべてのテストの前に実行される
 */
module.exports = async () => {
  console.log('\nテスト環境のセットアップを開始します...');
  
  // 環境変数の設定
  process.env.NODE_ENV = 'test';
  
  // テスト用データベース接続設定
  const prisma = new PrismaClient();
  
  try {
    // データベース接続確認
    await prisma.$connect();
    console.log('データベース接続成功');
    
    // テスト用データの初期化
    console.log('テスト用データを初期化しています...');
    await seedTestData();
    console.log('テスト用データの初期化完了');
    
  } catch (error) {
    console.error('テスト環境のセットアップ中にエラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
  
  console.log('テスト環境のセットアップが完了しました\n');
};