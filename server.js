const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const connectDB = require("./config/db"); // Import the connectDB function

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const studentRoutes = require("./routes/studentRoutes");

dotenv.config(); // Load environment variables

const startServer = async () => {
  // Await the connection to MongoDB before starting the server
  try {
    await connectDB(); // Ensure the connection is established before starting the server

    const app = express();

    const corsOptions = {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    };

    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(cookieParser());

    // Serve static files from the 'public' folder
    app.use(express.static("public"));

    // Set up routes
    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/student", studentRoutes);

    // Start the server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port meow${PORT}`));
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1); // Exit with failure code
  }
};

startServer();
