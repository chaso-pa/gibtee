import axios from 'axios';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { notifyPaymentComplete } from './slack-notification.js';

// 環境変数から設定を読み込む
const LINE_PAY_CHANNEL_ID = process.env.LINE_PAY_CHANNEL_ID || '';
const LINE_PAY_CHANNEL_SECRET = process.env.LINE_PAY_CHANNEL_SECRET || '';
const LINE_PAY_API_URL = process.env.LINE_PAY_API_URL || 'https://sandbox-api-pay.line.me';
const CALLBACK_URL = process.env.PAYMENT_CALLBACK_URL || 'https://0ad0-125-197-4-55.ngrok-free.app/callback';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Stripeインスタンスの初期化
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil' // 最新のAPIバージョンを使用
});

// 決済方法の定義
export enum PaymentMethod {
  LINE_PAY = 'LINE_PAY',
  CREDIT_CARD = 'CREDIT_CARD'
}

/**
 * LINE Pay決済リクエストを作成する
 */
export const createLinePayRequest = async (
  orderId: number,
  orderNumber: string,
  amount: number,
  productName: string
): Promise<{ paymentUrl: string; transactionId: string }> => {
  try {
    logger.info(`LINE Pay決済リクエスト開始: 注文番号=${orderNumber}, 金額=${amount}`);

    // リクエストデータの作成
    const payload = {
      amount,
      currency: 'JPY',
      orderId: orderNumber,
      packages: [
        {
          id: orderId.toString(),
          amount,
          name: productName,
          products: [
            {
              id: 'GIBTEE-TSHIRT',
              name: productName,
              imageUrl: 'https://example.com/product.jpg',
              quantity: 1,
              price: amount
            }
          ]
        }
      ],
      redirectUrls: {
        confirmUrl: `${CALLBACK_URL}/confirm`,
        cancelUrl: `${CALLBACK_URL}/cancel`
      }
    };

    // ヘッダーの作成（HMACシグネチャを含む）
    const nonce = uuidv4();
    const requestUrl = '/v3/payments/request';
    const requestBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac('SHA256', LINE_PAY_CHANNEL_SECRET)
      .update(`${LINE_PAY_CHANNEL_SECRET}${requestUrl}${requestBody}${nonce}`)
      .digest('base64');

    const headers = {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': LINE_PAY_CHANNEL_ID,
      'X-LINE-Authorization-Nonce': nonce,
      'X-LINE-Authorization': signature
    };

    // API呼び出し
    const response = await axios.post(`${LINE_PAY_API_URL}${requestUrl}`, payload, { headers });
    const responseData = response.data;

    // Orderの確認とuserIdとの紐づけ
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('注文が見つかりません');
    }

    if (responseData.returnCode === '0000') {
      // 成功時はトランザクション情報をDBに保存
      await prisma.payment.create({
        data: {
          orderId,
          method: PaymentMethod.LINE_PAY,
          transactionId: responseData.info.transactionId,
          amount,
          status: 'PENDING',
          userId: order.userId
        }
      });

      logger.info(`LINE Pay決済リクエスト成功: transactionId=${responseData.info.transactionId}`);
      return {
        paymentUrl: responseData.info.paymentUrl.web,
        transactionId: responseData.info.transactionId
      };
    }
    throw new Error(`LINE Pay APIエラー: ${responseData.returnCode} - ${responseData.returnMessage}`);
  } catch (error: any) {
    logger.error(`LINE Pay決済リクエストエラー: ${error.message}`);
    throw new Error(`決済リクエストの作成に失敗しました: ${error.message}`);
  }
};

/**
 * LINE Pay決済を確定する
 */
