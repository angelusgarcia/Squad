import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, timeAgo } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Icon from '../components/Icon.jsx';

const STATUS = {
  PENDING: { label: 'Em análise', cls: 'st--pending', icon: 'clock' },
  APPROVED: { label: 'Aprovado', cls: 'st--ok', icon: 'check' },
  REJECTED: { label: 'Não aprovado', cls: 'st--no', icon: 'x' },
};

export function StatusBadge({ status }) {
  const s = STATUS[status];
  return <span className={`st ${s.cls}`}><Icon name={s.icon} size={12} strokeWidth={2.5} /> {s.label}</span>;
}

// Sugerir jogo
export default function SuggestGame() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', platform: '', link: '', reason: '' });
  const [mine, setMine] = useState([]);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) api('/suggestions/mine').then(setMine);
  }, [user]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const s = await api('/suggestions', { method: 'POST', body: form });
      setMine([s, ...mine]);
      setForm({ name: '', platform: '', link: '', reason: '' });
      setMsg({ ok: true, text: 'Sugestão enviada! A equipe Squad vai analisar e você vê a resposta aqui embaixo.' });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page page--narrow">
      <div className="page__head">
        <h1>Sugerir um jogo</h1>
        <p className="muted">
          Sentiu falta de algum jogo no catálogo? Conta pra gente — toda sugestão chega para a equipe Squad.
        </p>
      </div>

      {user ? (
        <form className="card form suggest-form" onSubmit={submit}>
          <label>
            Nome do jogo *
            <input required value={form.name} onChange={set('name')} placeholder="Ex.: Pokémon Legends: Z-A" />
          </label>
          <div className="form-row">
            <label>
              Plataforma
              <select value={form.platform} onChange={set('platform')}>
                <option value="">Não sei / várias</option>
                {['PC', 'PlayStation', 'Xbox', 'Nintendo Switch', 'Mobile'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label>
              Link (Steam, site oficial...)
              <input value={form.link} onChange={set('link')} placeholder="https://" />
            </label>
          </div>
          <label>
            Por que ele deveria estar no Squad?
            <textarea rows={3} value={form.reason} onChange={set('reason')} placeholder="Opcional, mas ajuda a equipe a decidir" />
          </label>
          {msg && <p className={msg.ok ? 'note note--ok' : 'error'}>{msg.text}</p>}
          <button className="btn" disabled={busy}>{busy ? 'Enviando...' : 'Enviar sugestão'}</button>
        </form>
      ) : (
        <p className="card"><Link to="/login">Entre</Link> para sugerir jogos.</p>
      )}

      {mine.length > 0 && (
        <section className="section">
          <h2>Minhas sugestões</h2>
          <div className="stack">
            {mine.map((s) => (
              <div key={s.id} className="card suggestion">
                <div className="row row--between">
                  <b>{s.name}</b>
                  <StatusBadge status={s.status} />
                </div>
                <p className="muted small">
                  {s.platform ? `${s.platform} · ` : ''}enviada {timeAgo(s.createdAt)}
                </p>
                {s.teamNote && <p className="team-note"><b>Equipe Squad:</b> {s.teamNote}</p>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
