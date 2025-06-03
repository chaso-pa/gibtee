import axios from 'axios';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

/**
 * Slackへ通知を送信する共通関数
 */
const sendSlackNotification = async (payload: {
  channel?: string;
  username?: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
}): Promise<boolean> => {
  try {
    if (!config.slack.webhookUrl) {
      logger.warn('Slack webhook URL is not configured');
      return false;
    }

    const defaultPayload = {
      channel: config.slack.channel,
      username: config.slack.username
    };

    const response = await axios.post(config.slack.webhookUrl, {
      ...defaultPayload,
      ...payload
    });

    if (response.status === 200) {
      logger.info(`Slack notification sent successfully`);
      return true;
    } else {
      logger.error(`Failed to send Slack notification: ${response.statusText}`);
      return false;
    }
  } catch (error: any) {
    logger.error(`Error sending Slack notification: ${error.message}`);
    return false;
  }
};

/**
 * 新規注文をSlackに通知する
 */
export const notifyNewOrder = async (
  orderNumber: string,
  userId: string,
  orderDetails: {
    color: string;
    size: string;
    quantity: number;
    amount: number;
  },
  shippingDetails: {
    recipientName: string;
    prefecture: string;
    city: string;
  }
): Promise<boolean> => {
  try {
    // 注文情報を整形
    const orderInfo = [
      `*注文番号:* ${orderNumber}`,
      `*Tシャツ:* ${orderDetails.color} / ${orderDetails.size} / ${orderDetails.quantity}枚`,
      `*金額:* ¥${orderDetails.amount.toLocaleString()}`,
      `*お届け先:* ${shippingDetails.prefecture} ${shippingDetails.city}`,
      `*受取人:* ${shippingDetails.recipientName}`
    ].join('\n');

    // Slackメッセージを構築
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 新規注文が入りました！',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: orderInfo
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `注文日時: ${new Date().toLocaleString('ja-JP')} | ユーザーID: ${userId}`
          }
        ]
      },
      {
        type: 'divider'
      }
    ];

    // Slack通知を送信
    return await sendSlackNotification({
      text: `新規注文: ${orderNumber}`,
      blocks
    });
  } catch (error: any) {
    logger.error(`Error creating new order notification: ${error.message}`);
    return false;
  }
};

/**
 * 注文ステータス変更をSlackに通知する
 */
export const notifyOrderStatusUpdate = async (
  orderNumber: string,
  oldStatus: string,
  newStatus: string
): Promise<boolean> => {
  try {
    // ステータスの日本語表記
    const statusMap: { [key: string]: string } = {
      pending: '処理待ち',
      paid: '支払済み',
      processing: '処理中',
      printing: '印刷中',
      shipped: '発送済み',
      delivered: '配達完了',
      cancelled: 'キャンセル'
    };

    // ステータスに応じたアイコン
    const statusIcon: { [key: string]: string } = {
      pending: '⏳',
      paid: '💰',
      processing: '🔄',
      printing: '🖨',
      shipped: '📦',
      delivered: '✅',
      cancelled: '❌'
    };

    const oldStatusText = statusMap[oldStatus] || oldStatus;
    const newStatusText = statusMap[newStatus] || newStatus;
    const icon = statusIcon[newStatus] || '📋';

    // Slackメッセージを構築
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${icon} 注文ステータスが更新されました`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*注文番号:* ${orderNumber}\n*ステータス:* ${oldStatusText} → *${newStatusText}*`
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `更新日時: ${new Date().toLocaleString('ja-JP')}`
          }
        ]
      },
      {
        type: 'divider'
      }
    ];

    // Slack通知を送信
    return await sendSlackNotification({
      text: `注文ステータス更新: ${orderNumber} (${oldStatusText} → ${newStatusText})`,
      blocks
    });
  } catch (error: any) {
    logger.error(`Error creating status update notification: ${error.message}`);
    return false;
  }
};

/**
 * 支払い完了をSlackに通知する
 */
export const notifyPaymentComplete = async (
  orderNumber: string,
  paymentMethod: string,
  amount: number
): Promise<boolean> => {
  try {
    // 支払い方法の日本語表記
    const methodMap: { [key: string]: string } = {
      LINE_PAY: 'LINE Pay',
      CREDIT_CARD: 'クレジットカード'
    };

    const methodText = methodMap[paymentMethod] || paymentMethod;

    // Slackメッセージを構築
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '💸 支払いが完了しました',
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `*注文番号:* ${orderNumber}`,
            `*支払い方法:* ${methodText}`,
            `*金額:* ¥${amount.toLocaleString()}`
          ].join('\n')
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `支払日時: ${new Date().toLocaleString('ja-JP')}`
          }
        ]
      },
      {
        type: 'divider'
      }
    ];

    // Slack通知を送信
    return await sendSlackNotification({
      text: `支払い完了: ${orderNumber} (¥${amount.toLocaleString()})`,
      blocks
    });
  } catch (error: any) {
    logger.error(`Error creating payment complete notification: ${error.message}`);
    return false;
  }
};

/**
 * エラーをSlackに通知する
 */
export const notifyError = async (title: string, errorMessage: string, details?: any): Promise<boolean> => {
  try {
    // エラー詳細を整形
    let detailsText = '';
    if (details) {
      try {
        if (typeof details === 'object') {
          detailsText = '```' + JSON.stringify(details, null, 2) + '```';
        } else {
          detailsText = '```' + details.toString() + '```';
        }
      } catch (e) {
        detailsText = '```(エラー詳細を変換できませんでした)```';
      }
    }

    // Slackメッセージを構築
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 ${title}`,
          emoji: true
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*エラー:* ${errorMessage}`
        }
      }
    ];

    // 詳細情報があれば追加
    if (detailsText) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*詳細:*\n${detailsText}`
        }
      });
    }

    blocks.push({
      type: 'context',
      // @ts-ignore
      elements: [
        {
          type: 'mrkdwn',
          text: `発生日時: ${new Date().toLocaleString('ja-JP')}`
        }
      ]
    });

    // @ts-ignore
    blocks.push({
      type: 'divider'
    });

    // Slack通知を送信
    return await sendSlackNotification({
      text: `エラー: ${title}`,
      blocks
    });
  } catch (error: any) {
    logger.error(`Error creating error notification: ${error.message}`);
    return false;
  }
};
