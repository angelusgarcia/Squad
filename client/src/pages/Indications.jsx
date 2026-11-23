import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import IndicationCard from '../components/IndicationCard.jsx';
import GamePicker from '../components/GamePicker.jsx';
import Icon from '../components/Icon.jsx';

export default function Indications() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const presetGame = params.get('gameId') ? { id: Number(params.get('gameId')), name: params.get('nome') } : null;

  const [list, setList] = useState([]);
  const [tags, setTags] = useState([]);
  const [sort, setSort] = useState('top');
  const [tag, setTag] = useState('');
  const [showForm, setShowForm] = useState(Boolean(presetGame));
  const [form, setForm] = useState({ gameId: presetGame?.id || null, reason: '', tags: '' });
  const [error, setError] = useState('');

  const load = () => {
    const qs = new URLSearchParams({ sort });
    if (tag) qs.set('tag', tag);
    api(`/indications?${qs}`).then(setList);
    api('/indications/tags').then(setTags);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [sort, tag]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/indications', {
        method: 'POST',
        body: { ...form, tags: form.tags.split(/[,#\s]+/).filter(Boolean) },
      });
      setForm({ gameId: null, reason: '', tags: '' });
      setShowForm(false);
      setSort('new');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page__head row row--between">
        <div>
          <h1>Indicações da comunidade</h1>
          <p className="muted">Jogadores indicando jogos para outros jogadores — curta as que você concorda.</p>
        </div>
        {user ? (
          <button className="btn" onClick={() => setShowForm(!showForm)}>{showForm ? 'Fechar' : 'Indicar um jogo'}</button>
        ) : (
          <Link className="btn btn--ghost" to="/login">Entre para indicar</Link>
        )}
      </div>

      {showForm && (
        <form className="card form" onSubmit={submit}>
          <GamePicker initial={presetGame} onChange={(id) => setForm({ ...form, gameId: id })} placeholder="Qual jogo você indica?" />
          <textarea rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Por que a galera deveria jogar?" />
          <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Tags (ex: coop, cozy, gratuito)" />
          {error && <p className="error">{error}</p>}
          <button className="btn">Publicar indicação</button>
        </form>
      )}

      <div className="row row--between wrap">
        <div className="tabs">
          <button className={sort === 'top' ? 'active' : ''} onClick={() => setSort('top')}>Mais curtidas</button>
          <button className={sort === 'new' ? 'active' : ''} onClick={() => setSort('new')}>Recentes</button>
        </div>
        <div className="tags">
          {tag && <button className="tag tag--btn tag--active" onClick={() => setTag('')}>#{tag} <Icon name="x" size={12} /></button>}
          {tags.filter((t) => t.tag !== tag).map((t) => (
            <button key={t.tag} className="tag tag--btn" onClick={() => setTag(t.tag)}>#{t.tag} <small>{t.count}</small></button>
          ))}
        </div>
      </div>

      <div className="grid grid--2">
        {list.map((i) => <IndicationCard key={i.id} indication={i} onTagClick={setTag} />)}
      </div>
      {list.length === 0 && <div className="empty">Nenhuma indicação ainda.</div>}
    </div>
  );
}
