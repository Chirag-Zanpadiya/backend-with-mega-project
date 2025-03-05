import { v2 as cloudinary } from "cloudinary";


import fs from "fs";

// yaha pe ham two steps process follow kar rahe hai
// 1 : multur ke throught ham localfile ko sabse pehle server me temporary rakhege
// 2 : cludinary ke thorough ham sever -> cloudinary pe upload kar dege

// yaha pe ham server ka localpath leker clodinary per upload kar dege

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    // agar localfile path hai hi nahi toh return null
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      //resource_type == auto karte hi wo automatically detect kar leta hai ki jpge ke video aur mp3
      resource_type: "auto",
    });
    // yaha tak a gaye matlab file upload succesfully
    console.log(`ek bar response print karao :  ${response}`);
    console.log(`ek bar response ka url  print karao :  ${response.url}`);

    // localfilepath sever se remover kardo
    // syncs fns hai dekho
    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    // remover kardo file from the server
    fs.unlinkSync(localFilePath);

    return null;
  }
};

export { uploadOnCloudinary };
