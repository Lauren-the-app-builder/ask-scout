import { storage } from './storage';

const BASE_URL = 'http://localhost:3001/api';

async function request(path, options = {}) {
  const token = await storage.getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (email, name, password) => request('/auth/register', { method: 'POST', body: { email, name, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),

  // Books
  searchBooks: (q) => request(`/books/search?q=${encodeURIComponent(q)}`),
  upsertBook: (book) => request('/books/upsert', { method: 'POST', body: book }),

  // UserBooks
  getUserBooks: () => request('/userbooks'),
  addUserBook: (bookId, status) => request('/userbooks', { method: 'POST', body: { bookId, status } }),
  updateUserBook: (id, data) => request(`/userbooks/${id}`, { method: 'PATCH', body: data }),
  markRead: (id, rating, notes) => request(`/userbooks/${id}/read`, { method: 'POST', body: { rating, notes } }),
  removeUserBook: (id) => request(`/userbooks/${id}`, { method: 'DELETE' }),

  // Chat
  getChatHistory: () => request('/chat/history'),
  sendMessage: (content) => request('/chat/message', { method: 'POST', body: { content } }),
  getDailyRec: () => request('/chat/daily'),

  // Taste
  getTaste: () => request('/taste'),
  updateTaste: (data) => request('/taste', { method: 'PATCH', body: data }),
};
