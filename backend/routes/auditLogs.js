const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Audit logs ki list
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         example: auth
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         example: LOGIN
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed]
 *     responses:
 *       200:
 *         description: Audit logs list
 */

router.get('/', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        let query = {};

        // Tenant admin sirf apne logs dekhe
        if (req.user.role !== 'super_admin') {
            query.tenant_id = req.user.tenant_id;
        }

        // Filters
        if (req.query.module) query.module = req.query.module;
        if (req.query.action) query.action = req.query.action;
        if (req.query.status) query.status = req.query.status;

        const logs = await AuditLog.find(query)
            .populate('user_id', 'name email role')
            .sort({ createdAt: -1 })
            .limit(100); // Last 100 logs

        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;