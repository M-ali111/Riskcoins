// backend/src/controllers/adminHouses.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const multer = require("multer");
const path = require("path");
const authenticateJWT = require("../middleware/authJwt");
const adminOnly = require("../middleware/adminOnly");

// Path: /uploads/houses (project root)
const uploadsDir = path.join(__dirname, "..", "..", "uploads", "houses");

// Allowed image types
const ALLOWED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp']
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = Date.now() + "_" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  const allowedExtensions = Object.values(ALLOWED_TYPES).flat();
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ALLOWED_TYPES[file.mimetype] && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }
};

// IMPORTANT: frontend sends the file under field name `logo` (formData.append("logo", file))
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1
  }
});

// Helper: normalize stored imageUrl so frontend doesn't accidentally receive double paths
function toApiHouseUrl(imageUrl) {
  if (!imageUrl) return null;
  // If DB already contains a path like '/uploads/houses/filename', just prefix with /api
  if (imageUrl.startsWith('/uploads/')) return `/api${imageUrl}`;
  // Otherwise assume it's a stored filename and build the API static path
  return `/api/uploads/houses/${imageUrl}`;
}

/* ============================================================
   GET ALL HOUSES (ADMIN)
============================================================ */
router.get("/", authenticateJWT, adminOnly, async (req, res) => {
  try {
    const houses = await prisma.house.findMany({
      orderBy: { name: "asc" }
    });

    const formatted = houses.map((h) => ({
      id: h.id,
      name: h.name,
          imageUrl: toApiHouseUrl(h.imageUrl)
    }));

    res.json(formatted);

  } catch (err) {
    console.error("adminHouses GET error", err);
    res.status(500).json({ error: "Failed to load houses" });
  }
});

/* ============================================================
   UPDATE HOUSE NAME + LOGO
============================================================ */
router.put(
  "/:id",
  authenticateJWT,
  adminOnly,
  upload.single("logo"), // MUST MATCH FRONTEND (frontend sends `logo`)
  async (req, res) => {
    try {
      const id = req.params.id;
      const { name } = req.body;

      const updateData = {};

      if (name) updateData.name = name;
      if (req.file) updateData.imageUrl = req.file.filename; // store ONLY filename

      const updated = await prisma.house.update({
        where: { id },
        data: updateData
      });

      res.json({
        id: updated.id,
        name: updated.name,
        imageUrl: toApiHouseUrl(updated.imageUrl)
      });

    } catch (err) {
      console.error("adminHouses UPDATE error", err);
      res.status(500).json({ error: "Failed to update house" });
    }
  }
);

module.exports = router;
