const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const Employee = require('../models/Employee');
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               visitor_id:
 *                 type: string
 *               host_id:
 *                 type: string
 *               office_id:
 *                 type: string
 *               purpose:
 *                 type: string
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

router.get('/', auth, checkRole('admin', 'receptionist'), async (req, res) => {
    try {
        const visits = await Visit.find();
        res.json({ success: true, data: visits });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', auth, checkRole('admin', 'receptionist'), async (req, res) => {
    try {
        const visit = new Visit(req.body);
        await visit.save();

        const employee = await Employee.findById(visit.host_id);
        const visitor = await Visitor.findById(visit.visitor_id);

        if (employee && employee.telegram_id) {
            const message = `
🔔 Naya Visitor Aaya Hai!

👤 Visitor: ${visitor ? visitor.name : 'Unknown'}
📞 Phone: ${visitor ? visitor.phone : 'N/A'}
🎯 Purpose: ${visit.purpose}
⏰ Time: ${new Date().toLocaleString('en-IN')}

Approve karne ke liye system mein jaao!`;
            await sendMessage(employee.telegram_id, message);
        }

        res.status(201).json({ success: true, data: visit });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/:id', auth, checkRole('admin', 'receptionist', 'employee'), async (req, res) => {
    try {
        const visit = await Visit.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!visit) return res.status(404).json({ success: false, message: 'Visit not found!' });
        res.json({ success: true, data: visit });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
    try {
        const visit = await Visit.findByIdAndDelete(req.params.id);
        if (!visit) return res.status(404).json({ success: false, message: 'Visit not found!' });
        res.json({ success: true, message: 'Visit deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;