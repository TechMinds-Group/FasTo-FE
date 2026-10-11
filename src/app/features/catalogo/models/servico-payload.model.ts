export interface ServicoPayload {
  nome: string;
  descricao?: string | null;
  preco: number;
  /** Quando true, o preço informado é um valor inicial ("a partir de") e pode variar conforme o caso. */
  precoAPartirDe: boolean;
  duracao?: number | null;
  status: string;
  categoriaId: string;
  imagemUrl?: string | null;
  imagemUrl2?: string | null;
  imagemUrl3?: string | null;
}