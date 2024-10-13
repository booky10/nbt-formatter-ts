import "dotenv/config.js";

import express from "express";
import cors from "cors";
import { slowDown } from "express-slow-down";

import routes from "./routes.js";

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 8080);
const trustProxy = process.env.TRUST_PROXY || false;
const frontendEnabled = process.env.FRONTEND_ENABLED || true;
const frontendDirectory = process.env.FRONTEND_DIRECTORY || "public";

// express setup
const app = express();
app.disable("x-powered-by");
if (trustProxy) {
  console.warn("WARN: Will be trusting proxy fowarding headers");
  app.set("trust proxy", true);
}

app.use(cors());
app.use(express.text({ type: () => true }));
app.use(
  // allow 5 requests per 30s, then slow down
  // add 200ms delay per each additional request
  slowDown({
    windowMs: 30 * 1000,
    delayAfter: 5,
    delayMs: (hits) => hits * 200,
    validate: { trustProxy: false },
    skip: (req, res) => !req.path.startsWith("/api"),
  })
);

// register routes
routes(app);

// register static frontend page
if (frontendEnabled) {
  app.use(express.static(frontendDirectory));
}

// handle errors
app.use((err, req, res, next) => {
  console.error(`Received error from ${req.ip} with url ${req.url}`, err);
  res.status(500).send({ status: 500, message: "server error" });
});

// boot process
app.listen(port, host);
console.log(`Startup done! Listening on ${port}`);
