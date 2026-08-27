"use strict";

const { AuditLog } = require("../models");

/**
 * Audit middleware (FR-10). Records a consequential action to the immutable
 * audit log once the response finishes. Attach to sensitive routes:
 *
 *   router.get("/:ulpin/ror", audit("ror.read", (req) => ({ type: "parcel", id: req.params.ulpin })), handler)
 *
 * `action` is a dotted verb; `targetResolver(req,res)` optionally returns
 * { type, id } describing the affected resource. Writes are fire-and-forget so
 * auditing never blocks or fails the request.
 */
function audit(action, targetResolver) {
  return function auditMiddleware(req, res, next) {
    res.on("finish", () => {
      let target;
      try {
        target = typeof targetResolver === "function" ? targetResolver(req, res) : undefined;
      } catch (_e) {
        target = undefined;
      }

      const actor = req.user
        ? { userId: req.user.id, role: req.user.role, email: req.user.email }
        : { role: "anonymous" };

      AuditLog.create({
        actor,
        action,
        target,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        meta: {
          status: res.statusCode,
          method: req.method,
          path: req.originalUrl,
        },
      }).catch((err) => console.error("[audit] write failed:", err.message));
    });
    next();
  };
}

module.exports = { audit };
