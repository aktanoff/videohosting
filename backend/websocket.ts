import { RequestHandler, Response } from "express";
import { Server } from "http";
import WebSocket from "ws";
import User from "./database/models/user";

export const userSocketMap = new Map<number, Array<WebSocket>>();

export function sendToUserWS(userId: number, data: unknown): void {
  if (userSocketMap.has(userId)) {
    const userSockets = userSocketMap.get(userId);

    for (const userSocket of userSockets) {
      userSocket.send(JSON.stringify(data));
    }
  }
}

export function sendToEveryoneWS(data: unknown): void {
  for (const userSockets of userSocketMap.values()) {
    for (const userSocket of userSockets) {
      userSocket.send(JSON.stringify(data));
    }
  }
}

export function addWSToUser(userId: number, ws: WebSocket): void {
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, []);
  }

  const prevList = userSocketMap.get(userId);

  userSocketMap.set(userId, [...prevList, ws]);
}

export function deleteWSFromUser(userId: number, ws: WebSocket): void {
  if (!userSocketMap.has(userId)) {
    return;
  }

  const newList = userSocketMap.get(userId).filter((wsItem) => wsItem !== ws);

  if (newList.length === 0) {
    userSocketMap.delete(userId);
    return;
  }

  userSocketMap.set(userId, newList);
}

export function websocketInit({
  server,
  sessionParser,
}: {
  server: Server;
  sessionParser: RequestHandler<unknown>;
}): void {
  const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

  server.on("upgrade", function (request, socket, head) {
    sessionParser(request, {} as Response, () => {
      const userId = request?.session?.passport?.user;

      if (!userId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, function (ws) {
        wss.emit("connection", ws, request);
      });
    });
  });

  wss.on("connection", async (ws, req: Express.Request) => {
    const userId = req.session.passport.user;

    if (userId === undefined) {
      return ws.terminate();
    }

    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return ws.terminate();
    }
    addWSToUser(userId, ws);

    ws.on("close", () => {
      deleteWSFromUser(userId, ws);
    });

    ws.on("error", () => {
      deleteWSFromUser(userId, ws);
    });
  });
}
