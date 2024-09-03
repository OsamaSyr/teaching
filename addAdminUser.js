const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User'); // Adjust the path to your User model

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

// Function to add an admin user
const addAdminUser = async () => {
    try {
        // Create a new admin user
        const newUser = new User({
            userId: 'adminUserId',      // Replace with desired admin userId
            password: 'adminPassword',  // Replace with desired password
            role: 'admin',              // Admin role
            maxComputers: 5             // Set max computers for admin if needed
        });

        // Save the user to the database
        await newUser.save();

        console.log('Admin user created successfully');
    } catch (err) {
        console.error('Error creating admin user:', err);
    } finally {
        // Close the database connection
        mongoose.connection.close();
    }
};

// Run the script
connectDB().then(addAdminUser);
