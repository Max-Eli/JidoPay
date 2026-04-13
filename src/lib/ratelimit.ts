import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;
let aiRatelimit: Ratelimit | null = null;

function getRedis(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error("Upstash Redis environment variables are not set");
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

/** General API rate limit: 60 requests per minute per user */
export function getRatelimit(): Ratelimit {
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "jidopay:api",
    });
  }
  return ratelimit;
}

/** AI endpoint rate limit: 20 requests per minute per user */
export function getAiRatelimit(): Ratelimit {
  if (!aiRatelimit) {
    aiRatelimit = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: true,
      prefix: "jidopay:ai",
    });
  }
  return aiRatelimit;
}
