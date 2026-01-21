import { Redis } from 'ioredis';
import { redisConnection } from '../config/redis';

const redis = new Redis(redisConnection);

/**
 * Checks if a key has exceeded its rate limit.
 * Generic implementations.
 */
export const checkRateLimit = async (
    identifier: string,
    limit: number = 5,
    windowSeconds: number = 60
): Promise<boolean> => {
    if (!identifier) return false;

    const key = `rate-limit:${identifier}`;
    const currentCount = await redis.incr(key);

    if (currentCount === 1) {
        await redis.expire(key, windowSeconds);
    }

    return currentCount > limit;
};

/**
 * Checks if a sender has exceeded their rate limit.
 * Specialized wrapper (or alertnative logic).
 */
export const checkSenderRateLimit = async (
    sender: string,
    limit: number,
    windowSeconds: number
): Promise<boolean> => {
    return checkRateLimit(`sender:${sender}`, limit, windowSeconds);
};
