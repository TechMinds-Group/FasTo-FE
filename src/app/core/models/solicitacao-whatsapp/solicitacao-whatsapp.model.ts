import { agendamentoParaDateLocal } from '../agenda.model';

/**
 * Modelo de domínio das solicitações registradas pelo bot de WhatsApp.
 * Contrato: GET/PUT em `${apiUrl}/api/solicitacoes-whatsapp`.
 */
export interface SolicitacaoWhatsApp {
  id: string;
  createdAtUtc: string;
  tenantId: string;
  tipoFluxo: string;
  nomeCliente: string;
  celular: string;
  email: string | null;
  descricao: string | null;
  resposta: string | null;
  status: string;
  atualizadoEm: string | null;
  /** Pode ser null em registros antigos. */
  protocolo: string | null;
}

export interface ResponderSolicitacao {
  resposta: string;
}

export interface AtualizarStatusSolicitacao {
  status: string;
}

export interface ResponderSolicitacaoResponse {
  notificado: boolean;
  solicitacao: SolicitacaoWhatsApp;
}

export interface EncerrarConversaResponse {
  notificado: boolean;
  message: string;
}

export interface SolicitacoesWhatsAppResponse {
  totalCount: number;
  page: number;
  pageSize: number;
  items: SolicitacaoWhatsApp[];
}

export interface SolicitacoesWhatsAppFiltros {
  tipoFluxo?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface SolicitacaoStatusBadgeConfig {
  badgeClass: string;
  iconClass: string;
  label: string;
}

/** Mapeamento status → badge (regra 16: const RECORD, não enum). */
export const SOLICITACAO_STATUS_CONFIGS: Record<string, SolicitacaoStatusBadgeConfig> = {
  pendente: {
    badgeClass: 'bg-warning-subtle text-warning border border-warning-subtle',
    iconClass: 'fas fa-clock',
    label: 'Em análise',
  },
  respondida: {
    badgeClass: 'bg-info-subtle text-info border border-info-subtle',
    iconClass: 'fas fa-reply',
    label: 'Respondida',
  },
  concluida: {
    badgeClass: 'bg-success-subtle text-success border border-success-subtle',
    iconClass: 'fas fa-check-circle',
    label: 'Concluída',
  },
  cancelada: {
    badgeClass: 'bg-danger-subtle text-danger border border-danger-subtle',
    iconClass: 'fas fa-times-circle',
    label: 'Cancelada',
  },
};

/** Mapeamento tipoFluxo → label amigável. */
export const SOLICITACAO_TIPO_FLUXO_LABELS: Record<string, string> = {
  orcamento: 'Orçamento',
  pedido: 'Pedido',
  suporte: 'Suporte / Chamado',
  precadastro: 'Pré-Cadastro',
  enviar_documentos: 'Envio de Documentos',
  consultar_estoque: 'Consulta de Estoque',
  agendar_visita: 'Visita Técnica',
  simular: 'Simulação',
  triagem_advocacia: 'Triagem Jurídica',
  consultar_status: 'Consulta de Status',
};

export function obterConfigStatusSolicitacao(status: string): SolicitacaoStatusBadgeConfig {
  return (
    SOLICITACAO_STATUS_CONFIGS[status] ?? {
      badgeClass: 'bg-secondary-subtle text-secondary border border-secondary-subtle',
      iconClass: 'fas fa-circle-question',
      label: status,
    }
  );
}

export function obterLabelTipoFluxo(tipoFluxo: string): string {
  return SOLICITACAO_TIPO_FLUXO_LABELS[tipoFluxo] ?? 'Solicitação';
}

export interface OpcaoSelecionavel {
  value: string;
  label: string;
}

/** Opções do filtro/ação de tipo de fluxo ("Todos" + tipos do RECORD). */
export const OPCOES_TIPO_FLUXO_SOLICITACAO: OpcaoSelecionavel[] = Object.entries(
  SOLICITACAO_TIPO_FLUXO_LABELS,
).map(([value, label]) => ({ value, label }));

/** Opções do filtro/ação de status ("Todos" + 4 status válidos). */
export const OPCOES_STATUS_SOLICITACAO: OpcaoSelecionavel[] = Object.entries(
  SOLICITACAO_STATUS_CONFIGS,
).map(([value, config]) => ({ value, label: config.label }));

/**
 * Formata a data ISO da API como `dd/MM/yyyy HH:mm` sem converter fuso
 * (regra 6c: monta o Date local a partir dos componentes do ISO).
 */
export function formatarDataHoraSolicitacao(iso: string | null): string {
  if (!iso) return '-';
  const d = agendamentoParaDateLocal(iso);
  const pad = (n: number): string => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
