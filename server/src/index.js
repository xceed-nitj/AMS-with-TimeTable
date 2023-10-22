const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require('dotenv');
const cors = require("cors");

// Load environment variables from .env file
dotenv.config();

// Middleware
// CORS configuration
app.use(cors({
    origin: '*', // Change this to your allowed origins or '*' to allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    allowedHeaders: 'Content-Type',
    credentials: true, // Set to true if you need to allow credentials (e.g., cookies)
  }));
  
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes

const timetableModule = require("./modules/timetableModule/routes/index");
app.use("/timetablemodule", timetableModule);

const uploadModule = require("./modules/uploadModule/upload")
app.use("/upload", uploadModule);

const attendanceModule = require("./modules/attendanceModule/routes/index");
app.use("/attendancemodule", attendanceModule);

app.get('/', (req, res) => {
    res.send("Hello India");
});

// Connect to MongoDB and listen for events
mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("Connected to MongoDB");
        // Start the Express server once connected to MongoDB
        app.listen(8000, () => {
            console.log("Server started on port 8000");
        });
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
    });

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
});
