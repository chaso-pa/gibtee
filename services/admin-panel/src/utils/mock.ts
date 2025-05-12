// src/utils/mock.ts
import type { User, AuthResponse } from "../types";

// モック認証ユーザー
const MOCK_USERS = [
	{
		id: 1,
		username: "管理者",
		email: "admin@gibtee.com",
		password: "password123",
		role: "admin",
	},
	{
		id: 2,
		username: "マネージャー",
		email: "manager@gibtee.com",
		password: "password123",
		role: "manager",
	},
];

// モックログイン関数
export const mockLogin = async (
	email: string,
	password: string,
): Promise<AuthResponse> => {
	// 遅延を模倣（実際のAPI呼び出しのような感覚を再現）
	await new Promise((resolve) => setTimeout(resolve, 800));

	const user = MOCK_USERS.find((user) => user.email === email);

	if (!user || user.password !== password) {
		throw new Error("メールアドレスまたはパスワードが間違っています");
	}

	// パスワードを除外してユーザー情報を返す
	const { password: _, ...userWithoutPassword } = user;

	return {
		user: userWithoutPassword as User,
		token: `mock-jwt-token-${user.id}-${Date.now()}`,
	};
};

// モックユーザー情報取得関数
export const mockGetUser = async (): Promise<User> => {
	// 遅延を模倣
	await new Promise((resolve) => setTimeout(resolve, 500));

	// localStorage からトークンを取得
	const token = localStorage.getItem("auth_token");

	if (!token || !token.startsWith("mock-jwt-token-")) {
		throw new Error("認証されていません");
	}

	// トークンからユーザーIDを取得（mock-jwt-token-1-timestamp のような形式）
	const userId = Number(token.split("-")[2]);
	const user = MOCK_USERS.find((user) => user.id === userId);

	if (!user) {
		throw new Error("ユーザーが見つかりません");
	}

	// パスワードを除外してユーザー情報を返す
	const { password: _, ...userWithoutPassword } = user;
	return userWithoutPassword as User;
};
