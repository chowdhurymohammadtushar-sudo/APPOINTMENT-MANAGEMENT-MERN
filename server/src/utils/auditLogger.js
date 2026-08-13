import AuditLog from "../models/AuditLog.js";

export const logAdminAction = async ({
  adminId,
  action,
  targetType,
  targetId,
  details = {},
  req = null,
}) => {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      details,
      ipAddress: req?.ip || req?.headers?.["x-forwarded-for"] || "",
    });
  } catch (err) {
    
    console.error("[auditLogger] Failed to write audit log:", err.message);
  }
};