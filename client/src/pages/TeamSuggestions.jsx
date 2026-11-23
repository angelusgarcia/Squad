import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, timeAgo } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import { StatusBadge } from './SuggestGame.jsx';
import Icon from '../components/Icon.jsx';

// Painel da equipe: sugestões
export default function TeamSuggestions() {
  const { user } = useAuth();
  const [tab, setTab] = useState('PENDING');
  const [data, setData] = useState({ items: [], counts: {} });
  const [notes, setNotes] = useState({});
  const [error, setError] = useState('');

  const load = () =>
    api(`/suggestions?status=${tab}`)
      .then(setData)
      .catch((e) => setError(e.message));

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [tab]);

  if (!user?.isAdmin) return <div className="page"><p className="error">Área exclusiva da equipe Squad.</p></div>;

  const decide = async (s, status) => {
    try {
      const r = await api(`/suggestions/${s.id}`, { method: 'PATCH', body: { status, teamNote: notes[s.id] ?? s.teamNote ?? '' } });
      if (r.imported) window.alert(`${r.imported} jogo(s) importado(s) da RAWG para o catálogo!`);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const tabs = [
    ['PENDING', 'Em análise'],
    ['APPROVED', 'Aprovadas'],
    ['REJECTED', 'Recusadas'],
  ];

  return (
    <div className="page">
      <div className="page__head">
        <h1>Equipe · Sugestões de jogos</h1>
        <p className="muted">O que a comunidade quer ver no catálogo. Aprove ou recuse e deixe uma resposta — o usuário vê na página dele.</p>
      </div>

      <div className="tabs">
        {tabs.map(([k, label]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
            {label} <span className="tab-count">{data.counts[k] || 0}</span>
          </button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}

      <div className="stack">
        {data.items.map((s) => (
          <article key={s.id} className="card suggestion suggestion--team">
            <div className="row row--between">
              <div>
                <h3>{s.name}</h3>
                <p className="muted small row">
                  <Link to={`/u/${s.user.username}`} className="who"><Avatar user={s.user} size={20} /> {s.user.username}</Link>
                  · {timeAgo(s.createdAt)}
                  {s.platform && <span className="tag">{s.platform}</span>}
                  {s.link && <a href={s.link} target="_blank" rel="noreferrer" className="row-inline">link <Icon name="external" size={12} /></a>}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </div>
            {s.reason && <p className="suggestion__reason">“{s.reason}”</p>}
            <input
              placeholder="Resposta para o usuário (opcional)"
              value={notes[s.id] ?? s.teamNote ?? ''}
              onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
            />
            <div className="row">
              {s.status !== 'APPROVED' && <button className="btn btn--sm btn--green" onClick={() => decide(s, 'APPROVED')}><Icon name="check" size={14} /> Aprovar</button>}
              {s.status !== 'REJECTED' && <button className="btn btn--sm btn--danger" onClick={() => decide(s, 'REJECTED')}><Icon name="x" size={14} /> Recusar</button>}
              {s.status !== 'PENDING' && <button className="btn btn--sm btn--ghost" onClick={() => decide(s, 'PENDING')}><Icon name="refresh" size={14} /> Voltar para análise</button>}
            </div>
          </article>
        ))}
        {data.items.length === 0 && <div className="empty">Nada por aqui.</div>}
      </div>
    </div>
  );
}
