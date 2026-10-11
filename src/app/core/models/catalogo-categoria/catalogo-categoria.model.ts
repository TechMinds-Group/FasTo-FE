export interface CatalogoCategoria {
  id: string;
  nome: string;
  icone: string | null;
  ordem: number;
  status: string;
  quantidadeServicos: number;
}

export interface CatalogoCategoriaPayload {
  nome: string;
  icone: string | null;
  ordem: number;
  status: string;
}
