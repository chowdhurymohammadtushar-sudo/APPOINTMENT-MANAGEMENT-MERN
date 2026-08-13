import express from "express";

import {
  createReview,
  getDoctorReviews,
} from "../controllers/reviewController.js";

import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

/*
  Patient creates review
*/
router.post(
  "/",
  protect,
  authorize("patient"),
  createReview
);

/*
  Anyone logged in can see doctor reviews
*/
router.get(
  "/doctor/:doctorId",
  protect,
  getDoctorReviews
);

export default router;