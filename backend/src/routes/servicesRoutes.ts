import { Router } from "express";
import * as servicesController from "../controllers/servicesController";
import { requireAuth } from "@clerk/express";

const router = Router();

//get all services
router.get("/", servicesController.getAllServices);
// router.post("/add-service", requireAuth, servicesController.createService);

export default router;