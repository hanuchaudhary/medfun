import { type RedisClientType, createClient } from "redis";
import { UserManager } from "./user-manager";

interface TradeEvent {
  type: "BUY" | "SELL";
  tokenMint: string;
  price: number;
  solAmount: number;
  tokenAmount: number;
  traderAddress: string;
  signature: string;
  timestamp: number;
}

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriptions: Map<string, string[]> = new Map();
  private reverseSubscriptions: Map<string, string[]> = new Map();
  private redisClient: RedisClientType;
  private initialized: boolean = false;

  private constructor() {
    this.redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.error("Max Redis reconnection attempts reached");
            return false;
          }
          return Math.min(retries * 1000, 5000);
        },
      },
    });

    this.redisClient.on("error", (err) => {
      console.error("Redis client error:", err.message);
    });

    this.init();
  }

  private async init() {
    try {
      await this.redisClient.connect();
      this.initialized = true;
      console.log("Redis subscriber connected");
    } catch (error) {
      console.error("Failed to connect Redis subscriber:", error);
    }
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  public async subscribe(userId: string, channel: string) {
    if (this.subscriptions.get(userId)?.includes(channel)) {
      return;
    }

    this.subscriptions.set(
      userId,
      (this.subscriptions.get(userId) || []).concat(channel)
    );

    this.reverseSubscriptions.set(
      channel,
      (this.reverseSubscriptions.get(channel) || []).concat(userId)
    );

    if (this.reverseSubscriptions.get(channel)?.length === 1) {
      console.log(`Subscribing to Redis channel: ${channel}`);
      await this.redisClient.subscribe(channel, this.redisCallbackHandler);
    }

    console.log(`User ${userId} subscribed to ${channel}`);
  }

  private redisCallbackHandler = (message: string, channel: string) => {
    try {
      const tradeEvent: TradeEvent = JSON.parse(message);
      const subscribers = this.reverseSubscriptions.get(channel) || [];
      console.log(
        `Received message on ${channel}, broadcasting to ${subscribers.length} users`
      );

      subscribers.forEach((userId) => {
        const user = UserManager.getInstance().getUser(userId);
        if (user) {
          user.emit(channel, tradeEvent);
        }
      });
    } catch (error) {
      console.error("Error handling Redis message:", error);
    }
  };

  public async unsubscribe(userId: string, channel: string) {
    const userSubscriptions = this.subscriptions.get(userId);
    if (userSubscriptions) {
      this.subscriptions.set(
        userId,
        userSubscriptions.filter((s) => s !== channel)
      );
    }

    const channelSubscribers = this.reverseSubscriptions.get(channel);
    if (channelSubscribers) {
      this.reverseSubscriptions.set(
        channel,
        channelSubscribers.filter((s) => s !== userId)
      );

      if (this.reverseSubscriptions.get(channel)?.length === 0) {
        console.log(`Unsubscribing from Redis channel: ${channel}`);
        this.reverseSubscriptions.delete(channel);
        await this.redisClient.unsubscribe(channel);
      }
    }

    console.log(`User ${userId} unsubscribed from ${channel}`);
  }

  public userLeft(userId: string) {
    console.log(`User ${userId} disconnected`);
    const userChannels = this.subscriptions.get(userId) || [];
    userChannels.forEach((channel) => this.unsubscribe(userId, channel));
    this.subscriptions.delete(userId);
  }

  getSubscriptions(userId: string) {
    return this.subscriptions.get(userId) || [];
  }
}
