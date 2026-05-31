const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    user_email: {
        type: String,
        default: ''
    },
    action: {
        type: String,
        required: true
        // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW
    },
    module: {
        type: String,
        required: true
        // visitor, visit, user, tenant, realm
    },
    description: {
        type: String,
        default: ''
    },
    ip_address: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['success', 'failed'],
        default: 'success'
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);