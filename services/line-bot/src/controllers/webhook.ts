import { Request, Response } from 'express';
import { WebhookEvent } from '@line/bot-sdk';
import { logger } from '../utils/logger.js';
import { handleMessage } from './message.js';
import { handleFollow, handleUnfollow } from './user.js';

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const events: WebhookEvent[] = req.body.events;
    logger.info(`Webhookイベント受信: ${events.length}件`);

    // イベントごとに非同期で処理
    await Promise.all(
      events.map(async (event) => {
        try {
          // イベントタイプに基づいて処理を分岐
          switch (event.type) {
            case 'message':
              await handleMessage(event);
              break;
            case 'follow':
              await handleFollow(event);
              break;
            case 'unfollow':
              await handleUnfollow(event);
              break;
            default:
              logger.info(`未処理のイベントタイプ: ${event.type}`);
              break;
          }
        } catch (err: any) {
          logger.error(`イベント処理エラー: ${err.message}`);
        }
      })
    );

    res.status(200).json({ message: 'OK' });
  } catch (err: any) {
    logger.error(`Webhook処理エラー: ${err.message}`);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
