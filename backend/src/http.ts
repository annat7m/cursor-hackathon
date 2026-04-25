import type { NextFunction, Request, Response } from "express";
import { config } from "./config.js";

export function requireInviteCode(req: Request, res: Response, next: NextFunction) {
  if (!config.INVITE_CODE) return next();
  const got = req.header("x-invite-code");
  if (got && got === config.INVITE_CODE) return next();
  return res.status(401).json({ error: "Invite code required" });
}

