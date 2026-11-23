// npm run sync:rawg — importa jogos populares da RAWG
import 'dotenv/config';
import { importPopular, rawgEnabled } from './rawg.js';
import { prisma } from '../lib/prisma.js';

if (!rawgEnabled()) {
  console.log('Defina RAWG_API_KEY no .env para importar jogos.');
  process.exit(0);
}

const total = await importPopular(Number(process.argv[2] || 2));
console.log(`✔ ${total} jogos importados/atualizados`);
await prisma.$disconnect();
