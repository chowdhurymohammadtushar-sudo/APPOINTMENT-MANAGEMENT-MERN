import AuditLog from "../models/AuditLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, action = "", targetType = "" } = req.query;

  const query = {};
  if (action) query.action = action;
  if (targetType) query.targetType = targetType;

  const pageNum = Math.max(Number(page) || 1, 1);
  const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate("admin", "name email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    AuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});