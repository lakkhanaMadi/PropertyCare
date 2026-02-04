import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { updateWorkerProfile } from "../controllers/workerController";
import { syncUser } from "../controllers/userController";

const router = Router();

router.post("/worker", requireAuth, updateWorkerProfile);



export default router;