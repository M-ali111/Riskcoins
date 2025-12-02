const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const authenticateJWT = require('../middleware/authJwt');

router.use(authenticateJWT);

// Get all events (public view for students)
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user?.sub;
    
    const events = await prisma.event.findMany({
      include: {
        participants: userId ? {
          where: { userId },
          select: { userId: true }
        } : false,
        _count: {
          select: { participants: true }
        }
      },
      orderBy: { eventDate: 'asc' }
    });

    // Add hasJoined flag for each event
    const eventsWithJoinStatus = events.map(event => ({
      ...event,
      hasJoined: userId ? event.participants.some(p => p.userId === userId) : false,
      participants: undefined // Remove participant details for students
    }));

    res.json(eventsWithJoinStatus);
  } catch (err) {
    next(err);
  }
});

// Join an event
router.post('/:id/join', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if already joined
    const existing = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already joined this event' });
    }

    // Join the event
    const participant = await prisma.eventParticipant.create({
      data: {
        eventId: id,
        userId
      }
    });

    res.status(201).json({ message: 'Successfully joined event', participant });
  } catch (err) {
    next(err);
  }
});

// Leave an event
router.delete('/:id/leave', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    // Check if participation exists
    const participation = await prisma.eventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      }
    });

    if (!participation) {
      return res.status(404).json({ error: 'You have not joined this event' });
    }

    // Leave the event
    await prisma.eventParticipant.delete({
      where: {
        eventId_userId: {
          eventId: id,
          userId
        }
      }
    });

    res.json({ message: 'Successfully left event' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
