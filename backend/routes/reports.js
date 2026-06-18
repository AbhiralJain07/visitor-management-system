const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const Visitor = require('../models/Visitor');
const Employee = require('../models/Employee');
const Office = require('../models/Office');
const { auth, checkRole } = require('../middleware/auth');

// GET /api/reports — Tenant-level reports summary
router.get('/', auth, checkRole('tenant_admin', 'manager', 'receptionist'), async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Date range setup
        const start = startDate ? new Date(startDate) : (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d; })();
        const end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const baseVisitFilter = {};
        const visitorFilter = {};

        if (req.user.role !== 'super_admin') {
            baseVisitFilter.tenant_id = req.user.tenant_id;
            visitorFilter.tenant_id = req.user.tenant_id;
        }

        if (req.user.realm_id && req.user.role !== 'tenant_admin') {
            baseVisitFilter.realm_id = req.user.realm_id;
            visitorFilter.realm_id = req.user.realm_id;
        }

        const dateFilter = { ...baseVisitFilter, check_in: { $gte: start, $lte: end } };

        // Core stats
        const [
            totalVisits,
            approvedVisits,
            rejectedVisits,
            pendingVisits,
            exitedVisits,
            totalVisitors,
            blacklistedVisitors,
        ] = await Promise.all([
            Visit.countDocuments(dateFilter),
            Visit.countDocuments({ ...dateFilter, status: 'approved' }),
            Visit.countDocuments({ ...dateFilter, status: 'rejected' }),
            Visit.countDocuments({ ...dateFilter, status: 'pending' }),
            Visit.countDocuments({ ...dateFilter, status: 'exited' }),
            Visitor.countDocuments(visitorFilter),
            Visitor.countDocuments({ ...visitorFilter, is_blacklisted: true }),
        ]);

        // Today stats
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const visitsToday = await Visit.countDocuments({ ...baseVisitFilter, check_in: { $gte: todayStart, $lte: todayEnd } });
        const activeVisitors = await Visit.countDocuments({ ...baseVisitFilter, status: 'approved', check_out: null });

        // Daily visit trend — last 14 days
        const dailyTrend = [];
        for (let i = 13; i >= 0; i--) {
            const day = new Date();
            day.setDate(day.getDate() - i);
            const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
            const count = await Visit.countDocuments({
                ...baseVisitFilter,
                check_in: { $gte: dayStart, $lte: dayEnd }
            });
            dailyTrend.push({
                date: dayStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                visits: count,
            });
        }

        // Purpose breakdown
        const purposeAgg = await Visit.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$purpose', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 8 },
        ]);
        const purposeBreakdown = purposeAgg.map(p => ({
            purpose: p._id || 'Unknown',
            count: p.count,
        }));

        // Status distribution
        const statusDistribution = [
            { status: 'Approved', count: approvedVisits },
            { status: 'Pending', count: pendingVisits },
            { status: 'Rejected', count: rejectedVisits },
            { status: 'Exited', count: exitedVisits },
        ];

        // Top hosts (employees with most visits)
        const topHostsAgg = await Visit.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$host_id', visitCount: { $sum: 1 } } },
            { $sort: { visitCount: -1 } },
            { $limit: 5 },
        ]);
        const hostIds = topHostsAgg.map(h => h._id);
        const hostDocs = await Employee.find({ _id: { $in: hostIds } }).select('name department');
        const topHosts = topHostsAgg.map(h => {
            const emp = hostDocs.find(e => e._id.toString() === h._id?.toString());
            return {
                name: emp?.name || 'Unknown',
                department: emp?.department || 'General',
                visitCount: h.visitCount,
            };
        });

        // Hourly distribution (which hours are busiest)
        const hourlyAgg = await Visit.aggregate([
            { $match: dateFilter },
            { $group: { _id: { $hour: '$check_in' }, count: { $sum: 1 } } },
            { $sort: { '_id': 1 } },
        ]);
        const hourlyDistribution = Array.from({ length: 24 }, (_, h) => {
            const found = hourlyAgg.find(a => a._id === h);
            return { hour: `${h.toString().padStart(2, '0')}:00`, count: found?.count || 0 };
        }).filter(h => {
            const hr = parseInt(h.hour);
            return hr >= 7 && hr <= 20; // Office hours only
        });

        // Avg duration (minutes)
        const durationAgg = await Visit.aggregate([
            { $match: { ...dateFilter, check_out: { $ne: null } } },
            { $project: { duration: { $subtract: ['$check_out', '$check_in'] } } },
            { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
        ]);
        const avgDurationMinutes = durationAgg.length > 0
            ? Math.round(durationAgg[0].avgDuration / 60000)
            : 0;

        res.json({
            success: true,
            data: {
                stats: {
                    totalVisits,
                    approvedVisits,
                    rejectedVisits,
                    pendingVisits,
                    exitedVisits,
                    totalVisitors,
                    blacklistedVisitors,
                    visitsToday,
                    activeVisitors,
                    avgDurationMinutes,
                },
                dailyTrend,
                purposeBreakdown,
                statusDistribution,
                topHosts,
                hourlyDistribution,
                dateRange: {
                    startDate: start.toISOString(),
                    endDate: end.toISOString(),
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
