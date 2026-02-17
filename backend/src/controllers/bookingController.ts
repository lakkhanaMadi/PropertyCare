import { Request, Response } from "express";
import * as queries from "../db/queries";
import { z, ZodError } from "zod";
import { getAuth } from "@clerk/express";
import { booking, messageEnum, NewBooking } from "../db/schemas";

const uuidSchema = z.string().uuid("Invalid UUID format");

// HOMEOWNER 
export const createBooking = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const worker_service_id = uuidSchema.parse(req.params.workerServiceId);

    const { scheduled_date, scheduled_time, address, agreed_price } = req.body;
    if (!scheduled_date || !scheduled_time || !address || !agreed_price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newBooking = await queries.createBooking({
      homeowner_id: userId,
      worker_service_id: worker_service_id,
      scheduled_date,
      scheduled_time,
      address,
      agreed_price,
    });

    return res.status(201).json({ message: "Booking created successfully", data: newBooking });

  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Error creating Booking: ", error);
    return res.status(500).json({ error: "Error creating booking" });
  }
};

export const homeownerCancelBooking = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const bookingId = uuidSchema.parse(req.params.bookingId);
    const bookingData = await queries.getBookingInfo(bookingId);

    if (bookingData.homeowner_id !== userId) {
      return res.status(404).json({ error: "Forbidden: You can only cancel your own bookings" });
    }

    if (bookingData.status === "completed" || bookingData.status === "cancelled") {
      return res.status(404).json({ error: `Cannot update a booking that's already marked ${bookingData.status}` });
    }

    const cancelledBooking = await queries.updateBookingInfo(bookingId, { status: "cancelled" });
    return res.status(200).json({ message: "Booking cancelled successfully", data: cancelledBooking });


  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Error cancelling booking: ", error);
    return res.status(500).json({ error: "Error cancelling booking" });
  }
};

export const getHomeownerBookings = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    //get list of bookings
    const bookings = await queries.getBookingsForHomeowner(userId);
    return res.status(200).json({ message: "Bookings retrieved successfully!", data: bookings });

  } catch (error) {
    console.error("Failed to fetch bookings for homeowner: ", error);
    return res.status(401).json({ message: "Failed to fetch bookings for homeowner" });
  }
};


//WORKER
export const updateBookingStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const bookingId = uuidSchema.parse(req.params.bookingId);
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid or missing status" });
    }

    const [bookingData] = await queries.getBookingWithWorker(bookingId);
    if (!bookingData) {
      return res.status(404).json({ error: "Booking not found " });
    }

    if (bookingData.status === "cancelled" || bookingData.status === "completed") {
      return res.status(404).json({ error: `Cannot update a booking that is already ${bookingData.status}` });
    }

    if (bookingData.workerId !== userId) {
      return res.status(403).json({ error: "Forbidden: You can only update bookings assigned to you" });
    }

    const updatePayload: Partial<NewBooking> = { status };
    if (status === "confirmed") {
      updatePayload.is_price_confirmed = true;
    }

    const updatedBooking = await queries.updateBookingInfo(bookingId, updatePayload);
    if (!updatedBooking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    return res.status(200).json({ message: "Booking status updated successfully", data: updatedBooking });

  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error("Error updating booking status: ", error);
    return res.status(500).json({ error: "Error updating booking status" });
  }
};

export const getWorkerBookings = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const bookings = await queries.getBookingsForWorker(userId);

    return res.status(200).json({ message: "Bookings retrieved successfully!", data: bookings });

  } catch (error) {
    console.error("Failed to fetch bookings for worker: ", error);
    return res.status(401).json({ message: "Failed to fetch bookings for worker" });
  }
};

