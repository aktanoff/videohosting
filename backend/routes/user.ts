import express, { Router } from "express";
import authorizedMiddleware from "../passport/authorizedMiddleware";
import passport from "../passport/index";

export default function (app: Router): void {
  const router = express.Router();
  app.use("/user", router);

  router.get("/me", authorizedMiddleware, (req, res) => {
    res.json(req.user);
  });

  router.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
  });

  router.get(
    "/oauth/google",
    passport.authenticate("google", {
      scope: [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/plus.login",
      ],
    })
  );

  router.get(
    "/oauth/google/callback",
    passport.authenticate("google", {
      successRedirect: "/",
      failureRedirect: "/google-auth-failed",
    })
  );
}
