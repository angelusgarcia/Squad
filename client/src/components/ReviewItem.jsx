import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, timeAgo } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import SpoilerText from './SpoilerText.jsx';
import Icon from './Icon.jsx';

export default function ReviewItem({ review }) {
  const { user } = useAuth();
  const [comments, setComments] = useState(review.comments || []);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const c = await api(`/reviews/${review.id}/comments`, { method: 'POST', body: { text } });
      setComments([...comments, c]);
      setText('');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <article className="card review">
      <header className="review__head">
        <Link to={`/u/${review.user.username}`} className="who">
          <Avatar user={review.user} size={34} />
          <div><b>{review.user.username}</b><p className="muted small">{timeAgo(review.createdAt)}{new Date(review.updatedAt) - new Date(review.createdAt) > 2000 && ' · editada'}</p></div>
        </Link>
        <span className="rating-big">{review.rating}<small>/10</small></span>
      </header>

      <SpoilerText text={review.text} spoiler={review.spoiler} auto={review.spoilerAuto} className="review__text" />

      <button className="link small" onClick={() => setOpen(!open)}><Icon name="message" size={14} /> {comments.length} comentário(s)</button>
      {open && (
        <div className="comments">
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <Avatar user={c.user} size={22} /> <b>{c.user.username}</b>
              <SpoilerText text={c.text} spoiler={c.spoiler} auto={c.spoilerAuto} compact />
            </div>
          ))}
          {user && (
            <form onSubmit={send} className="row">
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Comentar..." />
              <button className="btn btn--sm">Enviar</button>
            </form>
          )}
          {error && <p className="error small">{error}</p>}
        </div>
      )}
    </article>
  );
}
