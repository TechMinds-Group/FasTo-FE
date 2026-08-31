import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TmTextComponent, TmSelectComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sg-plano-editar-x7k9p',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TmTextComponent, TmSelectComponent],
  templateUrl: './sg-plano-editar-x7k9p.component.html',
  styleUrl: './sg-plano-editar-x7k9p.component.scss',
})
export class SgPlanoEditarX7k9pComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(TmToastService);

  protected readonly plano = signal<any | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isSaving = signal(false);
  protected readonly isEditing = signal(false);

  protected readonly cicloOptions = signal<{ value: string; label: string }[]>([
    { value: 'Semanal', label: 'Semanal' },
    { value: 'Mensal', label: 'Mensal' },
    { value: 'Anual', label: 'Anual' },
  ]);

  protected snap: any = null;

  protected readonly form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    descricao: ['', [Validators.maxLength(500)]],
    valor: [0, [Validators.required, Validators.min(0)]],
    ciclo: ['Mensal', [Validators.required]],
    status: ['Ativo'],
    limiteProfissionais: [5, [Validators.required, Validators.min(1)]],
    limiteClientes: [100, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregar(id);
    } else {
      this.voltar();
    }
  }

  carregar(id: string): void {
    this.isLoading.set(true);
    this.authService.getSgPlanoById(id).subscribe({
      next: (p) => {
        this.plano.set(p);
        this.form.patchValue({
          nome: p.nome,
          descricao: p.descricao || '',
          valor: p.valor,
          ciclo: p.ciclo || 'Mensal',
          status: p.status || 'Ativo',
          limiteProfissionais: p.limiteProfissionais,
          limiteClientes: p.limiteClientes,
        });
        this.snap = this.form.getRawValue();
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Erro ao carregar plano.', 'Erro');
        this.voltar();
      }
    });
  }

  protected readonly hasChanges = computed(() => {
    const snap = this.snap;
    if (!snap) { return false; }
    const cur = this.form.getRawValue();
    return JSON.stringify(snap) !== JSON.stringify(cur);
  });

  editar(): void { this.isEditing.set(true); }

  cancelar(): void {
    if (this.snap) { this.form.patchValue(this.snap); }
    this.isEditing.set(false);
  }

  voltar(): void {
    this.router.navigate(['/sg-planos-x7k9p']);
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    try {
      const raw = this.form.value;
      await this.authService.updateSgPlano(this.plano()!.id, {
        nome: raw.nome.trim(),
        descricao: raw.descricao?.trim() || null,
        valor: raw.valor,
        ciclo: raw.ciclo,
        status: raw.status || 'Ativo',
        limiteProfissionais: raw.limiteProfissionais,
        limiteClientes: raw.limiteClientes,
      }).toPromise();

      this.toastService.success('Plano atualizado com sucesso!', 'Sucesso');
      this.isEditing.set(false);
      this.snap = this.form.getRawValue();
    } catch {
      this.toastService.error('Erro ao salvar plano.', 'Erro');
    } finally {
      this.isSaving.set(false);
    }
  }
}