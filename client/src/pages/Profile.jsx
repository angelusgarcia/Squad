import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, timeAgo } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from '../components/Avatar.jsx';
import GameCover from '../components/GameCover.jsx';
import SpoilerText from '../components/SpoilerText.jsx';
import FollowListModal, { PersonRow } from '../components/FollowList.jsx';

export default function Profile() {
  const { username } = useParams();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [followModal, setFollowModal] = useState(null);
  const [people, setPeople] = useState([]);

  useEffect(() => {
    setProfile(null);
    api(`/users/${username}`).then((p) => { setProfile(p); setForm({ username: p.username, bio: p.bio || '', avatarUrl: p.avatarUrl || '' }); }).catch((e) => setError(e.message));
  }, [username, user]);

  const refreshCounts = () =>
    api(`/users/${username}`).then((p) => setProfile((old) => (old ? { ...old, _count: p._count, isFollowing: p.isFollowing } : p)));

  // Sugestões de quem seguir
  useEffect(() => {
    if (profile?.isMe) api('/users/discover/people').then(setPeople).catch(() => {});
  }, [profile?.isMe]);

  const follow = async () => {
    if (!user) return navigate('/login');
    const r = await api(`/users/${username}/follow`, { method: 'POST' });
    setProfile({
      ...profile,
      isFollowing: r.following,
      _count: { ...profile._count, followers: profile._count.followers + (r.following ? 1 : -1) },
    });
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const u = await api('/users/me', { method: 'PATCH', body: { ...form, avatarUrl: form.avatarUrl || null } });
      setUser({ ...user, ...u });
      setEditing(false);
      if (u.username !== username) navigate(`/u/${u.username}`, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !profile) return <div className="page"><p className="error">{error}</p></div>;
  if (!profile) return <div className="page"><p className="muted">Carregando...</p></div>;

  return (
    <div className="page">
      <section className="profile-head card">
        <Avatar user={profile} size={96} />
        <div className="grow">
          {editing ? (
            <form className="form" onSubmit={save}>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Nome de usuário" />
              <textarea rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Biografia" />
              <input value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} placeholder="URL da foto (opcional)" />
              {error && <p className="error">{error}</p>}
              <div className="row">
                <button className="btn btn--sm">Salvar</button>
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>Cancelar</button>
              </div>
            </form>
          ) : (
            <>
              <h1>
                {profile.username}
                {profile.followsMe && <span className="person__badge person__badge--big">segue você</span>}
              </h1>
              <p>{profile.bio || <span className="muted">Sem biografia.</span>}</p>
              <p className="muted small">Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-BR')}</p>
            </>
          )}
          <div className="stats stats--inline">
            <button className="stat-btn" onClick={() => setFollowModal('followers')}>
              <b>{profile._count.followers}</b><span>seguidores</span>
            </button>
            <button className="stat-btn" onClick={() => setFollowModal('following')}>
              <b>{profile._count.following}</b><span>seguindo</span>
            </button>
            <div><b>{profile._count.reviews}</b><span>reviews</span></div>
            <div><b>{profile._count.topics}</b><span>tópicos</span></div>
          </div>
        </div>
        {profile.isMe ? (
          !editing && <button className="btn btn--ghost" onClick={() => setEditing(true)}>Editar perfil</button>
        ) : (
          <button className={`btn ${profile.isFollowing ? 'btn--ghost' : ''}`} onClick={follow}>
            {profile.isFollowing ? 'Seguindo' : 'Seguir'}
          </button>
        )}
      </section>

      {followModal && (
        <FollowListModal
          username={profile.username}
          initialTab={followModal}
          counts={profile._count}
          onClose={() => setFollowModal(null)}
          onCountsChange={refreshCounts}
        />
      )}

      {profile.isMe && people.length > 0 && (
        <section className="section">
          <h2>Pessoas para seguir</h2>
          <div className="people-grid">
            {people.map((p) => (
              <PersonRow
                key={p.id}
                person={p}
                onChange={(np) => {
                  setPeople((list) => list.map((x) => (x.id === np.id ? np : x)));
                  refreshCounts();
                }}
              />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2>Jogos favoritos</h2>
        <div className="fav-row">
          {profile.favorites.map(({ game }) => (
            <Link key={game.id} to={`/jogos/${game.slug}`} className="fav" title={game.name}>
              <GameCover game={game} />
              <span>{game.name}</span>
            </Link>
          ))}
          {profile.favorites.length === 0 && <p className="muted">Nenhum favorito ainda.</p>}
        </div>
      </section>

      <div className="two-cols">
        <section className="section">
          <h2>Reviews</h2>
          <div className="stack">
            {profile.reviews.map((r) => (
              <Link key={r.id} to={`/jogos/${r.game.slug}`} className="card review-mini">
                <span className="rating-big">{r.rating}</span>
                <div>
                  <b>{r.game.name}</b>
                  <SpoilerText text={r.text.slice(0, 120)} spoiler={r.spoiler} auto={r.spoilerAuto} className="muted small" compact />
                </div>
              </Link>
            ))}
            {profile.reviews.length === 0 && <p className="muted">Nenhuma review.</p>}
          </div>
        </section>
        <section className="section">
          <h2>Guias e indicações</h2>
          <div className="stack">
            {profile.guides.map((g) => (
              <Link key={g.id} to={`/guias/${g.id}`} className="card topic-row">
                <div><h4>{g.title}</h4><p className="muted small">{g.game?.name} · {timeAgo(g.publishedAt)}</p></div>
              </Link>
            ))}
            {profile.indications.map((i) => (
              <Link key={i.id} to={`/jogos/${i.game.slug}`} className="card topic-row">
                <div><h4>Indicou {i.game.name}</h4><SpoilerText text={`“${i.reason.slice(0, 90)}”`} spoiler={i.spoiler} auto={i.spoilerAuto} className="muted small" compact /></div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
