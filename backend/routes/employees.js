const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: Sabhi employees ki list
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employees list
 *   post:
 *     summary: Naya employee banao
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *               department:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created
 * /api/employees/{id}:
 *   put:
 *     summary: Employee update karo
 *     tags: [Employees]
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
 *         description: Employee updated
 *   delete:
 *     summary: Employee delete karo
 *     tags: [Employees]
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
 *         description: Employee deleted
 */

router.get('/', auth, checkRole('admin'), async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json({ success: true, data: employees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.post('/', auth, checkRole('admin'), async (req, res) => {
    try {
        const employee = new Employee(req.body);
        await employee.save();
        res.status(201).json({ success: true, data: employee });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.put('/:id', auth, checkRole('admin'), async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found!' });
        res.json({ success: true, data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found!' });
        res.json({ success: true, message: 'Employee deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;