import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    // generating and access and refresh token for the given userid
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // yaha mene user model ke refreshtoken wali fiend generate refreshtoekn insert kar diya hai
    user.refreshToken = refreshToken;

    // bu user ka DATA save bhi karana hai

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access ans refresh token"
    );
  }
};

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

const loginUser = asyncHandler(async (req, res) => {
  // req.body ->data

  const { email, username, password } = req.body;

  // username or email base login chahte ho ya
  // TODO: yaha pe chahata hu vi agar email aur username dono nahi hai toh error through kardo
  if (!email && !username) {
    throw new ApiError(400, " Username or Email is required");
  }

  // find the user in the DB
  // TODO: yaha pe basically is username or email ka data DB hai toh login kar sakata hai
  //   यह username या email में से कोई भी match होने पर user return कर देगा।
  // अगर कोई भी match नहीं करता तो null return होगा।
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log(`loginuser :: user :- \n`);
  console.log(user);

  if (!user) {
    throw new ApiError(
      404,
      "This is not valid creadential || This Username or email doesnot exists "
    );
  }

  // password check
  const isPasswordValid = await user.isPasswordCorrect(password);
  // agar password match nahi ho raha hai pehle jo DB pe pada that wo
  if (!isPasswordValid) {
    throw new ApiError(
      404,
      "Invalid Credential Plese Check email and password"
    );
  }

  // access and refresh Token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  console.log(`AccessToken ::  \n`);
  console.log(accessToken);

  console.log(`refreshToken :: \n`);
  console.log(refreshToken);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // send the cookie
  //
  const options = {
    httpOnly: true, // ye cookie sirf server se hi modifieable hoti hai
    secure: true,
  };

  // console.log(user.email);
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Loggend In Successfully"
      )
    );

  // response to user login succesfully
});

const logoutUser = asyncHandler(async (req, res) => {
  // clear cookie
  // user toh chahiye cookie clear kar ne ke liye but user lauga kaha se
  // req.body -> yaha toh form ya json data ayega
  // logut karne ke liye me thodi na logout form fill up karaoga user se
  // TODO:logout se pehle ek middlerware execute hova hai
  // Step-by-Step Execution
  // 1️⃣ User /logout request bhejta hai → Server verifyJWT middleware call karta hai.
  // 2️⃣ verifyJWT JWT token verify karta hai:
  // req.cookies.accessToken ya req.header("Authorization") se token extract karta hai.
  // jwt.verify() se token decode karta hai.
  // User ki ID extract karta hai (decodedToken._id).
  // MongoDB se user fetch karta hai aur req.user = user set karta hai.
  // next() call hota hai → logoutUser function execute hota hai.
  // 3️⃣ logoutUser function execute hota hai:
  // Kyunki verifyJWT ne req.user set kar diya tha, ab logoutUser function usko access kar sakta hai.
  // Refresh token ya cookies ko clear karta hai.
  // clear refreshtoken

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout sucess"));
});

// TODO: yaha pe ham endpoint set karege kyu ki bar bar login karna sahi nahi hai
// TODO:Endpoint ke liye  following step
// see notes in access and refreshtoken
const refreshAccessToken = asyncHandler(async (req, res) => {
  // cookie se hame wo refreshtoken lena padega

  // ye incomingRefreshToken basically jo user ke pass hai wo hai
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(
      401,
      "user.cotroller.js :: refreshAccessToken :: error(!incomingRefreshToken) :: Not Have incomingRefreshToken "
    );
  }

  try {
    // ab yaha pe verify karo ki userwali refreshtoken aur DB store refreshtoken same hai ya nahi
    // incomingRefreshToken wo jwt.verify karega ga agar valid hai toh usma playload ka data de dega
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(
        401,
        "user.cotroller.js :: refreshAccessToken :: error(!user) :: Not Have user "
      );
    }

    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(
        401,
        "user.cotroller.js :: refreshAccessToken :: error(user.refreshToken != incomingRefreshToken) :: Token dose not match"
      );
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    // yaha tak agaye matlab ki user ka sabhi validation ho gaya
    // ab sirt new refretone aur generate kar ne hai

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "user.cotroller.js :: refreshAccessToken :: Success :: Both Token New Generated"
        )
      );
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Refresh Token Expired, Please Login Again");
    }
    throw new ApiError(
      401,
      error?.message ||
        "user.controller.js :: refreshAccessToken :: error :: Catch Block Error"
    );
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
