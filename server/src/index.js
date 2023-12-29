const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

// Load environment variables from .env file
dotenv.config({ path: "../.env" });

// Middleware

// Create a middleware to check the database connection
const checkDatabaseConnection = (req, res, next) => {
  // Check if the database connection is ready
  if (mongoose.connection.readyState === 1) {
    // 1 indicates the connection is open
    next(); // Proceed to the next middleware or route handler
  } else {
    res.status(500).json({ error: "Database connection is not established" });
  }
};

mongoose.connection.on("connected", () => {
  // Iterate through all models and apply the hook
  mongoose.modelNames().forEach((modelName) => {
    const model = mongoose.model(modelName);
    model.schema.pre("save", function (next) {
      const currentDate = new Date();

      if (!this.created_at) {
        this.created_at = currentDate;
      }

      this.updated_at = currentDate;
      next();
    });
  });
});

// CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "https://nitjtt.netlify.app"], // Change this to your allowed origins or '*' to allow all origins
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    optionsSuccessStatus: 204,
    allowedHeaders: "Content-Type",
    credentials: true, // Set to true if you need to allow credentials (e.g., cookies)
  })
);

// default route
// app.get('/', (req, res) => {
//     res.send('Hello World!');
// })

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkDatabaseConnection);
app.use(express.static(path.join(__dirname + "/../../client/dist")));

// Routes
const certificateModule = require("./modules/certificateModule/routes/index");
app.use("/certificateModule", certificateModule);

const timetableModule = require("./modules/timetableModule/routes/index");
app.use("/timetablemodule", timetableModule);

const uploadModule = require("./modules/uploadModule/upload");
app.use("/upload", uploadModule);

const attendanceModule = require("./modules/attendanceModule/routes/index");
app.use("/attendancemodule", attendanceModule);

const usermanagementModule = require("./modules/usermanagement/routes/routes");

app.use("/auth", usermanagementModule);

const newusermanagementModule = require("./modules/usermanagement/routes/index");

app.use("/user", newusermanagementModule);

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname + "/../../client/dist/index.html"));
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
    app.listen(8010, () => {
      console.log("Server started on port 8010");
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// Handle MongoDB connection events
mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from MongoDB");
});
