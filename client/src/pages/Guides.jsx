import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, timeAgo } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import GameCover from '../components/GameCover.jsx';

export default function Guides() {
  const { user } = useAuth();
  const [guides, setGuides] = useState([]);
  const [mine, setMine] = useState([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => api(`/guides?q=${encodeURIComponent(q)}`).then(setGuides), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (user) api('/guides/mine').then(setMine);
  }, [user]);

  const drafts = mine.filter((g) => g.status === 'DRAFT');

  return (
    <div className="page">
      <div className="page__head row row--between">
        <div>
          <h1>Guias da comunidade</h1>
          <p className="muted">Estratégias, builds e detonados escritos pelos jogadores.</p>
        </div>
        {user && <Link to="/guias/novo" className="btn">+ Escrever guia</Link>}
      </div>

      {drafts.length > 0 && (
        <div className="card drafts">
          <b>Seus rascunhos:</b>{' '}
          {drafts.map((d) => <Link key={d.id} to={`/guias/${d.id}/editar`} className="tag">{d.title}</Link>)}
        </div>
      )}

      <input className="search-wide" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar guias..." />

      <div className="grid grid--3">
        {guides.map((g) => (
          <Link key={g.id} to={`/guias/${g.id}`} className="card guide-card">
            {g.game && <GameCover game={g.game} className="guide-card__cover" />}
            <div className="guide-card__body">
              {g.game && <span className="tag">{g.game.name}</span>}
              <h3>{g.title}</h3>
              <p className="muted small row">
                <Avatar user={g.user} size={20} /> {g.user.username} · {timeAgo(g.publishedAt)} · {g._count.comments} comentário(s)
              </p>
            </div>
          </Link>
        ))}
      </div>
      {guides.length === 0 && <div className="empty">Nenhum guia encontrado.</div>}
    </div>
  );
}
