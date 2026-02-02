import { Router } from "express";
import * as servicesController from "../controllers/servicesController";
import { requireAuth } from "@clerk/express";

const router = Router();


router.get("/", servicesController.getAllServices);
router.get("/:id", servicesController.getServiceById);


export default router;