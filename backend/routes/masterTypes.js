const express = require('express');
const router = express.Router();
const MasterType = require('../models/MasterType');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/master-types:
 *   get:
 *     summary: Sabhi master types ki list
 *     tags: [MasterTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: MasterTypes list
 *   post:
 *     summary: Naya master type banao
 *     tags: [MasterTypes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 example: VISIT_PURPOSE
 *               name:
 *                 type: string
 *                 example: Visit Purpose
 *               description:
 *                 type: string
 *                 example: Purpose of visit
 *               is_global:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: MasterType created
 * /api/master-types/{id}:
 *   put:
 *     summary: MasterType update karo
 *     tags: [MasterTypes]
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
 *               name:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: MasterType updated
 *   delete:
 *     summary: MasterType delete karo
 *     tags: [MasterTypes]
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
 *         description: MasterType deleted
 */

// GET — MasterTypes list
router.get('/', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'super_admin') {
            // Super admin sabhi dekhe
            query = {};
        } else {
            // Tenant admin → global + apne tenant ke types
            query = {
                $or: [
                    { is_global: true },
                    { tenant_id: req.user.tenant_id }
                ]
            };
        }

        const masterTypes = await MasterType.find(query);
        res.json({ success: true, data: masterTypes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Naya MasterType
router.post('/', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        // Tenant admin sirf apne tenant ke liye bana sakta hai
        if (req.user.role === 'tenant_admin') {
            req.body.tenant_id = req.user.tenant_id;
            req.body.is_global = false; // Tenant admin global type nahi bana sakta!
        }

        const masterType = new MasterType(req.body);
        await masterType.save();
        res.status(201).json({ success: true, data: masterType });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT — MasterType update
router.put('/:id', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        const masterType = await MasterType.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!masterType) return res.status(404).json({ success: false, message: 'MasterType not found!' });
        res.json({ success: true, data: masterType });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — MasterType delete
router.delete('/:id', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const masterType = await MasterType.findByIdAndDelete(req.params.id);
        if (!masterType) return res.status(404).json({ success: false, message: 'MasterType not found!' });
        res.json({ success: true, message: 'MasterType deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;