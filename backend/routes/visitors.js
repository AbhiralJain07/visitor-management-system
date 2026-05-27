const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const auth = require('../middleware/auth');
const { upload, uploadPhoto } = require('../cloudinary'); 
const { getEmbedding } = require('../faceService');
const { compareFaces } = require('../faceService');

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
        let photo_url = '';
        let face_data = '';

        if (req.file) {
            // Cloudinary pe photo upload karo
            photo_url = await uploadPhoto(req.file.buffer);

            // Face embedding nikalo
            const base64Image = req.file.buffer.toString('base64');
            const faceResult = await getEmbedding(base64Image);

            if (faceResult.success) {
                face_data = JSON.stringify(faceResult.embedding);
            }
        }

        const { name, phone, id_number } = req.body;

        const visitor = new Visitor({
            name,
            phone,
            id_number,
            photo_url,
            face_data  // ← embedding save ho rahi hai!
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

// POST — Face se visitor dhundho
router.post('/identify', auth, upload.single('photo'), async (req, res) => {
    try {
        // Naya photo ka embedding nikalo
        const base64Image = req.file.buffer.toString('base64');
        const faceResult = await getEmbedding(base64Image);

        if (!faceResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Chehra nahi mila!'
            });
        }

        const newEmbedding = faceResult.embedding;

        // Database se saare visitors lo jinka face_data hai
        const visitors = await Visitor.find({ 
            face_data: { $ne: '' } 
        });

        // Har visitor se compare karo
        let matchedVisitor = null;
        let highestSimilarity = 0;

        for (const visitor of visitors) {
            const storedEmbedding = JSON.parse(visitor.face_data);
            const result = await compareFaces(newEmbedding, storedEmbedding);

            if (result.match && result.similarity > highestSimilarity) {
                highestSimilarity = result.similarity;
                matchedVisitor = visitor;
            }
        }

        if (matchedVisitor) {
            if (matchedVisitor.is_blacklisted) {
                return res.json({
                    success: true,
                    found: true,
                    blacklisted: true,
                    visitor: matchedVisitor,
                    message: `⚠️ ALERT! ${matchedVisitor.name} blacklisted hai!`
                });
            }
            
            return res.json({
                success: true,
                found: true,
                similarity: highestSimilarity,
                visitor: matchedVisitor,
                message: `Welcome back ${matchedVisitor.name}! 👋`
            });
        }

        res.json({
            success: true,
            found: false,
            message: 'Naya visitor hai!'
        });

    } catch (error) {
        res.status(500).json({
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