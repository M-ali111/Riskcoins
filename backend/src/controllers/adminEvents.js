const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const authenticateJWT = require('../middleware/authJwt');
const adminOnly = require('../middleware/adminOnly');

router.use(authenticateJWT, adminOnly);

// Get all events with participant count
router.get('/', async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                house: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: { participants: true }
        }
      },
      orderBy: { eventDate: 'asc' }
    });
    res.json(events);
  } catch (err) {
    next(err);
  }
});

// Get single event with participants
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                house: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// Create new event
router.post('/', async (req, res, next) => {
  try {
    const { title, description, eventDate } = req.body;
    
    if (!title || !eventDate) {
      return res.status(400).json({ error: 'Title and event date are required' });
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        eventDate: new Date(eventDate)
      }
    });
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
});

// Update event
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, eventDate } = req.body;

    const event = await prisma.event.update({
      where: { id },
      data: {
        title,
        description,
        eventDate: eventDate ? new Date(eventDate) : undefined
      }
    });
    res.json(event);
  } catch (err) {
    next(err);
  }
});

// Delete event
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.event.delete({
      where: { id }
    });
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
