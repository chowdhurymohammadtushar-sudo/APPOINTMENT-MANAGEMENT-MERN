import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "../config/db.js";
import User from "../models/User.js";

try {
  await connectDB();
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const existing = await User.findOne({ email });

  if (existing) {
    console.log(`Admin already exists: ${email}`);
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || "System Admin",
      email,
      password: process.env.ADMIN_PASSWORD || "Admin123!",
      role: "admin",
    });
    console.log(`Admin created: ${email}`);
  }
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
