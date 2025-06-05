import type React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export const ProtectedRoute: React.FC = () => {
  const location = useLocation();
  const token = localStorage.getItem('auth_token');

  // 認証チェック
  if (!token) {
    // ログインしていない場合はログインページにリダイレクト
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // ログインしている場合は子ルートをレンダリング
  return <Outlet />;
};
