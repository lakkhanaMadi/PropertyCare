import { db } from "./index";
import { eq } from "drizzle-orm";
import {
  users, 
  worker_profiles,
  services, 
  worker_services, 
  booking, 
  reviews, 
  chats, 
  messages,
  NewUser, NewWorkerProfile, NewWorkerService, NewBooking,
  NewReview, NewChat, NewMessage
} from "./schemas";

//USER QUERIES

export const createUser = async (data:NewUser)=> {
  const [user]= await db.insert(users).values(data).returning();
  return user;
}
export const getUserByEmail = async(email: string)=>{
  return db.query.users.findFirst({})
}
