import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import GameCard from '../components/GameCard.jsx';
import Icon from '../components/Icon.jsx';

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ games: [], total: 0, pages: 1 });
  const [filters, setFilters] = useState({ genres: [], platforms: [] });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get('q') || '');

  const page = Number(params.get('page') || 1);

  useEffect(() => {
    api('/games/filters').then(setFilters);
  }, []);

  useEffect(() => {
    setQ(params.get('q') || '');
    setLoading(true);
    api(`/games?${params.toString()}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [params]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  return (
    <div className="page">
      <div className="page__head row row--between">
        <div>
          <h1>Catálogo de jogos</h1>
          <p className="muted">{data.total} jogos no catálogo</p>
        </div>
        <Link to="/sugerir" className="btn btn--ghost"><Icon name="plus" size={16} /> Sugerir um jogo</Link>
      </div>

      <div className="filters">
        <form onSubmit={(e) => { e.preventDefault(); update('q', q); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pelo nome..." />
        </form>
        <select value={params.get('genre') || ''} onChange={(e) => update('genre', e.target.value)}>
          <option value="">Todos os gêneros</option>
          {filters.genres.map((g) => <option key={g.id} value={g.slug}>{g.name}</option>)}
        </select>
        <select value={params.get('platform') || ''} onChange={(e) => update('platform', e.target.value)}>
          <option value="">Todas as plataformas</option>
          {filters.platforms.map((p) => <option key={p.id} value={p.slug}>{p.name}</option>)}
        </select>
        <select value={params.get('sort') || 'rating'} onChange={(e) => update('sort', e.target.value)}>
          <option value="rating">Melhor nota</option>
          <option value="recent">Mais recentes</option>
          <option value="name">A–Z</option>
        </select>
      </div>

      {loading ? (
        <p className="muted">Carregando...</p>
      ) : data.games.length === 0 ? (
        <div className="empty">Nenhum jogo encontrado. {params.get('q') && 'Tente outro nome — se a RAWG estiver configurada, buscamos lá também.'} <br /><Link to="/sugerir">Sugerir esse jogo para a equipe</Link></div>
      ) : (
        <div className="grid grid--games">
          {data.games.map((g) => <GameCard key={g.id} game={g} />)}
        </div>
      )}

      {data.pages > 1 && (
        <div className="pager">
          <button className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => update('page', page - 1)}>← Anterior</button>
          <span>Página {page} de {data.pages}</span>
          <button className="btn btn--ghost btn--sm" disabled={page >= data.pages} onClick={() => update('page', page + 1)}>Próxima →</button>
        </div>
      )}
    </div>
  );
}
