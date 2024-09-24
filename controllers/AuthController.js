const { promisify } = require("util");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");
const { decrypt } = require("dotenv");
const sendEmail = require("../utils/email");
const { send } = require("process");
const crypto = require("crypto");
const Email = require("./../utils/email");

exports.signup = catchAsync(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  newUser.password = undefined;
  //create token

  const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN, //after a certain time the token will be expired
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
    secure: false,
  };

  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }
  console.log(cookieOptions, process.env.NODE_ENV);
  res.cookie("jwt", token, cookieOptions);
  const url = `${req.protocol}://${req.get("host")}/me`;

  await new Email(newUser, url).sendWelcome();

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1)check email and passwords exist
  if (!email) {
    return next(new AppError("Please provide email", 400));
  }
  if (!password) {
    return next(new AppError("Please provide password", 400));
  }

  //2)check if user exists && password is correct
  const user = await User.findOne({ email })
    .select("+password")
    .select("+active"); //find an property
  //return the document and includes the password
  //if we don't include the password, we can't compare the password
  //we can't use the password in the model because we set select:false

  //if the user doesn't exist, or the password is wrong

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }
  let message;
  console.log(user.active);
  if (user.active == false) {
    user.active = true;
    message = "your account has been activated";
  }

  await user.save({
    validateBeforeSave: false,
  });

  //3)if everything is ok, send token to client
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  res.status(200).json({
    status: "success",
    token,
    message,
  });
});

exports.protect = catchAsync(async function (req, res, next) {
  //1) Get the token and check if it's there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access", 401),
    );
  }

  //2)Validate the token
  const decoded = await new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET, function (err, decoded) {
      if (err) {
        reject(err);
      }
      resolve(decoded);
    });
  });

  //3)Check if the user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        "The user belonging to this token does no longer exist",
        401,
      ),
    );
  }

  //4)Check if the user changed password after the token was issued

  if (currentUser.changePasswordAfter(decoded.iat) == true) {
    return next(
      new AppError("User recently changed password! Please log in again", 401),
    );
  }

  //5)Grant access to the protected route
  req.user = currentUser;
  res.locals.user = currentUser; //->inside every template will put the curent user in locals

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles is an array ['admin','lead-guide']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1)Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address", 404));
  }
  console.log(user);

  //2)Generate the random reset token
  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3)Send it to user's email
  const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/resetPassword/${resetToken}`;

  try {
    await new Email(user, resetURL).sendPasswordReset();
 
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        "There was an error sending the email. Try again later",
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1)get user passes on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2)if token is not expired ,and there is user -->set new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  console.log(user);

  //3)update changedPasswordAt property for the user
  user.passwordChangedAt = Date.now() - 1000;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  //4)log the user in,send JWT
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1)get user from collection
  const user = await User.findById(req.user.id).select("+password");
  //2)check if user password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong", 401));
  }
  //3)if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordChangedAt = new Date();
  await user.save();
  //4)log user in, send JWT
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  res.status(200).json({
    status: "success",
    token,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  if (req.user.active == false) {
    return next(
      new AppError(
        "this account has been already deactivated  and will be deleted after 10 days.",
        400,
      ),
    );
  }
  req.user.active = false;
  req.user.noneAcivatedAt = new Date();
  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
    expiresIn: 0,
  });

  await req.user.save({
    validateBeforeSave: false,
  });

  const message =
    "this account has been deactivated ! it will deleted permanently after 10 days";
  const cookieOptions = {
    expires: new Date(Date.now() + 0),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  res.status(200).json({
    status: "success",
    message,
    token,
  });
});

exports.isLoggedIn = async function (req, res, next) {
  //1) Get the token and check if it's there
  let token;
  if (req.cookies.jwt) {
    try {
      token = req.cookies.jwt;
      //2) Verify the token
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET,
      ).catch(() => false);
      //3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) return next();
      //4) Check if user changed password after the token was issued

      if (currentUser.changePasswordAfter(decoded.iat) == true) {
        return next();
      }

      //There is a logged in user
      res.locals.user = currentUser; //->inside every template will put the curent user in locals
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

exports.logOut = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 500),
    httpOnly: true,
  });
  res.status(200).json({ status: "success" });
};
