import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 8080),
  nodeEnv: process.env.NODE_ENV || "development",
  allowedOrigin: process.env.ALLOWED_ORIGIN || "*",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  openaiBaseUrl: process.env.OPENAI_BASE_URL || "",
  leadWebhookUrl: process.env.LEAD_WEBHOOK_URL || "",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:8080"
};

export const hasAiProvider = Boolean(config.openaiApiKey);
