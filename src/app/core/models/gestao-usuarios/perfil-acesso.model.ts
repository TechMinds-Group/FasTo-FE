/**
 * Perfis de acesso fixos do sistema (enum no backend). Não há níveis dinâmicos.
 */
export interface PerfilAcesso {
  value: string;
  label: string;
  corHex: string;
  iconeClass: string;
}

export const PERFIS_ACESSO: PerfilAcesso[] = [
  { value: 'Administrador', label: 'Administrador', corHex: '#ef4444', iconeClass: 'fas fa-shield-alt' },
  { value: 'Operador', label: 'Operador', corHex: '#0d6efd', iconeClass: 'fas fa-desktop' },
  { value: 'Profissional', label: 'Profissional', corHex: '#6c757d', iconeClass: 'fas fa-user-tie' },
];

/** Retorna o perfil pelo nome; desconhecidos caem no visual neutro de Profissional. */
export function obterPerfilAcesso(nome: string | null | undefined): PerfilAcesso {
  return PERFIS_ACESSO.find((p) => p.value.toLowerCase() === (nome ?? '').toLowerCase())
    ?? PERFIS_ACESSO[PERFIS_ACESSO.length - 1];
}

/**
 * Verifica se o usuário possui o perfil informado como principal OU secundário
 * (um usuário pode acumular até 2 perfis).
 */
export function temPerfil(
  u: { perfil?: string | null; perfilSecundario?: string | null } | null | undefined,
  nome: string,
): boolean {
  if (!u) {
    return false;
  }
  return u.perfil === nome || u.perfilSecundario === nome;
}
