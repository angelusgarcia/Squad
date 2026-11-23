// Sugestões de jogos para o catálogo
import { Router } from 'express';
import { prisma, ah, HttpError, publicUser } from '../lib/prisma.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { moderate } from '../services/moderation.js';
import { importSearch, rawgEnabled } from '../services/rawg.js';

const r = Router();

// Enviar sugestão
r.post(
  '/',
  requireAuth,
  ah(async (req, res) => {
    const name = String(req.body.name || '').trim();
    if (name.length < 2) throw new HttpError(400, 'Informe o nome do jogo.');

    const existing = await prisma.game.findFirst({ where: { name: { equals: name, mode: 'insensitive' } } });
    if (existing) throw new HttpError(409, `“${existing.name}” já está no catálogo!`);

    const dup = await prisma.gameSuggestion.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, status: 'PENDING' },
    });
    if (dup) throw new HttpError(409, 'Esse jogo já foi sugerido e está na fila da equipe. Valeu!');

    const reason = String(req.body.reason || '').trim();
    const mod = reason ? await moderate({ text: reason, context: `Sugestão do jogo ${name} para o catálogo` }) : null;

    const s = await prisma.gameSuggestion.create({
      data: {
        name: name.slice(0, 120),
        platform: String(req.body.platform || '').trim().slice(0, 60) || null,
        link: /^https?:\/\//.test(req.body.link || '') ? req.body.link.slice(0, 300) : null,
        reason: mod?.text || null,
        userId: req.user.id,
      },
    });
    res.status(201).json(s);
  })
);

// Minhas sugestões
r.get(
  '/mine',
  requireAuth,
  ah(async (req, res) => {
    res.json(await prisma.gameSuggestion.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }));
  })
);

// ---------- Área da equipe ----------

r.get(
  '/',
  requireAdmin,
  ah(async (req, res) => {
    const status = ['PENDING', 'APPROVED', 'REJECTED'].includes(req.query.status) ? req.query.status : undefined;
    const [items, counts] = await Promise.all([
      prisma.gameSuggestion.findMany({
        where: status ? { status } : {},
        include: { user: { select: publicUser } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.gameSuggestion.groupBy({ by: ['status'], _count: true }),
    ]);
    res.json({ items, counts: Object.fromEntries(counts.map((c) => [c.status, c._count])) });
  })
);

r.patch(
  '/:id',
  requireAdmin,
  ah(async (req, res) => {
    const { status, teamNote } = req.body;
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) throw new HttpError(400, 'Status inválido.');
    const s = await prisma.gameSuggestion.update({
      where: { id: req.params.id },
      data: { status, teamNote: teamNote?.trim() || null },
    });

    let imported = 0;
    if (status === 'APPROVED' && rawgEnabled()) imported = await importSearch(s.name);
    res.json({ ...s, imported });
  })
);

export default r;
