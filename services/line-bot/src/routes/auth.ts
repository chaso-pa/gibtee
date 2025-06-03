import express from 'express';
import { login } from '@/controllers/auth.js';

const authRoutes = express.Router();

// ログインエンドポイント
authRoutes.post('/login', login);

export default authRoutes;
