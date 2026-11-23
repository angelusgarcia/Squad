import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GoogleButton from '../components/GoogleButton.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const done = () => navigate(location.state?.from || '/', { replace: true });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form.email, form.password);
      done();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page auth">
      <form className="card auth__card" onSubmit={submit}>
        <h1>Entrar</h1>
        <p className="muted">Bem-vindo de volta ao Squad.</p>
        {error && <p className="error">{error}</p>}
        <label>E-mail<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>Senha<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <button className="btn btn--block" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
        <GoogleButton onDone={done} onError={setError} />
        <p className="muted small">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
          <br />Teste: <code>squad@squad.dev</code> / <code>123456</code>
        </p>
      </form>
    </div>
  );
}
