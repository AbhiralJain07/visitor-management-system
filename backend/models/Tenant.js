const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: '' },
    
    // Frontend ke liye add karo
    contactPerson: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    country: { type: String, default: 'India' },
    
    plan: {
        type: String,
        enum: ['basic', 'standard', 'premium', 'enterprise'],
        default: 'basic'
    },
    
    maxUsers: { type: Number, default: 50 },

    activeUsers: { type: Number, default: 0 },
    
    status: {
        type: String,
        enum: ['Active', 'Suspended', 'Pending'],
        default: 'Active'
    },
    
    is_active: { type: Boolean, default: true },
    logo_url: { type: String, default: '' },
}, { timestamps: true }
);

module.exports = mongoose.model('Tenant', tenantSchema);