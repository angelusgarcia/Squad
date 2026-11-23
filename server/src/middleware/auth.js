import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const SECRET = () => process.env.JWT_SECRET || 'dev-secret';

export function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, SECRET(), { expiresIn: '7d' });
}

export function verifyToken(token) {
  try {
    const payload = jwt.verify(token, SECRET());
    return { id: payload.sub, username: payload.username };
  } catch {
    return null;
  }
}

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

// Login opcional
export function optionalAuth(req, _res, next) {
  const token = readToken(req);
  req.user = token ? verifyToken(token) : null;
  next();
}

// Rotas que exigem login
export function requireAuth(req, res, next) {
  const token = readToken(req);
  const user = token && verifyToken(token);
  if (!user) return res.status(401).json({ error: 'Faça login para continuar.' });
  req.user = user;
  next();
}

// Rotas da equipe Squad
export async function requireAdmin(req, res, next) {
  requireAuth(req, res, async () => {
    const u = await prisma.user.findUnique({ where: { id: req.user.id }, select: { isAdmin: true } });
    if (!u?.isAdmin) return res.status(403).json({ error: 'Área exclusiva da equipe Squad.' });
    next();
  });
}
