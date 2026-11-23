// RF01 (login) e RF02 (cadastro)
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma, ah, HttpError, slugify } from '../lib/prisma.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const r = Router();

const me = (u) => ({
  id: u.id,
  email: u.email,
  username: u.username,
  bio: u.bio,
  avatarUrl: u.avatarUrl,
  isAdmin: u.isAdmin,
});

r.post(
  '/register',
  ah(async (req, res) => {
    const { email, password, username } = req.body;
    if (!email || !password || !username) throw new HttpError(400, 'Preencha e-mail, usuário e senha.');
    if (password.length < 6) throw new HttpError(400, 'A senha precisa ter pelo menos 6 caracteres.');
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(username))
      throw new HttpError(400, 'Usuário: 3 a 20 caracteres (letras, números, _ ou .).');

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { username }] },
    });
    if (exists) throw new HttpError(409, 'E-mail ou nome de usuário já em uso.');

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        passwordHash: await bcrypt.hash(password, 10),
        bio: 'Novo por aqui! 🎮',
      },
    });
    await joinDefaultServer(user.id);
    res.status(201).json({ token: signToken(user), user: me(user) });
  })
);

r.post(
  '/login',
  ah(async (req, res) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: String(email || '').toLowerCase() } });
    if (!user?.passwordHash || !(await bcrypt.compare(password || '', user.passwordHash)))
      throw new HttpError(401, 'E-mail ou senha inválidos.');
    res.json({ token: signToken(user), user: me(user) });
  })
);

// Login com Google
r.post(
  '/google',
  ah(async (req, res) => {
    const { credential } = req.body;
    if (!process.env.GOOGLE_CLIENT_ID) throw new HttpError(501, 'Login com Google não configurado.');
    const check = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const info = await check.json();
    if (!check.ok || info.aud !== process.env.GOOGLE_CLIENT_ID) throw new HttpError(401, 'Token do Google inválido.');

    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId: info.sub }, { email: info.email }] },
    });
    if (!user) {
      let base = slugify(info.name || info.email.split('@')[0]).replace(/-/g, '_').slice(0, 16) || 'gamer';
      let username = base;
      while (await prisma.user.findUnique({ where: { username } })) username = `${base}${Math.floor(Math.random() * 999)}`;
      user = await prisma.user.create({
        data: { email: info.email, googleId: info.sub, username, avatarUrl: info.picture },
      });
      await joinDefaultServer(user.id);
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId: info.sub } });
    }
    res.json({ token: signToken(user), user: me(user) });
  })
);

r.get(
  '/me',
  requireAuth,
  ah(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) throw new HttpError(401, 'Sessão expirada.');
    res.json(me(user));
  })
);

// Entrada automática no servidor oficial
async function joinDefaultServer(userId) {
  const server = await prisma.server.findFirst({ orderBy: { createdAt: 'asc' } });
  if (server)
    await prisma.serverMember.create({ data: { userId, serverId: server.id } }).catch(() => {});
}

export default r;
