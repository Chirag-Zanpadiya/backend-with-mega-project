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
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
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
      // yaha jab user is method  ko call karega ga toh isse pehle DB data store hoga this : curr user ka toh this._id se wo id le le aur _id me store kara dege
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

// TODO:Agar tum directly "123456" password ko database me store karoge, toh hacker agar database le gaya toh sab users ke passwords leak ho jayenge 😬
// ✅ Solution:
// Use bcrypt to hash the password:

//TODO:
// 🪪 2. jsonwebtoken (JWT) — Login ke Baad Auth Token Dene ke Liye
// ❓ Problem:
// User login ho gaya, ab har baar jab wo dashboard, profile, apply internship wale page pe jaye, toh backend ko kaise pata chale ki yeh Chirag hi hai?

// ✅ Solution:
// Login ke time ek JWT token generate karo:

// js
// Copy
// Edit
// const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
// Ab tum yeh token frontend ko bhej do, aur frontend har future request me yeh bhejta hai:

// http
// Copy
// Edit
// GET /api/profile
// Authorization: Bearer <JWT_TOKEN>
// Backend JWT ko verify karta hai:

// js
// Copy
// Edit
// const decoded = jwt.verify(token, process.env.JWT_SECRET);
// Agar token valid hai → Chirag ko access de do ✅
// Invalid/expire ho gaya → Error de do 🔒

// TODO:


// 1. User Login Flow:
//    - User enters email/password.
//    - Backend validates the credentials using bcrypt.
//    - Backend generates an Access Token (valid for 15 min) and a Refresh Token (valid for 7 days).
//    - Both tokens are sent to the frontend.

// 2. Access Token in Cookies:
//    - The Access Token is set in the cookie by the backend: 
//      `Set-Cookie: accessToken=ey123...; HttpOnly; Secure; SameSite=Strict`.
//    - The token is safely stored in the browser.

// 3. Accessing Protected Route (e.g., Dashboard):
//    - When the user accesses the dashboard, the browser automatically sends the Access Token via cookies.
//    - Backend decodes the Access Token to authenticate the user.

// 4. After 15 Minutes (Token Expiry):
//    - Access Token expires, and the user is denied access to the protected route.
//    - A request for the expired token is made.

// 5. Refresh Token for New Access Token:
//    - Browser sends a request with the Refresh Token:
//      `POST /refresh { refreshToken: "xyz456..." }`.
  //  - Backend verifies the Refresh Token and issues a new Access Token (without needing the user to log in again).







// TODO:
// ✅ JWT Ka Kaam Kaise Hota Hai?
// 1️⃣ User Login Karega → Jab user email/password daal kar login karega, to server JWT token generate karega.
// 2️⃣ JWT Token User Ko Milega → Ye token user ke browser me store ho sakta hai (LocalStorage / Cookies).
// 3️⃣ User Jab Request Karega → User JWT token ke saath API request bhejega.
// 4️⃣ Server JWT Verify Karega → Agar token valid hai, to DB se data milega. Agar invalid hai, to access deny ho jayega.
