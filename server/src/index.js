require("./nodeLogBuffer"); // must load first to capture all subsequent console output

const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const app = express();
const mongoose = require("mongoose");

const cors = require("cors");
const cookieParser = require("cookie-parser");

const axios = require("axios");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
// Must load before any route module makes its first request to the ML
// service — registers the axios interceptor that attaches the shared-secret
// header (see mlServiceAuth.js).
require("./modules/attendanceModule/controllers/mlServiceAuth");
const v1router = require("./routes");
const { startAutoScheduler } = require('./modules/attendanceModule/controllers/autoAttendanceScheduler');

process.on('uncaughtException',  (err) => console.error('UNCAUGHT EXCEPTION:', err));
process.on('unhandledRejection', (err) => console.error('UNHANDLED REJECTION:', err));


// NOTE: never print env values here — MONGO_URL/JWT_SECRET are secrets and
// the console output is surfaced in the Node Console page / log buffers.
if (!process.env.MONGO_URL || !process.env.JWT_SECRET) {
  console.warn('ENV CHECK: MONGO_URL and/or JWT_SECRET are NOT set — check the server .env');
}

// Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/v1/users/login", authLimiter);
app.use("/api/v1/users/register", authLimiter);
app.use("/users/login", authLimiter);
app.use("/users/register", authLimiter);

// CORS configuration
app.use(
  cors({
    origin: [
      "http://localhost:5173",  "http://localhost:5174","https://chemcon2024.com",
      "http://127.0.0.1:5173",
      "https://nitjtt.netlify.app",
      "http://localhost:8010",
      //for chemcon
      "http://localhost:5174","https://chemcon2024.com",
  //for eaic2025
  "https://eaicnitj.com",
"https://eaic2025.netlify.app",
  //for civil site
  "https://igcnitj2025.netlify.app",
  "https://igc2025nitj.com",
      //for diabetics work
  "https://t1dixpert.netlify.app",
"https://it1dxpert.org",
  //for physics site
 "https://amsdt2025.com",
      //for ece site
"https://cipher2026.com",
"https://vistanitj.com",
"https://vistaece.netlify.app",
"https://projectipecon.netlify.app",
      "https://glogift2026.com",
      "https://mac2027.com",
      "https://nitjtt.vercel.app"

    ], // Change this to your allowed origins or '*' to allow all origins
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    optionsSuccessStatus: 204,
    allowedHeaders: "Content-Type, Authorization",
    credentials: true, // Set to true if you need to allow credentials (e.g., cookies)
  })
);

// Load environment variables from .env file


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



// default route
// app.get('/', (req, res) => {
//     res.send('Hello World!');
// })

// Logger
app.use((req, res, next) => {
  // console.log(req.method, req.path)
  next()
})

// Middleware to set base URL
app.use((req, res, next) => {
  const baseURL = `${req.protocol}://${req.get('host')}`;
  req.baseURL = baseURL;
  next();
});

// app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkDatabaseConnection);
app.use(express.static(path.join(__dirname + "/../../client/dist")));
app.use("/uploads",express.static(path.join(__dirname ,"..","uploads")));

app.get('/proxy-image', async (req, res) => {
  try {
    const imageUrl = req.query.url

    // Make a request to the image URL
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' })

    // Set appropriate headers for the image
    res.set('Content-Type', response.headers['content-type'])
    res.send(response.data)
  } catch (error) {
    console.error('Error proxying image:', error.message)
    res.status(500).send('Internal Server Error')
  }
})

app.use(v1router); // TODO: Remove this line after frontend is updated to use /api/v1 prefix
app.use("/api/v1", v1router);

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
    const PORT = process.env.PORT || 8010;
    const server = app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
      
     // ── Auto Attendance Scheduler ─────────────────────────────
      // No args needed — rooms, periods, and run settings are now read
      // live from AcquisitionControl + the Camera Registry on every tick.
      startAutoScheduler();
      console.log('[AutoScheduler] Scheduler started — DB-driven (rooms, periods, embeddings).'); 

      // ── Frame Cleanup Scheduler (Task #1544) ──────────────────
      // Deletes frames older than 7 days; keeps only the best
      // annotated frame (highest face count) per camera per period.
      const { startFrameCleanupScheduler } = require('./modules/attendanceModule/controllers/frameCleanupScheduler');
      if (process.env.NODE_ENV === 'production') {
        startFrameCleanupScheduler();
        console.log('[FrameCleanup] Production storage retention scheduler registered successfully.');
      } else {
        console.log('[FrameCleanup] Development environment detected — Scheduler paused to protect local assets.');
      }

      // ── HOD Daily/Weekly Attendance Summary Scheduler ─────────
      // Actual enabled/frequency/threshold behavior is controlled from the
      // Email Notifications settings tab (NotificationSettings.dailySummaryConfig).
      const { startHodSummaryScheduler } = require('./modules/attendanceModule/controllers/hodSummaryScheduler');
      startHodSummaryScheduler();

      // ── Weekly Embedding Progress Scheduler ───────────────────
      // Emails head/coordinator recipients a per-subject embedding/ground-truth
      // readiness summary, gated by the same NotificationSettings.enabled flag
      // and the "Embedding Progress" per-role opt-in.
      const { startEmbeddingProgressScheduler } = require('./modules/attendanceModule/controllers/embeddingProgressScheduler');
      startEmbeddingProgressScheduler();

      // ── ERP Auto-Sync Scheduler ───────────────────────────────
      // Nightly: re-fetches every subject's ERP roster and regenerates
      // embeddings ONLY for subjects whose roster actually changed since
      // last sync (no-op until ERP_API_URL is configured; toggle on/off
      // from the ERP Sync page — see ErpSyncSettings).
      const { startErpAutoSyncScheduler } = require('./modules/attendanceModule/controllers/erpAutoSyncScheduler');
      startErpAutoSyncScheduler();

      // ── ERP Attendance Push Retry Scheduler ───────────────────
      // Sweeps every 5 min for reports whose push to ERP's attendance-posting
      // endpoint is pending/failed and due for a backoff retry (no-op until
      // ERP_ATTENDANCE_PUSH_URL/ERP_PUSH_SECRET are configured; toggle on/off
      // from the ERP Push settings tab — see ErpPushSettings).
      const { startErpPushRetryScheduler } = require('./modules/attendanceModule/controllers/erpAttendancePushController');
      startErpPushRetryScheduler();

    });
    server.setTimeout(600000); // 10 min — prevents Node killing long SSE connections
    server.keepAliveTimeout = 620000;
    server.headersTimeout   = 620000;
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Port ${PORT} is already in use.`);
        console.error(`   Run: netstat -ano | findstr :${PORT}`);
        console.error(`   Then: taskkill /PID <PID> /F`);
        process.exit(1);
      } else {
        throw err;
      }
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
