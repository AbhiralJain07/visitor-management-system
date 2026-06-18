const express = require('express');
const router = express.Router();
const MasterData = require('../models/MasterData');
const MasterType = require('../models/MasterType');
const { auth, checkRole } = require('../middleware/auth');

// Frontend expected shape:
// { _id, type: 'purpose'|'department', name, sortOrder, is_active, createdAt }
// Backend actual shape:
// { _id, master_type_id, code, name, sort_order, is_active, is_global, tenant_id }

const TYPE_MAP = {
  'VISIT_PURPOSE': 'purpose',
  'DEPARTMENT': 'department',
};

const REVERSE_TYPE_MAP = {
  'purpose': 'VISIT_PURPOSE',
  'department': 'DEPARTMENT',
};

// Ensure base MasterTypes exist
const ensureMasterTypes = async () => {
  const types = [
    { code: 'VISIT_PURPOSE', name: 'Visit Purpose', is_global: true },
    { code: 'DEPARTMENT', name: 'Department', is_global: true },
  ];
  for (const t of types) {
    await MasterType.findOneAndUpdate(
      { code: t.code, tenant_id: null },
      { $setOnInsert: t },
      { upsert: true, new: true }
    );
  }
};

// Map DB doc → frontend shape
const toFrontend = (item, typeCode) => ({
  _id: item._id,
  type: TYPE_MAP[typeCode] || 'purpose',
  name: item.name,
  sortOrder: item.sort_order || 0,
  is_active: item.is_active,
  is_global: item.is_global,
  createdAt: item.createdAt,
});

/**
 * @swagger
 * /api/custom-master-data:
 *   get:
 *     summary: Get list of custom master data (purpose and department)
 *     tags: [CustomMasterData]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Custom master data fetched successfully
 *   post:
 *     summary: Create new custom master data item
 *     tags: [CustomMasterData]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [purpose, department]
 *               name:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Custom master data item created successfully
 * /api/custom-master-data/{id}:
 *   put:
 *     summary: Update custom master data item
 *     tags: [CustomMasterData]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               sortOrder:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Custom master data item updated successfully
 *   delete:
 *     summary: Delete custom master data item
 *     tags: [CustomMasterData]
 *     security:
 *       - bearerAuth: []
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Custom master data item deleted successfully
 */

// GET /api/custom-master-data
router.get('/', auth, checkRole('super_admin', 'tenant_admin', 'receptionist', 'manager', 'employee', 'security'), async (req, res) => {
  try {
    await ensureMasterTypes();

    const masterTypes = await MasterType.find({
      code: { $in: ['VISIT_PURPOSE', 'DEPARTMENT'] }
    });

    const typeIdMap = {};
    masterTypes.forEach(mt => { typeIdMap[mt._id.toString()] = mt.code; });

    const query = {
      master_type_id: { $in: masterTypes.map(mt => mt._id) },
      $or: [
        { is_global: true },
        { tenant_id: req.user.tenant_id }
      ]
    };

    const items = await MasterData.find(query).sort({ sort_order: 1, createdAt: 1 });

    const result = items.map(item => {
      const typeCode = typeIdMap[item.master_type_id.toString()];
      return toFrontend(item, typeCode);
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/custom-master-data
router.post('/', auth, checkRole('super_admin', 'tenant_admin', 'manager'), async (req, res) => {
  try {
    await ensureMasterTypes();

    const { type, name, sortOrder, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name is required.' });
    }

    const typeCode = REVERSE_TYPE_MAP[type];
    if (!typeCode) {
      return res.status(400).json({ success: false, message: 'Invalid type. Must be "purpose" or "department".' });
    }

    const masterType = await MasterType.findOne({ code: typeCode });
    if (!masterType) {
      return res.status(400).json({ success: false, message: `MasterType ${typeCode} not found.` });
    }

    // Unique code: name + tenant + timestamp
    const code = name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '') + '_' + Date.now();

    const item = new MasterData({
      master_type_id: masterType._id,
      code,
      name: name.trim(),
      sort_order: sortOrder || 1,
      is_active: is_active !== false,
      is_global: false,
      tenant_id: req.user.tenant_id || null,
    });

    await item.save();

    res.status(201).json({ success: true, data: toFrontend(item, typeCode) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An item with this name already exists.' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT /api/custom-master-data/:id
router.put('/:id', auth, checkRole('super_admin', 'tenant_admin', 'manager'), async (req, res) => {
  try {
    const { name, sortOrder, is_active } = req.body;

    // Global items — sirf super_admin edit kar sakta hai
    const existing = await MasterData.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item not found!' });
    }

    if (existing.is_global && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Global items can only be edited by super admin.' });
    }

    // Tenant-owned items — sirf owner tenant edit kar sakta hai
    if (!existing.is_global && existing.tenant_id?.toString() !== req.user.tenant_id?.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own items.' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (sortOrder !== undefined) updateData.sort_order = sortOrder;
    if (is_active !== undefined) updateData.is_active = is_active;

    const item = await MasterData.findByIdAndUpdate(req.params.id, updateData, { new: true });

    const masterType = await MasterType.findById(item.master_type_id);
    const typeCode = masterType?.code || 'VISIT_PURPOSE';

    res.json({ success: true, data: toFrontend(item, typeCode) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/custom-master-data/:id
router.delete('/:id', auth, checkRole('super_admin', 'tenant_admin', 'manager'), async (req, res) => {
  try {
    const existing = await MasterData.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Item not found!' });
    }

    // Global items — sirf super_admin delete kar sakta hai
    if (existing.is_global && req.user.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: 'Global items can only be deleted by super admin.' });
    }

    // Tenant-owned items — sirf owner tenant delete kar sakta hai
    if (!existing.is_global && existing.tenant_id?.toString() !== req.user.tenant_id?.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own items.' });
    }

    await MasterData.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
