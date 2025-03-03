//  ye bhi syntax sahi hai lekin requier import se sath jam nahi raha hai  // require('dotenv').config({path :'./env'});

import mongoose from "mongoose";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

import { app } from "./app.js";
// iffi fns
// DB se jab bhi bat karo tab try-catch lagao

// yaha pe main jo hame .require aur import me conflict na ho isliye package.json me -r wali scrpit add kar di
dotenv.config({
  path: "./env",
});

// connectDB wala fns execute kara diya hai
connectDB()
  .then(() => {
    app.get("/", (req, res) => {
      res.send("hii i am chirag");
    });

    app.on("error", (error) => {
      console.log(`Application Errors :  ${error}`);
      //   throw error
      process.exit(1);
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(
        `SERVER IS RUNNING AT PORTNUMBER : http://localhost:${process.env.PORT}`
      );
    });
  })
  .catch((err) => {
    console.log(`MONGODB CONNECTION FAILED :: src/index.js :: ${err}`);
  });

// TODO: first approach

// const app = express();
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

//     app.on("error", (error) => {
//       console.log("ERROR : ", error);
//       throw error;
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`Server is running on port http://localhost:${process.env.PORT}`);
//     });

//   } catch (error) {
//     console.error("ERROR: ", error);
//     throw err;
//   }
// })();
