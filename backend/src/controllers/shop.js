const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { authenticateJWT } = require('../middleware/authJwt');

router.get('/', async (req, res, next) => {
  try {
    const items = await prisma.shopItem.findMany();
    res.json(items);
  } catch (err) { next(err); }
});

router.post('/buy', authenticateJWT, async (req, res, next) => {
  try {
    const buyerId = req.user.sub;
    const { itemId, qty = 1 } = req.body;
    if (!itemId || qty < 1) return res.status(400).json({ error: 'invalid' });

    const result = await prisma.$transaction(async (tx) => {
      const buyer = await tx.user.findUnique({ where: { id: buyerId } });
      if (!buyer) throw { status: 404, message: 'buyer not found' };

      const item = await tx.shopItem.findUnique({ where: { id: itemId } });
      if (!item) throw { status: 404, message: 'item not found' };
      if (item.stock !== null && item.stock < qty) throw { status: 400, message: 'not enough stock' };

      const agg = await tx.activityLog.aggregate({ where: { houseId: buyer.houseId }, _sum: { amount: true } });
      const housePoints = agg._sum.amount || 0;
      const totalPrice = item.price * qty;
      if (housePoints < totalPrice) throw { status: 400, message: 'not enough house points' };

      const purchase = await tx.purchase.create({ data: { buyerId, itemId, houseId: buyer.houseId, amount: totalPrice, qty }, include: { buyer: true, item: true } });

      if (item.stock !== null) {
        await tx.shopItem.update({ where: { id: itemId }, data: { stock: item.stock - qty } });
      }

      await tx.activityLog.create({ data: { subjectId: buyerId, houseId: buyer.houseId, amount: -totalPrice, reason: `Purchase: ${item.title} (x${qty})`, performedBy: buyerId } });

      return purchase;
    });

    res.json(result);
  } catch (err) {
    if (err && err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

module.exports = router;
