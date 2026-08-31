import { ChangeDetectionStrategy, Component, output, signal, inject, computed, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { TmSidebarComponent, MenuItem, ProfileMenuItem, SidebarUser } from '@techminds-group/tm-angular-lib';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { EstabelecimentoService } from '../../core/services/estabelecimento.service';
import { ALL_SIDEBAR_MENU_ITEMS, VISIBLE_SIDEBAR_MENUS, PROFILE_MENU_ITEMS, filterMenuByRoles } from '../../core/config/menu.config';
import { SidebarModalIdiomaComponent } from './components/modais/sidebar-modal-idioma/sidebar-modal-idioma.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, TmSidebarComponent, SidebarModalIdiomaComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private languageService = inject(LanguageService);
  private estabelecimentoService = inject(EstabelecimentoService);
  private router = inject(Router);
  protected isCollapsed = signal(false);
  protected avatarColor = signal('0D8ABC');
  protected showIdiomaModal = signal(false);
  protected rotuloAtendentePlural = signal<string>('Atendentes');
  protected currentPath = signal<string>(window.location.pathname);
  @ViewChild(TmSidebarComponent) sidebar!: TmSidebarComponent;

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentPath.set(event.urlAfterRedirects || event.url);
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const info = await this.estabelecimentoService.carregarInfo();
      if (info && info.rotuloAtendente) {
        const singular = info.rotuloAtendente.trim();
        const plural = singular.endsWith('s') ? singular : `${singular}s`;
        this.rotuloAtendentePlural.set(plural);
      }
    } catch {
      // Fallback para 'Atendentes'
    }
  }

  protected readonly menuItems = computed<MenuItem[]>(() => {
    const currentUser = this.authService.currentUser();
    const roles = currentUser?.roles ?? [];
    const role = currentUser?.role ?? '';
    const path = this.currentPath();
    const isSuperAdmin = role === 'SuperAdmin' || roles.includes('SuperAdmin') || currentUser?.email === 'micheladm@fasto.com' || currentUser?.email?.startsWith('micheladm') || path.includes('/sg-');

    if (isSuperAdmin) {
      if (path.includes('/sg-estabelecimento-detalhes-x7k9p') || path.includes('/sg-estabelecimento-acesso-x7k9p')) {
        const match = path.match(/\/sg-estabelecimento-(?:detalhes|acesso)-x7k9p\/([a-f0-9-]+)/i);
        const empId = match ? match[1] : '';

        return [
          {
            label: 'Voltar',
            icon: 'fas fa-arrow-left',
            route: '/sg-estabelecimentos-x7k9p',
          },
          {
            label: 'Acesso',
            icon: 'fas fa-key',
            route: empId ? `/sg-estabelecimento-acesso-x7k9p/${empId}` : '#',
          },
          {
            label: 'Sair',
            icon: 'fas fa-sign-out-alt',
            route: '/sg-auth-x7k9p',
          },
        ];
      }

      return [
        {
          label: 'Perfil',
          icon: 'fas fa-user-shield',
          route: '/sg-perfil-x7k9p',
        },
        {
          label: 'Estabelecimentos',
          icon: 'fas fa-store',
          route: '/sg-estabelecimentos-x7k9p',
        },
        {
          label: 'Sair',
          icon: 'fas fa-sign-out-alt',
          route: '/sg-auth-x7k9p',
        },
      ];
    }

    const rotuloAtend = this.rotuloAtendentePlural();

    const items = ALL_SIDEBAR_MENU_ITEMS.map((item) => {
      if (item.label === 'Gestão' && item.subItems) {
        const updatedSub = item.subItems.map((sub) => {
          if (sub.route === '/gestao/profissionais') {
            return { ...sub, label: rotuloAtend };
          }
          return sub;
        });
        return { ...item, subItems: updatedSub };
      }
      return item;
    });

    return filterMenuByRoles(
      items.filter((item) => VISIBLE_SIDEBAR_MENUS.includes(item.label)),
      roles,
    );
  });

  protected readonly profileMenuItems = computed<ProfileMenuItem[]>(() => {
    return PROFILE_MENU_ITEMS;
  });

  protected readonly currentUser = computed<SidebarUser | undefined>(() => {
    return undefined;
  });

  logout = output<void>();
  themeToggle = output<void>();
  collapseChange = output<boolean>();

  handleLogout(): void {
    this.logout.emit();
  }

  handleToggleCollapse(collapsed: boolean): void {
    this.isCollapsed.set(collapsed);
    this.collapseChange.emit(collapsed);
  }

  handleThemeToggle(): void {
    this.themeService.toggleTheme();
    this.themeToggle.emit();
    this.sidebar.isProfileOpen.set(false);
  }

  handleLanguageChange(_langCode: string): void {
    this.showIdiomaModal.set(true);
    this.sidebar.isProfileOpen.set(false);
  }

  handleItemClick(item: MenuItem): void {
    if (item.label === 'Acesso') {
      const path = this.currentPath();
      const match = path.match(/\/sg-estabelecimento-(?:detalhes|acesso)-x7k9p\/([a-f0-9-]+)/i);
      if (match && match[1]) {
        this.router.navigate(['/sg-estabelecimento-acesso-x7k9p', match[1]]);
      }
      return;
    }
    if (item.label === 'Voltar') {
      this.router.navigate(['/sg-estabelecimentos-x7k9p']);
      return;
    }
    if (item.label === 'Sair' || item.route === '/login' || item.route === '/sg-auth-x7k9p') {
      this.handleLogout();
    }
  }
}
