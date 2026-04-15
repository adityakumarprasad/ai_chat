import "dotenv/config";
import morgan from "morgan";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import projectRoutes from "./routes/project.route.js";
import aiRoutes from "./routes/ai.routes.js";
import { createFallbackRedisClient } from "./config/services.js";
import { getEnvConfig } from "./config/env.js";

export function createApp(options = {}) {
  const app = express();
  const env = getEnvConfig();
  const allowedOrigins = options.clientUrls || env.clientUrls;

  app.locals.redisClient = options.redisClient || createFallbackRedisClient();

  app.use((req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("CORS origin not allowed"));
      },
      credentials: true,
    })
  );
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use("/users", userRoutes);
  app.use("/projects", projectRoutes);
  app.use("/ai", aiRoutes);

  app.get("/", (req, res) => {
    res.send("API is running...");
  });

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", env: env.nodeEnv });
  });

  return app;
}

const app = createApp();

export default app;
