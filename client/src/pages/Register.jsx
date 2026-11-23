import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GoogleButton from '../components/GoogleButton.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="page auth">
      <form className="card auth__card" onSubmit={submit}>
        <h1>Criar conta</h1>
        <p className="muted">Seu perfil é criado automaticamente.</p>
        {error && <p className="error">{error}</p>}
        <label>Nome de usuário<input required value={form.username} onChange={set('username')} placeholder="ex: seu_nick" /></label>
        <label>E-mail<input type="email" required value={form.email} onChange={set('email')} /></label>
        <label>Senha<input type="password" required minLength={6} value={form.password} onChange={set('password')} /></label>
        <button className="btn btn--block" disabled={busy}>{busy ? 'Criando...' : 'Criar conta'}</button>
        <GoogleButton onDone={() => navigate('/')} onError={setError} />
        <p className="muted small">Já tem conta? <Link to="/login">Entrar</Link></p>
      </form>
    </div>
  );
}
