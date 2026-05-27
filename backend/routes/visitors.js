const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const auth = require('../middleware/auth');
const { upload, uploadPhoto } = require('../cloudinary'); // ← top pe!

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

// POST — Naya visitor banao (photo ke saath)
router.post('/', auth, upload.single('photo'), async (req, res) => {
        try {
            console.log('Body:', req.body);      // ← add karo
            console.log('File:', req.file);      // ← add karo
            
            let photo_url = '';;

        if (req.file) {
            photo_url = await uploadPhoto(req.file.buffer);
        }

        const { name, phone, id_number } = req.body;

        const visitor = new Visitor({
            name,
            phone,
            id_number,
            photo_url
        });

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
                message: 'Visitor nahi mila!'
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
                message: 'Visitor nahi mila!'
            });
        }
        res.json({
            success: true,
            message: 'Visitor delete ho gaya!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;