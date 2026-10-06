/**
 * Regras determinísticas de pontuação (0–100 por categoria) e oportunidades de venda.
 * Sem IA: cada regra é explicável e ajustável.
 */
import type {
  AuditCategory,
  AuditFinding,
  AuditOpportunity,
  AuditReport,
  AuditScores,
} from '@shared/schemas';
import { clamp } from '@shared/utils';

type Partial = Omit<AuditReport, 'findings' | 'scores' | 'opportunities'>;

interface Rule {
  id: string;
  category: AuditCategory;
  /** retorna null se a regra não se aplica; penalty em pontos (0 = pass) */
  check: (r: Partial) => {
    status: AuditFinding['status'];
    penalty: number;
    title: string;
    detail?: string;
    value?: AuditFinding['value'];
    opportunity?: { title: string; detail: string; severity: AuditOpportunity['severity'] };
  } | null;
}

const kb = (n: number) => `${Math.round(n / 1024)} KB`;
const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

const RULES: Rule[] = [
  // ---------------- SEGURANÇA ----------------
  {
    id: 'https',
    category: 'security',
    check: (r) =>
      r.https
        ? { status: 'pass', penalty: 0, title: 'Site usa HTTPS' }
        : {
            status: 'fail',
            penalty: 45,
            title: 'Site sem HTTPS',
            detail: 'O navegador marca o site como "não seguro". Isso afasta clientes e prejudica o Google.',
            opportunity: {
              title: 'Site sem HTTPS (marcado como não seguro)',
              detail:
                'Certificado SSL é gratuito e obrigatório hoje. O site atual aparece como "Não seguro" no navegador.',
              severity: 'high',
            },
          },
  },
  {
    id: 'hsts',
    category: 'security',
    check: (r) =>
      !r.https
        ? null
        : r.security.hsts
          ? { status: 'pass', penalty: 0, title: 'HSTS configurado' }
          : {
              status: 'warn',
              penalty: 8,
              title: 'Sem Strict-Transport-Security',
              detail: 'Header que força HTTPS em todas as visitas.',
            },
  },
  {
    id: 'csp',
    category: 'security',
    check: (r) =>
      r.security.csp
        ? { status: 'pass', penalty: 0, title: 'Content-Security-Policy presente' }
        : {
            status: 'warn',
            penalty: 10,
            title: 'Sem Content-Security-Policy',
            detail: 'Reduz risco de scripts maliciosos injetados.',
          },
  },
  {
    id: 'xfo',
    category: 'security',
    check: (r) =>
      r.security.xFrameOptions
        ? { status: 'pass', penalty: 0, title: 'Proteção contra clickjacking' }
        : {
            status: 'warn',
            penalty: 8,
            title: 'Sem X-Frame-Options / frame-ancestors',
            detail: 'O site pode ser embutido em iframes de terceiros.',
          },
  },
  {
    id: 'xcto',
    category: 'security',
    check: (r) =>
      r.security.xContentTypeOptions
        ? { status: 'pass', penalty: 0, title: 'X-Content-Type-Options: nosniff' }
        : { status: 'warn', penalty: 5, title: 'Sem X-Content-Type-Options' },
  },
  {
    id: 'referrer',
    category: 'security',
    check: (r) =>
      r.security.referrerPolicy
        ? { status: 'pass', penalty: 0, title: 'Referrer-Policy definido' }
        : { status: 'warn', penalty: 4, title: 'Sem Referrer-Policy' },
  },
  {
    id: 'permissions',
    category: 'security',
    check: (r) =>
      r.security.permissionsPolicy
        ? { status: 'pass', penalty: 0, title: 'Permissions-Policy definido' }
        : { status: 'info', penalty: 2, title: 'Sem Permissions-Policy' },
  },
  {
    id: 'mixed',
    category: 'security',
    check: (r) =>
      r.network.mixedContent.length
        ? {
            status: 'fail',
            penalty: 20,
            title: `${r.network.mixedContent.length} recurso(s) em HTTP (conteúdo misto)`,
            detail: r.network.mixedContent.slice(0, 3).join(', '),
            opportunity: {
              title: 'Conteúdo misto (HTTP dentro de HTTPS)',
              detail: 'Imagens/scripts carregados sem segurança geram alertas no navegador.',
              severity: 'medium',
            },
          }
        : { status: 'pass', penalty: 0, title: 'Sem conteúdo misto' },
  },
  {
    id: 'secrets',
    category: 'security',
    check: (r) =>
      r.security.exposedSecrets.length
        ? {
            status: 'fail',
            penalty: 30,
            title: 'Possíveis credenciais expostas no HTML',
            detail: r.security.exposedSecrets.join(', '),
            opportunity: {
              title: 'Informações sensíveis expostas no código',
              detail: `Padrões detectados: ${r.security.exposedSecrets.join(', ')}.`,
              severity: 'high',
            },
          }
        : { status: 'pass', penalty: 0, title: 'Nenhuma credencial exposta detectada' },
  },
  {
    id: 'server-header',
    category: 'security',
    check: (r) =>
      r.security.poweredBy || (r.security.serverHeader && /\d+\.\d+/.test(r.security.serverHeader))
        ? {
            status: 'info',
            penalty: 3,
            title: 'Servidor expõe versão/tecnologia',
            detail: [r.security.serverHeader, r.security.poweredBy].filter(Boolean).join(' · '),
          }
        : null,
  },
  {
    id: 'console',
    category: 'security',
    check: (r) =>
      r.console.errors.length
        ? {
            status: 'warn',
            penalty: Math.min(10, r.console.errors.length * 3),
            title: `${r.console.errors.length} erro(s) no console`,
            detail: r.console.errors[0],
          }
        : { status: 'pass', penalty: 0, title: 'Sem erros no console' },
  },

  // ---------------- SEO ----------------
  {
    id: 'title',
    category: 'seo',
    check: (r) =>
      !r.page.title
        ? {
            status: 'fail',
            penalty: 20,
            title: 'Página sem <title>',
            opportunity: {
              title: 'Página sem título (SEO)',
              detail: 'O título é o texto principal no Google. Sem ele, o site mal aparece.',
              severity: 'high',
            },
          }
        : r.page.title.length < 15 || r.page.title.length > 65
          ? {
              status: 'warn',
              penalty: 6,
              title: `Título com ${r.page.title.length} caracteres`,
              detail: `"${r.page.title}" — ideal entre 30 e 60.`,
              value: r.page.title,
            }
          : { status: 'pass', penalty: 0, title: 'Título adequado', value: r.page.title },
  },
  {
    id: 'description',
    category: 'seo',
    check: (r) =>
      !r.page.description
        ? {
            status: 'fail',
            penalty: 14,
            title: 'Sem meta description',
            opportunity: {
              title: 'Sem descrição para o Google',
              detail: 'A meta description é o texto que aparece abaixo do título nos resultados de busca.',
              severity: 'medium',
            },
          }
        : r.page.description.length < 50 || r.page.description.length > 165
          ? {
              status: 'warn',
              penalty: 4,
              title: `Meta description com ${r.page.description.length} caracteres`,
              detail: 'Ideal entre 70 e 160.',
            }
          : { status: 'pass', penalty: 0, title: 'Meta description adequada' },
  },
  {
    id: 'h1',
    category: 'seo',
    check: (r) =>
      r.page.h1.length === 0
        ? {
            status: 'fail',
            penalty: 12,
            title: 'Sem H1',
            detail: 'Toda página precisa de um título principal (H1).',
          }
        : r.page.h1.length > 1
          ? {
              status: 'warn',
              penalty: 4,
              title: `${r.page.h1.length} H1 na página`,
              detail: 'O ideal é um único H1.',
            }
          : { status: 'pass', penalty: 0, title: 'H1 único', value: r.page.h1[0] },
  },
  {
    id: 'headings',
    category: 'seo',
    check: (r) =>
      r.page.headings.length < 3
        ? {
            status: 'warn',
            penalty: 5,
            title: 'Poucos títulos (h1–h3)',
            detail: 'Estrutura de headings ajuda Google e leitura.',
          }
        : { status: 'pass', penalty: 0, title: `${r.page.headings.length} headings` },
  },
  {
    id: 'canonical',
    category: 'seo',
    check: (r) =>
      r.page.canonical
        ? { status: 'pass', penalty: 0, title: 'Canonical definido' }
        : { status: 'warn', penalty: 5, title: 'Sem link canonical' },
  },
  {
    id: 'og',
    category: 'seo',
    check: (r) =>
      Object.keys(r.page.openGraph).length >= 3
        ? { status: 'pass', penalty: 0, title: 'Open Graph configurado' }
        : {
            status: 'warn',
            penalty: 8,
            title: 'Open Graph incompleto',
            detail: 'Sem OG, o link fica feio ao ser compartilhado no WhatsApp/Instagram.',
            opportunity: {
              title: 'Link sem prévia bonita no WhatsApp',
              detail: 'Faltam as tags Open Graph: ao compartilhar o site, não aparece imagem nem descrição.',
              severity: 'medium',
            },
          },
  },
  {
    id: 'sitemap',
    category: 'seo',
    check: (r) =>
      r.seoFiles.sitemap
        ? { status: 'pass', penalty: 0, title: 'sitemap.xml encontrado' }
        : { status: 'warn', penalty: 6, title: 'Sem sitemap.xml' },
  },
  {
    id: 'robots',
    category: 'seo',
    check: (r) =>
      r.seoFiles.robotsBlocksAll
        ? {
            status: 'fail',
            penalty: 25,
            title: 'robots.txt bloqueia o Google inteiro',
            opportunity: {
              title: 'Site bloqueado para o Google',
              detail: 'O robots.txt está com Disallow: / — o site não é indexado.',
              severity: 'high',
            },
          }
        : r.seoFiles.robots
          ? { status: 'pass', penalty: 0, title: 'robots.txt encontrado' }
          : { status: 'info', penalty: 2, title: 'Sem robots.txt' },
  },
  {
    id: 'alt',
    category: 'seo',
    check: (r) =>
      r.page.imagesTotal === 0
        ? null
        : r.page.imagesWithoutAlt > 0
          ? {
              status: r.page.imagesWithoutAlt / r.page.imagesTotal > 0.4 ? 'fail' : 'warn',
              penalty: Math.min(10, Math.round((r.page.imagesWithoutAlt / r.page.imagesTotal) * 12)),
              title: `${r.page.imagesWithoutAlt} de ${r.page.imagesTotal} imagens sem alt`,
              detail: 'Alt text ajuda acessibilidade e SEO de imagens.',
            }
          : { status: 'pass', penalty: 0, title: 'Todas as imagens têm alt' },
  },
  {
    id: 'ld',
    category: 'seo',
    check: (r) =>
      r.page.structuredData.length
        ? { status: 'pass', penalty: 0, title: `Dados estruturados: ${r.page.structuredData.join(', ')}` }
        : {
            status: 'warn',
            penalty: 6,
            title: 'Sem dados estruturados (schema.org)',
            detail: 'LocalBusiness ajuda a aparecer no Google com endereço, telefone e horários.',
            opportunity: {
              title: 'SEO local incompleto',
              detail:
                'Sem schema LocalBusiness, sem sitemap ou sem descrição: o site perde buscas locais como "[segmento] perto de mim".',
              severity: 'medium',
            },
          },
  },
  {
    id: 'favicon',
    category: 'seo',
    check: (r) =>
      r.page.favicon
        ? { status: 'pass', penalty: 0, title: 'Favicon presente' }
        : { status: 'warn', penalty: 3, title: 'Sem favicon' },
  },
  {
    id: 'viewport',
    category: 'seo',
    check: (r) =>
      r.page.viewport
        ? { status: 'pass', penalty: 0, title: 'Meta viewport presente' }
        : { status: 'fail', penalty: 10, title: 'Sem meta viewport' },
  },
  {
    id: 'lang',
    category: 'seo',
    check: (r) =>
      r.page.lang
        ? { status: 'pass', penalty: 0, title: `Idioma declarado (${r.page.lang})` }
        : { status: 'warn', penalty: 3, title: 'Sem atributo lang no <html>' },
  },
  {
    id: 'lh-seo',
    category: 'seo',
    check: (r) =>
      r.lighthouse.ran && r.lighthouse.seo != null
        ? {
            status: r.lighthouse.seo >= 90 ? 'pass' : r.lighthouse.seo >= 70 ? 'warn' : 'fail',
            penalty: Math.round((100 - r.lighthouse.seo) * 0.25),
            title: `Lighthouse SEO: ${r.lighthouse.seo}`,
          }
        : null,
  },

  // ---------------- PERFORMANCE ----------------
  {
    id: 'lh-perf',
    category: 'performance',
    check: (r) =>
      r.lighthouse.ran && r.lighthouse.performance != null
        ? {
            status:
              r.lighthouse.performance >= 80 ? 'pass' : r.lighthouse.performance >= 50 ? 'warn' : 'fail',
            penalty: Math.round((100 - r.lighthouse.performance) * 0.55),
            title: `Lighthouse Performance (mobile): ${r.lighthouse.performance}`,
            opportunity:
              r.lighthouse.performance < 50
                ? {
                    title: 'Performance mobile ruim',
                    detail: `Nota ${r.lighthouse.performance}/100 no Lighthouse. Site lento no celular perde visitantes antes de carregar.`,
                    severity: 'high',
                  }
                : undefined,
          }
        : null,
  },
  {
    id: 'lcp',
    category: 'performance',
    check: (r) =>
      r.lighthouse.lcp == null
        ? null
        : r.lighthouse.lcp <= 2500
          ? { status: 'pass', penalty: 0, title: `LCP ${(r.lighthouse.lcp / 1000).toFixed(1)}s` }
          : r.lighthouse.lcp <= 4000
            ? {
                status: 'warn',
                penalty: 6,
                title: `LCP ${(r.lighthouse.lcp / 1000).toFixed(1)}s (ideal ≤ 2,5s)`,
              }
            : {
                status: 'fail',
                penalty: 12,
                title: `LCP ${(r.lighthouse.lcp / 1000).toFixed(1)}s — muito lento`,
              },
  },
  {
    id: 'cls',
    category: 'performance',
    check: (r) =>
      r.lighthouse.cls == null
        ? null
        : r.lighthouse.cls <= 0.1
          ? { status: 'pass', penalty: 0, title: `CLS ${r.lighthouse.cls.toFixed(2)}` }
          : r.lighthouse.cls <= 0.25
            ? { status: 'warn', penalty: 5, title: `CLS ${r.lighthouse.cls.toFixed(2)} (layout pula)` }
            : { status: 'fail', penalty: 10, title: `CLS ${r.lighthouse.cls.toFixed(2)} — layout instável` },
  },
  {
    id: 'tbt',
    category: 'performance',
    check: (r) =>
      r.lighthouse.tbt == null
        ? null
        : r.lighthouse.tbt <= 200
          ? { status: 'pass', penalty: 0, title: `TBT ${Math.round(r.lighthouse.tbt)}ms` }
          : r.lighthouse.tbt <= 600
            ? { status: 'warn', penalty: 5, title: `TBT ${Math.round(r.lighthouse.tbt)}ms (JS bloqueando)` }
            : { status: 'fail', penalty: 10, title: `TBT ${Math.round(r.lighthouse.tbt)}ms — JS excessivo` },
  },
  {
    id: 'weight',
    category: 'performance',
    check: (r) =>
      r.network.transferBytes <= 2_000_000
        ? { status: 'pass', penalty: 0, title: `Peso da página: ${mb(r.network.transferBytes)}` }
        : r.network.transferBytes <= 5_000_000
          ? { status: 'warn', penalty: 10, title: `Página pesada: ${mb(r.network.transferBytes)}` }
          : {
              status: 'fail',
              penalty: 20,
              title: `Página muito pesada: ${mb(r.network.transferBytes)}`,
              opportunity: {
                title: 'Página muito pesada',
                detail: `${mb(r.network.transferBytes)} transferidos. No 4G isso demora e gasta dados do cliente.`,
                severity: 'high',
              },
            },
  },
  {
    id: 'requests',
    category: 'performance',
    check: (r) =>
      r.network.requests <= 60
        ? { status: 'pass', penalty: 0, title: `${r.network.requests} requisições` }
        : r.network.requests <= 120
          ? { status: 'warn', penalty: 6, title: `${r.network.requests} requisições (muitas)` }
          : { status: 'fail', penalty: 12, title: `${r.network.requests} requisições — excesso` },
  },
  {
    id: 'heavy-images',
    category: 'performance',
    check: (r) => {
      const heavy = r.network.heaviestImages.filter((i) => i.bytes > 500_000);
      return heavy.length
        ? {
            status: heavy.length > 2 ? 'fail' : 'warn',
            penalty: Math.min(15, heavy.length * 5),
            title: `${heavy.length} imagem(ns) acima de 500 KB`,
            detail: heavy
              .slice(0, 3)
              .map((i) => `${kb(i.bytes)} ${i.type}`)
              .join(' · '),
            opportunity: {
              title: 'Imagens pesadas sem otimização',
              detail: `${heavy.length} imagem(ns) acima de 500 KB. Com WebP/AVIF e redimensionamento, carregam 5–10× mais rápido.`,
              severity: heavy.length > 2 ? 'high' : 'medium',
            },
          }
        : { status: 'pass', penalty: 0, title: 'Sem imagens muito pesadas' };
    },
  },
  {
    id: 'oversized',
    category: 'performance',
    check: (r) =>
      r.page.imagesOversized.length
        ? {
            status: 'warn',
            penalty: Math.min(8, r.page.imagesOversized.length * 2),
            title: `${r.page.imagesOversized.length} imagem(ns) maiores que o necessário`,
            detail: r.page.imagesOversized
              .slice(0, 2)
              .map((i) => `${i.natural} → exibida ${i.rendered}`)
              .join(' · '),
          }
        : null,
  },
  {
    id: 'lazy',
    category: 'performance',
    check: (r) =>
      r.page.imagesTotal > 8 && r.page.imagesLazy === 0
        ? {
            status: 'warn',
            penalty: 6,
            title: 'Nenhuma imagem com lazy loading',
            detail: `${r.page.imagesTotal} imagens carregadas de uma vez.`,
          }
        : null,
  },
  {
    id: 'scripts',
    category: 'performance',
    check: (r) =>
      r.page.scriptsCount > 25
        ? {
            status: 'warn',
            penalty: 8,
            title: `${r.page.scriptsCount} scripts externos`,
            detail: 'JavaScript em excesso atrasa a interação.',
          }
        : r.page.scriptsCount > 40
          ? { status: 'fail', penalty: 14, title: `${r.page.scriptsCount} scripts — excesso` }
          : null,
  },
  {
    id: 'fonts',
    category: 'performance',
    check: (r) =>
      r.page.fontsFamilies > 4
        ? {
            status: 'warn',
            penalty: 4,
            title: `${r.page.fontsFamilies} famílias de fonte`,
            detail: 'Mais de 3 famílias pesa e polui o design.',
          }
        : null,
  },
  {
    id: 'third-party',
    category: 'performance',
    check: (r) =>
      r.network.thirdPartyDomains.length > 12
        ? { status: 'warn', penalty: 5, title: `${r.network.thirdPartyDomains.length} domínios de terceiros` }
        : null,
  },
  {
    id: 'ttfb',
    category: 'performance',
    check: (r) =>
      r.lighthouse.ttfb == null
        ? null
        : r.lighthouse.ttfb > 1200
          ? { status: 'warn', penalty: 6, title: `Servidor lento (TTFB ${Math.round(r.lighthouse.ttfb)}ms)` }
          : null,
  },

  // ---------------- MOBILE ----------------
  {
    id: 'm-viewport',
    category: 'mobile',
    check: (r) =>
      r.page.viewport
        ? null
        : {
            status: 'fail',
            penalty: 35,
            title: 'Site não responsivo (sem viewport)',
            opportunity: {
              title: 'Site não é responsivo',
              detail:
                'Sem meta viewport, o site aparece "encolhido" no celular — onde está a maioria das visitas.',
              severity: 'high',
            },
          },
  },
  {
    id: 'm-overflow',
    category: 'mobile',
    check: (r) =>
      r.mobile.horizontalOverflow
        ? {
            status: 'fail',
            penalty: 25,
            title: `Rolagem horizontal no celular (+${r.mobile.overflowWidth}px)`,
            detail: 'Conteúdo mais largo que a tela: layout quebrado.',
            opportunity: {
              title: 'Layout quebrado no celular',
              detail: `A página tem ${r.mobile.overflowWidth}px de conteúdo saindo da tela no mobile. Elementos cortados e rolagem lateral.`,
              severity: 'high',
            },
          }
        : { status: 'pass', penalty: 0, title: 'Sem overflow horizontal' },
  },
  {
    id: 'm-font',
    category: 'mobile',
    check: (r) =>
      r.mobile.smallFontElements > 5
        ? {
            status: r.mobile.smallFontElements > 20 ? 'fail' : 'warn',
            penalty: Math.min(15, Math.round(r.mobile.smallFontElements / 3)),
            title: `${r.mobile.smallFontElements} textos menores que 12px no mobile`,
            detail: `Menor fonte: ${r.mobile.smallestFontPx?.toFixed(0)}px.`,
            opportunity:
              r.mobile.smallFontElements > 20
                ? {
                    title: 'Texto pequeno demais no celular',
                    detail: 'Dezenas de textos abaixo de 12px — difícil de ler sem zoom.',
                    severity: 'medium',
                  }
                : undefined,
          }
        : { status: 'pass', penalty: 0, title: 'Tamanho de fonte legível' },
  },
  {
    id: 'm-tap',
    category: 'mobile',
    check: (r) =>
      r.mobile.smallTapTargets > 8
        ? {
            status: r.mobile.smallTapTargets > 25 ? 'fail' : 'warn',
            penalty: Math.min(15, Math.round(r.mobile.smallTapTargets / 3)),
            title: `${r.mobile.smallTapTargets} botões/links pequenos demais para o dedo`,
            detail: 'Alvos de toque menores que 32px.',
          }
        : { status: 'pass', penalty: 0, title: 'Botões com bom tamanho de toque' },
  },
  {
    id: 'm-menu',
    category: 'mobile',
    check: (r) =>
      r.page.linksInternal > 6 && !r.mobile.hasMobileMenu
        ? {
            status: 'warn',
            penalty: 8,
            title: 'Sem menu mobile identificável',
            detail: 'Navegação pode estar escondida ou quebrada no celular.',
          }
        : null,
  },
  {
    id: 'm-overlap',
    category: 'mobile',
    check: (r) =>
      r.mobile.overlappingElements > 0
        ? {
            status: 'warn',
            penalty: 10,
            title: `${r.mobile.overlappingElements} elemento(s) fixo(s) cobrindo a tela`,
            detail: 'Pop-ups ou barras fixas ocupam mais de 35% da tela do celular.',
          }
        : null,
  },
  {
    id: 'm-clipped',
    category: 'mobile',
    check: (r) =>
      r.mobile.clippedElements > 3
        ? {
            status: 'warn',
            penalty: Math.min(10, r.mobile.clippedElements),
            title: `${r.mobile.clippedElements} elementos cortados nas bordas`,
          }
        : null,
  },
  {
    id: 'm-lh',
    category: 'mobile',
    check: (r) =>
      r.lighthouse.ran && r.lighthouse.performance != null && r.lighthouse.performance < 50
        ? { status: 'warn', penalty: 10, title: 'Experiência mobile lenta (Lighthouse)' }
        : null,
  },

  // ---------------- CONVERSÃO / UX ----------------
  {
    id: 'c-wa',
    category: 'conversion',
    check: (r) =>
      r.page.hasWhatsappLink
        ? r.page.whatsappVisibleAboveFold
          ? { status: 'pass', penalty: 0, title: 'WhatsApp visível logo no início' }
          : {
              status: 'warn',
              penalty: 10,
              title: 'WhatsApp existe, mas não está em destaque',
              detail: 'O link só aparece depois de rolar.',
              opportunity: {
                title: 'WhatsApp pouco acessível',
                detail:
                  'O botão de WhatsApp não aparece na primeira tela. Um botão flutuante e um CTA fixo no mobile aumentam contatos.',
                severity: 'medium',
              },
            }
        : {
            status: 'fail',
            penalty: 25,
            title: 'Sem link de WhatsApp',
            detail: 'No Brasil, WhatsApp é o canal nº 1 de contato.',
            opportunity: {
              title: 'Sem botão de WhatsApp',
              detail:
                'O cliente precisa copiar o número e abrir o app por conta própria. Um link direto (wa.me) remove essa barreira.',
              severity: 'high',
            },
          },
  },
  {
    id: 'c-phone',
    category: 'conversion',
    check: (r) =>
      r.page.hasTelLink || r.page.phoneVisibleAboveFold
        ? { status: 'pass', penalty: 0, title: 'Telefone fácil de encontrar' }
        : {
            status: 'warn',
            penalty: 12,
            title: 'Telefone escondido ou sem link clicável',
            detail: 'Número precisa ser link tel: para ligar com um toque.',
            opportunity: {
              title: 'Telefone escondido',
              detail: 'Não há telefone visível na primeira tela nem link clicável para ligar.',
              severity: 'medium',
            },
          },
  },
  {
    id: 'c-cta',
    category: 'conversion',
    check: (r) =>
      r.page.ctaAboveFold
        ? { status: 'pass', penalty: 0, title: 'Chamada para ação visível no início' }
        : r.page.ctaCandidates.length
          ? {
              status: 'warn',
              penalty: 15,
              title: 'CTA existe, mas não na primeira tela',
              opportunity: {
                title: 'CTA principal pouco claro',
                detail:
                  'O visitante não vê um botão de ação (orçamento, agendar, WhatsApp) sem rolar a página.',
                severity: 'high',
              },
            }
          : {
              status: 'fail',
              penalty: 25,
              title: 'Nenhuma chamada para ação encontrada',
              opportunity: {
                title: 'Site sem chamada para ação',
                detail:
                  'Não há botões de orçamento, contato, agendamento ou WhatsApp. O site informa, mas não vende.',
                severity: 'high',
              },
            },
  },
  {
    id: 'c-form',
    category: 'conversion',
    check: (r) =>
      r.page.forms.length === 0
        ? { status: 'info', penalty: 5, title: 'Sem formulário de contato' }
        : r.page.forms.some((f) => f.fields > 6)
          ? {
              status: 'warn',
              penalty: 8,
              title: 'Formulário longo demais',
              detail: 'Mais de 6 campos reduz o envio pela metade.',
            }
          : r.page.forms.some((f) => !f.hasLabels)
            ? { status: 'warn', penalty: 5, title: 'Formulário com campos sem rótulo' }
            : { status: 'pass', penalty: 0, title: 'Formulário simples e rotulado' },
  },
  {
    id: 'c-email',
    category: 'conversion',
    check: (r) =>
      r.page.hasEmailLink || r.page.forms.length
        ? null
        : { status: 'info', penalty: 3, title: 'Sem e-mail ou formulário' },
  },
  {
    id: 'c-text',
    category: 'conversion',
    check: (r) =>
      r.page.textBlocksLong > 2
        ? {
            status: 'warn',
            penalty: 6,
            title: `${r.page.textBlocksLong} blocos de texto muito longos`,
            detail: 'Excesso de informação cansa; ninguém lê parágrafos de 600+ caracteres no celular.',
            opportunity: {
              title: 'Excesso de texto',
              detail: 'Parágrafos longos demais. Um site que vende usa títulos curtos, benefícios e provas.',
              severity: 'low',
            },
          }
        : null,
  },
  {
    id: 'c-thin',
    category: 'conversion',
    check: (r) =>
      r.page.wordCount < 80
        ? {
            status: 'warn',
            penalty: 8,
            title: 'Pouquíssimo conteúdo',
            detail: `${r.page.wordCount} palavras. Falta explicar serviços e diferenciais.`,
          }
        : null,
  },
  {
    id: 'c-nav',
    category: 'conversion',
    check: (r) =>
      r.page.linksInternal > 60
        ? {
            status: 'warn',
            penalty: 6,
            title: `${r.page.linksInternal} links internos`,
            detail: 'Navegação confusa: muitas opções competindo pela atenção.',
            opportunity: {
              title: 'Navegação confusa',
              detail:
                'Menus com dezenas de links dispersam o visitante. Site que vende tem 5–7 itens e um objetivo.',
              severity: 'low',
            },
          }
        : null,
  },
  {
    id: 'c-social',
    category: 'conversion',
    check: (r) =>
      /instagram\.com\//i.test(JSON.stringify(r.page.ctaCandidates)) || r.page.linksExternal > 0
        ? null
        : { status: 'info', penalty: 2, title: 'Sem links para redes sociais' },
  },

  // ---------------- VISUAL ----------------
  {
    id: 'v-legacy',
    category: 'visual',
    check: (r) =>
      r.page.legacySignals.length
        ? {
            status: r.page.legacySignals.length > 1 ? 'fail' : 'warn',
            penalty: Math.min(35, r.page.legacySignals.length * 12),
            title: 'Sinais de site desatualizado',
            detail: r.page.legacySignals.join(' · '),
            opportunity: {
              title: 'Site visualmente desatualizado',
              detail: `Detectado: ${r.page.legacySignals.join(', ')}. Transmite a sensação de empresa parada no tempo.`,
              severity: 'high',
            },
          }
        : { status: 'pass', penalty: 0, title: 'Sem sinais de tecnologia obsoleta' },
  },
  {
    id: 'v-layout',
    category: 'visual',
    check: (r) =>
      r.page.usesFlexOrGrid
        ? { status: 'pass', penalty: 0, title: 'Layout moderno (flex/grid)' }
        : {
            status: 'warn',
            penalty: 15,
            title: 'Layout sem flexbox/grid',
            detail: 'Indica CSS antigo e provável quebra em telas diferentes.',
          },
  },
  {
    id: 'v-year',
    category: 'visual',
    check: (r) => {
      const y = new Date().getFullYear();
      return r.page.year && r.page.year < y - 1
        ? {
            status: 'warn',
            penalty: 10,
            title: `Rodapé com ano ${r.page.year}`,
            detail: 'Passa a impressão de site abandonado.',
            opportunity: {
              title: 'Site parece abandonado',
              detail: `O rodapé ainda mostra ${r.page.year}. Pequenos sinais assim fazem o cliente duvidar se a empresa ainda existe.`,
              severity: 'low',
            },
          }
        : null;
    },
  },
  {
    id: 'v-hero',
    category: 'visual',
    check: (r) =>
      r.page.hasHeroImage
        ? { status: 'pass', penalty: 0, title: 'Imagem de destaque no topo' }
        : {
            status: 'warn',
            penalty: 12,
            title: 'Sem imagem de impacto no topo',
            detail: 'A primeira tela não tem foto grande: perde presença e emoção.',
          },
  },
  {
    id: 'v-fonts',
    category: 'visual',
    check: (r) =>
      r.page.fontsFamilies > 4
        ? {
            status: 'warn',
            penalty: 8,
            title: 'Tipografia inconsistente',
            detail: `${r.page.fontsFamilies} famílias de fonte diferentes.`,
          }
        : r.page.fontsFamilies <= 1
          ? {
              status: 'info',
              penalty: 5,
              title: 'Fonte padrão do sistema',
              detail: 'Sem fonte própria, o site parece genérico.',
            }
          : null,
  },
  {
    id: 'v-inline',
    category: 'visual',
    check: (r) =>
      r.page.inlineStylesCount > 150
        ? {
            status: 'warn',
            penalty: 8,
            title: `${r.page.inlineStylesCount} estilos inline`,
            detail: 'Código bagunçado: típico de construtores antigos ou edição manual.',
          }
        : null,
  },
  {
    id: 'v-images',
    category: 'visual',
    check: (r) =>
      r.page.imagesTotal < 2
        ? {
            status: 'warn',
            penalty: 10,
            title: 'Quase sem imagens',
            detail: 'Sites com fotos reais do negócio convertem mais.',
          }
        : null,
  },
  {
    id: 'v-lh-bp',
    category: 'visual',
    check: (r) =>
      r.lighthouse.ran && r.lighthouse.bestPractices != null && r.lighthouse.bestPractices < 70
        ? { status: 'warn', penalty: 6, title: `Lighthouse Best Practices: ${r.lighthouse.bestPractices}` }
        : null,
  },
  {
    id: 'v-a11y',
    category: 'visual',
    check: (r) =>
      r.lighthouse.ran && r.lighthouse.accessibility != null
        ? {
            status:
              r.lighthouse.accessibility >= 85 ? 'pass' : r.lighthouse.accessibility >= 60 ? 'warn' : 'fail',
            penalty: Math.round((100 - r.lighthouse.accessibility) * 0.2),
            title: `Lighthouse Acessibilidade: ${r.lighthouse.accessibility}`,
          }
        : null,
  },
];

