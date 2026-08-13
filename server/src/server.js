import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";

const createAdmin = async () => {
  try {
    const adminName = process.env.ADMIN_NAME?.trim();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Check admin credentials
    if (!adminName || !adminEmail || !adminPassword) {
      console.log("Admin credentials are missing from .env");
      return;
    }

    if (adminPassword.length < 6) {
      console.log("Admin password must be at least 6 characters long");
      return;
    }

    // Find admin by email
    let admin = await User.findOne({
      email: adminEmail,
    }).select("+password");

    // Create admin if not exists
    if (!admin) {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        isActive: true,
      });

      console.log(`Admin created successfully: ${adminEmail}`);
      return;
    }

    // Existing user found
    let changed = false;

    if (admin.role !== "admin") {
      admin.role = "admin";
      changed = true;
    }

    if (!admin.isActive) {
      admin.isActive = true;
      changed = true;
    }

    if (changed) {
      await admin.save();
      console.log(`Admin account updated: ${adminEmail}`);
    } else {
      console.log(`Admin already exists: ${adminEmail}`);
    }
  } catch (error) {
    console.error("Admin creation error:", error.message);
  }
};

const start = async () => {
  try {
    // Connect MongoDB
    await connectDB();

    console.log("MongoDB connected");

    // Create/check admin
    await createAdmin();

    // Start server
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup error:", error.message);
    process.exit(1);
  }
};

start();