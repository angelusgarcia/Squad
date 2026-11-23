// Tempo real: chat de texto e sinalização das chamadas (WebRTC)
import { Server } from 'socket.io';
import { prisma, publicUser } from '../lib/prisma.js';
import { verifyToken } from '../middleware/auth.js';
import { moderate } from '../services/moderation.js';

const voiceRooms = new Map();

function roomSnapshot(channelId) {
  const room = voiceRooms.get(channelId);
  if (!room) return [];
  return [...room.entries()].map(([socketId, p]) => ({ socketId, user: p.user, state: p.state }));
}

export function setupSocket(httpServer, corsOrigin) {
  const io = new Server(httpServer, { cors: { origin: corsOrigin } });

  io.use(async (socket, next) => {
    const auth = verifyToken(socket.handshake.auth?.token);
    if (!auth) return next(new Error('unauthorized'));
    const user = await prisma.user.findUnique({ where: { id: auth.id }, select: publicUser });
    if (!user) return next(new Error('unauthorized'));
    socket.data.user = user;
    next();
  });

  const broadcastPresence = (serverId, channelId) =>
    io.to(`server:${serverId}`).emit('voice:presence', { channelId, participants: roomSnapshot(channelId) });

  function leaveVoice(socket) {
    const current = socket.data.voice;
    if (!current) return;
    const room = voiceRooms.get(current.channelId);
    room?.delete(socket.id);
    if (room && room.size === 0) voiceRooms.delete(current.channelId);
    socket.leave(`voice:${current.channelId}`);
    socket.to(`voice:${current.channelId}`).emit('voice:peer-left', { socketId: socket.id });
    broadcastPresence(current.serverId, current.channelId);
    socket.data.voice = null;
  }

  io.on('connection', (socket) => {
    const user = socket.data.user;

    // ---- Servidor (para presença nas salas de voz) ----
    socket.on('server:watch', async ({ serverId }, ack) => {
      [...socket.rooms].filter((r) => r.startsWith('server:')).forEach((r) => socket.leave(r));
      socket.join(`server:${serverId}`);
      const channels = await prisma.channel.findMany({ where: { serverId, type: 'VOICE' } });
      ack?.(Object.fromEntries(channels.map((c) => [c.id, roomSnapshot(c.id)])));
    });

    // ---- Chat de texto ----
    socket.on('channel:join', ({ channelId }) => {
      [...socket.rooms].filter((r) => r.startsWith('text:')).forEach((r) => socket.leave(r));
      socket.join(`text:${channelId}`);
    });

    socket.on('message:send', async ({ channelId, content }, ack) => {
      const text = String(content || '').trim().slice(0, 2000);
      if (!text) return;
      const channel = await prisma.channel.findUnique({ where: { id: channelId } });
      if (!channel) return ack?.({ error: 'Canal não existe' });
      const member = await prisma.serverMember.findUnique({
        where: { userId_serverId: { userId: user.id, serverId: channel.serverId } },
      });
      if (!member) return ack?.({ error: 'Você não é membro' });
      let mod;
      try {
        const server = await prisma.server.findUnique({ where: { id: channel.serverId }, include: { game: true } });
        mod = await moderate({
          text,
          spoiler: false,
          context: `Chat do squad "${server.name}"${server.game ? ` (jogo: ${server.game.name})` : ''}`,
        });
      } catch (err) {
        return ack?.({ error: err.message });
      }
      const msg = await prisma.message.create({
        data: { content: mod.text, spoiler: mod.spoiler, spoilerAuto: mod.spoilerAuto, channelId, userId: user.id },
        include: { user: { select: publicUser } },
      });
      io.to(`text:${channelId}`).emit('message:new', msg);
      ack?.({ ok: true });
    });

    socket.on('typing', ({ channelId }) => {
      socket.to(`text:${channelId}`).emit('typing', { channelId, username: user.username });
    });

    // ---- Chamada de voz / vídeo / tela ----
    socket.on('voice:join', ({ channelId, serverId, state }, ack) => {
      leaveVoice(socket);
      if (!voiceRooms.has(channelId)) voiceRooms.set(channelId, new Map());
      const room = voiceRooms.get(channelId);
      const peers = roomSnapshot(channelId);
      room.set(socket.id, { user, serverId, state: state || {} });
      socket.data.voice = { channelId, serverId };
      socket.join(`voice:${channelId}`);
      socket.to(`voice:${channelId}`).emit('voice:peer-joined', { socketId: socket.id, user, state: state || {} });
      broadcastPresence(serverId, channelId);
      ack?.({ peers });
    });

    socket.on('voice:leave', () => leaveVoice(socket));

    // Sinalização WebRTC
    socket.on('voice:signal', ({ to, data }) => {
      io.to(to).emit('voice:signal', { from: socket.id, data });
    });

    // Estado do microfone, câmera e tela
    socket.on('voice:state', (state) => {
      const v = socket.data.voice;
      if (!v) return;
      const p = voiceRooms.get(v.channelId)?.get(socket.id);
      if (p) p.state = { ...p.state, ...state };
      socket.to(`voice:${v.channelId}`).emit('voice:peer-state', { socketId: socket.id, state: p?.state });
      broadcastPresence(v.serverId, v.channelId);
    });

    socket.on('disconnect', () => leaveVoice(socket));
  });

  return io;
}
