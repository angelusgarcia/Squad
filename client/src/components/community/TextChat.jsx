import { useEffect, useRef, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../Avatar.jsx';
import SpoilerText from '../SpoilerText.jsx';
import Icon from '../Icon.jsx';

const hour = (d) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const dayLabel = (d) => {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (date.toDateString() === today.toDateString()) return 'Hoje';
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem';
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
};

// Chat de texto
export default function TextChat({ socket, channel }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(null);
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef(null);
  const lastTyping = useRef(0);

  useEffect(() => {
    setMessages([]);
    api(`/community/channels/${channel.id}/messages`).then(setMessages);
    socket.emit('channel:join', { channelId: channel.id });

    const onNew = (m) => m.channelId === channel.id && setMessages((list) => [...list, m]);
    let timer;
    const onTyping = ({ channelId, username }) => {
      if (channelId !== channel.id) return;
      setTyping(username);
      clearTimeout(timer);
      timer = setTimeout(() => setTyping(null), 2500);
    };
    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
      clearTimeout(timer);
    };
  }, [socket, channel.id]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    const content = text;
    setSending(true);
    setSendError('');
    const safety = setTimeout(() => setSending(false), 12000);
    socket.emit('message:send', { channelId: channel.id, content }, (res) => {
      clearTimeout(safety);
      setSending(false);
      if (res?.error) {
        setSendError(res.error);
        setText(content);
      }
    });
    setText('');
  };

  const onChange = (e) => {
    setText(e.target.value);
    if (Date.now() - lastTyping.current > 2000) {
      socket.emit('typing', { channelId: channel.id });
      lastTyping.current = Date.now();
    }
  };

  return (
    <section className="room">
      <header className="room__head">
        <div className="room__icon"><Icon name="hash" size={18} /></div>
        <div>
          <b>{channel.name}</b>
          <p className="muted small">Chat do squad · mensagens salvas</p>
        </div>
      </header>

      <div className="bubbles">
        <div className="bubbles__start">
          <span className="bubbles__start-icon"><Icon name="message" size={28} strokeWidth={1.5} /></span>
          <p>Começo do chat <b>{channel.name}</b>. Manda a primeira!</p>
        </div>

        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const mine = m.userId === user.id;
          const newDay = !prev || new Date(prev.createdAt).toDateString() !== new Date(m.createdAt).toDateString();
          const grouped = !newDay && prev && prev.userId === m.userId && new Date(m.createdAt) - new Date(prev.createdAt) < 5 * 60 * 1000;
          return (
            <div key={m.id}>
              {newDay && <div className="day-sep"><span>{dayLabel(m.createdAt)}</span></div>}
              <div className={`bubble-row ${mine ? 'bubble-row--mine' : ''} ${grouped ? 'is-grouped' : ''}`}>
                {!mine && <div className="bubble-row__avatar">{!grouped && <Avatar user={m.user} size={34} />}</div>}
                <div className="bubble-wrap">
                  {!grouped && !mine && <span className="bubble__name">{m.user.username}</span>}
                  <div className="bubble">
                    <SpoilerText text={m.content} spoiler={m.spoiler} auto={m.spoilerAuto} compact />
                    <span className="bubble__time">{hour(m.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <div className="composer">
        <div className="composer__typing">
          {sendError ? (
            <span className="composer__error">{sendError}</span>
          ) : sending ? (
            <span>verificando mensagem...</span>
          ) : (
            typing && <><span className="dots"><i /><i /><i /></span> <b>{typing}</b> está digitando</>
          )}
        </div>
        <form onSubmit={send} className="composer__box">
          <input value={text} onChange={onChange} placeholder={`Mensagem para ${channel.name}...`} />
          <button className="composer__send" disabled={!text.trim() || sending} title="Enviar"><Icon name="send" size={17} /></button>
        </form>
      </div>
    </section>
  );
}
