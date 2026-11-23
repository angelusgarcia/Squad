import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, timeAgo } from '../lib/api.js';
import { renderMarkdown } from '../lib/markdown.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import SpoilerText from '../components/SpoilerText.jsx';

export default function GuidePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [guide, setGuide] = useState(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    api(`/guides/${id}`).then(setGuide).catch((e) => setError(e.message));
  }, [id]);

  const comment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const c = await api(`/guides/${id}/comments`, { method: 'POST', body: { text } });
      setGuide({ ...guide, comments: [...guide.comments, c] });
      setText('');
      setCommentError('');
    } catch (err) {
      setCommentError(err.message);
    }
  };

  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!guide) return <div className="page"><p className="muted">Carregando...</p></div>;

  return (
    <div className="page page--narrow">
      <Link to="/guias" className="muted small">← todos os guias</Link>
      {guide.status === 'DRAFT' && <p className="tag tag--warn">Rascunho — só você vê</p>}
      <h1>{guide.title}</h1>
      <div className="row muted small">
        <Link to={`/u/${guide.user.username}`} className="who"><Avatar user={guide.user} size={26} /> {guide.user.username}</Link>
        {guide.publishedAt && <span>· publicado {timeAgo(guide.publishedAt)}</span>}
        {guide.game && <Link to={`/jogos/${guide.game.slug}`} className="tag">{guide.game.name}</Link>}
        {user?.id === guide.user.id && <Link to={`/guias/${guide.id}/editar`} className="btn btn--ghost btn--sm">Editar</Link>}
      </div>

      <article className="card markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(guide.content) }} />

      <section className="section">
        <h3>Comentários ({guide.comments.length})</h3>
        <div className="stack">
          {guide.comments.map((c) => (
            <div key={c.id} className="card comment">
              <Avatar user={c.user} size={26} /> <b>{c.user.username}</b> <span className="muted small">{timeAgo(c.createdAt)}</span>
              <SpoilerText text={c.text} spoiler={c.spoiler} auto={c.spoilerAuto} />
            </div>
          ))}
        </div>
        {user && guide.status === 'PUBLISHED' && (
          <form onSubmit={comment} className="row" style={{ marginTop: 12 }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Deixe um comentário..." />
            <button className="btn">Enviar</button>
          </form>
        )}
        {commentError && <p className="error small" style={{ marginTop: 8 }}>{commentError}</p>}
      </section>
    </div>
  );
}
