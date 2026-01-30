import express from "express";
import { ENV } from "./config/env";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import { testConenction } from "./db/index";
import cors from "cors";

//routes
import authRoutes from "./routes/authRoutes";

const app = express()

app.use(cors({ origin: ENV.FRONTEND_URL }));
app.use(clerkMiddleware()); //auth obj will be attached to the req
app.use(express.json()); //parses JSON request bodies 
app.use(express.urlencoded({ extended: true })); //parses form data

app.get("/", (req, res) => {
  res.json({ success: true })
});

// routes
app.use("/api/user", authRoutes);


//test connection and start
async function startServer() {
  await testConenction();
  app.listen(ENV.PORT, () => {
    console.log("Server is running on PORT: ", ENV.PORT)
  })
}

startServer();

