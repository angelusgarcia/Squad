// RF10 (guias) e RF11 (comentários em guias)
import { Router } from 'express';
import { prisma, ah, HttpError, publicUser } from '../lib/prisma.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { moderate } from '../services/moderation.js';

const r = Router();

const include = {
  user: { select: publicUser },
  game: { select: { id: true, name: true, slug: true, coverUrl: true } },
};

r.get(
  '/',
  ah(async (req, res) => {
    const { gameId, q } = req.query;
    const guides = await prisma.guide.findMany({
      where: {
        status: 'PUBLISHED',
        ...(gameId ? { gameId: Number(gameId) } : {}),
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      },
      include: { ...include, _count: { select: { comments: true } } },
      orderBy: { publishedAt: 'desc' },
    });
    res.json(guides);
  })
);

r.get(
  '/mine',
  requireAuth,
  ah(async (req, res) => {
    res.json(
      await prisma.guide.findMany({ where: { userId: req.user.id }, include, orderBy: { updatedAt: 'desc' } })
    );
  })
);

r.get(
  '/:id',
  optionalAuth,
  ah(async (req, res) => {
    const guide = await prisma.guide.findUnique({
      where: { id: req.params.id },
      include: {
        ...include,
        comments: { include: { user: { select: publicUser } }, orderBy: { createdAt: 'asc' } },
      },
    });
    if (!guide || (guide.status === 'DRAFT' && guide.userId !== req.user?.id))
      throw new HttpError(404, 'Guia não encontrado.');
    res.json(guide);
  })
);

r.post(
  '/',
  requireAuth,
  ah(async (req, res) => {
    const { title, content, gameId, publish } = req.body;
    if (!title?.trim()) throw new HttpError(400, 'Dê um título ao guia.');
    const guide = await prisma.guide.create({
      data: {
        title: title.trim(),
        content: content || '',
        gameId: gameId ? Number(gameId) : null,
        userId: req.user.id,
        status: publish ? 'PUBLISHED' : 'DRAFT',
        publishedAt: publish ? new Date() : null,
      },
    });
    res.status(201).json(guide);
  })
);

r.put(
  '/:id',
  requireAuth,
  ah(async (req, res) => {
    const guide = await prisma.guide.findUnique({ where: { id: req.params.id } });
    if (!guide || guide.userId !== req.user.id) throw new HttpError(403, 'Sem permissão.');
    const { title, content, gameId, publish } = req.body;
    const status = publish === undefined ? guide.status : publish ? 'PUBLISHED' : 'DRAFT';
    res.json(
      await prisma.guide.update({
        where: { id: guide.id },
        data: {
          title,
          content,
          gameId: gameId === undefined ? undefined : gameId ? Number(gameId) : null,
          status,
          publishedAt: status === 'PUBLISHED' ? guide.publishedAt || new Date() : null,
        },
      })
    );
  })
);

r.delete(
  '/:id',
  requireAuth,
  ah(async (req, res) => {
    const guide = await prisma.guide.findUnique({ where: { id: req.params.id } });
    if (!guide || guide.userId !== req.user.id) throw new HttpError(403, 'Sem permissão.');
    await prisma.guide.delete({ where: { id: guide.id } });
    res.status(204).end();
  })
);

r.post(
  '/:id/comments',
  requireAuth,
  ah(async (req, res) => {
    const text = String(req.body.text || '').trim();
    if (!text) throw new HttpError(400, 'Comentário vazio.');
    const guide = await prisma.guide.findUnique({ where: { id: req.params.id }, include: { game: true } });
    if (!guide) throw new HttpError(404, 'Guia não encontrado.');
    const mod = await moderate({ text, context: `Comentário no guia "${guide.title}"${guide.game ? ` do jogo ${guide.game.name}` : ''}` });
    const comment = await prisma.comment.create({
      data: { text: mod.text, spoiler: mod.spoiler, spoilerAuto: mod.spoilerAuto, userId: req.user.id, guideId: guide.id },
      include: { user: { select: publicUser } },
    });
    res.status(201).json(comment);
  })
);

export default r;
