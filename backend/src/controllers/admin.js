const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/upload'); // multer storage defined in middleware/upload.js
const { authenticateJWT, requireRole } = require('../middleware/authJwt');

router.use(authenticateJWT, requireRole('ADMIN'));

/* ---------------------------
   SEARCH STUDENTS (autocomplete)
---------------------------- */
router.get('/search-students', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || q.length < 2) return res.json([]);
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', name: { contains: q, mode: 'insensitive' } },
      select: { id: true, name: true, email: true, house: { select: { id: true, name: true } } },
      take: 10
    });
    res.json(students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

/* ---------------------------
   ADD / REMOVE RC
---------------------------- */
router.post('/add-rc', async (req, res, next) => {
  try {
    const { studentId, amount, reason } = req.body;
    if (!studentId || typeof amount !== 'number' || !reason) return res.status(400).json({ error: 'missing' });
    const student = await prisma.user.findUnique({ where: { id: studentId }, include: { house: true } });
    if (!student) return res.status(404).json({ error: 'student not found' });
    const activity = await prisma.activityLog.create({
      data: { subjectId: student.id, houseId: student.houseId, amount, reason, performedBy: req.user.sub }
    });
    res.json(activity);
  } catch (err) { next(err); }
});

router.post('/remove-rc', async (req, res, next) => {
  try {
    const { studentId, amount, reason } = req.body;
    if (!studentId || typeof amount !== 'number' || !reason) return res.status(400).json({ error: 'missing' });
    const student = await prisma.user.findUnique({ where: { id: studentId }, include: { house: true } });
    if (!student) return res.status(404).json({ error: 'student not found' });
    const activity = await prisma.activityLog.create({
      data: { subjectId: student.id, houseId: student.houseId, amount: -Math.abs(amount), reason, performedBy: req.user.sub }
    });
    res.json(activity);
  } catch (err) { next(err); }
});

/* ---------------------------
   ACTIVITY LOG
---------------------------- */
router.get('/activity-log', async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { subject: true, house: true }
    });
    res.json(logs);
  } catch (err) { next(err); }
});

/* ---------------------------
   TEACHER REQUESTS — list pending
---------------------------- */
router.get('/point-change-requests', async (req, res, next) => {
  try {
    const status = req.query.status || 'PENDING';
    const page = Number(req.query.page || 1);
    const limit = Math.min(Number(req.query.limit || 50), 200);
    const requests = await prisma.pointChangeRequest.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { student: true, teacher: true }
    });
    res.json(requests);
  } catch (err) { next(err); }
});

/* ---------------------------
   TEACHER REQUESTS — approve
---------------------------- */
router.post('/point-change-requests/:id/approve', async (req, res, next) => {
  try {
    const id = req.params.id;
    const reqItem = await prisma.pointChangeRequest.findUnique({ where: { id }, include: { student: true } });
    if (!reqItem || reqItem.status !== 'PENDING') return res.status(404).json({ error: 'Request not found or already processed' });

    // Create activity log entry with deltaPoints
    const activity = await prisma.activityLog.create({
      data: {
        subjectId: reqItem.studentId,
        houseId: reqItem.student.houseId,
        amount: reqItem.deltaPoints,
        reason: `[Teacher] ${reqItem.reason}`,
        performedBy: req.user.sub
      }
    });

    // Mark request as approved
    const updated = await prisma.pointChangeRequest.update({
      where: { id },
      data: { status: 'APPROVED', reviewedBy: req.user.sub, reviewedAt: new Date() }
    });

    res.json({ success: true, activity, request: updated });
  } catch (err) { next(err); }
});

/* ---------------------------
   TEACHER REQUESTS — reject
---------------------------- */
router.post('/point-change-requests/:id/reject', async (req, res, next) => {
  try {
    const id = req.params.id;
    const reqItem = await prisma.pointChangeRequest.findUnique({ where: { id } });
    if (!reqItem || reqItem.status !== 'PENDING') return res.status(404).json({ error: 'Request not found or already processed' });

    const updated = await prisma.pointChangeRequest.update({
      where: { id },
      data: { status: 'REJECTED', reviewedBy: req.user.sub, reviewedAt: new Date() }
    });
    res.json({ success: true, request: updated });
  } catch (err) { next(err); }
});

