import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TmModalComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-sg-plano-editar-x7k9p',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TmModalComponent],
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
  protected readonly isLoading = signal<boolean>(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly modoEdicao = signal<boolean>(false);
  protected readonly salvando = signal<boolean>(false);
  protected readonly isNovo = signal<boolean>(false);

  protected readonly initialFormValues = signal<any>({});
  protected readonly showDeleteModal = signal<boolean>(false);

  protected readonly cicloOptions = signal<{ value: string; label: string }[]>([
    { value: 'Semanal', label: 'Semanal' },
    { value: 'Mensal', label: 'Mensal' },
    { value: 'Anual', label: 'Anual' },
  ]);

  protected readonly statusOptions = signal<{ value: string; label: string }[]>([
    { value: 'Ativo', label: 'Ativo' },
    { value: 'Inativo', label: 'Inativo' },
  ]);

  protected readonly temAlteracoes = computed(() => {
    if (this.isNovo()) return true;
    if (!this.modoEdicao()) return false;

    const current = this.form.value;
    const init = this.initialFormValues();
    return Object.keys(current).some(key => (current[key] ?? '') !== (init[key] ?? ''));
  });

  protected readonly form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    descricao: ['', [Validators.maxLength(500)]],
    valor: [0, [Validators.required, Validators.min(0)]],
    ciclo: ['Mensal', [Validators.required]],
    status: ['Ativo', [Validators.required]],
    limiteProfissionais: [5, [Validators.required, Validators.min(1)]],
    limiteClientes: [100, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'novo') {
      this.isNovo.set(true);
      this.modoEdicao.set(true);
      this.isLoading.set(false);
      this.form.patchValue({
        nome: '',
        descricao: '',
        valor: 0,
        ciclo: 'Mensal',
        status: 'Ativo',
        limiteProfissionais: 5,
        limiteClientes: 100,
      });
      this.initialFormValues.set(this.form.value);
    } else {
      this.carregarPlano(id);
    }
  }

  carregarPlano(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.getSgPlanoById(id).subscribe({
      next: (data) => {
        this.plano.set(data);
        this.form.patchValue({
          nome: data.nome || '',
          descricao: data.descricao || '',
          valor: data.valor ?? 0,
          ciclo: data.ciclo || 'Mensal',
          status: data.status || 'Ativo',
          limiteProfissionais: data.limiteProfissionais ?? 5,
          limiteClientes: data.limiteClientes ?? 100,
        });

        this.initialFormValues.set(this.form.value);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Falha ao carregar detalhes do plano.');
        this.isLoading.set(false);
      }
    });
  }

  habilitarEdicao(): void {
    this.modoEdicao.set(true);
  }

  cancelarEdicao(): void {
    if (this.isNovo()) {
      this.voltar();
    } else {
      this.modoEdicao.set(false);
      if (this.plano()) {
        this.carregarPlano(this.plano().id);
      }
    }
  }

  async salvarGeral(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Preencha os campos obrigatórios.', 'Atenção');
      return;
    }

    this.salvando.set(true);
    try {
      const raw = this.form.value;
      const payload = {
        nome: raw.nome.trim(),
        descricao: raw.descricao?.trim() || null,
        valor: raw.valor,
        ciclo: raw.ciclo,
        status: raw.status || 'Ativo',
        limiteProfissionais: raw.limiteProfissionais,
        limiteClientes: raw.limiteClientes,
      };

      if (this.isNovo()) {
        const res = await this.authService.createSgPlano(payload).toPromise();
        this.toastService.success(`Plano '${res.nome}' criado com sucesso!`, 'Sucesso');
        this.router.navigate(['/sg-plano-editar-x7k9p', res.id]);
      } else {
        const p = this.plano();
        await this.authService.updateSgPlano(p.id, payload).toPromise();
        this.toastService.success(`Plano '${raw.nome}' atualizado com sucesso!`, 'Sucesso');
        this.carregarPlano(p.id);
        this.modoEdicao.set(false);
      }
    } catch {
      this.toastService.error('Erro ao salvar plano.', 'Erro');
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
    const p = this.plano();
    if (!p) return;

    this.salvando.set(true);
    try {
      await this.authService.deleteSgPlano(p.id).toPromise();
      this.showDeleteModal.set(false);
      this.toastService.success('Plano excluído com sucesso!', 'Sucesso');
      this.voltar();
    } catch {
      this.toastService.error('Erro ao excluir plano.', 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }

  voltar(): void {
    this.router.navigate(['/sg-planos-x7k9p']);
  }
}