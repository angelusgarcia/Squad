import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, timeAgo } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import GamePicker from '../components/GamePicker.jsx';

export default function Forum() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [topics, setTopics] = useState([]);
  const [showForm, setShowForm] = useState(params.get('novo') === '1');
  const [form, setForm] = useState({ title: '', body: '', gameId: params.get('gameId') || null, spoiler: false });
  const [error, setError] = useState('');

  const gameId = params.get('gameId');
  const scope = params.get('scope') || '';

  useEffect(() => {
    const qs = new URLSearchParams();
    if (gameId) qs.set('gameId', gameId);
    if (scope) qs.set('scope', scope);
    api(`/forum/topics?${qs}`).then(setTopics);
  }, [gameId, scope]);

  const create = async (e) => {
    e.preventDefault();
    try {
      const t = await api('/forum/topics', { method: 'POST', body: form });
      navigate(`/forum/${t.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page__head row row--between">
        <div>
          <h1>Fórum</h1>
          <p className="muted">Discussões gerais ou sobre jogos específicos.</p>
        </div>
        {user ? (
          <button className="btn" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : '+ Novo tópico'}</button>
        ) : (
          <Link to="/login" className="btn btn--ghost">Entre para postar</Link>
        )}
      </div>

      {showForm && (
        <form className="card form" onSubmit={create}>
          <input placeholder="Título do tópico" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <textarea rows={5} placeholder="Escreva sua mensagem..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
          <GamePicker onChange={(id) => setForm({ ...form, gameId: id })} />
          {error && <p className="error">{error}</p>}
          <div className="row row--between">
            <label className="check"><input type="checkbox" checked={form.spoiler} onChange={(e) => setForm({ ...form, spoiler: e.target.checked })} /> Contém spoiler</label>
            <button className="btn">Publicar tópico</button>
          </div>
        </form>
      )}

      <div className="tabs">
        <button className={!scope && !gameId ? 'active' : ''} onClick={() => setParams({})}>Todos</button>
        <button className={scope === 'general' ? 'active' : ''} onClick={() => setParams({ scope: 'general' })}>Geral</button>
        {gameId && <button className="active">Filtrado por jogo</button>}
      </div>

      <div className="stack">
        {topics.map((t) => (
          <Link key={t.id} to={`/forum/${t.id}`} className="card topic-row topic-row--big">
            <Avatar user={t.user} size={40} />
            <div className="grow">
              <h3>{t.title}</h3>
              <p className="muted small">
                {t.game ? <span className="tag">{t.game.name}</span> : <span className="tag">Geral</span>} por {t.user.username} · última atividade {timeAgo(t.lastActivityAt)}
              </p>
            </div>
            <div className="replies-count"><b>{t._count.replies}</b><span>respostas</span></div>
          </Link>
        ))}
        {topics.length === 0 && <div className="empty">Nenhum tópico aqui ainda.</div>}
      </div>
    </div>
  );
}
