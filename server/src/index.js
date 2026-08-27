"use strict";

require("dotenv").config();

const config = require("./config");
const { connect } = require("./db");
const { createApp } = require("./app");
const { autoSeedIfEmpty } = require("./seed/seed");

async function main() {
  console.log(`[boot] Land Stack API starting (env=${config.env})`);

  await connect();

  if (config.autoSeed) {
    await autoSeedIfEmpty();
  }

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`[boot] API listening on http://localhost:${config.port}`);
    console.log(`[boot] OpenAPI docs at  http://localhost:${config.port}/v1/docs`);
  });
}

main().catch((err) => {
  console.error("[boot] fatal:", err.message);
  process.exit(1);
});
