import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import {
  LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip,
  DoughnutController, ArcElement, Legend, BarController, BarElement, PieController
} from 'chart.js';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { AssinantesService } from '../../core/services/assinantes.service';
import { ClubesService } from '../../core/services/clubes.service';
import { ThemeService } from '../../core/services/theme.service';
import { AgendamentosService } from '../../core/services/agendamentos.service';
import { GestaoUsuariosService } from '../../core/services/gestao-usuarios.service';
import { EstabelecimentoService } from '../../core/services/estabelecimento.service';

export type FiltroPeriodo = '7d' | '30d' | '90d' | 'mes' | 'ano';
export type AbaDashboard = 'desempenho' | 'previsao';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  providers: [
    provideCharts({
      registerables: [
        LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip,
        DoughnutController, ArcElement, Legend, BarController, BarElement, PieController
      ]
    })
  ],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent implements OnInit, OnDestroy {
  protected readonly assinantesService = inject(AssinantesService);
  protected readonly clubesService = inject(ClubesService);
  protected readonly themeService = inject(ThemeService);
  protected readonly agendamentosService = inject(AgendamentosService);
  protected readonly gestaoUsuariosService = inject(GestaoUsuariosService);
  protected readonly estabelecimentoService = inject(EstabelecimentoService);

  /** Rótulo customizado para atendente */
  protected readonly rotuloAtendente = signal<string>('Atendente');

  /** ABA ATIVA DA DASHBOARD ('desempenho' | 'previsao') */
  public abaAtiva = signal<AbaDashboard>('desempenho');

  /** FILTROS GLOBAIS ENXUTOS */
  public filtroPeriodo = signal<FiltroPeriodo>('30d');
  public filtroProfissionalId = signal<string>('todos');

  /** SIMULADOR PREDITIVO DE CRESCIMENTO */
  public simularNovosAssinantes = signal<number>(10);
  public simularAumentoTicketPct = signal<number>(0);

  /** EXIBIÇÃO DO POPOVER EXPLICATIVO DA RETENÇÃO DE CLIENTES */
  public exibeAjudaReincidencia = signal<boolean>(false);

  public toggleAjudaReincidencia(event: MouseEvent): void {
    event.stopPropagation();
    this.exibeAjudaReincidencia.update((v) => !v);
  }

  @HostListener('document:click')
  protected fecharPopoversAoClicarFora(): void {
    if (this.exibeAjudaReincidencia()) {
      this.exibeAjudaReincidencia.set(false);
    }
  }

  /** Lista de Profissionais cadastrados para os Filtros */
  protected readonly profissionais = computed(() => this.gestaoUsuariosService.usuarios());

  /** Todos os Agendamentos */
  protected readonly todosAgendamentos = computed(() => this.agendamentosService.agendamentos());

  /** Data limite inicial com base no Filtro de Período selecionado */
  protected readonly dataInicioFiltro = computed(() => {
    const agora = new Date();
    const p = this.filtroPeriodo();
    if (p === '7d') return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 7);
    if (p === '30d') return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 30);
    if (p === '90d') return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 90);
    if (p === 'mes') return new Date(agora.getFullYear(), agora.getMonth(), 1);
    if (p === 'ano') return new Date(agora.getFullYear(), 0, 1);
    return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() - 30);
  });

  /** Agendamentos filtrados por Período e Profissional */
  protected readonly agendamentosFiltrados = computed(() => {
    const inicio = this.dataInicioFiltro();
    const profId = this.filtroProfissionalId();

    return this.todosAgendamentos().filter(a => {
      if (a.dataInicio < inicio) return false;
      if (profId !== 'todos' && a.profissionalId !== profId) return false;
      return true;
    });
  });

  /** Agendamentos Atendidos / Concluídos no Período Filtrado */
  protected readonly agendamentosAtendidos = computed(() => {
    const agora = new Date();
    return this.agendamentosFiltrados().filter(a => {
      const st = a.status;
      if (st === 'nao_compareceu' || st === 'cancelado' || st === 'recusado' || st === 'no-show') return false;
      if (st === 'concluido') return true;
      return a.dataInicio <= agora;
    });
  });

  /** Faturamento total dos Atendimentos Realizados no Período */
  protected readonly faturamentoAtendimentosVal = computed(() =>
    this.agendamentosAtendidos().reduce((sum, a) => sum + (a.preco || 0), 0)
  );

  /** Assinantes Ativos e MRR */
  protected readonly totalAssinantes = computed(() => this.assinantesService.assinantes().length);
  protected readonly assinantesAtivos = computed(() =>
    this.assinantesService.assinantes().filter(a => a.status === 'Ativo')
  );

  protected readonly faturamentoMensalVal = computed(() =>
    this.assinantesAtivos().reduce((sum, a) => sum + a.valor, 0)
  );

  /** Faturamento Total Combinado (Atendimentos + Assinaturas) */
  protected readonly faturamentoTotalCombinadoVal = computed(() =>
    this.faturamentoAtendimentosVal() + this.faturamentoMensalVal()
  );

  protected readonly faturamentoTotalCombinadoFormatted = computed(() =>
    `R$ ${this.faturamentoTotalCombinadoVal().toFixed(2).replace('.', ',')}`
  );

  /** Ticket Médio por Assinante (ARPU) */
  protected readonly ticketMedioVal = computed(() => {
    const count = this.assinantesAtivos().length;
    return count > 0 ? this.faturamentoMensalVal() / count : 0;
  });

  protected readonly ticketMedioFormatted = computed(() =>
    `R$ ${this.ticketMedioVal().toFixed(2).replace('.', ',')}`
  );

  /** Total de Agendamentos Marcados para Hoje */
  protected readonly agendamentosHojeCount = computed(() => {
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

    return this.todosAgendamentos().filter(a =>
      a.dataInicio >= inicioDia && a.dataInicio <= fimDia &&
      a.status !== 'cancelado' && a.status !== 'recusado'
    ).length;
  });

  /** Taxa de Ocupação da Equipe no Dia Atual (%) */
  protected readonly ocupacaoHojePct = computed(() => {
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

    const agendamentosHoje = this.todosAgendamentos().filter(a =>
      a.dataInicio >= inicioDia && a.dataInicio <= fimDia &&
      a.status !== 'cancelado' && a.status !== 'recusado'
    );

    const numProfissionais = Math.max(1, this.profissionais().length);
    const capacidadeMaxMinutos = numProfissionais * 8 * 60; // 8h por barbeiro por dia
    const minutosOcupados = agendamentosHoje.length * 30; // 30min por slot

    return Math.min(100, Math.round((minutosOcupados / capacidadeMaxMinutos) * 100));
  });

  /** RANKING DE PROFISSIONAIS MAIS PRODUTIVOS (ABA 1) */
  protected readonly rankingProfissionais = computed(() => {
    const mapa = new Map<string, { id: string; nome: string; quantidade: number; faturamento: number }>();
    const atendidos = this.agendamentosAtendidos();

    for (const a of atendidos) {
      const id = a.profissionalId || 'sem_id';
      const nome = a.profissionalNome || 'Profissional';
      const atual = mapa.get(id) || { id, nome, quantidade: 0, faturamento: 0 };
      atual.quantidade++;
      atual.faturamento += (a.preco || 0);
      mapa.set(id, atual);
    }

    return Array.from(mapa.values()).sort((a, b) => b.faturamento - a.faturamento);
  });

  /** RANKING DE SERVIÇOS MAIS PROCURADOS (ABA 1) */
  protected readonly rankingServicos = computed(() => {
    const mapa = new Map<string, { nome: string; quantidade: number; faturamento: number }>();
    const atendidos = this.agendamentosAtendidos();

    for (const a of atendidos) {
      const nome = a.servicoNome || 'Serviço';
      const atual = mapa.get(nome) || { nome, quantidade: 0, faturamento: 0 };
      atual.quantidade++;
      atual.faturamento += (a.preco || 0);
      mapa.set(nome, atual);
    }

    return Array.from(mapa.values()).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
  });

  /** LISTA DE FALTAS E CANCELAMENTOS REINCIDENTES (ABA 2) */
  protected readonly clientesFaltasECancelamentos = computed(() => {
    const mapa = new Map<string, { nome: string; telefone: string; faltas: number; cancelamentos: number; total: number }>();

    for (const a of this.todosAgendamentos()) {
      if (a.status === 'nao_compareceu' || a.status === 'no-show' || a.status === 'cancelado' || a.status === 'recusado') {
        const key = a.clienteNome.toLowerCase().trim();
        const atual = mapa.get(key) || { nome: a.clienteNome, telefone: a.clienteTelefone, faltas: 0, cancelamentos: 0, total: 0 };
        if (a.status === 'nao_compareceu' || a.status === 'no-show') {
          atual.faltas++;
        } else {
          atual.cancelamentos++;
        }
        atual.total++;
        mapa.set(key, atual);
      }
    }

    return Array.from(mapa.values()).sort((a, b) => b.total - a.total).slice(0, 6);
  });

  /** SIMULADOR PREDITIVO DE METAS & CRESCIMENTO (ABA 2) */
  protected readonly resultadoSimulacao = computed(() => {
    const mrrAtual = this.faturamentoMensalVal();
    const ticketAtual = this.ticketMedioVal() || 90;

    const novosAssinantes = this.simularNovosAssinantes();
    const aumentoTicketPct = this.simularAumentoTicketPct();

    const novoTicket = ticketAtual * (1 + (aumentoTicketPct / 100));
    const mrrProjetado = (this.assinantesAtivos().length + novosAssinantes) * novoTicket;

    const ganhoMensal = mrrProjetado - mrrAtual;
    const projecao3Meses = mrrAtual + (ganhoMensal * 3);
    const projecao6Meses = mrrAtual + (ganhoMensal * 6);
    const projecao12Meses = mrrProjetado * 12;

    return {
      mrrProjetadoFormatted: `R$ ${mrrProjetado.toFixed(2).replace('.', ',')}`,
      ganhoMensalFormatted: `+R$ ${ganhoMensal.toFixed(2).replace('.', ',')}/mês`,
      projecao3MesesFormatted: `R$ ${projecao3Meses.toFixed(2).replace('.', ',')}`,
      projecao6MesesFormatted: `R$ ${projecao6Meses.toFixed(2).replace('.', ',')}`,
      projecao12MesesFormatted: `R$ ${projecao12Meses.toFixed(2).replace('.', ',')}`,
    };
  });

  /** Agendamentos Futuros Já Confirmados */
  protected readonly agendamentosFuturosConfirmados = computed(() => {
    const agora = new Date();
    const futuros = this.todosAgendamentos().filter(a =>
      a.dataInicio > agora && (a.status === 'confirmado' || a.status === 'agendado')
    );
    const valorFuturo = futuros.reduce((sum, a) => sum + (a.preco || 0), 0);
    return {
      qtd: futuros.length,
      valorFormatted: `R$ ${valorFuturo.toFixed(2).replace('.', ',')}`
    };
  });

  /** Renovações nos Próximos 30 Dias */
  protected readonly renovacoesProximos30Dias = computed(() => {
    const ativos = this.assinantesAtivos();
    const proximos = ativos.filter(a => a.diasRestantes !== undefined && a.diasRestantes <= 30);
    const totalValor = proximos.reduce((sum, a) => sum + a.valor, 0);
    return {
      qtd: proximos.length,
      valorFormatted: `R$ ${totalValor.toFixed(2).replace('.', ',')}`
    };
  });

  // --- GRÁFICOS CHART.JS COM CORES PADRONIZADAS DO SISTEMA ---

  /** 1. Evolução do Faturamento dos Atendimentos (Line Chart) */
  protected readonly lineData = computed(() => {
    const atendidos = this.agendamentosAtendidos();
    const labels: string[] = [];
    const dataReal: number[] = [];
    const hoje = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' });
      labels.push(label.charAt(0).toUpperCase() + label.slice(1, 3));

      const inicioMes = new Date(d.getFullYear(), d.getMonth(), 1);
      const fimDoMes = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const totalMes = atendidos
        .filter(a => a.dataInicio >= inicioMes && a.dataInicio <= fimDoMes)
        .reduce((sum, a) => sum + (a.preco || 0), 0);

      dataReal.push(totalMes);
    }

    return { labels, dataReal };
  });

  public lineChartData = computed<ChartData<'line'>>(() => {
    const isDark = this.themeService.isDarkMode();
    const primaryColor = isDark ? '#60a5fa' : '#0d6efd';
    const { labels, dataReal } = this.lineData();

    return {
      labels,
      datasets: [
        {
          data: dataReal,
          label: 'Faturamento de Atendimentos (R$)',
          fill: true,
          tension: 0.4,
          borderColor: primaryColor,
          backgroundColor: isDark ? 'rgba(96, 165, 250, 0.15)' : 'rgba(13, 110, 253, 0.08)',
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    };
  });

  public lineChartOptions = computed<ChartConfiguration['options']>(() => {
    const isDark = this.themeService.isDarkMode();
    const textColor = isDark ? '#cbd5e1' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: textColor, usePointStyle: true, boxWidth: 8 }
        }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor } }
      }
    };
  });

  /** 2. Atendimentos vs Cancelamentos vs Faltas (Bar Chart) */
  public barChartData = computed<ChartData<'bar'>>(() => {
    const agendamentos = this.agendamentosFiltrados();

    const concluidos = agendamentos.filter(a => a.status === 'concluido' || a.status === 'confirmado').length;
    const cancelados = agendamentos.filter(a => a.status === 'cancelado' || a.status === 'recusado').length;
    const faltas = agendamentos.filter(a => a.status === 'nao_compareceu' || a.status === 'no-show').length;

    return {
      labels: ['Concluídos / Confirmados', 'Cancelados / Recusados', 'Faltas'],
      datasets: [
        {
          label: 'Agendamentos',
          data: [concluidos, cancelados, faltas],
          backgroundColor: ['#198754', '#ef4444', '#ffc107'],
          borderRadius: 8,
        }
      ]
    };
  });

  public barChartOptions = computed<ChartConfiguration['options']>(() => {
    const isDark = this.themeService.isDarkMode();
    const textColor = isDark ? '#cbd5e1' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor } }
      }
    };
  });

  /** 3. Distribuição por Tipo de Atendimento (Doughnut Chart) */
  public doughnutChartData = computed<ChartData<'doughnut'>>(() => {
    const ranking = this.rankingServicos();
    const labels = ranking.map(s => s.nome);
    const data = ranking.map(s => s.quantidade);
    const colors = ['#0d6efd', '#198754', '#ffc107', '#ef4444', '#6f42c1', '#0dcaf0'];

    return {
      labels: labels.length > 0 ? labels : ['Nenhum atendimento'],
      datasets: [{ data: data.length > 0 ? data : [1], backgroundColor: colors }]
    };
  });

  public doughnutChartOptions = computed<ChartConfiguration['options']>(() => {
    const isDark = this.themeService.isDarkMode();
    const textColor = isDark ? '#cbd5e1' : '#64748b';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { color: textColor } }
      }
    };
  });

  async ngOnInit(): Promise<void> {
    this.assinantesService.carregarAssinantes();
    this.clubesService.carregarClubes().subscribe();
    this.agendamentosService.carregarAgendamentos();
    void this.gestaoUsuariosService.carregarUsuarios();

    try {
      const info = await this.estabelecimentoService.carregarInfo();
      if (info && info.rotuloAtendente) {
        this.rotuloAtendente.set(info.rotuloAtendente);
      }
    } catch {
      // Fallback para 'Atendente'
    }
  }

  ngOnDestroy(): void {}
}
