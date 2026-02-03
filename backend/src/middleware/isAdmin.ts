import { NextFunction, Request, Response } from "express";
import { getUserById } from "../db/queries";
import { getAuth } from "@clerk/express";

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    //Database Authorization Check
    const user = await getUserById(userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        error: "Forbidden Action: Only admins are allowed to perform this action"
      });
    }

    (req as any).user = user;
    next();

  } catch (error) {
    console.error("Error in Middleware: ", error);
    res.status(500).json({ error: "Internal Server Error" });

  }
};  