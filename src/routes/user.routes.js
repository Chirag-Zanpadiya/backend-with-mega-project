import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlerwares.js";
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

export default router;
