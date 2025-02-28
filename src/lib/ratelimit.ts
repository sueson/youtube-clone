import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

export const rateLimit = new Ratelimit({
    redis,
    // 100 request within 10seconds will cause timeout
    limiter: Ratelimit.slidingWindow(100, "10s"),
})