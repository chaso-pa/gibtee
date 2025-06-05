// src/middleware/order-acceptance-check.ts
import type { Request, Response, NextFunction } from 'express';
import { SystemSettingsService } from '../services/system-settings.js';
import { sendTextMessage } from '../services/line.js';
import { logger } from '../utils/logger.js';
import type { WebhookEvent } from '@line/bot-sdk';

/**
 * 注文受付状態をチェックする
 */
export const checkOrderAcceptance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.body) {
      next();
      return;
    }
    const events: WebhookEvent[] = req.body.events;
    const { source } = events[0];
    const userId = source.userId as string;

    if (!userId) {
      next();
      return;
    }

    const acceptanceStatus = await SystemSettingsService.checkOrderAcceptanceStatus();

    if (!acceptanceStatus.canAcceptOrder) {
      logger.info(`注文受付停止中のためリクエストを拒否: ${userId}`);

      // 受付停止メッセージを送信
      if (acceptanceStatus.message) {
        await sendTextMessage(userId, acceptanceStatus.message);
      }

      // レスポンスを送信してここで処理を終了
      res.status(503).json({
        success: false,
        message: 'Order acceptance is currently suspended'
      });
      return;
    }

    // 受付可能な場合は次のハンドラーに進む
    next();
  } catch (error: any) {
    logger.error(`注文受付状態チェックエラー: ${error.message}`);
    // エラーが発生した場合は安全のため処理を続行
    next();
  }
};

/**
 * テキストメッセージに対して注文受付チェックを行う関数
 */
export const checkOrderAcceptanceForMessage = async (lineUserId: string, messageText: string): Promise<boolean> => {
  try {
    // 注文に関連するキーワードをチェック
    const orderKeywords = ['注文', '写真', 'ジブリ', 'gibtee', 'Tシャツ', '新しい写真', 'はじめる', 'スタート'];

    const isOrderRelated = orderKeywords.some((keyword) => messageText.includes(keyword));

    if (!isOrderRelated) {
      return true; // 注文関連でない場合は処理を続行
    }

    const acceptanceStatus = await SystemSettingsService.checkOrderAcceptanceStatus();

    if (!acceptanceStatus.canAcceptOrder) {
      logger.info(`注文受付停止中のためメッセージを拒否: ${lineUserId}`);

      // 受付停止メッセージを送信
      if (acceptanceStatus.message) {
        await sendTextMessage(lineUserId, acceptanceStatus.message);
      }

      return false; // 処理を停止
    }

    return true; // 受付可能
  } catch (error: any) {
    logger.error(`メッセージの注文受付状態チェックエラー: ${error.message}`);
    // エラーが発生した場合は安全のため処理を続行
    return true;
  }
};

/**
 * 画像メッセージに対して注文受付チェックを行う関数
 */
export const checkOrderAcceptanceForImage = async (lineUserId: string): Promise<boolean> => {
  try {
    const acceptanceStatus = await SystemSettingsService.checkOrderAcceptanceStatus();

    if (!acceptanceStatus.canAcceptOrder) {
      logger.info(`注文受付停止中のため画像処理を拒否: ${lineUserId}`);

      // 受付停止メッセージを送信
      if (acceptanceStatus.message) {
        await sendTextMessage(lineUserId, acceptanceStatus.message);
      }

      return false; // 処理を停止
    }

    return true; // 受付可能
  } catch (error: any) {
    logger.error(`画像の注文受付状態チェックエラー: ${error.message}`);
    // エラーが発生した場合は安全のため処理を続行
    return true;
  }
};
