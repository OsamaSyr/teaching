const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token = req.cookies.token;

  console.log("Received token:", token);

  if (!token) {
    console.log("No token found in cookies");
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      console.log("User not found for token");
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    if (!user.activeSession || user.activeSession.token !== token) {
      console.log("Invalid or expired session");
      res.clearCookie("token");
      return res
        .status(401)
        .json({ message: "Session expired, please log in again" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Protect Middleware Error:", err);
    res.clearCookie("token");
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

exports.admin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Not authorized as an admin" });
  }
  next();
};
