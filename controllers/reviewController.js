const Review = require("../models/reviewModel");
// const catchAsync = require("../utils/catchAsync");
// const AppError = require("../utils/appError");
const factory = require("../controllers/handleFactory");

exports.getAllReviews = factory.getAll(Review);
exports.setTourUserIds = (req, res, next) => {
  //Allow Nested Routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review);

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.isOwner=factory.isOwner(Review,'user');