export const confirmLinePayPayment = async (transactionId: string, amount: number): Promise<boolean> => {
  try {
    logger.info(`LINE Pay決済確定処理開始: transactionId=${transactionId}, 金額=${amount}`);

    // リクエストデータの作成
    const payload = {
      amount,
      currency: 'JPY'
    };

    // ヘッダーの作成（HMACシグネチャを含む）
    const nonce = uuidv4();
    const requestUrl = `/v3/payments/${transactionId}/confirm`;
    const requestBody = JSON.stringify(payload);
    const signature = crypto
      .createHmac('SHA256', LINE_PAY_CHANNEL_SECRET)
      .update(`${LINE_PAY_CHANNEL_SECRET}${requestUrl}${requestBody}${nonce}`)
      .digest('base64');

    const headers = {
      'Content-Type': 'application/json',
      'X-LINE-ChannelId': LINE_PAY_CHANNEL_ID,
      'X-LINE-Authorization-Nonce': nonce,
      'X-LINE-Authorization': signature
    };

    // API呼び出し
    const response = await axios.post(`${LINE_PAY_API_URL}${requestUrl}`, payload, { headers });
    const responseData = response.data;

    if (responseData.returnCode === '0000') {
      // 成功時は支払い情報を更新
      const payment = await prisma.payment.findFirst({
        where: { transactionId },
        include: {
          order: true
        }
      });

      if (!payment) {
        throw new Error('決済情報が見つかりません');
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' }
      });

      // 注文ステータスも更新
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'paid' }
      });

      // Slack通知を送信
      await notifyPaymentComplete(payment.order.orderNumber, PaymentMethod.LINE_PAY, amount);

      logger.info(`LINE Pay決済確定処理成功: transactionId=${transactionId}`);
      return true;
    }
    throw new Error(`LINE Pay確定APIエラー: ${responseData.returnCode} - ${responseData.returnMessage}`);
  } catch (error: any) {
    logger.error(`LINE Pay決済確定処理エラー: ${error.message}`);
    throw new Error(`決済確定処理に失敗しました: ${error.message}`);
  }
};

/**
 * Stripe決済セッションを作成
 */
