/**
 * Pipeline comercial da GZ Sites.
 * Lead → Contato → Interessado → Prévia → Proposta → Negociação → Fechado → Produção → Entregue
 */
export const STAGES = [
  { id: 'lead', label: 'Lead', color: '#8b8b9a', won: false },
  { id: 'contato', label: 'Contato', color: '#5b8def', won: false },
  { id: 'interessado', label: 'Interessado', color: '#7c6cf2', won: false },
  { id: 'previa', label: 'Prévia', color: '#c86cf2', won: false },
  { id: 'proposta', label: 'Proposta', color: '#f2a93b', won: false },
  { id: 'negociacao', label: 'Negociação', color: '#f27d3b', won: false },
  { id: 'fechado', label: 'Fechado', color: '#36c27a', won: true },
  { id: 'producao', label: 'Produção', color: '#2aa7a7', won: true },
  { id: 'entregue', label: 'Entregue', color: '#1f8a5b', won: true },
] as const;

export type StageId = (typeof STAGES)[number]['id'];
export const STAGE_IDS = STAGES.map((s) => s.id) as [StageId, ...StageId[]];

export function stageLabel(id: string): string {
  return STAGES.find((s) => s.id === id)?.label ?? id;
}

export function isWonStage(id: string): boolean {
  return STAGES.find((s) => s.id === id)?.won ?? false;
}

/** Etapas consideradas "pipeline aberto" (valor potencial) */
export const OPEN_STAGES: StageId[] = ['lead', 'contato', 'interessado', 'previa', 'proposta', 'negociacao'];
