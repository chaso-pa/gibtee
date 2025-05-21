// src/services/order-service.ts
import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

/**
 * ユーザーIDに基づいて注文履歴を取得する関数
 */
export const getOrderHistory = async (userId: number, limit = 5) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        image: true
      }
    });
    
    return orders;
  } catch (error: any) {
    logger.error(`注文履歴取得エラー: ${error.message}`);
    throw error;
  }
};

/**
 * 注文番号に基づいて注文詳細を取得する関数
 */
export const getOrderByNumber = async (orderNumber: string) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        image: true
      }
    });
    
    return order;
  } catch (error: any) {
    logger.error(`注文詳細取得エラー: ${error.message}`);
    throw error;
  }
};

/**
 * 注文ステータスを日本語に変換する関数
 */
export const formatOrderStatus = (status: string): string => {
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
