export interface Usuario {
  id: string;
  nome: string;
  sobrenome?: string;
  email: string;
  telefone?: string;
  perfil: string;
  perfilSecundario?: string | null;
  perfilCorHex: string;
  perfilIconeClass: string;
  status: 'Ativo' | 'Inativo';
  faturamento?: number;
  planoAssinatura?: string;
  plano?: string;
  fotoUrl?: string;
  tema?: 'dispositivo' | 'escuro' | 'claro';
}

