const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BASE = 'https://www.googleapis.com/books/v1';

function formatBook(item) {
  const v = item.volumeInfo || {};
  const isbn = (v.industryIdentifiers || []).find(i => i.type === 'ISBN_13')?.identifier
    || (v.industryIdentifiers || []).find(i => i.type === 'ISBN_10')?.identifier;
  return {
    googleBooksId: item.id,
    title: v.title || 'Unknown',
    author: (v.authors || ['Unknown']).join(', '),
    year: v.publishedDate ? parseInt(v.publishedDate) : null,
    isbn: isbn || null,
    coverUrl: isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : (v.imageLinks?.thumbnail || null),
    genre: (v.categories || [])[0] || null,
    description: v.description ? v.description.slice(0, 500) : null,
  };
}

async function searchBooksOpenLibrary(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10&fields=key,title,author_name,first_publish_year,isbn,cover_i,subject`;
  const { data } = await axios.get(url, { timeout: 8000 });
  return (data.docs || [])
    .filter(doc => doc.title) // skip entries with no title
    .map(doc => {
      const isbn = (doc.isbn || [])[0] || null;
      return {
        googleBooksId: doc.key || null,
        title: doc.title,
        author: (doc.author_name || ['Unknown']).join(', '),
        year: doc.first_publish_year || null,
        isbn,
        coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg` : (isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null),
        genre: (doc.subject || [])[0] || null,
        description: null,
      };
    });
}

// Simple in-memory cache to avoid hammering APIs
const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function searchBooks(query) {
  const key = query.toLowerCase().trim();
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  let results;
  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
    if (apiKey) {
      const url = `${BASE}/volumes?q=${encodeURIComponent(query)}&maxResults=10&key=${apiKey}`;
      const { data } = await axios.get(url, { timeout: 5000 });
      results = (data.items || []).map(formatBook);
    } else {
      results = await searchBooksOpenLibrary(query);
    }
  } catch (e) {
    // Fall back to Open Library if Google fails
    try {
      results = await searchBooksOpenLibrary(query);
    } catch {
      results = [];
    }
  }

  _cache.set(key, { data: results, ts: Date.now() });
  return results;
}

async function getBookByIsbn(isbn) {
  const cached = await prisma.book.findUnique({ where: { isbn } });
  if (cached) return cached;

  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `${BASE}/volumes?q=isbn:${isbn}${key ? `&key=${key}` : ''}`;
  const { data } = await axios.get(url, { timeout: 5000 });
  if (!data.items?.length) return null;
  return formatBook(data.items[0]);
}

module.exports = { searchBooks, getBookByIsbn };
