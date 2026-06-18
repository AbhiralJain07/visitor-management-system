const mongoose = require('mongoose');

const realmSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        uppercase: true
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true
    },
    address: {
        type: String,
        default: ''
    },
    city: {
        type: String,
        default: ''
    },
    is_active: {
        type: Boolean,
        default: true
    },
    timezone: {
        type: String,
        default: 'Asia/Kolkata'
    }
}, {
    timestamps: true
});

// Ek tenant mein same code nahi hoga
realmSchema.index({ tenant_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Realm', realmSchema);
