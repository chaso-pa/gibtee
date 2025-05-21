// src/controllers/rich-menu-handler.ts
import { MessageEvent, TextEventMessage } from "@line/bot-sdk";
import { client } from "../lib/line-client";
import { logger } from "../utils/logger";
import { prisma } from "../lib/prisma";
import { handleImageUploadFlow } from "./image-handler";
import { getOrderHistory } from "../services/order-service";
import { getFAQs } from "../services/faq-service";

/**
 * リッチメニューからのメッセージをハンドリングする関数
 */
export const handleRichMenuMessage = async (event: MessageEvent): Promise<void> => {
  if (event.type !== "message" || event.message.type !== "text") {
    return;
  }

  const { text } = event.message;
  const userId = event.source.userId!;

  try {
    switch (text) {
      case "新しい画像":
        await handleNewImageRequest(event);
        break;
        
      case "過去の注文を確認":
        await handleOrderHistoryRequest(event);
        break;
        
      case "Q&A":
        await handleFAQRequest(event);
        break;
        
      default:
        // リッチメニュー以外のメッセージは別ハンドラで処理
        return;
    }
  } catch (error: any) {
    logger.error(`リッチメニューハンドラエラー: ${error.message}`);
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "申し訳ありません、エラーが発生しました。しばらくしてからもう一度お試しください。"
    });
  }
};

/**
 * 「新しい画像」リクエストの処理
 */
const handleNewImageRequest = async (event: MessageEvent): Promise<void> => {
  // 画像アップロードフローを開始
  await handleImageUploadFlow(event);
};

/**
 * 「過去の注文を確認」リクエストの処理
 */
const handleOrderHistoryRequest = async (event: MessageEvent): Promise<void> => {
  const userId = event.source.userId!;
  
  try {
    // ユーザーIDからLINEユーザーIDを取得
    const user = await prisma.user.findUnique({
      where: { lineUserId: userId }
    });
    
    if (!user) {
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: "注文履歴がありません。まずは「新しい画像」から注文を始めてみましょう！"
      });
      return;
    }
    
    // 注文履歴を取得
    const orders = await getOrderHistory(user.id);
    
    if (orders.length === 0) {
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: "注文履歴がありません。まずは「新しい画像」から注文を始めてみましょう！"
      });
      return;
    }
    
    // 注文履歴をフォーマットしてメッセージを作成
    const orderItems = orders.map((order, index) => {
      const date = new Date(order.createdAt).toLocaleDateString("ja-JP");
      return `${index + 1}. 注文番号: ${order.orderNumber}\n日付: ${date}\n状態: ${formatOrderStatus(order.status)}\n`;
    });
    
    const message = {
      type: "text",
      text: `【注文履歴】\n\n${orderItems.join("\n")}\n\n特定の注文について詳細を確認するには、「注文番号:○○○○」と送信してください。`
    };
    
    await client.replyMessage(event.replyToken, message);
  } catch (error: any) {
    logger.error(`注文履歴取得エラー: ${error.message}`);
    throw error;
  }
};

/**
 * 「Q&A」リクエストの処理
 */
const handleFAQRequest = async (event: MessageEvent): Promise<void> => {
  try {
    // FAQリストを取得
    const faqs = await getFAQs();
    
    // FAQメッセージを作成
    let faqMessage = "【よくある質問】\n\n";
    
    faqs.forEach((faq, index) => {
      faqMessage += `${index + 1}. ${faq.question}\n`;
    });
    
    faqMessage += "\n質問の詳細を見るには、質問の番号（例: 「FAQ 1」）を送信してください。";
    
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: faqMessage
    });
  } catch (error: any) {
    logger.error(`FAQ取得エラー: ${error.message}`);
    throw error;
  }
};

/**
 * 注文ステータスを日本語に変換
 */
const formatOrderStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    pending: "処理待ち",
    paid: "支払い完了",
    processing: "処理中",
    printing: "印刷中",
    shipped: "発送済み",
    delivered: "配達完了",
    cancelled: "キャンセル済み"
  };
  
  return statusMap[status] || status;
};
