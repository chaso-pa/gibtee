import { Profile } from '@line/bot-sdk';
import { prisma } from '../lib/prisma.js'; // .js拡張子に注意
import { logger } from '../utils/logger.js';

/**
 * ユーザー情報をデータベースに保存
 */
export const saveUserToDB = async (lineUserId: string, profile: Profile): Promise<void> => {
  try {
    // upsert: 存在すれば更新、なければ作成
    await prisma.user.upsert({
      where: {
        lineUserId: lineUserId
      },
      update: {
        displayName: profile.displayName,
        profileImageUrl: profile.pictureUrl,
        status: 'active'
      },
      create: {
        lineUserId: lineUserId,
        displayName: profile.displayName,
        profileImageUrl: profile.pictureUrl,
        status: 'active'
      }
    });

    logger.info(`ユーザー情報保存成功: ${lineUserId}`);
  } catch (error: any) {
    logger.error(`ユーザー情報保存エラー: ${error.message}`);
    throw error;
  }
};

/**
 * ユーザーを非アクティブに設定
 */
export const deactivateUser = async (lineUserId: string): Promise<void> => {
  try {
    await prisma.user.update({
      where: {
        lineUserId: lineUserId
      },
      data: {
        status: 'inactive'
      }
    });

    logger.info(`ユーザー非アクティブ化成功: ${lineUserId}`);
  } catch (error: any) {
    logger.error(`ユーザー非アクティブ化エラー: ${error.message}`);
    throw error;
  }
};
