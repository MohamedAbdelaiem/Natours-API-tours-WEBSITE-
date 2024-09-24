const User = require("../models/userModel");
const sharp = require("sharp");
const multer = require("multer");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const cron = require("node-cron");
const { updateOne, getOne, getAll } = require("./handleFactory");
const { deleteOne } = require("./handleFactory");

// const multerStorage=multer.diskStorage({
//   destination:(req,file,cb)=>{
//     cb(null,'public/img/users');
//   },
//   filename:(req,file,cb)=>{
//     const ext=file.mimetype.split('/')[1];
//     cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

const multerStorage = multer.memoryStorage(); //the image will be stored in the memory

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image! Please upload only images.", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
exports.uploadUserPhoto = upload.single("photo");

exports.resizeUserPhoto = catchAsync(async(req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});

exports.updateMe = catchAsync(async (req, res, next) => {
  //1)create error if user Post password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates.Please use /updateMyPassword",
        400,
      ),
    );
  }

  //2)update user document
  if (req.body.name) {
    req.user.name = req.body.name;
  }
  if (req.body.email) {
    req.user.email = req.body.email;
  }
  if (req.file) {
    req.user.photo = req.file.filename;
  }
  await req.user.save({
    validateModifiedOnly: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

deleteInactiveAccounts = catchAsync(async () => {
  const userss = await User.find({ active: false });
  for (let i = 0; i < userss.length; i++) {
    console.log(
      userss[i].noneAcivatedAt.getTime() + 10 * 24 * 60 * 60 * 1000,
      new Date().getTime(),
    );
    if (userss[i].noneAcivatedAt.getTime() + 60 * 1000 < new Date().getTime()) {
      await User.findByIdAndDelete(userss[i]._id);
    }
  }
});

//Runs every day at 12:00 AM

cron.schedule("0 0 * * *", deleteInactiveAccounts);

exports.createUser = (req, res) => {
  res.status(500).json({
    status: "error",
    message: "This route is not defined! Please use /signup instead",
  });
};

//Don't update passwords by this

exports.updateUser = updateOne(User);

exports.getUser = getOne(User);

exports.getAllUsers = getAll(User);

exports.deleteUser = deleteOne(User);
