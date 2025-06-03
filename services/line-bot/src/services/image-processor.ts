import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// 画像処理サービスのクライアント
const imageProcessorClient = axios.create({
  baseURL: config.imageProcessor.url,
  timeout: 600000, // 600秒
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': config.imageProcessor.apiKey
  }
});

/**
 * 画像をジブリ風に変換する
 * @param imageKey S3の画像キー
 * @param userId ユーザーID
 * @returns 変換後の画像情報
 */
export const convertToGhibliStyle = async (
  imageKey: string,
  userId: string
): Promise<{
  convertedImageKey: string;
  signedUrl: string;
}> => {
  try {
    logger.info(`画像処理サービスにリクエスト送信: ${imageKey}`);

    const response = await imageProcessorClient.post('/convert', {
      imageKey,
      userId
    });

    if (!response.data.success) {
      throw new Error('画像変換に失敗しました');
    }

    logger.info(`画像変換成功: ${response.data.convertedImageKey}`);

    return {
      convertedImageKey: response.data.convertedImageKey,
      signedUrl: response.data.signedUrl
    };
  } catch (error: any) {
    logger.error(`画像処理サービスエラー: ${error.message}`);
    throw new Error(`ジブリ風変換に失敗しました: ${error.message}`);
  }
};

/**
 * Tシャツプレビューを生成する
 * @param imageKey S3の画像キー
 * @param color Tシャツの色
 * @param size Tシャツのサイズ
 * @param userId ユーザーID
 * @returns プレビュー画像情報
 */
export const generateTshirtPreview = async (
  imageKey: string,
  color: string,
  size: string,
  userId: string
): Promise<{
  previewImageKey: string;
  signedUrl: string;
}> => {
  try {
    logger.info(`Tシャツプレビュー生成リクエスト送信: ${imageKey}, 色=${color}, サイズ=${size}`);

    const response = await imageProcessorClient.post('/tshirt-preview', {
      imageKey,
      color,
      size,
      userId
    });

    if (!response.data.success) {
      throw new Error('Tシャツプレビュー生成に失敗しました');
    }

    logger.info(`Tシャツプレビュー生成成功: ${response.data.previewImageKey}`);

    return {
      previewImageKey: response.data.previewImageKey,
      signedUrl: response.data.signedUrl
    };
  } catch (error: any) {
    logger.error(`Tシャツプレビュー生成エラー: ${error.message}`);
    throw new Error(`Tシャツプレビュー生成に失敗しました: ${error.message}`);
  }
};
