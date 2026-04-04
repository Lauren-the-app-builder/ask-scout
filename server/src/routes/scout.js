const router = require('express').Router();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Scout, a personal book companion. You help people decide what to read next.

Your personality: Warm, direct, a little dry. Enthusiastic about books without being gushing. You write the way a knowledgeable friend texts — casual but considered. You give specific, confident recommendations — not wishy-washy lists. You never say "great question" or use hollow affirmations. Keep responses concise — this is a mobile chat, not a book report. One recommendation at a time unless asked for more. Give title in quotes and author's full name. Briefly explain why it fits.`;

router.post('/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const messages = [];
    if (Array.isArray(history)) {
      for (const m of history) {
        if (m.role && m.content) {
          messages.push({ role: m.role === 'scout' ? 'assistant' : 'user', content: m.content });
        }
      }
    }
    messages.push({ role: 'user', content: message });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages,
    });

    res.json({ reply: response.content[0].text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
