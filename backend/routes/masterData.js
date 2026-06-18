const express = require('express');
const router = express.Router();
const MasterData = require('../models/MasterData');
const MasterType = require('../models/MasterType');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/master-data:
 *   get:
 *     summary: All master data list fetched successfully!
 *     tags: [MasterData]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         example: VISIT_PURPOSE
 *         description: Filter by MasterType code
 *     responses:
 *       200:
 *         description: All master data list fetched successfully!
 *   post:
 *     summary: Create new master data
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
 *         description: MasterData created successfully!    
 * /api/master-data/{id}:
 *   put:
 *     summary:  Update master data
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
 *         description: MasterData updated successfully!
 *   delete:
 *     summary: Delete master data
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
 *         description: MasterData deleted successfully!
 */

// GET — All master data
router.get('/', auth, checkRole('super_admin', 'tenant_admin', 'receptionist'), async (req, res) => {
    try {
        let query = {};

        // Filter by type (optional)
        if (req.query.type) {
            const masterType = await MasterType.findOne({ code: req.query.type });
            if (masterType) {
                query.master_type_id = masterType._id;
            }
        }

        // Filter by role
        if (req.user.role === 'super_admin') {
            // See all data
        } else {
            // Global + their own data
            query.$or = [
                { is_global: true },
                { tenant_id: req.user.tenant_id }
            ];
        }

        const masterData = await MasterData.find(query)
            .populate('master_type_id', 'name code')
            .sort({ sort_order: 1 });

        // Return name in user's language
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

        res.json({ success: true, message: 'All master data list fetched successfully!', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Create new master data
router.post('/', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        if (req.user.role === 'tenant_admin') {
            req.body.tenant_id = req.user.tenant_id;
            req.body.is_global = false;
        }

        const masterData = new MasterData(req.body);
        await masterData.save();
        res.status(201).json({ success: true, message: 'MasterData created successfully!', data: masterData });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT — Update master data
router.put('/:id', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        const masterData = await MasterData.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!masterData) return res.status(404).json({ success: false, message: 'MasterData not found!' });
        res.json({ success: true, message: 'MasterData updated successfully!', data: masterData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — Delete master data
router.delete('/:id', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const masterData = await MasterData.findByIdAndDelete(req.params.id);
        if (!masterData) return res.status(404).json({ success: false, message: 'MasterData not found!' });
        res.json({ success: true, message: 'MasterData deleted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;