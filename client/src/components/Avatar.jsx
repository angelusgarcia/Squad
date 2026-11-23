// Avatar com foto ou iniciais
export function colorFor(text = '') {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h} 65% 55%)`;
}

export default function Avatar({ user, size = 36, speaking = false }) {
  const style = { width: size, height: size, fontSize: size * 0.42 };
  const cls = `avatar ${speaking ? 'avatar--speaking' : ''}`;
  if (user?.avatarUrl) return <img className={cls} style={style} src={user.avatarUrl} alt={user.username} />;
  return (
    <span className={cls} style={{ ...style, background: colorFor(user?.username) }}>
      {(user?.username || '?').slice(0, 2).toUpperCase()}
    </span>
  );
}
