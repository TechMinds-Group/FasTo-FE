import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TmTextComponent, TmSelectComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sg-usuario-novo-x7k9p',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TmTextComponent, TmSelectComponent, TranslatePipe],
  templateUrl: './sg-usuario-novo-x7k9p.component.html',
  styleUrl: './sg-usuario-novo-x7k9p.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SgUsuarioNovoX7k9pComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(TmToastService);
  protected readonly themeService = inject(ThemeService);

  protected readonly empresaId = signal<string>('');
  protected readonly nomeEmpresa = signal<string>('');
  protected readonly salvando = signal<boolean>(false);
  protected readonly perfilOptions = signal<{ value: string; label: string }[]>([]);
  protected readonly perfisSelecionados = signal<string[]>([]);

  protected readonly form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(60)]],
    sobrenome: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required]],
    telefone: ['', [Validators.required, Validators.maxLength(15)]],
    perfil: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.empresaId.set(id);
      this.carregarNiveis(id);
    } else {
      this.toastService.error('Identificador da empresa inválido.', 'Erro');
      this.voltar();
    }
  }

  private async carregarNiveis(empresaId: string): Promise<void> {
    try {
      this.authService.getSgNiveisAcesso(empresaId).subscribe({
        next: (niveis) => {
          const options = niveis.map((n: any) => ({
            value: n.id,
            label: n.nome,
          }));
          this.perfilOptions.set(options);
          if (options.length > 0) {
            this.perfisSelecionados.set([options[0].value]);
            this.form.patchValue({ perfil: options[0].value });
          }
        },
        error: () => {
          this.toastService.error('Falha ao carregar níveis de acesso.', 'Erro');
        }
      });
    } catch {
      this.toastService.error('Falha ao carregar níveis de acesso.', 'Erro');
    }
  }

  voltar(): void {
    const id = this.empresaId();
    if (id) {
      this.router.navigate(['/sg-estabelecimento-detalhes-x7k9p', id]);
    } else {
      this.router.navigate(['/sg-estabelecimentos-x7k9p']);
    }
  }

  onPerfisChange(val: unknown): void {
    if (Array.isArray(val)) {
      let selected = val as string[];
      if (selected.length > 2) {
        selected = selected.slice(0, 2);
      }
      if (selected.length === 0 && this.perfilOptions().length > 0) {
        selected = [this.perfilOptions()[0].value];
      }
      this.perfisSelecionados.set(selected);
      this.form.patchValue({ perfil: selected.length > 0 ? selected[0] : '' });
    }
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    try {
      const raw = this.form.value;
      const selected = this.perfisSelecionados();
      const result = await this.authService.createSgUsuario(this.empresaId(), {
        nome: raw.nome,
        sobrenome: raw.sobrenome,
        email: raw.email,
        senha: raw.senha,
        telefone: (raw.telefone ?? '').replace(/\D/g, ''),
        nivelAcessoId: selected.length > 0 ? selected[0] : (this.perfilOptions()[0]?.value || ''),
        secundarioNivelAcessoId: selected.length > 1 ? selected[1] : null,
      }).toPromise();

      this.toastService.success(`Usuário "${raw.nome}" cadastrado com sucesso!`, 'Sucesso');
      this.router.navigate(['/sg-estabelecimento-detalhes-x7k9p', this.empresaId()]);
    } catch {
      this.toastService.error('Erro ao cadastrar usuário.', 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }
}