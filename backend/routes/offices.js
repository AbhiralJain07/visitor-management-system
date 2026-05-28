const express = require('express');
const router = express.Router();
const Office = require('../models/Office'); 
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/offices:
 *   get:
 *     summary: Sabhi offices ki list
 *     tags: [Offices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Offices list
 *   post:
 *     summary: Naya office banao
 *     tags: [Offices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               city:
 *                 type: string
 *               purpose:
 *                 type: string
 *     responses:
 *       201:
 *         description: Office created
 * /api/offices/{id}:
 *   put:
 *     summary: Office update karo (approve/reject)
 *     tags: [Offices]
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
 *         description: Office updated
 *   delete:
 *     summary: Office delete karo
 *     tags: [Offices]
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
 *         description: Office deleted
 */


router.get('/', auth, checkRole('admin'), async (req, res) => {
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

router.post('/', auth, checkRole('admin'), async (req, res) => {
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
router.put('/:id', auth, checkRole('admin'), async (req, res) => {
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
router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
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