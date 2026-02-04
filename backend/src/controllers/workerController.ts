import { Request, Response } from "express";
import * as queries from "../db/queries";
import { z, ZodError } from "zod";
import { getAuth } from "@clerk/express";

// WORKER PROFILE QUERIES
export const updateWorkerProfile = async (req: Request, res: Response) => {

  try {
    const { userId } = getAuth(req);
    const { bio, experience_years, service_radius, location, hourly_rate } = req.body;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const existingProfile = await queries.getProfile(userId);
    if (!existingProfile) {
      return res.status(404).json({ error: "Worker profile not found" });
    }

    const updateProfile = await queries.updateProfile(userId, {
      bio,
      experience_years,
      service_radius,
      location,
      hourly_rate
    });

    return res.status(200).json({ message: "Worker profile updated successfully", data: updateProfile });

  } catch (error) {
    console.error("Error in updating worker profile: ", error);
    return res.status(500).json({ error: "Failed to update worker profile" });
  }

};