// RF03 (perfil), RF04 (seguir)
import { Router } from 'express';
import { prisma, ah, HttpError, publicUser } from '../lib/prisma.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const r = Router();

r.get(
  '/:username',
  optionalAuth,
  ah(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { username: req.params.username },
      select: {
        ...publicUser,
        createdAt: true,
        _count: { select: { followers: true, following: true, reviews: true, topics: true } },
        favorites: { include: { game: true }, orderBy: { createdAt: 'desc' } },
        reviews: { include: { game: true }, orderBy: { createdAt: 'desc' }, take: 10 },
        guides: {
          where: { status: 'PUBLISHED' },
          select: { id: true, title: true, publishedAt: true, game: { select: { name: true } } },
          orderBy: { publishedAt: 'desc' },
        },
        indications: { include: { game: true }, orderBy: { createdAt: 'desc' }, take: 6 },
      },
    });
    if (!user) throw new HttpError(404, 'Usuário não encontrado.');

    let isFollowing = false;
    let followsMe = false;
    if (req.user && req.user.id !== user.id) {
      const [a, b] = await Promise.all([
        prisma.follow.findUnique({ where: { followerId_followingId: { followerId: req.user.id, followingId: user.id } } }),
        prisma.follow.findUnique({ where: { followerId_followingId: { followerId: user.id, followingId: req.user.id } } }),
      ]);
      isFollowing = Boolean(a);
      followsMe = Boolean(b);
    }
    res.json({ ...user, isFollowing, followsMe, isMe: req.user?.id === user.id });
  })
);

r.patch(
  '/me',
  requireAuth,
  ah(async (req, res) => {
    const { username, bio, avatarUrl } = req.body;
    if (username && !/^[a-zA-Z0-9_.]{3,20}$/.test(username))
      throw new HttpError(400, 'Usuário: 3 a 20 caracteres (letras, números, _ ou .).');
    try {
      const user = await prisma.user.update({
        where: { id: req.user.id },
        data: { username, bio, avatarUrl },
        select: { ...publicUser, email: true },
      });
      res.json(user);
    } catch (e) {
      if (e.code === 'P2002') throw new HttpError(409, 'Esse nome de usuário já existe.');
      throw e;
    }
  })
);

r.post(
  '/:username/follow',
  requireAuth,
  ah(async (req, res) => {
    const target = await prisma.user.findUnique({ where: { username: req.params.username } });
    if (!target) throw new HttpError(404, 'Usuário não encontrado.');
    if (target.id === req.user.id) throw new HttpError(400, 'Você não pode seguir a si mesmo.');

    const key = { followerId: req.user.id, followingId: target.id };
    const existing = await prisma.follow.findUnique({ where: { followerId_followingId: key } });
    if (existing) await prisma.follow.delete({ where: { followerId_followingId: key } });
    else await prisma.follow.create({ data: key });
    res.json({ following: !existing });
  })
);

// Seguidores / seguindo
async function withViewer(users, viewerId) {
  if (!viewerId || !users.length) return users.map((u) => ({ ...u, isFollowing: false, followsMe: false, isMe: false }));
  const ids = users.map((u) => u.id);
  const [iFollow, followMe] = await Promise.all([
    prisma.follow.findMany({ where: { followerId: viewerId, followingId: { in: ids } }, select: { followingId: true } }),
    prisma.follow.findMany({ where: { followingId: viewerId, followerId: { in: ids } }, select: { followerId: true } }),
  ]);
  const a = new Set(iFollow.map((f) => f.followingId));
  const b = new Set(followMe.map((f) => f.followerId));
  return users.map((u) => ({ ...u, isFollowing: a.has(u.id), followsMe: b.has(u.id), isMe: u.id === viewerId }));
}

r.get(
  '/:username/followers',
  optionalAuth,
  ah(async (req, res) => {
    const list = await prisma.follow.findMany({
      where: { following: { username: req.params.username } },
      select: { follower: { select: publicUser } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(await withViewer(list.map((f) => f.follower), req.user?.id));
  })
);

r.get(
  '/:username/following',
  optionalAuth,
  ah(async (req, res) => {
    const list = await prisma.follow.findMany({
      where: { follower: { username: req.params.username } },
      select: { following: { select: publicUser } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(await withViewer(list.map((f) => f.following), req.user?.id));
  })
);

// Sugestões de quem seguir
r.get(
  '/discover/people',
  requireAuth,
  ah(async (req, res) => {
    const users = await prisma.user.findMany({
      where: { id: { not: req.user.id }, followers: { none: { followerId: req.user.id } } },
      select: { ...publicUser, _count: { select: { followers: true } } },
      orderBy: { followers: { _count: 'desc' } },
      take: 8,
    });
    res.json(await withViewer(users, req.user.id));
  })
);

export default r;
