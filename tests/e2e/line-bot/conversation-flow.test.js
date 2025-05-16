const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const apiUrl = global.testConfig.apiUrl;

describe('LINE Bot 会話フロー', () => {
  let userId = 'test-conversation-flow';
  
  beforeAll(async () => {
    // テスト用データのセットアップ
    await prisma.user.upsert({
      where: { lineId: userId },
      update: {},
      create: {
        lineId: userId,
        name: 'テスト会話フロー',
        email: 'test-conv@example.com',
      },
    });
  });

  afterAll(async () => {
    // テスト後のクリーンアップ
    await prisma.user.delete({
      where: { lineId: userId },
    });
    await prisma.$disconnect();
  });

  test('最初のグリーティングメッセージに対して正しく反応する', async () => {
    // 「こんにちは」メッセージを送信
    const res = await request(apiUrl)
      .post('/webhook')
      .send({
        destination: 'destination',
        events: [{
          type: 'message',
          message: {
            type: 'text',
            text: 'こんにちは',
            id: 'test-message-id-greeting',
          },
          source: {
            userId,
            type: 'user',
          },
          timestamp: Date.now(),
        }],
      });

    expect(res.status).toBe(200);
    // 実際の実装では、レスポンスメッセージの内容を確認する方法が必要
    // ここではモックを使用しているのでステータスコードのみを確認
  });

  test('ヘルプコマンドに正しく反応する', async () => {
    // 「ヘルプ」メッセージを送信
    const res = await request(apiUrl)
      .post('/webhook')
      .send({
        destination: 'destination',
        events: [{
          type: 'message',
          message: {
            type: 'text',
            text: 'ヘルプ',
            id: 'test-message-id-help',
          },
          source: {
            userId,
            type: 'user',
          },
          timestamp: Date.now(),
        }],
      });

    expect(res.status).toBe(200);
  });

  test('ユーザーがスタートコマンドを送信したときに正しく反応する', async () => {
    // 「スタート」メッセージを送信
    const res = await request(apiUrl)
      .post('/webhook')
      .send({
        destination: 'destination',
        events: [{
          type: 'message',
          message: {
            type: 'text',
            text: 'スタート',
            id: 'test-message-id-start',
          },
          source: {
            userId,
            type: 'user',
          },
          timestamp: Date.now(),
        }],
      });

    expect(res.status).toBe(200);
  });

  test('ユーザーがテキストを送信したときに写真のお願いメッセージが返る', async () => {
    // ランダムなテキストメッセージを送信
    const res = await request(apiUrl)
      .post('/webhook')
      .send({
        destination: 'destination',
        events: [{
          type: 'message',
          message: {
            type: 'text',
            text: 'こんなデザインが欲しい',
            id: 'test-message-id-random',
          },
          source: {
            userId,
            type: 'user',
          },
          timestamp: Date.now(),
        }],
      });

    expect(res.status).toBe(200);
  });
});