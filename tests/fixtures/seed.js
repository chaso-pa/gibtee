const { PrismaClient } = require('@prisma/client');
const { testUsers } = require('./users');
const { testOrders } = require('./orders');

const prisma = new PrismaClient();

/**
 * テスト用データのシード処理
 */
async function seedTestData() {
  console.log('Seeding test data...');

  // テストユーザーの作成
  for (const user of testUsers) {
    await prisma.user.upsert({
      where: { lineId: user.lineId },
      update: user,
      create: user,
    });
    console.log(`Created/Updated test user: ${user.name}`);
  }

  // テスト注文の作成
  for (const order of testOrders) {
    // 注文に関連するユーザーの取得
    const user = await prisma.user.findUnique({
      where: { lineId: order.userLineId },
    });

    if (!user) {
      console.log(`User with lineId ${order.userLineId} not found, skipping order`);
      continue;
    }

    // 注文の作成
    const newOrder = await prisma.order.create({
      data: {
        status: order.status,
        totalAmount: order.totalAmount,
        items: order.items,
        shippingAddress: order.shippingAddress,
        userId: user.id,
        paymentId: order.paymentId,
      },
    });

    console.log(`Created test order: ${newOrder.id} (${order.status})`);

    // 画像情報の作成
    if (order.imageUrl) {
      await prisma.image.create({
        data: {
          url: order.imageUrl,
          originalUrl: `original-${order.imageUrl}`,
          userId: user.id,
          orderId: newOrder.id,
          status: 'completed',
        },
      });

      console.log(`Created test image for order: ${newOrder.id}`);
    }
  }

  // テスト管理者ユーザーの作成
  await prisma.adminUser.upsert({
    where: { username: 'test-admin' },
    update: {
      password: '$2a$10$yyXLjvKOAYNQCbBbMxwlzeRTnHhgVi4UltLYCm9DlDQsqFM.gYdl2', // 'test-password'
      isTest: true,
    },
    create: {
      username: 'test-admin',
      password: '$2a$10$yyXLjvKOAYNQCbBbMxwlzeRTnHhgVi4UltLYCm9DlDQsqFM.gYdl2', // 'test-password'
      isTest: true,
    },
  });

  console.log('Test data seeding complete!');
}

// スクリプトとして直接実行された場合、シード処理を実行
if (require.main === module) {
  seedTestData()
    .catch((e) => {
      console.error('Error seeding test data:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedTestData };