
import redis from "redis";

export function createRedisClient(redisUrl) {
  if (!redisUrl) {
    return null;
  }

  const redisClient = redis.createClient({
    url: redisUrl,
  });

  redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  redisClient.on("connect", () => {
    console.log("Connected to Redis");
  });

  return redisClient;
}
