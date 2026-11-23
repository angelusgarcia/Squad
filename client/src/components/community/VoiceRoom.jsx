import { useMemo, useState } from 'react';
import Avatar from '../Avatar.jsx';
import { VideoEl, AudioEl } from './MediaEl.jsx';

// Áudio dos participantes
export function VoiceAudio({ voice }) {
  return Object.entries(voice.peers).map(([id, p]) =>
    Object.values(p.streams).map((s) => <AudioEl key={`${id}-${s.id}`} stream={s} muted={voice.me.deafened} />)
  );
}
import { useAuth } from '../../context/AuthContext.jsx';
import { useSpeaking } from '../../hooks/useVoice.js';
import { useElapsed } from './ChannelSidebar.jsx';
import Icon from '../Icon.jsx';

// Card de um participante
function Tile({ user, stream, showVideo, muted, deafened, isMe, mirror }) {
  const speaking = useSpeaking(stream, !muted);
  return (
    <div className={`tile ${speaking ? 'tile--speaking' : ''}`}>
      {showVideo ? (
        <VideoEl stream={stream} mirror={mirror} className="tile__video" />
      ) : (
        <div className="tile__avatar">
          <Avatar user={user} size={84} speaking={speaking} />
        </div>
      )}
      <span className="tile__tag">
        {user?.username}{isMe && ' · você'}
      </span>
      {(muted || deafened) && <span className="tile__status"><Icon name={deafened ? 'headphonesOff' : 'micOff'} size={15} /></span>}
    </div>
  );
}

// Card de tela compartilhada
function ScreenTile({ user, stream, onClick, focused }) {
  return (
    <div className={`tile tile--screen ${focused ? 'tile--focused' : ''}`} onClick={onClick} title={focused ? 'Clique para reduzir' : 'Clique para ampliar'}>
      <VideoEl stream={stream} className="tile__video tile__video--contain" />
      <span className="tile__tag"><span className="live">AO VIVO</span> tela de {user?.username}</span>
    </div>
  );
}

export default function VoiceRoom({ channel, voice, participants = [] }) {
  const { user } = useAuth();
  const [focus, setFocus] = useState(null);
  const connected = voice.channel?.id === channel.id;
  const { me, peers } = voice;
  const elapsed = useElapsed(connected ? voice.joinedAt : null);

  const camPreview = useMemo(
    () => (me.camera && voice.localStream ? new MediaStream(voice.localStream.getVideoTracks()) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [me.camera, voice.localStream]
  );

  if (!connected) {
    return (
      <section className="room room--lobby">
        <div className="lobby-hero">
          <div className="lobby-hero__ring">
            {participants.length ? (
              <div className="stacked stacked--big">
                {participants.slice(0, 4).map((p) => <span key={p.socketId}><Avatar user={p.user} size={56} /></span>)}
              </div>
            ) : (
              <img className="lobby-hero__logo" src="/brand/emblema-256.png" alt="Squad" />
            )}
          </div>
          <span className="lobby-hero__kicker">LOBBY DE VOZ</span>
          <h2>{channel.name}</h2>
          <p className="muted">
            {participants.length
              ? `${participants.map((p) => p.user.username).join(', ')} ${participants.length > 1 ? 'estão' : 'está'} aqui agora.`
              : 'Tudo quieto por aqui. Chame o squad!'}
          </p>
          <button className="btn btn--lg btn--teal" onClick={() => voice.join(channel)}><Icon name="headphones" size={18} /> Entrar na lobby</button>
          <ul className="lobby-hero__features">
            <li><Icon name="mic" size={14} /> Voz</li>
            <li><Icon name="video" size={14} /> Câmera</li>
            <li><Icon name="monitor" size={14} /> Compartilhar tela</li>
          </ul>
          <p className="muted small">
            Para testar sozinho: abra uma aba anônima, entre com <code>squad2@squad.dev</code> / <code>123456</code> e entre na mesma lobby.
          </p>
        </div>
      </section>
    );
  }

  const peerList = Object.entries(peers).filter(([, p]) => p.user);

  // Telas compartilhadas
  const screens = [];
  if (me.screen && voice.screenStream) screens.push({ key: 'me-screen', user, stream: voice.screenStream });
  peerList.forEach(([id, p]) => {
    const s = p.state?.screen && p.streams[p.state.screenStreamId];
    if (s) screens.push({ key: `${id}-screen`, user: p.user, stream: s });
  });
  const focused = screens.find((s) => s.key === focus) || null;

  return (
    <section className="room room--voice">
      <header className="room__head">
        <div className="room__icon room__icon--teal"><img src="/brand/emblema-96.png" alt="" /></div>
        <div className="grow">
          <b>{channel.name}</b>
          <p className="muted small">{peerList.length + 1} na lobby · {elapsed}</p>
        </div>
        {screens.length > 0 && <span className="live">{screens.length} AO VIVO</span>}
      </header>

      {voice.notice && <p className="note">{voice.notice}</p>}

      <div className={`stage ${focused ? 'has-focus' : ''}`}>
        {focused && (
          <div className="stage__focus">
            <ScreenTile {...focused} focused onClick={() => setFocus(null)} />
          </div>
        )}
        <div className="stage__grid">
          {screens.filter((s) => s.key !== focus).map((s) => (
            <ScreenTile key={s.key} {...s} onClick={() => setFocus(s.key)} />
          ))}
          <Tile
            isMe
            user={user}
            stream={me.camera ? camPreview : voice.localStream}
            showVideo={Boolean(me.camera && camPreview)}
            mirror
            muted={me.muted}
            deafened={me.deafened}
          />
          {peerList.map(([id, p]) => {
            const main = Object.values(p.streams).find((s) => s.id !== p.state?.screenStreamId);
            const hasVideo = p.state?.camera && main?.getVideoTracks().length > 0;
            return <Tile key={id} user={p.user} stream={main} showVideo={hasVideo} muted={p.state?.muted} deafened={p.state?.deafened} />;
          })}
        </div>
      </div>

      <div className="controls">
        <div className="controls__bar">
          <button className={`ctl ${me.muted ? 'ctl--off' : ''}`} onClick={voice.toggleMute} data-tip={me.muted ? 'Ativar mic' : 'Mutar'}>
            <Icon name={me.muted ? 'micOff' : 'mic'} size={20} />
          </button>
          <button className={`ctl ${me.deafened ? 'ctl--off' : ''}`} onClick={voice.toggleDeafen} data-tip="Áudio">
            <Icon name={me.deafened ? 'headphonesOff' : 'headphones'} size={20} />
          </button>
          <button className={`ctl ${me.camera ? 'ctl--on' : ''}`} onClick={voice.toggleCamera} data-tip={me.camera ? 'Desligar câmera' : 'Câmera'}>
            <Icon name="video" size={20} />
          </button>
          <button className={`ctl ctl--wide ${me.screen ? 'ctl--live' : ''}`} onClick={voice.toggleScreen}>
            <Icon name="monitor" size={20} /> <span>{me.screen ? 'Parar transmissão' : 'Transmitir tela'}</span>
          </button>
          <span className="controls__sep" />
          <button className="ctl ctl--leave" onClick={voice.leave} data-tip="Sair"><Icon name="power" size={20} /></button>
        </div>
      </div>
    </section>
  );
}
