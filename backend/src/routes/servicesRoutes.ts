import { Router } from "express";
import * as servicesController from "../controllers/servicesController";
import { requireAuth } from "@clerk/express";
import { isAdmin } from "../middleware/isAdmin";
import { services } from "../db/schemas";

const router = Router();

//PUBLIC ROUTES
router.get("/", servicesController.getAllServices);
router.get("/:id", servicesController.getServiceById);

//ADMIN AUTHORIZED ROUTES
router.post("/", isAdmin, requireAuth, servicesController.createService);
router.put("/:id", isAdmin, requireAuth, servicesController.updateService);
router.delete("/:id", isAdmin, requireAuth, servicesController.deleteService);

export default router;