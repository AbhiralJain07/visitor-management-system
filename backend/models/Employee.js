const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    telegram_id: {
        type: String,
        default: ''
    },
    department: {
        type: String,
        default: ''
    },
    role: {
        type: String,
        enum: ['admin', 'receptionist', 'employee'],
        default: 'employee'
    },
    office_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Office'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Employee', employeeSchema);