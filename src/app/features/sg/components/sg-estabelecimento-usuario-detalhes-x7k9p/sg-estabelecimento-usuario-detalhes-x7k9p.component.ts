import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TmTextComponent, TmSelectComponent, TmToastService, TmModalComponent } from '@techminds-group/tm-angular-lib';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PERFIS_ACESSO, obterPerfilAcesso } from '../../../../core/models/gestao-usuarios/perfil-acesso.model';

/** Vínculo que impede a exclusão de um usuário (retornado pela API em 409). */
interface VinculoExclusao {
  tipo: string;
  quantidade: number;
  detalhe?: string | null;
}

@Component({
  selector: 'app-sg-estabelecimento-usuario-detalhes-x7k9p',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TmTextComponent,
    TmSelectComponent,
    TmModalComponent
  ],
  templateUrl: './sg-estabelecimento-usuario-detalhes-x7k9p.component.html',
  styleUrl: './sg-estabelecimento-usuario-detalhes-x7k9p.component.scss'
})
export class SgEstabelecimentoUsuarioDetalhesX7k9pComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(TmToastService);
  protected themeService = inject(ThemeService);

  protected empresaId = signal<string>('');
  protected usuarioId = signal<string>('');
  protected usuario = signal<any | null>(null);
  protected modoEdicao = signal<boolean>(false);
  protected salvando = signal<boolean>(false);
  protected showDeleteModal = signal<boolean>(false);
  /** Vínculos impeditivos (agendamentos futuros ativos) exibidos no modal de bloqueio. */
  protected readonly vinculosExclusao = signal<VinculoExclusao[]>([]);
  protected readonly showVinculosModal = signal<boolean>(false);
  /** Vínculos não impeditivos (agenda, serviços, planos, histórico) que serão limpos após confirmação. */
  protected readonly vinculosLimpeza = signal<VinculoExclusao[]>([]);
  protected readonly showConfirmLimpezaModal = signal<boolean>(false);

  protected perfisSelecionados = signal<string[]>([]);

  /** Opções estáticas da enum de perfis (Administrador, Operador, Profissional). */
  protected readonly niveisOptions = computed(() =>
    PERFIS_ACESSO.map(p => ({ value: p.value, label: p.label }))
  );

  protected readonly obterPerfilAcesso = obterPerfilAcesso;

  protected form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(50)]],
    sobrenome: ['', [Validators.maxLength(50)]],
    email: [''],
    telefone: ['', [Validators.maxLength(20)]],
    senha: [''],
    perfil: ['', [Validators.required]],
    status: ['Ativo']
  });

  ngOnInit(): void {
    const empId = this.route.snapshot.paramMap.get('empresaId');
    const uId = this.route.snapshot.paramMap.get('id');

    if (empId && uId) {
      this.empresaId.set(empId);
      this.usuarioId.set(uId);
      this.carregarUsuario(uId);
    } else {
      this.toastService.error('Parâmetros inválidos.', 'Erro');
      this.router.navigate(['/sg-estabelecimentos-x7k9p']);
    }
  }

  carregarUsuario(uId: string): void {
    this.authService.getSgUsuarioById(uId).subscribe({
      next: (data) => {
        this.usuario.set(data);
        this.preencherForm(data);
      },
      error: () => {
        this.toastService.error('Falha ao carregar informações do usuário.', 'Erro');
        this.voltar();
      }
    });
  }

  preencherForm(user: any): void {
    const selected: string[] = [];
    if (user.perfil) {
      selected.push(user.perfil);
    }
    if (user.perfilSecundario) {
      selected.push(user.perfilSecundario);
    }
    this.perfisSelecionados.set(selected);

    this.form.patchValue({
      nome: user.nome || '',
      sobrenome: user.sobrenome || '',
      email: user.email || '',
      telefone: user.telefone || '',
      perfil: selected.length > 0 ? selected[0] : '',
      status: user.status || 'Ativo'
    });
  }

  onPerfisChange(val: unknown): void {
    if (Array.isArray(val)) {
      let selected = val as string[];
      if (selected.length > 2) {
        selected = selected.slice(0, 2);
      }
      if (selected.length === 0 && this.niveisOptions().length > 0) {
        selected = [this.niveisOptions()[0].value];
      }
      this.perfisSelecionados.set(selected);
      this.form.patchValue({ perfil: selected.length > 0 ? selected[0] : '' });
    }
  }

  habilitarEdicao(): void {
    this.modoEdicao.set(true);
  }

  cancelarEdicao(): void {
    this.modoEdicao.set(false);
    if (this.usuario()) {
      this.preencherForm(this.usuario());
    }
  }

  voltar(): void {
    this.router.navigate(['/sg-estabelecimento-usuarios-x7k9p', this.empresaId()]);
  }

  alternarStatus(event: any): void {
    const isChecked = event.target.checked;
    this.form.patchValue({ status: isChecked ? 'Ativo' : 'Inativo' });
  }

  async salvarGeral(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Preencha os campos obrigatórios.', 'Atenção');
      return;
    }

    this.salvando.set(true);
    try {
      const raw = this.form.getRawValue();
      const selected = this.perfisSelecionados();

      await this.authService.updateSgUsuario(this.usuarioId(), {
        nome: raw.nome,
        sobrenome: raw.sobrenome || '',
        email: raw.email,
        telefone: (raw.telefone || '').replace(/\D/g, ''),
        perfil: selected.length > 0 ? selected[0] : '',
        perfilSecundario: selected.length > 1 ? selected[1] : null,
        senha: raw.senha || null
      }).toPromise();

      if (raw.status !== this.usuario()?.status) {
        await this.authService.toggleSgUsuarioStatus(this.usuarioId()).toPromise();
      }

      this.toastService.success('Usuário atualizado com sucesso!', 'Sucesso');
      this.modoEdicao.set(false);
      this.carregarUsuario(this.usuarioId());
    } catch (err: any) {
      const msg = err?.error?.message || 'Erro ao atualizar usuário.';
      this.toastService.error(msg, 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }

  excluir(): void {
    this.showDeleteModal.set(true);
  }

  cancelarExcluir(): void {
    this.showDeleteModal.set(false);
  }

  async confirmarExcluir(): Promise<void> {
    this.showDeleteModal.set(false);
    try {
      await this.authService.deleteSgUsuario(this.usuarioId()).toPromise();
      this.toastService.success('Usuário excluído com sucesso!', 'Sucesso');
      this.voltar();
    } catch (err: any) {
      const vinculos = err?.status === 409 ? (err?.error?.vinculos ?? []) : [];
      if (vinculos.length > 0 && err?.error?.requiresCleanup) {
        // Impeditivo: agendamentos futuros ativos — usuário precisa resolver antes.
        this.vinculosExclusao.set(vinculos);
        this.showVinculosModal.set(true);
        return;
      }
      if (vinculos.length > 0 && err?.error?.requiresConfirmation) {
        // Não impeditivo: vínculos serão limpos automaticamente — só pede confirmação.
        this.vinculosLimpeza.set(vinculos);
        this.showConfirmLimpezaModal.set(true);
        return;
      }
      const msg = err?.error?.message || err?.error?.Message || 'Erro ao excluir usuário.';
      this.toastService.error(msg, 'Erro');
    }
  }

  /** Executa a exclusão com limpeza automática dos vínculos não impeditivos. */
  async confirmarExclusaoComLimpeza(): Promise<void> {
    this.showConfirmLimpezaModal.set(false);
    this.salvando.set(true);
    try {
      await this.authService.deleteSgUsuario(this.usuarioId(), true).toPromise();
      this.toastService.success('Usuário excluído com sucesso!', 'Sucesso');
      this.voltar();
    } catch (err: any) {
      const msg = err?.error?.message || err?.error?.Message || 'Erro ao excluir usuário.';
      this.toastService.error(msg, 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }

  fecharVinculosModal(): void {
    this.showVinculosModal.set(false);
  }

  cancelarExclusaoComLimpeza(): void {
    this.showConfirmLimpezaModal.set(false);
  }

  /** Ícone Font Awesome por tipo de vínculo (chave pelo início do tipo retornado pela API). */
  iconeVinculo(tipo: string): string {
    const t = (tipo || '').toLowerCase();
    if (t.startsWith('agendamento')) return 'fas fa-calendar-check';
    if (t.startsWith('agenda')) return 'fas fa-calendar-alt';
    if (t.startsWith('servi')) return 'fas fa-briefcase';
    if (t.startsWith('plano')) return 'fas fa-id-card';
    if (t.startsWith('configura')) return 'fab fa-whatsapp';
    return 'fas fa-link';
  }

  obterLinkWhatsapp(phone: string): string {
    const clean = (phone || '').replace(/\D/g, '');
    return `https://wa.me/55${clean}`;
  }
}
