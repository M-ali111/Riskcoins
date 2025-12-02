// backend/src/controllers/housesPublic.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
// normalize imageUrl whether DB stores a filename or a full '/uploads/...'
function toApiHouseUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('/uploads/')) return `/api${imageUrl}`;
  return `/api/uploads/houses/${imageUrl}`;
}

/* ============================================================
   PUBLIC HOUSE LEADERBOARD  (NO LOGIN REQUIRED)
============================================================ */
router.get("/leaderboard", async (req, res) => {
  try {
    const houses = await prisma.house.findMany({
      include: {
        activity: true,
      },
      orderBy: { name: "asc" }
    });

    const formatted = houses
      .map((h) => {
        const total = h.activity.reduce((sum, a) => sum + a.amount, 0);

        const url = toApiHouseUrl(h.imageUrl);

        return {
          id: h.id,
          name: h.name,
          total,
          imageUrl: url,
        };
      })
      // sort by total RC DESC
      .sort((a, b) => b.total - a.total);

    res.json(formatted);

  } catch (err) {
    console.error("housesPublic leaderboard error", err);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
});

module.exports = router;
