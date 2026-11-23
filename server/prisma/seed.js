// npm run db:seed — popula o banco com dados de exemplo
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma, slugify } from '../src/lib/prisma.js';
import { EXTRA_GAMES } from './games-data.js';

// Trailers do YouTube
const TRAILERS = {};

// Capas dos jogos
const RAWG = 'https://media.rawg.io/media/resize/1280/-/';
const COVERS = {
  'The Witcher 3: Wild Hunt': RAWG + 'games/618/618c2031a07bbff6b4f611f10b6bcdbc.jpg',
  'Elden Ring': RAWG + 'games/b29/b294fdd866dcdb643e7bab370a552855.jpg',
  'Hollow Knight': RAWG + 'games/4cf/4cfc6b7f1850590a4634b08bfab308ab.jpg',
  'Stardew Valley': RAWG + 'games/713/713269608dc8f2f40f5a670a14b2de94.jpg',
  'Hades': RAWG + 'games/1f4/1f47a270b8f241e4676b14d39ec620f7.jpg',
  'Counter-Strike 2': RAWG + 'games/736/73619bd336c894d6941d926bfd563946.jpg',
  'Valorant': RAWG + 'games/b11/b11127b9ee3c3701bd15b9af3286d20e.jpg',
  'League of Legends': RAWG + 'games/78b/78bc81e247fc7e77af700cbd632a9297.jpg',
  'Minecraft': RAWG + 'games/b4e/b4e4c73d5aa4ec66bbf75375c4847a2b.jpg',
  'Celeste': RAWG + 'games/594/59487800889ebac294c7c2c070d02356.jpg',
  'Red Dead Redemption 2': RAWG + 'games/511/5118aff5091cb3efec399c808f8c598f.jpg',
  'God of War Ragnarök': RAWG + 'games/1c3/1c305096502c475c00276c827f0fd697.jpg',
  "Baldur's Gate 3": RAWG + 'games/699/69907ecf13f172e9e144069769c3be73.jpg',
  'Terraria': RAWG + 'games/f46/f466571d536f2e3ea9e815ad17177501.jpg',
  'Sekiro: Shadows Die Twice': RAWG + 'games/67f/67f62d1f062a6164f57575e0604ee9f6.jpg',
  'Rocket League': RAWG + 'games/8cc/8cce7c0e99dcc43d66c8efd42f9d03e3.jpg',
  'Among Us': RAWG + 'games/e74/e74458058b35e01c1ae3feeb39a3f724.jpg',
  'Cyberpunk 2077': RAWG + 'games/26d/26d4437715bee60138dab4a7c8c59c92.jpg',
  'Dead Cells': RAWG + 'games/f90/f90ee1a4239247a822771c40488e68c5.jpg',
  'Portal 2': RAWG + 'games/2ba/2bac0e87cf45e5b508f227d281c9252a.jpg',
};

