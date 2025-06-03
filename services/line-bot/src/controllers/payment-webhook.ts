import { Request, Response } from 'express';
import { checkStripeSessionStatus, handleStripeWebhook } from '../services/payment.js';
import { sendTextMessage } from '../services/line.js';
import { getUserByOrderId } from '../services/conversation.js';
import { createPaymentCompletedFlex } from '../services/flex-message.js';
import { lineClient } from '../config/line.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';
import { notifyPaymentComplete } from '../services/slack-notification.js';
import { PaymentMethod } from '../services/payment.js';

/**
 * Stripe Webhookを処理するエンドポイント
 */
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      logger.error('Stripe署名が見つかりません');
      res.status(400).send('署名が必要です');
      return;
    }

    // Stripeからのwebhookイベントを処理
    // @ts-ignore
    const event = await handleStripeWebhook(signature, req.rawBody);

    if (!event) {
      res.status(500).send('Webhook処理中にサーバーエラーが発生しました');
      return;
    }

    // checkout.session.completedイベントを処理
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const transactionId = session.id;
      const paymentStatus = session.payment_status;

      // 対応する支払い情報を取得
      const payment = await prisma.payment.findFirst({
        where: { transactionId },
        include: {
          order: {
            include: {
              user: true
            }
          }
        }
      });

      if (!payment) {
        logger.error(`支払い情報が見つかりません: ${transactionId}`);
        res.status(404).send('支払い情報が見つかりません');
        return;
      }

      if (paymentStatus === 'paid' && payment.status !== 'COMPLETED') {
        // 支払いステータスを更新
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED' }
        });

        // 注文ステータスも更新
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'paid' }
        });

        // ステータス更新の履歴を記録
        await prisma.orderHistory.create({
          data: {
            orderId: payment.orderId,
            status: 'paid',
            message: 'Stripe決済が完了しました',
            createdBy: 'system'
          }
        });

        // Slack通知を送信
        await notifyPaymentComplete(payment.order.orderNumber, PaymentMethod.CREDIT_CARD, payment.amount);

        // LINEに決済完了通知を送信
        if (payment.order.user && payment.order.user.lineUserId) {
          const completedFlex = createPaymentCompletedFlex(payment.order.orderNumber || '');
          await lineClient.pushMessage(payment.order.user.lineUserId, completedFlex);

          // 通知履歴を記録
          await prisma.notification.create({
            data: {
              orderId: payment.orderId,
              type: 'STATUS_UPDATE',
              content: JSON.stringify({
                message: '決済完了通知',
                orderNumber: payment.order.orderNumber
              }),
              sentAt: new Date(),
              success: true
            }
          });
        }

        logger.info(`決済完了: orderId=${payment.orderId}, session=${transactionId}`);
      }

      res.status(200).send('Success');
      // checkout.session.expiredイベントを処理
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const transactionId = session.id;
      const paymentStatus = session.payment_status;

      // 対応する支払い情報を取得
      const payment = await prisma.payment.findFirst({
        where: { transactionId },
        include: {
          order: {
            include: {
              user: true
            }
          }
        }
      });

      if (!payment) {
        logger.error(`支払い情報が見つかりません: ${transactionId}`);
        res.status(404).send('支払い情報が見つかりません');
        return;
      }

      if (paymentStatus === 'unpaid' && payment.status !== 'COMPLETED') {
        // 支払いステータスを更新
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'unpaid' }
        });

        // 注文ステータスも更新
        await prisma.order.update({
          where: { id: payment.orderId },
          data: { status: 'cancelled' }
        });

        // ステータス更新の履歴を記録
        await prisma.orderHistory.create({
          data: {
            orderId: payment.orderId,
            status: 'paid',
            message: 'Stripe決済が完了しました',
            createdBy: 'system'
          }
        });

        // ステータス更新の履歴を記録
        await prisma.orderHistory.create({
          data: {
            orderId: payment.orderId,
            status: 'paid',
            message: 'Stripe決済が失敗しました',
            createdBy: 'system'
          }
        });

        // LINEに決済失敗通知を送信
        if (payment.order.user && payment.order.user.lineUserId) {
          // TODO: 決済失敗用のflexをつくる
        }

        logger.info(`決済失敗: orderId=${payment.orderId}, session=${transactionId}`);
        res.status(200).send('Expired');
      }
    } else {
      // その他のWebhookイベントは現時点では処理しない
      res.status(200).send('Event received');
    }
  } catch (error: any) {
    logger.error(`Webhook処理エラー: ${error.message}`);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * Stripe決済成功時のコールバック
 */
export const stripeSuccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const sessionId = req.query.session_id as string;
    const orderId = parseInt(req.query.order_id as string);

    if (!sessionId || isNaN(orderId)) {
      logger.error('無効なパラメータです');
      res.status(400).send('無効なパラメータです');
      return;
    }

    // セッションの状態を確認
    const sessionStatus = await checkStripeSessionStatus(sessionId);

    if (sessionStatus.status === 'COMPLETED') {
      // 成功ページにリダイレクト
      res.render('payment-success', {
        orderNumber: sessionStatus.orderNumber || ''
      });
    } else {
      // エラーページにリダイレクト
      res.render('payment-error', {
        message: '決済処理に失敗しました。'
      });
    }
  } catch (error: any) {
    logger.error(`Stripe成功コールバックエラー: ${error.message}`);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * Stripe決済キャンセル時のコールバック
 */
export const stripeCancel = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderId = parseInt(req.query.order_id as string);

    if (isNaN(orderId)) {
      logger.error('無効なパラメータです');
      res.status(400).send('無効なパラメータです');
      return;
    }

    // ユーザーを取得
    const user = await getUserByOrderId(orderId);

    if (user && user.lineUserId) {
      // キャンセルメッセージをLINEに送信
      await sendTextMessage(
        user.lineUserId,
        '決済がキャンセルされました。別の支払い方法を選択するか、注文をやり直してください。'
      );
    }

    // キャンセルページにリダイレクト
    res.render('payment-cancel', {});
  } catch (error: any) {
    logger.error(`Stripeキャンセルコールバックエラー: ${error.message}`);
    res.status(500).send('Internal Server Error');
  }
};
