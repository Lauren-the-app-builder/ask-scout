const router = require('express').Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk');
const { checkAndUpdateTaste } = require('../lib/tasteUpdater');

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(profile, upNextTitles) {
  const p = {
    lovedAuthors: JSON.parse(profile.lovedAuthors || '[]'),
    dislikedAuthors: JSON.parse(profile.dislikedAuthors || '[]'),
    lovedGenres: JSON.parse(profile.lovedGenres || '[]'),
    lovedThemes: JSON.parse(profile.lovedThemes || '[]'),
    avoidThemes: JSON.parse(profile.avoidThemes || '[]'),
    notes: profile.notes || '',
  };

  return `You are Scout, a personal book companion. You help people decide what to read next and learn their taste over time.

Your personality: Warm, direct, a little dry. Enthusiastic about books without being gushing. You write the way a knowledgeable friend texts — casual but considered. You give specific, confident recommendations — not wishy-washy lists. You never say "great question" or use hollow affirmations. You keep responses concise because this is a mobile app, not a book report. You never recommend the same books repeatedly.

This reader's taste profile:
- Loved authors: ${p.lovedAuthors.length ? p.lovedAuthors.join(', ') : 'not yet established'}
- Disliked authors: ${p.dislikedAuthors.length ? p.dislikedAuthors.join(', ') : 'none noted'}
- Loved genres: ${p.lovedGenres.length ? p.lovedGenres.join(', ') : 'not yet established'}
- Themes they love: ${p.lovedThemes.length ? p.lovedThemes.join(', ') : 'not yet established'}
- Themes to avoid: ${p.avoidThemes.length ? p.avoidThemes.join(', ') : 'none noted'}
${p.notes ? `- Notes: ${p.notes}` : ''}

Their current Up Next list: ${upNextTitles.length ? upNextTitles.join(', ') : 'empty'}

IMPORTANT: Never recommend books that are already on the user's Up Next list above. Always suggest something new.

When the user expresses an opinion about a book or author (loved/hated/not for me etc), acknowledge it naturally — the app will update the taste profile automatically.

Give recommendations with title in quotes and author's full name. One recommendation at a time unless asked for more. Explain briefly why it fits their taste specifically.`;
}

// Get chat history
router.get('/history', auth, async (req, res) => {
  const messages = await prisma.chatMessage.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });
  res.json(messages);
});

// Send a message
router.post('/message', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.userId;

    // Get taste profile
    let profile = await prisma.tasteProfile.findUnique({ where: { userId } });
    if (!profile) profile = await prisma.tasteProfile.create({ data: { userId } });

    // Get up next titles for context
    const upNext = await prisma.userBook.findMany({
      where: { userId, status: { not: 'read' } },
      include: { book: true },
      take: 10,
    });
    const upNextTitles = upNext.map(ub => `"${ub.book.title}" by ${ub.book.author}`);

    // Get recent chat history
    const history = await prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    const messages = history.reverse().map(m => ({ role: m.role === 'scout' ? 'assistant' : 'user', content: m.content }));

    // Add new user message
    messages.push({ role: 'user', content });

    // Save user message
    await prisma.chatMessage.create({ data: { userId, role: 'user', content } });

    // Check for taste updates
    const tasteUpdate = await checkAndUpdateTaste(userId, content, profile);

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: buildSystemPrompt(profile, upNextTitles),
      messages,
    });

    const reply = response.content[0].text;

    // Save Scout's reply
    await prisma.chatMessage.create({ data: { userId, role: 'scout', content: reply } });

    res.json({ reply, tasteUpdate });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Daily recommendation
router.get('/daily', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `daily_rec_${today}`;

    // Check if we already have today's rec in chat history
    const existing = await prisma.chatMessage.findFirst({
      where: { userId, role: 'scout', content: { contains: cacheKey } },
    });
    if (existing) {
      return res.json({ recommendation: existing.content.replace(`[${cacheKey}]`, '').trim() });
    }

    let profile = await prisma.tasteProfile.findUnique({ where: { userId } });
    if (!profile) profile = await prisma.tasteProfile.create({ data: { userId } });

    const upNext = await prisma.userBook.findMany({
      where: { userId, status: { not: 'read' } },
      include: { book: true },
      take: 10,
    });
    const upNextTitles = upNext.map(ub => `"${ub.book.title}" by ${ub.book.author}`);

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      system: buildSystemPrompt(profile, upNextTitles),
      messages: [{
        role: 'user',
        content: `Give me your single best book pick for me today that is NOT already on my Up Next list. Do not recommend any book already in my list. Be specific about why it suits my taste. Keep it to 2-3 sentences max.`,
      }],
    });

    const recommendation = response.content[0].text;
    await prisma.chatMessage.create({
      data: { userId, role: 'scout', content: `[${cacheKey}] ${recommendation}` },
    });

    res.json({ recommendation });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
