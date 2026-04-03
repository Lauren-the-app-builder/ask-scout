const router = require('express').Router();
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.get('/', auth, async (req, res) => {
  let profile = await prisma.tasteProfile.findUnique({ where: { userId: req.user.userId } });
  if (!profile) {
    profile = await prisma.tasteProfile.create({ data: { userId: req.user.userId } });
  }
  res.json({
    ...profile,
    lovedAuthors: JSON.parse(profile.lovedAuthors),
    dislikedAuthors: JSON.parse(profile.dislikedAuthors),
    lovedGenres: JSON.parse(profile.lovedGenres),
    lovedThemes: JSON.parse(profile.lovedThemes),
    avoidThemes: JSON.parse(profile.avoidThemes),
  });
});

router.patch('/', auth, async (req, res) => {
  const { lovedAuthors, dislikedAuthors, lovedGenres, lovedThemes, avoidThemes, notes } = req.body;
  const profile = await prisma.tasteProfile.upsert({
    where: { userId: req.user.userId },
    update: {
      ...(lovedAuthors && { lovedAuthors: JSON.stringify(lovedAuthors) }),
      ...(dislikedAuthors && { dislikedAuthors: JSON.stringify(dislikedAuthors) }),
      ...(lovedGenres && { lovedGenres: JSON.stringify(lovedGenres) }),
      ...(lovedThemes && { lovedThemes: JSON.stringify(lovedThemes) }),
      ...(avoidThemes && { avoidThemes: JSON.stringify(avoidThemes) }),
      ...(notes !== undefined && { notes }),
    },
    create: { userId: req.user.userId },
  });
  res.json(profile);
});

module.exports = router;
