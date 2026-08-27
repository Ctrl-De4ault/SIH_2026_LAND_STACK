"use strict";

const { Schema, model } = require("mongoose");
const { SERVICE_TYPES, SR_STATUS } = require("../constants");

/**
 * ServiceRequest — a citizen-initiated request handled through the admin
 * workflow console (M7 submits, M8 processes). Covers mutation, certified
 * copies, encumbrance certificates, corrections and subdivision (FR-08/09).
 */
const TransitionSchema = new Schema(
  {
    from: String,
    to: String,
    at: { type: Date, default: Date.now },
    byRole: String,
    byUser: { type: Schema.Types.ObjectId, ref: "User" },
    note: String,
  },
  { _id: false }
);

const ObjectionSchema = new Schema(
  {
    by: String,
    note: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ServiceRequestSchema = new Schema(
  {
    requestId: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: Object.values(SERVICE_TYPES), required: true },
    ulpin: { type: String, required: true, index: true },

    applicant: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      name: String,
      email: String,
      phone: String,
    },

    // Type-specific details (e.g. incoming owner for a mutation).
    payload: { type: Schema.Types.Mixed, default: {} },

    status: {
      type: String,
      enum: Object.values(SR_STATUS),
      default: SR_STATUS.SUBMITTED,
      index: true,
    },
    assignedRole: String,
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },

    history: { type: [TransitionSchema], default: [] },
    objections: { type: [ObjectionSchema], default: [] },

    result: {
      certificateId: String,
      mutationApplied: { type: Boolean, default: false },
      note: String,
    },
  },
  { timestamps: true }
);

module.exports = model("ServiceRequest", ServiceRequestSchema);
