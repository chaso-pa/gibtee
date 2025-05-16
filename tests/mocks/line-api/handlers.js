const { rest } = require('msw');

const lineApiHandlers = [
  // LINEメッセージ送信のモック
  rest.post('https://api.line.me/v2/bot/message/reply', (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ message: 'Messages sent successfully' }));
  }),
  
  // LINEユーザープロファイル取得のモック
  rest.get('https://api.line.me/v2/bot/profile/:userId', (req, res, ctx) => {
    const { userId } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        userId,
        displayName: userId.startsWith('test-') ? 'Test User' : 'Regular User',
        pictureUrl: 'https://example.com/user.jpg',
      })
    );
  }),

  // LINEイメージコンテンツ取得のモック
  rest.get('https://api-data.line.me/v2/bot/message/:messageId/content', (req, res, ctx) => {
    // テスト用の画像を返すようにマークする
    // 実际には細かいBuffer操作が必要かもしれない
    return res(
      ctx.status(200),
      ctx.set('Content-Type', 'image/jpeg'),
      ctx.body(new ArrayBuffer(8)) // ダミー画像データ
    );
  }),
];

module.exports = { lineApiHandlers };