/* ---------------------------
   SHOP — CREATE ITEM (with upload)
   Expects multipart/form-data with field name "image"
---------------------------- */
router.post('/items', upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, stock } = req.body;
    if (!title || !price) return res.status(400).json({ error: 'missing' });

    const imageUrl = req.file ? `/uploads/items/${req.file.filename}` : null;

    const item = await prisma.shopItem.create({
      data: {
        title,
        description,
        price: Number(price),
        stock: stock ? Number(stock) : null,
        imageUrl
      }
    });
    res.json(item);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create item' }); }
});

/* ---------------------------
   SHOP — LIST ITEMS
---------------------------- */
router.get('/items', async (req, res) => {
  try {
    const items = await prisma.shopItem.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(items);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list items' }); }
});

/* ---------------------------
   SHOP — UPDATE ITEM (optional new image)
   Accepts multipart/form-data (image optional)
---------------------------- */
router.put('/items/:id', upload.single('image'), async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, price, stock } = req.body;
    const data = {
      title,
      description,
      price: price !== undefined ? Number(price) : undefined,
      stock: stock !== undefined && stock !== '' ? Number(stock) : null
    };
    if (req.file) {
      data.imageUrl = `/uploads/items/${req.file.filename}`;
    }
    const updated = await prisma.shopItem.update({ where: { id }, data });
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update item' }); }
});

/* ---------------------------
   SHOP — DELETE ITEM
---------------------------- */
router.delete('/items/:id', async (req, res) => {
  try {
    const id = req.params.id;
    // optional: remove file from disk
    const existing = await prisma.shopItem.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    // Attempt to unlink the image file (best-effort, Windows-safe path)
    if (existing.imageUrl) {
      try {
        // imageUrl is like "/uploads/items/filename.ext" => convert to workspace path
        const relative = existing.imageUrl.replace(/^\/(uploads\/.*)$/,'$1');
        const filepath = path.join(__dirname, '..', '..', relative);
        fs.unlink(filepath, (err) => {
          if (err) {
            console.warn('unlink failed for', filepath, err.message);
          } else {
            console.log('unlinked', filepath);
          }
        });
      } catch (e) {
        console.warn('unlink path build failed', e.message);
      }
    }

    await prisma.shopItem.delete({ where: { id } });
    console.log('Deleted shop item', id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete item' }); }
});

/* ---------------------------
   PURCHASES (admin view)
---------------------------- */
router.get('/purchases', async (req, res) => {
  try {
    const { houseId, page = 1, limit = 50 } = req.query;
    const purchases = await prisma.purchase.findMany({
      where: houseId ? { houseId } : undefined,
      include: { buyer: true, item: true, house: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * Number(limit),
      take: Number(limit)
    });
    res.json(purchases);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list purchases' }); }
});

/* ---------------------------
   EXTRA: STUDENTS list / single / edit / reset password / delete
   (If you already have separate file for these, it's fine — duplicate protection not included)
---------------------------- */

/* LIST STUDENTS */
router.get('/students', async (req, res) => {
  try {
    const q = req.query.q || '';
    const houseId = req.query.houseId || undefined;
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(100, Number(req.query.limit || 20));
    const skip = (page - 1) * limit;

    const where = { role: 'STUDENT' , AND: [] };
    if (q) where.AND.push({ OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }] });
    if (houseId) where.AND.push({ houseId });
    if (where.AND.length === 0) delete where.AND;

    const [total, students] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, include: { house: true }, orderBy: { name: 'asc' }, skip, take: limit })
    ]);

    const studentsWithPoints = await Promise.all(students.map(async s => {
      const agg = await prisma.activityLog.aggregate({ where: { subjectId: s.id }, _sum: { amount: true } });
      const points = agg._sum.amount || 0;
      return { id: s.id, name: s.name, email: s.email, house: s.house ? { id: s.house.id, name: s.house.name } : null, createdAt: s.createdAt, points };
    }));

    res.json({ page, limit, total, students: studentsWithPoints });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list students' }); }
});

