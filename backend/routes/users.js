const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Users ki list
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list
 *   post:
 *     summary: Naya user banao
 *     tags: [Users]
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
 *                 example: Rahul Sharma
 *               email:
 *                 type: string
 *                 example: rahul@tcs.com
 *               password:
 *                 type: string
 *                 example: rahul123
 *               role:
 *                 type: string
 *                 enum: [tenant_admin, receptionist, employee]
 *                 example: employee
 *               tenant_id:
 *                 type: string
 *                 example: 6a16a9b2dab081b48816a5e4
 *               realm_id:
 *                 type: string
 *                 example: 6a16a9b2dab081b48816a5e4
 *               department:
 *                 type: string
 *                 example: IT
 *               language:
 *                 type: string
 *                 enum: [en, hi, ta, te, mr]
 *                 example: en
 *     responses:
 *       201:
 *         description: User created
 * /api/users/{id}:
 *   put:
 *     summary: User update karo
 *     tags: [Users]
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
 *               role:
 *                 type: string
 *                 enum: [tenant_admin, receptionist, employee]
 *               telegram_id:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *               language:
 *                 type: string
 *                 enum: [en, hi, ta, te, mr]
 *     responses:
 *       200:
 *         description: User updated
 *   delete:
 *     summary: User delete karo
 *     tags: [Users]
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
 *         description: User deleted
 */

// GET — Users list
router.get('/', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        let query = {};

        // Tenant admin sirf apne users dekhe
        if (req.user.role === 'tenant_admin') {
            query.tenant_id = req.user.tenant_id;
        }

        // Realm filter (agar realm_id hai)
        if (req.user.realm_id) {
            query.realm_id = req.user.realm_id;
        }

        const users = await User.find(query)
            .select('-password') // Password mat bhejo!
            .populate('tenant_id', 'name code')
            .populate('realm_id', 'name code');

        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Naya user
router.post('/', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        const { name, email, password, role, tenant_id, realm_id, department, language } = req.body;

        // Tenant admin sirf apne tenant mein user bana sakta hai
        const finalTenantId = req.user.role === 'tenant_admin'
            ? req.user.tenant_id
            : tenant_id;

        // Email already exist karti hai kya?
        const existing = await User.findOne({ email, tenant_id: finalTenantId });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'email already registered!'
            });
        }

        // Password encrypt karo
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            tenant_id: finalTenantId,
            realm_id,
            department,
            language
        });

        await user.save();

        // Password response mein mat bhejo
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({ success: true, data: userResponse });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT — User update
router.put('/:id', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        // Password update hone se bachao
        delete req.body.password;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ success: false, message: 'User not found!' });
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — User delete
router.delete('/:id', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found!' });
        res.json({ success: true, message: 'User deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @swagger
 * /api/users/language:
 *   put:
 *     summary: Apni language updated
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [en, hi, ta, te, mr]
 *                 example: hi
 *     responses:
 *       200:
 *         description: Language updated
 */
router.put('/language', auth, async (req, res) => {
    try {
        const { language } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { language },
            { new: true }
        ).select('-password');

        res.json({
            success: true,
            message: `Language ${language} selected!`,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;