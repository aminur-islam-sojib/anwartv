// lib/redis.ts
import { Redis } from "@upstash/redis";

const hasRedisEnv =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN;

if (!hasRedisEnv && typeof window === "undefined") {
  console.warn(
    "⚠️ Warning: Missing Upstash Redis environment variables. Falling back to a mock Redis client."
  );
}

export const redis = hasRedisEnv
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : ({
      get: async () => null,
      set: async () => "OK",
    } as unknown as Redis);

export default redis;

