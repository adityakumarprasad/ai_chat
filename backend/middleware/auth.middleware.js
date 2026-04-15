import jwt from "jsonwebtoken";
import { getCookieOptions, getEnvConfig } from "../config/env.js";

export async function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const redisClient = req.app.locals.redisClient;
    const isBlacklisted = redisClient ? await redisClient.get(token) : null;
    if (isBlacklisted) {
      res.cookie("token", "", getCookieOptions(getEnvConfig().isProduction));
      return res.status(401).json({ message: "Token is blacklisted, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "No token, authorization denied" });
  }
}
