const express = require('express');
const router = express.Router();
const Office = require('../models/Office');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/offices:
 *   get:
 *     summary: All offices list with search, filter, pagination
 *     tags: [Offices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for name, city, or address
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false, all]
 *         description: Filter by active status
 *         example: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: All offices list fetched successfully!
 *       500:
 *         description: Internal server error
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
 *             required:
 *               - name
 *               - city
 *               - address
 *             properties:
 *               name:
 *                 type: string
 *                 example: Head Office
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               address:
 *                 type: string
 *                 example: Bandra Kurla Complex, Bandra East
 *               is_active:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *     responses:
 *       201:
 *         description: Office created successfully!
 *       400:
 *         description: Invalid input or missing fields
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
 *         description: Office ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               city:
 *                 type: string
 *               address:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Office updated successfully!
 *       404:
 *         description: Office not found or unauthorized
 *       500:
 *         description: Internal server error
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
 *         description: Office ID to delete
 *     responses:
 *       200:
 *         description: Office deleted successfully!
 *       404:
 *         description: Office not found or unauthorized
 *       500:
 *         description: Internal server error
 */

// GET — All offices with search, filter, pagination
router.get('/', auth, checkRole('tenant_admin', 'manager', 'receptionist', 'employee', 'security'), async (req, res) => {
    try {
        const { search, is_active, page = 1, limit = 50 } = req.query;

        const query = { tenant_id: req.user.tenant_id };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { city: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
            ];
        }

        if (is_active !== undefined && is_active !== 'all') {
            query.is_active = is_active === 'true' || is_active === true;
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        const [offices, total] = await Promise.all([
            Office.find(query)
                .skip(skip)
                .limit(limitNum)
                .sort({ createdAt: -1 }),
            Office.countDocuments(query)
        ]);

        res.json({
            success: true,
            message: 'All offices list fetched successfully!',
            data: offices,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Create new office
router.post('/', auth, checkRole('tenant_admin', 'manager'), async (req, res) => {
    try {
        const office = new Office({
            ...req.body,
            tenant_id: req.user.tenant_id
        });
        await office.save();
        res.status(201).json({
            success: true,
            message: 'Office created successfully!',
            data: office
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT — Update office
router.put('/:id', auth, checkRole('tenant_admin', 'manager'), async (req, res) => {
    try {
        delete req.body.tenant_id;

        const office = await Office.findOneAndUpdate(
            { _id: req.params.id, tenant_id: req.user.tenant_id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!office) {
            return res.status(404).json({ success: false, message: 'Office not found or unauthorized!' });
        }

        res.json({ success: true, message: 'Office updated successfully!', data: office });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — Delete office
router.delete('/:id', auth, checkRole('tenant_admin', 'manager'), async (req, res) => {
    try {
        const office = await Office.findOneAndDelete({
            _id: req.params.id,
            tenant_id: req.user.tenant_id
        });

        if (!office) {
            return res.status(404).json({ success: false, message: 'Office not found or unauthorized!' });
        }

        res.json({ success: true, message: 'Office deleted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
