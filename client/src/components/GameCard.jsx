import { Link } from 'react-router-dom';
import GameCover from './GameCover.jsx';

export function Score({ value }) {
  if (value == null) return null;
  const cls = value >= 85 ? 'good' : value >= 70 ? 'ok' : 'bad';
  return <span className={`score score--${cls}`} title="Metacritic">{value}</span>;
}

export default function GameCard({ game }) {
  return (
    <Link to={`/jogos/${game.slug}`} className="game-card">
      <GameCover game={game} />
      <div className="game-card__body">
        <div className="game-card__title">
          <h3>{game.name}</h3>
          <Score value={game.metacritic} />
        </div>
        <div className="tags">
          {game.genres?.slice(0, 3).map((g) => (
            <span key={g.id} className="tag">{g.name}</span>
          ))}
        </div>
        <p className="muted small">
          {game.released ? new Date(game.released).getFullYear() : '—'}
          {game.rating ? ` · ${game.rating.toFixed(1)}/5` : ''}
          {game._count ? ` · ${game._count.reviews} reviews` : ''}
        </p>
      </div>
    </Link>
  );
}
