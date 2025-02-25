
//  ye bhi syntax sahi hai lekin requier import se sath jam nahi raha hai  // require('dotenv').config({path :'./env'});

import mongoose from "mongoose";
import connectDB from "./db/index.js";
import dotenv from "dotenv"
// iffi fns
// DB se jab bhi bat karo tab try-catch lagao



// yaha pe main jo hame .require aur import me conflict na ho isliye package.json me -r wali scrpit add kar di
dotenv.config({
    path : './env'
})



// connectDB wala fns execute kara diya hai
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`SERVER IS RUNNING AT PORTNUMBER : ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log(`MONGODB CONNECTION FAILED :: ${err}`);                                                                                                      
    
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
//       console.log(`Server is running on port ${process.env.PORT}`);
//     });

//   } catch (error) {
//     console.error("ERROR: ", error);
//     throw err;
//   }
// })();
