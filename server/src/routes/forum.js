// RF09 — fórum
import { Router } from 'express';
import { prisma, ah, HttpError, publicUser } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { moderate } from '../services/moderation.js';

const r = Router();

r.get(
  '/topics',
  ah(async (req, res) => {
    const { gameId, q, scope } = req.query;
    const where = {
      ...(gameId ? { gameId: Number(gameId) } : {}),
      ...(scope === 'general' ? { gameId: null } : {}),
      ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    };
    const topics = await prisma.topic.findMany({
      where,
      include: {
        user: { select: publicUser },
        game: { select: { id: true, name: true, slug: true } },
        _count: { select: { replies: true } },
      },
      orderBy: { lastActivityAt: 'desc' },
      take: 50,
    });
    res.json(topics);
  })
);

r.post(
  '/topics',
  requireAuth,
  ah(async (req, res) => {
    const { title, body, gameId, spoiler } = req.body;
    if (!title?.trim() || !body?.trim()) throw new HttpError(400, 'Título e texto são obrigatórios.');
    const game = gameId ? await prisma.game.findUnique({ where: { id: Number(gameId) } }) : null;
    const mod = await moderate({
      title: title.trim(),
      text: body.trim(),
      spoiler: Boolean(spoiler),
      context: game ? `Tópico do fórum sobre o jogo ${game.name}` : 'Tópico geral do fórum',
    });
    const topic = await prisma.topic.create({
      data: {
        title: mod.title,
        body: mod.text,
        spoiler: mod.spoiler,
        spoilerAuto: mod.spoilerAuto,
        userId: req.user.id,
        gameId: game ? game.id : null,
      },
    });
    res.status(201).json(topic);
  })
);

r.get(
  '/topics/:id',
  ah(async (req, res) => {
    const topic = await prisma.topic.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: publicUser },
        game: { select: { id: true, name: true, slug: true, coverUrl: true } },
        replies: { include: { user: { select: publicUser } }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!topic) throw new HttpError(404, 'Tópico não encontrado.');
    res.json(topic);
  })
);

r.post(
  '/topics/:id/replies',
  requireAuth,
  ah(async (req, res) => {
    const body = String(req.body.body || '').trim();
    if (!body) throw new HttpError(400, 'Resposta vazia.');
    const topic = await prisma.topic.findUnique({ where: { id: req.params.id }, include: { game: true } });
    if (!topic) throw new HttpError(404, 'Tópico não encontrado.');
    const mod = await moderate({
      text: body,
      spoiler: Boolean(req.body.spoiler),
      context: `Resposta no tópico "${topic.title}"${topic.game ? ` sobre o jogo ${topic.game.name}` : ''}`,
    });
    const [reply] = await prisma.$transaction([
      prisma.reply.create({
        data: { body: mod.text, spoiler: mod.spoiler, spoilerAuto: mod.spoilerAuto, userId: req.user.id, topicId: topic.id },
        include: { user: { select: publicUser } },
      }),
      prisma.topic.update({ where: { id: req.params.id }, data: { lastActivityAt: new Date() } }),
    ]);
    res.status(201).json(reply);
  })
);

export default r;
