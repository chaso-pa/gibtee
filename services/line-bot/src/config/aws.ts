import { config } from "./index.js";

export const awsConfig = {
	region: config.aws.region,
	credentials: {
		accessKeyId: config.aws.accessKeyId,
		secretAccessKey: config.aws.secretAccessKey,
	},
	// S3バケット情報
	s3: {
		bucket: config.aws.s3Bucket,
		imagePrefix: "images/", // 画像保存時のプレフィックス
	},
};
