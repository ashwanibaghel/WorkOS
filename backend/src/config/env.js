import dotenv from "dotenv";

dotenv.config();

const required = ["MONGO_URI", "JWT_SECRET"];
const railwayClientUrl = process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "";

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const normalizeOpenRouterModel = (model) => {
  if (!model || model === "openrouter/free-gpt-4-mini" || model.startsWith("openrouter/free-")) {
    return "openrouter/free";
  }
  return model;
};

const parseClientUrls = () => {
  const configured = (process.env.CLIENT_URL || railwayClientUrl || "http://localhost:5173")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  return Array.from(new Set([...configured, railwayClientUrl, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean)));
};

const clientUrls = parseClientUrls();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL || railwayClientUrl || clientUrls[0],
  clientUrls,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  mailFrom: process.env.MAIL_FROM || "WorkOS <no-reply@workos.local>",
  openrouterApiKey: process.env.OPENROUTER_API_KEY || process.env.OPENROUTES_API_KEY,
  openrouterModel: normalizeOpenRouterModel(process.env.OPENROUTER_MODEL || "openrouter/free"),
  openrouterReferer: process.env.OPENROUTER_REFERER || process.env.CLIENT_URL || railwayClientUrl || "http://localhost:5173",
  openrouterTitle: process.env.OPENROUTER_TITLE || "WorkOS"
};
