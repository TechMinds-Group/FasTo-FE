import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TmModalComponent, TmToastService } from '@techminds-group/tm-angular-lib';
import { SolicitacoesWhatsAppService } from '../../../../core/services/solicitacoes-whatsapp.service';
import { CatalogoCategoriaService } from '../../../../core/services/catalogo-categoria.service';
import { CatalogoService } from '../../../../core/services/catalogo.service';
import { ServicoCatalogo } from '../../../../core/models/catalogo/servico.model';
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
  imports: [CommonModule, FormsModule, TmModalComponent],
  templateUrl: './solicitacoes-detalhes.component.html',
  styleUrl: './solicitacoes-detalhes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitacoesDetalhesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toastService = inject(TmToastService);
  protected readonly solicitacoesService = inject(SolicitacoesWhatsAppService);
  protected readonly categoriasService = inject(CatalogoCategoriaService);
  protected readonly catalogoService = inject(CatalogoService);

  protected readonly solicitacao = signal<SolicitacaoWhatsApp | null>(null);
  protected readonly carregando = signal(true);
  protected readonly salvandoStatus = signal(false);
  protected readonly salvandoResposta = signal(false);
  protected readonly encerrandoConversa = signal(false);
  protected readonly editando = signal(false);
  protected readonly salvandoEdicao = signal(false);
  protected readonly excluindo = signal(false);
  protected readonly enviandoPronto = signal(false);
  protected readonly showModalExcluir = signal(false);
  protected readonly editCategoriaId = signal('');
  protected readonly editServicoId = signal('');
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

    // Catálogos para exibir e editar categoria/serviço da solicitação
    this.categoriasService.carregarCategorias().catch(() => {});
    this.catalogoService.carregarServicos().catch(() => {});
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

  /**
   * Notifica o cliente de que o serviço está pronto para retirada, usando a mensagem
   * configurada ou o padrão genérico. Não altera o status da solicitação.
   */
  protected async notificarServicoPronto(): Promise<void> {
    const atual = this.solicitacao();
    if (!atual || this.enviandoPronto()) return;

    this.enviandoPronto.set(true);
    try {
      const resposta = await this.solicitacoesService.notificarServicoPronto(atual.id);
      if (resposta.notificado) {
        this.toastService.success("Aviso de serviço pronto enviado ao cliente!", "Sucesso");
      } else {
        this.toastService.warning("Aviso salvo, mas o envio pelo WhatsApp falhou.", "Atenção");
      }
    } catch (erro) {
      this.toastService.error(this.mensagemErro(erro, "Erro ao notificar serviço pronto."), "Erro");
    } finally {
      this.enviandoPronto.set(false);
    }
  }

  protected statusConfig(status: string) {
    return obterConfigStatusSolicitacao(status);
  }

  /** Link wa.me para conversar diretamente com o cliente (padrão detalhes de usuário). */
  protected obterLinkWhatsapp(celular: string): string {
    const digitos = celular.replace(/\D/g, '');
    return `https://wa.me/${digitos}`;
  }

  /** Edição de enquadramento só existe para solicitações em análise (pendente).
   *  Registros antigos sem serviço também podem ser enquadrados agora. */
  protected podeEditarServico(): boolean {
    const s = this.solicitacao();
    return !!s && s.status === 'pendente';
  }

  /** Serviço do catálogo vinculado à solicitação (para exibir categoria/serviço). */
  protected servicoAtual(): ServicoCatalogo | undefined {
    const s = this.solicitacao();
    if (!s?.servicoId) {
      return undefined;
    }

    return this.catalogoService.servicos().find((serv) => serv.id === s.servicoId);
  }

  protected categoriaDaSolicitacao(): string {
    return this.servicoAtual()?.categoriaNome ?? '—';
  }

  protected servicoNomeDaSolicitacao(): string {
    return this.servicoAtual()?.nome ?? '—';
  }

  /** Serviços do catálogo pertencentes à categoria selecionada no modo edição. */
  protected servicosDaCategoriaEdicao(): ServicoCatalogo[] {
    const categoriaId = this.editCategoriaId();
    if (!categoriaId) {
      return [];
    }

    return this.catalogoService.servicos().filter((serv) => serv.categoriaId === categoriaId);
  }

  protected onCategoriaEdicaoChange(valor: string | number | null): void {
    this.editCategoriaId.set(valor === null || valor === '' ? '' : String(valor));
    this.editServicoId.set('');
  }

  protected onServicoEdicaoChange(valor: string | number | null): void {
    this.editServicoId.set(valor === null || valor === '' ? '' : String(valor));
  }

  /** Abre o modo edição de enquadramento preenchendo categoria e serviço atuais. */
  protected abrirEdicao(): void {
    const atual = this.solicitacao();
    if (!atual) return;

    this.editCategoriaId.set(this.servicoAtual()?.categoriaId ?? '');
    this.editServicoId.set(atual.servicoId ?? '');
    this.editando.set(true);
  }

  protected cancelarEdicao(): void {
    this.editando.set(false);
  }

  /** Salva o novo enquadramento (categoria/serviço) da solicitação. */
  protected async salvarEdicao(): Promise<void> {
    const atual = this.solicitacao();
    if (!atual || this.salvandoEdicao()) return;

    if (!this.editCategoriaId() || !this.editServicoId()) {
      this.toastService.error('Selecione a categoria e o serviço.', 'Atenção');
      return;
    }

    this.salvandoEdicao.set(true);
    try {
      const atualizado = await this.solicitacoesService.alterarServico(atual.id, {
        categoriaId: this.editCategoriaId(),
        servicoId: this.editServicoId(),
      });
      this.solicitacao.set(atualizado);
      this.editando.set(false);
      this.toastService.success('Categoria e serviço atualizados com sucesso!', 'Sucesso');
    } catch (erro) {
      this.toastService.error(this.mensagemErro(erro, 'Erro ao atualizar categoria e serviço.'), 'Erro');
    } finally {
      this.salvandoEdicao.set(false);
    }
  }

  /** Exclui definitivamente a solicitação do painel (sem notificar o cliente). */
  protected async confirmarExcluir(): Promise<void> {
    const atual = this.solicitacao();
    if (!atual || this.excluindo()) return;

    this.excluindo.set(true);
    try {
      await this.solicitacoesService.excluir(atual.id);
      this.showModalExcluir.set(false);
      this.toastService.success('Solicitação excluída com sucesso.', 'Sucesso');
      this.voltar();
    } catch (erro) {
      this.showModalExcluir.set(false);
      this.toastService.error(this.mensagemErro(erro, 'Erro ao excluir a solicitação.'), 'Erro');
    } finally {
      this.excluindo.set(false);
    }
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
