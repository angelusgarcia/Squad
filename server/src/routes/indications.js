// Indicações da comunidade
import { Router } from 'express';
import { prisma, ah, HttpError, publicUser } from '../lib/prisma.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { moderate, censor } from '../services/moderation.js';

const r = Router();

r.get(
  '/',
  optionalAuth,
  ah(async (req, res) => {
    const { sort = 'top', tag, limit = 30 } = req.query;
    const list = await prisma.indication.findMany({
      where: tag ? { tags: { has: tag } } : {},
      include: {
        user: { select: publicUser },
        game: { include: { genres: true } },
        _count: { select: { likes: true } },
        likes: req.user ? { where: { userId: req.user.id }, select: { userId: true } } : false,
      },
      orderBy: sort === 'new' ? { createdAt: 'desc' } : [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }],
      take: Number(limit),
    });
    res.json(
      list.map(({ likes, ...i }) => ({ ...i, likedByMe: Boolean(likes?.length) }))
    );
  })
);

r.get(
  '/tags',
  ah(async (_req, res) => {
    const rows = await prisma.$queryRaw`SELECT unnest(tags) AS tag, COUNT(*)::int AS count FROM "Indication" GROUP BY tag ORDER BY count DESC LIMIT 20`;
    res.json(rows);
  })
);

r.post(
  '/',
  requireAuth,
  ah(async (req, res) => {
    const { gameId, reason, tags = [] } = req.body;
    if (!gameId || !reason?.trim()) throw new HttpError(400, 'Escolha um jogo e diga por que indica.');
    const cleanTags = [...new Set(tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))].slice(0, 5);
    const game = await prisma.game.findUnique({ where: { id: Number(gameId) } });
    if (!game) throw new HttpError(404, 'Jogo não encontrado.');
    const mod = await moderate({ text: reason.trim(), context: `Indicação do jogo ${game.name}` });
    const ind = await prisma.indication.create({
      data: {
        gameId: game.id,
        reason: mod.text,
        spoiler: mod.spoiler,
        spoilerAuto: mod.spoilerAuto,
        tags: cleanTags.filter((t) => censor(t).censored.length === 0),
        userId: req.user.id,
      },
    });
    res.status(201).json(ind);
  })
);

r.post(
  '/:id/like',
  requireAuth,
  ah(async (req, res) => {
    const key = { userId: req.user.id, indicationId: req.params.id };
    const existing = await prisma.indicationLike.findUnique({ where: { userId_indicationId: key } });
    if (existing) await prisma.indicationLike.delete({ where: { userId_indicationId: key } });
    else await prisma.indicationLike.create({ data: key });
    const count = await prisma.indicationLike.count({ where: { indicationId: req.params.id } });
    res.json({ liked: !existing, count });
  })
);

r.delete(
  '/:id',
  requireAuth,
  ah(async (req, res) => {
    const ind = await prisma.indication.findUnique({ where: { id: req.params.id } });
    if (!ind || ind.userId !== req.user.id) throw new HttpError(403, 'Sem permissão.');
    await prisma.indication.delete({ where: { id: ind.id } });
    res.status(204).end();
  })
);

export default r;
