import { db } from "./index";
import { and, desc, eq } from "drizzle-orm";
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
  NewReview, NewChat, NewMessage,
  NewService,
} from "./schemas";
import { worker } from "node:cluster";
import { create } from "node:domain";

//USER QUERIES
export const createUser = async (data: NewUser) => {

  const [user] = await db.insert(users).values(data).returning();

  //if role=='worker', add user to worker profile schema
  if (user.role == 'worker') {
    const workerProfile: NewWorkerProfile = {
      worker_id: user.id,
      bio: "",
      exprience_years: 0,
      service_radius: 0,
      location: "",
      hourly_rate: 0,
    };

    await db.insert(worker_profiles).values(workerProfile).returning();
  }

  return user;
};

export const getUserById = async (id: string) => {
  return db.query.users.findFirst({ where: eq(users.id, id) })
};


export const updateUser = async (id: string, data: Partial<NewUser>) => {
  const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
  return user;
};

//upsert will either create or update
export const upsertUser = async (data: NewUser) => {

  if (data.id !== undefined) {
    const existingUser = await getUserById(data.id)
    if (existingUser) {
      const { id, ...updatePayload } = data;
      return updateUser(id, updatePayload);
    }
  } else {
    console.log('User with ID not found')
  }

  return createUser(data);
};


//WORKER PROFILE QUERIES
export const createProfile = async (data: NewWorkerProfile) => {

  const [profile] = await db.insert(worker_profiles).values(data).returning();
  return profile;
};

export const getProfile = async (worker_id: string) => {
  return db.query.worker_profiles.findFirst({ where: eq(worker_profiles.worker_id, worker_id) });
}

export const updateProfile = async (id: string, data: Partial<NewWorkerProfile>) => {
  const [profile] = await db.update(worker_profiles).set(data).where(eq(worker_profiles.id, id)).returning();
  return profile;
}

export const upsertProfile = async (data: NewWorkerProfile) => {

  if (data.worker_id !== undefined) {
    const existingProfile = await getProfile(data.worker_id)
    if (existingProfile) {
      const { worker_id, ...updatePayload } = data
      return updateProfile(worker_id, updatePayload)
    }
  }

  return createProfile(data);
}

//SERVICES QUERIES
export const createService = async (data: NewService) => {
  const [service] = await db.insert(services).values(data).returning();
  return service;
};

export const getService = async (id: string) => {
  return db.query.services.findFirst({ where: eq(services.id, id) });
};

export const updateService = async (id: string, data: Partial<NewService>) => {
  const [profile] = await db.update(services).set(data).where(eq(services.id, id)).returning();
  return profile;
};

export const upsertServices = async (data: NewService) => {

  if (data.id !== undefined) {
    const existingService = await getService(data.id)
    if (existingService) {
      const { id, ...updatePayload } = data
      return updateService(id, updatePayload)
    }
  }

  return createService(data);
};

//WORKER SERVICES QUERIES
export const createServiceProfile = async (data: NewWorkerService) => {
  const [serviceProfile] = await db.insert(worker_services).values(data).returning();
  return serviceProfile;
};

export const getServiceProfile = async (id: string) => {
  return db.query.worker_services.findFirst({ where: eq(worker_services.id, id) });
};

export const updateServiceProfile = async (id: string, data: Partial<NewWorkerService>) => {
  const [profile] = await db.update(worker_services).set(data).where(eq(worker_services.id, id)).returning();
  return profile;
};

export const upsertServiceProfile = async (data: NewWorkerService) => {
  if (data.id !== undefined) {
    const existingServiceProfile = await getServiceProfile(data.id);

    if (existingServiceProfile) {
      const { id, ...updatePayLoad } = data
      return updateServiceProfile(id, updatePayLoad)
    }
  }

  return createServiceProfile(data);
};


//BOOKING QUERIES
export const createBooking = async (data: NewBooking) => {
  const [newBooking] = await db.insert(booking).values(data).returning();
  return newBooking;
};

export const getBookingInfo = async (id: string, homeownerId: string) => {
  return db.select().from(booking).where(and(eq(booking.id, id), eq(booking.homeowner_id, homeownerId)));
}

export const updateBookingInfo = async (id: string, data: Partial<NewBooking>) => {
  const [updatedBooking] = await db.update(booking).set(data).where(eq(booking.id, id)).returning();
  return updatedBooking;
};


//REVIEWS QUERIES
export const addReview = async (data: NewReview) => {
  const [addReview] = await db.insert(reviews).values(data).returning();
  return addReview;
};

export const viewReview = async (id: string, booking_id: string) => {
  return db.select().from(reviews).where(and(eq(reviews.id, id), eq(reviews.booking_id, booking_id)));
};

export const getReviewByBooking = async (booking_id: string) => {
  return db.select().from(reviews).where(eq(reviews.booking_id, booking_id));
}

//CHATS QUERIES
export const getOrCreateChat = async (homeownerId: string, workerId: string) => {
  const existingChat = await db.query.chats.findFirst({
    where: (chats, { and, eq }) =>
      and(eq(chats.homeowner_id, homeownerId), eq(chats.worker_id, workerId)),
  });

  if (existingChat) return existingChat;

  const [newChat] = await db.insert(chats).values({ homeowner_id: homeownerId, worker_id: workerId }).returning();

  return newChat;
}

export const getUserInbox = async (userId: string) => {
  return await db.query.chats.findMany({
    where: (chats, { or }) => or(eq(chats.homeowner_id, userId), eq(chats.worker_id, userId)),
    with: {
      messages: { orderBy: desc(messages.created_at), limit: 1, },
      homeowner: true,
      worker: {
        with: {
          user: true
        }
      }
    },
    orderBy: desc(chats.updated_at),
  });
};

//MESSAGES QUERIES
export const createMessage = async (chatId: string, senderId: string, content: any, type: 'text' | 'image' | 'location' | 'file') => {
  return await db.transaction(async (tx) => {
    const [newMessage] = await tx.insert(messages).values({
      chat_id: chatId,
      sender_id: senderId,
      message_type: type,
      content: content,
    }).returning();

    await tx.update(chats).set({ updated_at: new Date() }).where(eq(chats.id, chatId));

    return newMessage;

  })
};

export const getMessage = async (chatId: string) => {
  return db.select().from(messages).where(eq(messages.chat_id, chatId));
}

