const { setupServer } = require('msw/node');
const { lineApiHandlers } = require('./line-api/handlers');
const { stripeApiHandlers } = require('./stripe-api/handlers');
const { awsS3Handlers } = require('./aws-s3/handlers');

// モックサーバーの作成
const server = setupServer(
  ...lineApiHandlers,
  ...stripeApiHandlers,
  ...awsS3Handlers
);

module.exports = { server };