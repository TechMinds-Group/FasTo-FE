import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TmButtonComponent, TmSelectComponent, TmTextComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { ThemeService } from '../../../../core/services/theme.service';
import { SolicitacoesWhatsAppService } from '../../../../core/services/solicitacoes-whatsapp.service';
import { CatalogoCategoriaService } from '../../../../core/services/catalogo-categoria.service';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { ServicoCatalogo } from '../../../../core/models/catalogo/servico.model';

@Component({
  selector: 'app-solicitacoes-novo',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TmTextComponent, TmSelectComponent, TmButtonComponent],
  templateUrl: './solicitacoes-novo.component.html',
  styleUrl: './solicitacoes-novo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitacoesNovoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toastService = inject(TmToastService);
  private readonly solicitacoesService = inject(SolicitacoesWhatsAppService);
  protected readonly themeService = inject(ThemeService);
  protected readonly categoriasService = inject(CatalogoCategoriaService);
  protected readonly catalogoService = inject(CatalogoService);

  protected readonly salvando = signal(false);
  protected readonly categoriaSelecionada = signal<string>('');

  protected readonly servicosDaCategoria = computed<ServicoCatalogo[]>(() => {
    const categoriaId = this.categoriaSelecionada();
    if (!categoriaId) {
      return [];
    }

    return this.catalogoService.servicos().filter((serv) => serv.categoriaId === categoriaId);
  });

  protected readonly categoriasOptions = computed(() =>
    this.categoriasService.categorias().map((categoria) => ({
      value: categoria.id,
      label: `${categoria.icone ? categoria.icone + ' ' : ''}${categoria.nome}`,
    })),
  );

  protected readonly servicosOptions = computed(() =>
    this.servicosDaCategoria().map((serv) => ({ value: serv.id, label: serv.nome })),
  );

  protected readonly form = this.fb.group({
    nomeCliente: ['', Validators.required],
    celular: ['', Validators.required],
    email: [''],
    categoriaId: ['', Validators.required],
    servicoId: ['', Validators.required],
    descricao: ['', Validators.required],
  });

  ngOnInit(): void {
    this.categoriasService.carregarCategorias().catch(() => {});
    this.catalogoService.carregarServicos().catch(() => {});

    // Categoria muda => limpa o serviço selecionado (cascata)
    this.form.get('categoriaId')?.valueChanges.subscribe((valor) => {
      this.categoriaSelecionada.set(typeof valor === 'string' ? valor : '');
      this.form.get('servicoId')?.setValue('');
    });
  }

  voltar(): void {
    this.router.navigate(['/solicitacoes']);
  }

  async salvar(): Promise<void> {
    if (this.form.invalid || this.salvando()) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    try {
      const raw = this.form.value;
      await this.solicitacoesService.cadastrar({
        nomeCliente: (raw.nomeCliente ?? '').trim(),
        celular: (raw.celular ?? '').trim(),
        email: (raw.email ?? '').trim() || null,
        categoriaId: raw.categoriaId ?? '',
        servicoId: raw.servicoId ?? '',
        descricao: (raw.descricao ?? '').trim(),
      });
      this.toastService.success('Solicitação cadastrada com protocolo! Os profissionais foram avisados.', 'Sucesso');
      this.voltar();
    } catch (erro) {
      const mensagem = (erro as { error?: { error?: string } })?.error?.error || 'Erro ao cadastrar a solicitação.';
      this.toastService.error(mensagem, 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }
}
