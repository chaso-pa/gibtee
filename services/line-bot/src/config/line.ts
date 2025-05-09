import { ClientConfig, MiddlewareConfig } from "@line/bot-sdk";
import { config } from "./index.js";

// LINE SDKクライアント設定
export const lineClientConfig: ClientConfig = {
	channelAccessToken: config.line.channelAccessToken,
	channelSecret: config.line.channelSecret,
};

// LINE SDKミドルウェア設定
export const lineMiddlewareConfig: MiddlewareConfig = {
	channelAccessToken: config.line.channelAccessToken,
	channelSecret: config.line.channelSecret,
};
