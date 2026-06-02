const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: All tenants list 
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenants list
 *   post:
 *     summary: Create new tenant
 *     tags: [Tenants]
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
 *                 example: TCS
 *               code:
 *                 type: string
 *                 example: TCS
 *               email:
 *                 type: string
 *                 example: admin@tcs.com
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               plan:
 *                 type: string
 *                 enum: [basic, professional, enterprise]
 *                 example: basic, professional, enterprise (anyone can be selected)
 *               address:
 *                 type: string
 *                 example: TCS House, Raveline Street
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               country:
 *                 type: string
 *                 example: India
 *     responses:
 *       201:
 *         description: Tenant created
 * /api/tenants/{id}:
 *   put:
 *     summary: Update tenant
 *     tags: [Tenants]
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
 *                 example: TCS Ltd
 *               plan:
 *                 type: string
 *                 enum: [basic, professional, enterprise]
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Tenant updated
 *   delete:
 *     summary: Delete tenant
 *     tags: [Tenants]
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
 *         description: Tenant deleted
 */

// GET — All tenants
router.get('/', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const tenants = await Tenant.find();
        res.json({ success: true, data: tenants });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Create new tenant
router.post('/', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const tenant = new Tenant(req.body);
        await tenant.save();
        res.status(201).json({ success: true, data: tenant });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// GET — Get single tenant
router.get('/:id', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found!' });
        res.json({ success: true, data: tenant });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT — Update tenant
router.put('/:id', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found!' });
        res.json({ success: true, data: tenant });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — Delete tenant successfully!
router.delete('/:id', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const tenant = await Tenant.findByIdAndDelete(req.params.id);
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found!' });
        res.json({ success: true, message: 'Tenant deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;