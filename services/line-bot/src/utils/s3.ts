import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { awsConfig } from '../config/aws.js';
import { logger } from './logger.js';

// S3クライアントの初期化
const s3Client = new S3Client({
  region: awsConfig.region,
  credentials: awsConfig.credentials
});

/**
 * バッファをS3にアップロードする
 */
export const uploadBufferToS3 = async (
  buffer: Buffer,
  originalFilename = 'image.jpg',
  prefix: string = awsConfig.s3.imagePrefix
): Promise<string> => {
  try {
    // ファイル拡張子の取得
    const extension = originalFilename.split('.').pop() || 'jpg';
    const mimeType = mime.lookup(extension) || 'image/jpeg';

    // ユニークなキーを生成
    const key = `${prefix}${uuidv4()}.${extension}`;

    // マルチパートアップロードの設定
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: awsConfig.s3.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType
      }
    });

    // アップロード完了を待機
    await upload.done();

    logger.info(`S3アップロード成功: ${key}`);
    return key;
  } catch (error: any) {
    logger.error(`S3アップロードエラー: ${error.message}`);
    throw new Error(`S3アップロード失敗: ${error.message}`);
  }
};

/**
 * 署名付きURLを生成する
 * @param key S3オブジェクトのキー
 * @param expiresIn 有効期限（秒）
 * @returns 署名付きURL
 */
export const getS3SignedUrl = async (key: string, expiresIn = 3600): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: awsConfig.s3.bucket,
      Key: key
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    logger.debug(`署名付きURL生成: ${key}, 有効期限: ${expiresIn}秒`);
    return url;
  } catch (error: any) {
    logger.error(`署名付きURL生成エラー: ${error.message}`);
    throw new Error(`署名付きURL生成失敗: ${error.message}`);
  }
};

/**
 * 通常のS3オブジェクトのURLを取得する（バケットがパブリックの場合のみ使用）
 * @param key S3オブジェクトのキー
 * @returns S3オブジェクトのURL
 */
export const getS3ObjectUrl = (key: string): string => {
  return `https://${awsConfig.s3.bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`;
};
