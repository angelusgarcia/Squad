// Banner do squad e troca de squads
import Icon from '../Icon.jsx';
export default function SquadSwitcher({ servers, current, onSelect, onCreate, onExplore }) {
  const joined = servers.filter((s) => s.joined);
  const cover = current?.game?.coverUrl;

  return (
    <div className="switcher">
      <div
        className="squad-banner"
        style={{
          '--c': current?.color || 'var(--primary)',
          backgroundImage: cover ? `url(${cover})` : undefined,
        }}
      >
        <div className="squad-banner__shade" />
        <div className="squad-banner__info">
          <span className="squad-banner__kicker">{current?.game ? current.game.name : 'SQUAD'}</span>
          <h3>{current?.name || 'Escolha um squad'}</h3>
          {current && <span className="squad-banner__meta">{current.members.length} membros</span>}
        </div>
      </div>

      <div className="switcher__row">
        {joined.map((s) => (
          <button
            key={s.id}
            className={`hex ${s.id === current?.id ? 'is-active' : ''}`}
            style={{ '--c': s.color }}
            onClick={() => onSelect(s.id)}
            title={s.name}
          >
            <span>{s.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
          </button>
        ))}
        <button className="hex hex--action" onClick={onCreate} title="Criar squad"><span><Icon name="plus" size={18} /></span></button>
        <button className="hex hex--action" onClick={onExplore} title="Explorar squads"><span><Icon name="compass" size={18} /></span></button>
      </div>
    </div>
  );
}
