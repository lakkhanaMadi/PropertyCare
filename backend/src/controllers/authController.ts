import { Request, Response } from "express";
import { db } from "../db/index";
import { messageEnum, users } from "../db/schemas";
import { eq } from "drizzle-orm";

export const createUser = async (req: Request, res: Response) => {

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const phoneRegex = /^\d{10}$/;

  try {
    const { email, user_name, role, avatar_url, phone_number } = req.body;

    //check for empty field inputs
    if (!email || !user_name) {
      return res.status(400).json({ message: "Email and name are required" });
    }

    //check if user already exists
    const userExists = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (userExists.length > 0) {
      return res.status(400).json({ message: "User with email already exists!" });
    }

    //check email format
    if (!emailRegex.test(email)) {
      return res.status(400).
        json({ success: false, message: "Email format invalid" })
    }

    //check phone number format (10 digits)
    if (phone_number && !phoneRegex.test(phone_number)) {
      return res.status(400).json({ success: false, message: "Phone number format invalid" })

    }

    //validate roles
    const allowedRoles = ['homeowner', 'worker'] as const;
    const safeRole = allowedRoles.includes(role) ? role : "homeowner";

    //insert user into db
    const newUser = await db.insert(users).values({
      email,
      user_name,
      role: safeRole,
      avatar_url,
      phone_number

    }).returning();

    console.log("User successfully created!");
    return res.status(201).json({ message: "User created", user: newUser });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Error creating user" });
  }

};