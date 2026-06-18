const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
    visitor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visitor',
        required: true
    },
    host_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    office_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Office',
        required: true
    },
    purpose: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    reason: {
        type: String,
        default: ''
    },
    check_in: {
        type: Date,
        default: Date.now
    },
    check_out: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'exited'],
        default: 'pending'
    },
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

module.exports = mongoose.model('Visit', visitSchema);
