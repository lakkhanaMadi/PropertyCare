import { db } from "."
import { services } from "./schemas"
import "dotenv/config"

const main = async () => {

  if (!process.env.DB_URL) {
    throw new Error("Env not set");
  }

  const serviceList = [
    { name: 'Plumbing', description: 'Pipe repair, leak detection, and installations.' },
    { name: 'Electrical', description: 'Wiring, fixture installation, and circuit repair.' },
    { name: 'Carpentry', description: 'Furniture repair, framing, and woodwork.' },
    { name: 'Cleaning', description: 'Standard and deep cleaning for homes.' },
    { name: 'Painting', description: 'Interior and exterior wall painting.' },
    { name: 'Gardening', description: 'Lawn mowing, pruning, and landscaping.' },
    { name: 'Roofing', description: 'Install, repair, and maintain roof systems' },
  ];

  try {
    await db.insert(services).values(serviceList).onConflictDoNothing();
    console.log('Seeding complete')
  } catch (error) {
    console.log('Error while seeding: ', error);
  }

};

main();