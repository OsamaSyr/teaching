const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
  let token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    if (!user.activeSession || user.activeSession.token !== token) {
      // Clear the invalid token from cookies
      res.clearCookie("token");
      return res
        .status(401)
        .json({ message: "انتهت صلاحية الجلسة، قم بتسجيل الدخول مرة أخرى" });
    }

    // Update last activity
    user.activeSession.lastActivity = new Date();
    await user.save();

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
