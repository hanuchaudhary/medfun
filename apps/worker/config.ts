import IORedis from "ioredis";

export const publisher = new IORedis(process.env.REDIS_URL!);

const REDIS_URL = process.env.REDIS_URL!;
export const connection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

export function get1mBucket(unixSeconds: number) {
  return new Date(Math.floor(unixSeconds / 60) * 60 * 1000);
}
