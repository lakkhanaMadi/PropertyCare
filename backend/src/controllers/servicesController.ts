import type { Request, Response } from "express";
import * as queries from "../db/queries"
import { getAuth } from "@clerk/express";

export const getAllServices = async (req: Request, res: Response) => {
  try {
    const services = await queries.getAllServices();
    return res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching services: ", error);
    return res.status(500).json({ error: "Failed to get services" });
  }
}

