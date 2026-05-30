const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const { auth, checkRole } = require('../middleware/auth');
const { sendMessage } = require('../telegram');

/**
 * @swagger
 * /api/visits:
 *   get:
 *     summary: Sabhi visits ki list
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Visits list
 *   post:
 *     summary: Naya visit banao
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
 *     summary: Visit update karo
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
 *     summary: Visit delete karo
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
router.get('/', auth, checkRole('super_admin', 'tenant_admin', 'receptionist', 'employee'), async (req, res) => {
    try {
        let query = {};

        if (req.user.role !== 'super_admin') {
            query.tenant_id = req.user.tenant_id;
        }

        if (req.user.realm_id) {
            query.realm_id = req.user.realm_id;
        }

        // Employee sirf apni visits dekhe
        if (req.user.role === 'employee') {
            query.host_id = req.user.id;
        }

        const visits = await Visit.find(query)
            .populate('visitor_id', 'name phone photo_url')
            .populate('host_id', 'name email department')
            .populate('tenant_id', 'name code')
            .populate('realm_id', 'name code')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: visits });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Naya visit
router.post('/', auth, checkRole('super_admin', 'tenant_admin', 'receptionist'), async (req, res) => {
    try {
        const { visitor_id, host_id, purpose, purpose_id } = req.body;

        const visit = new Visit({
            visitor_id,
            host_id,
            purpose,
            purpose_id,
            office_id: req.user.realm_id,
            tenant_id: req.user.tenant_id,  // ← token se!
            realm_id: req.user.realm_id      // ← token se!
        });

        await visit.save();

        // Telegram notification
        const host = await User.findById(host_id);
        const visitor = await Visitor.findById(visitor_id);

        if (host && host.telegram_id) {
            const message = `
🔔 Naya Visitor Aaya Hai!

👤 Visitor: ${visitor ? visitor.name : 'Unknown'}
📞 Phone: ${visitor ? visitor.phone : 'N/A'}
🎯 Purpose: ${purpose}
⏰ Time: ${new Date().toLocaleString('en-IN')}

Approve karne ke liye system mein jaao!`;
            await sendMessage(host.telegram_id, message);
        }

        res.status(201).json({ success: true, data: visit });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT — Visit update
router.put('/:id', auth, checkRole('super_admin', 'tenant_admin', 'receptionist', 'employee'), async (req, res) => {
    try {
        const visit = await Visit.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!visit) return res.status(404).json({ success: false, message: 'Visit nahi mili!' });
        res.json({ success: true, data: visit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — Visit delete
router.delete('/:id', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const visit = await Visit.findByIdAndDelete(req.params.id);
        if (!visit) return res.status(404).json({ success: false, message: 'Visit nahi mili!' });
        res.json({ success: true, message: 'Visit delete ho gayi!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;