import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TableColumn, TmTableComponent } from '@techminds-group/tm-angular-lib';
import { SolicitacoesWhatsAppService } from '../../../../core/services/solicitacoes-whatsapp.service';
import { SolicitacaoWhatsApp } from '../../../../core/models/solicitacao-whatsapp/solicitacao-whatsapp.model';
import {
  formatarDataHoraSolicitacao,
  obterConfigStatusSolicitacao,
  obterLabelTipoFluxo,
  OPCOES_STATUS_SOLICITACAO,
  OPCOES_TIPO_FLUXO_SOLICITACAO,
} from '../../../../core/models/solicitacao-whatsapp/solicitacao-whatsapp.model';

const FILTRO_TODOS = 'todos';

@Component({
  selector: 'app-solicitacoes',
  standalone: true,
  imports: [CommonModule, FormsModule, TmTableComponent],
  templateUrl: './solicitacoes.component.html',
  styleUrl: './solicitacoes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitacoesComponent implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  protected readonly solicitacoesService = inject(SolicitacoesWhatsAppService);

  @ViewChild('protocoloTemplate', { static: true })
  protocoloTemplate!: TemplateRef<{ $implicit: SolicitacaoWhatsApp }>;
  @ViewChild('tipoTemplate', { static: true })
  tipoTemplate!: TemplateRef<{ $implicit: SolicitacaoWhatsApp }>;
  @ViewChild('clienteTemplate', { static: true })
  clienteTemplate!: TemplateRef<{ $implicit: SolicitacaoWhatsApp }>;
  @ViewChild('celularTemplate', { static: true })
  celularTemplate!: TemplateRef<{ $implicit: SolicitacaoWhatsApp }>;
  @ViewChild('recebidoTemplate', { static: true })
  recebidoTemplate!: TemplateRef<{ $implicit: SolicitacaoWhatsApp }>;
  @ViewChild('statusTemplate', { static: true })
  statusTemplate!: TemplateRef<{ $implicit: SolicitacaoWhatsApp }>;

  protected readonly itens = signal<SolicitacaoWhatsApp[]>([]);
  protected readonly carregando = signal(false);
  protected readonly tamanhoPagina = signal<number>(10);
  protected readonly filtroTipo = signal<string>(FILTRO_TODOS);
  protected readonly filtroStatus = signal<string>(FILTRO_TODOS);

  protected readonly opcoesTipo = OPCOES_TIPO_FLUXO_SOLICITACAO;
  protected readonly opcoesStatus = OPCOES_STATUS_SOLICITACAO;

  protected readonly cols = signal<TableColumn<SolicitacaoWhatsApp>[]>([]);

  ngAfterViewInit(): void {
    this.cols.set([
      { header: 'Protocolo', template: this.protocoloTemplate, width: '15%' },
      { header: 'Tipo', template: this.tipoTemplate, width: '16%' },
      { header: 'Cliente', template: this.clienteTemplate, width: '22%' },
      { header: 'Celular', template: this.celularTemplate, width: '17%' },
      { header: 'Recebido em', template: this.recebidoTemplate, width: '15%' },
      { header: 'Status', template: this.statusTemplate, width: '15%' },
    ]);
  }

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  abrirCadastro(): void {
    this.router.navigate(['/solicitacoes/novo']);
  }

  protected async carregar(): Promise<void> {
    this.carregando.set(true);
    try {
      const resposta = await this.solicitacoesService.listar({
        tipoFluxo: this.filtroTipo(),
        status: this.filtroStatus(),
        page: 1,
        pageSize: 50,
      });
      this.itens.set(resposta.items ?? []);
    } catch {
      console.warn('Solicitações: backend indisponível');
    } finally {
      this.carregando.set(false);
    }
  }

  protected async onFiltroTipo(valor: string | number | null): Promise<void> {
    this.filtroTipo.set(valor === null || valor === '' ? FILTRO_TODOS : String(valor));
    await this.carregar();
  }

  protected async onFiltroStatus(valor: string | number | null): Promise<void> {
    this.filtroStatus.set(valor === null || valor === '' ? FILTRO_TODOS : String(valor));
    await this.carregar();
  }

  protected verDetalhes(solicitacao: SolicitacaoWhatsApp): void {
    this.router.navigate(['/solicitacoes', solicitacao.id], {
      state: { solicitacao },
    });
  }

  protected statusConfig(status: string) {
    return obterConfigStatusSolicitacao(status);
  }

  protected tipoLabel(tipoFluxo: string): string {
    return obterLabelTipoFluxo(tipoFluxo);
  }

  protected recebidoEm(item: SolicitacaoWhatsApp): string {
    return formatarDataHoraSolicitacao(item.createdAtUtc);
  }
}
