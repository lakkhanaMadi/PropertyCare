import { Router } from "express";
import * as bookingController from "../controllers/bookingController";
import { requireAuth } from "@clerk/express";

const router = Router();

//HOMEOWNER ROUTE
router.post("/:workerServiceId", requireAuth, bookingController.createBooking);
router.patch("/homeowner/:bookingId", requireAuth, bookingController.homeownerCancelBooking);
router.get("/", requireAuth, bookingController.getHomeownerBookings);




export default router;