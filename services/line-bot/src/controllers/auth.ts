import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

// 管理者ユーザーのシードデータ（本番環境では環境変数から読み込むべき）
const ADMIN_EMAIL = 'admin@gibtee.com';
const ADMIN_PASSWORD = 'adminpassword';

// ログイン処理
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 入力検証
    if (!email || !password) {
      res.status(400).json({ message: 'メールアドレスとパスワードは必須です' });
      return;
    }

    // 管理者ユーザーの検証（実際のプロジェクトではDBから取得する）
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // JWTトークンの生成
      // @ts-ignore
      const token = jwt.sign(
        {
          userId: 1, // 実際のDBではユーザーIDを使用
          role: 'admin'
        },
        config.jwt.secret,
        {
          expiresIn: config.jwt.expiresIn
        }
      );

      res.status(200).json({
        message: 'ログインに成功しました',
        user: {
          id: 1,
          email: ADMIN_EMAIL,
          role: 'admin'
        },
        token
      });
    }

    // 認証失敗
    res.status(401).json({ message: 'メールアドレスまたはパスワードが正しくありません' });
  } catch (error) {
    console.error('ログインエラー:', error);
    res.status(500).json({ message: 'サーバーエラーが発生しました' });
  }
};
