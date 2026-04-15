const DEFAULT_CLIENT_URL = "http://localhost:5173";

function normalizeOriginList(value) {
  if (!value) {
    return [DEFAULT_CLIENT_URL];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function getEnvConfig() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const clientUrls = normalizeOriginList(process.env.CLIENT_URL);

  return {
    isProduction: nodeEnv === "production",
    nodeEnv,
    port: Number(process.env.PORT || 5000),
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    redisUrl: process.env.REDIS_URL,
    geminiApiKey: process.env.GEMINI_API_KEY,
    clientUrls,
  };
}

export function getCookieOptions(isProduction) {
  return {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000,
  };
}
