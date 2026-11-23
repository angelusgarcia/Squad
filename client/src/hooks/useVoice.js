// Chamada de voz, vídeo e tela (WebRTC)
import { useCallback, useEffect, useRef, useState } from 'react';

const ICE = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

const initialMe = { muted: false, deafened: false, camera: false, screen: false, screenStreamId: null };

export function useVoice(socket) {
  const pcs = useRef(new Map());
  const localStream = useRef(null);
  const screenStream = useRef(null);
  const meRef = useRef(initialMe);

  const [channel, setChannel] = useState(null);
  const [peers, setPeers] = useState({});
  const [me, setMeState] = useState(initialMe);
  const [notice, setNotice] = useState('');
  const [joinedAt, setJoinedAt] = useState(null);
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const setMe = (patch) => {
    meRef.current = { ...meRef.current, ...patch };
    setMeState(meRef.current);
    socket?.emit('voice:state', meRef.current);
  };

  const updatePeer = (id, fn) =>
    setPeers((all) => ({ ...all, [id]: fn(all[id] || { user: null, state: {}, streams: {} }) }));

  const removePeer = (id) => {
    pcs.current.get(id)?.pc.close();
    pcs.current.delete(id);
    setPeers((all) => {
      const next = { ...all };
      delete next[id];
      return next;
    });
  };

  const createPeer = useCallback(
    (remoteId) => {
      if (pcs.current.has(remoteId)) return pcs.current.get(remoteId);
      const pc = new RTCPeerConnection(ICE);
      const entry = { pc, polite: socket.id > remoteId, makingOffer: false, ignoreOffer: false, senders: {} };
      pcs.current.set(remoteId, entry);

      localStream.current?.getTracks().forEach((t) => {
        entry.senders[t.kind === 'audio' ? 'audio' : 'camera'] = pc.addTrack(t, localStream.current);
      });
      screenStream.current?.getTracks().forEach((t, i) => {
        entry.senders[`screen${i}`] = pc.addTrack(t, screenStream.current);
      });

      pc.onnegotiationneeded = async () => {
        try {
          entry.makingOffer = true;
          await pc.setLocalDescription();
          socket.emit('voice:signal', { to: remoteId, data: { description: pc.localDescription } });
        } catch (e) {
          console.error('[voz] negociação', e);
        } finally {
          entry.makingOffer = false;
        }
      };
      pc.onicecandidate = ({ candidate }) => {
        if (candidate) socket.emit('voice:signal', { to: remoteId, data: { candidate } });
      };
      pc.ontrack = ({ track, streams }) => {
        const stream = streams[0];
        if (!stream) return;
        updatePeer(remoteId, (p) => ({ ...p, streams: { ...p.streams, [stream.id]: stream } }));
        stream.onremovetrack = () => {
          if (stream.getTracks().length === 0)
            updatePeer(remoteId, (p) => {
              const s = { ...p.streams };
              delete s[stream.id];
              return { ...p, streams: s };
            });
          else rerender();
        };
        track.onunmute = rerender;
        track.onmute = rerender;
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed') pc.restartIce();
        rerender();
      };
      return entry;
    },
    [socket]
  );

  // ---- Eventos de sinalização vindos do servidor ----
  useEffect(() => {
    if (!socket) return;

    const onSignal = async ({ from, data }) => {
      if (!meRef.current || !localStream.current) return;
      const entry = createPeer(from);
      const { pc } = entry;
      try {
        if (data.description) {
          const collision = data.description.type === 'offer' && (entry.makingOffer || pc.signalingState !== 'stable');
          entry.ignoreOffer = !entry.polite && collision;
          if (entry.ignoreOffer) return;
          await pc.setRemoteDescription(data.description);
          if (data.description.type === 'offer') {
            await pc.setLocalDescription();
            socket.emit('voice:signal', { to: from, data: { description: pc.localDescription } });
          }
        } else if (data.candidate) {
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (e) {
            if (!entry.ignoreOffer) throw e;
          }
        }
      } catch (e) {
        console.error('[voz] sinal', e);
      }
    };

    const onJoined = ({ socketId, user, state }) => {
      if (!localStream.current) return;
      createPeer(socketId);
      updatePeer(socketId, (p) => ({ ...p, user, state }));
    };
    const onLeft = ({ socketId }) => removePeer(socketId);
    const onState = ({ socketId, state }) => updatePeer(socketId, (p) => ({ ...p, state }));

    socket.on('voice:signal', onSignal);
    socket.on('voice:peer-joined', onJoined);
    socket.on('voice:peer-left', onLeft);
    socket.on('voice:peer-state', onState);
    return () => {
      socket.off('voice:signal', onSignal);
      socket.off('voice:peer-joined', onJoined);
      socket.off('voice:peer-left', onLeft);
      socket.off('voice:peer-state', onState);
    };
  }, [socket, createPeer]);

  // ---- Ações ----
  const leave = useCallback(() => {
    pcs.current.forEach(({ pc }) => pc.close());
    pcs.current.clear();
    localStream.current?.getTracks().forEach((t) => t.stop());
    screenStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    screenStream.current = null;
    socket?.emit('voice:leave');
    meRef.current = initialMe;
    setMeState(initialMe);
    setPeers({});
    setChannel(null);
    setJoinedAt(null);
    setNotice('');
  }, [socket]);

  const join = async (ch) => {
    if (channel?.id === ch.id) return;
    if (channel) leave();
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      setNotice('');
    } catch {
      stream = new MediaStream();
      setNotice('Microfone não disponível ou bloqueado — você entrou só para ouvir e assistir.');
    }
    localStream.current = stream;
    meRef.current = { ...initialMe, muted: stream.getAudioTracks().length === 0 };
    setMeState(meRef.current);
    setChannel(ch);
    setJoinedAt(Date.now());
    socket.emit('voice:join', { channelId: ch.id, serverId: ch.serverId, state: meRef.current }, ({ peers: list }) => {
      list.forEach(({ socketId, user, state }) => {
        createPeer(socketId);
        updatePeer(socketId, (p) => ({ ...p, user, state }));
      });
    });
  };

  const toggleMute = () => {
    const track = localStream.current?.getAudioTracks()[0];
    if (!track) return setNotice('Nenhum microfone disponível.');
    track.enabled = meRef.current.muted;
    setMe({ muted: !meRef.current.muted });
  };

  const toggleDeafen = () => {
    const deafened = !meRef.current.deafened;
    const track = localStream.current?.getAudioTracks()[0];
    if (track) track.enabled = !deafened && !meRef.current.muted;
    setMe({ deafened, muted: deafened ? true : meRef.current.muted });
  };

  const toggleCamera = async () => {
    if (!localStream.current) return;
    if (meRef.current.camera) {
      localStream.current.getVideoTracks().forEach((t) => {
        t.stop();
        localStream.current.removeTrack(t);
      });
      pcs.current.forEach((e) => {
        if (e.senders.camera) e.pc.removeTrack(e.senders.camera);
        delete e.senders.camera;
      });
      setMe({ camera: false });
      return;
    }
    try {
      const cam = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360 } });
      const track = cam.getVideoTracks()[0];
      localStream.current.addTrack(track);
      pcs.current.forEach((e) => (e.senders.camera = e.pc.addTrack(track, localStream.current)));
      setMe({ camera: true });
    } catch {
      setNotice('Não foi possível acessar a câmera.');
    }
  };

  const stopScreen = () => {
    if (!screenStream.current) return;
    screenStream.current.getTracks().forEach((t) => t.stop());
    pcs.current.forEach((e) => {
      Object.keys(e.senders)
        .filter((k) => k.startsWith('screen'))
        .forEach((k) => {
          e.pc.removeTrack(e.senders[k]);
          delete e.senders[k];
        });
    });
    screenStream.current = null;
    setMe({ screen: false, screenStreamId: null });
  };

  const toggleScreen = async () => {
    if (meRef.current.screen) return stopScreen();
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 }, audio: true });
      screenStream.current = display;
      display.getVideoTracks()[0].onended = stopScreen;
      pcs.current.forEach((e) =>
        display.getTracks().forEach((t, i) => (e.senders[`screen${i}`] = e.pc.addTrack(t, display)))
      );
      setMe({ screen: true, screenStreamId: display.id });
    } catch {
    }
  };

  useEffect(() => () => leave(), [leave]);

  return {
    channel,
    joinedAt,
    peers,
    me,
    notice,
    localStream: localStream.current,
    screenStream: screenStream.current,
    join,
    leave,
    toggleMute,
    toggleDeafen,
    toggleCamera,
    toggleScreen,
  };
}

// Detecção de fala
let audioCtx;
export function useSpeaking(stream, enabled = true) {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    if (!stream || !enabled || stream.getAudioTracks().length === 0) return setSpeaking(false);
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    let src;
    try {
      src = audioCtx.createMediaStreamSource(stream);
    } catch {
      return;
    }
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const id = setInterval(() => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setSpeaking(avg > 12);
    }, 150);
    return () => {
      clearInterval(id);
      src.disconnect();
    };
  }, [stream, enabled, stream?.getAudioTracks().length]);
  return speaking;
}
