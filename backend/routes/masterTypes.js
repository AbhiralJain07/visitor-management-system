const express = require('express');
const router = express.Router();
const MasterType = require('../models/MasterType');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/master-types:
 *   get:
 *     summary: All master types list
 *     tags: [MasterTypes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All master types list
 *   post:
 *     summary: Create new master type
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
 *         description: Master type created successfully!
 * /api/master-types/{id}:
 *   put:
 *     summary: Update master type
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
 *         description: Master type updated successfully!
 *   delete:
 *     summary: Delete master type
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
 *         description: Master type deleted successfully!
 */

// GET — All master types
router.get('/', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'super_admin') {
            // Super admin see all
            query = {};
        } else {
            // Tenant admin → global + their own types
            query = {
                $or: [
                    { is_global: true },
                    { tenant_id: req.user.tenant_id }
                ]
            };
        }

        const masterTypes = await MasterType.find(query);
        res.json({ success: true, message: 'All master types list fetched successfully!', data: masterTypes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Create new master type
router.post('/', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        // Tenant admin can only create master types in their own tenant
        if (req.user.role === 'tenant_admin') {
            req.body.tenant_id = req.user.tenant_id;
            req.body.is_global = false; // Tenant admin can't create global types!
        }

        const masterType = new MasterType(req.body);
        await masterType.save();
        res.status(201).json({ success: true, message: 'Master type created successfully!', data: masterType });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT — Update master type
router.put('/:id', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        const masterType = await MasterType.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!masterType) return res.status(404).json({ success: false, message: 'Master type not found!' });
        res.json({ success: true, message: 'Master type updated successfully!', data: masterType });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — Delete master type
router.delete('/:id', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const masterType = await MasterType.findByIdAndDelete(req.params.id);
        if (!masterType) return res.status(404).json({ success: false, message: 'Master type not found!' });
        res.json({ success: true, message: 'Master type deleted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;