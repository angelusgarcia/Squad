import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';

// Botão Seguir
export function FollowButton({ person, onChange, small = true }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  if (person.isMe || user?.username === person.username) return null;

  const toggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate('/login');
    if (person.isFollowing && !window.confirm(`Deixar de seguir ${person.username}?`)) return;
    setBusy(true);
    const r = await api(`/users/${person.username}/follow`, { method: 'POST' });
    setBusy(false);
    onChange?.({ ...person, isFollowing: r.following });
  };

  const label = person.isFollowing ? 'Seguindo' : person.followsMe ? 'Seguir de volta' : 'Seguir';
  return (
    <button
      className={`btn ${small ? 'btn--sm' : ''} ${person.isFollowing ? 'btn--ghost' : ''} follow-btn`}
      onClick={toggle}
      disabled={busy}
    >
      {label}
    </button>
  );
}

// Uma pessoa na lista
export function PersonRow({ person, onChange, onOpen }) {
  return (
    <Link to={`/u/${person.username}`} className="person" onClick={onOpen}>
      <Avatar user={person} size={44} />
      <div className="grow">
        <b>{person.username}</b>
        {person.followsMe && !person.isMe && <span className="person__badge">segue você</span>}
        <p className="muted small">{person.bio || '—'}</p>
      </div>
      <FollowButton person={person} onChange={onChange} />
    </Link>
  );
}

// Modal Seguidores / Seguindo
export default function FollowListModal({ username, initialTab = 'followers', counts, onClose, onCountsChange }) {
  const [tab, setTab] = useState(initialTab);
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    setList(null);
    api(`/users/${username}/${tab}`).then(setList);
  }, [username, tab]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = (p) => {
    setList((l) => l.map((x) => (x.id === p.id ? p : x)));
    onCountsChange?.();
  };

  const filtered = (list || []).filter((p) => p.username.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__box card follow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="follow-modal__head">
          <b>{username}</b>
          <button className="round-btn" onClick={onClose} aria-label="Fechar"><Icon name="x" size={16} /></button>
        </div>
        <div className="follow-tabs">
          <button className={tab === 'followers' ? 'active' : ''} onClick={() => setTab('followers')}>
            <b>{counts?.followers ?? ''}</b> seguidores
          </button>
          <button className={tab === 'following' ? 'active' : ''} onClick={() => setTab('following')}>
            <b>{counts?.following ?? ''}</b> seguindo
          </button>
        </div>
        <input className="follow-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pesquisar" />
        <div className="follow-list">
          {list === null && <p className="muted center">Carregando...</p>}
          {list && filtered.map((p) => <PersonRow key={p.id} person={p} onChange={update} onOpen={onClose} />)}
          {list && filtered.length === 0 && (
            <p className="muted center follow-empty">
              {q ? 'Ninguém com esse nome.' : tab === 'followers' ? 'Ainda não tem seguidores.' : 'Ainda não segue ninguém.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
