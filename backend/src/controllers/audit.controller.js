import { AuditLog } from "../models/auditLog.model.js";

// GET /api/audit
export const listAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const { action, entity, actorEmail } = req.query;

    const query = {};
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (actorEmail) query["actor.email"] = { $regex: actorEmail, $options: "i" };

    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      ok: true,
      data: {
        items,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
