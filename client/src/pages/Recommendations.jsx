import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, timeAgo } from '../lib/api.js';
import GameCover from '../components/GameCover.jsx';
import Icon from '../components/Icon.jsx';

export default function Recommendations() {
  const [data, setData] = useState({ items: [], generatedAt: null });
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/recommendations').then(setData);
  }, []);

  const generate = async () => {
    setLoading(true);
    setError('');
    try {
      const d = await api('/recommendations', { method: 'POST' });
      setData(d);
      setSource(d.source);
      setAiError(d.aiError || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <section className="ai-hero card">
        <div>
          <h1 className="with-icon"><img src="/brand/recomendado-96.png" alt="" /> Recomendado para você</h1>
          <p className="muted">
            A IA analisa suas reviews e favoritos e sugere jogos <b>do nosso catálogo</b>, explicando o porquê.
            Quanto mais você avalia, melhor fica.
          </p>
          {data.generatedAt && <p className="small muted">Última geração: {timeAgo(data.generatedAt)}</p>}
        </div>
        <button className="btn btn--lg" onClick={generate} disabled={loading}>
          {loading ? 'Pensando...' : data.items.length ? <><Icon name="refresh" size={16} /> Gerar novas</> : 'Gerar recomendações'}
        </button>
      </section>

      {source === 'heuristic' && (
        <p className="note">
          Modo demonstração: a IA não respondeu, então usamos o recomendador simples por gênero.
          {aiError && <><br /><b>Motivo:</b> <code>{aiError}</code></>}
        </p>
      )}
      {error && <p className="error">{error}</p>}

      <div className="grid grid--2">
        {data.items.map((r) => (
          <Link key={r.id} to={`/jogos/${r.game.slug}`} className="card rec">
            <GameCover game={r.game} className="rec__cover" />
            <div>
              <h3>{r.game.name}</h3>
              <div className="tags">{r.game.genres.map((g) => <span key={g.id} className="tag">{g.name}</span>)}</div>
              <p className="rec__reason">{r.reason}</p>
            </div>
          </Link>
        ))}
      </div>
      {!data.items.length && !loading && (
        <div className="empty">Clique em “Gerar recomendações”. Dica: avalie e favorite alguns jogos antes!</div>
      )}
    </div>
  );
}
