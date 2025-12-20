import { WebSocketServer, WebSocket } from "ws";
import { UserManager } from "../config/user-manager";
import { SubscriptionManager } from "../config/subscription-manager";

const PORT = parseInt(process.env.WS_PORT || "8080");

const wss = new WebSocketServer({ port: PORT });
SubscriptionManager.getInstance();

wss.on("connection", (ws: WebSocket, req) => {
  const user = UserManager.getInstance().addUser(ws);
  console.log(`New WebSocket connection: ${user.getId()}`);

  ws.send(
    JSON.stringify({
      type: "connected",
      userId: user.getId(),
      message: "Connected to MedFun WebSocket server",
    })
  );
});

wss.on("error", (error) => {
  console.error("WebSocket server error:", error );
});


wss.on("close", () => {
  console.log("WebSocket server closed");
});
