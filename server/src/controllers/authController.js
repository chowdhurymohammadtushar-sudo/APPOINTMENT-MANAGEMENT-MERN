import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Doctor from "../models/DoctorProfile.js";

/* TOKEN */
const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );

/* CLEAN USER RESPONSE */
const sendUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
});

/* REGISTER */
export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      specialization,
      qualification,
      experienceYears,
      licenseNumber,
      hospitalName,
      consultationFee,
    } = req.body;

    /* BASIC VALIDATION */
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    /* DOCTOR VALIDATION */
    if (role === "doctor") {
      if (!specialization || !qualification || !licenseNumber) {
        return res.status(400).json({
          success: false,
          message:
            "Specialization, qualification and license number are required for doctor registration",
        });
      }

      if (
        experienceYears !== undefined &&
        experienceYears !== "" &&
        Number(experienceYears) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Experience years cannot be negative",
        });
      }

      if (
        consultationFee !== undefined &&
        consultationFee !== "" &&
        Number(consultationFee) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Consultation fee cannot be negative",
        });
      }
    }

    /* CHECK EXISTING USER */
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    /* CREATE USER */
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone || "",
      password,
      role: role || "patient",
    });

    /* CREATE DOCTOR PROFILE */
    if (role === "doctor") {
      await Doctor.create({
        user: user._id,

        specialization: specialization.trim(),

        qualification: qualification.trim(),

        experienceYears:
          experienceYears !== undefined && experienceYears !== ""
            ? Number(experienceYears)
            : 0,

        licenseNumber: licenseNumber.trim(),

        hospitalName: hospitalName
          ? hospitalName.trim()
          : "",

        consultationFee:
          consultationFee !== undefined && consultationFee !== ""
            ? Number(consultationFee)
            : 0,

        approvalStatus: "pending",
      });
    }

    /* RESPONSE */
    res.status(201).json({
      success: true,
      message:
        role === "doctor"
          ? "Doctor registration submitted for approval"
          : "Registration successful",

      token: signToken(user),

      user: sendUser(user),
    });
  } catch (err) {
    console.error("Registration error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* LOGIN */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive",
      });
    }

    res.json({
      success: true,
      token: signToken(user),
      user: sendUser(user),
    });
  } catch (err) {
    console.error("Login error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* GET ME */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user: sendUser(user),
    });
  } catch (err) {
    console.error("Get me error:", err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};