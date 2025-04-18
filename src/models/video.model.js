// Real Example:
// Tum ek internship website pe ho — jaise "Internshala", "LinkedIn" ya "LetsIntern".

// Tum page 1 pe ho, toh sirf 10 companies dikh rahi hain:

// less
// Copy code
// Page 1: [Company 1, Company 2, ..., Company 10]
// Phir jab tum "Next Page" ya "Page 2" pe click karte ho:

// less
// Copy code
// Page 2: [Company 11, Company 12, ..., Company 20]

import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // cloudinary url
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // TODO:jab ap cloudinary per ap video upload karego toh waha pe ham duration exctract kar lege
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);


// TODO: isko add karte hi hab advance level ki query likh sakate hai video model ke andar
videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema);

// TODO: videoSchema.plugin(mongooseAggregatePaginate);
// advanced queries (aggregation) aur pagination dono kar sakte ho. 🚀

// 1️⃣ Advanced Queries likh sakte ho
// Aap aggregation framework ka use karke filtering, sorting, grouping, lookup (joins) jaise advanced queries likh sakte ho.

// 2️⃣ Pagination bhi kar sakte ho
// Aapko aggregation ke saath pagination ka built-in support milta hai, jisme page number aur limit specify karke results fetch kar sakte ho.
