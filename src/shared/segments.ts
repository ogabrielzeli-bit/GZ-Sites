/**
 * Segmentos de negócio suportados pelo GZ OS.
 * Cada segmento tem um preset no engine (src/engine/presets) com linguagem visual e copy próprias.
 */
export const SEGMENTS = [
  { id: 'serralheria', label: 'Serralheria', group: 'Indústria & Construção' },
  { id: 'arquitetura', label: 'Arquitetura', group: 'Projetos' },
  { id: 'restaurante', label: 'Restaurante', group: 'Alimentação' },
  { id: 'buffet', label: 'Buffet & Eventos', group: 'Alimentação' },
  { id: 'oficina', label: 'Oficina Automotiva', group: 'Automotivo' },
  { id: 'loja-automotiva', label: 'Loja Automotiva', group: 'Automotivo' },
  { id: 'concessionaria', label: 'Concessionária', group: 'Automotivo' },
  { id: 'clinica', label: 'Clínica', group: 'Saúde' },
  { id: 'medico', label: 'Médico / Consultório', group: 'Saúde' },
  { id: 'advogado', label: 'Advogado / Escritório', group: 'Serviços profissionais' },
  { id: 'imobiliaria', label: 'Imobiliária', group: 'Imóveis' },
  { id: 'construcao', label: 'Construção / Construtora', group: 'Indústria & Construção' },
  { id: 'academia', label: 'Academia / Fitness', group: 'Bem-estar' },
  { id: 'estetica', label: 'Estética & Beleza', group: 'Bem-estar' },
  { id: 'barbearia', label: 'Barbearia', group: 'Bem-estar' },
  { id: 'loja', label: 'Loja / Varejo', group: 'Comércio' },
  { id: 'ecommerce', label: 'E-commerce simples', group: 'Comércio' },
  { id: 'servicos', label: 'Prestador de Serviços', group: 'Serviços' },
  { id: 'b2b', label: 'Empresa B2B', group: 'Corporativo' },
  { id: 'industria', label: 'Indústria', group: 'Indústria & Construção' },
] as const;

export type SegmentId = (typeof SEGMENTS)[number]['id'];
export const SEGMENT_IDS = SEGMENTS.map((s) => s.id) as [SegmentId, ...SegmentId[]];

export function segmentLabel(id: string): string {
  return SEGMENTS.find((s) => s.id === id)?.label ?? id;
}

export function isSegmentId(value: string): value is SegmentId {
  return (SEGMENT_IDS as string[]).includes(value);
}
