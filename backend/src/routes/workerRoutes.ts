import express from "express";
import { createWorkerProfile } from "../controllers/workerController";
import { requireAuth } from "@clerk/express";

const router = express.Router();



export default router;