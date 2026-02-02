import type { Request, Response } from "express";
import * as queries from "../db/queries"
import { getAuth } from "@clerk/express";
import { z } from "zod";

const uuidSchema = z.string().uuid();

export const getAllServices = async (req: Request, res: Response) => {
  try {
    const services = await queries.getAllServices();
    return res.status(200).json(services);
  } catch (error) {
    console.error("Error fetching services: ", error);
    return res.status(500).json({ error: "Failed to get services" });
  }
}

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const service = await queries.getService(id);

    if (!service) return res.status(404).json({ error: "Service not found" });
    res.status(200).json(service);
  } catch (error) {
    console.error("Error getting service: ", error);
    res.status(500).json({ error: "Faield to get service" });
  }
}