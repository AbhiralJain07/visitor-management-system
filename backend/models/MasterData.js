const mongoose = require('mongoose');

const masterDataSchema = new mongoose.Schema({
    master_type_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MasterType',
        required: true
    },
    code: {
        type: String,
        required: true,
        uppercase: true
    },
    name: {
        type: String,
        required: true
    },
    // Localization ke liye
    translations: {
        hi: { type: String, default: '' },  // Hindi
        ta: { type: String, default: '' },  // Tamil
        te: { type: String, default: '' },  // Telugu
        mr: { type: String, default: '' },  // Marathi
    },
    sort_order: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    is_global: {
        type: Boolean,
        default: false
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

masterDataSchema.index({ master_type_id: 1, tenant_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('MasterData', masterDataSchema);