import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import Icon from './Icon.jsx';

// Notícias do dia (carrossel da home)
const NEWS = [
  {
    id: 'gta6',
    gameSlug: 'grand-theft-auto-vi',
    tag: 'Lançamento',
    accent: 'pink',
    title: () => 'GTA 6 chegou',
    text: 'Depois de dois adiamentos e 13 anos de espera, Grand Theft Auto VI foi lançado em 19 de novembro no PS5 e no Xbox Series X|S — e já chegou batendo o recorde de jogo mais pré-vendido da história. Vice City está de volta com Lucia e Jason.',
    live: 'Disponível agora no PS5 e Xbox Series X|S',
    trailer: true,
  },
  {
    id: 'fortnite-token',
    gameSlug: 'fortnite',
    tag: 'Fortnite · Evento',
    accent: 'blue',
    icon: 'ticket',
    title: () => 'Token pirata libera a loja do Fortnite de graça',
    text: 'Na minitemporada Caçadores de Tesouro (até 5/12), um token raríssimo pode aparecer dentro de baús piratas. Quem encontrar pode resgatar itens da loja de graça por 2 semanas — e dá para ativar duas vezes: uma até 15/12 e outra em 2027. Não vale para pacotes vendidos só com dinheiro real nem para o Fortnite Crew.',
  },
  {
    id: 'tga-2026',
    tag: 'The Game Awards 2026',
    accent: 'gold',
    icon: 'trophy',
    title: () => 'Saíram os indicados a Jogo do Ano',
    text: 'Geoff Keighley revelou os indicados das 30 categorias. GTA 6 lidera com 8 indicações. A cerimônia acontece em 10 de dezembro.',
    nominees: [
      { name: 'GTA 6', slug: 'grand-theft-auto-vi' },
      { name: 'Resident Evil Requiem' },
      { name: '007 First Light' },
      { name: 'Control Resonant' },
      { name: 'Phantom Blade Zero' },
      { name: 'Zelda: Ocarina of Time' },
    ],
  },
];

const INTERVAL = 8000;

function Slide({ item, game, active, onTrailer }) {
  return (
    <article
      className={`news-slide news-slide--${item.accent} ${active ? 'is-active' : ''}`}
      style={game?.coverUrl ? { '--bg': `url(${game.coverUrl})` } : undefined}
      aria-hidden={!active}
    >
      <div className="news-slide__shade" />
      {item.icon && !game?.coverUrl && <Icon name={item.icon} size={260} strokeWidth={1} className="news-slide__art" />}
      <div className="news-slide__content">
        <span className="news-slide__tag">{item.tag}</span>
        <h1>{item.title()}</h1>
        <p>{item.text}</p>

        {item.live && <p className="news-slide__live">{item.live}</p>}

        {item.nominees && (
          <ol className="nominees">
            {item.nominees.map((n) => (
              <li key={n.name}>
                {n.slug ? <Link to={`/jogos/${n.slug}`} tabIndex={active ? 0 : -1}>{n.name}</Link> : n.name}
              </li>
            ))}
          </ol>
        )}

        <div className="news-slide__actions">
          {item.trailer && game?.trailerYoutubeId && (
            <button className="btn btn--lg btn--accent" onClick={() => onTrailer(game)} tabIndex={active ? 0 : -1}>
              <Icon name="play" size={16} fill /> Ver trailer
            </button>
          )}
          {game && (
            <Link to={`/jogos/${game.slug}`} className="btn btn--ghost btn--lg" tabIndex={active ? 0 : -1}>Página do jogo</Link>
          )}
          <Link to={game ? `/forum?gameId=${game.id}` : '/forum'} className="btn btn--ghost btn--lg" tabIndex={active ? 0 : -1}>
            <Icon name="message" size={16} /> Discutir no fórum
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function NewsCarousel() {
  const [games, setGames] = useState({});
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [trailer, setTrailer] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    NEWS.filter((n) => n.gameSlug).forEach((n) =>
      api(`/games/${n.gameSlug}`)
        .then((g) => setGames((all) => ({ ...all, [n.gameSlug]: g })))
        .catch(() => {})
    );
  }, []);

  useEffect(() => {
    if (paused || trailer) return;
    timer.current = setTimeout(() => setIndex((i) => (i + 1) % NEWS.length), INTERVAL);
    return () => clearTimeout(timer.current);
  }, [index, paused, trailer]);

  const go = (i) => setIndex((i + NEWS.length) % NEWS.length);
  const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });

  return (
    <section className="news" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="news__bar">
        <span className="news__live-dot" /> Notícias de hoje · {today}
      </div>

      <div className="news__track">
        {NEWS.map((item, i) => (
          <Slide key={item.id} item={item} game={games[item.gameSlug]} active={i === index} onTrailer={setTrailer} />
        ))}
      </div>

      <button className="news__arrow news__arrow--left" onClick={() => go(index - 1)} aria-label="Notícia anterior"><Icon name="left" size={22} /></button>
      <button className="news__arrow news__arrow--right" onClick={() => go(index + 1)} aria-label="Próxima notícia"><Icon name="right" size={22} /></button>

      <div className="news__dots">
        {NEWS.map((item, i) => (
          <button key={item.id} className={`news__dot ${i === index ? 'is-active' : ''}`} onClick={() => go(i)} aria-label={`Notícia ${i + 1}`}>
            {i === index && !paused && !trailer && <span className="news__progress" style={{ animationDuration: `${INTERVAL}ms` }} />}
          </button>
        ))}
      </div>

      {trailer && (
        <div className="modal" onClick={() => setTrailer(null)}>
          <div className="trailer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="round-btn trailer-modal__close" onClick={() => setTrailer(null)} aria-label="Fechar"><Icon name="x" size={16} /></button>
            <div className="trailer">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${trailer.trailerYoutubeId}?autoplay=1&rel=0`}
                title={`Trailer de ${trailer.name}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
