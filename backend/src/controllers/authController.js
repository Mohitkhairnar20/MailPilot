const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null;

const validateSignupPayload = ({ name, email, password }) => {
  if (!name || !email || !password) {
    return "Name, email, and password are required";
  }

  if (name.trim().length < 2) {
    return "Name must be at least 2 characters long";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please provide a valid email address";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number";
  }

  return null;
};

const validateLoginPayload = ({ email, password }) => {
  if (!email || !password) {
    return "Email and password are required";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Please provide a valid email address";
  }

  return null;
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar || "",
  authProvider: user.authProvider
});

const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const validationMessage = validateSignupPayload({ name, email, password });

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists"
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      authProvider: "local",
      password
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const validationMessage = validateLoginPayload({ email, password });

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (user?.authProvider === "google") {
      return res.status(400).json({
        success: false,
        message: "This account uses Google sign-in. Continue with Google instead."
      });
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    if (!googleClient || !process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({
        success: false,
        message: "Google sign-in is not configured on the server"
      });
    }

    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required"
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified) {
      return res.status(400).json({
        success: false,
        message: "Google account email is not verified"
      });
    }

    const normalizedEmail = payload.email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = await User.create({
        name: payload.name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        authProvider: "google",
        googleId: payload.sub,
        avatar: payload.picture || ""
      });
    } else {
      user.name = payload.name || user.name;
      user.googleId = payload.sub;
      user.avatar = payload.picture || user.avatar;
      user.authProvider = "google";
      await user.save();
    }

    const token = generateToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, googleAuth };
