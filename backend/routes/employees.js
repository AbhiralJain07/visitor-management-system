const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: list of Employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employees list
 *   post:
 *     summary: create new employee
 *     tags: [Employees]
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
 *                 example: rahul@vms.com
 *               password:
 *                 type: string
 *                 example: rahul123
 *               role:
 *                 type: string
 *                 enum: [admin, receptionist, employee]
 *                 example: employee
 *               department:
 *                 type: string
 *                 example: IT
 *     responses:
 *       201:
 *         description: employee created
 * /api/employees/{id}:
 *   put:
 *     summary: update employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6a16a9b2dab081b48816a5e4
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
 *                 example: rahul@vms.com
 *               telegram_id:
 *                 type: string
 *                 example: "7905910620"
 *               department:
 *                 type: string
 *                 example: IT
 *               role:
 *                 type: string
 *                 enum: [admin, receptionist, employee]
 *                 example: admin
 *     responses:
 *       200:
 *         description: employee updated
 *   delete:
 *     summary: delete employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6a16a9b2dab081b48816a5e4
 *     responses:
 *       200:
 *         description: employee deleted
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