const express = require('express');
const router = express.Router();
const Office = require('../models/Office'); 
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/offices:
 *   get:
 *     summary: All offices list
 *     tags: [Offices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Offices list
 *   post:
 *     summary: Create new office
 *     tags: [Offices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Delhi HQ
 *               city:
 *                 type: string
 *                 example: Delhi
 *               address:
 *                 type: string
 *                 example: Connaught Place, New Delhi
 *     responses:
 *       201:
 *         description: Office created successfully!
 * /api/offices/{id}:
 *   put:
 *     summary: Update office
 *     tags: [Offices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6a16a9b2dab081b48816a5e4
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Mumbai Office
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               address:
 *                 type: string
 *                 example: Bandra Kurla Complex, Mumbai
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Office updated successfully!
 *   delete:
 *     summary: Delete office
 *     tags: [Offices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6a16a9b2dab081b48816a5e4
 *     responses:
 *       200:
 *         description: Office deleted successfully!
 */


router.get('/', auth, checkRole('admin'), async (req, res) => {
    try {
        const office = await Office.find(); 
        res.json({
            success: true,
            message: 'All offices list fetched successfully!',
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
            message: 'Office created successfully!',
            data: office                        
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// PUT — Update office
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
            message: 'Office updated successfully!',
            data: office
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE — Delete office
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
            message: 'Office deleted successfully!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


module.exports = router;