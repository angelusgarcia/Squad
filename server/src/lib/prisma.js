import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Campos públicos de usuário
export const publicUser = {
  id: true,
  username: true,
  avatarUrl: true,
  bio: true,
};

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Wrapper de rotas async
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
