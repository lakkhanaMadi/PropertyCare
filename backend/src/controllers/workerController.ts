import { Request, Response } from "express";
import * as queries from "../db/queries";
import { z, ZodError } from "zod";

const uuidSchema = z.string().uuid("Invalid UUID format");

