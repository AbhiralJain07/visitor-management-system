const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    photo_url: {
        type: String,
        default: ''
    },
    id_number: {
        type: String,
        required: true
    },
    face_data: {
        type: String,
        default: ''
    },
    is_blacklisted: {
        type: Boolean,
        default: false
    },
    // Multi-tenancy fields
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        default: null
    },
    realm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Realm',
        default: null
    }
}, {
    timestamps: true
});

// Ek tenant mein same phone number unique hoga
visitorSchema.index({ tenant_id: 1, phone: 1 }, { unique: true });

module.exports = mongoose.model('Visitor', visitorSchema);