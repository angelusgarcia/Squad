import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';

// Seletor de jogo
export default function GamePicker({ initial = null, onChange, placeholder = 'Vincular a um jogo (opcional)' }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(initial);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setSelected(initial), [initial?.id]);

  useEffect(() => {
    if (!q) return setResults([]);
    const t = setTimeout(() => api(`/games?q=${encodeURIComponent(q)}`).then((d) => setResults(d.games.slice(0, 6))), 300);
    return () => clearTimeout(t);
  }, [q]);

  if (selected)
    return (
      <div className="picker__selected">
        {selected.name}
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setSelected(null); onChange(null); }}>trocar</button>
      </div>
    );

  return (
    <div className="picker">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
      {results.length > 0 && (
        <ul className="picker__list">
          {results.map((g) => (
            <li key={g.id} onClick={() => { setSelected(g); onChange(g.id); setQ(''); setResults([]); }}>
              {g.name} <span className="muted small">{g.released ? new Date(g.released).getFullYear() : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
