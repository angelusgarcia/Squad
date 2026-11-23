// Recomendação personalizada por IA (RF12)
import { prisma } from '../lib/prisma.js';

export async function buildUserTaste(userId) {
  const [reviews, favorites] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      include: { game: { include: { genres: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 30,
    }),
    prisma.favorite.findMany({
      where: { userId },
      include: { game: { include: { genres: true } } },
    }),
  ]);
  return { reviews, favorites };
}

async function candidateGames(excludeIds) {
  return prisma.game.findMany({
    where: { id: { notIn: [...excludeIds] } },
    include: { genres: true },
    orderBy: [{ rating: 'desc' }],
    take: 60,
  });
}

// Recomendador por gênero (sem chave de IA)
function heuristic(taste, candidates, limit) {
  const weight = {};
  const add = (genres, w) => genres.forEach((g) => (weight[g.name] = (weight[g.name] || 0) + w));
  taste.reviews.forEach((r) => add(r.game.genres, r.rating - 5));
  taste.favorites.forEach((f) => add(f.game.genres, 4));

  return candidates
    .map((g) => {
      const matched = g.genres.filter((x) => (weight[x.name] || 0) > 0);
      const score = matched.reduce((s, x) => s + weight[x.name], 0) + (g.rating || 0);
      return { g, score, matched };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ g, matched }) => ({
      gameId: g.id,
      reason: matched.length
        ? `Você costuma curtir jogos de ${matched.map((m) => m.name).join(', ')} — ${g.name} é bem avaliado nesse estilo.`
        : `${g.name} é um dos jogos mais bem avaliados do catálogo e pode ampliar seu repertório.`,
    }));
}

async function askClaude(taste, candidates, limit) {
  const liked = [
    ...taste.reviews.map((r) => `- ${r.game.name} (nota ${r.rating}/10): "${r.text.slice(0, 160)}"`),
    ...taste.favorites.map((f) => `- ${f.game.name} (favorito)`),
  ].join('\n');

  const catalog = candidates
    .map((g) => `${g.id} | ${g.name} | ${g.genres.map((x) => x.name).join(', ')}`)
    .join('\n');

  const prompt = `Você é o recomendador do Squad, uma rede social de jogos.
Histórico do usuário:
${liked || '(sem histórico — recomende jogos variados e bem avaliados)'}

Catálogo disponível (id | nome | gêneros). Recomende APENAS jogos desta lista:
${catalog}

Escolha ${limit} jogos e responda SOMENTE com JSON no formato:
[{"gameId": <id numérico da lista>, "reason": "<justificativa curta em português, 1-2 frases, citando o gosto do usuário>"}]`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Claude respondeu ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.content?.map((c) => c.text || '').join('') || '';
  const json = text.slice(text.indexOf('['), text.lastIndexOf(']') + 1);
  return JSON.parse(json);
}

export async function generateRecommendations(userId, limit = 6) {
  const taste = await buildUserTaste(userId);
  const exclude = new Set([
    ...taste.reviews.map((r) => r.gameId),
    ...taste.favorites.map((f) => f.gameId),
  ]);
  const candidates = await candidateGames(exclude);
  if (!candidates.length) return { source: 'none', items: [], aiError: 'Catálogo vazio.' };

  let items;
  let source = 'heuristic';
  let aiError = null;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      items = await askClaude(taste, candidates, limit);
      source = 'claude';
    } catch (err) {
      const cause = err.cause ? ` → ${err.cause.code || ''} ${err.cause.message || ''}`.trim() : '';
      aiError = `${err.message}${cause ? ' ' + cause : ''}`.slice(0, 300);
      console.warn('[ia] falhou, usando recomendador simples:', err.message, err.cause || '');
    }
  } else {
    aiError = 'ANTHROPIC_API_KEY não encontrada no server/.env (reinicie o backend depois de salvar).';
  }
  if (!items) items = heuristic(taste, candidates, limit);

  const valid = new Set(candidates.map((c) => c.id));
  const seen = new Set();
  items = items
    .filter((i) => valid.has(Number(i.gameId)) && !seen.has(Number(i.gameId)) && seen.add(Number(i.gameId)))
    .slice(0, limit);

  const batchId = `b_${Date.now()}`;
  await prisma.recommendation.createMany({
    data: items.map((i) => ({ batchId, userId, gameId: Number(i.gameId), reason: String(i.reason) })),
  });
  return { source, batchId, aiError };
}
