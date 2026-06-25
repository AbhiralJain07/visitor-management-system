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
    // ID document fields — optional as per business requirement
    id_type: {
        type: String,
        enum: ['Aadhaar', 'PAN', 'Passport', 'Driving License', 'Voter ID', 'Other'],
        default: 'Aadhaar'
    },
    id_number: {
        type: String,
        required: false,  // Optional — can be skipped at reception
        default: ''
    },
    face_data: {
        type: String,
        default: ''
    },
    is_blacklisted: {
        type: Boolean,
        default: false
    },
    blacklist_reason: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    company_name: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
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