const express = require('express');
const router = express.Router();
const Tenant = require('../models/Tenant');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/tenants/public:
 *   get:
 *     summary: Get active tenants without auth (for login forms)
 *     tags: [Tenants]
 *     responses:
 *       200:
 *         description: Active tenants list fetched successfully
 *       500:
 *         description: Internal server error
 * 
 * /api/tenants:
 *   get:
 *     summary: All tenants list with search, status filter, pagination
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for name, code, email, or contact person
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [All, Active, Suspended, Pending]
 *         description: Filter by status
 *         example: Active
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
 *           default: 20
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Tenants list fetched successfully
 *       500:
 *         description: Internal server error
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
 *             required:
 *               - name
 *               - code
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: Evolvit Club
 *               code:
 *                 type: string
 *                 example: EVOLVIT
 *               email:
 *                 type: string
 *                 example: admin@evolvit.com
 *               phone:
 *                 type: string
 *                 example: "+919999999999"
 *               contactPerson:
 *                 type: string
 *                 example: John Doe
 *               gstNumber:
 *                 type: string
 *                 example: 27AAAAA1111A1Z1
 *               address:
 *                 type: string
 *                 example: Tech Park, Sector 5
 *               city:
 *                 type: string
 *                 example: Pune
 *               country:
 *                 type: string
 *                 default: India
 *               plan:
 *                 type: string
 *                 enum: [basic, standard, premium, enterprise]
 *                 default: basic
 *               maxUsers:
 *                 type: number
 *                 default: 50
 *               status:
 *                 type: string
 *                 enum: [Active, Suspended, Pending]
 *                 default: Active
 *               is_active:
 *                 type: boolean
 *                 default: true
 *               logo_url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tenant created successfully
 *       400:
 *         description: Bad request
 *       409:
 *         description: Tenant with code or email already exists
 * 
 * /api/tenants/{id}:
 *   get:
 *     summary: Get tenant details by ID
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant ID
 *     responses:
 *       200:
 *         description: Tenant details fetched successfully
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Internal server error
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
 *         description: Tenant ID to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               gstNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               plan:
 *                 type: string
 *                 enum: [basic, standard, premium, enterprise]
 *               maxUsers:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Active, Suspended, Pending]
 *               is_active:
 *                 type: boolean
 *               logo_url:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Internal server error
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
 *         description: Tenant ID to delete
 *     responses:
 *       200:
 *         description: Tenant deleted successfully
 *       404:
 *         description: Tenant not found
 *       500:
 *         description: Internal server error
 */

// GET /api/tenants/public — Auth ke bina (login form ke liye)
router.get('/public', async (req, res) => {
    try {
        const tenants = await Tenant.find({ is_active: true })
            .select('name _id')
            .sort({ name: 1 });
        res.json({ success: true, data: tenants });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/tenants — All tenants with search, status filter, pagination
router.get('/', auth, checkRole('super_admin', 'auditor'), async (req, res) => {
    try {
        const { search, status, page = 1, limit = 20 } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { contactPerson: { $regex: search, $options: 'i' } },
            ];
        }

        if (status && status !== 'All') {
            query.status = status;
        }

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        const skip = (pageNum - 1) * limitNum;

        const [tenants, total] = await Promise.all([
            Tenant.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
            Tenant.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: tenants,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/tenants/:id
router.get('/:id', auth, checkRole('super_admin', 'auditor'), async (req, res) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found!' });
        res.json({ success: true, data: tenant });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/tenants
router.post('/', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const existing = await Tenant.findOne({ $or: [{ code: req.body.code?.toUpperCase() }, { email: req.body.email }] });
        if (existing) {
            return res.status(409).json({ success: false, message: 'A tenant with this code or email already exists.' });
        }
        const tenant = new Tenant(req.body);
        await tenant.save();
        res.status(201).json({ success: true, data: tenant });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT /api/tenants/:id
router.put('/:id', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found!' });
        res.json({ success: true, data: tenant });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/tenants/:id
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
