import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  TmSelectComponent,
  TmSelectOption,
  TmTextComponent,
  TmToastService,
} from '@techminds-group/tm-angular-lib';
import { CatalogoCategoriaService } from '../../../../core/services/catalogo-categoria.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-categorias-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TmTextComponent, TmSelectComponent],
  templateUrl: './categorias-form.component.html',
  styleUrl: './categorias-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriasFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly categoriasService = inject(CatalogoCategoriaService);
  private readonly toastService = inject(TmToastService);
  protected readonly themeService = inject(ThemeService);

  protected readonly modoEdicao = signal<boolean>(false);
  protected readonly salvando = signal<boolean>(false);
  private readonly categoriaId = signal<string | null>(null);

  protected readonly form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    icone: ['', [Validators.maxLength(10)]],
    ordem: [0, [Validators.required, Validators.min(0)]],
    status: ['Ativo', [Validators.required]],
  });

  protected readonly statusOptions: TmSelectOption[] = [
    { value: 'Ativo', label: 'Ativo' },
    { value: 'Inativo', label: 'Inativo' },
  ];

  protected readonly titulo = computed(() => (this.modoEdicao() ? 'Editar Categoria' : 'Nova Categoria'));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.modoEdicao.set(true);
    this.categoriaId.set(id);
    void this.carregarCategoria(id);
  }

  voltar(): void {
    this.router.navigate(['/catalogo/categorias']);
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    try {
      const val = this.form.getRawValue();
      const payload = {
        nome: val.nome,
        icone: val.icone?.trim() || null,
        ordem: val.ordem === '' || val.ordem === null ? 0 : Number(val.ordem),
        status: val.status,
      };

      if (this.modoEdicao()) {
        await this.categoriasService.atualizar(this.categoriaId()!, payload);
        this.toastService.success('Categoria atualizada com sucesso!', 'Sucesso');
      } else {
        await this.categoriasService.adicionar(payload);
        this.toastService.success('Categoria cadastrada com sucesso!', 'Sucesso');
      }
      this.voltar();
    } catch {
      // O interceptor global já exibe o toast de erro amigável
    } finally {
      this.salvando.set(false);
    }
  }

  private async carregarCategoria(id: string): Promise<void> {
    try {
      if (this.categoriasService.categorias().length === 0) {
        await this.categoriasService.carregarCategorias();
      }
      const categoria = this.categoriasService.categorias().find((c) => c.id === id);
      if (!categoria) {
        this.voltar();
        return;
      }

      this.form.patchValue({
        nome: categoria.nome,
        icone: categoria.icone ?? '',
        ordem: categoria.ordem,
        status: categoria.status,
      });
    } catch {
      this.voltar();
    }
  }
}
