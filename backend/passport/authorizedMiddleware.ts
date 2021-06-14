import { NextFunction, Request, Response } from "express";

export default function authorizedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Response | void {
  if (!req.user) {
    return res.sendStatus(401);
  }

  next();
}
