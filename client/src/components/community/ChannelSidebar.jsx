import { useEffect, useState } from 'react';
import Avatar from '../Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Icon from '../Icon.jsx';

export function useElapsed(since) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!since) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [since]);
  if (!since) return '00:00';
  const s = Math.max(0, Math.floor((now - since) / 1000));
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  const h = Math.floor(s / 3600);
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Painel lateral: chats, lobbies e dock do usuário
export default function ChannelSidebar({ server, activeChannelId, presence, voice, onOpenChannel, onAddChannel }) {
  const { user } = useAuth();
  const chats = server.channels.filter((c) => c.type === 'TEXT');
  const lobbies = server.channels.filter((c) => c.type === 'VOICE');
  const isOwner = server.ownerId === user.id;
  const elapsed = useElapsed(voice.joinedAt);

  return (
    <div className="side">
      <div className="side__scroll">
        <div className="side__title">
          <span>Chats</span>
          {isOwner && <button onClick={() => onAddChannel('TEXT')} title="Novo chat"><Icon name="plus" size={15} /></button>}
        </div>
        {chats.map((c) => (
          <button key={c.id} className={`chat-pill ${c.id === activeChannelId ? 'is-active' : ''}`} onClick={() => onOpenChannel(c)}>
            <span className="chat-pill__dot" />
            {c.name}
          </button>
        ))}

        <div className="side__title">
          <span>Lobbies</span>
          {isOwner && <button onClick={() => onAddChannel('VOICE')} title="Nova lobby"><Icon name="plus" size={15} /></button>}
        </div>
        {lobbies.map((c) => {
          const people = presence[c.id] || [];
          const live = people.some((p) => p.state?.screen);
          const connected = voice.channel?.id === c.id;
          return (
            <button
              key={c.id}
              className={`lobby ${c.id === activeChannelId ? 'is-active' : ''} ${connected ? 'is-connected' : ''}`}
              onClick={() => onOpenChannel(c)}
            >
              <div className="lobby__top">
                <b>{c.name}</b>
                {live && <span className="live">AO VIVO</span>}
              </div>
              <div className="lobby__bottom">
                {people.length ? (
                  <div className="stacked">
                    {people.slice(0, 5).map((p) => (
                      <span key={p.socketId} title={p.user.username}><Avatar user={p.user} size={24} /></span>
                    ))}
                    {people.length > 5 && <span className="stacked__more">+{people.length - 5}</span>}
                  </div>
                ) : (
                  <span className="muted small">Ninguém aqui ainda</span>
                )}
                <span className={`lobby__cta ${connected ? 'on' : ''}`}>{connected ? 'conectado' : 'Entrar →'}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="dock">
        {voice.channel && (
          <div className="dock__call">
            <div className="dock__pulse" />
            <div className="grow">
              <b>{voice.channel.name}</b>
              <p className="small">Em lobby · {elapsed}</p>
            </div>
            <button className="round-btn round-btn--danger" onClick={voice.leave} title="Sair da lobby"><Icon name="power" size={16} /></button>
          </div>
        )}
        <div className="dock__me">
          <Avatar user={user} size={34} />
          <div className="grow">
            <b>{user.username}</b>
            <p className="muted small">{voice.channel ? 'na lobby' : 'online'}</p>
          </div>
          <button className={`round-btn ${voice.me.muted ? 'round-btn--off' : ''}`} onClick={voice.toggleMute} disabled={!voice.channel} title="Microfone">
            <Icon name={voice.me.muted ? 'micOff' : 'mic'} size={16} />
          </button>
          <button className={`round-btn ${voice.me.deafened ? 'round-btn--off' : ''}`} onClick={voice.toggleDeafen} disabled={!voice.channel} title="Áudio">
            <Icon name={voice.me.deafened ? 'headphonesOff' : 'headphones'} size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
