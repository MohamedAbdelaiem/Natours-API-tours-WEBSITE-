const mongoose = require("mongoose");
const validator = require("validator");
const slugify = require("slugify");
// const User = require("./userModel");

const tours_schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"], //second one is the erroe message
      unique: true,
      trim: true /*only for strings remove all white spaces in front and end*/,
      maxlength: [40, "A tour name must be less than or equal 40 characters"],
      minlength: [10, "A tour name must be more than or equal 10 characters"],
      validate: {
        validator: function (val) {
          return validator.isAlpha(val.split(" ").join(""));
        },
        message: "Tour name must only contain characters",
      },
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      //enum only for numbers
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either: easy, medium, difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0"],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //this only points to current doc on NEW document creation
          return val < this.price;
        },
        message: "Discount price ({VALUE}) should be below the regular price",
      },
    },
    summary: {
      type: String,
      trim: true /*only for strings remove all white spaces in front and end*/,
      required: [true, "A tour must have a Summary"],
    },
    description: {
      type: String,
      trim: true /*only for strings remove all white spaces in front and end*/,
    },
    imageCover: {
      type: String /*the name of the image*/,
      required: [true, "A tour must have a cover image"],
    },
    images: [String] /*array of strings  */,
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    slug: String,
    startDates: [Date] /*array of dates */,
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number], //array of numbers thatit's coordinates -->(lattitud,langitude)
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number], //array of numbers thatit's coordinates -->(lattitud,langitude)
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User", //refer to the user model
      },
    ],
  },
  {
    toJSON: { virtuals: true } /*virtual always appeaer */,
    toObject: { virtuals: true } /*virtual always appeaer */,
  },
);

tours_schema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

tours_schema.index({ price: 1, ratingsAverage: -1 });
tours_schema.index({ ratingsAverage: -1 });
tours_schema.index({ slug: 1 });
tours_schema.index({ startLocation: "2dsphere" });

tours_schema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "tour",
});
//we cant use virtual property in the query

//Document Middleware runs befor .save() , .create() but not insertMany()
tours_schema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next(); //to move to the next middleware
});

//embeding users in tour

//  tours_schema.pre('save',async function(next){
//   const guidesPromises=this.guides.map(async id=>await User.findById(id));
//   this.guides=await Promise.all(guidesPromises);
//   next();
// })

//queryMiddleWare
tours_schema.pre(/^find/, function (next) {
  //all commands starts with find
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tours_schema.pre(/^find/, function (next) {
  this.populate({
    path: "guides",
    select: "-__v -passwordChangedAt",
  });
  next();
});



//Aggregation Middleware

tours_schema.pre('aggregate', function(next) {
  const aggregationExcludeSecretTour = {
    $match: { secretTour: { $ne: true } }
  };
  this.pipeline().unshift(aggregationExcludeSecretTour);
 
  const geoNearOpt = this.pipeline().find(el => el.$geoNear);
 
  if (geoNearOpt) {
    const index = this.pipeline().findIndex(el => el.$geoNear);
    this.pipeline().splice(index, 1);
    this.pipeline().unshift(geoNearOpt);
  }
  // console.log('💰', this.pipeline());
  next();
});

const Tour = mongoose.model("Tour", tours_schema); //(the name of the model,the schema)

module.exports = Tour;
