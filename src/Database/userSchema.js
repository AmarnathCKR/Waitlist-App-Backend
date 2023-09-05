const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
   name : String,
   email : String,
   password : String,
   position : Number,
   status : Boolean,
   logs : [],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
