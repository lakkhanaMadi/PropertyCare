import express from "express";
import { ENV } from "./config/env";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";

const app = express()

app.use(cors({origin:ENV.FRONTEND_URL}));
app.use(clerkMiddleware()); //auth obj will be attached to the req
app.use(express.json()); //parses JSON request bodies 
app.use(express.urlencoded({ extended: true })); //parses form data

app.get("/", (req, res) => {
  res.json({ success: true })
});


app.listen(ENV.PORT, () => {
  console.log("Server is running on PORT: ", ENV.PORT)
})