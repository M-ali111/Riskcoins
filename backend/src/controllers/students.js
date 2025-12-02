// backend/src/controllers/students.js
const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const auth = require('../middleware/authJwt');

// Get current student
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.sub; // JWT payload uses `sub`
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const me = await prisma.user.findUnique({
      where: { id: userId },
      include: { house: true }
    });
    if (!me) return res.status(404).json({ error: 'User not found' });
    res.json(me);
  } catch (err) {
    console.error('students /me error', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Student total points
router.get('/my-points', auth, async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const agg = await prisma.activityLog.aggregate({
      where: { subjectId: userId },
      _sum: { amount: true }
    });
    const points = agg._sum.amount || 0;
    res.json({ points }); // align with frontend expectation
  } catch (err) {
    console.error('students /my-points error', err);
    res.status(500).json({ error: 'Failed to load points' });
  }
});

// Student activity log
router.get('/activity', auth, async (req, res) => {
  try {
    const userId = req.user.sub;
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const logs = await prisma.activityLog.findMany({
      where: { subjectId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(logs);
  } catch (err) {
    console.error('students /activity error', err);
    res.status(500).json({ error: 'Failed to load activity' });
  }
});

// Leaderboard for students
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const houses = await prisma.house.findMany({
      include: { activity: true }
    });

    const formatted = houses.map(h => {
      const total = h.activity.reduce((sum, a) => sum + a.amount, 0);

      return {
        id: h.id,
        name: h.name,
        total,
        imageUrl: h.imageUrl
          ? `/api/uploads/houses/${h.imageUrl}`
          : null
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error("students leaderboard error", err);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

module.exports = router;
