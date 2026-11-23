import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Botão de login com Google
export default function GoogleButton({ onDone, onError }) {
  const ref = useRef(null);
  const { loginWithGoogle } = useAuth();

  useEffect(() => {
    if (!CLIENT_ID) return;
    const render = () => {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          try {
            await loginWithGoogle(credential);
            onDone?.();
          } catch (e) {
            onError?.(e.message);
          }
        },
      });
      window.google.accounts.id.renderButton(ref.current, { theme: 'filled_black', size: 'large', width: 320, text: 'continue_with' });
    };
    if (window.google?.accounts) return render();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = render;
    document.body.appendChild(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!CLIENT_ID)
    return <p className="muted small center">Login com Google: configure <code>VITE_GOOGLE_CLIENT_ID</code></p>;
  return (
    <>
      <div className="divider"><span>ou</span></div>
      <div ref={ref} className="center" />
    </>
  );
}
