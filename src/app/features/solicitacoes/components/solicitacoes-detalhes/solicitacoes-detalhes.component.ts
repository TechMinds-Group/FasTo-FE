import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TmToastService } from '@techminds-group/tm-angular-lib';
import { SolicitacoesWhatsAppService } from '../../../../core/services/solicitacoes-whatsapp.service';
import { SolicitacaoWhatsApp } from '../../../../core/models/solicitacao-whatsapp/solicitacao-whatsapp.model';
import {
  formatarDataHoraSolicitacao,
  obterConfigStatusSolicitacao,
  obterLabelTipoFluxo,
  OPCOES_STATUS_SOLICITACAO,
} from '../../../../core/models/solicitacao-whatsapp/solicitacao-whatsapp.model';

interface RouteStateComSolicitacao {
  solicitacao?: SolicitacaoWhatsApp;
}

@Component({
  selector: 'app-solicitacoes-detalhes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitacoes-detalhes.component.html',
  styleUrl: './solicitacoes-detalhes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitacoesDetalhesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(TmToastService);
  protected readonly solicitacoesService = inject(SolicitacoesWhatsAppService);

  protected readonly solicitacao = signal<SolicitacaoWhatsApp | null>(null);
  protected readonly carregando = signal(true);
  protected readonly salvandoStatus = signal(false);
  protected readonly salvandoResposta = signal(false);
  protected readonly encerrandoConversa = signal(false);
  protected readonly novoStatus = signal<string>('');
  protected readonly novaResposta = signal<string>('');

  protected readonly opcoesStatus = OPCOES_STATUS_SOLICITACAO;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      void this.carregar(id);
    } else {
      this.carregando.set(false);
    }
  }

  voltar(): void {
    this.router.navigate(['/solicitacoes']);
  }

  protected async aplicarStatus(): Promise<void> {
    const atual = this.solicitacao();
    const novo = this.novoStatus();
    if (!atual || !novo || novo === atual.status || this.salvandoStatus()) return;

    this.salvandoStatus.set(true);
    try {
      await this.solicitacoesService.atualizarStatus(atual.id, novo);
      this.solicitacao.update((cur) => (cur ? { ...cur, status: novo } : cur));
      this.toastService.success('Status atualizado com sucesso!', 'Sucesso');
    } catch (erro) {
      this.toastService.error(this.mensagemErro(erro, 'Erro ao atualizar status.'), 'Erro');
    } finally {
      this.salvandoStatus.set(false);
    }
  }

  /**
   * Grava a resposta do estabelecimento e dispara a notificação no WhatsApp.
   * Recarrega o detalhe com a solicitação retornada pelo backend.
   */
  protected async responder(): Promise<void> {
    const atual = this.solicitacao();
    const resposta = this.novaResposta().trim();
    if (!atual || !resposta || this.salvandoResposta()) return;

    this.salvandoResposta.set(true);
    try {
      const respostaApi = await this.solicitacoesService.responder(atual.id, resposta);
      this.solicitacao.set(respostaApi.solicitacao);
      this.novoStatus.set(respostaApi.solicitacao.status);
      this.novaResposta.set('');
      if (respostaApi.notificado) {
        this.toastService.success('Resposta enviada ao cliente', 'Sucesso');
      } else {
        this.toastService.warning('Resposta salva, mas o envio pelo WhatsApp falhou.', 'Atenção');
      }
    } catch (erro) {
      this.toastService.error(this.mensagemErro(erro, 'Erro ao enviar resposta.'), 'Erro');
    } finally {
      this.salvandoResposta.set(false);
    }
  }

  /**
   * Encerra a conversa no WhatsApp com o cliente desta solicitação: limpa o estado
   * do bot, desativa o modo humano e envia a mensagem de encerramento. Não altera
   * o status da solicitação; pode ser usado quantas vezes for necessário.
   */
  protected async encerrarConversa(): Promise<void> {
    const atual = this.solicitacao();
    if (!atual || this.encerrandoConversa()) return;

    this.encerrandoConversa.set(true);
    try {
      const resposta = await this.solicitacoesService.encerrarConversa(atual.id);
      if (resposta.notificado) {
        this.toastService.success('Conversa encerrada com sucesso!', 'Sucesso');
      } else {
        this.toastService.warning('Conversa encerrada, mas o envio da mensagem falhou.', 'Atenção');
      }
    } catch (erro) {
      this.toastService.error(this.mensagemErro(erro, 'Erro ao encerrar a conversa.'), 'Erro');
    } finally {
      this.encerrandoConversa.set(false);
    }
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

  private async carregar(id: string): Promise<void> {
    // Deep-link direto (sem state da listagem): busca na listagem completa.
    const doState = this.resgatarDoState(id);
    if (doState) {
      this.solicitacao.set(doState);
      this.novoStatus.set(doState.status);
      this.carregando.set(false);
      return;
    }

    this.carregando.set(true);
    try {
      const resposta = await this.solicitacoesService.listar({ page: 1, pageSize: 50 });
      const encontrada = resposta.items.find((item) => item.id === id);
      if (encontrada) {
        this.solicitacao.set(encontrada);
        this.novoStatus.set(encontrada.status);
      } else {
        this.voltar();
      }
    } catch {
      this.voltar();
    } finally {
      this.carregando.set(false);
    }
  }

  private resgatarDoState(id: string): SolicitacaoWhatsApp | undefined {
    const candidata = (history.state as RouteStateComSolicitacao).solicitacao;
    return candidata?.id === id ? candidata : undefined;
  }

  private mensagemErro(erro: unknown, padrao: string): string {
    const corpo = (erro as { error?: { message?: string; detail?: string } | null }).error;
    return corpo?.message ?? corpo?.detail ?? padrao;
  }
}
