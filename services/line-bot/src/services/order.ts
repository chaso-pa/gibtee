import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';
import { notifyNewOrder, notifyOrderStatusUpdate } from './slack-notification.js';
import { OrderStatus } from '@prisma/client';

/**
 * 注文レコードを作成する
 */
export const createOrder = async (
  userId: string,
  imageId: number,
  orderData: {
    size: string;
    color: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    recipientName: string;
    recipientPhone: string;
    postalCode: string;
    prefecture: string;
    city: string;
    streetAddress: string;
    buildingName?: string;
  }
): Promise<{ orderId: number; orderNumber: string }> => {
  try {
    logger.info(`注文レコード作成: ${userId}`);

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { lineUserId: userId }
    });

    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // 注文番号の生成
    const orderNumber = generateOrderNumber();

    // 注文レコードの作成
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        imageId,
        orderNumber,
        status: 'pending',
        shirtSize: orderData.size as any,
        shirtColor: orderData.color as any,
        quantity: orderData.quantity,
        price: orderData.totalPrice,
        recipientName: orderData.recipientName,
        recipientPhone: orderData.recipientPhone,
        postalCode: orderData.postalCode,
        prefecture: orderData.prefecture,
        city: orderData.city,
        streetAddress: orderData.streetAddress,
        buildingName: orderData.buildingName,
        basePrice: orderData.unitPrice,
        taxAmount: Math.floor(orderData.totalPrice * 0.1), // 消費税10%として計算
        shippingFee: 770 // 送料一律770円として設定
      }
    });

    logger.info(`注文レコード作成成功: ${order.id}, 注文番号: ${orderNumber}`);

    // Slack通知
    await notifyNewOrder(
      orderNumber,
      userId,
      {
        color: orderData.color,
        size: orderData.size,
        quantity: orderData.quantity,
        amount: orderData.totalPrice
      },
      {
        recipientName: orderData.recipientName,
        prefecture: orderData.prefecture,
        city: orderData.city
      }
    );

    return {
      orderId: order.id,
      orderNumber
    };
  } catch (error: any) {
    logger.error(`注文レコード作成エラー: ${error.message}`);
    throw new Error(`注文の作成に失敗しました: ${error.message}`);
  }
};

/**
 * 注文番号を生成する
 */
const generateOrderNumber = (): string => {
  // 現在日時からYYMMDD形式の文字列を生成
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');

  // ランダム文字列の生成（UUIDの最初の6文字）
  const random = uuidv4().split('-')[0].substring(0, 6);

  // 注文番号の形式: YYMMDD-XXXXXX
  return `${year}${month}${day}-${random.toUpperCase()}`;
};

/**
 * 注文ステータスを更新する
 */
export const updateOrderStatus = async (orderNumber: string, status: string): Promise<void> => {
  try {
    // 現在の注文情報を取得
    const currentOrder = await prisma.order.findUnique({
      where: { orderNumber }
    });

    if (!currentOrder) {
      throw new Error('注文が見つかりません');
    }

    // 更新処理
    await prisma.order.update({
      where: { orderNumber },
      data: { status: status as any }
    });

    logger.info(`注文ステータス更新: ${orderNumber}, ステータス: ${status}`);

    // Slack通知
    await notifyOrderStatusUpdate(orderNumber, currentOrder.status, status);
  } catch (error: any) {
    logger.error(`注文ステータス更新エラー: ${error.message}`);
    throw new Error(`注文ステータスの更新に失敗しました: ${error.message}`);
  }
};

/**
 * 注文情報を取得する
 */
export const getOrderByNumber = async (orderNumber: string): Promise<any> => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        user: true,
        image: true
      }
    });

    if (!order) {
      throw new Error('注文が見つかりません');
    }

    return order;
  } catch (error: any) {
    logger.error(`注文情報取得エラー: ${error.message}`);
    throw new Error(`注文情報の取得に失敗しました: ${error.message}`);
  }
};

/**
 * ユーザーの注文履歴を取得する
 */
export const getUserOrders = async (userId: string): Promise<any[]> => {
  try {
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { lineUserId: userId }
    });

    if (!user) {
      throw new Error('ユーザーが見つかりません');
    }

    // 注文履歴を取得
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        image: true
      }
    });

    return orders;
  } catch (error: any) {
    logger.error(`注文履歴取得エラー: ${error.message}`);
    throw new Error(`注文履歴の取得に失敗しました: ${error.message}`);
  }
};

/**
 * 注文ステータスを更新し、履歴を記録する
 */
export const updateOrderStatusWithHistory = async (
  orderNumber: string,
  newStatus: OrderStatus,
  message: string,
  updatedBy: string
): Promise<void> => {
  try {
    // トランザクションを開始
    await prisma.$transaction(async (tx) => {
      // 注文を更新
      const updatedOrder = await tx.order.update({
        where: { orderNumber },
        data: { status: newStatus }
      });

      // 履歴を記録
      await tx.orderHistory.create({
        data: {
          orderId: updatedOrder.id,
          status: newStatus,
          message: message,
          createdBy: updatedBy
        }
      });

      // ステータスに応じた追加処理
      if (newStatus === 'shipped') {
        await tx.order.update({
          where: { id: updatedOrder.id },
          data: {
            shippingStatus: 'shipped',
            shippedAt: new Date(),
            notifiedShipping: false // 通知待ちにする
          }
        });
      }
    });

    logger.info(`注文ステータス更新: ${orderNumber}, ステータス: ${newStatus}`);
  } catch (error: any) {
    logger.error(`注文ステータス更新エラー: ${error.message}`);
    throw new Error(`注文ステータスの更新に失敗しました: ${error.message}`);
  }
};

/**
 * 在庫を減らす
 */
export const decreaseInventory = async (color: string, size: string, quantity: number): Promise<boolean> => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 在庫を取得
      const inventory = await tx.inventory.findUnique({
        where: {
          itemType_itemColor_itemSize: {
            itemType: 't-shirt',
            itemColor: color,
            itemSize: size
          }
        }
      });

      if (!inventory || inventory.quantity < quantity) {
        throw new Error('在庫が不足しています');
      }

      // 在庫を更新
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: inventory.quantity - quantity }
      });

      return true;
    });

    return result;
  } catch (error: any) {
    logger.error(`在庫更新エラー: ${error.message}`);
    return false;
  }
};
