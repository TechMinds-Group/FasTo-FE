import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, inject, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective, provideCharts } from 'ng2-charts';
import {
  LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip,
  DoughnutController, ArcElement, Legend, BarController, BarElement
} from 'chart.js';
import type { ChartConfiguration, ChartData } from 'chart.js';
import { ThemeService } from '../../core/services/theme.service';
import { AgendamentosService } from '../../core/services/agendamentos.service';
import { GestaoUsuariosService } from '../../core/services/gestao-usuarios.service';
import { EstabelecimentoService } from '../../core/services/estabelecimento.service';

export type FiltroPeriodo = '7d' | '30d' | '90d' | 'mes' | 'ano';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  providers: [
    provideCharts({
      registerables: [
        LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip,
        DoughnutController, ArcElement, Legend, BarController, BarElement
      ]
    })
  ],
  templateUrl: './inicio.component.html',
  styleUrl: './inicio.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent implements OnInit, OnDestroy {
  protected readonly themeService = inject(ThemeService);
  protected readonly agendamentosService = inject(AgendamentosService);
  protected readonly gestaoUsuariosService = inject(GestaoUsuariosService);
  protected readonly estabelecimentoService = inject(EstabelecimentoService);

  protected readonly rotuloAtendente = signal<string>('Atendente');

  public filtroPeriodo = signal<FiltroPeriodo>('30d');
  public filtroProfissionalId = signal<string>('todos');

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

  protected readonly profissionais = computed(() => this.gestaoUsuariosService.usuarios());
  protected readonly todosAgendamentos = computed(() => this.agendamentosService.agendamentos());

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

  protected readonly agendamentosFiltrados = computed(() => {
    const inicio = this.dataInicioFiltro();
    const profId = this.filtroProfissionalId();
    return this.todosAgendamentos().filter(a => {
      if (a.dataInicio < inicio) return false;
      if (profId !== 'todos' && a.profissionalId !== profId) return false;
      return true;
    });
  });

  protected readonly agendamentosAtendidos = computed(() => {
    const agora = new Date();
    return this.agendamentosFiltrados().filter(a => {
      const st = a.status;
      if (st === 'nao_compareceu' || st === 'cancelado' || st === 'recusado' || st === 'no-show') return false;
      if (st === 'concluido') return true;
      return a.dataInicio <= agora;
    });
  });

  protected readonly agendamentosHojeCount = computed(() => {
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
    return this.todosAgendamentos().filter(a =>
      a.dataInicio >= inicioDia && a.dataInicio <= fimDia &&
      a.status !== 'cancelado' && a.status !== 'recusado'
    ).length;
  });

  protected readonly ocupacaoHojePct = computed(() => {
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

    const agendamentosHoje = this.todosAgendamentos().filter(a =>
      a.dataInicio >= inicioDia && a.dataInicio <= fimDia &&
      a.status !== 'cancelado' && a.status !== 'recusado'
    );

    const numProfissionais = Math.max(1, this.profissionais().length);
    const capacidadeMaxMinutos = numProfissionais * 8 * 60;
    const minutosOcupados = agendamentosHoje.length * 30;

    return Math.min(100, Math.round((minutosOcupados / capacidadeMaxMinutos) * 100));
  });

  protected readonly rankingProfissionais = computed(() => {
    const mapa = new Map<string, { id: string; nome: string; quantidade: number }>();
    const atendidos = this.agendamentosAtendidos();

    for (const a of atendidos) {
      const id = a.profissionalId || 'sem_id';
      const nome = a.profissionalNome || 'Profissional';
      const atual = mapa.get(id) || { id, nome, quantidade: 0 };
      atual.quantidade++;
      mapa.set(id, atual);
    }

    return Array.from(mapa.values()).sort((a, b) => b.quantidade - a.quantidade);
  });

  protected readonly rankingServicos = computed(() => {
    const mapa = new Map<string, { nome: string; quantidade: number }>();
    const atendidos = this.agendamentosAtendidos();

    for (const a of atendidos) {
      const nome = a.servicoNome || 'Serviço';
      const atual = mapa.get(nome) || { nome, quantidade: 0 };
      atual.quantidade++;
      mapa.set(nome, atual);
    }

    return Array.from(mapa.values()).sort((a, b) => b.quantidade - a.quantidade).slice(0, 5);
  });

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

      const totalMes = atendidos.filter(a => a.dataInicio >= inicioMes && a.dataInicio <= fimDoMes).length;
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
          label: 'Atendimentos Realizados',
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
        legend: { display: true, position: 'top', labels: { color: textColor, usePointStyle: true, boxWidth: 8 } }
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, beginAtZero: true, stepSize: 1 } }
      }
    };
  });

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
        y: { grid: { color: gridColor }, ticks: { color: textColor, beginAtZero: true, stepSize: 1 } }
      }
    };
  });

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
      plugins: { legend: { position: 'bottom', labels: { color: textColor } } }
    };
  });

  async ngOnInit(): Promise<void> {
    this.agendamentosService.carregarAgendamentos();
    void this.gestaoUsuariosService.carregarUsuarios();

    try {
      const info = await this.estabelecimentoService.carregarInfo();
      if (info && info.rotuloAtendente) {
        this.rotuloAtendente.set(info.rotuloAtendente);
      }
    } catch {
      // Fallback
    }
  }

  ngOnDestroy(): void {}
}