import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

interface JwtPayload {
  userId: number;
  role: string;
}

// リクエストオブジェクトの拡張
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
      };
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      res.status(401).json({ message: '認証トークンがありません' });
      return;
    }

    // Bearer トークンの形式チェック
    const parts = (authHeader ?? '').split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ message: '認証形式が不正です' });
      return;
    }

    const token = parts[1];

    // トークンの検証
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // リクエストにユーザー情報を付与
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('認証エラー:', error);
    res.status(401).json({ message: '無効なトークンです' });
  }
};

// 管理者権限チェック
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ message: '管理者権限が必要です' });
  }
  next();
};
