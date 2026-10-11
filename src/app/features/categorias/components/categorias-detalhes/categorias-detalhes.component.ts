import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogoCategoriaService } from '../../../../core/services/catalogo-categoria.service';
import { CatalogoCategoria } from '../../../../core/models/catalogo-categoria/catalogo-categoria.model';
import { CategoriasModalExcluirComponent } from '../modais/categorias-modal-excluir/categorias-modal-excluir.component';

@Component({
  selector: 'app-categorias-detalhes',
  standalone: true,
  imports: [CommonModule, CategoriasModalExcluirComponent],
  templateUrl: './categorias-detalhes.component.html',
  styleUrl: './categorias-detalhes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriasDetalhesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly categoriasService = inject(CatalogoCategoriaService);

  protected readonly categoria = signal<CatalogoCategoria | null>(null);

  protected readonly showModalExcluir = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregarCategoria(id);
    }
  }

  voltar(): void {
    this.router.navigate(['/catalogo/categorias']);
  }

  editar(): void {
    const id = this.categoria()?.id;
    if (id) {
      this.router.navigate(['/catalogo/categorias', id, 'editar']);
    }
  }

  /** Deep-link para o catálogo de serviços filtrado pela categoria (query param `categoria`). */
  verServicos(): void {
    const id = this.categoria()?.id;
    if (id) {
      this.router.navigate(['/servicos/catalogo'], { queryParams: { categoria: id } });
    }
  }

  excluir(): void {
    this.showModalExcluir.set(true);
  }

  cancelarExclusao(): void {
    this.showModalExcluir.set(false);
  }

  async confirmarExcluir(): Promise<void> {
    const categoria = this.categoria();
    if (!categoria) return;

    try {
      await this.categoriasService.remover(categoria.id);
      this.showModalExcluir.set(false);
      this.voltar();
    } catch {
      // O interceptor global já exibe o toast com a mensagem do backend (ex.: categoria com serviços vinculados)
    }
  }

  private async carregarCategoria(id: string): Promise<void> {
    try {
      if (this.categoriasService.categorias().length === 0) {
        await this.categoriasService.carregarCategorias();
      }
      const categoria = this.categoriasService.categorias().find((c) => c.id === id);
      if (categoria) {
        this.categoria.set(categoria);
      } else {
        this.voltar();
      }
    } catch {
      this.voltar();
    }
  }
}
