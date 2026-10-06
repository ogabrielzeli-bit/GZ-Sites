/** Utilidades de cor (contraste WCAG, luminância) — puras, usadas pelo engine e pelo analisador de assets. */
export function luminanceOf(hexColor: string): number {
  const m = hexColor.replace('#', '');
  if (m.length !== 6) return 0.5;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminanceOf(a), luminanceOf(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
export function saturationOf(hexColor: string): number {
  const m = hexColor.replace('#', '');
  if (m.length !== 6) return 0;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}
export function mix(hexA: string, hexB: string, t: number): string {
  const p = (h: string) => [0, 2, 4].map((i) => parseInt(h.replace('#', '').slice(i, i + 2), 16));
  const a = p(hexA), b = p(hexB);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
