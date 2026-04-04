const { PrismaClient } = require('@prisma/client');
const Anthropic = require('@anthropic-ai/sdk');

const prisma = new PrismaClient();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Extract taste updates from a conversation message and apply them
async function checkAndUpdateTaste(userId, userMessage, profileRaw) {
  const profile = {
    lovedAuthors: JSON.parse(profileRaw.lovedAuthors),
    dislikedAuthors: JSON.parse(profileRaw.dislikedAuthors),
    lovedGenres: JSON.parse(profileRaw.lovedGenres),
    lovedThemes: JSON.parse(profileRaw.lovedThemes),
    avoidThemes: JSON.parse(profileRaw.avoidThemes),
    notes: profileRaw.notes,
  };

  // Quick check: does the message mention opinions about books/authors?
  const opinionTriggers = ['hated', 'loved', 'disliked', 'not for me', "didn't like", "can't stand",
    "obsessed with", "favourite", "favorite", "boring", "terrible", "amazing", "awful"];
  const lower = userMessage.toLowerCase();
  if (!opinionTriggers.some(t => lower.includes(t))) return null;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `The user said: "${userMessage}"
Current taste profile: ${JSON.stringify(profile)}

Extract any taste updates from this message. Return JSON only:
{
  "updates": {
    "lovedAuthors"?: string[],
    "dislikedAuthors"?: string[],
    "lovedGenres"?: string[],
    "lovedThemes"?: string[],
    "avoidThemes"?: string[],
    "notes"?: string
  },
  "bannerText": "short human-readable summary of what changed, e.g. 'not a fan of slow-burn romance'"
}
If no clear taste update, return { "updates": {}, "bannerText": null }`,
    }],
  });

  let result;
  try {
    const text = response.content[0].text;
    result = JSON.parse(text.match(/\{[\s\S]*\}/)[0]);
  } catch {
    return null;
  }

  if (!result.bannerText || Object.keys(result.updates).length === 0) return null;

  // Merge updates into existing profile
  const mergedUpdates = {};
  for (const [key, val] of Object.entries(result.updates)) {
    if (Array.isArray(val)) {
      const existing = profile[key] || [];
      mergedUpdates[key] = JSON.stringify([...new Set([...existing, ...val])]);
    } else if (key === 'notes') {
      mergedUpdates[key] = val;
    }
  }

  await prisma.tasteProfile.upsert({
    where: { userId },
    update: mergedUpdates,
    create: { userId, ...mergedUpdates },
  });

  return result.bannerText;
}

module.exports = { checkAndUpdateTaste };
