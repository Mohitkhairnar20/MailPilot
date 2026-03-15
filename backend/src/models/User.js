const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [60, "Name must be less than 60 characters long"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailPattern, "Please provide a valid email address"]
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local"
    },
    googleId: {
      type: String,
      sparse: true
    },
    avatar: {
      type: String,
      default: ""
    },
    password: {
      type: String,
      required: function passwordRequired() {
        return this.authProvider === "local";
      },
      minlength: [8, "Password must be at least 8 characters long"],
      select: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre("save", async function preSave(next) {
  if (!this.password) {
    return next();
  }

  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
