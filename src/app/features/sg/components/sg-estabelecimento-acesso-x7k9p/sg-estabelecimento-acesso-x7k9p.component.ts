import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TmToastService } from '@techminds-group/tm-angular-lib';
import { AuthService } from '../../../../core/services/auth.service';

interface FluxoItem {
  chave: string;
  ativo: boolean;
  label: string;
  descricao: string;
  fluxoMensagens: string;
  badgeBg: string;
  icon: string;
}

const ORDEM_PADRAO: string[] = [
  'agendar_site', 'agendar_whatsapp', 'meus_agendamentos', 'atendente',
  'orcamento', 'pedido', 'suporte',
  'precadastro', 'consultar_status', 'enviar_documentos',
  'consultar_estoque', 'agendar_visita', 'simular'
];

const FLUXO_DEFS: Record<string, Omit<FluxoItem, 'ativo'>> = {
  agendar_site: {
    chave: 'agendar_site', label: 'Agendar no Site',
    descricao: 'Cliente recebe o link do portal web para agendar online.',
    fluxoMensagens: '➜ Envia link de agendamento do estabelecimento',
    badgeBg: 'bg-primary', icon: 'fas fa-globe'
  },
  agendar_whatsapp: {
    chave: 'agendar_whatsapp', label: 'Agendar por WhatsApp',
    descricao: 'Fluxo completo de agendamento dentro do chat.',
    fluxoMensagens: '➜ Identificação (cliente já cadastrado?) ➜ Escolher profissional ➜ Escolher serviço ➜ Escolher dia ➜ Escolher horário ➜ Confirmar',
    badgeBg: 'bg-success', icon: 'fab fa-whatsapp'
  },
  meus_agendamentos: {
    chave: 'meus_agendamentos', label: 'Meus Agendamentos',
    descricao: 'Consultar, remarcar ou cancelar agendamentos ativos.',
    fluxoMensagens: '➜ Lista agendamentos futuros ➜ Seleciona um ➜ Cancelar ou Remarcar (data + horário)',
    badgeBg: 'bg-info', icon: 'fas fa-calendar-check'
  },
  atendente: {
    chave: 'atendente', label: 'Falar com Atendente',
    descricao: 'Transfere para a equipe de atendimento humano.',
    fluxoMensagens: '➜ Ativa modo humano por 4h ➜ Profissional responde diretamente',
    badgeBg: 'bg-warning', icon: 'fas fa-headset'
  },
  orcamento: {
    chave: 'orcamento', label: 'Solicitar Orçamento',
    descricao: 'Cliente descreve o que precisa. Equipe recebe a solicitação.',
    fluxoMensagens: '➜ Pergunta configurável ➜ Cliente descreve ➄ Nome (se novo) ➜ Salva e notifica equipe',
    badgeBg: 'bg-primary', icon: 'fas fa-dollar-sign'
  },
  pedido: {
    chave: 'pedido', label: 'Fazer um Pedido',
    descricao: 'Cliente descreve o pedido. Equipe confirma.',
    fluxoMensagens: '➜ Pergunta configurável ➜ Cliente descreve ➜ Nome (se novo) ➜ Salva e notifica equipe',
    badgeBg: 'bg-success', icon: 'fas fa-box'
  },
  suporte: {
    chave: 'suporte', label: 'Suporte / Chamado',
    descricao: 'Cliente descreve problema. Equipe técnica é notificada.',
    fluxoMensagens: '➜ Pergunta configurável ➜ Cliente descreve ➜ Nome (se novo) ➜ Salva e notifica equipe',
    badgeBg: 'bg-danger', icon: 'fas fa-tools'
  },
  precadastro: {
    chave: 'precadastro', label: 'Pré-cadastro',
    descricao: 'Multi-step que gera lead estruturado.',
    fluxoMensagens: '➜ Nome completo ➜ Email (ou pular) ➜ Descrição do que precisa ➜ Salva e notifica equipe',
    badgeBg: 'bg-info', icon: 'fas fa-clipboard-list'
  },
  consultar_status: {
    chave: 'consultar_status', label: 'Consultar Status',
    descricao: 'Cliente informa protocolo. Sistema registra a consulta.',
    fluxoMensagens: '➜ Cliente informa código/protocolo ➜ Salva e notifica equipe',
    badgeBg: 'bg-secondary', icon: 'fas fa-search'
  },
  enviar_documentos: {
    chave: 'enviar_documentos', label: 'Enviar Documentos',
    descricao: 'Cliente descreve o documento. Equipe é notificada.',
    fluxoMensagens: '➜ Pergunta configurável ➜ Cliente descreve ➜ Nome (se novo) ➜ Salva e notifica equipe',
    badgeBg: 'bg-purple', icon: 'fas fa-file-alt'
  },
  consultar_estoque: {
    chave: 'consultar_estoque', label: 'Consultar Estoque',
    descricao: 'Cliente pergunta disponibilidade de produto.',
    fluxoMensagens: '➜ Pergunta configurável ➜ Cliente informa produto ➜ Nome (se novo) ➜ Salva e notifica equipe',
    badgeBg: 'bg-warning', icon: 'fas fa-boxes'
  },
  agendar_visita: {
    chave: 'agendar_visita', label: 'Agendar Visita Técnica',
    descricao: 'Cliente descreve serviço + endereço para visita.',
    fluxoMensagens: '➜ Descreve o serviço ➜ Informa o endereço ➜ Nome (se novo) ➜ Salva e notifica equipe',
    badgeBg: 'bg-success', icon: 'fas fa-map-marker-alt'
  },
  simular: {
    chave: 'simular', label: 'Simular / Calcular',
    descricao: 'Cliente informa parâmetros para orçamento estimado.',
    fluxoMensagens: '➜ Pergunta configurável ➜ Cliente informa detalhes ➜ Nome (se novo) ➜ Salva e notifica equipe',
    badgeBg: 'bg-purple', icon: 'fas fa-calculator'
  },
  triagem_advocacia: {
    chave: 'triagem_advocacia', label: 'Triagem Jurídica por Área',
    descricao: 'Triagem interativa por áreas jurídicas (Trabalhista, Família, Cível, Previdenciário, Urgências).',
    fluxoMensagens: '➜ Pergunta área jurídica ➜ Pergunta situação do caso ➜ Coleta resumo/documentos ➜ Encaminha atendimento qualificado',
    badgeBg: 'bg-warning', icon: 'fas fa-balance-scale'
  }
};