const GAMES = [
  ['The Witcher 3: Wild Hunt', 2015, 92, 4.66, ['RPG', 'Ação', 'Mundo Aberto'], ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'Geralt de Rívia caça monstros e procura Ciri em um mundo aberto cheio de escolhas com consequências.'],
  ['Elden Ring', 2022, 96, 4.5, ['RPG', 'Ação', 'Soulslike', 'Mundo Aberto'], ['PC', 'PlayStation', 'Xbox'], 'Explore as Terras Intermédias num soulslike de mundo aberto criado pela FromSoftware com George R. R. Martin.'],
  ['Hollow Knight', 2017, 87, 4.4, ['Metroidvania', 'Indie', 'Ação'], ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'Um cavaleiro sem nome explora o reino arruinado de Hallownest em um metroidvania desafiador.'],
  ['Stardew Valley', 2016, 89, 4.4, ['Simulação', 'Indie', 'RPG'], ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'], 'Herde a fazenda do avô, plante, pesque, faça amizades e salve o vilarejo de Pelican Town.'],
  ['Hades', 2020, 93, 4.5, ['Roguelike', 'Ação', 'Indie'], ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'Zagreus tenta escapar do Submundo em um roguelike com combate rápido e narrativa que avança a cada morte.'],
  ['Counter-Strike 2', 2023, 82, 3.6, ['FPS', 'Competitivo', 'Multiplayer'], ['PC'], 'O clássico tático 5v5 de terroristas e contraterroristas, agora na Source 2.'],
  ['Valorant', 2020, 80, 3.7, ['FPS', 'Competitivo', 'Multiplayer'], ['PC', 'PlayStation', 'Xbox'], 'Shooter tático 5v5 com agentes que possuem habilidades únicas.'],
  ['League of Legends', 2009, 78, 3.5, ['MOBA', 'Competitivo', 'Multiplayer'], ['PC'], 'Duas equipes de cinco campeões disputam para destruir o Nexus inimigo.'],
  ['Minecraft', 2011, 93, 4.4, ['Sandbox', 'Sobrevivência', 'Multiplayer'], ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'], 'Construa, explore e sobreviva em mundos feitos de blocos — sozinho ou com amigos.'],
  ['Celeste', 2018, 92, 4.3, ['Plataforma', 'Indie'], ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'Ajude Madeline a escalar a Montanha Celeste em um plataforma preciso e emocionante.'],
  ['Red Dead Redemption 2', 2018, 97, 4.6, ['Ação', 'Aventura', 'Mundo Aberto'], ['PC', 'PlayStation', 'Xbox'], 'Arthur Morgan e a gangue Van der Linde tentam sobreviver ao fim da era do Velho Oeste.'],
  ['God of War Ragnarök', 2022, 94, 4.6, ['Ação', 'Aventura'], ['PC', 'PlayStation'], 'Kratos e Atreus enfrentam o Ragnarök pelos nove reinos nórdicos.'],
  ['Baldur\'s Gate 3', 2023, 96, 4.7, ['RPG', 'Estratégia', 'Multiplayer'], ['PC', 'PlayStation', 'Xbox'], 'RPG baseado em D&D 5e com combate por turnos e liberdade enorme de escolhas.'],
  ['Terraria', 2011, 83, 4.3, ['Sandbox', 'Sobrevivência', 'Indie', 'Ação'], ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'], 'Cave, lute, construa e enfrente chefes em um sandbox 2D cheio de conteúdo.'],
  ['Sekiro: Shadows Die Twice', 2019, 90, 4.4, ['Ação', 'Soulslike'], ['PC', 'PlayStation', 'Xbox'], 'Um shinobi busca vingança no Japão da era Sengoku com combate baseado em postura.'],
  ['Rocket League', 2015, 86, 4.0, ['Esporte', 'Competitivo', 'Multiplayer'], ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch'], 'Futebol com carros turbinados — simples de aprender, difícil de dominar.'],
  ['Among Us', 2018, 85, 3.8, ['Party', 'Multiplayer', 'Indie'], ['PC', 'Mobile', 'Nintendo Switch'], 'Tripulantes tentam completar tarefas enquanto impostores sabotam a nave.'],
  ['Cyberpunk 2077', 2020, 86, 4.2, ['RPG', 'Ação', 'Mundo Aberto', 'FPS'], ['PC', 'PlayStation', 'Xbox'], 'Viva como V, um mercenário em Night City, com o implante de Johnny Silverhand na cabeça.'],
  ['Dead Cells', 2018, 89, 4.2, ['Roguelike', 'Metroidvania', 'Indie', 'Ação'], ['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'], 'Roguevania de ação rápida em uma ilha que muda a cada tentativa.'],
  ['Portal 2', 2011, 95, 4.6, ['Puzzle', 'FPS'], ['PC', 'PlayStation', 'Xbox'], 'Resolva quebra-cabeças com a arma de portais — com campanha cooperativa genial.'],
];

async function main() {
  console.log('Limpando banco...');
  await prisma.$transaction([
    prisma.gameSuggestion.deleteMany(),
    prisma.message.deleteMany(),
    prisma.channel.deleteMany(),
    prisma.serverMember.deleteMany(),
    prisma.server.deleteMany(),
    prisma.recommendation.deleteMany(),
    prisma.indicationLike.deleteMany(),
    prisma.indication.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.reply.deleteMany(),
    prisma.topic.deleteMany(),
    prisma.guide.deleteMany(),
    prisma.review.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.follow.deleteMany(),
    prisma.game.deleteMany(),
    prisma.genre.deleteMany(),
    prisma.platform.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('Criando jogos...');
  const games = {};
  for (const [name, year, meta, rating, genres, platforms, description] of GAMES) {
    games[name] = await prisma.game.create({
      data: {
        name,
        slug: slugify(name),
        description,
        coverUrl: COVERS[name] || null,
        released: new Date(`${year}-06-01`),
        metacritic: meta,
        rating,
        trailerYoutubeId: TRAILERS[name] || null,
        genres: { connectOrCreate: genres.map((g) => ({ where: { slug: slugify(g) }, create: { name: g, slug: slugify(g) } })) },
        platforms: { connectOrCreate: platforms.map((p) => ({ where: { slug: slugify(p) }, create: { name: p, slug: slugify(p) } })) },
      },
    });
  }
  for (const x of EXTRA_GAMES) {
    games[x.name] = await prisma.game.create({
      data: {
        name: x.name,
        slug: slugify(x.name),
        description: x.description,
        coverUrl: x.cover,
        released: new Date(typeof x.year === 'number' ? `${x.year}-06-01` : `${x.year}T12:00:00Z`),
        metacritic: x.metacritic,
        rating: x.metacritic ? Math.round((x.metacritic / 20) * 10) / 10 : null,
        trailerYoutubeId: x.trailer || null,
        genres: { connectOrCreate: x.genres.map((g) => ({ where: { slug: slugify(g) }, create: { name: g, slug: slugify(g) } })) },
        platforms: { connectOrCreate: x.platforms.map((p) => ({ where: { slug: slugify(p) }, create: { name: p, slug: slugify(p) } })) },
      },
    });
  }
  console.log(`  ${Object.keys(games).length} jogos no catálogo`);
  const g = (n) => games[n].id;

  console.log('Criando usuários (senha de todos: 123456)...');
  const hash = await bcrypt.hash('123456', 10);
  const mk = (username, email, bio, isAdmin = false) =>
    prisma.user.create({ data: { username, email, bio, isAdmin, passwordHash: hash } });
  const squad = await mk('squad', 'squad@squad.dev', 'Fã de RPG e soulslike. Platinei Elden Ring 2x.', true);
  const squad2 = await mk('squad2', 'squad2@squad.dev', 'Indies, cozy games e speedrun de Celeste 🍓');
  const leo = await mk('leo.fps', 'leo@squad.dev', 'Main entry no Valorant. Bora de 5-stack?');
  const bia = await mk('bia_rpg', 'bia@squad.dev', 'Mestre de D&D nas horas vagas.');

  await prisma.follow.createMany({
    data: [
      { followerId: squad.id, followingId: squad2.id },
      { followerId: squad.id, followingId: leo.id },
      { followerId: squad2.id, followingId: squad.id },
      { followerId: bia.id, followingId: squad.id },
    ],
  });

  await prisma.favorite.createMany({
    data: [
      { userId: squad.id, gameId: g('Elden Ring') },
      { userId: squad.id, gameId: g('The Witcher 3: Wild Hunt') },
      { userId: squad2.id, gameId: g('Celeste') },
      { userId: squad2.id, gameId: g('Stardew Valley') },
      { userId: leo.id, gameId: g('Valorant') },
      { userId: bia.id, gameId: g("Baldur's Gate 3") },
    ],
  });

  console.log('Criando reviews...');
  const reviews = [
    [squad, 'Elden Ring', 10, 'Obra-prima. A sensação de descobrir uma área nova sem nenhum marcador no mapa é única. Chefes memoráveis.', false],
    [squad, 'Hollow Knight', 9, 'Atmosfera incrível e combate justo. Só o Path of Pain que quase me fez largar o controle.', false],
    [squad2, 'Celeste', 10, 'Plataforma perfeito e uma história linda sobre ansiedade. O capítulo 9 é surreal.', true],
    [squad2, 'Stardew Valley', 9, 'Meu jogo de conforto. Jogar em coop com amigos deixa tudo ainda melhor.', false],
    [leo, 'Valorant', 8, 'Gunplay ótimo e as habilidades deixam o jogo dinâmico. Matchmaking às vezes é sofrido.', false],
    [leo, 'Counter-Strike 2', 7, 'O CS de sempre, mas o subtick ainda tem uns problemas. Ainda assim, viciante.', false],
    [bia, "Baldur's Gate 3", 10, 'O melhor RPG que joguei em anos. Cada escolha muda algo, e o coop é sensacional.', false],
    [bia, 'The Witcher 3: Wild Hunt', 9, 'As missões secundárias são melhores que a história principal de muitos jogos.', false],
  ];
  const createdReviews = [];
  for (const [u, game, rating, text, spoiler] of reviews)
    createdReviews.push(await prisma.review.create({ data: { userId: u.id, gameId: g(game), rating, text, spoiler } }));
  await prisma.comment.create({ data: { text: 'Concordo demais! Malenia foi meu terror 😅', userId: bia.id, reviewId: createdReviews[0].id } });

  console.log('Criando fórum...');
  const t1 = await prisma.topic.create({
    data: { title: 'Qual o melhor build para iniciantes no Elden Ring?', body: 'Comecei agora e estou apanhando muito do Margit. Alguma dica de build?', userId: squad2.id, gameId: g('Elden Ring') },
  });
  await prisma.reply.createMany({
    data: [
      { topicId: t1.id, userId: squad.id, body: 'Vai de Samurai com katana Uchigatana + Cinzas do Lobo. Invoca os lobos no Margit que fica bem mais tranquilo.' },
      { topicId: t1.id, userId: bia.id, body: 'Astrólogo também é ótimo pra começar: Pedra Brilhante resolve muita coisa à distância.' },
      {
        topicId: t1.id,
        userId: leo.id,
        body: 'Depois que você derrotar o Margit, prepara o coração: no final descobre que a Marika e o Radagon são a mesma pessoa!',
        spoiler: true,
        spoilerAuto: true,
      },
    ],
  });
  const t2 = await prisma.topic.create({
    data: { title: 'Procurando squad para ranked (Valorant)', body: 'Sou Ouro 3, jogo de entry. Alguém pra jogar à noite? Uso a sala de voz da comunidade.', userId: leo.id, gameId: g('Valorant') },
  });
  await prisma.reply.create({ data: { topicId: t2.id, userId: squad.id, body: 'Topo! Jogo de controlador, me chama no canal "Squad Ranked".' } });
  await prisma.topic.create({
    data: { title: 'Jogos cozy para relaxar depois da faculdade?', body: 'Quero algo tranquilo, tipo Stardew. Indicações?', userId: squad2.id },
  });

  console.log('Criando guias...');
  await prisma.guide.create({
    data: {
      title: 'Guia de Margit, o Agouro Caído',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      userId: squad.id,
      gameId: g('Elden Ring'),
      content: `# Como derrotar Margit\n\nMargit é o primeiro grande **teste de habilidade** do jogo.\n\n## Preparação\n\n- Chegue no **nível 25+**\n- Melhore a arma para **+3**\n- Use os **Grilhões de Margit** para imobilizá-lo por alguns segundos\n\n## Fase 1\n\n1. Fique a média distância\n2. Espere o combo de 3 golpes terminar\n3. Puna com 1–2 ataques\n\n## Fase 2\n\nEle passa a usar o **martelo dourado**. Role *para dentro* do golpe, não para trás.\n\n> Dica: as Cinzas do Lobo distraem muito bem o chefe.\n`,
    },
  });
  await prisma.guide.create({
    data: {
      title: 'Primeiro ano perfeito em Stardew Valley',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      userId: squad2.id,
      gameId: g('Stardew Valley'),
      content: `# Primeiro ano em Stardew\n\n## Primavera\n\n- Plante **couve-flor** no dia 1\n- Aproveite o **Festival do Ovo** e compre sementes de morango\n- Pesque nos dias de chuva\n\n## Verão\n\n- **Mirtilos** dão lucro alto\n- Melhore o **regador**\n\n> Não esqueça do Centro Comunitário!\n`,
    },
  });
  await prisma.guide.create({
    data: { title: 'Rascunho: táticas de Bind (Valorant)', status: 'DRAFT', userId: leo.id, gameId: g('Valorant'), content: '# Bind\n\nEm construção...' },
  });

  console.log('Criando indicações...');
  const inds = [
    [squad2, 'Hades', 'Perfeito pra quem tem pouco tempo: cada run dura ~30 min e a história avança mesmo quando você perde.', ['roguelike', 'runs-curtas']],
    [squad, 'Sekiro: Shadows Die Twice', 'Se você zerou Elden Ring, Sekiro vai te ensinar a aparar de verdade. Combate mais satisfatório da FromSoft.', ['soulslike', 'desafio']],
    [bia, "Baldur's Gate 3", 'Junte 3 amigos e jogue em coop. Melhor experiência de RPG de mesa que dá pra ter no PC.', ['coop', 'rpg']],
    [leo, 'Rocket League', 'Ótimo pra jogar com a galera na call. Partidas de 5 min, gratuito e muito divertido.', ['coop', 'gratuito', 'runs-curtas']],
    [squad2, 'Stardew Valley', 'O jogo cozy definitivo. Coop de até 4 pessoas!', ['cozy', 'coop']],
    [squad, 'Portal 2', 'O coop de Portal 2 é um dos melhores puzzles a dois já feitos. Chama alguém na call e vai.', ['coop', 'puzzle']],
  ];
  const created = [];
  for (const [u, game, reason, tags] of inds)
    created.push(await prisma.indication.create({ data: { userId: u.id, gameId: g(game), reason, tags } }));
  await prisma.indicationLike.createMany({
    data: [
      { userId: squad.id, indicationId: created[0].id },
      { userId: leo.id, indicationId: created[0].id },
      { userId: bia.id, indicationId: created[0].id },
      { userId: squad2.id, indicationId: created[1].id },
      { userId: squad.id, indicationId: created[2].id },
      { userId: squad2.id, indicationId: created[2].id },
      { userId: squad.id, indicationId: created[3].id },
    ],
  });

  console.log('Criando comunidade (servidores e canais)...');
  const allUsers = [squad, squad2, leo, bia];
  const official = await prisma.server.create({
    data: {
      name: 'Squad Oficial',
      description: 'Servidor principal da comunidade',
      color: '#7c5cff',
      ownerId: squad.id,
      members: { create: allUsers.map((u) => ({ userId: u.id, role: u.id === squad.id ? 'owner' : 'member' })) },
      channels: {
        create: [
          { name: 'boas-vindas', type: 'TEXT', position: 0 },
          { name: 'geral', type: 'TEXT', position: 1 },
          { name: 'indicações', type: 'TEXT', position: 2 },
          { name: 'procurando-grupo', type: 'TEXT', position: 3 },
          { name: 'Lobby', type: 'VOICE', position: 4 },
          { name: 'Squad Ranked', type: 'VOICE', position: 5 },
          { name: 'Stream / Tela', type: 'VOICE', position: 6 },
        ],
      },
    },
    include: { channels: true },
  });
  const geral = official.channels.find((c) => c.name === 'geral');
  const welcome = official.channels.find((c) => c.name === 'boas-vindas');
  await prisma.message.createMany({
    data: [
      { channelId: welcome.id, userId: squad.id, content: 'Bem-vindos ao Squad! 🎮 Usem os canais de voz para jogar junto e compartilhar a tela.' },
      { channelId: geral.id, userId: squad2.id, content: 'Alguém jogando Hades hoje?' },
      { channelId: geral.id, userId: leo.id, content: 'Mais tarde entro no Squad Ranked pra jogar Valorant' },
      { channelId: geral.id, userId: bia.id, content: 'Vou fazer live de BG3 no canal Stream / Tela às 20h!' },
      {
        channelId: geral.id,
        userId: leo.id,
        content: 'Zerei RDR2 ontem... não acredito que o Arthur morre no final 😭',
        spoiler: true,
        spoilerAuto: true,
      },
    ],
  });

  await prisma.server.create({
    data: {
      name: 'Soulslike BR',
      description: 'Sofrendo juntos desde Demon\'s Souls',
      color: '#e0603a',
      ownerId: squad.id,
      gameId: g('Elden Ring'),
      members: { create: [{ userId: squad.id, role: 'owner' }, { userId: bia.id }] },
      channels: {
        create: [
          { name: 'geral', type: 'TEXT', position: 0 },
          { name: 'builds', type: 'TEXT', position: 1 },
          { name: 'Coop / Invasões', type: 'VOICE', position: 2 },
        ],
      },
    },
  });
  await prisma.server.create({
    data: {
      name: 'Cozy Games',
      description: 'Fazendinhas, chá e jogos tranquilos',
      color: '#3fbf7f',
      ownerId: squad2.id,
      gameId: g('Stardew Valley'),
      members: { create: [{ userId: squad2.id, role: 'owner' }] },
      channels: {
        create: [
          { name: 'geral', type: 'TEXT', position: 0 },
          { name: 'Fazenda coop', type: 'VOICE', position: 1 },
        ],
      },
    },
  });

  console.log('Criando sugestões de jogos e tópico do GTA 6...');
  await prisma.gameSuggestion.createMany({
    data: [
      { name: 'Pokémon Legends: Z-A', platform: 'Nintendo Switch', reason: 'Muita gente do squad Cozy joga, seria ótimo ter reviews.', userId: squad2.id },
      { name: 'Hollow Knight', platform: 'PC', reason: 'Já está no catálogo, mas faltava o DLC Godmaster como entrada separada.', userId: leo.id, status: 'REJECTED', teamNote: 'O DLC faz parte do jogo base — mantivemos uma entrada só.' },
    ],
  });
  await prisma.topic.create({
    data: {
      title: 'GTA 6 sai em 19/11 — quem vai jogar no lançamento?',
      body: 'Preload liberado desde o dia 12! Vou passar a madrugada em Vice City. Bora montar uma lobby pra jogar e comentar junto?',
      userId: leo.id,
      gameId: g('Grand Theft Auto VI'),
    },
  });

  console.log('✔ Seed concluído! Login: squad@squad.dev / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
