import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, timeAgo } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import GameCover from '../components/GameCover.jsx';
import { Score } from '../components/GameCard.jsx';
import ReviewForm from '../components/ReviewForm.jsx';
import ReviewItem from '../components/ReviewItem.jsx';
import Icon from '../components/Icon.jsx';

// Data de lançamento
function releaseLabel(value) {
  const d = new Date(value);
  if (d.getUTCMonth() === 5 && d.getUTCDate() === 1) return String(d.getUTCFullYear());
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

export default function GameDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const g = await api(`/games/${slug}`);
      setGame(g);
      setReviews(await api(`/reviews?gameId=${g.id}`));
    } catch (e) {
      setError(e.message);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const toggleFavorite = async () => {
    if (!user) return navigate('/login');
    const r = await api(`/games/${game.id}/favorite`, { method: 'POST' });
    setGame({ ...game, isFavorite: r.favorite });
  };

  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!game) return <div className="page"><p className="muted">Carregando...</p></div>;

  return (
    <div className="page">
      <section className="game-hero">
        <GameCover game={game} className="game-hero__cover" />
        <div className="game-hero__info">
          <h1>{game.name}</h1>
          <div className="tags">
            {game.genres.map((g) => <Link key={g.id} to={`/jogos?genre=${g.slug}`} className="tag">{g.name}</Link>)}
          </div>
          <p className="muted">
            {game.released && `Lançamento: ${releaseLabel(game.released)} · `}
            {game.platforms.map((p) => p.name).join(', ')}
          </p>
          <div className="stats">
            <div><Score value={game.metacritic} /><span>Metacritic</span></div>
            <div><b className="with-star">{game.rating ? <><Icon name="star" size={16} fill /> {game.rating.toFixed(1)}</> : '—'}</b><span>Nota agregada</span></div>
            <div><b>{game.communityRating ? game.communityRating.toFixed(1) : '—'}</b><span>Comunidade (/10)</span></div>
            <div><b>{game._count.favorites}</b><span>Favoritos</span></div>
          </div>
          <div className="row">
            <button className={`btn ${game.isFavorite ? '' : 'btn--ghost'}`} onClick={toggleFavorite}>
              <Icon name="star" size={16} fill={game.isFavorite} /> {game.isFavorite ? 'Favoritado' : 'Favoritar'}
            </button>
            <Link to={`/forum?gameId=${game.id}&novo=1`} className="btn btn--ghost"><Icon name="message" size={16} /> Criar tópico</Link>
            <Link to={`/indicacoes?gameId=${game.id}&nome=${encodeURIComponent(game.name)}`} className="btn btn--ghost"><Icon name="thumbsUp" size={16} /> Indicar</Link>
          </div>
          {game.description && <p className="desc">{game.description}</p>}
        </div>
      </section>

      {game.trailerYoutubeId && (
        <section className="section game-trailer">
          <div className="section__head"><h2>Trailer</h2></div>
          <div className="trailer">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${game.trailerYoutubeId}?rel=0`}
              title={`Trailer de ${game.name}`}
              loading="lazy"
              allow="encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        </section>
      )}

      <div className="two-cols two-cols--wide">
        <section className="section">
          <div className="section__head"><h2>Reviews ({reviews.length})</h2></div>

          {user && (!game.myReview || editing) && (
            <ReviewForm
              gameId={game.id}
              review={editing ? game.myReview : null}
              onSaved={(saved) => {
                setEditing(false);
                const m = saved?.moderation;
                const parts = [];
                if (m?.spoilerAuto) parts.push('foi marcada como spoiler automaticamente');
                if (m?.censored) parts.push(`teve ${m.censored} palavra(s) censurada(s)`);
                setNotice(parts.length ? `Sua review ${parts.join(' e ')} pela moderação.` : '');
                load();
              }}
              onCancel={editing ? () => setEditing(false) : null}
            />
          )}
          {user && game.myReview && !editing && (
            <p className="muted small">Você já avaliou este jogo. <button className="link" onClick={() => setEditing(true)}>Editar minha review</button></p>
          )}
          {!user && <p className="muted"><Link to="/login">Entre</Link> para escrever uma review.</p>}
          {notice && <p className="note">{notice}</p>}

          <div className="stack">
            {reviews.map((r) => <ReviewItem key={r.id} review={r} />)}
            {reviews.length === 0 && <div className="empty">Ninguém avaliou ainda. Seja o primeiro!</div>}
          </div>
        </section>

        <aside className="section">
          <div className="section__head"><h3>Tópicos do fórum</h3><Link to={`/forum?gameId=${game.id}`}>ver →</Link></div>
          <div className="stack">
            {game.topics.map((t) => (
              <Link key={t.id} to={`/forum/${t.id}`} className="card topic-row">
                <div><h4>{t.title}</h4><p className="muted small">{t.user.username} · {timeAgo(t.lastActivityAt)}</p></div>
                <span className="badge">{t._count.replies}</span>
              </Link>
            ))}
            {game.topics.length === 0 && <p className="muted small">Nenhum tópico ainda.</p>}
          </div>

          <div className="section__head"><h3>Guias</h3><Link to="/guias/novo">escrever →</Link></div>
          <div className="stack">
            {game.guides.map((g) => (
              <Link key={g.id} to={`/guias/${g.id}`} className="card topic-row">
                <div><h4>{g.title}</h4><p className="muted small">por {g.user.username}</p></div>
              </Link>
            ))}
            {game.guides.length === 0 && <p className="muted small">Nenhum guia publicado.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
