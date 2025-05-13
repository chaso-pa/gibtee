// src/providers/auth.tsx
import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import type { User, LoginCredentials, ApiError } from "../types";
import { api } from "../lib/api";

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	error: string | null;
	login: (credentials: LoginCredentials) => Promise<void>;
	logout: () => void;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		const token = localStorage.getItem("auth_token");
		if (token) {
			fetchUser();
		} else {
			setIsLoading(false);
		}
	}, []);

	const fetchUser = async () => {
		try {
			setIsLoading(true);

			const response = await api.get<User>("/auth/me");
			const userData = response.data;

			setUser(userData);
			setError(null);
		} catch (error) {
			console.error("Failed to fetch user", error);
			localStorage.removeItem("auth_token");
			setError("認証セッションが無効です。再度ログインしてください。");
			setUser(null);
		} finally {
			setIsLoading(false);
		}
	};

	const login = async (credentials: LoginCredentials) => {
		try {
			setIsLoading(true);
			setError(null);

			const apiResponse = await api.post("/auth/login", credentials);
			const response = apiResponse.data;

			localStorage.setItem("auth_token", response.token);
			setUser(response.user);
			navigate("/dashboard");
		} catch (error) {
			console.error("Login failed", error);
			const message =
				error instanceof Error ? error.message : "認証に失敗しました";
			setError(message);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const logout = () => {
		localStorage.removeItem("auth_token");
		setUser(null);
		navigate("/login");
	};

	const value = {
		user,
		isLoading,
		error,
		login,
		logout,
		isAuthenticated: !!user,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
