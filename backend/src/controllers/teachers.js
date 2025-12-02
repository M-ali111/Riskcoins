const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const auth = require('../middleware/authJwt');
const { sanitizeString } = require('../middleware/validation');

// All routes require JWT and TEACHER role
router.use(auth.authenticateJWT, auth.requireRole('TEACHER'));

// GET /teachers/students - list students in same house (or all?)
// Teachers can see all students
router.get('/students', async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true, house: { select: { name: true } } }
    });
    res.json({ students });
  } catch (err) {
    next(err);
  }
});

// POST /teachers/point-change - create a request to add/deduct points
router.post('/point-change', async (req, res, next) => {
  try {
    const teacherId = req.user.sub;
    const { studentId, deltaPoints, reason } = req.body;

    if (!studentId || !deltaPoints || !reason) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const cleanReason = sanitizeString(reason, 255);

    // Ensure student exists
    const student = await prisma.user.findUnique({ where: { id: studentId }, select: { role: true } });
    if (!student || student.role !== 'STUDENT') {
      return res.status(404).json({ error: 'Student not found' });
    }

    const request = await prisma.pointChangeRequest.create({
      data: {
        studentId,
        teacherId,
        deltaPoints: Number(deltaPoints),
        reason: cleanReason,
        status: 'PENDING'
      }
    });

    res.json({ success: true, request });
  } catch (err) {
    next(err);
  }
});

// GET /teachers/my-requests - fetch requests submitted by this teacher
router.get('/my-requests', async (req, res, next) => {
  try {
    const teacherId = req.user.sub;
    const requests = await prisma.pointChangeRequest.findMany({
      where: { teacherId },
      include: {
        student: { select: { name: true, email: true } },
        reviewer: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
