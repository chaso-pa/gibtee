const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * テスト用データベースをクリーンアップする
 */
async function cleanupDatabase() {
  // 注文に関連するレコードを削除
  await prisma.order.deleteMany({
    where: {
      user: {
        lineId: {
          startsWith: 'test-',
        },
      },
    },
  });

  // テスト用ユーザーを削除
  await prisma.user.deleteMany({
    where: {
      lineId: {
        startsWith: 'test-',
      },
    },
  });

  // 管理者以外の管理パネルユーザーを削除
  await prisma.adminUser.deleteMany({
    where: {
      username: {
        not: 'admin',
      },
      isTest: true,
    },
  });

  console.log('Database cleaned up for testing');
}

module.exports = { cleanupDatabase, prisma };