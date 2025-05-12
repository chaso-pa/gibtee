// src/lib/api.ts
import axios from "axios";
import { API_URL } from "../config";

export const api = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("auth_token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

api.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		const { response } = error;
		if (response && response.status === 401) {
			localStorage.removeItem("auth_token");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	},
);
