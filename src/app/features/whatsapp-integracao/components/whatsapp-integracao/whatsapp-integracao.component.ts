import { ChangeDetectionStrategy, Component, DestroyRef, inject, ChangeDetectorRef, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, firstValueFrom } from 'rxjs';
import { TmTextComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { environment } from '../../../../../environments/environment';
import { WhatsAppTenantConfig } from '../../../../core/models/whatsapp/whatsapp.model';
import { WhatsAppService } from '../../../../core/services/whatsapp.service';
import { Router, RouterModule } from '@angular/router';

interface QrCodeData {
  base64?: string;
  code?: string;
  status?: string;
}

interface StatusData {
  state?: string;
  status?: string;
  number?: string;
}

interface DispositivoWhatsApp {
  id: string;
  name: string;
  connectionStatus: string;
  ownerJid: string;
  profileName?: string;
  profilePicUrl?: string;
  integration: string;
  number?: string;
  createdAt: string;
  updatedAt: string;
}

type InstancesResponse = DispositivoWhatsApp[];

@Component({
  selector: 'app-whatsapp-integracao',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, TmTextComponent],
  templateUrl: './whatsapp-integracao.component.html',
  styleUrl: './whatsapp-integracao.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsappIntegracaoComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly whatsAppService = inject(WhatsAppService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly toastService = inject(TmToastService);
  private readonly apiUrl = `${environment.apiUrl}/api/whatsapp`;

  protected readonly form: FormGroup = this.fb.group({
    welcomeMessage: [''],
    closingMessage: [''],
    lembrete1DiaMensagem: [''],
    lembrete4hMensagem: [''],
    testMode: [false],
    testNumber1: [''],
    testNumber2: [''],
    testNumber3: [''],
  });

  protected readonly carregando = signal(true);
  protected readonly conectando = signal(false);
  protected readonly conectado = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly qrCodeBase64 = signal<string | null>(null);
  protected readonly statusTexto = signal('Verificando conexão...');
  protected readonly dispositivos = signal<DispositivoWhatsApp[]>([]);
  protected readonly configSalvando = signal(false);


  /** Sinais para controle de expansão dos blocos colapsáveis (nascem colapsados) */
  protected readonly blocoConfigExpandido = signal(false);
  protected readonly blocoAjudaExpandido = signal(false);

  /** Variáveis disponíveis nas mensagens configuráveis (exibidas na tela) */
  protected readonly variaveisDisponiveis = [
    { codigo: '{primeiro_nome}', descricao: 'Primeiro nome do cliente (ex: João)' },
    { codigo: '{nome_completo}', descricao: 'Nome completo do cliente (ex: João Silva)' },
    { codigo: '{estabelecimento}', descricao: 'Nome de exibição do estabelecimento (ex: FasTo Atendimentos)' },
    { codigo: '{link}', descricao: 'Insere o link público de agendamento do estabelecimento' },
    { codigo: '{profissional}', descricao: 'Nome do atendente / profissional (ex: Carlos)' },
    { codigo: '{servico}', descricao: 'Nome do atendimento / serviço (ex: Consultoria Técnica)' },
    { codigo: '{horario}', descricao: 'Horário do agendamento (ex: 14:30)' },
    { codigo: '{data_horario}', descricao: 'Data e horário do agendamento (ex: 20/08/2026 14:30)' },
  ];

  protected toggleBlocoConfig(): void { this.blocoConfigExpandido.update(v => !v); }
  protected toggleBlocoAjuda(): void { this.blocoAjudaExpandido.update(v => !v); }

  protected voltar(): void {
    this.router.navigate(['/configuracoes']);
  }



  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.verificarStatus(),
      this.carregarDispositivos(),
      this.carregarConfig(),
    ]);
  }

  async salvarConfig(): Promise<void> {
    this.configSalvando.set(true);

    try {
      const v = this.form.value;
      const numeros = [v.testNumber1, v.testNumber2, v.testNumber3]
        .filter((n: string) => n?.trim())
        .join(', ');

      const config: WhatsAppTenantConfig = {
        welcomeMessage: v.welcomeMessage || null,
        closingMessage: v.closingMessage || null,
        lembrete1DiaMensagem: v.lembrete1DiaMensagem || null,
        lembrete4hMensagem: v.lembrete4hMensagem || null,
        testMode: v.testMode ?? false,
        testNumbers: numeros || null,
      };

      await this.whatsAppService.saveConfig(config);
      this.toastService.success('Configurações salvas com sucesso!', 'Sucesso');
    } catch {
      this.toastService.error('Erro ao salvar configurações. Tente novamente.', 'Erro');
    } finally {
      this.configSalvando.set(false);
    }
  }

  protected async carregarConfig(): Promise<void> {
    try {
      const config = await this.whatsAppService.getConfig();
      const numeros = (config.testNumbers ?? '').split(',').map((n: string) => n.trim()).filter((n: string) => n);
      this.form.patchValue({
        welcomeMessage: config.welcomeMessage ?? '',
        closingMessage: config.closingMessage ?? '',
        lembrete1DiaMensagem: config.lembrete1DiaMensagem ?? '',
        lembrete4hMensagem: config.lembrete4hMensagem ?? '',
        testMode: config.testMode,
        testNumber1: numeros[0] ?? '',
        testNumber2: numeros[1] ?? '',
        testNumber3: numeros[2] ?? '',
      });
      this.cdr.markForCheck();
    } catch {
      this.form.patchValue({
        welcomeMessage: '',
        closingMessage: '',
        lembrete1DiaMensagem: '',
        lembrete4hMensagem: '',
        testMode: false,
        testNumber1: '',
        testNumber2: '',
        testNumber3: '',
      });
      this.cdr.markForCheck();
    }
  }

  async conectar(): Promise<void> {
    this.conectando.set(true);
    this.erro.set(null);
    this.qrCodeBase64.set(null);

    try {
      const raw: any = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/connect`),
      );

      const base64 = raw?.base64 || raw?.qrcode?.base64;
      const code = raw?.code || raw?.qrcode?.code;
      const state = raw?.state || raw?.instance?.state || raw?.status;

      if (base64) {
        const formattedBase64 = base64.startsWith('data:image') ? base64 : `data:image/png;base64,${base64}`;
        this.qrCodeBase64.set(formattedBase64);
        this.statusTexto.set('Escaneie o QR Code com o seu WhatsApp');
        this.iniciarPolling();
      } else if (code) {
        this.qrCodeBase64.set(code);
        this.statusTexto.set('Escaneie o QR Code com o seu WhatsApp');
        this.iniciarPolling();
      } else if (state === 'connected' || state === 'open') {
        this.conectado.set(true);
        this.statusTexto.set('WhatsApp conectado com sucesso!');
        await this.carregarDispositivos();
      } else {
        this.erro.set(raw?.erro || raw?.message || 'Resposta inesperada do servidor WhatsApp. Tente novamente.');
      }
    } catch (err: any) {
      const errorMsg = err?.error?.erro || err?.error?.message || 'Erro ao comunicar com a Evolution API. Verifique se o serviço de WhatsApp está online.';
      this.erro.set(errorMsg);
    } finally {
      this.conectando.set(false);
      this.carregando.set(false);
      this.cdr.markForCheck();
    }
  }

  private async carregarDispositivos(): Promise<void> {
    try {
      const raw = await firstValueFrom(
        this.http.get<InstancesResponse>(`${this.apiUrl}/devices`),
      );
      this.dispositivos.set(Array.isArray(raw) ? raw : []);
    } catch {
      this.dispositivos.set([]);
    }
  }

  private async verificarStatus(): Promise<void> {
    try {
      const raw = await firstValueFrom(
        this.http.get<StatusData>(`${this.apiUrl}/status`),
      );

      if (raw.state === 'open') {
        this.conectado.set(true);
        const numero = raw.number ? ` (${this.formatarNumero(raw.number)})` : '';
        this.statusTexto.set(`WhatsApp conectado!${numero}`);
      } else {
        this.statusTexto.set('WhatsApp desconectado. Clique em "Conectar" para gerar o QR Code.');
      }
      this.carregando.set(false);
    } catch {
      this.statusTexto.set('Clique em "Conectar" para iniciar a integração.');
      this.carregando.set(false);
    }
  }

  private async verificarStatusPoll(): Promise<boolean> {
    try {
      const raw = await firstValueFrom(
        this.http.get<StatusData>(`${this.apiUrl}/status`),
      );
      return raw.state === 'open';
    } catch {
      return false;
    }
  }

  private iniciarPolling(): void {
    interval(5000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        const isOpen = await this.verificarStatusPoll();

        if (isOpen) {
          this.conectado.set(true);
          this.statusTexto.set('WhatsApp conectado com sucesso!');
          this.qrCodeBase64.set(null);
          await this.carregarDispositivos();
        }
      });
  }

  protected formatarNumero(num?: string): string {
    if (!num) return '';
    let cleaned = num.split('@')[0];
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      const ddd = cleaned.substring(2, 4);
      const part1 = cleaned.substring(4, cleaned.length - 4);
      const part2 = cleaned.substring(cleaned.length - 4);
      return `+55 (${ddd}) ${part1}-${part2}`;
    }
    return cleaned;
  }
}

