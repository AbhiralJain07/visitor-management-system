const express = require('express');
const router = express.Router();
const Office = require('../models/Office'); 
const auth = require('../middleware/auth');

router.get('/', auth , async (req, res) => {
    try {
        const office = await Office.find(); 
        res.json({
            success: true,
            data: office
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const office = new Office(req.body); 
        await office.save();                    
        res.status(201).json({
            success: true,
            data: office                        
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// PUT — Office update karo
router.put('/:id', auth, async (req, res) => {
    try {
        const office = await Office.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!office) {
            return res.status(404).json({
                success: false,
                message: 'Office not found!'
            });
        }
        res.json({
            success: true,
            data: office
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE — Office delete karo
router.delete('/:id', auth, async (req, res) => {
    try {
        const office = await Office.findByIdAndDelete(req.params.id);
        if (!office) {
            return res.status(404).json({
                success: false,
                message: 'Office not found!'
            });
        }
        res.json({
            success: true,
            message: 'Office deleted!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


module.exports = router;