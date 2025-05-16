/**
 * テスト用注文データ
 */
const testOrders = [
  {
    userLineId: 'test-user-1',
    status: 'pending',
    totalAmount: 3500,
    items: [
      {
        id: 'tshirt-m',
        name: 'Tシャツ Mサイズ',
        price: 3500,
        quantity: 1,
      },
    ],
    shippingAddress: {
      name: 'テストユーザー1',
      postalCode: '123-4567',
      prefecture: '東京都',
      city: '渋谷区',
      address: '1-2-3',
      phone: '090-1234-5678',
    },
    paymentId: 'test-payment-1',
    imageUrl: 'https://example.com/test-image-1.jpg',
  },
  {
    userLineId: 'test-user-1',
    status: 'processing',
    totalAmount: 7000,
    items: [
      {
        id: 'tshirt-l',
        name: 'Tシャツ Lサイズ',
        price: 3500,
        quantity: 2,
      },
    ],
    shippingAddress: {
      name: 'テストユーザー1',
      postalCode: '123-4567',
      prefecture: '東京都',
      city: '渋谷区',
      address: '1-2-3',
      phone: '090-1234-5678',
    },
    paymentId: 'test-payment-2',
    imageUrl: 'https://example.com/test-image-2.jpg',
  },
  {
    userLineId: 'test-user-2',
    status: 'shipped',
    totalAmount: 3500,
    items: [
      {
        id: 'tshirt-s',
        name: 'Tシャツ Sサイズ',
        price: 3500,
        quantity: 1,
      },
    ],
    shippingAddress: {
      name: 'テストユーザー2',
      postalCode: '987-6543',
      prefecture: '大阪府',
      city: '大阪市',
      address: '4-5-6',
      phone: '090-8765-4321',
    },
    paymentId: 'test-payment-3',
    imageUrl: 'https://example.com/test-image-3.jpg',
  },
  {
    userLineId: 'test-user-2',
    status: 'completed',
    totalAmount: 7000,
    items: [
      {
        id: 'tshirt-m',
        name: 'Tシャツ Mサイズ',
        price: 3500,
        quantity: 2,
      },
    ],
    shippingAddress: {
      name: 'テストユーザー2',
      postalCode: '987-6543',
      prefecture: '大阪府',
      city: '大阪市',
      address: '4-5-6',
      phone: '090-8765-4321',
    },
    paymentId: 'test-payment-4',
    imageUrl: 'https://example.com/test-image-4.jpg',
  },
];

module.exports = { testOrders };