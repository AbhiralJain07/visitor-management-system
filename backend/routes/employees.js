const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee'); 
const auth = require('../middleware/auth');

router.get('/', auth , async (req, res) => {
    try {
        const employees = await Employee.find(); 
        res.json({
            success: true,
            data: employees
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.post('/', auth , async (req, res) => {
    try {
        const employee = new Employee(req.body); 
        await employee.save();                    
        res.status(201).json({
            success: true,
            data: employee                        
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

// PUT — Employee update karo
router.put('/:id', auth, async (req, res) => {
    try {
        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found!'
            });
        }
        res.json({
            success: true,
            data: employee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// DELETE — Employee delete karo
router.delete('/:id', auth, async (req, res) => {
    try {
        const employee = await Employee.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found!'
            });
        }
        res.json({
            success: true,
            message: 'Employee deleted!'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


module.exports = router;