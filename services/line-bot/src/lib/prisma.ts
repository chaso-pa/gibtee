import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

// グローバルスコープで宣言してホットリロード時に複数インスタンスが生成されるのを防ぐ
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Prismaクライアントのシングルトンインスタンス
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query'
      },
      {
        emit: 'event',
        level: 'error'
      },
      {
        emit: 'event',
        level: 'info'
      },
      {
        emit: 'event',
        level: 'warn'
      }
    ]
  });

// デバッグログ設定
if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  prisma.$on('query', (e: any) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });

  // @ts-ignore
  prisma.$on('error', (e: any) => {
    logger.error(`Prisma Error: ${e.message}`);
  });

  // @ts-ignore
  prisma.$on('info', (e: any) => {
    logger.info(`Prisma Info: ${e.message}`);
  });

  // @ts-ignore
  prisma.$on('warn', (e: any) => {
    logger.warn(`Prisma Warning: ${e.message}`);
  });
}

// 開発環境以外ではグローバル変数にPrismaを保存
if (process.env.NODE_ENV !== 'development') {
  globalForPrisma.prisma = prisma;
}
