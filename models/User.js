const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "admin"], required: true },
  maxComputers: { type: Number, default: 1 },
  devices: [
    {
      fingerprint: { type: String },
      specs: {
        userAgent: String,
        platform: String,
        screenResolution: String,
        colorDepth: Number,
        language: String,
      },
    },
  ],
  playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Playlist" }],
  activeSession: {
    token: String,
    fingerprint: String,
    lastActivity: Date,
  },
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
