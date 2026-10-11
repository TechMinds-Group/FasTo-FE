import { ChangeDetectionStrategy, Component, OnInit, inject, signal, ViewChild, TemplateRef, AfterViewInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  TmTableComponent,
  TableColumn,
} from '@techminds-group/tm-angular-lib';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { CatalogoCategoriaService } from '../../../../core/services/catalogo-categoria.service';
import { EstabelecimentoService } from '../../../../core/services/estabelecimento.service';
import { ServicoCatalogo } from '../../../../core/models/catalogo/servico.model';

const FILTRO_TODAS_CATEGORIAS = 'todas';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TmTableComponent,
  ],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogoComponent implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly catalogoService = inject(CatalogoService);
  protected readonly categoriasService = inject(CatalogoCategoriaService);
  protected readonly estabelecimentoService = inject(EstabelecimentoService);

  @ViewChild('servicoTemplate', { static: true }) servicoTemplate!: TemplateRef<{ $implicit: ServicoCatalogo }>;
  @ViewChild('categoriaTemplate', { static: true }) categoriaTemplate!: TemplateRef<{ $implicit: ServicoCatalogo }>;
  @ViewChild('precoTemplate', { static: true }) precoTemplate!: TemplateRef<{ $implicit: ServicoCatalogo }>;
  @ViewChild('duracaoTemplate', { static: true }) duracaoTemplate!: TemplateRef<{ $implicit: ServicoCatalogo }>;
  @ViewChild('statusTemplate', { static: true }) statusTemplate!: TemplateRef<{ $implicit: ServicoCatalogo }>;

  protected readonly cols = signal<TableColumn<ServicoCatalogo>[]>([]);
  protected readonly tamanhoPagina = signal<number>(5);

  /** Filtro corrente, sincronizado com o query param `?categoria={id}` (deep-link da tela de Categorias). */
  protected readonly filtroCategoria = signal<string>(FILTRO_TODAS_CATEGORIAS);

  protected readonly servicosFiltrados = computed(() => {
    const filtro = this.filtroCategoria();
    const servicos = this.catalogoService.servicos();
    if (filtro === FILTRO_TODAS_CATEGORIAS) return servicos;
    return servicos.filter((s) => s.categoriaId === filtro);
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const categoria = params.get('categoria');
      this.filtroCategoria.set(categoria ?? FILTRO_TODAS_CATEGORIAS);
    });
  }

  ngAfterViewInit(): void {
    this.cols.set([
      { header: 'Serviço', template: this.servicoTemplate, width: '34%' },
      { header: 'Categoria', template: this.categoriaTemplate, width: '20%' },
      { header: 'Preço', template: this.precoTemplate, width: '16%' },
      { header: 'Duração', template: this.duracaoTemplate, width: '14%' },
      { header: 'Status', template: this.statusTemplate, width: '16%' },
    ]);
  }

  async ngOnInit(): Promise<void> {
    try {
      await this.catalogoService.carregarServicos();
    } catch {
      console.warn('Catálogo: backend indisponível');
    }

    if (this.categoriasService.categorias().length === 0) {
      this.categoriasService.carregarCategorias().catch(() => undefined);
    }
  }

  /** Reflete o filtro na URL (query param `categoria`) para manter o deep-link consistente. */
  onFiltroCategoria(valor: string | number | null): void {
    const categoria = valor === null || valor === '' || valor === FILTRO_TODAS_CATEGORIAS ? null : String(valor);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { categoria },
      queryParamsHandling: 'merge',
    });
  }

  abrirNovo(): void {
    this.router.navigate(['/servicos/catalogo/novo']);
  }

  verDetalhes(servico: ServicoCatalogo): void {
    this.router.navigate(['/servicos/catalogo', servico.id]);
  }
}
