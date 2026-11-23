// Ícones SVG (baseados no Lucide, licença ISC)
const P = {
  play: [['polygon', { points: '6 3 20 12 6 21 6 3' }]],
  left: [['path', { d: 'm15 18-6-6 6-6' }]],
  right: [['path', { d: 'm9 18 6-6-6-6' }]],
  x: [['path', { d: 'M18 6 6 18' }], ['path', { d: 'm6 6 12 12' }]],
  menu: [['path', { d: 'M4 6h16' }], ['path', { d: 'M4 12h16' }], ['path', { d: 'M4 18h16' }]],
  star: [['polygon', { points: '12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' }]],
  message: [['path', { d: 'M7.9 20A9 9 0 1 0 4 16.1L2 22Z' }]],
  thumbsUp: [['path', { d: 'M7 10v12' }], ['path', { d: 'M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z' }]],
  heart: [['path', { d: 'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z' }]],
  mic: [['path', { d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z' }], ['path', { d: 'M19 10v2a7 7 0 0 1-14 0v-2' }], ['path', { d: 'M12 19v3' }]],
  micOff: [['path', { d: 'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z' }], ['path', { d: 'M19 10v2a7 7 0 0 1-14 0v-2' }], ['path', { d: 'M12 19v3' }], ['path', { d: 'm2 2 20 20' }]],
  headphones: [['path', { d: 'M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3' }]],
  headphonesOff: [['path', { d: 'M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3' }], ['path', { d: 'm2 2 20 20' }]],
  video: [['path', { d: 'm16 13 5.22 3.48a.5.5 0 0 0 .78-.42V7.87a.5.5 0 0 0-.75-.43L16 10.5' }], ['rect', { x: 2, y: 6, width: 14, height: 12, rx: 2 }]],
  monitor: [['rect', { x: 2, y: 3, width: 20, height: 14, rx: 2 }], ['path', { d: 'M8 21h8' }], ['path', { d: 'M12 17v4' }]],
  power: [['path', { d: 'M12 2v10' }], ['path', { d: 'M18.4 6.6a9 9 0 1 1-12.77.04' }]],
  send: [['path', { d: 'M14.54 21.69a.5.5 0 0 0 .94-.03l6.5-19a.5.5 0 0 0-.64-.63l-19 6.5a.5.5 0 0 0-.02.93l7.93 3.18a2 2 0 0 1 1.11 1.11z' }], ['path', { d: 'm21.85 2.15-10.94 10.94' }]],
  search: [['circle', { cx: 11, cy: 11, r: 8 }], ['path', { d: 'm21 21-4.35-4.35' }]],
  compass: [['circle', { cx: 12, cy: 12, r: 10 }], ['polygon', { points: '16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76' }]],
  users: [['path', { d: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' }], ['circle', { cx: 9, cy: 7, r: 4 }], ['path', { d: 'M22 21v-2a4 4 0 0 0-3-3.87' }], ['path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' }]],
  shield: [['path', { d: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z' }]],
  check: [['path', { d: 'M20 6 9 17l-5-5' }]],
  refresh: [['path', { d: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8' }], ['path', { d: 'M21 3v5h-5' }], ['path', { d: 'M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16' }], ['path', { d: 'M8 16H3v5' }]],
  clock: [['circle', { cx: 12, cy: 12, r: 10 }], ['path', { d: 'M12 6v6l4 2' }]],
  alert: [['path', { d: 'm21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3' }], ['path', { d: 'M12 9v4' }], ['path', { d: 'M12 17h.01' }]],
  external: [['path', { d: 'M15 3h6v6' }], ['path', { d: 'M10 14 21 3' }], ['path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }]],
  plus: [['path', { d: 'M5 12h14' }], ['path', { d: 'M12 5v14' }]],
  gamepad: [['path', { d: 'M6 12h4' }], ['path', { d: 'M8 10v4' }], ['path', { d: 'M15 13h.01' }], ['path', { d: 'M18 11h.01' }], ['rect', { x: 2, y: 6, width: 20, height: 12, rx: 2 }]],
  book: [['path', { d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' }], ['path', { d: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' }]],
  pencil: [['path', { d: 'M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z' }]],
  trophy: [['path', { d: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6' }], ['path', { d: 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18' }], ['path', { d: 'M4 22h16' }], ['path', { d: 'M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22' }], ['path', { d: 'M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22' }], ['path', { d: 'M18 2H6v7a6 6 0 0 0 12 0V2Z' }]],
  ticket: [['path', { d: 'M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z' }], ['path', { d: 'M13 5v2' }], ['path', { d: 'M13 17v2' }], ['path', { d: 'M13 11v2' }]],
  hash: [['path', { d: 'M4 9h16' }], ['path', { d: 'M4 15h16' }], ['path', { d: 'M10 3 8 21' }], ['path', { d: 'M16 3l-2 18' }]],
};

export default function Icon({ name, size = 18, fill = false, className = '', strokeWidth = 2, title }) {
  const shapes = P[name];
  if (!shapes) return null;
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {shapes.map(([Tag, props], i) => <Tag key={i} {...props} />)}
    </svg>
  );
}
