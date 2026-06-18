const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const { auth, checkRole } = require('../middleware/auth');
const { upload, uploadPhoto } = require('../cloudinary');
const { getEmbedding, compareFaces } = require('../faceService');
const { createAuditLog } = require('../middleware/auditLog'); 

/**
 * @swagger
 * /api/visitors:
 *   get:
 *     summary: Sabhi visitors ki list
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Visitors list
 *   post:
 *     summary: Naya visitor banao
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phone
 *               - id_number
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ramesh Kumar
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               id_number:
 *                 type: string
 *                 example: AADHAR123456
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Visitor created
 * /api/visitors/identify:
 *   post:
 *     summary: Face se visitor pehchano
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Visitor identified
 * /api/visitors/{id}:
 *   put:
 *     summary: Visitor update karo
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6a16a9b2dab081b48816a5e4
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Ramesh Kumar
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               is_blacklisted:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Visitor updated
 *   delete:
 *     summary: Visitor delete karo
 *     tags: [Visitors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: 6a16a9b2dab081b48816a5e4
 *     responses:
 *       200:
 *         description: Visitor deleted
 */

// GET — Sabhi visitors
// GET — Sabhi visitors (Search + Filter + Pagination)
router.get('/', auth, checkRole('super_admin', 'tenant_admin', 'receptionist'), async (req, res) => {
    try {
        let query = {};

        // Tenant filter
        if (req.user.role !== 'super_admin') {
            query.tenant_id = req.user.tenant_id;
        }

        if (req.user.realm_id) {
            query.realm_id = req.user.realm_id;
        }

        // Search — name ya phone se dhundho
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { phone: { $regex: req.query.search, $options: 'i' } },
                { id_number: { $regex: req.query.search, $options: 'i' } }
            ];
        }

        // Filter — blacklisted
        if (req.query.is_blacklisted !== undefined) {
            query.is_blacklisted = req.query.is_blacklisted === 'true';
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Total count
        const total = await Visitor.countDocuments(query);

        const visitors = await Visitor.find(query)
            .populate('tenant_id', 'name code')
            .populate('realm_id', 'name code')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            data: visitors,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST — Naya visitor
router.post(
    '/',
    auth,
    checkRole('super_admin', 'tenant_admin', 'receptionist'),
    upload.single('photo'),
    async (req, res) => {
        try {
            let photo_url = '';
            let face_data = '';

            if (req.file) {
                photo_url = await uploadPhoto(req.file.buffer);

                const base64Image = req.file.buffer.toString('base64');
                const faceResult = await getEmbedding(base64Image);

                if (faceResult.success) {
                    face_data = JSON.stringify(faceResult.embedding);
                }
            }

            // ==========================
            // Request Body Sanitization
            // ==========================
            const { name, phone, id_number } = req.body;

            const visitorName = name ? name.trim() : '';
            const visitorPhone = phone ? phone.trim() : '';
            const visitorIdNumber = id_number ? id_number.trim() : '';

            console.log('Body:', req.body);
            console.log('File:', req.file ? 'File received' : 'No file');

            // Optional Validation
            if (!visitorName || !visitorPhone || !visitorIdNumber) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, phone and ID number are required'
                });
            }

            // ==========================
            // Audit Log
            // ==========================
            await createAuditLog({
                user_id: req.user.id,
                user_email: req.user.email,
                action: 'CREATE',
                module: 'visitor',
                description: `New visitor added: ${visitorName}`,
                ip_address: req.ip,
                status: 'success',
                tenant_id: req.user.tenant_id,
                metadata: {
                    visitor_name: visitorName,
                    phone: visitorPhone,
                    id_number: visitorIdNumber
                }
            });

            // ==========================
            // Create Visitor
            // ==========================
            const visitor = new Visitor({
                name: visitorName,
                phone: visitorPhone,
                id_number: visitorIdNumber,
                photo_url,
                face_data,
                tenant_id: req.user.tenant_id,
                realm_id: req.user.realm_id
            });

            await visitor.save();

            res.status(201).json({
                success: true,
                data: visitor
            });

        } catch (error) {
            console.error('Create Visitor Error:', error);

            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
);
// POST — Face recognition
router.post('/identify', auth, checkRole('super_admin', 'tenant_admin', 'receptionist'), upload.single('photo'), async (req, res) => {
    try {
        const base64Image = req.file.buffer.toString('base64');
        const faceResult = await getEmbedding(base64Image);

        if (!faceResult.success) {
            return res.status(400).json({
                success: false,
                message: 'Face not detected!'
            });
        }

        const newEmbedding = faceResult.embedding;

        let query = { face_data: { $ne: '' } };
        if (req.user.role !== 'super_admin') {
            query.tenant_id = req.user.tenant_id;
        }

        const visitors = await Visitor.find(query);

        let matchedVisitor = null;
        let highestSimilarity = 0;

        for (const visitor of visitors) {
            const storedEmbedding = JSON.parse(visitor.face_data);
            const result = await compareFaces(newEmbedding, storedEmbedding);
            if (result.match && result.similarity > highestSimilarity) {
                highestSimilarity = result.similarity;
                matchedVisitor = visitor;
            }
        }

        if (matchedVisitor) {
            if (matchedVisitor.is_blacklisted) {
                return res.json({
                    success: true,
                    found: true,
                    blacklisted: true,
                    visitor: matchedVisitor,
                    message: `⚠️ ALERT! ${matchedVisitor.name} blacklisted!`
                });
            }
            return res.json({
                success: true,
                found: true,
                similarity: highestSimilarity,
                visitor: matchedVisitor,
                message: `Welcome back ${matchedVisitor.name}! 👋`
            });
        }

        res.json({ success: true, found: false, message: 'New visitor found!' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT — Visitor update
router.put('/:id', auth, checkRole('super_admin', 'tenant_admin'), async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found!' });
        res.json({ success: true, data: visitor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE — Visitor delete
router.delete('/:id', auth, checkRole('super_admin'), async (req, res) => {
    try {
        const visitor = await Visitor.findByIdAndDelete(req.params.id);
        if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found!' });
        res.json({ success: true, message: 'Visitor deleted!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;