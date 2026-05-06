import OpenAI from "openai";
import { env } from "./env.js";

export const openrouter = env.openrouterApiKey
  ? new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: env.openrouterApiKey,
      defaultHeaders: {
        "HTTP-Referer": env.openrouterReferer,
        "X-OpenRouter-Title": env.openrouterTitle
      }
    })
  : null;
