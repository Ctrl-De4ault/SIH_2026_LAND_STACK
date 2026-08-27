"use strict";

const bcrypt = require("bcryptjs");
const {
  Parcel,
  User,
  ServiceRequest,
  Consent,
  Certificate,
  LayerCatalogue,
  MappingProfile,
  GeoIntel,
} = require("../models");
const { buildSeedData, DEMO_PASSWORD } = require("./seedData");

/**
 * Insert the full demo dataset. When `reset` is true, existing documents in the
 * seeded collections are cleared first (used by the `npm run seed` CLI).
 */
async function seedAll({ reset = false } = {}) {
  const data = buildSeedData();

  if (reset) {
    await Promise.all([
      Parcel.deleteMany({}),
      User.deleteMany({}),
      ServiceRequest.deleteMany({}),
      Consent.deleteMany({}),
      Certificate.deleteMany({}),
      LayerCatalogue.deleteMany({}),
      MappingProfile.deleteMany({}),
      GeoIntel.deleteMany({}),
    ]);
  }

  await Parcel.insertMany(data.parcels);

  // Users need a hashed password; share one demo password for all accounts.
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await User.insertMany(
    data.users.map((u) => ({ ...u, passwordHash }))
  );

  await LayerCatalogue.insertMany(data.layerCatalogue);
  await MappingProfile.insertMany(data.mappingProfiles);
  await GeoIntel.insertMany(data.geoIntel);
  await Certificate.insertMany(data.certificates);
  await Consent.insertMany(data.consents);
  await ServiceRequest.insertMany(data.serviceRequests);

  const counts = {
    parcels: data.parcels.length,
    users: data.users.length,
    layers: data.layerCatalogue.length,
    mappingProfiles: data.mappingProfiles.length,
    geoIntel: data.geoIntel.length,
    certificates: data.certificates.length,
    consents: data.consents.length,
    serviceRequests: data.serviceRequests.length,
  };
  console.log("[seed] inserted:", JSON.stringify(counts));
  return counts;
}

/**
 * Seed only if the database looks empty (used on boot). Safe to call every start.
 */
async function autoSeedIfEmpty() {
  const n = await Parcel.estimatedDocumentCount();
  if (n > 0) {
    console.log(`[seed] parcels already present (${n}); skipping auto-seed`);
    return { skipped: true };
  }
  console.log("[seed] empty database detected → seeding demo data");
  return seedAll({ reset: false });
}

module.exports = { seedAll, autoSeedIfEmpty };

// CLI: `node src/seed/seed.js --run` performs a full reset + reseed.
if (require.main === module && process.argv.includes("--run")) {
  /* eslint-disable global-require */
  require("dotenv").config();
  const { connect, disconnect } = require("../db");
  (async () => {
    try {
      await connect();
      await seedAll({ reset: true });
      await disconnect();
      console.log("[seed] done");
      process.exit(0);
    } catch (err) {
      console.error("[seed] failed:", err);
      process.exit(1);
    }
  })();
}
