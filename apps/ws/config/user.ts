import { WebSocket } from "ws";
import type { RawData } from "ws";
import { SubscriptionManager } from "./subscription-manager";

const SUBSCRIBE = "SUBSCRIBE";
const UNSUBSCRIBE = "UNSUBSCRIBE";

interface IncomingMessage {
  method: typeof SUBSCRIBE | typeof UNSUBSCRIBE;
  params: string[];
}

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

interface OutgoingMessage {
  type: string;
  channel: string;
  data: TradeEvent;
}

export class User {
  private id: string;
  private ws: WebSocket;

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.addListeners();
  }

  private subscriptions: string[] = [];

  public getId() {
    return this.id;
  }

  public subscribe(subscription: string) {
    this.subscriptions.push(subscription);
  }

  public unsubscribe(subscription: string) {
    this.subscriptions = this.subscriptions.filter((s) => s !== subscription);
  }

  emit(channel: string, data: TradeEvent) {
    const message: OutgoingMessage = {
      type: "trade",
      channel,
      data,
    };
    this.ws.send(JSON.stringify(message));
  }

  private addListeners() {
    this.ws.on("message", (rawMessage: RawData) => {
      try {
        const message = rawMessage.toString();
        const parsedMessage: IncomingMessage = JSON.parse(message);

        if (parsedMessage.method === SUBSCRIBE) {
          parsedMessage.params.forEach((channel) => {
            SubscriptionManager.getInstance().subscribe(this.id, channel);
          });
        }

        if (parsedMessage.method === UNSUBSCRIBE) {
          parsedMessage.params.forEach((channel) => {
            SubscriptionManager.getInstance().unsubscribe(this.id, channel);
          });
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    this.ws.on("error", (error) => {
      console.error(`WebSocket error for user ${this.id}:`, error);
    });
  }
}
