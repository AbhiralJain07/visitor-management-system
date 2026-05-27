const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const auth = require('../middleware/auth');

// GET — Sabhi visitors ki list
router.get('/', auth, async (req, res) => {
    try {
        const visitors = await Visitor.find();
        res.json({
            success: true,
            data: visitors
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// POST — Naya visitor banao
router.post('/', auth , async (req, res) => {
    try {
        const visitor = new Visitor(req.body);
        await visitor.save();
        res.status(201).json({
            success: true,
            data: visitor
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// PUT — Visitor update karo
router.put('/:id', auth, async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!visitor) {
            return res.status(404).json({
                success: false,
                message: 'Visitor not found!'
            });
        }
        res.json({
            success: true,
            data: visitor
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE — Visitor delete karo
router.delete('/:id', auth, async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndDelete(req.params.id);
        if (!visitor) {
            return res.status(404).json({
                success: false,
                message: 'Visitor not found!'
            });
        }
        res.json({
            success: true,
            message: 'Visitor deleted!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;