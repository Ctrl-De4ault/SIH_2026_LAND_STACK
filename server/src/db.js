"use strict";

const mongoose = require("mongoose");
const config = require("./config");

let memoryServer = null;

/**
 * Connect to MongoDB.
 *
 * If config.mongoUri is set, connect to that server (local or Atlas).
 * Otherwise, dynamically start an in-memory MongoDB via mongodb-memory-server
 * so the app runs with zero database setup. That package is a devDependency;
 * if it is missing (e.g. a production install) we fail with a clear message.
 */
async function connect() {
  mongoose.set("strictQuery", true);

  let uri = config.mongoUri;
  let mode = "external";

  if (!uri) {
    mode = "in-memory";
    let MongoMemoryServer;
    try {
      ({ MongoMemoryServer } = require("mongodb-memory-server"));
    } catch (err) {
      throw new Error(
        "No MONGODB_URI is set and 'mongodb-memory-server' is not installed.\n" +
          "Either set MONGODB_URI in your .env, or run `npm install` to pull in\n" +
          "the in-memory database used for the zero-setup demo."
      );
    }
    memoryServer = await MongoMemoryServer.create({
      instance: { dbName: config.dbName },
    });
    uri = memoryServer.getUri();
  }

  await mongoose.connect(uri, { dbName: config.dbName });

  const host =
    mode === "in-memory" ? "in-memory MongoDB" : mongoose.connection.host;
  console.log(`[db] connected (${mode}) → ${host}/${config.dbName}`);

  return { mode, uri };
}

async function disconnect() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = { connect, disconnect, mongoose };
