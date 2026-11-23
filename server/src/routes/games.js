// RF05 (favoritar), RF06 (catálogo/busca), RF07 (ficha), RF13 (sync RAWG)
import { Router } from 'express';
import { prisma, ah, HttpError, publicUser } from '../lib/prisma.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { importSearch, refreshIfStale } from '../services/rawg.js';

const r = Router();

const listInclude = {
  genres: true,
  platforms: true,
  _count: { select: { reviews: true, favorites: true } },
};

r.get(
  '/',
  ah(async (req, res) => {
    const { q = '', genre, platform, sort = 'rating', page = 1 } = req.query;
    const take = 24;
    const where = {
      ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      ...(genre ? { genres: { some: { slug: genre } } } : {}),
      ...(platform ? { platforms: { some: { slug: platform } } } : {}),
    };
    const orderBy =
      sort === 'name'
        ? { name: 'asc' }
        : sort === 'recent'
          ? { released: { sort: 'desc', nulls: 'last' } }
          : { rating: { sort: 'desc', nulls: 'last' } };

    let total = await prisma.game.count({ where });
    if (q && total < 3 && Number(page) === 1) {
      const imported = await importSearch(q);
      if (imported) total = await prisma.game.count({ where });
    }

    const games = await prisma.game.findMany({
      where,
      include: listInclude,
      orderBy: [orderBy, { id: 'asc' }],
      skip: (Number(page) - 1) * take,
      take,
    });
    res.json({ games, total, pages: Math.ceil(total / take) });
  })
);

r.get(
  '/filters',
  ah(async (_req, res) => {
    const [genres, platforms] = await Promise.all([
      prisma.genre.findMany({ orderBy: { name: 'asc' } }),
      prisma.platform.findMany({ orderBy: { name: 'asc' } }),
    ]);
    res.json({ genres, platforms });
  })
);

r.get(
  '/:slug',
  optionalAuth,
  ah(async (req, res) => {
    const game = await prisma.game.findUnique({
      where: { slug: req.params.slug },
      include: {
        ...listInclude,
        topics: {
          include: { user: { select: publicUser }, _count: { select: { replies: true } } },
          orderBy: { lastActivityAt: 'desc' },
          take: 5,
        },
        guides: {
          where: { status: 'PUBLISHED' },
          include: { user: { select: publicUser } },
          orderBy: { publishedAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!game) throw new HttpError(404, 'Jogo não encontrado.');

    refreshIfStale(game);

    const avg = await prisma.review.aggregate({ where: { gameId: game.id }, _avg: { rating: true } });
    let isFavorite = false;
    let myReview = null;
    if (req.user) {
      const key = { userId: req.user.id, gameId: game.id };
      isFavorite = Boolean(await prisma.favorite.findUnique({ where: { userId_gameId: key } }));
      myReview = await prisma.review.findUnique({ where: { userId_gameId: key } });
    }
    res.json({ ...game, communityRating: avg._avg.rating, isFavorite, myReview });
  })
);

r.post(
  '/:id/favorite',
  requireAuth,
  ah(async (req, res) => {
    const key = { userId: req.user.id, gameId: Number(req.params.id) };
    const existing = await prisma.favorite.findUnique({ where: { userId_gameId: key } });
    if (existing) await prisma.favorite.delete({ where: { userId_gameId: key } });
    else await prisma.favorite.create({ data: key });
    res.json({ favorite: !existing });
  })
);

export default r;
