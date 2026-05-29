const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Naya user register karo
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: Abhiral Jain
 *               email:
 *                 type: string
 *                 example: abhiral@vms.com
 *               password:
 *                 type: string
 *                 example: admin123
 *               role:
 *                 type: string
 *                 enum: [tenant_admin, receptionist, employee]
 *                 example: tenant_admin
 *               department:
 *                 type: string
 *                 example: IT
 *               tenant_id:
 *                 type: string
 *                 example: 6a16a9b2dab081b48816a5e4
 *               realm_id:
 *                 type: string
 *                 example: 6a16a9b2dab081b48816a5e4
 *     responses:
 *       201:
 *         description: Register successful
 *       400:
 *         description: Email already registered
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login karo aur token lo
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: superadmin@vms.com
 *               password:
 *                 type: string
 *                 example: super@admin123
 *     responses:
 *       200:
 *         description: Login successful with token
 *       400:
 *         description: Email ya password galat hai
 *       500:
 *         description: Server error
 */

// SUPER ADMIN REGISTER — Sirf ek baar use karo!
router.post('/super-admin/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existing = await User.findOne({ role: 'super_admin' });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Super Admin already exist karta hai!'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const superAdmin = new User({
            name,
            email,
            password: hashedPassword,
            role: 'super_admin',
            tenant_id: null,
            realm_id: null
        });

        await superAdmin.save();

        res.status(201).json({
            success: true,
            message: 'Super Admin ban gaya! 👑'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// REGISTER — Naya user banao
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, department, tenant_id, realm_id } = req.body;

        // Email already exist karti hai kya?
        const existingUser = await User.findOne({ email, tenant_id });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Yeh email already registered hai!'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            department,
            tenant_id,
            realm_id
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'User register ho gaya!'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// LOGIN — Token lo
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // User dhundo — dono models mein check karo
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Email ya password galat hai!'
            });
        }

        // Password check karo
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Email ya password galat hai!'
            });
        }

        // Last login update karo
        user.last_login = new Date();
        await user.save();

        // Token banao — tenant_id aur realm_id bhi daalo!
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                tenant_id: user.tenant_id,
                realm_id: user.realm_id,
                language: user.language
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenant_id: user.tenant_id,
                realm_id: user.realm_id,
                language: user.language
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;