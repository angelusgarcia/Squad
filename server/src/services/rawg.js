// Integração com a RAWG.io (RF06, RF07, RF13)
import { prisma, slugify } from '../lib/prisma.js';

const BASE = 'https://api.rawg.io/api';
const STALE_MS = 1000 * 60 * 60 * 24 * 7;

export const rawgEnabled = () => Boolean(process.env.RAWG_API_KEY);

async function rawgFetch(path, params = {}) {
  const url = new URL(BASE + path);
  url.searchParams.set('key', process.env.RAWG_API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`RAWG respondeu ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

const stripHtml = (html) => (html || '').replace(/<[^>]+>/g, '').trim();

// Salvar jogo da RAWG no banco
export async function upsertFromRawg(r) {
  const genres = (r.genres || []).map((g) => ({
    where: { slug: g.slug },
    create: { name: g.name, slug: g.slug },
  }));
  const platforms = (r.platforms || []).map(({ platform: p }) => ({
    where: { slug: p.slug },
    create: { name: p.name, slug: p.slug },
  }));

  const data = {
    name: r.name,
    coverUrl: r.background_image || null,
    released: r.released ? new Date(r.released) : null,
    metacritic: r.metacritic ?? null,
    rating: r.rating ?? null,
    syncedAt: new Date(),
    ...(r.description_raw || r.description
      ? { description: r.description_raw || stripHtml(r.description) }
      : {}),
  };

  const existing = await prisma.game.findFirst({
    where: { OR: [{ rawgId: r.id }, { slug: r.slug || slugify(r.name) }] },
  });

  if (existing) {
    return prisma.game.update({
      where: { id: existing.id },
      data: {
        ...data,
        rawgId: r.id,
        genres: { set: [], connectOrCreate: genres },
        platforms: { set: [], connectOrCreate: platforms },
      },
    });
  }
  return prisma.game.create({
    data: {
      ...data,
      rawgId: r.id,
      slug: r.slug || slugify(r.name),
      genres: { connectOrCreate: genres },
      platforms: { connectOrCreate: platforms },
    },
  });
}

// Importar busca da RAWG (RF13)
export async function importSearch(query) {
  if (!rawgEnabled() || !query) return 0;
  try {
    const data = await rawgFetch('/games', { search: query, page_size: 10 });
    let count = 0;
    for (const r of data.results || []) {
      await upsertFromRawg(r);
      count++;
    }
    return count;
  } catch (err) {
    console.warn('[rawg] busca indisponível, usando só cache local:', err.message);
    return 0;
  }
}

// Sincronização em segundo plano (RF07)
export function refreshIfStale(game) {
  if (!rawgEnabled() || !game.rawgId) return;
  const age = game.syncedAt ? Date.now() - new Date(game.syncedAt).getTime() : Infinity;
  if (age < STALE_MS) return;
  rawgFetch(`/games/${game.rawgId}`)
    .then(upsertFromRawg)
    .catch((err) => console.warn('[rawg] sync em segundo plano falhou:', err.message));
}

export async function importPopular(pages = 2) {
  let total = 0;
  for (let page = 1; page <= pages; page++) {
    const data = await rawgFetch('/games', { ordering: '-added', page_size: 40, page });
    for (const r of data.results || []) {
      await upsertFromRawg(r);
      total++;
    }
  }
  return total;
}
