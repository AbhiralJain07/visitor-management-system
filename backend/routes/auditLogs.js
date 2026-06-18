const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const Tenant = require('../models/Tenant');
const Employee = require('../models/Employee');
const Visit = require('../models/Visit');
const Visitor = require('../models/Visitor');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Audit logs list
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: module
 *         schema:
 *           type: string
 *         description: Filter by module name (visitor, visit, user, tenant, realm)
 *         example: visitor
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW)
 *         example: CREATE
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed]
 *         description: Filter by success or failed status
 *         example: success
 *     responses:
 *       200:
 *         description: Audit logs list fetched successfully!
 *       500:
 *         description: Internal server error
 * 
 * /api/audit-logs/analytics:
 *   get:
 *     summary: Live stats and dashboard analytics
 *     tags: [AuditLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d]
 *           default: 30d
 *         description: Range of days for analytics data
 *     responses:
 *       200:
 *         description: Analytics statistics fetched successfully!
 *       500:
 *         description: Internal server error
 */

// GET /api/audit-logs — Audit logs list
router.get('/', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        let query = {};

        if (req.user.role !== 'super_admin') {
            query.tenant_id = req.user.tenant_id;
        }

        if (req.query.module) query.module = req.query.module;
        if (req.query.action) query.action = req.query.action;
        if (req.query.status) query.status = req.query.status;

        const logs = await AuditLog.find(query)
            .populate('user_id', 'name email role')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/audit-logs/analytics — Super Admin Dashboard ke liye live stats
router.get('/analytics', auth, checkRole('super_admin', 'auditor'), async (req, res) => {
    try {
        const { dateRange = '30d' } = req.query;

        // Date range compute
        const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
        const days = daysMap[dateRange] || 30;
        const since = new Date();
        since.setDate(since.getDate() - days);

        // Parallel queries
        const [
            totalCompanies,
            activeCompanies,
            pendingCompanies,
            totalVisitors,
            visitsToday,
            totalUsers,
        ] = await Promise.all([
            Tenant.countDocuments(),
            Tenant.countDocuments({ status: 'Active' }),
            Tenant.countDocuments({ status: 'Pending' }),
            Visitor.countDocuments(),
            Visit.countDocuments({
                check_in: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lte: new Date(new Date().setHours(23, 59, 59, 999)),
                }
            }),
            Employee.countDocuments(),
        ]);

        // Visitor trend — last 7 days
        const visitorTrend = [];
        for (let i = 6; i >= 0; i--) {
            const day = new Date();
            day.setDate(day.getDate() - i);
            const start = new Date(day.setHours(0, 0, 0, 0));
            const end = new Date(day.setHours(23, 59, 59, 999));
            const count = await Visit.countDocuments({ check_in: { $gte: start, $lte: end } });
            visitorTrend.push({
                date: start.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                visits: count,
            });
        }

        // Company growth — last 6 months
        const companyGrowth = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const count = await Tenant.countDocuments({ createdAt: { $lte: end } });
            companyGrowth.push({
                month: start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
                companies: count,
            });
        }

        // Plan distribution
        const planCounts = await Tenant.aggregate([
            { $group: { _id: '$plan', count: { $sum: 1 } } }
        ]);
        const planDistribution = planCounts.map(p => ({
            name: p._id ? (p._id.charAt(0).toUpperCase() + p._id.slice(1)) : 'Basic',
            value: p.count,
        }));

        // Status distribution
        const statusCounts = await Tenant.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const statusDistribution = statusCounts.map(s => ({
            name: s._id || 'Unknown',
            value: s.count,
        }));

        // Revenue trend — estimated (maxUsers * plan price)
        const planPrices = { basic: 99, standard: 299, premium: 599, enterprise: 1499 };
        const tenants = await Tenant.find({}, 'plan maxUsers createdAt');
        const revenueTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            const activeTenants = tenants.filter(t => new Date(t.createdAt) <= end);
            const revenue = activeTenants.reduce((sum, t) => sum + (planPrices[t.plan] || 99), 0);
            revenueTrend.push({
                month: d.toLocaleDateString('en-IN', { month: 'short' }),
                revenue,
            });
        }

        const monthlyGrowthPercent = companyGrowth.length >= 2
            ? Math.round(((companyGrowth[companyGrowth.length - 1].companies - companyGrowth[companyGrowth.length - 2].companies) / Math.max(companyGrowth[companyGrowth.length - 2].companies, 1)) * 100 * 10) / 10
            : 0;

        res.json({
            success: true,
            data: {
                stats: {
                    totalCompanies,
                    activeCompanies,
                    pendingCompanies,
                    totalVisitors,
                    visitsToday,
                    activeUsers: totalUsers,
                    monthlyGrowthPercent,
                },
                companyGrowth,
                visitorTrend,
                planDistribution,
                statusDistribution,
                revenueTrend,
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
