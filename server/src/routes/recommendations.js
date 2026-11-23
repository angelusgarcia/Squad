// RF12 — recomendação por IA
import { Router } from 'express';
import { prisma, ah } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { generateRecommendations } from '../services/ai.js';

const r = Router();

async function latest(userId) {
  const last = await prisma.recommendation.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
  if (!last) return { items: [], generatedAt: null };
  const items = await prisma.recommendation.findMany({
    where: { userId, batchId: last.batchId },
    include: { game: { include: { genres: true } } },
  });
  return { items, generatedAt: last.createdAt };
}

// Última recomendação salva
r.get('/', requireAuth, ah(async (req, res) => res.json(await latest(req.user.id))));

// Gerar nova recomendação
r.post(
  '/',
  requireAuth,
  ah(async (req, res) => {
    const { source, aiError } = await generateRecommendations(req.user.id);
    res.json({ ...(await latest(req.user.id)), source, aiError });
  })
);

export default r;
