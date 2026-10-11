export interface CategoriaStatusBadgeConfig {
  badgeClass: string;
  iconClass: string;
  label: string;
}

export const CATEGORIA_STATUS_CONFIGS: Record<string, CategoriaStatusBadgeConfig> = {
  Ativo: {
    badgeClass: 'bg-success-subtle text-success border border-success-subtle',
    iconClass: 'fas fa-check-circle',
    label: 'Ativo',
  },
  Inativo: {
    badgeClass: 'bg-danger-subtle text-danger border border-danger-subtle',
    iconClass: 'fas fa-times-circle',
    label: 'Inativo',
  },
};
