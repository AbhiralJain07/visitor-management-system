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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Visitor', visitorSchema);