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
      type: Number, // jab ap cloudinary per ap video upload karego toh waha pe ham duration exctract kar lege
      required: true,
    },
    views: {
        type:Number,
        default :0,
    },
    isPublished:{
        type:Boolean,
        default :true,
    },
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User "
    }
  },
  { timestamps: true }
);




videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videoSchema);



// TODO: videoSchema.plugin(mongooseAggregatePaginate);
// advanced queries (aggregation) aur pagination dono kar sakte ho. 🚀

// 1️⃣ Advanced Queries likh sakte ho
// Aap aggregation framework ka use karke filtering, sorting, grouping, lookup (joins) jaise advanced queries likh sakte ho.

// 2️⃣ Pagination bhi kar sakte ho
// Aapko aggregation ke saath pagination ka built-in support milta hai, jisme page number aur limit specify karke results fetch kar sakte ho.

