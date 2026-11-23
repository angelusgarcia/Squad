import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { renderMarkdown } from '../lib/markdown.js';
import GamePicker from '../components/GamePicker.jsx';

const TEMPLATE = `# Título do guia

Uma breve introdução.

## Preparação

- Item 1
- Item 2

## Passo a passo

1. Primeiro passo
2. Segundo passo

> Dica: use **negrito** e *itálico* para destacar.
`;

export default function GuideEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState(TEMPLATE);
  const [game, setGame] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [status, setStatus] = useState('DRAFT');
  const [error, setError] = useState('');
  const [tab, setTab] = useState('write');

  useEffect(() => {
    if (!id) return;
    api(`/guides/${id}`).then((g) => {
      setTitle(g.title);
      setContent(g.content);
      setGame(g.game);
      setGameId(g.game?.id || null);
      setStatus(g.status);
    });
  }, [id]);

  const save = async (publish) => {
    setError('');
    try {
      const body = { title, content, gameId, publish };
      const g = id
        ? await api(`/guides/${id}`, { method: 'PUT', body })
        : await api('/guides', { method: 'POST', body });
      navigate(publish ? `/guias/${g.id}` : `/guias/${g.id}/editar`, { replace: true });
      setStatus(g.status);
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async () => {
    if (!window.confirm('Excluir este guia?')) return;
    await api(`/guides/${id}`, { method: 'DELETE' });
    navigate('/guias');
  };

  return (
    <div className="page">
      <div className="page__head row row--between">
        <h1>{id ? 'Editar guia' : 'Novo guia'} <span className={`tag ${status === 'DRAFT' ? 'tag--warn' : ''}`}>{status === 'DRAFT' ? 'Rascunho' : 'Publicado'}</span></h1>
        <div className="row">
          {id && <button className="btn btn--ghost btn--sm" onClick={remove}>Excluir</button>}
          <button className="btn btn--ghost" onClick={() => save(false)}>Salvar rascunho</button>
          <button className="btn" onClick={() => save(true)}>Publicar</button>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="form">
        <input className="input-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do guia" />
        <GamePicker initial={game} onChange={setGameId} />
      </div>

      <div className="tabs tabs--mobile">
        <button className={tab === 'write' ? 'active' : ''} onClick={() => setTab('write')}>Escrever</button>
        <button className={tab === 'preview' ? 'active' : ''} onClick={() => setTab('preview')}>Pré-visualizar</button>
      </div>

      <div className={`editor editor--${tab}`}>
        <textarea className="editor__input" value={content} onChange={(e) => setContent(e.target.value)} spellCheck={false} />
        <div className="card markdown editor__preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
      </div>
    </div>
  );
}
