const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Naya employee register karo
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
 *                 enum: [admin, receptionist, employee]
 *                 example: admin
 *               department:
 *                 type: string
 *                 example: IT
 *     responses:
 *       201:
 *         description: Register successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Employee register ho gaya!
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
 *                 example: abhiral@vms.com
 *               password:
 *                 type: string
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiJ9...
 *                 employee:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                       example: Abhiral Jain
 *                     email:
 *                       type: string
 *                       example: abhiral@vms.com
 *                     role:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Email ya password galat hai
 *       500:
 *         description: Server error
 */

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;

        // Pehle check karo — email already hai kya?
        const existingEmployee = await Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(400).json({
                success: false,
                message: 'email already registered!'
            });
        }

        // Password encrypt karo
        const hashedPassword = await bcrypt.hash(password, 10);

        // Naya employee banao
        const employee = new Employee({
            name,
            email,
            password: hashedPassword,
            role,
            department
        });

        await employee.save();

        res.status(201).json({
            success: true,
            message: 'Employee registered!'
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

        // Employee dhundo
        const employee = await Employee.findOne({ email });
        if (!employee) {
            return res.status(400).json({
                success: false,
                message: 'Email or Password is wrong!'
            });
        }

        // Password check karo
        const isMatch = await bcrypt.compare(password, employee.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Email or Password is wrong!'
            });
        }

        // Token banao
        const token = jwt.sign(
            { id: employee._id, role: employee.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            employee: {
                id: employee._id,
                name: employee.name,
                email: employee.email,
                role: employee.role
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