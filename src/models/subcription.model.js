import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User", //   એક જે સબ્સ્ક્રાઇબ કરી રહ્યો છે
    },
    
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User", 
    //   જેનો સબ્સ્ક્રાઇબર સબ્સ્ક્રાઇબ કરી રહ્યો છે તે વ્યક્તિ
    },


  },
  { timestamps: true }
);

export const Subscriptions = mongoose.model("Subscriptions", subscriptionSchema);
