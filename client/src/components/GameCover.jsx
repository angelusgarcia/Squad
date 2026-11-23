import { useState } from 'react';
import { colorFor } from './Avatar.jsx';

// Capa do jogo
export default function GameCover({ game, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (game?.coverUrl && !failed)
    return (
      <img
        className={`cover ${className}`}
        src={game.coverUrl}
        alt={game.name}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  const c1 = colorFor(game?.name);
  const c2 = colorFor((game?.name || '') + 'x');
  return (
    <div className={`cover cover--fake ${className}`} style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
      <span>{game?.name}</span>
    </div>
  );
}
