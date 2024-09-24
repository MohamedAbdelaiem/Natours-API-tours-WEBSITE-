const express = require("express");
const {
  signup,
  login,
  resetPassword,
  forgotPassword,
  updatePassword,
  protect,
  deleteMe,
  restrictTo,
  logOut,
} = require("../controllers/AuthController");
const {
  getAllUsers,
  createUser,
  getUser,
  deleteUser,
  updateMe,
  getMe,
  updateUser,
  uploadUserPhoto,
  resizeUserPhoto,
} = require("../controllers/userController");


//save the images to the destinitation



const userRouter = express.Router();

userRouter.post("/signup", signup);

userRouter.post("/login", login);

userRouter.get("/logout",logOut);

userRouter.post("/forgotPassword", forgotPassword);

userRouter.patch("/resetPassword/:token", resetPassword);

userRouter.use(protect);

userRouter.patch("/updatePassword", updatePassword);

userRouter.get("/me", getMe, getUser);

userRouter.patch("/updateMe",uploadUserPhoto,resizeUserPhoto ,updateMe);

userRouter.delete("/deleteMe", deleteMe);

userRouter.use(restrictTo('admin'));

userRouter.route("/").get(getAllUsers).post(createUser);

userRouter.route("/:id").get(getUser).patch(updateUser).delete(deleteUser);


module.exports = userRouter;
