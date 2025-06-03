import { config } from './index.js';

export const openaiConfig = {
  apiKey: config.openai.apiKey,
  organization: config.openai.orgId,
  maxRetries: config.openai.maxRetries,
  timeout: config.openai.timeout
};
