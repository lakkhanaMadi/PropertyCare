import { Router } from "express";
import { requireAuth } from "@clerk/express";
import { createServiceProfile, getProfile, updateServiceProfile, updateWorkerProfile } from "../controllers/workerController";
import { getWorkerBookings, updateBookingStatus } from "../controllers/bookingController";

const router = Router();

//WORKER PROFILE ROUTES
router.get("/profile", requireAuth, getProfile);
router.patch("/profile", requireAuth, updateWorkerProfile);


//WORKER SERVICES ROUTES
router.post("/services", requireAuth, createServiceProfile);
router.patch("/services", requireAuth, updateServiceProfile);

//BOOKINGS
router.patch("/:bookingId", requireAuth, updateBookingStatus);
router.get("/", requireAuth, getWorkerBookings);

export default router;