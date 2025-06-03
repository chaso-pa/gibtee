import { Request, Response } from 'express';
import { PrismaClient, OrderStatus, ShirtSize, ShirtColor, NotificationType } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { sendOrderStatusNotification, sendShippingNotification } from '../services/notification.js';

const prisma = new PrismaClient();

// 注文一覧を取得するコントローラー
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      shirtSize,
      shirtColor,
      isHighPriority,
      hasPrintingIssue,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // ページネーションの設定
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // フィルタ条件の構築
    let where: any = {};

    // ステータスフィルター
    if (status) {
      where.status = status as OrderStatus;
    }

    // シャツサイズフィルター
    if (shirtSize) {
      where.shirtSize = shirtSize as ShirtSize;
    }

    // シャツカラーフィルター
    if (shirtColor) {
      where.shirtColor = shirtColor as ShirtColor;
    }

    // 優先度フィルター
    if (isHighPriority === 'true') {
      where.isHighPriority = true;
    }

    // 印刷問題フィルター
    if (hasPrintingIssue === 'true') {
      where.hasPrintingIssue = true;
    }

    // 日付範囲フィルター
    if (startDate) {
      where.createdAt = {
        ...(where.createdAt || {}),
        gte: new Date(startDate as string)
      };
    }

    if (endDate) {
      where.createdAt = {
        ...(where.createdAt || {}),
        lte: new Date(endDate as string)
      };
    }

    // 検索フィルター（注文番号、受取人名、電話番号、郵便番号など）
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string } },
        { recipientName: { contains: search as string } },
        { recipientPhone: { contains: search as string } },
        { postalCode: { contains: search as string } }
      ];
    }

    // ソート設定
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    // 注文一覧の取得（総数も一緒に取得）
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          shirtSize: true,
          shirtColor: true,
          quantity: true,
          price: true,
          createdAt: true,
          updatedAt: true,
          recipientName: true,
          isHighPriority: true,
          hasPrintingIssue: true,
          user: {
            select: {
              id: true,
              lineUserId: true,
              displayName: true
            }
          },
          image: {
            select: {
              id: true,
              ghibliImagePath: true
            }
          }
        }
      }),
      prisma.order.count({ where })
    ]);

    // ページネーション情報を含めたレスポンス
    res.status(200).json({
      orders,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('注文一覧取得エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};

// 注文詳細を取得するコントローラー
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            lineUserId: true,
            displayName: true,
            profileImageUrl: true
          }
        },
        image: true,
        payments: true,
        orderHistories: {
          orderBy: { createdAt: 'desc' }
        },
        notifications: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      res.status(404).json({ message: '注文が見つかりません' });
    }

    res.status(200).json({ order });
  } catch (error) {
    console.error('注文詳細取得エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};

// 注文ステータスを更新するコントローラー
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, adminMemo, notifyCustomer } = req.body;

    // ステータスの型チェック
    if (status && !Object.values(OrderStatus).includes(status as OrderStatus)) {
      res.status(400).json({ message: '無効なステータスです' });
    }

    // 注文の存在確認
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            lineUserId: true
          }
        }
      }
    });

    // トランザクションで注文更新と履歴追加を実行
    const result = await prisma.$transaction(async (tx) => {
      // 注文ステータスの更新
      const updatedOrder = await tx.order.update({
        where: { id: Number(id) },
        data: {
          status: status as OrderStatus,
          ...(adminMemo && { adminMemo })
        }
      });

      // 注文履歴の追加
      const history = await tx.orderHistory.create({
        data: {
          orderId: updatedOrder.id,
          status: status as OrderStatus,
          message: `ステータスを ${status} に更新しました`,
          createdBy: req.user?.userId.toString() || 'system'
        }
      });

      if (!order) {
        res.status(404).json({ message: '注文が見つかりません' });
      }

      // 顧客通知が有効な場合
      let notification = null;
      if (notifyCustomer && order?.user?.lineUserId) {
        // 通知レコードを作成
        notification = await tx.notification.create({
          data: {
            orderId: updatedOrder.id,
            type: NotificationType.STATUS_UPDATE,
            content: JSON.stringify({
              status: status,
              message: `ご注文 #${order.orderNumber} のステータスが「${status}」に更新されました。`
            }),
            sentAt: new Date(),
            success: true // 通知送信前に作成し、後で更新
          }
        });

        // ログ記録
        logger.info(
          `注文ステータス通知送信準備: OrderID=${order.id}, Status=${status}, NotificationID=${notification.id}`
        );
      }

      return {
        updatedOrder,
        history,
        notification,
        lineUserId: order?.user?.lineUserId ?? undefined
      };
    });

    // トランザクション外でLINE通知を送信（DB更新後に非同期で実行）
    if (result.notification && notifyCustomer && result.lineUserId) {
      try {
        await sendOrderStatusNotification(result.lineUserId, order?.orderNumber ?? '', status as OrderStatus);

        // 通知成功ログ
        logger.info(`注文ステータス通知送信成功: OrderID=${order?.id}, NotificationID=${result.notification.id}`);

        // 通知成功フラグを更新
        await prisma.notification.update({
          where: { id: result.notification.id },
          data: { success: true }
        });

        // 注文の通知ステータスフラグを更新
        await prisma.order.update({
          where: { id: Number(id) },
          data: { notifiedStatus: true }
        });
      } catch (error: any) {
        // 通知失敗ログ
        logger.error(
          `注文ステータス通知送信失敗: OrderID=${order?.id}, NotificationID=${result.notification.id}, Error=${error.message}`
        );

        // 通知失敗フラグを更新
        await prisma.notification.update({
          where: { id: result.notification.id },
          data: {
            success: false,
            errorMessage: error.message
          }
        });
      }
    }

    res.status(200).json({
      message: '注文ステータスを更新しました',
      order: result.updatedOrder,
      notified: notifyCustomer && result.lineUserId ? true : false
    });
  } catch (error) {
    console.error('注文ステータス更新エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};

// 配送情報を更新するコントローラー
export const updateOrderShipping = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { shippingCarrier, trackingNumber, shippedAt, estimatedDeliveryAt, notifyCustomer } = req.body;

    // 必須フィールドのチェック
    if (!shippingCarrier || !trackingNumber) {
      res.status(400).json({ message: '配送業者と追跡番号は必須です' });
      return;
    }

    // 注文の存在確認
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            lineUserId: true
          }
        }
      }
    });

    if (!order) {
      res.status(404).json({ message: '注文が見つかりません' });
      return;
    }

    // トランザクションで注文更新と履歴追加を実行
    const result = await prisma.$transaction(async (tx) => {
      // 配送情報の更新
      const updatedOrder = await tx.order.update({
        where: { id: Number(id) },
        data: {
          shippingCarrier,
          trackingNumber,
          ...(shippedAt && { shippedAt: new Date(shippedAt) }),
          ...(estimatedDeliveryAt && {
            estimatedDeliveryAt: new Date(estimatedDeliveryAt)
          }),
          status: OrderStatus.shipped, // 配送情報が更新されたので、ステータスも「発送完了」に更新
          notifiedShipping: false // 配送通知フラグをリセット（後で通知処理で更新）
        }
      });

      // 注文履歴の追加
      const history = await tx.orderHistory.create({
        data: {
          orderId: updatedOrder.id,
          status: OrderStatus.shipped,
          message: `配送情報を更新しました: ${shippingCarrier}, 追跡番号: ${trackingNumber}`,
          createdBy: req.user?.userId.toString() || 'system'
        }
      });

      // 顧客通知が有効な場合
      let notification = null;
      if (notifyCustomer && order.user?.lineUserId) {
        // 通知レコードを作成
        notification = await tx.notification.create({
          data: {
            orderId: updatedOrder.id,
            type: NotificationType.SHIPPING_UPDATE,
            content: JSON.stringify({
              shippingCarrier,
              trackingNumber,
              shippedAt,
              estimatedDeliveryAt,
              message: `ご注文 #${order.orderNumber} が発送されました。配送業者: ${shippingCarrier}, 追跡番号: ${trackingNumber}`
            }),
            sentAt: new Date(),
            success: true // 通知送信前に作成し、後で更新
          }
        });

        // ログ記録
        logger.info(
          `配送情報通知送信準備: OrderID=${order.id}, Carrier=${shippingCarrier}, NotificationID=${notification.id}`
        );
      }

      return {
        updatedOrder,
        history,
        notification,
        lineUserId: order.user?.lineUserId
      };
    });

    // トランザクション外でLINE通知を送信（DB更新後に非同期で実行）
    if (result.notification && notifyCustomer && result.lineUserId) {
      try {
        await sendShippingNotification(
          result.lineUserId,
          order.orderNumber,
          shippingCarrier,
          trackingNumber,
          shippedAt ? new Date(shippedAt) : new Date(),
          estimatedDeliveryAt ? new Date(estimatedDeliveryAt) : null
        );

        // 通知成功ログ
        logger.info(`配送情報通知送信成功: OrderID=${order.id}, NotificationID=${result.notification.id}`);

        // 通知成功フラグを更新
        await prisma.notification.update({
          where: { id: result.notification.id },
          data: { success: true }
        });

        // 注文の配送通知ステータスフラグを更新
        await prisma.order.update({
          where: { id: Number(id) },
          data: { notifiedShipping: true }
        });
      } catch (error: any) {
        // 通知失敗ログ
        logger.error(
          `配送情報通知送信失敗: OrderID=${order.id}, NotificationID=${result.notification.id}, Error=${error.message}`
        );

        // 通知失敗フラグを更新
        await prisma.notification.update({
          where: { id: result.notification.id },
          data: {
            success: false,
            errorMessage: error.message
          }
        });
      }
    }

    res.status(200).json({
      message: '配送情報を更新しました',
      order: result.updatedOrder,
      notified: notifyCustomer && result.lineUserId ? true : false
    });
  } catch (error) {
    console.error('配送情報更新エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};

// 注文通知履歴を取得するコントローラー
export const getOrderNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // 注文の存在確認
    const order = await prisma.order.findUnique({
      where: { id: Number(id) }
    });

    if (!order) {
      res.status(404).json({ message: '注文が見つかりません' });
      return;
    }

    // 通知履歴を取得
    const notifications = await prisma.notification.findMany({
      where: { orderId: Number(id) },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error('通知履歴取得エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};
