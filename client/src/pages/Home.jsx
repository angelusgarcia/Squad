import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, timeAgo } from '../lib/api.js';
import GameCard from '../components/GameCard.jsx';
import Avatar from '../components/Avatar.jsx';
import IndicationCard from '../components/IndicationCard.jsx';
import SpoilerText from '../components/SpoilerText.jsx';
import NewsCarousel from '../components/NewsCarousel.jsx';

export default function Home() {
  const [games, setGames] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [topics, setTopics] = useState([]);
  const [indications, setIndications] = useState([]);

  useEffect(() => {
    api('/games?sort=rating').then((d) => setGames(d.games.slice(0, 8)));
    api('/reviews').then(setReviews);
    api('/forum/topics').then((t) => setTopics(t.slice(0, 5)));
    api('/indications?limit=3').then(setIndications);
  }, []);

  return (
    <div className="page">
      <NewsCarousel />

      <section className="section">
        <div className="section__head">
          <h2>Indicações da comunidade</h2>
          <Link to="/indicacoes">ver todas →</Link>
        </div>
        <div className="grid grid--3">
          {indications.map((i) => <IndicationCard key={i.id} indication={i} />)}
        </div>
      </section>

      <section className="section">
        <div className="section__head">
          <h2>Mais bem avaliados</h2>
          <Link to="/jogos">catálogo completo →</Link>
        </div>
        <div className="grid grid--games">
          {games.map((g) => <GameCard key={g.id} game={g} />)}
        </div>
      </section>

      <div className="two-cols">
        <section className="section">
          <div className="section__head"><h2>Reviews recentes</h2></div>
          <div className="stack">
            {reviews.map((r) => (
              <div key={r.id} className="card review-mini">
                <Avatar user={r.user} size={32} />
                <div>
                  <p className="small">
                    <Link to={`/u/${r.user.username}`}><b>{r.user.username}</b></Link> avaliou{' '}
                    <Link to={`/jogos/${r.game.slug}`}><b>{r.game.name}</b></Link>{' '}
                    <span className="rating-pill">{r.rating}/10</span>
                  </p>
                  <SpoilerText
                    text={r.text.length > 140 ? r.text.slice(0, 140) + '…' : r.text}
                    spoiler={r.spoiler}
                    auto={r.spoilerAuto}
                    className="muted"
                    compact
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section__head">
            <h2>Movimentado no fórum</h2>
            <Link to="/forum">fórum →</Link>
          </div>
          <div className="stack">
            {topics.map((t) => (
              <Link key={t.id} to={`/forum/${t.id}`} className="card topic-row">
                <div>
                  <h4>{t.title}</h4>
                  <p className="muted small">
                    {t.game ? `${t.game.name} · ` : 'Geral · '}por {t.user.username} · {timeAgo(t.lastActivityAt)}
                  </p>
                </div>
                <span className="badge">{t._count.replies}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
