import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AlterarServicoPayload,
  AtualizarStatusSolicitacao,
  CriarSolicitacaoPayload,
  EncerrarConversaResponse,
  ResponderSolicitacao,
  ResponderSolicitacaoResponse,
  SolicitacaoWhatsApp,
  SolicitacoesWhatsAppFiltros,
  SolicitacoesWhatsAppResponse,
} from '../models/solicitacao-whatsapp/solicitacao-whatsapp.model';

/**
 * Serviço de API das solicitações registradas pelo bot de WhatsApp.
 * Requer perfil de Administrador (grupo Configurações).
 */
@Injectable({
  providedIn: 'root',
})
export class SolicitacoesWhatsAppService {
  private readonly http = inject(HttpClient);
  // Prefixo /api é específico deste endpoint (diferente dos demais services).
  private readonly apiUrl = `${environment.apiUrl}/api/solicitacoes-whatsapp`;

  async listar(filtros: SolicitacoesWhatsAppFiltros = {}): Promise<SolicitacoesWhatsAppResponse> {
    let params = new HttpParams()
      .set('page', String(filtros.page ?? 1))
      .set('pageSize', String(filtros.pageSize ?? 50));

    if (filtros.tipoFluxo && filtros.tipoFluxo !== 'todos') {
      params = params.set('tipoFluxo', filtros.tipoFluxo);
    }
    if (filtros.status && filtros.status !== 'todos') {
      params = params.set('status', filtros.status);
    }

    return firstValueFrom(
      this.http.get<SolicitacoesWhatsAppResponse>(this.apiUrl, { params, withCredentials: true }),
    );
  }

  /**
   * Atualiza o status da solicitação; backend rejeita valores fora do
   * conjunto válido com 400.
   */
  async atualizarStatus(id: string, status: string): Promise<void> {
    const body: AtualizarStatusSolicitacao = { status };
    await firstValueFrom(
      this.http.put<void>(`${this.apiUrl}/${id}/status`, body, { withCredentials: true }),
    );
  }

  /**
   * Grava a resposta, muda o status para `respondida` e notifica o cliente
   * no WhatsApp (`notificado === false` quando o envio falha).
   */
  async responder(id: string, resposta: string): Promise<ResponderSolicitacaoResponse> {
    const body: ResponderSolicitacao = { resposta };
    return firstValueFrom(
      this.http.put<ResponderSolicitacaoResponse>(`${this.apiUrl}/${id}/responder`, body, {
        withCredentials: true,
      }),
    );
  }

  /**
   * Encerra a conversa no WhatsApp com o cliente da solicitação: limpa o estado do bot,
   * desativa o modo humano e envia a mensagem de encerramento. Não altera o status da
   * solicitação e pode ser usado quantas vezes for necessário.
   */
  async encerrarConversa(id: string): Promise<EncerrarConversaResponse> {
    return firstValueFrom(
      this.http.post<EncerrarConversaResponse>(`${this.apiUrl}/${id}/encerrar-conversa`, {}, {
        withCredentials: true,
      }),
    );
  }

  /**
   * Altera o enquadramento da solicitação (categoria e serviço do catálogo).
   * Requer perfil de Administrador e solicitação em análise (403/400 caso contrário).
   */
  async alterarServico(id: string, payload: AlterarServicoPayload): Promise<SolicitacaoWhatsApp> {
    return firstValueFrom(
      this.http.put<SolicitacaoWhatsApp>(`${this.apiUrl}/${id}/servico`, payload, { withCredentials: true }),
    );
  }

  /**
   * Notifica o cliente de que o serviço está pronto para retirada
   * (mensagem configurável; não altera o status da solicitação).
   */
  async notificarServicoPronto(id: string): Promise<{ notificado: boolean; message: string }> {
    return await firstValueFrom(
      this.http.post<{ notificado: boolean; message: string }>(
        `${this.apiUrl}/${id}/notificar-servico-pronto`,
        {},
        { withCredentials: true },
      ),
    );
  }

  /**
   * Exclui definitivamente a solicitação do painel.
   * Requer perfil de Administrador (403 caso contrário).
   */
  async excluir(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/${id}`, { withCredentials: true }),
    );
  }

  /**
   * Cadastra manualmente um protocolo de orçamento (pendente) e notifica os
   * profissionais do serviço. Requer perfil de Administrador.
   */
  async cadastrar(payload: CriarSolicitacaoPayload): Promise<SolicitacaoWhatsApp> {
    return firstValueFrom(
      this.http.post<SolicitacaoWhatsApp>(this.apiUrl, payload, { withCredentials: true }),
    );
  }
}