const CHAVE_TO_PROP: Record<string, string> = {
  agendar_site: 'opc1AgendarSite',
  agendar_whatsapp: 'opc2AgendarWhatsapp',
  meus_agendamentos: 'opc3MeusAgendamentos',
  atendente: 'opc6Atendente',
  orcamento: 'opc4Orcamento',
  pedido: 'opc5Pedido',
  suporte: 'opc6Suporte',
  precadastro: 'opc7PreCadastro',
  consultar_status: 'opc8ConsultarStatus',
  enviar_documentos: 'opc9EnviarDocumentos',
  consultar_estoque: 'opc10ConsultarEstoque',
  agendar_visita: 'opc11AgendarVisita',
  simular: 'opc12Simular',
  triagem_advocacia: 'opc13TriagemAdvocacia'
};

interface FluxosSnapshot {
  fluxos: FluxoItem[];
  opc4Lembretes: boolean;
  opc5Confirmacao: boolean;
}

@Component({
  selector: 'app-sg-estabelecimento-acesso-x7k9p',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './sg-estabelecimento-acesso-x7k9p.component.html',
  styleUrl: './sg-estabelecimento-acesso-x7k9p.component.scss'
})
export class SgEstabelecimentoAcessoX7k9pComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(TmToastService);

  protected empresaId = signal<string>('');
  protected nomeEmpresa = signal<string>('');
  protected isLoading = signal<boolean>(true);
  protected isSaving = signal<boolean>(false);

  protected fluxos = signal<FluxoItem[]>([]);
  protected opc4Lembretes = signal<boolean>(true);
  protected opc5Confirmacao = signal<boolean>(true);

  private snapshot = signal<FluxosSnapshot | null>(null);

  protected isEditing = computed(() => {
    const snap = this.snapshot();
    if (!snap) { return false; }
    const current = this.fluxos();
    if (current.length !== snap.fluxos.length) { return true; }
    for (let i = 0; i < current.length; i++) {
      if (current[i].chave !== snap.fluxos[i].chave) { return true; }
      if (current[i].ativo !== snap.fluxos[i].ativo) { return true; }
    }
    if (this.opc4Lembretes() !== snap.opc4Lembretes) { return true; }
    if (this.opc5Confirmacao() !== snap.opc5Confirmacao) { return true; }
    return false;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.empresaId.set(id);
      this.carregarFluxos(id);
    } else {
      this.toastService.error('Identificador da empresa inválido.', 'Erro');
      this.isLoading.set(false);
    }
  }

  carregarFluxos(id: string): void {
    this.isLoading.set(true);

    this.authService.getSgFluxosWhatsApp(id).subscribe({
      next: (res) => {
        this.nomeEmpresa.set(res.nomeEmpresa || 'Estabelecimento');
        const f: Record<string, unknown> = (res.fluxos as Record<string, unknown>) || {};

        this.opc4Lembretes.set(this.boolVal(f, 'opc4Lembretes', true));
        this.opc5Confirmacao.set(this.boolVal(f, 'opc5Confirmacao', true));

        const ordem = this.extractOrdem(f);
        const montados: FluxoItem[] = [];
        const added = new Set<string>();

        for (const chave of ordem) {
          const def = FLUXO_DEFS[chave];
          if (!def) { continue; }
          added.add(chave);
          montados.push({ ...def, ativo: this.getAtivo(f, chave) });
        }

        for (const chave of ORDEM_PADRAO) {
          if (added.has(chave)) { continue; }
          const def = FLUXO_DEFS[chave];
          if (!def) { continue; }
          montados.push({ ...def, ativo: this.getAtivo(f, chave) });
        }

        this.fluxos.set(montados);
        this.snapshot.set({
          fluxos: montados.map(m => ({ ...m })),
          opc4Lembretes: this.opc4Lembretes(),
          opc5Confirmacao: this.opc5Confirmacao()
        });

        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Falha ao carregar opções do menu do WhatsApp.', 'Erro');
        this.isLoading.set(false);
      }
    });
  }

  private getAtivo(f: Record<string, unknown>, chave: string): boolean {
    const prop = CHAVE_TO_PROP[chave];
    if (prop && f[prop] !== undefined) { return !!f[prop]; }
    if (f[chave] !== undefined) { return !!f[chave]; }
    return false;
  }

  private boolVal(f: Record<string, unknown>, key: string, fallback: boolean): boolean {
    const v = f[key];
    return typeof v === 'boolean' ? v : fallback;
  }

  private extractOrdem(f: Record<string, unknown>): string[] {
    const raw = f['menuOrdem'];
    if (Array.isArray(raw)) {
      const valid = raw.filter(k => typeof k === 'string' && FLUXO_DEFS[k]);
      if (valid.length > 0) { return valid as string[]; }
    }
    return [...ORDEM_PADRAO];
  }

  onDrop(event: CdkDragDrop<FluxoItem[]>): void {
    const arr = [...this.fluxos()];
    moveItemInArray(arr, event.previousIndex, event.currentIndex);
    this.fluxos.set(arr);
  }

  toggleFluxo(chave: string): void {
    this.fluxos.update(items =>
      items.map(item =>
        item.chave === chave ? { ...item, ativo: !item.ativo } : item
      )
    );
  }

  descartar(): void {
    const snap = this.snapshot();
    if (!snap) { return; }
    this.fluxos.set(snap.fluxos.map(m => ({ ...m })));
    this.opc4Lembretes.set(snap.opc4Lembretes);
    this.opc5Confirmacao.set(snap.opc5Confirmacao);
    this.toastService.info('Alterações descartadas.');
  }

  salvarFluxos(): void {
    this.isSaving.set(true);

    const items = this.fluxos();
    const menuOrdem = items.map(item => item.chave);

    const payload: Record<string, unknown> = {
      menuOrdem,
      opc4Lembretes: this.opc4Lembretes(),
      opc5Confirmacao: this.opc5Confirmacao()
    };

    for (const item of items) {
      const prop = CHAVE_TO_PROP[item.chave];
      if (prop) { payload[prop] = item.ativo; }
    }

    this.authService.updateSgFluxosWhatsApp(this.empresaId(), payload).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.toastService.success('Opções do WhatsApp atualizadas com sucesso!', 'Sucesso');
        this.snapshot.set({
          fluxos: items.map(m => ({ ...m })),
          opc4Lembretes: this.opc4Lembretes(),
          opc5Confirmacao: this.opc5Confirmacao()
        });
      },
      error: () => {
        this.isSaving.set(false);
        this.toastService.error('Erro ao salvar opções do menu WhatsApp.', 'Erro');
      }
    });
  }

  voltar(): void {
    this.router.navigate(['/sg-estabelecimento-detalhes-x7k9p', this.empresaId()]);
  }
}