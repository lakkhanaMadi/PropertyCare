import { db } from "./index";
import { and, desc, eq, or, sql } from "drizzle-orm";
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


//USER QUERIES
export const createUser = async (data: NewUser) => {

  const [user] = await db.insert(users).values(data).returning();

  //if role=='worker', add user to worker profile schema
  if (user.role == 'worker') {
    const workerProfile: NewWorkerProfile = {
      id: user.id,
      bio: "",
      experience_years: 0,
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

  const existingUser = await getUserById(data.id);

  let user;
  if (existingUser) {
    const { id, ...updatePayLoad } = data;
    user = await updateUser(id, updatePayLoad);
  } else {
    user = await createUser(data);
  }

  if (user.role === 'worker') {
    const profile = await getProfile(user.id);
    if (!profile) {
      await createProfile({
        id: user.id,
        bio: "",
        experience_years: 0,
        service_radius: 0,
        location: "",
        hourly_rate: 0,
      });
    }
  }

  return user;
};

//ADMIN QUERIES
export const adminGetUsers = async (role?: 'homeowner' | 'worker') => {
  if (role) {
    return await db.select().from(users).where(eq(users.role, role));
  }
  return await db.select().from(users);
};



//WORKER PROFILE QUERIES
export const createProfile = async (data: NewWorkerProfile) => {

  const [profile] = await db.insert(worker_profiles).values(data).onConflictDoNothing().returning();
  return profile;
};

export const getProfile = async (worker_id: string) => {
  return db.query.worker_profiles.findFirst({ where: eq(worker_profiles.id, worker_id) });
}

export const updateProfile = async (id: string, data: Partial<NewWorkerProfile>) => {
  const [profile] = await db.update(worker_profiles).set(data).where(eq(worker_profiles.id, id)).returning();
  return profile;
}

export const upsertProfile = async (data: NewWorkerProfile) => {

  if (data.id !== undefined) {
    const existingProfile = await getProfile(data.id)
    if (existingProfile) {
      const { id, ...updatePayload } = data
      return updateProfile(id, updatePayload)
    }
  }

  return createProfile(data);
}

//SERVICES QUERIES
export const createService = async (data: NewService, adminUserRole: string) => {

  if (adminUserRole !== 'admin') {
    throw new Error('Unauthorized: Only admins can create a service');
  }

  const cleanData = {
    ...data, name: data.name.trim()
  };

  const [service] = await db.insert(services).values(cleanData).returning();
  return service;
};

export const getServiceById = async (id: string) => {
  return db.query.services.findFirst({ where: eq(services.id, id) });
};

export const getAllServices = async () => {
  return db.select({ name: services.name }).from(services);
}

export const updateService = async (id: string, data: Partial<NewService>, adminUserRole: string) => {

  if (adminUserRole !== 'admin') {
    throw new Error('Unauthorized: Only admins can update a service');
  }

  const [service] = await db.update(services).set(data).where(eq(services.id, id)).returning();
  return service;
};

export const upsertServices = async (data: NewService, adminUserRole: string) => {

  if (adminUserRole !== 'admin') throw new Error("Unauthorized");

  const cleanName = data.name.trim();

  // "Upsert" using ON CONFLICT logic
  const [service] = await db
    .insert(services)
    .values({ ...data, name: cleanName })
    .onConflictDoUpdate({
      target: services.name, // If the NAME already exists...
      set: {
        // ...update these fields instead of inserting
        updated_at: new Date()
      },
    })
    .returning();

  return service;
};

export const deleteService = async (id: string, adminUserRole: string) => {
  if (adminUserRole !== 'admin') {
    throw new Error('Unauthorized: Only admins can update a service');
  }
  const [service] = await db.delete(services).where(eq(services.id, id)).returning();
  return service;
}

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
  const existing = await db.query.worker_services.findFirst({
    where: and(
      eq(worker_services.worker_id, data.worker_id),
      eq(worker_services.service_id, data.service_id)
    ),
  });

  if (existing) {
    return updateServiceProfile(existing.id, data);
  }

  return createServiceProfile(data);
};

export const removeWorkerService = async (workerId: string, serviceId: string) => {
  return await db
    .delete(worker_services)
    .where(
      and(
        eq(worker_services.worker_id, workerId),
        eq(worker_services.service_id, serviceId)
      )
    )
    .returning();
};

export const searchWorkersByService = async (id: string) => {
  return await db.select({
    workerName: users.user_name,
    avatar: users.avatar_url,
    bio: worker_profiles.bio,
    hourlyRate: worker_profiles.hourly_rate,
    minPrice: worker_services.price_min,
    maxPrice: worker_services.price_max,
    service: services.name
  })
    .from(worker_services)
    .innerJoin(services, eq(worker_services.service_id, services.id))
    .innerJoin(worker_profiles, eq(worker_services.worker_id, worker_profiles.id))
    .innerJoin(users, eq(worker_profiles.id, users.id))
    .where(eq(services.id, id));
};


//BOOKING QUERIES
export const createBooking = async (data: NewBooking) => {
  const [newBooking] = await db.insert(booking).values(data).returning();
  return newBooking;
};

export const getBookingInfo = async (id: string) => {
  const [bookingInfo] = await db.select().from(booking).where(eq(booking.id, id));
  return bookingInfo;
}

export const updateBookingInfo = async (id: string, data: Partial<NewBooking>) => {
  const [updatedBooking] = await db.update(booking).set(data).where(eq(booking.id, id)).returning();
  return updatedBooking;
};

export const getBookingWithWorker = async (bookingId: string) => {
  return await db.select({
    workerId: worker_services.worker_id,
    status: booking.status,
  })
    .from(booking)
    .innerJoin(worker_services, eq(booking.worker_service_id, worker_services.id))
    .where(eq(booking.id, bookingId))
    .limit(1);
};

export const getBookingsForHomeowner = async (homeownerId: string) => {
  return await db.select({
    id: booking.id,
    status: booking.status,
    date: booking.scheduled_date,
    price: booking.agreed_price,
    workerName: users.user_name,
    serviceName: services.name
  })
    .from(booking)
    .innerJoin(worker_services, eq(booking.worker_service_id, worker_services.id))
    .innerJoin(users, eq(worker_services.worker_id, users.id))
    .innerJoin(services, eq(worker_services.service_id, services.id))
    .where(eq(booking.homeowner_id, homeownerId));
};

export const getBookingsForWorker = async (workerId: string) => {
  return await db.select({
    id: booking.id,
    status: booking.status,
    date: booking.scheduled_date,
    time: booking.scheduled_time,
    address: booking.address,
    price: booking.agreed_price,
    homeownerName: users.user_name,
    serviceName: services.name
  })
    .from(booking)
    .innerJoin(worker_services, eq(booking.worker_service_id, worker_services.id))
    .innerJoin(users, eq(booking.homeowner_id, users.id))
    .innerJoin(services, eq(worker_services.service_id, services.id))
    .where(eq(worker_services.worker_id, workerId));
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

export const getReviewsByWorker = async (worker_id: string) => {
  return db.select({
    id: reviews.id,
    rating: reviews.rating,
    comment: reviews.comment,
    createdAt: reviews.created_at,
    homeownerName: users.user_name,
    homeownerAvatar: users.avatar_url,
    serviceName: services.name,
  })
    .from(reviews)
    .innerJoin(users, eq(reviews.homeowner_id, users.id))
    .innerJoin(booking, eq(reviews.booking_id, booking.id))
    .innerJoin(worker_services, eq(booking.worker_service_id, worker_services.id))
    .innerJoin(services, eq(worker_services.service_id, services.id))
    .where(eq(worker_services.worker_id, worker_id))
    .orderBy(desc(reviews.created_at));
}

export const deleteReview = async (id: string, userRole: string, userId: string) => {
  const [review] = await db.delete(reviews).where(
    and(
      eq(reviews.id, id),
      or(
        eq(reviews.homeowner_id, userId),
        eq(sql`${userRole}`, 'admin')
      )
    )
  ).returning();

  return review;
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

export const deleteChat = async (chatId: string, currentUserId: string) => {

  const existingChat = await db.query.chats.findFirst({
    where: (chats, { and, or, eq }) =>
      and(
        eq(chats.id, chatId),
        or(eq(chats.homeowner_id, currentUserId), eq(chats.worker_id, currentUserId))
      ),
  });

  if (existingChat) {
    const [chat] = await db.delete(chats).where(eq(chats.id, chatId)).returning();
    return chat;
  } else {
    throw new Error("Chat doesn't exist!");
  }

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
};

export const deleteMessage = async (messageId: string) => {
  const [message] = await db.delete(messages).where(eq(messages.id, messageId)).returning();
  return message;
};



