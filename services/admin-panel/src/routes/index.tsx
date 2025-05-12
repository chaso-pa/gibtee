// src/routes/index.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import { Login } from "../features/auth/Login";
import { Dashboard } from "../features/dashboard/Dashboard";

export const AppRoutes = () => {
	return (
		<Routes>
			<Route path="/login" element={<Login />} />

			<Route element={<ProtectedRoute />}>
				<Route element={<MainLayout />}>
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/orders" element={<div>注文管理ページ</div>} />
					<Route path="/orders/:orderId" element={<div>注文詳細ページ</div>} />
					<Route path="/inventory" element={<div>在庫管理ページ</div>} />
					<Route path="/users" element={<div>ユーザー管理ページ</div>} />
					<Route path="/reports" element={<div>レポートページ</div>} />
					<Route path="/settings" element={<div>設定ページ</div>} />
				</Route>
			</Route>

			<Route path="/" element={<Navigate to="/dashboard" replace />} />
			<Route path="*" element={<div>ページが見つかりません</div>} />
		</Routes>
	);
};
