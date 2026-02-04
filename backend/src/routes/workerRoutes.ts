import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { createServiceProfile, getProfile, updateServiceProfile, updateWorkerProfile } from "../controllers/workerController";
import { syncUser } from "../controllers/userController";
import { createService } from "../db/queries";

const router = Router();

//WORKER PROFILE ROUTES
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateWorkerProfile);


//WORKER SERVICES ROUTES
router.post("/services", requireAuth, createServiceProfile);
router.put("/services", requireAuth, updateServiceProfile);

export default router;