/* GET single student */
router.get('/students/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await prisma.user.findUnique({ where: { id }, include: { house: true } });
    if (!user) return res.status(404).json({ error: 'Student not found' });
    const agg = await prisma.activityLog.aggregate({ where: { subjectId: id }, _sum: { amount: true } });
    const points = agg._sum.amount || 0;
    res.json({ id: user.id, name: user.name, email: user.email, house: user.house ? { id: user.house.id, name: user.house.name } : null, createdAt: user.createdAt, points });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get student' }); }
});

/* UPDATE student */
router.put('/students/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, houseId } = req.body;
    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (houseId) data.house = { connect: { id: houseId } };
    const updated = await prisma.user.update({ where: { id }, data, include: { house: true } });
    res.json({ id: updated.id, name: updated.name, email: updated.email, house: updated.house ? { id: updated.house.id, name: updated.house.name } : null });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ error: 'Email already in use' });
    res.status(500).json({ error: 'Failed to update student' });
  }
});

/* RESET password */
router.post('/students/:id/reset-password', async (req, res) => {
  try {
    const id = req.params.id;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be >=6 chars' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id }, data: { passwordHash } });
    res.json({ success: true, message: 'Password reset' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to reset password' }); }
});

/* DELETE student */
router.delete('/students/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await prisma.user.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) { console.error(err); if (err.code === 'P2025') return res.status(404).json({ error: 'Student not found' }); res.status(500).json({ error: 'Failed to delete' }); }
});

/* ---------------------------
   BULK UPLOAD STUDENTS FROM GOOGLE SHEET
---------------------------- */
const { google } = require('googleapis');

router.post('/students/bulk-upload', async (req, res) => {
  try {
    const { spreadsheetId, sheetName = 'Sheet1' } = req.body;
    
    if (!spreadsheetId) {
      return res.status(400).json({ error: 'spreadsheetId is required' });
    }

    // Initialize Google Sheets API (no auth required for public sheets)
    const sheets = google.sheets({ version: 'v4' });

    // Read data from Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:D`, // Columns: Name, Email, House, Password
      key: process.env.GOOGLE_API_KEY || '', // Optional: add API key for rate limits
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'No data found in sheet' });
    }

    // Skip header row
    const dataRows = rows.slice(1);
    
    const results = {
      success: [],
      failed: []
    };

    // Get all houses for mapping
    const houses = await prisma.house.findMany();
    const houseMap = {};
    houses.forEach(h => {
      houseMap[h.name.toLowerCase()] = h.id;
    });

    // Process each row
    for (const row of dataRows) {
      const [name, email, houseName, password] = row;
      
      // Skip empty rows
      if (!name || !email) {
        results.failed.push({ row, reason: 'Missing name or email' });
        continue;
      }

      try {
        // Find house ID
        const houseId = houseName ? houseMap[houseName.toLowerCase()] : null;
        
        if (houseName && !houseId) {
          results.failed.push({ name, email, reason: `House "${houseName}" not found` });
          continue;
        }

        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          results.failed.push({ name, email, reason: 'Email already exists' });
          continue;
        }

        // Hash password (use provided or generate default)
        const tempPassword = password || 'student123';
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        // Create student
        const student = await prisma.user.create({
          data: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            passwordHash,
            role: 'STUDENT',
            houseId: houseId || undefined,
            isEmailVerified: false
          },
          include: { house: true }
        });

        results.success.push({
          name: student.name,
          email: student.email,
          house: student.house?.name || 'None'
        });

      } catch (err) {
        console.error('Error creating student:', err);
        results.failed.push({ name, email, reason: err.message });
      }
    }

    res.json({
      message: 'Bulk upload completed',
      total: dataRows.length,
      successful: results.success.length,
      failed: results.failed.length,
      results
    });

  } catch (err) {
    console.error('Bulk upload error:', err);
    
    if (err.message.includes('Unable to parse range')) {
      return res.status(400).json({ error: 'Invalid sheet name. Make sure the sheet exists.' });
    }
    
    if (err.message.includes('Requested entity was not found')) {
      return res.status(400).json({ error: 'Invalid spreadsheet ID or sheet is not publicly accessible' });
    }

    res.status(500).json({ error: 'Failed to upload students: ' + err.message });
  }
});

module.exports = router;
