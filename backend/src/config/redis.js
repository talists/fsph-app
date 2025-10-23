// src/config/redis.js

import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

redisClient.on("error", (err) => console.error("❌ Erro no cliente Redis:", err));
redisClient.on("connect", () => console.log("✅ Conexão com o Redis estabelecida com sucesso."));

(async () => {
  await redisClient.connect();
})();

export { redisClient };