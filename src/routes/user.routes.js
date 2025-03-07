import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlerwares.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/register").post(
  // yaha hamane jab bhi registerUser method call kiya usse pehle just hamane uload(multur) insert kar diya hai
  upload.fields([
    {
      // jab ap fronted me input le toh uska name bhi "avatar" hona chahiye
      name: "avatar",
      maxCount: 1, // kinte ni max file upload karna chahata hu
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]), // multer ka fiels basically arr of obj
  registerUser
);

router.route("/login").post(loginUser);


// secured routes
router.route("/logout").post(verifyJWT,logoutUser);

router.route("/refresh-token").post(refreshAccessToken);
export default router;
