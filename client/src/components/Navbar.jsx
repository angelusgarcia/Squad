import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Avatar from './Avatar.jsx';
import Icon from './Icon.jsx';

// Ícone da marca
const BrandIcon = ({ name, size = 22 }) => (
  <img src={`/brand/${name}-96.png`} alt="" width={size} height={size} className="brand-icon" />
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const search = (e) => {
    e.preventDefault();
    navigate(`/jogos?q=${encodeURIComponent(q)}`);
    setOpen(false);
  };

  const links = [
    ['/', 'Início'],
    ['/jogos', 'Jogos'],
    ['/indicacoes', 'Indicações'],
    ['/forum', 'Fórum'],
    ['/guias', 'Guias'],
    ['/para-voce', <><BrandIcon name="recomendado" /> Para você</>],
    ['/comunidade', <><BrandIcon name="comunidade" /> Comunidade</>],
    ...(user?.isAdmin ? [['/equipe/sugestoes', 'Equipe']] : []),
  ];

  return (
    <header className="nav">
      <Link to="/" className="nav__logo">
        <img src="/brand/emblema-96.png" alt="" className="nav__logo-img" />
        <span>Squad</span>
      </Link>

      <button className="nav__burger" onClick={() => setOpen(!open)} aria-label="Menu"><Icon name="menu" size={22} /></button>

      <nav className={`nav__links ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)}>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
            {label}
          </NavLink>
        ))}
      </nav>

      <form className="nav__search" onSubmit={search}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar jogos..." />
      </form>

      <div className="nav__user">
        {user ? (
          <>
            <Link to={`/u/${user.username}`} className="nav__me">
              <Avatar user={user} size={30} />
              <span>{user.username}</span>
            </Link>
            <button className="btn btn--ghost btn--sm" onClick={logout}>Sair</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn--ghost btn--sm">Entrar</Link>
            <Link to="/cadastro" className="btn btn--sm">Criar conta</Link>
          </>
        )}
      </div>
    </header>
  );
}
