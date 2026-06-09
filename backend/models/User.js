const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'employee'
    },
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        default: null  // null = super_admin
    },
    realm_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Realm',
        default: null  // null = sabhi realms access
    },
    telegram_id: {
        type: String,
        default: ''
    },
    department: {
        type: String,
        default: ''
    },
    is_active: {
        type: Boolean,
        default: true
    },
    language: {
        type: String,
        enum: ['en', 'hi', 'ta', 'te', 'mr'],
        default: 'en'
    },
    last_login: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Email ek tenant mein unique hogi
userSchema.index({ tenant_id: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);