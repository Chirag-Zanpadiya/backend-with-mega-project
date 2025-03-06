import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, //Haan, lowercase Mongoose ki built-in functionality hai.
      // 👉 Jab tum lowercase: true set karte ho, toh Mongoose automatically username ko lowercase me convert karta hai jab data database me save hota hai.
      trim: true,
      index: true, //TODO: yaha pe mene username field ko searchable bana diya optimize tarikesh
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, //TODO: yaha pe third party ka service coudnary use karege tab waha we ek url mil jaye jisko ham use karege
      required: true,
    },
    coverImage: {
      type: String, //TODO: yaha pe third party ka service coudnary use karege tab waha we ek url mil jaye jisko ham use karege
    },
    watchHistory: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    password: {
      type: String, //TODO: jab bhi ap DB me store karoge tab ap encrpt kar ke store karege
      // TODO: but ek problem hai hai user ne jo password insert kiya hai aur DB me encrpt password hai dono ko compare kaise karego
      required: [true, "Password Is Required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// TODO: mongo DB ka hook hai basically use hota hai
// DB data store ho usse just pehle kuch kardo
// this ka access chahiye isliye funciton likha
// yaha encrption wala kam ho raha hai is liye  async liya
// middler wate hai toh next ka access toh lena padega

userSchema.pre("save", async function (next) {
  // Agar passworn modified nahi huva hai toh toh next flag pass kardo
  if (!this.isModified("password")) return next();

  // agar password modified huva hia
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// cmp between user password == DB encrypt password
// yaha ham hamari custom mehtod ko likh sakate hai
userSchema.methods.isPasswordCorrect = async function (password) {
  // this.password DB me encryption wala password hai
  // commputaion hai isliye await karana padega
  // true false dega
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    // jab method ko call hoga toh token ye data store karega
    {
      // this._id mongoDB wali ID
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    // jab method ko call hoga toh token ye data store karega
    {
      // this._id mongoDB wali ID
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);

// TODO:
// ✅ JWT Ka Kaam Kaise Hota Hai?
// 1️⃣ User Login Karega → Jab user email/password daal kar login karega, to server JWT token generate karega.
// 2️⃣ JWT Token User Ko Milega → Ye token user ke browser me store ho sakta hai (LocalStorage / Cookies).
// 3️⃣ User Jab Request Karega → User JWT token ke saath API request bhejega.
// 4️⃣ Server JWT Verify Karega → Agar token valid hai, to DB se data milega. Agar invalid hai, to access deny ho jayega.
