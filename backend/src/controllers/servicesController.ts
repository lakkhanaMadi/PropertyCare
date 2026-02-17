import type { Request, Response } from "express";
import * as queries from "../db/queries"
import { z, ZodError } from "zod";

const uuidSchema = z.string().uuid("Invalid UUID format");

export const getAllServices = async (req: Request, res: Response) => {
  try {
    const services = await queries.getAllServices();
    return res.status(200).json(services);
  } catch (error: any) {
    console.error("Error fetching services: ", error);
    return res.status(500).json({ error: "Failed to get services" });
  }
};

export const createService = async (req: Request, res: Response) => {
  try {
    const adminUser = (req as any).user;

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Service name is required!" });
    }

    const service = await queries.createService({ name }, adminUser.role);
    return res.status(201).json({ message: "Service created successfully", data: service });

  } catch (error) {
    console.error("Error in creating service: ", error);
    return res.status(500).json({ error: "Failed to create service" });
  }

};

export const updateService = async (req: Request, res: Response) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const { name } = req.body;
    const adminUser = (req as any).user;
    if (!name) {
      return res.status(400).json({ error: "Service name is required!" });
    }

    const updatedService = await queries.updateService(id, { name }, adminUser.role);
    if (!updatedService) {
      return res.status(404).json({ error: "Service not found" });
    }

    return res.status(200).json({ message: "Service updated successfully", data: updatedService });

  } catch (error: any) {

    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Invalid ID format", details: error.issues });
    }

    console.error("Error in updating service", error);
    return res.status(500).json({ error: "Failed to update service" });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const adminUser = (req as any).user;

    const deletedService = await queries.deleteService(id, adminUser.role);
    if (!deletedService) {
      return res.status(404).json({ error: "Service not found" });
    }

    return res.status(200).json({ message: "Service deleted successfully" });

  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: "Invalid ID format", details: error.issues });
    }

    console.error("Error in deleting service", error);
    return res.status(500).json({ error: "Failed to delete service" });
  }
};

export const getWorkersByService = async (req: Request, res: Response) => {
  try {

    const serviceId = uuidSchema.parse(req.params.id);
    if (!serviceId) {
      return res.status(404).json({ error: "Service not found" });
    }
    const service = await queries.getServiceById(serviceId);
    if (!service) {
      return res.status(404).json({ error: "Service not found" });
    }

    const workers = await queries.searchWorkersByService(serviceId);
    return res.status(200).json({ serviceInfo: service.name, workers: workers });

  } catch (error) {
    console.error("Error in fetching workers for this service");
    return res.status(500).json({ error: "Failed to fetch workers for this service" });
  }
};
