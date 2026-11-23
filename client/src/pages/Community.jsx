// Comunidade do Squad
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { connectSocket, disconnectSocket } from '../lib/socket.js';
import { useVoice } from '../hooks/useVoice.js';
import SquadSwitcher from '../components/community/SquadSwitcher.jsx';
import ChannelSidebar from '../components/community/ChannelSidebar.jsx';
import TextChat from '../components/community/TextChat.jsx';
import VoiceRoom, { VoiceAudio } from '../components/community/VoiceRoom.jsx';
import Avatar from '../components/Avatar.jsx';
import GameCover from '../components/GameCover.jsx';
import Icon from '../components/Icon.jsx';

const COLORS = ['#7c5cff', '#19d3c5', '#e0603a', '#3fbf7f', '#2f9be0', '#e0b13a', '#d14ba0'];

export default function Community() {
  const params = useParams();
  const navigate = useNavigate();
  const [serverIdParam, channelIdParam] = (params['*'] || '').split('/');

  const [socket, setSocket] = useState(null);
  const [servers, setServers] = useState([]);
  const [server, setServer] = useState(null);
  const [presence, setPresence] = useState({});
  const [modal, setModal] = useState(null);
  const [error, setError] = useState('');

  const voice = useVoice(socket);

  // Conexão do socket
  useEffect(() => {
    const s = connectSocket();
    setSocket(s);
    s.on('connect_error', () => setError('Não foi possível conectar ao servidor de tempo real.'));
    s.on('connect', () => setError(''));
    return () => disconnectSocket();
  }, []);

  const loadServers = useCallback(() => api('/community/servers').then((list) => { setServers(list); return list; }), []);
  useEffect(() => { loadServers(); }, [loadServers]);

  // Squad ativo
  useEffect(() => {
    if (!servers.length) return;
    const joined = servers.filter((s) => s.joined);
    if (!serverIdParam || !joined.some((s) => s.id === serverIdParam)) {
      if (joined[0]) navigate(`/comunidade/${joined[0].id}`, { replace: true });
      else setModal('explore');
      return;
    }
    api(`/community/servers/${serverIdParam}`).then(setServer).catch((e) => setError(e.message));
  }, [serverIdParam, servers, navigate]);

  // Presença nas lobbies
  useEffect(() => {
    if (!socket || !server) return;
    const watch = () => socket.emit('server:watch', { serverId: server.id }, setPresence);
    watch();
    socket.on('connect', watch);
    const onPresence = ({ channelId, participants }) => setPresence((p) => ({ ...p, [channelId]: participants }));
    socket.on('voice:presence', onPresence);
    return () => {
      socket.off('voice:presence', onPresence);
      socket.off('connect', watch);
    };
  }, [socket, server]);

  const channel =
    server?.channels.find((c) => c.id === channelIdParam) || server?.channels.find((c) => c.type === 'TEXT') || null;

  const openChannel = (c) => navigate(`/comunidade/${server.id}/${c.id}`);

  const inVoice = new Set(Object.values(presence).flat().map((p) => p.user.id));
  const crewLive = server?.members.filter((m) => inVoice.has(m.userId)) || [];
  const crewRest = server?.members.filter((m) => !inVoice.has(m.userId)) || [];

  return (
    <div className="hub">
      <aside className="hub__side">
        <SquadSwitcher
          servers={servers}
          current={server}
          onSelect={(id) => navigate(`/comunidade/${id}`)}
          onCreate={() => setModal('create')}
          onExplore={() => setModal('explore')}
        />
        {server && (
          <ChannelSidebar
            server={server}
            activeChannelId={channel?.id}
            presence={presence}
            voice={voice}
            onOpenChannel={openChannel}
            onAddChannel={(kind) => setModal({ type: 'channel', kind })}
          />
        )}
      </aside>

      <VoiceAudio voice={voice} />

      <main className="hub__main">
        {error && <p className="note note--error">{error}</p>}
        {!server && <div className="hub__empty"><p className="muted">Escolha ou crie um squad para começar.</p></div>}
        {server && channel && socket && (channel.type === 'TEXT' ? (
          <TextChat socket={socket} channel={channel} />
        ) : (
          <VoiceRoom channel={{ ...channel, serverId: server.id }} voice={voice} participants={presence[channel.id] || []} />
        ))}
      </main>

      {server && (
        <aside className="hub__crew">
          <h4 className="crew__title">Crew <span>{server.members.length}</span></h4>
          {crewLive.length > 0 && <p className="crew__group">Em lobby — {crewLive.length}</p>}
          {crewLive.map((m) => <CrewMember key={m.userId} m={m} live />)}
          <p className="crew__group">Membros — {crewRest.length}</p>
          {crewRest.map((m) => <CrewMember key={m.userId} m={m} />)}
          <button
            className="btn btn--ghost btn--sm btn--block crew__leave"
            onClick={async () => {
              if (!window.confirm(`Sair do squad ${server.name}?`)) return;
              await api(`/community/servers/${server.id}/leave`, { method: 'POST' });
              voice.leave();
              setServer(null);
              await loadServers();
              navigate('/comunidade');
            }}
          >
            Sair do squad
          </button>
        </aside>
      )}

      {modal === 'create' && (
        <CreateServerModal
          onClose={() => setModal(null)}
          onCreated={async (s) => { setModal(null); await loadServers(); navigate(`/comunidade/${s.id}`); }}
        />
      )}
      {modal === 'explore' && (
        <ExploreModal
          servers={servers}
          onClose={() => setModal(null)}
          onJoined={async (id) => { setModal(null); await loadServers(); navigate(`/comunidade/${id}`); }}
        />
      )}
      {modal?.type === 'channel' && (
        <CreateChannelModal
          kind={modal.kind}
          serverId={server.id}
          onClose={() => setModal(null)}
          onCreated={async (c) => {
            setModal(null);
            setServer(await api(`/community/servers/${server.id}`));
            navigate(`/comunidade/${server.id}/${c.id}`);
          }}
        />
      )}
    </div>
  );
}

