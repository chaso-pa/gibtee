import { sendTextMessage } from './line.js';
import { logger } from '../utils/logger.js';
import { getFAQs } from './faq-service.js';
import { prisma } from '@/lib/prisma.js';
import { formatOrderStatus, getOrderHistory } from './order-service.js';
import { Order } from '@prisma/client';

/**
 * ヘルプコマンドを処理する
 */
export const handleHelpCommand = async (userId: string): Promise<void> => {
  logger.info(`ヘルプコマンド処理: ${userId}`);

  const helpMessage =
    'gibteeの使い方:\n\n' +
    '1. ジブリ風に変換したい写真を送ってください\n' +
    '2. AIが写真をジブリ風に変換します\n' +
    '3. 変換された画像をTシャツにプレビューします\n' +
    '4. サイズと数量を選んで注文できます\n' +
    '5. 住所と決済情報を入力して注文完了！\n\n' +
    '◆ コマンド一覧 ◆\n' +
    '「ヘルプ」または「使い方」: このメッセージを表示\n' +
    '「質問」または「FAQ」: よくある質問と回答\n' +
    '「状況」または「注文状況」: 注文の状況を確認\n\n' +
    '何か質問がありましたら、お気軽にお問い合わせください！';

  await sendTextMessage(userId, helpMessage);
};

/**
 * 「Q&A」リクエストの処理
 */
export const handleFaqCommand = async (userId: string): Promise<void> => {
  try {
    logger.info(`FAQコマンド処理: ${userId}`);

    // FAQリストを取得
    const faqs = await getFAQs();

    // FAQメッセージを作成
    let faqMessage = '【よくある質問】\n\n';

    faqs.forEach((faq, index) => {
      if (index !== 0) {
        faqMessage += `\n\n`;
      }
      faqMessage += `${index + 1}. ${faq.question}\n`;
      faqMessage += `${faq.answer}`;
    });

    await sendTextMessage(userId, faqMessage);
  } catch (error: any) {
    logger.error(`FAQ取得エラー: ${error.message}`);
    throw error;
  }
};

/**
 * 注文状況確認コマンドを処理する
 */
export const handleOrderStatusCommand = async (userId: string): Promise<void> => {
  logger.info(`注文状況コマンド処理: ${userId}`);

  // MCPフェーズではダミー実装
  const statusMessage =
    '現在の注文状況:\n\n' + '注文はありません。\n\n' + 'MCPフェーズのため、この機能はまだ実装されていません。';

  await sendTextMessage(userId, statusMessage);
};

/**
 * 「過去の注文を確認」リクエストの処理
 */
export const handleOrderHistoryRequest = async (userId: string): Promise<void> => {
  try {
    // ユーザーIDからLINEユーザーIDを取得
    const user = await prisma.user.findUnique({
      where: { lineUserId: userId }
    });

    if (!user) {
      const message = '注文履歴がありません。まずは「新しい画像」から注文を始めてみましょう！';
      await sendTextMessage(userId, message);
      return;
    }

    // 注文履歴を取得
    const orders = await getOrderHistory(user.id);

    if (orders.length === 0) {
      const message = '注文履歴がありません。まずは「新しい画像」から注文を始めてみましょう！';
      await sendTextMessage(userId, message);
      return;
    }

    // 注文履歴をフォーマットしてメッセージを作成
    const orderItems = orders.map((order: Order, index: number) => {
      const date = new Date(order.createdAt).toLocaleDateString('ja-JP');
      return `${index + 1}. 注文番号: ${order.orderNumber}\n日付: ${date}\n状態: ${formatOrderStatus(order.status)}\n`;
    });

    const message = `【注文履歴】\n\n${orderItems.join('\n')}`;

    // TODO: 詳細な注文確認
    // const message = `【注文履歴】\n\n${orderItems.join("\n")}\n\n特定の注文について詳細を確認するには、「注文番号:○○○○」と送信してください。`;

    await sendTextMessage(userId, message);
  } catch (error: any) {
    logger.error(`注文履歴取得エラー: ${error.message}`);
    throw error;
  }
};
