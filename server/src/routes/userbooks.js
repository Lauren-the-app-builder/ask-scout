const router = require('express').Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get user's Up Next list
router.get('/', auth, async (req, res) => {
  const books = await prisma.userBook.findMany({
    where: { userId: req.user.userId, status: { not: 'read' } },
    include: { book: true },
    orderBy: { order: 'asc' },
  });
  res.json(books);
});

// Add book to list
router.post('/', auth, async (req, res) => {
  try {
    const { bookId, status = 'buy' } = req.body;
    const count = await prisma.userBook.count({ where: { userId: req.user.userId } });
    const entry = await prisma.userBook.upsert({
      where: { userId_bookId: { userId: req.user.userId, bookId } },
      update: { status },
      create: { userId: req.user.userId, bookId, status, order: count },
      include: { book: true },
    });
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Update status or order
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status, order } = req.body;
    const entry = await prisma.userBook.update({
      where: { id: req.params.id },
      data: { ...(status && { status }), ...(order !== undefined && { order }) },
      include: { book: true },
    });
    res.json(entry);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mark as read
router.post('/:id/read', auth, async (req, res) => {
  try {
    const { rating, notes } = req.body;
    const userBook = await prisma.userBook.update({
      where: { id: req.params.id },
      data: { status: 'read', readAt: new Date() },
      include: { book: true },
    });
    await prisma.readLog.create({
      data: {
        userId: req.user.userId,
        bookId: userBook.bookId,
        rating,
        notes,
      },
    });
    res.json(userBook);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Remove from list
router.delete('/:id', auth, async (req, res) => {
  await prisma.userBook.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

module.exports = router;
