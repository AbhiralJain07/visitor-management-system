const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const auth = require('../middleware/auth');
const Visitor = require('../models/Visitor');

// GET — Sabhi visits ki list
router.get('/', auth, async (req, res) => {
    try {
        const visits = await Visit.find();
        res.json({
            success: true,
            data: visits
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST — Naya visit banao
const { sendMessage } = require('../telegram'); // ← top mein add karo
const Employee = require('../models/Employee'); // ← yeh bhi add karo

// POST — Naya visit banao
router.post('/', auth, async (req, res) => {
    try {
        const visit = new Visit(req.body);
        await visit.save();

        // Employee dhundho aur Telegram message bhejo
        const employee = await Employee.findById(visit.host_id);
        if (employee && employee.telegram_id) {
            const visitor = await Visitor.findById(visit.visitor_id);

const message = `
🔔 Naya Visitor Aaya Hai!

👤 Visitor: ${visitor ? visitor.name : 'Unknown'}
📞 Phone: ${visitor ? visitor.phone : 'N/A'}
🎯 Purpose: ${visit.purpose} 
⏰ Time: ${new Date().toLocaleString('en-IN')}

Approve karne ke liye system mein jaao!
`;
            await sendMessage(employee.telegram_id, message);
        }

        res.status(201).json({
            success: true,
            data: visit
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// PUT — visits update karo
router.put('/:id', auth, async (req, res) => {
    try {
        const visit = await Visit.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found!'
            });
        }
        res.json({
            success: true,
            data: visit
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE — visit delete karo
router.delete('/:id', auth, async (req, res) => {
    try {
        const visit = await Visit.findByIdAndDelete(req.params.id);
        if (!visit) {
            return res.status(404).json({
                success: false,
                message: 'Visit not found!'
            });
        }
        res.json({
            success: true,
            message: 'Visit deleted!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});




module.exports = router;