import { WebSocket } from "ws";
import { User } from "./user";
import { SubscriptionManager } from "./subscription-manager";

export class UserManager {
  private static instance: UserManager;
  private users: Map<string, User> = new Map();

  private constructor() {}

  public static getInstance() {
    if (!this.instance) {
      this.instance = new UserManager();
    }
    return this.instance;
  }

  public addUser(ws: WebSocket): User {
    const id = this.getRandomId();
    const user = new User(id, ws);
    this.users.set(id, user);
    this.registerOnClose(ws, id);
    console.log(`User ${id} connected. Total users: ${this.users.size}`);
    return user;
  }

  private registerOnClose(ws: WebSocket, id: string) {
    ws.on("close", () => {
      this.users.delete(id);
      SubscriptionManager.getInstance().userLeft(id);
      console.log(
        `User ${id} disconnected. Total users: ${this.users.size}`
      );
    });
  }

  public getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  public getUserCount(): number {
    return this.users.size;
  }

  private getRandomId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
