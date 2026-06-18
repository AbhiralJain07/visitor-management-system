const mongoose = require('mongoose');

const masterTypeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    is_global: {
        type: Boolean,
        default: false
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        default: null  // null = global (sabke liye)
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Same code ek tenant mein dobara nahi hoga
masterTypeSchema.index({ tenant_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('MasterType', masterTypeSchema);