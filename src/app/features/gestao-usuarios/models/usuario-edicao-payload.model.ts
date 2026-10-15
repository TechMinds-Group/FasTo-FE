export interface UsuarioEdicaoPayload {
  nome: string;
  sobrenome: string;
  email: string;
  telefone?: string;
  status: string;
  perfil: string;
  perfilSecundario?: string | null;
  plano?: string;
  tema?: string;
}