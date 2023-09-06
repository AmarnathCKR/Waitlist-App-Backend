const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    position: Number,
    status: Boolean,
    logs: [{
      event: String,
      refId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
      }, timestamp: {
        type: Date,
        default: Date.now, 
      },
    }],
    refered: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
