const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Visitor = require('../models/Visitor');
const { auth, checkRole } = require('../middleware/auth');
const { sendMessage } = require('../telegram');
const { createAuditLog } = require('../middleware/auditLog');

/**
 * @swagger
 * /api/visits:
 *   get:
 *     summary: All visits list
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Visits list
 *   post:
 *     summary: Create new visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - visitor_id
 *               - host_id
 *             properties:
 *               visitor_id:
 *                 type: string
 *                 example: 6a16a9b2dab081b48816a5e4
 *               host_id:
 *                 type: string
 *                 example: 6a16a9b2dab081b48816a5e4
 *               purpose:
 *                 type: string
 *                 example: Meeting
 *               purpose_id:
 *                 type: string
 *                 example: 6a16a9b2dab081b48816a5e4
 *     responses:
 *       201:
 *         description: Visit created
 * /api/visits/{id}:
 *   put:
 *     summary: Update visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected, exited]
 *                 example: approved
 *               check_out:
 *                 type: string
 *                 example: "2026-05-29T10:30:00.000Z"
 *     responses:
 *       200:
 *         description: Visit updated
 *   delete:
 *     summary: Delete visit
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Visit deleted
 */

// GET — Visits list
router.get('/', auth, checkRole('super_admin', 'tenant_admin', 'manager', 'receptionist', 'security', 'employee'), async (req, res) => {
    try {
        let query = {};

        if (req.user.role !== 'super_admin') {
            query.tenant_id = req.user.tenant_id;
        }
        if (req.user.realm_id && req.user.role !== 'tenant_admin') {
            query.realm_id = req.user.realm_id;
        }
        if (req.user.role === 'employee') {
            query.host_id = req.user.id;
        }

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Filter by date
        if (req.query.date) {
            const date = new Date(req.query.date);
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);
            query.check_in = { $gte: date, $lt: nextDay };
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Visit.countDocuments(query);

        const visits = await Visit.find(query)
            .populate('visitor_id', 'name phone photo_url')
            .populate('host_id', 'name email department')
            .populate('tenant_id', 'name code')
            .populate('realm_id', 'name code')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: visits,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Create new visit
router.post('/', auth, checkRole('super_admin', 'tenant_admin', 'manager', 'receptionist', 'security', 'employee'), async (req, res) => {
    try {
        const { visitor_id, host_id, purpose, purpose_id } = req.body;

        const visit = new Visit({
            visitor_id,
            host_id,
            purpose,
            purpose_id,
            office_id: req.user.realm_id,
            tenant_id: req.user.tenant_id,  // from token
            realm_id: req.user.realm_id      // from token
        });

        await createAuditLog({
            user_id: req.user.id,
            user_email: req.user.email,
            action: 'CREATE',
            module: 'visit',
            description: `New visit created`,
            ip_address: req.ip,
            status: 'success',
            tenant_id: req.user.tenant_id,
            metadata: { visitor_id, host_id, purpose }
        });

        await visit.save();

        // Telegram notification
        const host = await Employee.findById(host_id);
        const visitor = await Visitor.findById(visitor_id);

        if (host && host.telegram_id) {
            const message = `
🔔 New Visitor Arrived!

👤 Visitor: ${visitor ? visitor.name : 'Unknown'}
📞 Phone: ${visitor ? visitor.phone : 'N/A'} 
🎯 Purpose: ${purpose}
⏰ Time: ${new Date().toLocaleString('en-IN')}

Approve the visit!`;
            await sendMessage(host.telegram_id, message);
        }

        res.status(201).json({ success: true, data: visit });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT — Visit update
router.put('/:id', auth, checkRole('super_admin', 'tenant_admin', 'manager', 'receptionist', 'security', 'employee'), async (req, res) => {
    try {
        const visit = await Visit.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!visit) return res.status(404).json({ success: false, message: 'Visit not found!' });
        res.json({ success: true, data: visit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — Visit delete
router.delete('/:id', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const visit = await Visit.findByIdAndDelete(req.params.id);
        if (!visit) return res.status(404).json({ success: false, message: 'Visit not found!' });
        res.json({ success: true, message: 'Visit deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;