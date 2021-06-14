import express from "express";
import next from "next";
import routes from "./routes";
import dbInit from "./database/init";
import session from "express-session";
import http from "http";
import passport from "./passport/index";
import dotenv from "dotenv";
import { websocketInit } from "./websocket";

// Инициализируем переменные окружения
dotenv.config();

const app = express();
const PORT = 8000;

const dev = process.env.NODE_ENV !== "production";
const nextJSApp = next({ dev, dir: "./frontend" });
const handle = nextJSApp.getRequestHandler();

const day = 24 * 60 * 60 * 1000;

const sessionParser = session({
  secret: "f9843f745a02a0d21939db094279dd0507673ee3ecf03593850e960cd8070b78",
  saveUninitialized: true,
  resave: false,
  cookie: {
    maxAge: day,
  },
});

nextJSApp.prepare().then(async () => {
  await dbInit();

  app.use(express.json());
  app.use(sessionParser);
  app.use(passport.initialize());
  app.use(passport.session());

  routes(app);
  app.use("/uploads", express.static("uploads"));
  app.all("*", (req, res) => handle(req, res));

  const server = http.createServer(app);

  websocketInit({ server, sessionParser });

  server.listen(PORT, function () {
    console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`);
  });
});
