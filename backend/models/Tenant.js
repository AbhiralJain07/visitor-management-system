const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        default: ''
    },
    plan: {
        type: String,
        enum: ['basic', 'professional', 'enterprise'],
        default: 'basic'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    logo_url: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    country: {
        type: String,
        default: 'India'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Tenant', tenantSchema);