import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { ENV } from "../config/env"
import * as schema from "./schemas"

const pool = new Pool({
  connectionString: ENV.DB_URL
});

//test connection
export async function testConenction() {
  try {
    const client = await pool.connect();
    console.log("Database connected");
    client.release();
  } catch (error) {
    console.log("Error connecting database: ", error)
  }

}


export const db = drizzle(pool, { schema });