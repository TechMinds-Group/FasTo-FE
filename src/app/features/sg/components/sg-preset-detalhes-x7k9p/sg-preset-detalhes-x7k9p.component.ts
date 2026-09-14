import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TmModalComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { AuthService } from '../../../../core/services/auth.service';
import { ThemeService } from '../../../../core/services/theme.service';

export interface WhatsAppFlowItem {
  key: string;
  label: string;
  descricao: string;
  icone: string;
  ativo: boolean;
}

@Component({
  selector: 'app-sg-preset-detalhes-x7k9p',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, TmModalComponent],
  templateUrl: './sg-preset-detalhes-x7k9p.component.html',
  styleUrl: './sg-preset-detalhes-x7k9p.component.scss',
})
export class SgPresetDetalhesX7k9pComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastService = inject(TmToastService);
  protected themeService = inject(ThemeService);

  protected preset = signal<any | null>(null);
  protected isLoading = signal<boolean>(true);
  protected errorMessage = signal<string | null>(null);
  protected modoEdicao = signal<boolean>(false);
  protected salvando = signal<boolean>(false);
  protected isNovo = signal<boolean>(false);

  protected initialFormValues = signal<any>({});
  protected fluxosIniciais = signal<WhatsAppFlowItem[]>([]);

  protected fluxos = signal<WhatsAppFlowItem[]>([
    {
      key: 'opc1AgendarSite',
      label: '1. Agendamento pelo Site',
      descricao: 'Permite ao cliente agendar pela página pública',
      icone: '📅',
      ativo: true,
    },
    {
      key: 'opc2AgendarWhatsapp',
      label: '2. Agendamento pelo WhatsApp',
      descricao: 'Fluxo guiado interativo no WhatsApp para escolher data/horário',
      icone: '💬',
      ativo: true,
    },
    {
      key: 'opc3MeusAgendamentos',
      label: '3. Consultar Meus Agendamentos',
      descricao: 'Cliente pode verificar status de horários marcados',
      icone: '📋',
      ativo: true,
    },
    {
      key: 'opc4Orcamento',
      label: '4. Solicitação de Orçamentos',
      descricao: 'Coleta lista de materiais, medidas, arquivos ou descrições',
      icone: '💰',
      ativo: false,
    },
    {
      key: 'opc5Pedido',
      label: '5. Pedidos Expressos',
      descricao: 'Permite realizar pedidos de compras ou entregas rápidas',
      icone: '📦',
      ativo: false,
    },
    {
      key: 'opc6Suporte',
      label: '6. Dúvidas Frequentes & Suporte',
      descricao: 'Redireciona para FAQ ou atendente humano',
      icone: '🛠️',
      ativo: true,
    },
    {
      key: 'opc7PreCadastro',
      label: '7. Pré-cadastro / Ficha Inicial',
      descricao: 'Coleta dados do cliente antes do primeiro atendimento',
      icone: '📱',
      ativo: false,
    },
    {
      key: 'opc8ConsultarStatus',
      label: '8. Consultar Status do Processo / Pedido',
      descricao: 'Consulta andamento de casos, serviços ou pedidos',
      icone: '🔍',
      ativo: false,
    },
    {
      key: 'opc9EnviarDocumentos',
      label: '9. Envio de Documentos / Procuração',
      descricao: 'Coleta de arquivos e documentos para pareceres/análises',
      icone: '📄',
      ativo: false,
    },
    {
      key: 'opc10ConsultarEstoque',
      label: '10. Consultar Peça / Estoque',
      descricao: 'Busca por modelo, código da peça ou ano do veículo',
      icone: '🔩',
      ativo: false,
    },
    {
      key: 'opc11AgendarVisita',
      label: '11. Agendamento de Visita Técnica',
      descricao: 'Solicitações de visitas no local para medição/manutenção',
      icone: '🧰',
      ativo: false,
    },
    {
      key: 'opc12Simular',
      label: '12. Simulação / Calculadora Estimativa',
      descricao: 'Coleta parâmetros para simulação prévia',
      icone: '🧮',
      ativo: false,
    },
    {
      key: 'opc13TriagemAdvocacia',
      label: '13. Triagem Jurídica por Área',
      descricao:
        'Triagem interativa de caso por Área Jurídica (Trabalhista, Família, Cível, Previdenciário, Urgências)',
      icone: '⚖️',
      ativo: false,
    },
  ]);

  protected temAlteracoes = computed(() => {
    if (this.isNovo()) return true;
    if (!this.modoEdicao()) return false;

    const current = this.form.value;
    const init = this.initialFormValues();
    const formChanged = Object.keys(current).some(
      (key) => (current[key] || '') !== (init[key] || ''),
    );

    const initFluxos = this.fluxosIniciais();
    const fluxosChanged = this.fluxos().some((f) => {
      const orig = initFluxos.find((o) => o.key === f.key);
      return !orig || orig.ativo !== f.ativo;
    });

    return formChanged || fluxosChanged;
  });

  protected form: FormGroup = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(100)]],
    icone: ['🏢', [Validators.maxLength(10)]],
    descricao: ['', [Validators.maxLength(1000)]],
    whatsAppBoasVindas: [''],
    whatsAppEncerramento: [''],
    whatsAppLembrete1Dia: [''],
    whatsAppLembrete4h: [''],
  });

  protected showDeleteModal = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'novo') {
      this.isNovo.set(true);
      this.modoEdicao.set(true);
      this.isLoading.set(false);
      this.form.patchValue({
        nome: '',
        icone: '🏢',
        descricao: '',
        whatsAppBoasVindas: 'Olá! Seja bem-vindo ao {estabelecimento}. Como posso ajudar?',
        whatsAppEncerramento: 'Agradecemos o contato com {estabelecimento}. Tenha um ótimo dia!',
        whatsAppLembrete1Dia:
          'Olá {primeiro_nome}, lembramos do seu agendamento amanhã em {estabelecimento}.',
        whatsAppLembrete4h:
          'Olá {primeiro_nome}, seu atendimento em {estabelecimento} é daqui a 4 horas.',
      });
      this.initialFormValues.set(this.form.value);
      this.fluxosIniciais.set(JSON.parse(JSON.stringify(this.fluxos())));
    } else {
      this.carregarPreset(id);
    }
  }

  carregarPreset(id: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.getSgPresetById(id).subscribe({
      next: (data) => {
        this.preset.set(data);

        // Preenche os fluxos do preset
        if (data.opcoesMenuJson) {
          try {
            const map: Record<string, boolean> = JSON.parse(data.opcoesMenuJson);
            this.fluxos.update((list) =>
              list.map((f) => ({ ...f, ativo: map[f.key] !== undefined ? !!map[f.key] : f.ativo })),
            );
          } catch {
            // Mantém padrão
          }
        }

        this.form.patchValue({
          nome: data.nome || '',
          icone: data.icone || '🏢',
          descricao: data.descricao || '',
          whatsAppBoasVindas: data.whatsAppBoasVindas || '',
          whatsAppEncerramento: data.whatsAppEncerramento || '',
          whatsAppLembrete1Dia: data.whatsAppLembrete1Dia || '',
          whatsAppLembrete4h: data.whatsAppLembrete4h || '',
        });

        this.initialFormValues.set(this.form.value);
        this.fluxosIniciais.set(JSON.parse(JSON.stringify(this.fluxos())));

        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Falha ao carregar detalhes do preset.');
        this.isLoading.set(false);
      },
    });
  }

  toggleFluxo(key: string): void {
    this.fluxos.update((list) => list.map((f) => (f.key === key ? { ...f, ativo: !f.ativo } : f)));
  }

  inserirVariavel(campo: string, varName: string): void {
    const atual = this.form.get(campo)?.value || '';
    this.form.get(campo)?.setValue(`${atual} {${varName}}`);
  }

  habilitarEdicao(): void {
    this.modoEdicao.set(true);
  }

  cancelarEdicao(): void {
    if (this.isNovo()) {
      this.voltar();
    } else {
      this.modoEdicao.set(false);
      if (this.preset()) {
        this.carregarPreset(this.preset().id);
      }
    }
  }

  async salvarGeral(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Preencha os campos obrigatórios.', 'Atenção');
      return;
    }

    this.salvando.set(true);
    try {
      const raw = this.form.value;

      const opcoesObj: Record<string, boolean> = {};
      this.fluxos().forEach((f) => {
        opcoesObj[f.key] = f.ativo;
      });

      const payload = {
        nome: raw.nome,
        icone: raw.icone || '🏢',
        descricao: raw.descricao || null,
        opcoesMenuJson: JSON.stringify(opcoesObj),
        whatsAppBoasVindas: raw.whatsAppBoasVindas || null,
        whatsAppEncerramento: raw.whatsAppEncerramento || null,
        whatsAppLembrete1Dia: raw.whatsAppLembrete1Dia || null,
        whatsAppLembrete4h: raw.whatsAppLembrete4h || null,
      };

      if (this.isNovo()) {
        const res = await this.authService.createSgPreset(payload).toPromise();
        this.toastService.success(`Preset '${res.nome}' criado com sucesso!`, 'Sucesso');
        this.router.navigate(['/sg-preset-detalhes-x7k9p', res.id]);
      } else {
        const p = this.preset();
        await this.authService.updateSgPreset(p.id, payload).toPromise();
        this.toastService.success(`Preset '${raw.nome}' atualizado com sucesso!`, 'Sucesso');
        this.carregarPreset(p.id);
        this.modoEdicao.set(false);
      }
    } catch {
      this.toastService.error('Erro ao salvar preset.', 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }

  excluir(): void {
    this.showDeleteModal.set(true);
  }

  cancelarExcluir(): void {
    this.showDeleteModal.set(false);
  }

  async confirmarExcluir(): Promise<void> {
    const p = this.preset();
    if (!p) return;

    this.salvando.set(true);
    try {
      await this.authService.deleteSgPreset(p.id).toPromise();
      this.showDeleteModal.set(false);
      this.toastService.success('Preset excluído com sucesso!', 'Sucesso');
      this.voltar();
    } catch {
      this.toastService.error('Erro ao excluir preset.', 'Erro');
    } finally {
      this.salvando.set(false);
    }
  }

  voltar(): void {
    this.router.navigate(['/sg-presets-x7k9p']);
  }
}
