const express = require("express");
const {
  getAllReviews,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  getReview,
  isOwner,
} = require("../controllers/reviewController");

const { protect, restrictTo } = require("../controllers/AuthController");

const reviewRouter = express.Router({
  mergeParams: true, //access the params of the router that called it
});

reviewRouter
  .route("/")
  .get(getAllReviews)
  .post(protect, restrictTo("user"), setTourUserIds, createReview);

reviewRouter
  .route("/:id")
  .delete(restrictTo("admin", "user"),isOwner,deleteReview)
  .patch(restrictTo("admin", "user"), isOwner, updateReview)
  .get(getReview);

module.exports = reviewRouter;
