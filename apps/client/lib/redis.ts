import { createClient, type RedisClientType } from "redis";

class RedisCacheManager {
  private static instance: RedisCacheManager;
  private client: RedisClientType | null = null;
  private connectionPromise: Promise<RedisClientType> | null = null;

  private constructor() {}

  public static getInstance(): RedisCacheManager {
    if (!RedisCacheManager.instance) {
      RedisCacheManager.instance = new RedisCacheManager();
    }
    return RedisCacheManager.instance;
  }

  private async connect(): Promise<RedisClientType> {
    if (this.client?.isOpen) {
      return this.client;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = (async () => {
      this.client = createClient({ url: process.env.REDIS_URL }) as RedisClientType;

      this.client.on("error", (err) => {
        console.error("Redis cache error:", err);
      });

      await this.client.connect();
      return this.client;
    })();

    return this.connectionPromise;
  }

  public async getClient(): Promise<RedisClientType> {
    return this.connect();
  }

  public async get<T>(key: string): Promise<T | null> {
    const client = await this.getClient();
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  public async set(key: string, value: unknown, ttlSeconds: number = 120): Promise<void> {
    const client = await this.getClient();
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  }

  public async del(key: string): Promise<void> {
    const client = await this.getClient();
    await client.del(key);
  }
}

export const redisCache = RedisCacheManager.getInstance();
