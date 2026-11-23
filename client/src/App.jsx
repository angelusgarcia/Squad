import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import { useAuth } from './context/AuthContext.jsx';

import Home from './pages/Home.jsx';
import Catalog from './pages/Catalog.jsx';
import GameDetail from './pages/GameDetail.jsx';
import Forum from './pages/Forum.jsx';
import TopicPage from './pages/TopicPage.jsx';
import Guides from './pages/Guides.jsx';
import GuidePage from './pages/GuidePage.jsx';
import GuideEditor from './pages/GuideEditor.jsx';
import Profile from './pages/Profile.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Recommendations from './pages/Recommendations.jsx';
import Indications from './pages/Indications.jsx';
import Community from './pages/Community.jsx';
import SuggestGame from './pages/SuggestGame.jsx';
import TeamSuggestions from './pages/TeamSuggestions.jsx';

function Private({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page"><p className="muted">Carregando...</p></div>;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

export default function App() {
  const { pathname } = useLocation();
  const fullscreen = pathname.startsWith('/comunidade');

  return (
    <div className={fullscreen ? 'app app--full' : 'app'}>
      <Navbar />
      <main className={fullscreen ? 'main main--full' : 'main'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jogos" element={<Catalog />} />
          <Route path="/jogos/:slug" element={<GameDetail />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:id" element={<TopicPage />} />
          <Route path="/guias" element={<Guides />} />
          <Route path="/guias/novo" element={<Private><GuideEditor /></Private>} />
          <Route path="/guias/:id" element={<GuidePage />} />
          <Route path="/guias/:id/editar" element={<Private><GuideEditor /></Private>} />
          <Route path="/indicacoes" element={<Indications />} />
          <Route path="/para-voce" element={<Private><Recommendations /></Private>} />
          <Route path="/comunidade/*" element={<Private><Community /></Private>} />
          <Route path="/sugerir" element={<SuggestGame />} />
          <Route path="/equipe/sugestoes" element={<Private><TeamSuggestions /></Private>} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="*" element={<div className="page"><h1>404</h1><p>Página não encontrada.</p></div>} />
        </Routes>
      </main>
    </div>
  );
}
