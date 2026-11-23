// Comunidade: servidores, canais e mensagens
import { Router } from 'express';
import { prisma, ah, HttpError, publicUser } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const r = Router();
r.use(requireAuth);

async function assertMember(userId, serverId) {
  const m = await prisma.serverMember.findUnique({ where: { userId_serverId: { userId, serverId } } });
  if (!m) throw new HttpError(403, 'Entre no servidor primeiro.');
  return m;
}

// Lista de servidores
r.get(
  '/servers',
  ah(async (req, res) => {
    const all = await prisma.server.findMany({
      include: {
        game: { select: { name: true, coverUrl: true } },
        _count: { select: { members: true } },
        members: { where: { userId: req.user.id }, select: { role: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json(all.map(({ members, ...s }) => ({ ...s, joined: members.length > 0, role: members[0]?.role })));
  })
);

r.post(
  '/servers',
  ah(async (req, res) => {
    const { name, description, color, gameId } = req.body;
    if (!name?.trim()) throw new HttpError(400, 'Dê um nome ao servidor.');
    const server = await prisma.server.create({
      data: {
        name: name.trim(),
        description,
        color: color || '#7c5cff',
        gameId: gameId ? Number(gameId) : null,
        ownerId: req.user.id,
        members: { create: { userId: req.user.id, role: 'owner' } },
        channels: {
          create: [
            { name: 'geral', type: 'TEXT', position: 0 },
            { name: 'clipes-e-prints', type: 'TEXT', position: 1 },
            { name: 'Sala de voz', type: 'VOICE', position: 2 },
          ],
        },
      },
    });
    res.status(201).json(server);
  })
);

r.post(
  '/servers/:id/join',
  ah(async (req, res) => {
    await prisma.serverMember.upsert({
      where: { userId_serverId: { userId: req.user.id, serverId: req.params.id } },
      create: { userId: req.user.id, serverId: req.params.id },
      update: {},
    });
    res.json({ joined: true });
  })
);

r.post(
  '/servers/:id/leave',
  ah(async (req, res) => {
    await prisma.serverMember.deleteMany({ where: { userId: req.user.id, serverId: req.params.id } });
    res.json({ joined: false });
  })
);

r.get(
  '/servers/:id',
  ah(async (req, res) => {
    await assertMember(req.user.id, req.params.id);
    const server = await prisma.server.findUnique({
      where: { id: req.params.id },
      include: {
        game: { select: { name: true, slug: true, coverUrl: true } },
        channels: { orderBy: { position: 'asc' } },
        members: { include: { user: { select: publicUser } }, orderBy: { joinedAt: 'asc' } },
      },
    });
    if (!server) throw new HttpError(404, 'Servidor não encontrado.');
    res.json(server);
  })
);

r.post(
  '/servers/:id/channels',
  ah(async (req, res) => {
    const m = await assertMember(req.user.id, req.params.id);
    if (m.role !== 'owner') throw new HttpError(403, 'Só o dono pode criar canais.');
    const { name, type = 'TEXT' } = req.body;
    if (!name?.trim()) throw new HttpError(400, 'Nome do canal obrigatório.');
    const count = await prisma.channel.count({ where: { serverId: req.params.id } });
    const channel = await prisma.channel.create({
      data: {
        name: type === 'TEXT' ? name.trim().toLowerCase().replace(/\s+/g, '-') : name.trim(),
        type: type === 'VOICE' ? 'VOICE' : 'TEXT',
        position: count,
        serverId: req.params.id,
      },
    });
    res.status(201).json(channel);
  })
);

r.get(
  '/channels/:id/messages',
  ah(async (req, res) => {
    const channel = await prisma.channel.findUnique({ where: { id: req.params.id } });
    if (!channel) throw new HttpError(404, 'Canal não encontrado.');
    await assertMember(req.user.id, channel.serverId);
    const msgs = await prisma.message.findMany({
      where: { channelId: channel.id },
      include: { user: { select: publicUser } },
      orderBy: { createdAt: 'desc' },
      take: 60,
    });
    res.json(msgs.reverse());
  })
);

export default r;
