const express = require("express");
const {
  getAlltours,
  getTour,
  updateTour,
  createTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  uploadTourImages,
  resizeTourImages,
} = require("../controllers/tourController");
const { protect, restrictTo } = require("../controllers/AuthController");
const reviewRouter = require("./reviewRouter");
const tourRouter = express.Router();
//specify functionally to a certain paramter in url

// tourRouter.param("id", checkId);

tourRouter.route("/top-5-cheap").get(aliasTopTours, getAlltours);

tourRouter
  .route("/")
  .get(getAlltours)
  .post(protect, restrictTo("admin", "lead-guide"), createTour);

tourRouter.route("/tour-stats").get(getTourStats);
tourRouter
  .route("/monthly-plan/:year")
  .get(protect, restrictTo("admin", "lead-guide", "guide"), getMonthlyPlan);
//checkBody is a function that can modify the incoming request data
//checkBody will done first in post

tourRouter
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(protect, getToursWithin);
tourRouter.route("/distances/:latlng/unit/:unit").get(protect, getDistances);
tourRouter.use("/:tourId/reviews", reviewRouter);

tourRouter
  .route("/:id")
  .get(getTour)
  .patch(
    protect,
    restrictTo("admin", "lead-guide"),
    uploadTourImages,
    resizeTourImages,
    updateTour,
  )
  .delete(protect, restrictTo("admin", "lead-guide"), deleteTour);

module.exports = tourRouter;
