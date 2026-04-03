const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('../server/src/routes/auth'));
app.use('/api/books', require('../server/src/routes/books'));
app.use('/api/chat', require('../server/src/routes/chat'));
app.use('/api/userbooks', require('../server/src/routes/userbooks'));
app.use('/api/taste', require('../server/src/routes/taste'));
app.use('/api/scout', require('../server/src/routes/scout'));
app.get('/api/health', (req, res) => res.json({ ok: true }));

module.exports = app;
