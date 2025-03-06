import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  //TODO:step1:get user details from fronted
  //   req.body hame direct json deta lene ke liye help karta hai
  //   forn se data ya json data lena ho toh req.body
  const { fullName, username, email, password } = req.body;

  // console.log(`Res.body \n`);
  // console.log(req.body);

  //   jab ap below script ko postmanapi >body>row insert karke dekho terminal me
  // {
  //     "fullName":"Chirag bhila Zanpadiya",
  //     "email":"chirag@gmail.com",
  //     "username":"chirag0405",
  //     "password":"chirag@0405"
  // }
  //   console.log(`email :  ${email}`);
  //   console.log(`fullName :  ${fullName}`);
  //   console.log(`username :  ${username}`);
  //   console.log(`password :  ${password}`);

  //TODO: step2: validation of the  user details -not empty
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Field Are Required");
  }

  // email me check karu ki "@" hai ya nahi
  if (!email.includes("@")) {
    throw new ApiError(400, "Email is invalid please check again");
  }

  //TODO: step3: check user is already exist : check for this [username , email]

  // ye method jab user registration karge tab find karega ki
  // agr koi bhi user same username aur email se regitration kar raha hai
  // toh return true kardega
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "Username or email already exists");
  }

  // console.log(`existedUser \n`);
  // console.log(existedUser);

  //TODO: step4: check for images ,check for the avatar
  // multer hame req.files ka access deta hai
  // multer ne jo local public?temp file store kiya hai useka path mul jayega
  // req.files?. -->(matlab user ne file upload nahi ki)
  // req.files?.avatar[0]?. -->(matlab multer ne localserver per store kar diya hai na )

  const avatarLocalPath = req.files?.avatar[0]?.path;

  // console.log(`avatarLocalPath \n`);
  // console.log(avatarLocalPath);

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // console.log(`coverImageLocalPath \n`);
  // console.log(coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar File is required");
  }

  //TODO: step5: upload them to cloudinary , check avatar

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  // console.log(`avatar clodinary \n`);
  // console.log(avatar);

  const converImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Not able to upload your avatar");
  }

  //TODO: step6:create user object -create entry for in DB
  // DB se jab bhi bat karoge toh try-catch ka dyan rakho aur  async and await lagao
  const user = await User.create({
    fullName,
    // yaha sirt hame url chahiye kyu uploadonclodinary toh pura response return karta hai
    avatar: avatar.url,
    coverImage: converImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  //TODO: step7:response me ham password and refreshToken field
  // yaha agar user succesfully created hogaya toh use user._id wala
  // user already hoga  usse hame pata chal jayega ki user succufully DB me insert ho gaya ya nahi
  // select ka use karke hame password and refreshToken nahi milege
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  //TODO: step8:check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  //TODO: step9:response return

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Regitration Successfully"));
});

export { registerUser };
