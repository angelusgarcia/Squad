// npm run db:trailers — atualiza os trailers
import 'dotenv/config';
import { prisma } from '../src/lib/prisma.js';
import { EXTRA_GAMES } from './games-data.js';
import { slugify } from '../src/lib/prisma.js';

const withTrailer = new Map(EXTRA_GAMES.filter((g) => g.trailer).map((g) => [slugify(g.name), g.trailer]));

await prisma.game.updateMany({
  where: { trailerYoutubeId: { not: null }, slug: { notIn: [...withTrailer.keys()] } },
  data: { trailerYoutubeId: null },
});
for (const [slug, id] of withTrailer) {
  const r = await prisma.game.updateMany({ where: { slug }, data: { trailerYoutubeId: id } });
  console.log(`${r.count ? '✔' : '✖ (jogo não encontrado)'} ${slug} → ${id}`);
}
await prisma.$disconnect();
