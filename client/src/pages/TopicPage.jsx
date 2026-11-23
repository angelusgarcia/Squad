import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, timeAgo } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import SpoilerText from '../components/SpoilerText.jsx';

export default function TopicPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [topic, setTopic] = useState(null);
  const [body, setBody] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/forum/topics/${id}`).then(setTopic).catch((e) => setError(e.message));
  }, [id]);

  const reply = async (e) => {
    e.preventDefault();
    try {
      const r = await api(`/forum/topics/${id}/replies`, { method: 'POST', body: { body, spoiler } });
      setTopic({ ...topic, replies: [...topic.replies, r] });
      setBody('');
      setSpoiler(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !topic) return <div className="page"><p className="error">{error}</p></div>;
  if (!topic) return <div className="page"><p className="muted">Carregando...</p></div>;

  const Post = ({ p, op }) => (
    <article className={`card post ${op ? 'post--op' : ''}`}>
      <Link to={`/u/${p.user.username}`} className="post__author">
        <Avatar user={p.user} size={44} />
        <b>{p.user.username}</b>
        {op && <span className="tag">autor</span>}
      </Link>
      <div className="post__body">
        <p className="muted small">{timeAgo(p.createdAt)}</p>
        <SpoilerText text={p.body} spoiler={p.spoiler} auto={p.spoilerAuto} className="pre" />
      </div>
    </article>
  );

  return (
    <div className="page page--narrow">
      <Link to="/forum" className="muted small">← voltar ao fórum</Link>
      <h1>{topic.title}</h1>
      {topic.game && <Link to={`/jogos/${topic.game.slug}`} className="tag">{topic.game.name}</Link>}

      <div className="stack" style={{ marginTop: 16 }}>
        <Post p={topic} op />
        {topic.replies.map((r) => <Post key={r.id} p={r} />)}
      </div>

      {user ? (
        <form className="card form" onSubmit={reply}>
          <textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escreva uma resposta..." />
          {error && <p className="error">{error}</p>}
          <div className="row row--between">
            <label className="check"><input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} /> Contém spoiler</label>
            <button className="btn">Responder</button>
          </div>
        </form>
      ) : (
        <p className="muted"><Link to="/login">Entre</Link> para responder.</p>
      )}
    </div>
  );
}
