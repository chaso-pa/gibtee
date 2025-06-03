import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';

// ログディレクトリの作成（存在しない場合）
const logDir = config.logging.directory;
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// フォーマット設定
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// コンソール出力用フォーマット（開発環境向け）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}${info.stack ? '\n' + info.stack : ''}`
  )
);

// トランスポート設定
const transports = [
  // エラーログをファイルに出力
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error'
  }),
  // すべてのログをファイルに出力
  new winston.transports.File({
    filename: path.join(logDir, 'combined.log')
  })
];

// 開発環境ではコンソールにも出力
if (config.nodeEnv !== 'production') {
  transports.push(
    // @ts-ignore
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

// ロガーの作成
export const logger = winston.createLogger({
  level: config.logging.level,
  format,
  defaultMeta: { service: 'image-processor-service' },
  transports,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
});

// 起動時のログ
logger.info(`Logger initialized with level: ${config.logging.level}`);
