import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, timeAgo } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import GameCover from './GameCover.jsx';
import Avatar from './Avatar.jsx';
import SpoilerText from './SpoilerText.jsx';
import Icon from './Icon.jsx';

export default function IndicationCard({ indication, onTagClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(indication.likedByMe);
  const [count, setCount] = useState(indication._count?.likes || 0);

  const like = async () => {
    if (!user) return navigate('/login');
    const r = await api(`/indications/${indication.id}/like`, { method: 'POST' });
    setLiked(r.liked);
    setCount(r.count);
  };

  const { game } = indication;
  return (
    <article className="card indication">
      <Link to={`/jogos/${game.slug}`} className="indication__cover">
        <GameCover game={game} />
      </Link>
      <div className="indication__body">
        <Link to={`/jogos/${game.slug}`}><h3>{game.name}</h3></Link>
        <SpoilerText text={`“${indication.reason}”`} spoiler={indication.spoiler} auto={indication.spoilerAuto} className="indication__reason" />
        <div className="tags">
          {indication.tags?.map((t) => (
            <button key={t} className="tag tag--btn" onClick={() => onTagClick?.(t)}>#{t}</button>
          ))}
        </div>
        <div className="indication__foot">
          <Link to={`/u/${indication.user.username}`} className="who">
            <Avatar user={indication.user} size={22} /> {indication.user.username}
            <span className="muted small"> · {timeAgo(indication.createdAt)}</span>
          </Link>
          <button className={`like ${liked ? 'like--on' : ''}`} onClick={like}>
            <Icon name="heart" size={15} fill={liked} /> {count}
          </button>
        </div>
      </div>
    </article>
  );
}
