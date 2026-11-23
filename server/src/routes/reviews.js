// RF08 (reviews) e RF11 (comentários em reviews)
import { Router } from 'express';
import { prisma, ah, HttpError, publicUser } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { moderate } from '../services/moderation.js';

const gameName = async (gameId) =>
  (await prisma.game.findUnique({ where: { id: Number(gameId) }, select: { name: true } }))?.name;

const r = Router();

function validate({ rating, text }) {
  const n = Number(rating);
  if (!Number.isInteger(n) || n < 1 || n > 10) throw new HttpError(400, 'A nota deve ser de 1 a 10.');
  if (!text || text.trim().length < 10) throw new HttpError(400, 'Escreva pelo menos 10 caracteres.');
  return n;
}

// Reviews recentes
r.get(
  '/',
  ah(async (req, res) => {
    const { gameId } = req.query;
    const reviews = await prisma.review.findMany({
      where: gameId ? { gameId: Number(gameId) } : {},
      include: {
        user: { select: publicUser },
        game: { select: { id: true, name: true, slug: true, coverUrl: true } },
        comments: { include: { user: { select: publicUser } }, orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: gameId ? 50 : 10,
    });
    res.json(reviews);
  })
);

r.post(
  '/',
  requireAuth,
  ah(async (req, res) => {
    const rating = validate(req.body);
    const gameId = Number(req.body.gameId);
    const exists = await prisma.review.findUnique({
      where: { userId_gameId: { userId: req.user.id, gameId } },
    });
    if (exists) throw new HttpError(409, 'Você já avaliou este jogo. Edite sua review existente.');
    const mod = await moderate({
      text: req.body.text.trim(),
      spoiler: Boolean(req.body.spoiler),
      context: `Review do jogo ${await gameName(gameId)}`,
    });
    const review = await prisma.review.create({
      data: { rating, text: mod.text, spoiler: mod.spoiler, spoilerAuto: mod.spoilerAuto, userId: req.user.id, gameId },
    });
    res.status(201).json({ ...review, moderation: { spoilerAuto: mod.spoilerAuto, censored: mod.censored.length } });
  })
);

r.put(
  '/:id',
  requireAuth,
  ah(async (req, res) => {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review) throw new HttpError(404, 'Review não encontrada.');
    if (review.userId !== req.user.id) throw new HttpError(403, 'Você só pode editar suas reviews.');
    const rating = validate(req.body);
    const mod = await moderate({
      text: req.body.text.trim(),
      spoiler: Boolean(req.body.spoiler),
      context: `Review do jogo ${await gameName(review.gameId)}`,
    });
    const updated = await prisma.review.update({
      where: { id: review.id },
      data: { rating, text: mod.text, spoiler: mod.spoiler, spoilerAuto: mod.spoilerAuto },
    });
    res.json({ ...updated, moderation: { spoilerAuto: mod.spoilerAuto, censored: mod.censored.length } });
  })
);

r.delete(
  '/:id',
  requireAuth,
  ah(async (req, res) => {
    const review = await prisma.review.findUnique({ where: { id: req.params.id } });
    if (!review || review.userId !== req.user.id) throw new HttpError(403, 'Sem permissão.');
    await prisma.review.delete({ where: { id: review.id } });
    res.status(204).end();
  })
);

r.post(
  '/:id/comments',
  requireAuth,
  ah(async (req, res) => {
    const text = String(req.body.text || '').trim();
    if (!text) throw new HttpError(400, 'Comentário vazio.');
    const review = await prisma.review.findUnique({ where: { id: req.params.id }, include: { game: true } });
    if (!review) throw new HttpError(404, 'Review não encontrada.');
    const mod = await moderate({ text, context: `Comentário numa review do jogo ${review.game.name}` });
    const comment = await prisma.comment.create({
      data: { text: mod.text, spoiler: mod.spoiler, spoilerAuto: mod.spoilerAuto, userId: req.user.id, reviewId: review.id },
      include: { user: { select: publicUser } },
    });
    res.status(201).json(comment);
  })
);

export default r;
