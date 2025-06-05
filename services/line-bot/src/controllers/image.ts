import type { Request, Response } from 'express';
import { getS3SignedUrl } from '@/utils/s3.js';
import { logger } from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 画像の署名付きURLを取得するコントローラー
export const getImageSignedUrl = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const imageId = Number.parseInt(id, 10);

    if (Number.isNaN(imageId)) {
      res.status(400).json({ message: '無効な画像IDです' });
      return;
    }

    const image = await prisma.image.findUnique({
      where: { id: imageId }
    });

    if (!image || !image?.ghibliImagePath) {
      throw new Error('画像が見つかりません');
    }

    const signedUrl = await getS3SignedUrl(image.ghibliImagePath);
    res.status(200).json({ url: signedUrl });
  } catch (error: any) {
    logger.error(`画像URL取得エラー: ${error.message}`);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};
