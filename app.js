const express = require("express");
const fs = require("fs");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const path = require("path");
const cookieParser = require("cookie-parser");
const compression=require('compression');

const tourRouter = require("./routes/tourRouter");
const userRouter = require("./routes/usersRouter");
const reviewRouter = require("./routes/reviewRouter");
const viewRouter = require("./routes/viewRouter");

const app = express();
app.set('view engine','pug');
app.set('views',path.join(__dirname,'views'));
//1)Global middlewares

app.use(express.static(path.join(__dirname,'public')));
app.use(helmet());

// Further HELMET configuration for Security Policy (CSP)
const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://js.stripe.com',
  'https://m.stripe.network',
  'https://*.cloudflare.com'
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/'
];
const connectSrcUrls = [
  'https://unpkg.com',
  'https://tile.openstreetmap.org',
  'https://*.stripe.com',
  'https://bundle.js:*',
  'ws://127.0.0.1:*/'
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];
 
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
      baseUri: ["'self'"],
      fontSrc: ["'self'", ...fontSrcUrls],
      scriptSrc: ["'self'", 'https:', 'http:', 'blob:', ...scriptSrcUrls],
      frameSrc: ["'self'", 'https://js.stripe.com'],
      objectSrc: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:', 'https://m.stripe.network'],
      childSrc: ["'self'", 'blob:'],
      imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
      formAction: ["'self'"],
      connectSrc: [
        "'self'",
        "'unsafe-inline'",
        'data:',
        'blob:',
        ...connectSrcUrls
      ],
      upgradeInsecureRequests: []
    }
  })
);
//development logging

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//limit requests from same api

const limiter = rateLimit({
  max: 70,
  windowMs: 60 * 60 * 1000, //1 hour
  message: "Too many requests from this IP,please try again in an hour",
});

app.use("/api", limiter);

//body parser, reading data from body into req.body

app.use(
  express.json({
    limit: "10kb",
  }),
);

app.use(express.urlencoded({ extended: true, limit: "10kb" }));//parse code comes from form

app.use(cookieParser());
//middleware to parse the body of the request

//Data sanitization aganist NoSQL query injection
app.use(mongoSanitize());

//Data sanitization aganist XSS

app.use(xss());

//Prevent parameter pollution

app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  }),
);

//serving static files


//test middleware

app.use(compression());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//2)Routes

// app.get('/',(req,res)=>{
//   res.status(200).render('base',{
//     tour:"The Park camper"
//   });
// });

// app.get('/overview',(req,res)=>{
//   res.status(200).render('overview',{
//     title:"All tours"
//   });
// });

// app.get('/tour',(req,res)=>{
//   res.status(200).render('tour',{
//     title:"The Forest hiker"
//   });
// });

app.use("/", viewRouter);

app.use("/api/v1/tours", tourRouter); //middleware for specific api
//tourRouter is now the router for this url

app.use("/api/v1/users", userRouter); //middleware for specific api
//userRouter is now the router for this url

app.use("/api/v1/reviews", reviewRouter);
//reviewRouter is now the router for this url

app.all("*", function (req, res, next) {
  // res.status(404).json({
  //   status:"fail",
  //   message:`Can't find ${req.originalUrl} on this server`
  // });
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//ERROR HANDLING MIDDLE WARE
app.use(globalErrorHandler);
module.exports = app;
