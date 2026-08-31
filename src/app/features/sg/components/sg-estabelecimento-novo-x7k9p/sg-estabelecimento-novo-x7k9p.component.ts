import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TmTextComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sg-estabelecimento-novo-x7k9p',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TmTextComponent],
  templateUrl: './sg-estabelecimento-novo-x7k9p.component.html',
  styleUrl: './sg-estabelecimento-novo-x7k9p.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SgEstabelecimentoNovoX7k9pComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(TmToastService);

  protected readonly salvando = signal<boolean>(false);

  protected readonly form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    nomeExibicao: ['', [Validators.maxLength(100)]],
    cnpj: ['', [Validators.maxLength(18)]],
    telefone: ['', [Validators.maxLength(20)]],
  });

  voltar(): void {
    this.router.navigate(['/sg-estabelecimentos-x7k9p']);
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    try {
      const raw = this.form.value;
      const result = await this.authService.createSgEmpresa({
        nome: raw.nome.trim(),
        nomeExibicao: raw.nomeExibicao?.trim() || null,
        cnpj: (raw.cnpj ?? '').replace(/\D/g, ''),
        telefone: (raw.telefone ?? '').replace(/\D/g, '')
      }).toPromise();

      this.toastService.success(
        `Estabelecimento "${raw.nome}" cadastrado com sucesso!`,
        'Sucesso'
      );
      this.router.navigate(['/sg-estabelecimento-detalhes-x7k9p', result.id]);
    } catch {
      this.toastService.error('Erro ao cadastrar estabelecimento.', 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }
}