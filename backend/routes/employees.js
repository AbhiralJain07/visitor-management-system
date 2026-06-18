const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { auth, checkRole } = require('../middleware/auth');

/**
 * @swagger
 * /api/employees:
 *   get:
 *     summary: All employees list with search, filter, pagination
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for name, email, or department
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role (or 'all')
 *         example: employee
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department (or 'all')
 *         example: IT
 *       - in: query
 *         name: office_id
 *         schema:
 *           type: string
 *         description: Filter by office ID (or 'all')
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
 *         description: All employees list fetched successfully!
 *       500:
 *         description: Internal server error
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 example: jane.doe@example.com
 *               password:
 *                 type: string
 *                 example: securePassword123
 *               role:
 *                 type: string
 *                 enum: [admin, manager, receptionist, security, employee]
 *                 example: employee
 *               department:
 *                 type: string
 *                 example: HR
 *               office_id:
 *                 type: string
 *                 example: 6a16a9b2dab081b48816a5e4
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               telegram_id:
 *                 type: string
 *                 example: "123456789"
 *     responses:
 *       201:
 *         description: Employee created successfully!
 *       400:
 *         description: Invalid role or input
 *       409:
 *         description: Employee with email already exists
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
 *         description: Employee ID to update
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
 *                 enum: [admin, manager, receptionist, security, employee]
 *               department:
 *                 type: string
 *               office_id:
 *                 type: string
 *               phone:
 *                 type: string
 *               telegram_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee updated successfully!
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
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
 *         description: Employee ID to delete
 *     responses:
 *       200:
 *         description: Employee deleted successfully!
 *       404:
 *         description: Employee not found
 *       500:
 *         description: Internal server error
 */

// GET — All employees with search, filter, pagination
router.get('/', auth, checkRole('tenant_admin', 'manager'), async (req, res) => {
    try {
        const { search, role, department, office_id, page = 1, limit = 50 } = req.query;

        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { department: { $regex: search, $options: 'i' } },
            ];
        }

        if (role && role !== 'all') query.role = role;
        if (department && department !== 'all') query.department = { $regex: department, $options: 'i' };
        if (office_id && office_id !== 'all') query.office_id = office_id;

        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 50;
        const skip = (pageNum - 1) * limitNum;

        const [employees, total] = await Promise.all([
            Employee.find(query)
                .populate('office_id', 'name city address is_active')
                .skip(skip)
                .limit(limitNum)
                .sort({ createdAt: -1 })
                .select('-password'),
            Employee.countDocuments(query)
        ]);

        res.json({
            success: true,
            message: 'All employees list fetched successfully!',
            data: employees,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Create new employee
router.post('/', auth, checkRole('tenant_admin', 'manager'), async (req, res) => {
    try {
        const { name, email, password, role, department, office_id, phone, telegram_id } = req.body;

        // Password required check
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required to create an employee account.' });
        }

        // Validate role — expand allowed roles
        const allowedRoles = ['admin', 'manager', 'receptionist', 'security', 'employee'];
        if (role && !allowedRoles.includes(role)) {
            return res.status(400).json({ success: false, message: `Invalid role. Allowed: ${allowedRoles.join(', ')}` });
        }

        const existing = await Employee.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, message: 'An employee with this email already exists.' });
        }

        const employee = new Employee({ name, email, password, role, department, office_id, phone, telegram_id });
        await employee.save();

        const populated = await Employee.findById(employee._id)
            .populate('office_id', 'name city address is_active')
            .select('-password');

        res.status(201).json({ success: true, message: 'Employee created successfully!', data: populated });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// PUT — Update employee
router.put('/:id', auth, checkRole('tenant_admin', 'manager'), async (req, res) => {
    try {
        // Never update password via this endpoint — remove it if accidentally sent
        const { password, ...updateData } = req.body;

        const employee = await Employee.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
            .populate('office_id', 'name city address is_active')
            .select('-password');

        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found!' });
        res.json({ success: true, message: 'Employee updated successfully!', data: employee });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — Delete employee
router.delete('/:id', auth, checkRole('tenant_admin', 'manager'), async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found!' });
        res.json({ success: true, message: 'Employee deleted successfully!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
