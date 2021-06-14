import express, { Express } from "express";
import userRouter from "./routes/user";
import videoRouter from "./routes/video";

export default function (app: Express): void {
  const router = express.Router();
  userRouter(router);
  videoRouter(router);

  app.use("/api", router);
}
