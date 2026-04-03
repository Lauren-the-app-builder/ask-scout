const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/userbooks', require('./routes/userbooks'));
app.use('/api/taste', require('./routes/taste'));
app.use('/api/scout', require('./routes/scout'));

// Serve the HTML prototype
app.use(express.static(path.join(__dirname, '../..')));

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Scout server running on :${PORT}`));
