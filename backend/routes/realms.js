const express = require('express');
const router = express.Router();
const Realm = require('../models/Realm');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/realms:
 *   get:
 *     summary: Sabhi realms ki list
 *     tags: [Realms]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Realms list
 *   post:
 *     summary: Naya realm banao
 *     tags: [Realms]
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
 *               code:
 *                 type: string
 *                 example: DEL
 *               tenant_id:
 *                 type: string
 *                 example: 6a16a9b2dab081b48816a5e4
 *               address:
 *                 type: string
 *                 example: Connaught Place
 *               city:
 *                 type: string
 *                 example: Delhi
 *               timezone:
 *                 type: string
 *                 example: Asia/Kolkata
 *     responses:
 *       201:
 *         description: Realm created
 * /api/realms/{id}:
 *   put:
 *     summary: Realm update karo
 *     tags: [Realms]
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
 *                 example: Delhi HQ Updated
 *               is_active:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Realm updated
 *   delete:
 *     summary: Realm delete karo
 *     tags: [Realms]
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
 *         description: Realm deleted
 */

// GET — Sabhi realms
router.get('/', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        let query = {};

        // Super admin sabhi dekhe, tenant admin sirf apne
        if (req.user.role !== 'super_admin') {
            query.tenant_id = req.user.tenant_id;
        }

        const realms = await Realm.find(query).populate('tenant_id', 'name code');
        res.json({ success: true, data: realms });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Naya realm
router.post('/', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        // Tenant admin sirf apne tenant mein realm bana sakta hai
        if (req.user.role === 'tenant_admin') {
            req.body.tenant_id = req.user.tenant_id;
        }

        const realm = new Realm(req.body);
        await realm.save();
        res.status(201).json({ success: true, data: realm });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// GET — Single realm
router.get('/:id', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        const realm = await Realm.findById(req.params.id).populate('tenant_id', 'name code');
        if (!realm) return res.status(404).json({ success: false, message: 'Realm not found!' });
        res.json({ success: true, data: realm });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT — Realm update
router.put('/:id', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        const realm = await Realm.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!realm) return res.status(404).json({ success: false, message: 'Realm not found!' });
        res.json({ success: true, data: realm });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — Realm delete
router.delete('/:id', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const realm = await Realm.findByIdAndDelete(req.params.id);
        if (!realm) return res.status(404).json({ success: false, message: 'Realm not found!' });
        res.json({ success: true, message: 'Realm deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;