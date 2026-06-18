const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const MasterType = require('../models/MasterType');
const MasterData = require('../models/MasterData');
const Employee = require('../models/Employee');
const Visitor = require('../models/Visitor');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Universal search for super admin
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search query matching tenants, master types, or master data names/codes
 *     responses:
 *       200:
 *         description: List of search results matching the query
 *       500:
 *         description: Internal server error
 */

// GET /api/search?query=xxx — Universal search for super admin
router.get('/', auth, checkRole('super_admin', 'auditor', 'support_admin'), async (req, res) => {
    try {
        const { query = '' } = req.query;
        if (!query.trim()) return res.json({ success: true, data: [] });

        const regex = { $regex: query, $options: 'i' };
        const results = [];

        // Tenants
        const tenants = await Tenant.find({
            $or: [{ name: regex }, { code: regex }, { email: regex }]
        }).limit(5).select('name code email plan status');

        tenants.forEach(t => results.push({
            id: t._id,
            title: t.name,
            subtitle: `Tenant · Code: ${t.code} · Plan: ${t.plan || 'basic'}`,
            type: 'Tenant',
            link: '/super-admin/tenants',
            status: t.status,
        }));

        // MasterTypes
        const masterTypes = await MasterType.find({
            $or: [{ name: regex }, { code: regex }]
        }).limit(5);

        masterTypes.forEach(mt => results.push({
            id: mt._id,
            title: mt.name,
            subtitle: `Master Category · Code: ${mt.code}`,
            type: 'MasterType',
            link: '/super-admin/master-types',
            status: mt.is_active ? 'Active' : 'Inactive',
        }));

        // MasterData
        const masterData = await MasterData.find({
            $or: [{ name: regex }, { code: regex }]
        }).limit(5).populate('master_type_id', 'code');

        masterData.forEach(md => results.push({
            id: md._id,
            title: md.name,
            subtitle: `Master Record · Code: ${md.code} · Type: ${md.master_type_id?.code || ''}`,
            type: 'MasterData',
            link: '/super-admin/master-data',
            status: md.is_active ? 'Active' : 'Inactive',
        }));

        res.json({ success: true, data: results });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
