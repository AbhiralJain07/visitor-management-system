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
    phone: {
        type: String,
        default: ''
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
        enum: ['admin', 'manager', 'receptionist', 'security', 'employee'],
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
