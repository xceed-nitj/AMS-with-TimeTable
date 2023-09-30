const { Router } = require("express");
const swaggerUi = require("swagger-ui-express");
const specs = require("../config/docs");
const { swaggerUiOptions } = require("../config/docs");

const mainRouter = Router();

// routes import
const awardsRouter = require("./awards");
const committeesRouter = require("./committees");
const conf = require("./conf");
const eventDateRouter = require("./eventDate");
const home = require("./home");
const navbar = require("./navbar");
const participant = require("./participant");
const speakersRouter = require("./speakers");
const sponsorsRouter = require("./sponsors");
const usersRouter = require("./user");
const annoucmentRouter = require("./announcement");
const imagesRouter = require("./images");
const contactUsRouter = require("./contactUs");
const locationRouter = require("./location");

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
};

// crud approach
try {
  mainRouter.use("/conf", conf);
  mainRouter.use("/home", home);
  mainRouter.use("/navbar", navbar);
  mainRouter.use("/participant", participant);
  mainRouter.use("/announcement", annoucmentRouter);
  mainRouter.use("/images", imagesRouter);
  mainRouter.use("/contacts", contactUsRouter);
  mainRouter.use("/location", locationRouter);
} catch (error) {
  errorHandler(error);
}

// controller approach
try {
  mainRouter.use("/awards", awardsRouter);
  mainRouter.use("/committees", committeesRouter);
  mainRouter.use("/eventDates", eventDateRouter);
  mainRouter.use("/speakers", speakersRouter);
  mainRouter.use("/sponsors", sponsorsRouter);
  mainRouter.use("/users", usersRouter);
} catch (error) {
  errorHandler(error);
}

mainRouter.get("/", (req, res) => {
  res.send(
    `Hello World! <br> Please visit <a href="/api-docs">/api-docs</a> for the API documentation`
  );
});

mainRouter.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, { swaggerOptions: swaggerUiOptions })
);

mainRouter.get("/debug-sentry", function mainHandler(req, res) {
  try {
    throw new Error("My first Sentry error!");
  } catch (error) {
    errorHandler(error);
  }
});

module.exports = mainRouter;