const WEIGHTS: Record<AuditCategory, number> = {
  visual: 0.2,
  mobile: 0.2,
  performance: 0.15,
  seo: 0.15,
  conversion: 0.2,
  security: 0.1,
};

export function scoreReport(partial: Partial): Pick<AuditReport, 'findings' | 'scores' | 'opportunities'> {
  const findings: AuditFinding[] = [];
  const penalties: Record<AuditCategory, number> = {
    visual: 0,
    mobile: 0,
    performance: 0,
    seo: 0,
    conversion: 0,
    security: 0,
  };
  const opps: AuditOpportunity[] = [];
  for (const rule of RULES) {
    let res: ReturnType<Rule['check']>;
    try {
      res = rule.check(partial);
    } catch {
      res = null;
    }
    if (!res) continue;
    findings.push({
      id: rule.id,
      category: rule.category,
      status: res.status,
      title: res.title,
      detail: res.detail,
      value: res.value ?? null,
    });
    penalties[rule.category] += res.penalty;
    if (res.opportunity)
      opps.push({
        id: rule.id,
        category: rule.category,
        severity: res.opportunity.severity,
        title: res.opportunity.title,
        detail: res.opportunity.detail,
        impact: res.penalty,
      });
  }
  const scores: AuditScores = {
    visual: clamp(Math.round(100 - penalties.visual), 0, 100),
    mobile: clamp(Math.round(100 - penalties.mobile), 0, 100),
    performance: clamp(Math.round(100 - penalties.performance), 0, 100),
    seo: clamp(Math.round(100 - penalties.seo), 0, 100),
    conversion: clamp(Math.round(100 - penalties.conversion), 0, 100),
    security: clamp(Math.round(100 - penalties.security), 0, 100),
    overall: 0,
  };
  scores.overall = clamp(
    Math.round((Object.keys(WEIGHTS) as AuditCategory[]).reduce((acc, k) => acc + scores[k] * WEIGHTS[k], 0)),
    0,
    100,
  );
  // oportunidades: dedupe por título, ordena por severidade e impacto, limita a 8
  const sevRank = { high: 3, medium: 2, low: 1 };
  const seen = new Set<string>();
  const opportunities = opps
    .filter((o) => (seen.has(o.title) ? false : (seen.add(o.title), true)))
    .sort((a, b) => sevRank[b.severity] - sevRank[a.severity] || b.impact - a.impact)
    .slice(0, 8);
  return { findings, scores, opportunities };
}
