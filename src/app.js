import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

// cors allow to handle request of the frontend with diff origiot
// By default, web browsers restrict cross-origin HTTP requests due to security reasons.
// If your frontend (React, Vue, etc.) runs on a different domain (e.g., http://localhost:3000) than your backend (e.g., http://localhost:5000), the browser blocks requests due to Same-Origin Policy.
// cors middleware allows requests from different origins to be accepted by the backend.
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    
  })
);

// : This middleware allows your Express app to parse JSON data sent in HTTP requests (e.g., in POST and PUT requests).
// hen a frontend sends JSON data to the backend (e.g., { "name": "Chirag" }), Express doesn't understand it by default.
// Protects against denial-of-service (DoS) attacks where attackers send large payloads to crash the server.
app.use(express.json({ limit: "32kb" }));

// This middleware allows your Express app to parse URL-encoded form data (e.g., from HTML forms).
// When a form is submitted with application/x-www-form-urlencoded data (e.g., name=Chirag&age=22), Express needs to extract the values from the request body.
// This middleware helps convert form data into a JavaScript object.
app.use(express.urlencoded({ extended: true, limit: "32kb" }));



// Purpose: This serves static files like images, CSS, JavaScript, PDFs, etc.
// If your frontend needs images or CSS files stored in your backend, this middleware helps serve those files.
// For example, if there is a file public/logo.png, you can access it at http://localhost:5000/logo.png.
app.use(express.static("public"));


// Purpose: This middleware parses cookies from incoming requests.
// When users log in, authentication tokens (JWT, session IDs) are often stored in cookies.
// cookieParser() allows Express to read and manipulate those cookies.
// Example: If a request has Cookie: sessionId=abc123, this middleware makes it available in req.cookies.sessionId.
app.use(cookieParser());


// Routes

import userRouter from './routes/user.routes.js'

// yaha controllers and routes alag hai isliye middlerware ka use hoga

// Routes declaration
app.use("/api/v1/users",userRouter)



// http://localhost:8000/api/v1/users/register




export { app };
