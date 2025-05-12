// src/types/index.ts
export interface User {
	id: number;
	username: string;
	email: string;
	role: "admin" | "manager";
}

export interface AuthResponse {
	user: User;
	token: string;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface ApiError {
	message: string;
	statusCode: number;
}

// 注文関連の型定義
export interface Order {
	id: number;
	userId: number;
	orderNumber: string;
	status: OrderStatus;
	shirtSize: ShirtSize;
	shirtColor: ShirtColor;
	quantity: number;
	price: number;
	recipientName: string;
	recipientPhone: string;
	postalCode: string;
	prefecture: string;
	city: string;
	streetAddress: string;
	buildingName?: string;
	shippingStatus?: string;
	shippingCarrier?: string;
	trackingNumber?: string;
	shippedAt?: string;
	estimatedDeliveryAt?: string;
	deliveredAt?: string;
	adminMemo?: string;
	isHighPriority: boolean;
	hasPrintingIssue: boolean;
	isCancelled: boolean;
	cancelledAt?: string;
	cancellationReason?: string;
	isRefunded: boolean;
	refundedAt?: string;
	notifiedShipping: boolean;
	notifiedDelivery: boolean;
	printStatus?: string;
	printedAt?: string;
	basePrice: number;
	taxAmount: number;
	shippingFee: number;
	discountAmount?: number;
	createdAt: string;
	updatedAt: string;
	user: {
		id: number;
		lineUserId: string;
		displayName?: string;
	};
	payments: Payment[];
	imageUrl?: string;
}

export type OrderStatus =
	| "pending"
	| "paid"
	| "processing"
	| "shipped"
	| "delivered"
	| "cancelled";

export type ShirtSize = "S" | "M" | "L" | "XL";
export type ShirtColor = "white" | "black" | "navy" | "red";

export interface Payment {
	id: number;
	orderId: number;
	method: "LINE_PAY" | "CREDIT_CARD";
	transactionId: string;
	amount: number;
	status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
	createdAt: string;
}

export interface OrderHistory {
	id: number;
	orderId: number;
	status: string;
	message: string;
	createdBy: string;
	createdAt: string;
}

export interface Inventory {
	id: number;
	itemType: string;
	itemColor: ShirtColor;
	itemSize: ShirtSize;
	quantity: number;
	updatedAt: string;
}

export interface PaginationParams {
	page: number;
	limit: number;
}

export interface OrdersResponse {
	orders: Order[];
	total: number;
	page: number;
	limit: number;
}

export interface OrderFilters {
	status?: OrderStatus;
	shirtSize?: ShirtSize;
	shirtColor?: ShirtColor;
	isHighPriority?: boolean;
	hasPrintingIssue?: boolean;
	search?: string;
	startDate?: string;
	endDate?: string;
}
