import Review from "../models/Review.js";
import Appointment from "../models/Appointment.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getUserId = (req) => req.user?._id || req.user?.id;

/*
  CREATE REVIEW
  Patient can review only completed appointment
*/
export const createReview = asyncHandler(async (req, res) => {
  const patientId = getUserId(req);

  const {
    appointmentId,
    rating,
    comment = "",
  } = req.body;

  // Required fields
  if (!appointmentId || rating === undefined) {
    return res.status(400).json({
      success: false,
      message: "Appointment and rating are required",
    });
  }

  // Validate rating
  const numericRating = Number(rating);

  if (
    Number.isNaN(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    return res.status(400).json({
      success: false,
      message: "Rating must be between 1 and 5",
    });
  }

  // Find appointment
  const appointment = await Appointment.findById(appointmentId);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Appointment not found",
    });
  }

  // Make sure appointment belongs to logged-in patient
  if (String(appointment.patient) !== String(patientId)) {
    return res.status(403).json({
      success: false,
      message: "You can only review your own appointment",
    });
  }

  // Review only completed appointments
  if (appointment.status !== "completed") {
    return res.status(400).json({
      success: false,
      message: "You can review only completed appointments",
    });
  }

  // Prevent duplicate review
  const existingReview = await Review.findOne({
    appointment: appointmentId,
  });

  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: "You have already reviewed this appointment",
    });
  }

  // Create review
  let review;

  try {
    review = await Review.create({
      doctor: appointment.doctor,
      patient: patientId,
      appointment: appointmentId,
      rating: numericRating,
      comment: String(comment).trim(),
    });
  } catch (err) {
    // MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this appointment",
      });
    }

    throw err;
  }

  // Populate review information
  const populatedReview = await Review.findById(review._id)
    .populate("patient", "name")
    .populate("doctor", "name");

  res.status(201).json({
    success: true,
    message: "Review submitted successfully",
    review: populatedReview,
  });
});

/*
  GET DOCTOR REVIEWS
*/
export const getDoctorReviews = asyncHandler(async (req, res) => {
  const { doctorId } = req.params;

  const reviews = await Review.find({
    doctor: doctorId,
  })
    .populate("patient", "name")
    .sort({ createdAt: -1 });

  const totalReviews = reviews.length;

  const averageRating =
    totalReviews > 0
      ? reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        ) / totalReviews
      : 0;

  res.json({
    success: true,
    totalReviews,
    averageRating: Number(averageRating.toFixed(1)),
    reviews,
  });
});