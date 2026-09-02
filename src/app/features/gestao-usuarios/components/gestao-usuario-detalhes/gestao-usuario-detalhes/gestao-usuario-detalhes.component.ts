import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TmTextComponent, TmSelectComponent, TmModalComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { GestaoUsuariosService } from '../../../../../core/services/gestao-usuarios.service';
import { Usuario } from '../../../../../core/models/gestao-usuarios/usuario.model';
import { NivelAcesso } from '../../../../../core/models/gestao-usuarios/nivel-acesso.model';
import { AuthService } from '../../../../../core/services/auth.service';
import { ThemeService } from '../../../../../core/services/theme.service';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';
import { PerfilBadgePipe } from '../../../pipes/perfil-badge.pipe';
import { StatusBadgePipe } from '../../../pipes/status-badge.pipe';
import { GestaoUsuariosHelperService } from '../../../services/gestao-usuarios-helper.service';
import {
  UsuarioModalAlterarSenhaComponent,
  UsuarioSenhaPayload,
} from '../../modais/usuario-modal-alterar-senha/usuario-modal-alterar-senha.component';
import { UsuarioModalExcluirComponent } from '../../modais/usuario-modal-excluir/usuario-modal-excluir.component';

@Component({
  selector: 'app-gestao-usuario-detalhes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TmTextComponent,
    TmSelectComponent,
    TmModalComponent,
    TranslatePipe,
    PerfilBadgePipe,
    StatusBadgePipe,
    UsuarioModalAlterarSenhaComponent,
    UsuarioModalExcluirComponent,
  ],
  templateUrl: './gestao-usuario-detalhes.component.html',
  styleUrl: './gestao-usuario-detalhes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GestaoUsuariosHelperService],
})
export class GestaoUsuarioDetalhesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  protected readonly gestaoUsuariosService = inject(GestaoUsuariosService);
  protected readonly helper = inject(GestaoUsuariosHelperService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(TmToastService);
  protected readonly themeService = inject(ThemeService);

  protected readonly id = signal<string | null>(null);
  protected readonly usuario = signal<Usuario | null>(null);
  protected readonly niveisAcesso = signal<NivelAcesso[]>([]);
  protected readonly perfilOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly perfisSelecionados = signal<string[]>([]);
  protected readonly modoEdicao = signal<boolean>(false);
  protected readonly salvando = signal<boolean>(false);

  protected readonly isAdmin = this.authService.isAdmin;
  protected readonly currentUserId = this.authService.currentUserId;

  protected readonly showChangePasswordModal = signal<boolean>(false);
  protected readonly showDeleteConfirmModal = signal<boolean>(false);
  protected readonly showConfirmarAgendamentosFuturosModal = signal<boolean>(false);
  protected readonly mensagemConfirmacaoFuturos = signal<string>('');

  protected readonly form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(60)]],
    sobrenome: ['', [Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', [Validators.maxLength(15)]],
    nivelAcessoId: [''],
    status: ['Ativo'],
  });

  async ngOnInit(): Promise<void> {
    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      this.id.set(paramId);
      await this.carregarDadosUsuario(paramId);
    }
    try {
      const niveis = await this.gestaoUsuariosService.carregarNiveis();
      this.niveisAcesso.set(niveis);
      this.perfilOptions.set(niveis.map((n) => ({ value: n.id, label: n.nome })));
    } catch {
      // Ignora erro se níveis já carregados
    }
  }

  voltar(): void {
    this.router.navigate(['/gestao/gestao-usuarios']);
  }

  protected habilitarEdicao(): void {
    const user = this.usuario();
    if (user) {
      this.preencherFormulario(user);
      this.modoEdicao.set(true);
    }
  }

  protected cancelarEdicao(): void {
    this.modoEdicao.set(false);
  }

  protected alternarStatus(event: Event): void {
    const alvo = event.target as HTMLInputElement;
    this.form.get('status')?.setValue(alvo.checked ? 'Ativo' : 'Inativo');
  }

  protected onPerfisChange(val: unknown): void {
    if (Array.isArray(val)) {
      let selected = val as string[];
      if (selected.length > 2) {
        selected = selected.slice(0, 2);
      }
      if (selected.length === 0 && this.perfilOptions().length > 0) {
        selected = [this.perfilOptions()[0].value];
      }
      this.perfisSelecionados.set(selected);
    }
  }

  protected async salvarGeral(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Preencha os campos obrigatórios do formulário.', 'Atenção');
      return;
    }

    const userId = this.id();
    if (!userId) return;

    this.salvando.set(true);
    try {
      const raw = this.form.value;
      const selected = this.perfisSelecionados();
      const digitsTelefone = (raw.telefone ?? '').replace(/\D/g, '');

      await this.gestaoUsuariosService.atualizar(userId, {
        nome: raw.nome,
        sobrenome: raw.sobrenome,
        email: raw.email,
        telefone: digitsTelefone,
        nivelAcessoId: selected.length > 0 ? selected[0] : '',
        secundarioNivelAcessoId: selected.length > 1 ? selected[1] : null,
        status: raw.status,
      });

      this.toastService.success('Usuário atualizado com sucesso!', 'Sucesso');
      await this.carregarDadosUsuario(userId);
      this.modoEdicao.set(false);
    } catch (err) {
      console.error('Erro ao salvar usuário', err);
      this.toastService.error('Erro ao salvar alterações do usuário.', 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }

  abrirAlterarSenha(): void {
    this.showChangePasswordModal.set(false);
    setTimeout(() => this.showChangePasswordModal.set(true), 0);
  }

  async salvarSenha(payload: UsuarioSenhaPayload): Promise<void> {
    if (!this.id()) return;

    try {
      if (payload.forgotPassword && this.isAdmin()) {
        const temp = await this.gestaoUsuariosService.resetarSenha(this.id()!);
        this.toastService.success(`Senha temporária gerada: ${temp}`, 'Sucesso');
      } else {
        await this.gestaoUsuariosService.alterarSenha(this.id()!, {
          oldPassword: payload.currentPassword || '',
          newPassword: payload.newPassword,
          forgotPassword: payload.forgotPassword,
        });
        this.toastService.success('Senha alterada com sucesso!', 'Sucesso');
      }
      this.showChangePasswordModal.set(false);
    } catch (err) {
      console.error('Erro ao alterar senha', err);
      this.toastService.error('Erro ao alterar senha.', 'Erro');
    }
  }

  excluir(): void {
    this.showDeleteConfirmModal.set(true);
  }

  async confirmarExcluir(confirmarFuturos = false): Promise<void> {
    if (!this.id()) return;
    try {
      await this.gestaoUsuariosService.remover(this.id()!, confirmarFuturos);
      this.showDeleteConfirmModal.set(false);
      this.showConfirmarAgendamentosFuturosModal.set(false);
      this.toastService.success('Usuário excluído com sucesso!', 'Sucesso');
      this.voltar();
    } catch (err: unknown) {
      this.showDeleteConfirmModal.set(false);
      if (typeof err === 'object' && err !== null && 'requiresConfirmation' in err) {
        this.mensagemConfirmacaoFuturos.set((err as any).message || '');
        this.showConfirmarAgendamentosFuturosModal.set(true);
        return;
      }
      const mensagem = err instanceof Error ? err.message : 'Erro ao remover usuário.';
      console.error('Erro ao remover usuário', err);
      this.toastService.error(mensagem, 'Erro');
    }
  }

  protected getNomeCompleto(u: Usuario): string {
    if (u.sobrenome) {
      return `${u.nome} ${u.sobrenome}`;
    }
    return u.nome;
  }

  protected obterLinkWhatsapp(celular?: string): string {
    if (!celular) return '#';
    const num = celular.replace(/\D/g, '');
    const comDdi = num.startsWith('55') ? num : `55${num}`;
    return `https://wa.me/${comDdi}`;
  }

  private async carregarDadosUsuario(userId: string): Promise<void> {
    if (this.gestaoUsuariosService.usuarios().length === 0) {
      await this.gestaoUsuariosService.carregarUsuarios();
    }
    const user = this.gestaoUsuariosService.usuarios().find((u: Usuario) => u.id === userId);
    if (user) {
      this.usuario.set(user);
    }
  }

  private formatarTelefone(numero: string): string {
    const digits = numero.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return numero;
  }

  private preencherFormulario(u: Usuario): void {
    const selectedValues: string[] = [];
    if (u.nivelAcessoId) {
      selectedValues.push(u.nivelAcessoId);
    }
    if (u.secundarioNivelAcessoId) {
      selectedValues.push(u.secundarioNivelAcessoId);
    }

    if (selectedValues.length === 0) {
      const userPerfis = (u.perfil || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      for (const pName of userPerfis) {
        const matched = this.perfilOptions().find((n) => n.label === pName || n.value === pName);
        if (matched && !selectedValues.includes(matched.value)) {
          selectedValues.push(matched.value);
        }
      }
    }

    if (selectedValues.length === 0 && this.perfilOptions().length > 0) {
      selectedValues.push(this.perfilOptions()[0].value);
    }

    this.perfisSelecionados.set(selectedValues.slice(0, 2));

    this.form.patchValue({
      nome: u.nome ?? '',
      sobrenome: u.sobrenome ?? '',
      email: u.email ?? '',
      telefone: this.formatarTelefone(u.telefone ?? ''),
      status: u.status ?? 'Ativo',
    });
  }
}