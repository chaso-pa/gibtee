import type { Request, Response } from 'express';
import { prisma } from '@/lib/prisma.js';
import type { NotificationType } from '@prisma/client';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      success,
      orderId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // ページネーションの設定
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // フィルタ条件の構築
    const where: any = {};

    if (type) {
      where.type = type as NotificationType;
    }

    if (success === 'true') {
      where.success = true;
    }

    if (orderId) {
      where.orderId = orderId;
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

    // ソート設定
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    // 通知履歴を取得
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          orderId: true,
          type: true,
          content: true,
          sentAt: true,
          success: true,
          errorMessage: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.notification.count({ where })
    ]);

    res.status(200).json({
      notifications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('通知履歴取得エラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};
