const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    },
    last_login: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving if it is modified
employeeSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('Employee', employeeSchema);
