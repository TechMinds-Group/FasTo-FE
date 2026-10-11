import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  TmTableComponent,
  TableColumn,
} from '@techminds-group/tm-angular-lib';
import { CatalogoCategoriaService } from '../../../../core/services/catalogo-categoria.service';
import { CatalogoCategoria } from '../../../../core/models/catalogo-categoria/catalogo-categoria.model';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
    TmTableComponent,
  ],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriasComponent implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  protected readonly categoriasService = inject(CatalogoCategoriaService);

  @ViewChild('iconeTemplate', { static: true }) iconeTemplate!: TemplateRef<{ $implicit: CatalogoCategoria }>;
  @ViewChild('nomeTemplate', { static: true }) nomeTemplate!: TemplateRef<{ $implicit: CatalogoCategoria }>;
  @ViewChild('ordemTemplate', { static: true }) ordemTemplate!: TemplateRef<{ $implicit: CatalogoCategoria }>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<{ $implicit: CatalogoCategoria }>;
  @ViewChild('quantidadeTemplate', { static: true }) quantidadeTemplate!: TemplateRef<{ $implicit: CatalogoCategoria }>;

  protected readonly cols = signal<TableColumn<CatalogoCategoria>[]>([]);
  protected readonly tamanhoPagina = signal<number>(5);

  ngAfterViewInit(): void {
    this.cols.set([
      { header: 'Emoji', template: this.iconeTemplate, width: '10%' },
      { header: 'Nome', template: this.nomeTemplate, width: '40%' },
      { header: 'Ordem', template: this.ordemTemplate, width: '12%' },
      { header: 'Status', template: this.statusTemplate, width: '18%' },
      { header: 'Serviços', template: this.quantidadeTemplate, width: '20%' },
    ]);
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.categoriasService.carregarCategorias();
    } catch {
      console.warn('Categorias: backend indisponível');
    }
  }

  abrirNova(): void {
    this.router.navigate(['/catalogo/categorias/novo']);
  }

  verDetalhes(categoria: CatalogoCategoria): void {
    this.router.navigate(['/catalogo/categorias', categoria.id]);
  }
}
