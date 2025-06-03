import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { config } from '../config/index.js';
import { logger } from './logger.js';

// S3クライアントの初期化
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
  }
});

/**
 * バッファをS3にアップロードする
 * @param buffer アップロードするバッファ
 * @param originalFilename 元のファイル名（拡張子取得用）
 * @param prefix S3内のプレフィックス（フォルダパス）
 * @returns アップロードされたオブジェクトのキー
 */
export const uploadBufferToS3 = async (
  buffer: Buffer,
  originalFilename: string = 'image.jpg',
  prefix: string = 'images/'
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
        Bucket: config.aws.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType
      }
    });

    // アップロード実行と進捗状況のログ出力
    upload.on('httpUploadProgress', (progress) => {
      logger.debug(`アップロード進捗: ${progress.loaded} / ${progress.total}`);
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
export const generateSignedUrl = async (key: string, expiresIn: number = 3600): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: config.aws.s3Bucket,
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
 * S3からオブジェクトを取得する
 * @param key S3オブジェクトのキー
 * @returns バッファデータ
 */
export const getObjectFromS3 = async (key: string): Promise<Buffer> => {
  try {
    const command = new GetObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key
    });

    const response = await s3Client.send(command);

    // ストリームをバッファに変換
    const chunks: Buffer[] = [];
    if (response.Body) {
      // @ts-ignore: Body is a ReadableStream
      for await (const chunk of response.Body) {
        chunks.push(Buffer.from(chunk));
      }
    }

    logger.info(`S3オブジェクト取得成功: ${key}`);
    return Buffer.concat(chunks);
  } catch (error: any) {
    logger.error(`S3オブジェクト取得エラー: ${error.message}`);
    throw new Error(`S3オブジェクト取得失敗: ${error.message}`);
  }
};
