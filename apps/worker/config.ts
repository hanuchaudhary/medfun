import { RedisManager, get1mBucket } from "@repo/config";

const redisManager = RedisManager.getInstance();
export const connection = redisManager.getBullConnection();
export const redisPublisher = redisManager.getPublisher();
export { get1mBucket };
