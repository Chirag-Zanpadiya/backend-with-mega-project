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

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // fronted ke form se ye values ayegi
  const { oldPassword, newPassword } = req.body;
  console.log(`User At change password req.body`);
  console.log(req.body);
  console.log(`User At change password old password`);
  console.log(req.body.oldPassword);
  console.log(`User At change password new password`);
  console.log(req.body.newPassword);
  
  // route se karte time age verifyJWT ka middlerware insert kar duga
  // waha req.user ka acceess mil jayega
  const user = await User.findById(req.user?._id);
  console.log(`User At change password`);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  console.log("user.password is : ");
  
  console.log(user.password);
  

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(
      400,
      "user.cotroller.js :: changeCurrentPassword :: error(!passwordnotmathc) :: passwordnotmathc"
    );
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "user.cotroller.js  :: changeCurrentPassword :: Password change successfully"
      )
    );
});

// agar user loged hai toh duga currrent user
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        await User.findById(req.user?._id).select("-password -refreshToken")
      )
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName } = req.body;

  if (!fullName) {
    throw new ApiError(
      400,
      "user.cotroller.js :: updateAccountDetails :: error(!updateAccountDetails) :: fullName is required"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "user.cotroller.js :: updateAccountDetails :: Success :: Details Updates successfully"
      )
    );
});

// two middlerware : auth.middlerware.js && multer.middlerware.js
// "user.cotroller.js :: updateAccountDetails :: error(!updateAccountDetails) :: fullName is required"
//
const updateUserAvatar = asyncHandler(async (req, res) => {
  // multer ke through local file se path le liya hai
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(
      400,
      "user.cotroller.js :: updataUserAvatar :: error(!avatarLocalPath) :: Avatar is required"
    );
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(
      400,
      "user.cotroller.js :: updataUserAvatar :: error(!avatar.url) :: Avatar cannot upload on cloudinary"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "user.cotroller.js :: updataUserAvatar :: success :: avatar updated successfully"
      )
    );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // multer ke through local file se path le liya hai
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(
      400,
      "user.cotroller.js :: coverImageLocalPath :: error(!coverImageLocalPath) :: coverImageLocalPath is required"
    );
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(
      400,
      "user.cotroller.js :: updataUsercoverImage :: error(!coverImage.url) :: coverImage cannot upload on cloudinary"
    );
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        "user.cotroller.js :: updataUsercoverImage :: success :: coverImage updated successfully"
      )
    );
});

// ye fns basically jab ap iski profile per jao ge toh pura profile like YT(youtube) jaise

const getUserChannelProfile = asyncHandler(async (req, res) => {
  // link ke through jo username ayega wo me extract kar duga

  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(
      400,

      "user.cotroller.js :: getUserChannelProfile :: error(!username) :: This username dose not exists"
    );
  }

  const channel = await User.aggregate([
    // first of given  username ka document layege

    {
      $match: {
        username: username?.toLowerCase(),
      },
    },

    // this lookup for : kis user ne hamari channel ko subscribe kiya hai

    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },

    // hame kis kis channel ko subscribe kiya hai
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },

    // User model kuch new fields add kar ne ke liye

    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },

        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },

        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },

    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(
      404,
      "user.cotroller.js :: getUserChannelProfile :: error(!!channel?.length) :: !channel?.length"
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      channel[0],

      "user.cotroller.js :: getUserChannelProfile :: Success :: Channer fetche Succesfully"
    )
  );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
