import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TmTextComponent, TmSelectComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sg-plano-novo-x7k9p',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TmTextComponent, TmSelectComponent],
  templateUrl: './sg-plano-novo-x7k9p.component.html',
  styleUrl: './sg-plano-novo-x7k9p.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SgPlanoNovoX7k9pComponent {
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(TmToastService);

  protected readonly salvando = signal<boolean>(false);
  protected readonly cicloOptions = signal<{ value: string; label: string }[]>([
    { value: 'Semanal', label: 'Semanal' },
    { value: 'Mensal', label: 'Mensal' },
    { value: 'Anual', label: 'Anual' },
  ]);

  protected readonly form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    descricao: ['', [Validators.maxLength(500)]],
    valor: [0, [Validators.required, Validators.min(0)]],
    ciclo: ['Mensal', [Validators.required]],
    status: ['Ativo'],
    limiteProfissionais: [5, [Validators.required, Validators.min(1)]],
    limiteClientes: [100, [Validators.required, Validators.min(1)]],
  });

  voltar(): void {
    this.router.navigate(['/sg-planos-x7k9p']);
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    try {
      const raw = this.form.value;
      await this.authService.createSgPlano({
        nome: raw.nome.trim(),
        descricao: raw.descricao?.trim() || null,
        valor: raw.valor,
        ciclo: raw.ciclo,
        status: raw.status || 'Ativo',
        limiteProfissionais: raw.limiteProfissionais,
        limiteClientes: raw.limiteClientes,
      }).toPromise();

      this.toastService.success('Plano cadastrado com sucesso!', 'Sucesso');
      this.router.navigate(['/sg-planos-x7k9p']);
    } catch {
      this.toastService.error('Erro ao cadastrar plano.', 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }
}