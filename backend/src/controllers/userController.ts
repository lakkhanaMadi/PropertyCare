import type { Request, Response } from "express";
import * as queries from "../db/queries"

import { getAuth } from "@clerk/express";

export async function syncUser(req: Request, res: Response) {
  try {
    const { userId } = getAuth(req)
    if (!userId) return res.status(401).json({ error: "Unauthorized" })

    const { email, name, role, avatarUrl, phoneNumber } = req.body;

    if (!email || !name || !phoneNumber) {
      return res.status(400).json({ error: "Email, name, and phone number are required" });
    }

    const users = await queries.upsertUser({
      id: userId,
      email,
      user_name: name,
      role: role,
      avatar_url: avatarUrl,
      phone_number: phoneNumber,
    })

    if (role == 'worker') {
      const existingWorker = await queries.getProfile(userId);
      if (!existingWorker) {
        await queries.createProfile({
          id: userId,
          bio: "",
          experience_years: 0,
          service_radius: 0,
          location: "",
          hourly_rate: 0
        })

        return res.status(201).json({ message: "Worker profile created", data: users });

      }
    }

    res.status(200).json(users)
  } catch (error) {
    console.error("Error syncing user: ", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
};