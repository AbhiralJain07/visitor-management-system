const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({
    user_id,
    user_email,
    action,
    module,
    description,
    ip_address,
    status,
    tenant_id,
    metadata
}) => {
    try {
        await AuditLog.create({
            user_id,
            user_email,
            action,
            module,
            description,
            ip_address,
            status,
            tenant_id,
            metadata
        });
    } catch (error) {
        console.log('Audit log error:', error.message);
    }
};

module.exports = { createAuditLog };