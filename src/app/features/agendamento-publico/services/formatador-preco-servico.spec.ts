import { formatarPrecoServico } from './formatador-preco-servico';

describe('formatarPrecoServico', () => {
  it('retorna valor em BRL sem qualificador quando o preço é exato', () => {
    const resultado = formatarPrecoServico({ preco: 50, precoAPartirDe: false });

    expect(resultado.qualificador).toBeNull();
    expect(resultado.valor).toBe('R$ 50,00');
  });

  it('retorna qualificador "A partir de" quando precoAPartirDe é true', () => {
    const resultado = formatarPrecoServico({ preco: 50, precoAPartirDe: true });

    expect(resultado.qualificador).toBe('A partir de');
    expect(resultado.valor).toBe('R$ 50,00');
  });

  it('retorna "Sob Consulta" quando não há serviço', () => {
    const resultado = formatarPrecoServico(null);

    expect(resultado.qualificador).toBeNull();
    expect(resultado.valor).toBe('Sob Consulta');
  });

  it('retorna "Sob Consulta" quando o preço é zero', () => {
    const resultado = formatarPrecoServico({ preco: 0, precoAPartirDe: true });

    expect(resultado.qualificador).toBeNull();
    expect(resultado.valor).toBe('Sob Consulta');
  });

  it('formata valores com centavos no padrão pt-BR', () => {
    const resultado = formatarPrecoServico({ preco: 99.9, precoAPartirDe: true });

    expect(resultado.valor).toBe('R$ 99,90');
  });
});
