const router = require('express').Router();
const auth = require('../middleware/auth');
const { searchBooks, getBookByIsbn } = require('../lib/googleBooks');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Search books — backend proxies Google Books
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const results = await searchBooks(q);
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get or create a book record
router.post('/upsert', auth, async (req, res) => {
  try {
    const { title, author, isbn, coverUrl, year, genre, description, googleBooksId } = req.body;

    let book;
    if (isbn) {
      book = await prisma.book.findUnique({ where: { isbn } });
    } else if (googleBooksId) {
      book = await prisma.book.findUnique({ where: { googleBooksId } });
    }

    if (!book) {
      book = await prisma.book.create({
        data: { title, author, isbn, coverUrl, year, genre, description, googleBooksId },
      });
    }
    res.json(book);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
