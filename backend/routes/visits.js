const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const auth = require('../middleware/auth');

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
router.post('/', auth , async (req, res) => {
    try {
        const visit = new Visit(req.body);
        await visit.save();
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