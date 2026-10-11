import { ServicoDisponivel } from '../../../core/models/agendamento-publico/agendamento-publico.model';

/** Preço do serviço formatado para exibição, com qualificador opcional. */
export interface PrecoFormatadoServico {
  /** Texto qualificador ("A partir de") quando o preço é um valor inicial; null quando exato. */
  qualificador: string | null;
  /** Valor monetário formatado em BRL ou o texto "Sob Consulta". */
  valor: string;
}

/**
 * Regra de negócio de interface: quando o serviço tem `precoAPartirDe`, o valor exibido
 * é um valor inicial e recebe o qualificador "A partir de".
 */
export function formatarPrecoServico(
  servico: Pick<ServicoDisponivel, 'preco' | 'precoAPartirDe'> | null | undefined,
): PrecoFormatadoServico {
  if (!servico || !servico.preco || servico.preco <= 0) {
    return { qualificador: null, valor: 'Sob Consulta' };
  }
  return {
    qualificador: servico.precoAPartirDe ? 'A partir de' : null,
    valor: servico.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  };
}
