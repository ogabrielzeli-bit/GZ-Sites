/**
 * Ícones inline (SVG, estilo linha 24x24, derivados de formas simples — sem dependência externa).
 * Uso: icon('phone') → string SVG. Ícones desconhecidos caem em 'spark'.
 */
const PATHS: Record<string, string> = {
  arrow: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  'arrow-up-right': '<path d="M7 17L17 7M8 7h9v9"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 5-5"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  phone:
    '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  whatsapp:
    '<path d="M3.5 20.5l1.2-4.1A8.5 8.5 0 1 1 7.9 19.5z"/><path d="M9.2 8.6c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.4l.8 1.9c.1.2 0 .4-.1.6l-.5.6c-.1.2-.2.3 0 .6a7 7 0 0 0 3.2 2.9c.3.1.4.1.6-.1l.7-.8c.2-.2.4-.2.6-.1l1.8.9c.3.1.4.2.4.4a2.4 2.4 0 0 1-.9 1.9c-.5.4-1.3.6-2.1.4a9.6 9.6 0 0 1-5.9-5.1c-.5-1.2-.3-2.4.4-3.4z" fill="currentColor" stroke="none"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>',
  'star-filled':
    '<path fill="currentColor" stroke="none" d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14L7 21l5-2 5 2-1.5-7"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  tool: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4z"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-2.4z"/>',
  hammer: '<path d="M14 4l6 6-2 2-6-6zM12 6L4 14l2 2 8-8M4 20l4-4"/>',
  ruler: '<path d="M3 17L17 3l4 4L7 21zM8 16l2 2M11 13l2 2M14 10l2 2M17 7l2 2"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  building:
    '<rect x="4" y="3" width="16" height="18"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/>',
  car: '<path d="M5 13l1.5-5h11L19 13M4 13h16v5H4zM7 18v2M17 18v2"/><circle cx="8" cy="15.5" r="1"/><circle cx="16" cy="15.5" r="1"/>',
  gauge: '<path d="M4 15a8 8 0 1 1 16 0"/><path d="M12 15l4-5"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  stethoscope: '<path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v3a4 4 0 0 0 8 0v-2"/><circle cx="18" cy="12" r="2"/>',
  activity: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  scale: '<path d="M12 3v18M4 7h16M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z"/>',
  briefcase:
    '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18"/>',
  users:
    '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  'chef-hat':
    '<path d="M7 20h10v-5a5 5 0 0 0 1-9.9A4 4 0 0 0 12 3a4 4 0 0 0-6 2.1A5 5 0 0 0 7 15z"/><path d="M7 17h10"/>',
  utensils: '<path d="M6 3v7a2 2 0 0 0 4 0V3M8 10v11M17 3c-2 1-3 4-3 7v11M17 3v18"/>',
  'glass-wine': '<path d="M8 3h8l1 6a5 5 0 0 1-10 0zM12 14v7M8 21h8"/>',
  cake: '<path d="M4 20h16v-6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3zM4 15c2 1.5 4-1.5 6 0s4-1.5 6 0M12 3v4M8 5v2M16 5v2"/>',
  dumbbell: '<path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/>',
  scissors:
    '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.5 15.5M20 20L8.5 8.5"/>',
  sparkles:
    '<path d="M10 4l1.5 4.5L16 10l-4.5 1.5L10 16l-1.5-4.5L4 10l4.5-1.5zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>',
  'shopping-bag': '<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  truck:
    '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  package: '<path d="M12 3l9 4.5v9L12 21l-9-4.5v-9z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
  factory: '<path d="M3 21V10l5 3V10l5 3V10l5 3V5h3v16z"/><path d="M7 17h2M11 17h2M15 17h2"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5M3 17l9 5 9-5"/>',
  'trending-up': '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  'bar-chart': '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  key: '<circle cx="8" cy="14" r="4"/><path d="M11 11l9-9M16 6l3 3M14 8l2 2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v12H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5-8 8"/>',
  map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  'pen-tool':
    '<path d="M12 19l7-7 3 3-7 7zM18 13l-1.5-7.5L2 2l3.5 14.5zM2 2l7.6 7.6"/><circle cx="11" cy="11" r="2"/>',
  'file-text': '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  'message-circle': '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-5A8 8 0 1 1 21 12z"/>',
  instagram:
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z"/>',
  linkedin:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.5M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
  youtube:
    '<path d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z"/><path d="M10 9l5 3-5 3z" fill="currentColor"/>',
  tiktok: '<path d="M14 4h3a4 4 0 0 0 4 4v3a7 7 0 0 1-4-1.2V15a5 5 0 1 1-5-5v3a2 2 0 1 0 2 2z"/>',
  'chevron-down': '<path d="M6 9l6 6 6-6"/>',
  'chevron-left': '<path d="M15 6l-6 6 6 6"/>',
  'chevron-right': '<path d="M9 6l6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  leaf: '<path d="M5 20c0-8 5-14 14-14-1 9-6 14-14 14z"/><path d="M5 20c3-5 6-8 10-10"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  thumbs: '<path d="M7 11v9H3v-9zM7 11l4-8a2 2 0 0 1 2 2v4h5a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 16.8 20H7"/>',
  flag: '<path d="M5 21V4h12l-2 4 2 4H5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  paint: '<path d="M4 4h12v6H4zM16 7h2a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-6v5"/>',
  droplet: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8a2 2 0 1 1-2 2"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  bed: '<path d="M3 18V8h18v10M3 12h18M7 8V6h4v2M3 18v2M21 18v2"/>',
  coffee: '<path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM16 10h2a2 2 0 0 1 0 4h-2M6 3v2M10 3v2"/>',
  diamond: '<path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M10 3l2 6 2-6M6 3l4 6M18 3l-4 6"/>',
  medal: '<circle cx="12" cy="15" r="5"/><path d="M8 11L5 3h5l2 4 2-4h5l-3 8"/>',
  handshake: '<path d="M4 9l4-3 4 3 4-3 4 3M4 9v6l4 3M20 9v6l-4 3M12 6l-3 4 3 3 3-3z"/>',
};

export function icon(name: string, cls = ''): string {
  const d = PATHS[name] ?? PATHS.spark;
  const filled = d.includes('fill="currentColor"') && !d.includes('<path d');
  return `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${
    filled ? 0 : 1.8
  }" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
}

export const ICON_NAMES = Object.keys(PATHS);
export function hasIcon(name: string) {
  return name in PATHS;
}
