import { Router } from "express";
import { getUserAccount, syncUser } from "../controllers/userController";
import { requireAuth } from "@clerk/express";

const router = Router();

// /api/users/sync -POST => sync clerk user to db (PROTECTED)

router.post("/sync", requireAuth, syncUser);
router.get("/account", requireAuth, getUserAccount);


export default router;