export const createStripeCheckoutSession = async (
  orderId: number,
  orderNumber: string,
  amount: number,
  productName: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; sessionUrl: string }> => {
  try {
    logger.info(`Stripe決済セッション作成開始: 注文番号=${orderNumber}, 金額=${amount}`);

    // Stripeの支払いセッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'jpy',
            product_data: {
              name: productName,
              description: `注文番号: ${orderNumber}`
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${cancelUrl}?order_id=${orderId}`,
      client_reference_id: orderNumber,
      metadata: {
        orderId: orderId.toString(),
        orderNumber
      }
    });

    // Orderの確認とuserIdとの紐づけ
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('注文が見つかりません');
    }

    // 支払い情報をDBに保存
    await prisma.payment.create({
      data: {
        orderId,
        method: PaymentMethod.CREDIT_CARD,
        transactionId: session.id,
        amount,
        status: 'PENDING',
        metadata: {
          stripeSessionId: session.id
        },
        userId: order.userId
      }
    });

    logger.info(`Stripe決済セッション作成成功: sessionId=${session.id}`);
    return {
      sessionId: session.id,
      sessionUrl: session.url || ''
    };
  } catch (error: any) {
    logger.error(`Stripe決済セッション作成エラー: ${error.message}`);
    throw new Error(`決済セッションの作成に失敗しました: ${error.message}`);
  }
};

/**
 * Stripe決済セッションの状態を確認する
 */
export const checkStripeSessionStatus = async (
  sessionId: string
): Promise<{ status: string; orderId?: number; orderNumber?: string }> => {
  try {
    logger.info(`Stripe決済セッション確認: sessionId=${sessionId}`);

    // セッション情報を取得
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 支払い情報を取得
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: sessionId
      },
      include: {
        order: true
      }
    });

    if (!payment) {
      throw new Error('決済情報が見つかりません');
    }

    // セッションの状態に応じて処理
    if (session.payment_status === 'paid') {
      // 支払い完了
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' }
      });

      // 注文ステータスも更新
      await prisma.order.update({
        where: { id: payment.orderId },
        data: { status: 'paid' }
      });

      // Slack通知を送信
      await notifyPaymentComplete(payment.order.orderNumber, PaymentMethod.CREDIT_CARD, payment.amount);

      logger.info(`Stripe決済完了: sessionId=${sessionId}`);
      return {
        status: 'COMPLETED',
        orderId: payment.orderId,
        orderNumber: payment.order.orderNumber
      };
    }
    if (session.status === 'open') {
      // 支払い処理中
      return {
        status: 'PENDING',
        orderId: payment.orderId,
        orderNumber: payment.order.orderNumber
      };
    }
    // キャンセルまたは失敗
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' }
    });

    logger.info(`Stripe決済失敗: sessionId=${sessionId}`);
    return {
      status: 'FAILED',
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber
    };
  } catch (error: any) {
    logger.error(`Stripe決済セッション確認エラー: ${error.message}`);
    return { status: 'ERROR' };
  }
};

/**
 * Stripe Webhookイベントを処理する
 * @param signature Stripe-Signatureヘッダー値
 * @param rawBody リクエストボディ（文字列）
 * @returns 処理されたイベント、またはundefinedを返す
 */
export const handleStripeWebhook = async (
  signature: string,
  rawBody: string | Buffer
): Promise<Stripe.Event | undefined> => {
  try {
    // Webhookイベントを検証し構築
    if (!STRIPE_WEBHOOK_SECRET) {
      logger.warn('Stripe Webhook Secretが設定されていません');
      return undefined;
    }

    // bodyがバッファの場合は文字列に変換
    const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    // イベントを構築
    const event = stripe.webhooks.constructEvent(bodyStr, signature, STRIPE_WEBHOOK_SECRET);

    logger.info(`Stripe Webhook: イベントタイプ=${event.type}`);
    return event;
  } catch (error: any) {
    logger.error(`Webhook処理エラー: ${error.message}`);
    return undefined;
  }
};

/**
 * 決済方法に応じて処理を振り分け
 */
export const processPayment = async (
  method: PaymentMethod,
  orderId: number,
  orderNumber: string,
  amount: number,
  _paymentDetails: any
): Promise<{
  success: boolean;
  paymentUrl?: string;
  sessionId?: string;
  message?: string;
}> => {
  try {
    if (method === PaymentMethod.LINE_PAY) {
      const result = await createLinePayRequest(orderId, orderNumber, amount, 'ジブリ風オリジナルTシャツ');
      return {
        success: true,
        paymentUrl: result.paymentUrl
      };
    }
    if (method === PaymentMethod.CREDIT_CARD) {
      // LINE Bot用のコールバックURL
      const successUrl = `${CALLBACK_URL}/stripe/success`;
      const cancelUrl = `${CALLBACK_URL}/stripe/cancel`;

      // Stripeチェックアウトセッションを作成
      const session = await createStripeCheckoutSession(
        orderId,
        orderNumber,
        amount,
        'ジブリ風オリジナルTシャツ',
        successUrl,
        cancelUrl
      );

      return {
        success: true,
        paymentUrl: session.sessionUrl,
        sessionId: session.sessionId
      };
    }
    throw new Error('未対応の決済方法です');
  } catch (error: any) {
    logger.error(`決済処理エラー: ${error.message}`);
    return {
      success: false,
      message: `決済処理に失敗しました: ${error.message}`
    };
  }
};

/**
 * 決済状態の取得
 */
export const getPaymentStatus = async (
  orderId: number
): Promise<{
  method: PaymentMethod;
  status: string;
  amount: number;
  transactionId: string;
} | null> => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { orderId },
      orderBy: { createdAt: 'desc' }
    });

    if (!payment) {
      return null;
    }

    return {
      method: payment.method as PaymentMethod,
      status: payment.status,
      amount: payment.amount,
      transactionId: payment.transactionId
    };
  } catch (error: any) {
    logger.error(`決済状態取得エラー: ${error.message}`);
    return null;
  }
};
