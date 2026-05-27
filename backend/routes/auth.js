const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// REGISTER — Naya employee banao
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