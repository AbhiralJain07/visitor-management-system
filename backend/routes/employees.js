const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: All employees list fetched successfully!
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All employees list fetched successfully!
 *   post:
 *     summary: Create new employee
 *     tags: [Employees]
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
 *               - email
 *               - password
 *               - role
 *               - department
 *               - office_id
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
 *               office_id:
 *                 type: string
 *                 example: 6a16a9b2dab081b48816a5e4
 *     responses:
 *       201:
 *         description: Employee created successfully!
 * /api/employees/{id}:
 *   put:
 *     summary: Update employee
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
 *               office_id:
 *                 type: string
 *                 example: 6a16a9b2dab081b48816a5e4
 *     responses:
 *       200:
 *         description: Employee updated successfully!
 *   delete:
 *     summary: Delete employee
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
 *         description: Employee deleted successfully!
 */

// GET — All employees
router.get('/', auth, checkRole('admin'), async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json({ success: true, message: 'All employees list fetched successfully!', data: employees });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Create new employee
router.post('/', auth, checkRole('admin'), async (req, res) => {
    try {
        const employee = new Employee(req.body);
        await employee.save();
        res.status(201).json({ success: true, message: 'Employee created successfully!', data: employee });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT — Update employee
router.put('/:id', auth, checkRole('admin'), async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found!' });
        res.json({ success: true, message: 'Employee updated successfully!', data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — Delete employee
router.delete('/:id', auth, checkRole('admin'), async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found!' });
        res.json({ success: true, message: 'Employee deleted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;