export interface ServicoCatalogo {
  id: string;
  nome: string;
  descricao?: string;
  preco: number;
  /** Quando true, o preço é um valor inicial ("a partir de") e pode variar conforme o caso. */
  precoAPartirDe: boolean;
  duracao?: number;
  status: 'Ativo' | 'Inativo';
  categoriaId?: string | null;
  categoriaNome?: string | null;
  imagemUrl?: string | null;
  imagemUrl2?: string | null;
  imagemUrl3?: string | null;
}