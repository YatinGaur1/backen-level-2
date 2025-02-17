import { Router } from "express";
import {
  loginUser,
  loggedOutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();
router.route("/register").post(
  upload.fields(
    //inject middleware
    [
      {
        name: "avatar",
        maxCount: 1, //how many file you want like image file etc
      },
      {
        name: "coverImage",
        maxCount: 1,
      },
    ]
  ),
  registerUser
);
//secure routes
router.route("/logIn").post(loginUser);
router.route("/logOut").post(verifyJWT, loggedOutUser);
router.route("/session-continue").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/update-coverImage")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);//here we have to give actual username in the search box without colon
router.route("/history").get(verifyJWT, getWatchHistory);

export default router;
