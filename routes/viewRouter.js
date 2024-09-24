const express = require("express");
const { getOverview, getTour, getLoginForm, getAccount, updateUserData, getSignup } = require("../controllers/viewsController");
const { isLoggedIn } = require("../controllers/AuthController");
 const { protect } = require("../controllers/AuthController");

const router = express.Router();

router.use(isLoggedIn);

router.get("/", isLoggedIn,getOverview);

router.get("/tour/:tourName", isLoggedIn,getTour);

router.get("/login",isLoggedIn,getLoginForm);

router.get('/me',protect,getAccount);

router.post('/sumbit-user-data',protect,updateUserData);

router.get('/signup',getSignup);

module.exports = router;
