"use strict";

/**
 * Model barrel — single import point for all Mongoose models.
 *   const { Parcel, User } = require("./models");
 */
module.exports = {
  Parcel: require("./Parcel"),
  User: require("./User"),
  ServiceRequest: require("./ServiceRequest"),
  Consent: require("./Consent"),
  AuditLog: require("./AuditLog"),
  Certificate: require("./Certificate"),
  LayerCatalogue: require("./LayerCatalogue"),
  MappingProfile: require("./MappingProfile"),
  GeoIntel: require("./GeoIntel"),
};
