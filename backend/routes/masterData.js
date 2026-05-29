const express = require('express');
const router = express.Router();
const MasterData = require('../models/MasterData');
const MasterType = require('../models/MasterType');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/master-data:
 *   get:
 *     summary: Sabhi master data ki list
 *     tags: [MasterData]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         example: VISIT_PURPOSE
 *         description: MasterType code se filter karo
 *     responses:
 *       200:
 *         description: MasterData list
 *   post:
 *     summary: Naya master data banao
 *     tags: [MasterData]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               master_type_id:
 *                 type: string
 *                 example: 6a16a9b2dab081b48816a5e4
 *               code:
 *                 type: string
 *                 example: MEETING
 *               name:
 *                 type: string
 *                 example: Meeting
 *               translations:
 *                 type: object
 *                 properties:
 *                   hi:
 *                     type: string
 *                     example: मीटिंग
 *                   ta:
 *                     type: string
 *                     example: சந்திப்பு
 *               sort_order:
 *                 type: number
 *                 example: 1
 *               is_global:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: MasterData created
 * /api/master-data/{id}:
 *   put:
 *     summary: MasterData update karo
 *     tags: [MasterData]
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
 *               translations:
 *                 type: object
 *               sort_order:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: MasterData updated
 *   delete:
 *     summary: MasterData delete karo
 *     tags: [MasterData]
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
 *         description: MasterData deleted
 */

// GET — MasterData list
router.get('/', auth, checkRole('super_admin', 'tenant_admin', 'receptionist'), async (req, res) => {
    try {
        let query = {};

        // Type se filter karo (optional)
        if (req.query.type) {
            const masterType = await MasterType.findOne({ code: req.query.type });
            if (masterType) {
                query.master_type_id = masterType._id;
            }
        }

        // Role ke hisaab se filter
        if (req.user.role === 'super_admin') {
            // Sabhi data
        } else {
            // Global + apne tenant ka data
            query.$or = [
                { is_global: true },
                { tenant_id: req.user.tenant_id }
            ];
        }

        const masterData = await MasterData.find(query)
            .populate('master_type_id', 'name code')
            .sort({ sort_order: 1 });

        // Language ke hisaab se name return karo
        const lang = req.user.language || 'en';
        const result = masterData.map(item => {
            const obj = item.toObject();
            if (lang !== 'en' && obj.translations && obj.translations[lang]) {
                obj.display_name = obj.translations[lang];
            } else {
                obj.display_name = obj.name;
            }
            return obj;
        });

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Naya MasterData
router.post('/', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        if (req.user.role === 'tenant_admin') {
            req.body.tenant_id = req.user.tenant_id;
            req.body.is_global = false;
        }

        const masterData = new MasterData(req.body);
        await masterData.save();
        res.status(201).json({ success: true, data: masterData });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT — MasterData update
router.put('/:id', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        const masterData = await MasterData.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!masterData) return res.status(404).json({ success: false, message: 'MasterData nahi mila!' });
        res.json({ success: true, data: masterData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — MasterData delete
router.delete('/:id', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const masterData = await MasterData.findByIdAndDelete(req.params.id);
        if (!masterData) return res.status(404).json({ success: false, message: 'MasterData nahi mila!' });
        res.json({ success: true, message: 'MasterData delete ho gaya!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;