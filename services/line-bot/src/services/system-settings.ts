// src/services/system-settings.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SystemSettings {
  id: number;
  isOrderAcceptanceEnabled: boolean;
  orderSuspensionMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SystemSettingsService {
  /**
   * システム設定を取得
   */
  static async getSettings(): Promise<SystemSettings | null> {
    try {
      const settings = await prisma.systemSettings.findFirst({
        orderBy: {
          id: 'desc' // 最新の設定を取得
        }
      });

      return settings;
    } catch (error) {
      console.error('Error fetching system settings:', error);
      throw error;
    }
  }

  /**
   * 注文受付状態をチェック
   */
  static async isOrderAcceptanceEnabled(): Promise<boolean> {
    try {
      const settings = await this.getSettings();

      // 設定が存在しない場合はデフォルトで受付有効
      if (!settings) {
        return true;
      }

      return settings.isOrderAcceptanceEnabled;
    } catch (error) {
      console.error('Error checking order acceptance status:', error);
      // エラーの場合はデフォルトで受付有効
      return true;
    }
  }

  /**
   * 注文受付停止時のメッセージを取得
   */
  static async getOrderSuspensionMessage(): Promise<string> {
    try {
      const settings = await this.getSettings();

      if (!settings || !settings.orderSuspensionMessage) {
        return '申し訳ございませんが、現在新規注文の受付を一時停止しております。\nしばらく時間をおいてからご利用ください。';
      }

      return settings.orderSuspensionMessage;
    } catch (error) {
      console.error('Error fetching order suspension message:', error);
      return '申し訳ございませんが、現在新規注文の受付を一時停止しております。\nしばらく時間をおいてからご利用ください。';
    }
  }

  /**
   * システム設定を更新（管理パネル用）
   */
  static async updateSettings(
    isOrderAcceptanceEnabled: boolean,
    orderSuspensionMessage?: string | null
  ): Promise<SystemSettings> {
    try {
      // 既存設定を取得
      const existingSettings = await this.getSettings();

      if (existingSettings) {
        // 更新
        const updatedSettings = await prisma.systemSettings.update({
          where: { id: existingSettings.id },
          data: {
            isOrderAcceptanceEnabled,
            orderSuspensionMessage
          }
        });
        return updatedSettings;
      } else {
        // 新規作成
        const newSettings = await prisma.systemSettings.create({
          data: {
            isOrderAcceptanceEnabled,
            orderSuspensionMessage
          }
        });
        return newSettings;
      }
    } catch (error) {
      console.error('Error updating system settings:', error);
      throw error;
    }
  }

  /**
   * 注文開始前の状態チェック
   * 注文受付が停止されている場合は適切なメッセージを返す
   */
  static async checkOrderAcceptanceStatus(): Promise<{
    canAcceptOrder: boolean;
    message?: string;
  }> {
    try {
      const isEnabled = await this.isOrderAcceptanceEnabled();

      if (!isEnabled) {
        const suspensionMessage = await this.getOrderSuspensionMessage();
        return {
          canAcceptOrder: false,
          message: suspensionMessage
        };
      }

      return { canAcceptOrder: true };
    } catch (error) {
      console.error('Error checking order acceptance status:', error);
      // エラーの場合は安全のため受付可能として扱う
      return { canAcceptOrder: true };
    }
  }
}
