import { Request, Response } from "express";
import { WebhookEvent, MessageEvent } from "@line/bot-sdk";
import { logger } from "../utils/logger";
import { handleMessage as handleMessageOriginal } from "./message";
import { handleFollow, handleUnfollow } from "./user";
import { handleRichMenuMessage } from "./rich-menu-handler";
import { sendTextMessage } from "../services/line";
import {
  getUserConversationState,
  saveUserConversation,
} from "../services/conversation";

export const handleWebhook = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const events: WebhookEvent[] = req.body.events;
    logger.info(`Webhookイベント受信: ${events.length}件`);

    // イベントごとに非同期で処理
    await Promise.all(
      events.map(async (event) => {
        try {
          // イベントタイプに基づいて処理を分類
          switch (event.type) {
            case "message":
              await handleMessage(event as MessageEvent);
              break;
            case "follow":
              await handleFollow(event);
              break;
            case "unfollow":
              await handleUnfollow(event);
              break;
            default:
              logger.info(`未処理のイベントタイプ: ${event.type}`);
              break;
          }
        } catch (err: any) {
          logger.error(`イベント処理エラー: ${err.message}`);
        }
      }),
    );

    res.status(200).json({ message: "OK" });
  } catch (err: any) {
    logger.error(`Webhook処理エラー: ${err.message}`);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// メッセージイベントのハンドラを拡張
export const handleMessage = async (event: MessageEvent): Promise<void> => {
  const userId = event.source.userId as string;

  try {
    // 会話状態を取得
    const { state, context } = await getUserConversationState(userId);
    logger.info(`現在の会話状態: ${userId} - ${state}`);

    // リッチメニューからのメッセージかどうかを確認
    if (event.message.type === "text") {
      const text = event.message.text;
      // リッチメニューの特定のコマンドをチェック
      if (
        text === "新しい画像" ||
        text === "過去の注文を確認" ||
        text === "Q&A"
      ) {
        // リッチメニューハンドラで処理
        await handleRichMenuMessage(event);
        // 会話履歴を保存して終了
        await saveUserConversation(userId, event);
        return;
      }
    }

    // 通常のメッセージ処理にフォールバック
    await handleMessageOriginal(event);
  } catch (error: any) {
    logger.error(`メッセージ処理エラー: ${error.message}`);
    await sendTextMessage(
      userId,
      "すみません、メッセージの処理中にエラーが発生しました。しばらく待ってからもう一度お試しください。",
    );
  }
};
