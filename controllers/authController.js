const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.login = async (req, res) => {
  const { userId, password, deviceFingerprint, deviceSpecs } = req.body;

  try {
    const user = await User.findOne({ userId });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "صلاحية الدخول غير صحيحة" });
    }

    // Handle device fingerprinting for students
    if (user.role === "student") {
      const deviceExists = user.devices.find(
        (device) => device.fingerprint === deviceFingerprint
      );

      if (!deviceExists) {
        if (user.devices.length >= user.maxComputers) {
          return res
            .status(403)
            .json({ message: "تم الوصول الى الحد المسموح به من الاجهزة" });
        }
        // Register the new device with specs
        user.devices.push({
          fingerprint: deviceFingerprint,
          specs: deviceSpecs,
        });
      }
    }

    // Generate a new JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Invalidate all other sessions
    await User.updateMany({ _id: user._id }, { $set: { activeSession: null } });

    // Update the user's active session
    user.activeSession = {
      token: token,
      fingerprint: deviceFingerprint,
      lastActivity: new Date(),
    };
    await user.save();

    res.cookie("token", token, { httpOnly: true });

    if (user.role === "admin") {
      res.status(200).json({ success: true, redirectTo: "/admin.html" });
    } else {
      res.status(200).json({ success: true, redirectTo: "/student.html" });
    }
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.logout = async (req, res) => {
  try {
    // Check if req.user exists before trying to access it
    if (req.user && req.user._id) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.activeSession = null;
        await user.save();
      }
    }

    res
      .cookie("token", "", { httpOnly: true, expires: new Date(0) })
      .status(200)
      .json({ success: true });
  } catch (err) {
    console.error("Logout Error:", err);
    res.status(500).json({ message: "Server error during logout" });
  }
};
