import dotenv from 'dotenv';
import path from 'node:path';

// 環境変数の読み込み
dotenv.config({ path: path.resolve(import.meta.dirname, '../../.env') });

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT || '3000', 10),

  // ロギング設定
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIR || 'logs'
  },

  // LINE Bot設定
  line: {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    channelSecret: process.env.LINE_CHANNEL_SECRET || ''
  },

  // データベース設定
  database: {
    url: process.env.DATABASE_URL || 'mysql://username:password@localhost:3306/gibtee'
  },

  // JWT認証設定
  jwt: {
    secret: process.env.JWT_SECRET || 'gibtee-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // AWS設定
  aws: {
    region: process.env.AWS_REGION || 'ap-southeast-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || ''
  },

  // 画像処理サービス
  imageProcessor: {
    url: process.env.IMAGE_PROCESSOR_URL || 'http://image-processor:3001',
    apiKey: process.env.IMAGE_PROCESSOR_API_KEY || ''
  },

  // Slack通知
  slack: {
    webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    channel: process.env.SLACK_CHANNEL || '#gibtee-notifications',
    username: process.env.SLACK_USERNAME || 'gibtee-bot'
  }
};