function CrewMember({ m, live }) {
  return (
    <div className={`crew-member ${live ? 'is-live' : ''}`}>
      <span className="crew-member__avatar"><Avatar user={m.user} size={32} /></span>
      <div className="grow">
        <b>{m.user.username}</b>
        {m.role === 'owner' && <span className="role">líder</span>}
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__box card" onClick={(e) => e.stopPropagation()}>
        <div className="row row--between"><h2>{title}</h2><button className="round-btn" onClick={onClose} aria-label="Fechar"><Icon name="x" size={16} /></button></div>
        {children}
      </div>
    </div>
  );
}

function CreateServerModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      onCreated(await api('/community/servers', { method: 'POST', body: { name, description, color } }));
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <Modal title="Criar squad" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do squad (ex: Squad da Faculdade)" />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descrição (opcional)" />
        <div className="row">
          {COLORS.map((c) => (
            <button type="button" key={c} className={`swatch ${c === color ? 'is-on' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
          ))}
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn">Criar squad</button>
        <p className="muted small">Já vem com os chats “geral” e “clipes-e-prints” e uma lobby de voz.</p>
      </form>
    </Modal>
  );
}

function ExploreModal({ servers, onClose, onJoined }) {
  const join = async (id) => {
    await api(`/community/servers/${id}/join`, { method: 'POST' });
    onJoined(id);
  };
  return (
    <Modal title="Explorar squads" onClose={onClose}>
      <div className="explore">
        {servers.map((s) => (
          <div key={s.id} className="explore-card" style={{ '--c': s.color }}>
            <div className="explore-card__cover">
              {s.game ? <GameCover game={s.game} /> : <div className="explore-card__color" />}
            </div>
            <div className="explore-card__body">
              <b>{s.name}</b>
              <p className="muted small">{s.description || 'Sem descrição'}</p>
              <div className="row row--between">
                <span className="muted small">{s._count.members} membros{s.game && ` · ${s.game.name}`}</span>
                {s.joined ? <span className="tag">no squad</span> : <button className="btn btn--sm" onClick={() => join(s.id)}>Entrar</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function CreateChannelModal({ kind, serverId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [type, setType] = useState(kind);
  const submit = async (e) => {
    e.preventDefault();
    onCreated(await api(`/community/servers/${serverId}/channels`, { method: 'POST', body: { name, type } }));
  };
  return (
    <Modal title={type === 'TEXT' ? 'Novo chat' : 'Nova lobby'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <div className="tabs">
          <button type="button" className={type === 'TEXT' ? 'active' : ''} onClick={() => setType('TEXT')}>Chat</button>
          <button type="button" className={type === 'VOICE' ? 'active' : ''} onClick={() => setType('VOICE')}>Lobby de voz</button>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={type === 'TEXT' ? 'nome-do-chat' : 'Nome da lobby'} />
        <button className="btn">Criar</button>
      </form>
    </Modal>
  );
}
