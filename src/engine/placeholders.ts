/**
 * Placeholders visuais (SVG) — imagens abstratas, bonitas o suficiente para uma prévia,
 * geradas de forma determinística a partir de um seed. Substituídas por fotos reais no projeto final.
 * Estilos por segmento: 'geometric' | 'organic' | 'grid' | 'diagonal' | 'rings' | 'waves'
 */
import { seededRandom, hashString, escapeHtml } from '@shared/utils';

export type PlaceholderStyle =
  'geometric' | 'organic' | 'grid' | 'diagonal' | 'rings' | 'waves' | 'blueprint';

export interface PlaceholderOptions {
  width: number;
  height: number;
  seed: string;
  palette: string[];
  style?: PlaceholderStyle;
  label?: string;
  /** mostra uma etiqueta discreta "Foto: ..." para lembrar de trocar */
  showLabel?: boolean;
}

function shade(hex: string, amt: number): string {
  const m = hex.replace('#', '');
  if (m.length !== 6) return hex;
  const n = parseInt(m, 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function placeholderSvg(o: PlaceholderOptions): string {
  const { width: w, height: h } = o;
  const rnd = seededRandom(hashString(o.seed));
  const pal = o.palette.length >= 2 ? o.palette : ['#222', '#444', '#888', '#ccc'];
  const [c0, c1, c2, c3] = [pal[0], pal[1] ?? pal[0], pal[2] ?? pal[1], pal[3] ?? pal[0]];
  const style = o.style ?? 'geometric';
  const id = `g${hashString(o.seed).toString(36)}`;
  const parts: string[] = [];
  parts.push(`<defs>
<linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(c0, 10)}"/><stop offset="1" stop-color="${shade(c1, -10)}"/></linearGradient>
<radialGradient id="${id}-glow" cx="${(0.2 + rnd() * 0.6).toFixed(2)}" cy="${(0.2 + rnd() * 0.6).toFixed(2)}" r="0.8"><stop offset="0" stop-color="${c2}" stop-opacity="0.55"/><stop offset="1" stop-color="${c2}" stop-opacity="0"/></radialGradient>
<filter id="${id}-noise"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0"/></filter>
</defs>`);
  parts.push(`<rect width="${w}" height="${h}" fill="url(#${id}-bg)"/>`);
  parts.push(`<rect width="${w}" height="${h}" fill="url(#${id}-glow)"/>`);

  const n = 4 + Math.floor(rnd() * 5);
  switch (style) {
    case 'geometric': {
      for (let i = 0; i < n; i++) {
        const size = (0.25 + rnd() * 0.5) * Math.min(w, h);
        const x = rnd() * w - size / 4;
        const y = rnd() * h - size / 4;
        const col = [c2, c3, shade(c1, 30)][i % 3];
        const op = (0.12 + rnd() * 0.3).toFixed(2);
        if (rnd() > 0.5)
          parts.push(
            `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${size.toFixed(0)}" height="${(size * (0.6 + rnd() * 0.8)).toFixed(0)}" fill="${col}" opacity="${op}" transform="rotate(${(rnd() * 30 - 15).toFixed(0)} ${(x + size / 2).toFixed(0)} ${(y + size / 2).toFixed(0)})"/>`,
          );
        else
          parts.push(
            `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(size / 2).toFixed(0)}" fill="${col}" opacity="${op}"/>`,
          );
      }
      break;
    }
    case 'organic': {
      for (let i = 0; i < n; i++) {
        const cx = rnd() * w,
          cy = rnd() * h,
          r = (0.2 + rnd() * 0.45) * Math.min(w, h);
        const pts: string[] = [];
        const k = 7;
        for (let j = 0; j < k; j++) {
          const a = (j / k) * Math.PI * 2;
          const rr = r * (0.7 + rnd() * 0.5);
          pts.push(`${(cx + Math.cos(a) * rr).toFixed(0)},${(cy + Math.sin(a) * rr).toFixed(0)}`);
        }
        parts.push(
          `<polygon points="${pts.join(' ')}" fill="${[c2, c3, shade(c1, 40)][i % 3]}" opacity="${(0.1 + rnd() * 0.3).toFixed(2)}" style="filter:blur(${(rnd() * 40).toFixed(0)}px)"/>`,
        );
      }
      break;
    }
    case 'grid': {
      const step = Math.max(40, Math.min(w, h) / 8);
      for (let x = 0; x < w; x += step)
        parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${c3}" stroke-opacity="0.18"/>`);
      for (let y = 0; y < h; y += step)
        parts.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${c3}" stroke-opacity="0.18"/>`);
      for (let i = 0; i < n; i++) {
        const gx = Math.floor(rnd() * (w / step)) * step,
          gy = Math.floor(rnd() * (h / step)) * step;
        const gw = step * (1 + Math.floor(rnd() * 3)),
          gh = step * (1 + Math.floor(rnd() * 3));
        parts.push(
          `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" fill="${[c2, c3][i % 2]}" opacity="${(0.15 + rnd() * 0.35).toFixed(2)}"/>`,
        );
      }
      break;
    }
    case 'diagonal': {
      for (let i = 0; i < n + 3; i++) {
        const x = rnd() * w * 1.4 - w * 0.2;
        const wid = 20 + rnd() * 160;
        parts.push(
          `<polygon points="${x.toFixed(0)},${h} ${(x + wid).toFixed(0)},${h} ${(x + wid + h * 0.6).toFixed(0)},0 ${(x + h * 0.6).toFixed(0)},0" fill="${[c2, c3, shade(c1, 35)][i % 3]}" opacity="${(0.08 + rnd() * 0.3).toFixed(2)}"/>`,
        );
      }
      break;
    }
    case 'rings': {
      const cx = w * (0.3 + rnd() * 0.4),
        cy = h * (0.3 + rnd() * 0.4);
      for (let i = 1; i <= n + 2; i++) {
        parts.push(
          `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${(i * Math.min(w, h) * 0.11).toFixed(0)}" fill="none" stroke="${i % 2 ? c2 : c3}" stroke-opacity="${(0.1 + rnd() * 0.3).toFixed(2)}" stroke-width="${(1 + rnd() * 3).toFixed(1)}"/>`,
        );
      }
      break;
    }
    case 'waves': {
      for (let i = 0; i < n; i++) {
        const y0 = h * (0.3 + (i / n) * 0.8);
        const amp = 20 + rnd() * 80;
        let d = `M0 ${y0.toFixed(0)}`;
        for (let x = 0; x <= w; x += w / 6)
          d += ` Q ${(x + w / 12).toFixed(0)} ${(y0 + (rnd() > 0.5 ? amp : -amp)).toFixed(0)} ${(x + w / 6).toFixed(0)} ${y0.toFixed(0)}`;
        d += ` L ${w} ${h} L 0 ${h} Z`;
        parts.push(
          `<path d="${d}" fill="${[c2, c3, shade(c1, 30)][i % 3]}" opacity="${(0.1 + rnd() * 0.25).toFixed(2)}"/>`,
        );
      }
      break;
    }
    case 'blueprint': {
      const step = Math.max(24, Math.min(w, h) / 14);
      for (let x = 0; x < w; x += step)
        parts.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${c3}" stroke-opacity="0.12"/>`);
      for (let y = 0; y < h; y += step)
        parts.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${c3}" stroke-opacity="0.12"/>`);
      for (let i = 0; i < n; i++) {
        const x = rnd() * w * 0.7,
          y = rnd() * h * 0.7,
          rw = step * (2 + Math.floor(rnd() * 6)),
          rh = step * (2 + Math.floor(rnd() * 5));
        parts.push(
          `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${rw}" height="${rh}" fill="none" stroke="${c2}" stroke-opacity="0.7" stroke-width="1.5"/>`,
        );
        parts.push(
          `<line x1="${x.toFixed(0)}" y1="${(y - step / 2).toFixed(0)}" x2="${(x + rw).toFixed(0)}" y2="${(y - step / 2).toFixed(0)}" stroke="${c2}" stroke-opacity="0.5"/>`,
        );
      }
      break;
    }
  }
  parts.push(`<rect width="${w}" height="${h}" filter="url(#${id}-noise)" opacity="0.6"/>`);
  if (o.showLabel && o.label) {
    const fs = Math.max(12, Math.min(w, h) * 0.035);
    parts.push(
      `<g opacity="0.75"><rect x="${(w * 0.04).toFixed(0)}" y="${(h - fs * 2.6).toFixed(0)}" rx="${(fs * 0.4).toFixed(0)}" width="${(o.label.length * fs * 0.62 + fs * 1.4).toFixed(0)}" height="${(fs * 1.8).toFixed(0)}" fill="#000" fill-opacity="0.55"/><text x="${(w * 0.04 + fs * 0.7).toFixed(0)}" y="${(h - fs * 1.4).toFixed(0)}" font-family="Inter,system-ui,sans-serif" font-size="${fs.toFixed(0)}" fill="#fff">${escapeHtml(o.label)}</text></g>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escapeHtml(o.label ?? 'Imagem ilustrativa')}">${parts.join('')}</svg>`;
}

/** Converte um SVG em data URI compacto (para inline em prévias pequenas) */
export function svgToDataUri(svg: string): string {
  return (
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(svg)
      .replace(/%20/g, ' ')
      .replace(/%3D/g, '=')
      .replace(/%3A/g, ':')
      .replace(/%2F/g, '/')
  );
}
