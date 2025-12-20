import IORedis from "ioredis";
import { type RedisClientType, createClient } from "redis";

export class RedisManager {
  private static instance: RedisManager;
  private publisher: RedisClientType; 
  private bullConnection: IORedis;
  private redisClient: RedisClientType;

  private initialized: boolean = false;

  private constructor() {
    const redisUrl = process.env.REDIS_URL!;
    this.redisClient = createClient({
      url: redisUrl,
    });
    this.publisher = createClient({
      url: redisUrl,
    });

    this.bullConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
    });

    this.init();
  }

  private async init() {
    try {
      await this.publisher.connect();
      this.initialized = true;
      console.log("Redis publisher connected");

      this.publisher.on("error", (err: Error) => {
        console.error("Redis publisher error:", err);
      });

      this.bullConnection.on("connect", () => {
        console.log("Redis BullMQ connection established");
      });

      this.bullConnection.on("error", (err: Error) => {
        console.error("Redis BullMQ connection error:", err);
      });

      this.bullConnection.on("close", () => {
        console.warn("Redis BullMQ connection closed");
      });

      this.bullConnection.on("reconnecting", () => {
        console.log("Redis BullMQ reconnecting...");
      });
    } catch (error) {
      console.error("Failed to connect Redis:", error);
    }
  }

  public static getInstance(): RedisManager {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public getPublisher(): RedisClientType {
    return this.publisher;
  }

  public getBullConnection(): IORedis {
    return this.bullConnection;
  }

  public async publish(channel: string, message: string): Promise<number> {
    return this.publisher.publish(channel, message);
  }

  public isConnected(): boolean {
    return this.initialized;
  }

  public async shutdown(): Promise<void> {
    console.log("Shutting down Redis connections...");
    await this.publisher.quit();
    await this.bullConnection.quit();
    console.log("Redis connections closed");
  }
}

export function get1mBucket(unixSeconds: number): Date {
  return new Date(Math.floor(unixSeconds / 60) * 60 * 1000);
}
