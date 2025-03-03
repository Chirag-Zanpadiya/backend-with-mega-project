class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something Went Wrong 404 Page Not Found",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode  ;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}


export {ApiError}




// Here's the complete documentation for the ApiError class, including all properties and their usage.

// 📌 ApiError Class Documentation
// 🔹 Overview
// The ApiError class is a custom error handler that extends JavaScript's built-in Error class. It helps in creating structured error responses for APIs.

// 🔹 Class Definition
// js
// Copy
// Edit
// class ApiError extends Error {
//   constructor(
//     statusCode,
//     message = "Something Went Wrong 404 Page Not Found",
//     errors = [],
//     stack = ""
//   ) {
//     super(message);
//     this.statusCode = statusCode;
//     this.data = null;  // Currently unused, but can store additional error-related info
//     this.message = message;
//     this.success = false;  // Always false since this is an error
//     this.errors = errors;  // Array of additional error details

//     if (stack) {
//       this.stack = stack;  // Custom stack trace if provided
//     } else {
//       Error.captureStackTrace(this, this.constructor);
//     }
//   }
// }
// 📌 Properties Explanation
// Property	Type	Default Value	Description
// statusCode	number	Required	The HTTP status code for the error (e.g., 400, 404, 500).
// message	string	"Something Went Wrong 404 Page Not Found"	A user-friendly error message.
// data	any	null	Reserved for additional debugging data (not used by default).
// success	boolean	false	Always false since this is an error. Helps frontend handle responses easily.
// errors	array	[]	Stores additional error details (e.g., validation errors).
// stack	string	Auto-generated	The error stack trace, useful for debugging.
// ✅ Example Usage
// 1️⃣ Basic Example
// js
// Copy
// Edit
// throw new ApiError(404, "User not found");
// Response:

// json
// Copy
// Edit
// {
//   "success": false,
//   "statusCode": 404,
//   "message": "User not found",
//   "data": null,
//   "errors": []
// }
// 2️⃣ Example with Additional Error Details
// js
// Copy
// Edit
// throw new ApiError(400, "Validation failed", [
//   { field: "email", message: "Invalid email format" }
// ]);
// Response:

// json
// Copy
// Edit
// {
//   "success": false,
//   "statusCode": 400,
//   "message": "Validation failed",
//   "data": null,
//   "errors": [
//     {
//       "field": "email",
//       "message": "Invalid email format"
//     }
//   ]
// }
// 3️⃣ Example with Debugging Data (data field)
// If you want to include extra data in the response:

// js
// Copy
// Edit
// throw new ApiError(500, "Database connection failed", [], { dbStatus: "down" });
// Response:

// json
// Copy
// Edit
// {
//   "success": false,
//   "statusCode": 500,
//   "message": "Database connection failed",
//   "data": {
//     "dbStatus": "down"
//   },
//   "errors": []
// }
// 📌 How to Use ApiError in an Express Middleware?
// You can create an error-handling middleware to send structured responses using ApiError.

// js
// Copy
// Edit
// const errorHandler = (err, req, res, next) => {
//   if (err instanceof ApiError) {
//     return res.status(err.statusCode).json({
//       success: false,
//       message: err.message,
//       statusCode: err.statusCode,
//       data: err.data,
//       errors: err.errors,
//     });
//   }

//   // Default error response for unexpected errors
//   return res.status(500).json({
//     success: false,
//     message: "Internal Server Error",
//     statusCode: 500,
//   });
// };

// export { errorHandler };
// Use it in your Express app:

// js
// Copy
// Edit
// import express from "express";
// import { errorHandler } from "./middlewares/errorHandler.js";

// const app = express();

// // Define your routes here...

// // Use error handling middleware
// app.use(errorHandler);
// 🚀 Why Use ApiError?
// ✅ Standardized API error responses
// ✅ Easier frontend error handling (success: false)
// ✅ Supports validation errors with errors array
// ✅ Includes debugging data when needed (data field)
// ✅ Stack trace helps during development

// Would you like me to add anything else? 😊