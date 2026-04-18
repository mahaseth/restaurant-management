import mongoose from "mongoose";
import config from "./config.js";

const RETRY_MS = 5000;

/** When MONGODB_ATLAS_SEEDS is set, build mongodb://…@host1,host2,host3/… so Node never runs querySrv (fixes ECONNREFUSED on some Windows DNS setups). */
function resolvedMongoUrl() {
  const url = config.mongodbUrl;
  const seeds = config.mongodbAtlasSeeds;
  if (!url?.startsWith("mongodb+srv://") || !seeds) return url;

  const withoutScheme = url.slice("mongodb+srv://".length);
  const at = withoutScheme.indexOf("@");
  if (at === -1) return url;
  const userinfo = withoutScheme.slice(0, at);
  const rest = withoutScheme.slice(at + 1);
  const slash = rest.indexOf("/");
  const pathAndQuery = slash === -1 ? "/" : rest.slice(slash);
  let suffix = pathAndQuery;
  if (!suffix.startsWith("/")) suffix = "/" + suffix;
  const joiner = suffix.includes("?") ? "&" : "?";
  if (!/[?&]tls=/.test(suffix)) suffix += `${joiner}tls=true`;

  return `mongodb://${userinfo}@${seeds}${suffix}`;
}

async function connectDB() {
  try {
    const url = resolvedMongoUrl();
    if (url !== config.mongodbUrl && config.mongodbAtlasSeeds) {
      console.log("Using MONGODB_ATLAS_SEEDS (direct mongodb://) instead of mongodb+srv.");
    }
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 10_000,
    });
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
}

let reconnectIntervalId = null;

/** Retries MongoDB until connected. Use after the initial connectDB() fails. */
export function startMongoReconnectLoop() {
  if (!config.mongodbUrl) {
    console.error("MONGODB_URL is not set; cannot connect to MongoDB.");
    return;
  }
  if (mongoose.connection.readyState === 1) return;
  if (reconnectIntervalId) return;

  const attempt = async () => {
    if (mongoose.connection.readyState === 1) {
      if (reconnectIntervalId) {
        clearInterval(reconnectIntervalId);
        reconnectIntervalId = null;
      }
      return;
    }
    try {
      const url = resolvedMongoUrl();
      await mongoose.connect(url, {
        serverSelectionTimeoutMS: 10_000,
      });
      console.log("MongoDB connected successfully.");
      if (reconnectIntervalId) {
        clearInterval(reconnectIntervalId);
        reconnectIntervalId = null;
      }
    } catch (e) {
      console.error("MongoDB connection retry failed:", e.message);
    }
  };

  reconnectIntervalId = setInterval(attempt, RETRY_MS);
  attempt();
}

export default connectDB;
