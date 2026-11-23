import { useState } from 'react';
import { api } from '../lib/api.js';

export default function ReviewForm({ gameId, review, onSaved, onCancel }) {
  const [rating, setRating] = useState(review?.rating || 8);
  const [text, setText] = useState(review?.text || '');
  const [spoiler, setSpoiler] = useState(review?.spoiler || false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = { gameId, rating, text, spoiler };
      const saved = review
        ? await api(`/reviews/${review.id}`, { method: 'PUT', body })
        : await api('/reviews', { method: 'POST', body });
      onSaved?.(saved);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="card review-form" onSubmit={submit}>
      <div className="rating-picker">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button type="button" key={n} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}>{n}</button>
        ))}
        <span className="muted small">sua nota: <b>{rating}/10</b></span>
      </div>
      <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="O que você achou do jogo?" />
      <div className="row row--between">
        <label className="check"><input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} /> Contém spoiler</label>
        <div className="row">
          {onCancel && <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>Cancelar</button>}
          <button className="btn btn--sm">{review ? 'Salvar edição' : 'Publicar review'}</button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
