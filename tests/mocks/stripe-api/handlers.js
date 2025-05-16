const { rest } = require('msw');

const stripeApiHandlers = [
  // 決済メソッド作成のモック
  rest.post('https://api.stripe.com/v1/payment_methods', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'pm_test_123456789',
        object: 'payment_method',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
      })
    );
  }),

  // 支払いインテント作成のモック
  rest.post('https://api.stripe.com/v1/payment_intents', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'pi_test_123456789',
        object: 'payment_intent',
        amount: 5000,
        currency: 'jpy',
        status: 'requires_confirmation',
        client_secret: 'pi_test_secret_123456789',
      })
    );
  }),

  // 支払いインテント確認のモック
  rest.post('https://api.stripe.com/v1/payment_intents/:intentId/confirm', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: req.params.intentId,
        object: 'payment_intent',
        amount: 5000,
        currency: 'jpy',
        status: 'succeeded',
      })
    );
  }),
];

module.exports = { stripeApiHandlers };