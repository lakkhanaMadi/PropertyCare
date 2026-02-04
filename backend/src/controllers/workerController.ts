import { Request, Response } from "express";
import * as queries from "../db/queries";
import { uuid, z, ZodError } from "zod";
import { getAuth } from "@clerk/express";
import { get } from "node:http";

const uuidSchema = z.string().uuid("Invalid UUID format");

// WORKER PROFILE 
export const getProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const workerProfile = await queries.getProfile(userId);
    if (!workerProfile) {
      return res.status(404).json({ error: "Worker profile not found" });
    }
    return res.status(200).json(workerProfile);
  } catch (error) {
    console.error("Error fetching worker profile: ", error);
    return res.status(500).json({ error: "Failed to fetch worker profile" });
  }
};

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

//WORKER SERVICES
export const createServiceProfile = async (req: Request, res: Response) => {

  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const userProfile = await queries.getUserById(userId!);
    if (!userProfile || userProfile.role !== "worker") return res.status(401).json({ error: "Unauthorized! Only workers can create a service profile" });

    const serviceId = uuidSchema.parse(req.body.serviceId);

    const { price_min, price_max } = req.body;
    if (price_min === undefined || price_max === undefined) {
      return res.status(400).json({ error: "Price range is required" });
    }

    const serviceProfile = await queries.createServiceProfile({
      worker_id: userId,
      service_id: serviceId,
      price_min,
      price_max,
    });

    return res.status(201).json({ message: "Service profile created successfully", data: serviceProfile });

  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Invalid service ID format", details: error.issues });
    }

    console.error("Error in creating service profile: ", error);
    return res.status(500).json({ error: "Failed to create service profile" });

  }
};

export const updateServiceProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const userProfile = await queries.getUserById(userId!);
    if (!userProfile || userProfile.role !== "worker") return res.status(401).json({ error: "Unauthorized! Only workers can update a service profile" });

    const profileId = uuidSchema.parse(req.params.id);
    const { price_min, price_max } = req.body;
    if (price_min === undefined || price_max === undefined) {
      return res.status(400).json({ error: "Price range is required" });
    }

    const updatedServiceProfile = await queries.updateServiceProfile(profileId, {
      price_min,
      price_max,
    });

    if (!updatedServiceProfile) {
      return res.status(404).json({ error: "Service profile not found" });
    }

    return res.status(200).json({ message: "Service profile updated successfully", data: updatedServiceProfile });


  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Invalid profile ID format", details: error.issues });
    }

    console.error("Error updating service profile: ", error);
    return res.status(500).json({ error: "Failed to update service profile" });
  }
};