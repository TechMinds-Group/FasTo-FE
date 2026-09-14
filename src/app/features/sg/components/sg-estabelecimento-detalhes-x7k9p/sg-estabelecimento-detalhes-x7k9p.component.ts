import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TmTextComponent, TmSelectComponent, TmDateComponent, TmModalComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { ThemeService } from '../../../../core/services/theme.service';
import { AuthService } from '../../../../core/services/auth.service';

export interface SegmentPresetItem {
  id: string;
  nome: string;
  icone: string;
  descricao?: string;
  isPadraoSistema: boolean;
  permissoesMenusJson?: string;
  whatsAppBoasVindas?: string;
  whatsAppEncerramento?: string;
  whatsAppLembrete1Dia?: string;
  whatsAppLembrete4h?: string;
  opcoesMenuJson?: string;
}

export interface WhatsAppFlowItem {
  key: string;
  label: string;
  descricao: string;
  icone: string;
  ativo: boolean;
}

@Component({
  selector: 'app-sg-estabelecimento-detalhes-x7k9p',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TmTextComponent, TmSelectComponent, TmDateComponent, TmModalComponent],
  templateUrl: './sg-estabelecimento-detalhes-x7k9p.component.html',
  styleUrl: './sg-estabelecimento-detalhes-x7k9p.component.scss'
})
export class SgEstabelecimentoDetalhesX7k9pComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(TmToastService);
  protected themeService = inject(ThemeService);

  protected empresa = signal<any | null>(null);
  protected usuarios = signal<any[]>([]);
  protected isLoading = signal<boolean>(true);
  protected errorMessage = signal<string | null>(null);
  protected modoEdicao = signal<boolean>(false);
  protected salvando = signal<boolean>(false);
  protected abaAtiva = signal<'dados' | 'menus' | 'whatsapp' | 'presets'>('dados');

  // Presets & Fluxos State
  protected presets = signal<SegmentPresetItem[]>([]);
  protected presetSelecionado = signal<SegmentPresetItem | null>(null);
  protected isPresetPersonalizado = signal<boolean>(false);
  protected aplicandoPreset = signal<boolean>(false);
  protected showSavePresetModal = signal<boolean>(false);
  protected novoPresetNome = signal<string>('');
  protected novoPresetIcone = signal<string>('🏢');
  protected novoPresetDescricao = signal<string>('');

  // Fluxos do WhatsApp do Estabelecimento
  protected fluxosEstabelecimento = signal<WhatsAppFlowItem[]>([
    { key: 'opc1AgendarSite', label: '1. Agendamento pelo Site', descricao: 'Permite ao cliente agendar pela página pública', icone: '📅', ativo: true },
    { key: 'opc2AgendarWhatsapp', label: '2. Agendamento pelo WhatsApp', descricao: 'Fluxo guiado interativo no WhatsApp para escolher data/horário', icone: '💬', ativo: true },
    { key: 'opc3MeusAgendamentos', label: '3. Consultar Meus Agendamentos', descricao: 'Cliente pode verificar status de horários marcados', icone: '📋', ativo: true },
    { key: 'opc4Orcamento', label: '4. Solicitação de Orçamentos', descricao: 'Coleta lista de materiais, medidas, arquivos ou descrições', icone: '💰', ativo: false },
    { key: 'opc5Pedido', label: '5. Pedidos Expressos', descricao: 'Permite realizar pedidos de compras ou entregas rápidas', icone: '📦', ativo: false },
    { key: 'opc6Suporte', label: '6. Dúvidas Frequentes & Suporte', descricao: 'Redireciona para FAQ ou atendente humano', icone: '🛠️', ativo: true },
    { key: 'opc7PreCadastro', label: '7. Pré-cadastro / Ficha Inicial', descricao: 'Coleta dados do cliente antes do primeiro atendimento', icone: '📱', ativo: false },
    { key: 'opc8ConsultarStatus', label: '8. Consultar Status do Processo / Pedido', descricao: 'Consulta andamento de casos, serviços ou pedidos', icone: '🔍', ativo: false },
    { key: 'opc9EnviarDocumentos', label: '9. Envio de Documentos / Procuração', descricao: 'Coleta de arquivos e documentos para pareceres/análises', icone: '📄', ativo: false },
    { key: 'opc10ConsultarEstoque', label: '10. Consultar Peça / Estoque', descricao: 'Busca por modelo, código da peça ou ano do veículo', icone: '🔩', ativo: false },
    { key: 'opc11AgendarVisita', label: '11. Agendamento de Visita Técnica', descricao: 'Solicitações de visitas no local para medição/manutenção', icone: '🧰', ativo: false },
    { key: 'opc12Simular', label: '12. Simulação / Calculadora Estimativa', descricao: 'Coleta parâmetros para simulação prévia', icone: '🧮', ativo: false },
    { key: 'opc13TriagemAdvocacia', label: '13. Triagem Jurídica por Área', descricao: 'Triagem interativa de caso por Área Jurídica (Trabalhista, Família, Cível, Previdenciário, Urgências)', icone: '⚖️', ativo: false },
  ]);

  protected fluxosEstabelecimentoIniciais = signal<WhatsAppFlowItem[]>([]);
  protected initialFormValues = signal<any>({});

  protected temAlteracoes = computed(() => {
    if (!this.modoEdicao()) return false;
    const current = this.form.value;
    const init = this.initialFormValues();
    const formChanged = Object.keys(current).some(key => (current[key] || '') !== (init[key] || ''));

    const initFluxos = this.fluxosEstabelecimentoIniciais();
    const fluxosChanged = this.fluxosEstabelecimento().some(f => {
      const orig = initFluxos.find(o => o.key === f.key);
      return !orig || orig.ativo !== f.ativo;
    });

    return formChanged || fluxosChanged;
  });

  // WhatsApp Messages State
  protected waBoasVindas = signal<string>('');
  protected waEncerramento = signal<string>('');
  protected waLembrete1Dia = signal<string>('');
  protected waLembrete4h = signal<string>('');
  protected salvandoWhatsApp = signal<boolean>(false);

  protected planosDisponiveis = signal<any[]>([]);
  protected planosOptions = computed(() =>
    this.planosDisponiveis()
      .filter(p => p.status === 'Ativo')
      .map(p => ({ value: p.id, label: `${p.nome} - R$ ${parseFloat(p.valor).toFixed(2)}/${p.ciclo}` }))
  );
  protected planosOptionsComNenhum = computed(() => {
    const options = this.planosOptions();
    return [{ value: '', label: 'Nenhum' }, ...options];
  });

  protected showDeleteConfirmModal = signal(false);

  protected form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    nomeExibicao: ['', [Validators.maxLength(100)]],
    cnpj: ['', [Validators.maxLength(18)]],
    telefone: ['', [Validators.maxLength(20)]],
    descricao: ['', [Validators.maxLength(1000)]],
    cep: ['', [Validators.maxLength(10)]],
    logradouro: ['', [Validators.maxLength(200)]],
    numero: ['', [Validators.maxLength(20)]],
    complemento: ['', [Validators.maxLength(100)]],
    bairro: ['', [Validators.maxLength(100)]],
    cidade: ['', [Validators.maxLength(100)]],
    estado: ['', [Validators.maxLength(50)]],
    planoSistemaId: [''],
    assinaturaValidaInicio: [''],
    assinaturaValidaAte: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.carregarDetalhes(id);
      this.carregarPlanos();
      this.carregarPresets();
    } else {
      this.errorMessage.set('Identificador da empresa inválido.');
      this.isLoading.set(false);
    }

    this.route.queryParams.subscribe(params => {
      if (params['aba']) {
        this.abaAtiva.set(params['aba'] as any);
      }
    });
  }

  setAba(aba: 'dados' | 'menus' | 'whatsapp' | 'presets'): void {
    this.abaAtiva.set(aba);
    const id = this.empresa()?.id || this.route.snapshot.paramMap.get('id');
    if (id) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { aba },
        queryParamsHandling: 'merge',
      });
    }
  }

  carregarPresets(): void {
    this.authService.getSgPresets().subscribe({
      next: (data) => {
        this.presets.set(data || []);
        this.verificarSePresetCombinacaoCombina();
      },
      error: () => this.toastService.error('Erro ao carregar presets de segmento.')
    });
  }

  carregarPlanos(): void {
    this.authService.getSgPlanos().subscribe({
      next: (data) => this.planosDisponiveis.set(data || []),
      error: () => {}
    });
  }

  carregarDetalhes(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.getSgEmpresaById(id).subscribe({
      next: (data) => {
        this.empresa.set(data);
        if (data.usuarios) {
          this.usuarios.set(data.usuarios);
        }

        // Tenta restaurar a lista de fluxos ativos do JSON da empresa
        if (data.fluxosWhatsAppJson) {
          try {
            const opcoesMap: Record<string, boolean> = JSON.parse(data.fluxosWhatsAppJson);
            this.fluxosEstabelecimento.update(list =>
              list.map(f => ({ ...f, ativo: opcoesMap[f.key] !== undefined ? !!opcoesMap[f.key] : f.ativo }))
            );
          } catch {
            // Mantém os padrões
          }
        }

        this.initialFormValues.set(this.form.value);
        this.fluxosEstabelecimentoIniciais.set(JSON.parse(JSON.stringify(this.fluxosEstabelecimento())));
        this.verificarSePresetCombinacaoCombina();

        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Falha ao carregar detalhes do estabelecimento.');
        this.isLoading.set(false);
      }
    });
  }

  toggleFluxoEstabelecimento(key: string): void {
    if (!this.modoEdicao()) return;
    this.fluxosEstabelecimento.update(list =>
      list.map(f => f.key === key ? { ...f, ativo: !f.ativo } : f)
    );
    this.verificarSePresetCombinacaoCombina();
  }

  verificarSePresetCombinacaoCombina(): void {
    const pList = this.presets();
    const currentFluxos = this.fluxosEstabelecimento();

    const matched = pList.find(p => {
      if (!p.opcoesMenuJson) return false;
      try {
        const opcoesPreset: Record<string, boolean> = JSON.parse(p.opcoesMenuJson);
        return currentFluxos.every(f => !!f.ativo === !!opcoesPreset[f.key]);
      } catch {
        return false;
      }
    });

    if (matched) {
      this.presetSelecionado.set(matched);
      this.isPresetPersonalizado.set(false);
    } else {
      this.presetSelecionado.set(null);
      this.isPresetPersonalizado.set(true);
    }
  }

  selecionarPreset(preset: SegmentPresetItem): void {
    if (!this.modoEdicao()) return;
    this.presetSelecionado.set(preset);
    this.isPresetPersonalizado.set(false);

    // Carrega os switches a partir do preset selecionado
    let opcoesPreset: Record<string, boolean> = {};
    if (preset.opcoesMenuJson) {
      try {
        opcoesPreset = JSON.parse(preset.opcoesMenuJson);
      } catch {
        opcoesPreset = {};
      }
    }

    this.fluxosEstabelecimento.update(list =>
      list.map(f => ({ ...f, ativo: opcoesPreset[f.key] !== undefined ? !!opcoesPreset[f.key] : f.ativo }))
    );
  }

  aplicarPresetSelecionado(): void {
    const p = this.presetSelecionado();
    const emp = this.empresa();
    if (!p || !emp) return;

    this.aplicandoPreset.set(true);
    this.authService.aplicarSgPreset(emp.id, p.id).subscribe({
      next: (res) => {
        this.toastService.success(res.message || `Preset '${p.nome}' aplicado com sucesso!`, 'Sucesso');
        if (p.opcoesMenuJson) {
          try {
            const map: Record<string, boolean> = JSON.parse(p.opcoesMenuJson);
            this.fluxosEstabelecimento.update(list =>
              list.map(f => ({ ...f, ativo: map[f.key] !== undefined ? !!map[f.key] : f.ativo }))
            );
          } catch {}
        }
        if (p.whatsAppBoasVindas) this.waBoasVindas.set(p.whatsAppBoasVindas);
        if (p.whatsAppEncerramento) this.waEncerramento.set(p.whatsAppEncerramento);
        if (p.whatsAppLembrete1Dia) this.waLembrete1Dia.set(p.whatsAppLembrete1Dia);
        if (p.whatsAppLembrete4h) this.waLembrete4h.set(p.whatsAppLembrete4h);

        this.carregarDetalhes(emp.id);
        this.aplicandoPreset.set(false);
      },
      error: () => {
        this.toastService.error('Erro ao aplicar o preset selecionado.', 'Erro');
        this.aplicandoPreset.set(false);
      }
    });
  }

  abrirModalSalvarPreset(): void {
    this.novoPresetNome.set('');
    this.novoPresetIcone.set('🏢');
    this.novoPresetDescricao.set('');
    this.showSavePresetModal.set(true);
  }

  fecharModalSalvarPreset(): void {
    this.showSavePresetModal.set(false);
  }

  salvarNovoPreset(): void {
    if (!this.novoPresetNome().trim()) {
      this.toastService.error('Informe o nome do preset.', 'Atenção');
      return;
    }

    const payload = {
      nome: this.novoPresetNome().trim(),
      icone: this.novoPresetIcone().trim() || '🏢',
      descricao: this.novoPresetDescricao().trim(),
      whatsAppBoasVindas: this.waBoasVindas(),
      whatsAppEncerramento: this.waEncerramento(),
      whatsAppLembrete1Dia: this.waLembrete1Dia(),
      whatsAppLembrete4h: this.waLembrete4h()
    };

    this.authService.createSgPreset(payload).subscribe({
      next: (presetCriado) => {
        this.toastService.success(`Preset '${presetCriado.nome}' salvo com sucesso!`, 'Sucesso');
        this.carregarPresets();
        this.fecharModalSalvarPreset();
      },
      error: () => this.toastService.error('Erro ao salvar novo preset.', 'Erro')
    });
  }

  excluirPresetCustomizado(presetId: string): void {
    this.authService.deleteSgPreset(presetId).subscribe({
      next: () => {
        this.toastService.success('Preset removido com sucesso!', 'Sucesso');
        this.carregarPresets();
      },
      error: (err) => this.toastService.error(err?.error?.message || 'Erro ao excluir preset.')
    });
  }

  updateWaField(campo: 'boasVindas' | 'encerramento' | 'lembrete1Dia' | 'lembrete4h', event: Event): void {
    const target = event.target as HTMLTextAreaElement | HTMLInputElement | null;
    const value = target?.value || '';
    if (campo === 'boasVindas') this.waBoasVindas.set(value);
    else if (campo === 'encerramento') this.waEncerramento.set(value);
    else if (campo === 'lembrete1Dia') this.waLembrete1Dia.set(value);
    else if (campo === 'lembrete4h') this.waLembrete4h.set(value);
  }

  updateNovoPresetField(campo: 'nome' | 'icone' | 'descricao', event: Event): void {
    const target = event.target as HTMLInputElement | null;
    const value = target?.value || '';
    if (campo === 'nome') this.novoPresetNome.set(value);
    else if (campo === 'icone') this.novoPresetIcone.set(value);
    else if (campo === 'descricao') this.novoPresetDescricao.set(value);
  }

  inserirVariavel(campo: 'boasVindas' | 'encerramento' | 'lembrete1Dia' | 'lembrete4h', varName: string): void {
    if (campo === 'boasVindas') this.waBoasVindas.set(this.waBoasVindas() + ' {' + varName + '}');
    else if (campo === 'encerramento') this.waEncerramento.set(this.waEncerramento() + ' {' + varName + '}');
    else if (campo === 'lembrete1Dia') this.waLembrete1Dia.set(this.waLembrete1Dia() + ' {' + varName + '}');
    else if (campo === 'lembrete4h') this.waLembrete4h.set(this.waLembrete4h() + ' {' + varName + '}');
  }

  voltar(): void {
    this.router.navigate(['/sg-estabelecimentos-x7k9p']);
  }

  novoUsuario(): void {
    const id = this.empresa()?.id;
    if (id) {
      this.router.navigate(['/sg-usuario-novo-x7k9p', id]);
    }
  }

  habilitarEdicao(): void {
    const emp = this.empresa();
    if (emp) {
      this.form.patchValue({
        nome: emp.nome || '',
        nomeExibicao: emp.nomeExibicao || '',
        cnpj: emp.cnpj || '',
        telefone: emp.telefone || '',
        descricao: emp.descricao || '',
        cep: emp.cep || '',
        logradouro: emp.logradouro || '',
        numero: emp.numero || '',
        complemento: emp.complemento || '',
        bairro: emp.bairro || '',
        cidade: emp.cidade || '',
        estado: emp.estado || '',
        planoSistemaId: emp.planoSistemaId || '',
        assinaturaValidaInicio: emp.assinaturaValidaInicio ? this.formatDate(emp.assinaturaValidaInicio) : '',
        assinaturaValidaAte: emp.assinaturaValidaAte ? this.formatDate(emp.assinaturaValidaAte) : '',
      });
      this.initialFormValues.set(this.form.value);
      this.fluxosEstabelecimentoIniciais.set(JSON.parse(JSON.stringify(this.fluxosEstabelecimento())));
      this.modoEdicao.set(true);
    }
  }

  cancelarEdicao(): void {
    this.modoEdicao.set(false);
  }

  async salvarGeral(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Preencha os campos obrigatórios.', 'Atenção');
      return;
    }

    const emp = this.empresa();
    if (!emp) return;

    this.salvando.set(true);
    try {
      const raw = this.form.value;

      // Salva os fluxos de WhatsApp ativados no estabelecimento
      const opcoesObj: Record<string, boolean> = {};
      this.fluxosEstabelecimento().forEach(f => {
        opcoesObj[f.key] = f.ativo;
      });

      await this.authService.updateSgEmpresa(emp.id, {
        nome: raw.nome,
        nomeExibicao: raw.nomeExibicao || null,
        cnpj: (raw.cnpj || '').replace(/\D/g, ''),
        telefone: (raw.telefone || '').replace(/\D/g, ''),
        descricao: raw.descricao || null,
        cep: raw.cep || null,
        logradouro: raw.logradouro || null,
        numero: raw.numero || null,
        complemento: raw.complemento || null,
        bairro: raw.bairro || null,
        cidade: raw.cidade || null,
        estado: raw.estado || null,
        fluxosWhatsAppJson: JSON.stringify(opcoesObj)
      }).toPromise();

      const pSel = this.presetSelecionado();
      if (pSel?.id) {
        try {
          await this.authService.aplicarSgPreset(emp.id, pSel.id).toPromise();
        } catch {}
      }

      const selectedId = raw.planoSistemaId;
      const plano = this.planosDisponiveis().find(p => p.id === selectedId);

      await this.authService.updateSgEmpresaPlano(emp.id, {
        planoSistemaId: selectedId || null,
        planoAssinatura: plano ? plano.nome : null,
        statusAssinatura: 'Ativo',
        assinaturaValidaInicio: raw.assinaturaValidaInicio || null,
        assinaturaValidaAte: raw.assinaturaValidaAte || null,
      }).toPromise();

      this.toastService.success('Estabelecimento atualizado com sucesso!', 'Sucesso');
      this.carregarDetalhes(emp.id);
      this.modoEdicao.set(false);
    } catch {
      this.toastService.error('Erro ao salvar estabelecimento.', 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }

  excluir(): void {
    this.showDeleteConfirmModal.set(true);
  }

  cancelarExcluir(): void {
    this.showDeleteConfirmModal.set(false);
  }

  async confirmarExcluir(): Promise<void> {
    const emp = this.empresa();
    if (!emp) return;

    this.salvando.set(true);
    try {
      await this.authService.deleteSgEmpresa(emp.id).toPromise();
      this.showDeleteConfirmModal.set(false);
      this.toastService.success('Estabelecimento excluído com sucesso!', 'Sucesso');
      this.voltar();
    } catch {
      this.toastService.error('Erro ao excluir estabelecimento.', 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }

  private formatDate(d: any): string {
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}