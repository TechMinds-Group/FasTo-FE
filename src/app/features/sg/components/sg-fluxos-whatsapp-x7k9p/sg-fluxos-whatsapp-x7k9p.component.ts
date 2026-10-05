import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PassoFluxo {
  numero: number;
  titulo: string;
  ator: 'bot' | 'cliente' | 'atendente' | 'sistema';
  mensagem: string;
  detalhes?: string;
  fallback?: string;
}

export interface FluxoDetelhado {
  key: string;
  opcaoNumero: number;
  titulo: string;
  icone: string;
  categoria: 'cliente' | 'servicos' | 'profissional' | 'sistema';
  descricao: string;
  desfecho: string;
  variaveis: string[];
  passos: PassoFluxo[];
}

export interface ChatSimuladoMessage {
  id: string;
  autor: 'bot' | 'cliente' | 'atendente' | 'sistema';
  texto: string;
  hora: string;
  detalhes?: string;
  fallback?: string;
}

@Component({
  selector: 'app-sg-fluxos-whatsapp-x7k9p',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sg-fluxos-whatsapp-x7k9p.component.html',
  styleUrl: './sg-fluxos-whatsapp-x7k9p.component.scss',
})
export class SgFluxosWhatsappX7k9pComponent implements OnInit {
  protected searchQuery = signal<string>('');
  protected selectedCategoria = signal<string>('todos');
  protected selectedFluxoKey = signal<string>('opc1AgendarSite');

  // Estado do Simulador Interativo
  protected userMessageInput = signal<string>('');
  protected chatHistory = signal<ChatSimuladoMessage[]>([]);
  protected stepIndex = signal<number>(0);

  protected fluxosList = signal<FluxoDetelhado[]>([
    {
      key: 'opc1AgendarSite',
      opcaoNumero: 1,
      titulo: '1. Agendamento pelo Site (Link Direto)',
      icone: '🔗',
      categoria: 'cliente',
      descricao: 'Envia o link direto para o Portal de Agendamento Online público do estabelecimento com opções de pós-atendimento.',
      desfecho: 'O cliente recebe o link direto e opta por encerrar ou retornar ao menu principal.',
      variaveis: ['{primeiro_nome}', '{estabelecimento}', '{link}'],
      passos: [
        {
          numero: 1,
          titulo: 'Solicitação do Cliente',
          ator: 'cliente',
          mensagem: '1',
        },
        {
          numero: 2,
          titulo: 'Resposta do Bot com Link & Opções',
          ator: 'bot',
          mensagem: 'Olá! 📅 Para realizar seu agendamento online de forma rápida, acesse o nosso link oficial:\n\n👉 https://fasto.com.br/agendamento/estabelecimento-demo/novo\n\nLá você escolhe o serviço, profissional e horário desejado!\n\n1️⃣ Encerrar atendimento\n2️⃣ Voltar ao menu',
          detalhes: 'O link é gerado dinamicamente com base no tenant do estabelecimento.',
        },
        {
          numero: 3,
          titulo: 'Escolha do Cliente (1 para Encerrar / 2 para Voltar)',
          ator: 'cliente',
          mensagem: '1',
        },
        {
          numero: 4,
          titulo: 'Despedida / Retorno ao Menu',
          ator: 'bot',
          mensagem: '👋 Atendimento encerrado com sucesso! Agradecemos o seu contato com o FasTo. Tenha um ótimo dia!',
          detalhes: 'Ao digitar 1 o robô encerra o atendimento, ao digitar 2 ele retorna ao menu principal.',
        },
      ],
    },
    {
      key: 'opc2AgendarWhatsapp',
      opcaoNumero: 2,
      titulo: '2. Agendamento pelo WhatsApp (Guiado no Chat)',
      icone: '📅',
      categoria: 'cliente',
      descricao: 'Fluxo interativo em 4 etapas diretamente na conversa do WhatsApp.',
      desfecho: 'Cria o agendamento no banco de dados, notifica via SignalR e envia confirmação com botões interativos.',
      variaveis: ['{primeiro_nome}', '{estabelecimento}', '{profissional}', '{servico}', '{data_horario}'],
      passos: [
        {
          numero: 1,
          titulo: 'Seleção da Opção',
          ator: 'cliente',
          mensagem: '2',
        },
        {
          numero: 2,
          titulo: 'Etapa 1: Escolha do Profissional',
          ator: 'bot',
          mensagem: 'Por favor, escolha o profissional desejado:\n1️⃣ Ana Souza (Atendente/Especialista)\n2️⃣ Carlos Lima (Especialista)\n0️⃣ Tanto faz (Qualquer livre)',
          fallback: 'Se você digitar uma opção fora de 1, 2 ou 0, o bot reexibe a lista informando escolha inválida.',
        },
        {
          numero: 3,
          titulo: 'Etapa 2: Escolha do Serviço',
          ator: 'bot',
          mensagem: 'Ótimo! Agora escolha o serviço do nosso catálogo:\n1️⃣ Consulta / Atendimento Padrão (R$ 50,00)\n2️⃣ Avaliação Especializada (R$ 80,00)\n3️⃣ Pacote Completo (R$ 120,00)',
        },
        {
          numero: 4,
          titulo: 'Etapa 3: Escolha da Data e Horário',
          ator: 'bot',
          mensagem: 'Horários disponíveis:\n1️⃣ Hoje às 15:00\n2️⃣ Hoje às 16:30\n3️⃣ Amanhã às 10:00\n4️⃣ Digitar outra data',
        },
        {
          numero: 5,
          titulo: 'Etapa 4: Confirmação e Registro',
          ator: 'sistema',
          mensagem: 'Agendamento registrado com sucesso no banco de dados! Notificação SignalR disparada para o painel.',
        },
        {
          numero: 6,
          titulo: 'Comprovação ao Cliente',
          ator: 'bot',
          mensagem: '✅ Agendamento realizado com sucesso!\n\n📍 Estabelecimento: FasTo Demo\n👤 Profissional: Ana Souza\n💇 Serviço: Consulta / Atendimento Padrão\n📅 Data/Horário: Hoje às 15:00',
        },
      ],
    },
    {
      key: 'opc3MeusAgendamentos',
      opcaoNumero: 3,
      titulo: '3. Consultar Meus Agendamentos & Cancelamento',
      icone: '📋',
      categoria: 'cliente',
      descricao: 'Consulta e gerencia compromissos ativos vinculados ao número do WhatsApp do cliente.',
      desfecho: 'Lista os horários futuros com detalhes e permite cancelamento com 1 clique.',
      variaveis: ['{primeiro_nome}', '{servico}', '{data_horario}'],
      passos: [
        {
          numero: 1,
          titulo: 'Solicitação',
          ator: 'cliente',
          mensagem: '3',
        },
        {
          numero: 2,
          titulo: 'Busca no Sistema',
          ator: 'sistema',
          mensagem: 'Buscando compromissos ativos vinculados ao seu número...',
        },
        {
          numero: 3,
          titulo: 'Exibição da Lista',
          ator: 'bot',
          mensagem: '📋 Seus agendamentos encontrados:\n\n1️⃣ Atendimento Padrão em Hoje às 15:00 (Status: Confirmado)\n\nDigite 1️⃣ para cancelar o agendamento acima, ou 0️⃣ para voltar ao menu.',
        },
        {
          numero: 4,
          titulo: 'Cancelamento',
          ator: 'sistema',
          mensagem: 'Status atualizado para "Cancelado". Slot liberado na agenda.',
        },
      ],
    },
    {
      key: 'opc4Orcamento',
      opcaoNumero: 4,
      titulo: '4. Solicitação de Orçamentos & Especificações',
      icone: '💰',
      categoria: 'servicos',
      descricao: 'Coleta de dados, materiais, medidas e fotos para elaboração de orçamento personalizado.',
      desfecho: 'Registra a solicitação no sistema e encaminha para a fila de atendimento comercial.',
      variaveis: ['{primeiro_nome}', '{estabelecimento}'],
      passos: [
        {
          numero: 1,
          titulo: 'Solicitação',
          ator: 'cliente',
          mensagem: '4',
        },
        {
          numero: 2,
          titulo: 'Instrução do Bot',
          ator: 'bot',
          mensagem: 'Por favor, descreva em uma ou mais mensagens o serviço ou produto que você deseja orçar. Pode enviar fotos, medidas ou documentos. Quando terminar, digite a palavra "PRONTO".',
        },
        {
          numero: 3,
          titulo: 'Acúmulo de Informações',
          ator: 'cliente',
          mensagem: 'Preciso de um orçamento para atendimento especial e análise de 3 itens.',
        },
        {
          numero: 4,
          titulo: 'Finalização',
          ator: 'cliente',
          mensagem: 'PRONTO',
        },
        {
          numero: 5,
          titulo: 'Confirmação',
          ator: 'bot',
          mensagem: '✅ Solicitação de orçamento recebida com sucesso! Nossa equipe analisará os detalhes e retornará em breve.',
        },
      ],
    },
    {
      key: 'opc5Pedido',
      opcaoNumero: 5,
      titulo: '5. Pedidos Expressos & Entregas Rápidas',
      icone: '📦',
      categoria: 'servicos',
      descricao: 'Permite a realização de pedidos expressos ou solicitações de catálogo rápido.',
      desfecho: 'Gera solicitação de pedido com resumo de itens e encaminha para faturamento.',
      variaveis: ['{primeiro_nome}', '{estabelecimento}'],
      passos: [
        {
          numero: 1,
          titulo: 'Solicitação',
          ator: 'cliente',
          mensagem: '5',
        },
        {
          numero: 2,
          titulo: 'Seleção de Itens',
          ator: 'bot',
          mensagem: 'Selecione os produtos do nosso catálogo:\n1️⃣ Kit Manutenção Essencial\n2️⃣ Pacote Especial Promocional\n3️⃣ Descrever outro item',
        },
        {
          numero: 3,
          titulo: 'Opção de Retirada',
          ator: 'bot',
          mensagem: 'Você prefere:\n1️⃣ Retirar no local\n2️⃣ Entrega no endereço',
        },
        {
          numero: 4,
          titulo: 'Registro do Pedido',
          ator: 'sistema',
          mensagem: 'Ordem de pedido gerada e enviada para o faturamento.',
        },
      ],
    },
    {
      key: 'opc6Suporte',
      opcaoNumero: 6,
      titulo: '6. Dúvidas Frequentes & Atendimento Humano',
      icone: '🛠️',
      categoria: 'cliente',
      descricao: 'Exibe FAQ automatizado e permite transferência direta para atendente humano.',
      desfecho: 'Transfere a conversa para o painel de atendimento humano mantendo todo o histórico.',
      variaveis: ['{primeiro_nome}', '{estabelecimento}'],
      passos: [
        {
          numero: 1,
          titulo: 'Solicitação',
          ator: 'cliente',
          mensagem: '6',
        },
        {
          numero: 2,
          titulo: 'Opções de Suporte',
          ator: 'bot',
          mensagem: 'Como podemos te ajudar hoje?\n1️⃣ Horários de Funcionamento\n2️⃣ Formas de Pagamento\n3️⃣ Falar com Atendente Humano',
        },
        {
          numero: 3,
          titulo: 'Transferência para Humano',
          ator: 'bot',
          mensagem: '🔔 Perfeito! Transferindo para nosso atendimento humano. Aguarde um momento que um de nossos atendentes responderá.',
        },
        {
          numero: 4,
          titulo: 'Notificação do Atendente',
          ator: 'sistema',
          mensagem: 'Notificação em tempo real disparada para a equipe de atendimento.',
        },
      ],
    },
    {
      key: 'opc7PreCadastro',
      opcaoNumero: 7,
      titulo: '7. Pré-cadastro & Ficha Inicial do Cliente',
      icone: '📱',
      categoria: 'cliente',
      descricao: 'Formulário guiado no chat para coleta de dados cadastrais antes do primeiro atendimento.',
      desfecho: 'Atualiza o cadastro do cliente no sistema.',
      variaveis: ['{primeiro_nome}', '{estabelecimento}'],
      passos: [
        {
          numero: 1,
          titulo: 'Início',
          ator: 'bot',
          mensagem: 'Para agilizar seu atendimento, informe seu nome completo:',
        },
        {
          numero: 2,
          titulo: 'Coleta de CPF/E-mail',
          ator: 'bot',
          mensagem: 'Obrigado! Agora digite seu CPF ou E-mail:',
        },
        {
          numero: 3,
          titulo: 'Cadastro Concluído',
          ator: 'sistema',
          mensagem: 'Ficha do cliente criada e atualizada no banco de dados.',
        },
      ],
    },
    {
      key: 'opc8ConsultarStatus',
      opcaoNumero: 8,
      titulo: '8. Consultar Status do Processo / Pedido / Serviço',
      icone: '🔍',
      categoria: 'servicos',
      descricao: 'Consulta o andamento de ordens de serviço, casos ou entregas.',
      desfecho: 'Exibe o status atual e última atualização cadastrada pelo estabelecimento.',
      variaveis: ['{primeiro_nome}', '{estabelecimento}'],
      passos: [
        {
          numero: 1,
          titulo: 'Solicitação',
          ator: 'cliente',
          mensagem: '8',
        },
        {
          numero: 2,
          titulo: 'Identificação',
          ator: 'bot',
          mensagem: 'Digite o número do seu Pedido ou Protocolo:',
        },
        {
          numero: 3,
          titulo: 'Posição Atual',
          ator: 'bot',
          mensagem: '🔍 Status do Pedido #1042:\n📌 Situação: Em Andamento / Em Produção\n📅 Previsão: 12/10/2026',
        },
      ],
    },
    {
      key: 'opc9EnviarDocumentos',
      opcaoNumero: 9,
      titulo: '9. Envio de Documentos / Procuração',
      icone: '📄',
      categoria: 'servicos',
      descricao: 'Coleta segura de documentos, fotos e PDFs via chat.',
      desfecho: 'Anexa os arquivos diretamente à ficha do cliente/processo no sistema.',
      variaveis: ['{primeiro_nome}'],
      passos: [
        {
          numero: 1,
          titulo: 'Instruções de Envio',
          ator: 'bot',
          mensagem: 'Você pode enviar seus documentos (PDFs ou imagens) nesta conversa. Quando terminar, digite a palavra "PRONTO".',
        },
        {
          numero: 2,
          titulo: 'Recebimento',
          ator: 'sistema',
          mensagem: 'Arquivos salvos e vinculados ao cadastro do cliente.',
        },
        {
          numero: 3,
          titulo: 'Confirmação',
          ator: 'bot',
          mensagem: '📄 Documentos recebidos com sucesso! Nossa equipe foi notificada.',
        },
      ],
    },
    {
      key: 'opc10ConsultarEstoque',
      opcaoNumero: 10,
      titulo: '10. Consultar Peça / Estoque / Produtos',
      icone: '🔩',
      categoria: 'servicos',
      descricao: 'Busca por modelo, código da peça ou item no catálogo de produtos do estabelecimento.',
      desfecho: 'Informa disponibilidade em estoque e preços.',
      variaveis: ['{primeiro_nome}', '{estabelecimento}'],
      passos: [
        {
          numero: 1,
          titulo: 'Solicitação de Busca',
          ator: 'bot',
          mensagem: 'Digite o nome da peça, modelo ou código do produto:',
        },
        {
          numero: 2,
          titulo: 'Resultado da Busca',
          ator: 'bot',
          mensagem: '🔩 Itens encontrados:\n1️⃣ Item Padrão - R$ 120,00 (Em Estoque: 4 un)\n2️⃣ Item Especial - R$ 250,00 (Sob encomenda)',
        },
      ],
    },
    {
      key: 'opc11AgendarVisita',
      opcaoNumero: 11,
      titulo: '11. Agendamento de Visita Técnica no Local',
      icone: '🧰',
      categoria: 'servicos',
      descricao: 'Solicitação de visitas no endereço do cliente para medições, reparos ou vistorias.',
      desfecho: 'Gera a solicitação com endereço e agenda do técnico.',
      variaveis: ['{primeiro_nome}', '{estabelecimento}'],
      passos: [
        {
          numero: 1,
          titulo: 'Coleta de Endereço',
          ator: 'bot',
          mensagem: 'Informe seu endereço completo para a visita técnica:',
        },
        {
          numero: 2,
          titulo: 'Janela de Horário',
          ator: 'bot',
          mensagem: 'Escolha o melhor turno:\n1️⃣ Manhã (08h às 12h)\n2️⃣ Tarde (13h às 18h)',
        },
        {
          numero: 3,
          titulo: 'Confirmação',
          ator: 'bot',
          mensagem: '🧰 Visita técnica solicitada! Um de nossos técnicos confirmará o horário.',
        },
      ],
    },
    {
      key: 'opc12Simular',
      opcaoNumero: 12,
      titulo: '12. Simulação / Calculadora de Estimativa',
      icone: '🧮',
      categoria: 'servicos',
      descricao: 'Coleta parâmetros numéricos para realizar cálculo prévio de estimativa.',
      desfecho: 'Apresenta a estimativa calculada dinamicamente.',
      variaveis: ['{primeiro_nome}'],
      passos: [
        {
          numero: 1,
          titulo: 'Parâmetros',
          ator: 'bot',
          mensagem: 'Informe a quantidade ou extensão desejada para simulação:',
        },
        {
          numero: 2,
          titulo: 'Cálculo',
          ator: 'bot',
          mensagem: '🧮 Estimativa calculada:\n\nValor estimado: R$ 350,00 a R$ 420,00.',
        },
      ],
    },
    {
      key: 'opc13TriagemAdvocacia',
      opcaoNumero: 13,
      titulo: '13. Triagem Jurídica por Área (Advocacia & Consultoria)',
      icone: '⚖️',
      categoria: 'servicos',
      descricao: 'Triagem completa de casos jurídicos por especialidade do catálogo do estabelecimento.',
      desfecho: 'Compila o resumo completo do caso com mídias/áudios e entrega opções pós-triagem.',
      variaveis: ['{primeiro_nome}', '{estabelecimento}', '{profissional}'],
      passos: [
        {
          numero: 1,
          titulo: 'Área do Direito',
          ator: 'bot',
          mensagem: '⚖️ Selecione a área jurídica:\n1️⃣ Trabalhista\n2️⃣ Família e Sucessões\n3️⃣ Consumidor / Cível\n4️⃣ Previdenciário / INSS',
        },
        {
          numero: 2,
          titulo: 'Relato do Caso',
          ator: 'bot',
          mensagem: 'Descreva a sua situação em texto ou áudios. Quando concluir, digite "PRONTO".',
        },
        {
          numero: 3,
          titulo: 'Buffer Silencioso',
          ator: 'sistema',
          mensagem: 'Acúmulo de mídias e áudios sem interromper o cliente.',
        },
        {
          numero: 4,
          titulo: 'Conclusão',
          ator: 'cliente',
          mensagem: 'PRONTO',
        },
        {
          numero: 5,
          titulo: 'Menu Pós-Triagem',
          ator: 'bot',
          mensagem: '✅ Seu relato foi registrado com sucesso!\n\n1️⃣ Agendar Consulta na Agenda\n2️⃣ Falar com Advogado no WhatsApp\n3️⃣ Encerrar',
        },
      ],
    },
    {
      key: 'opc14ModoProfissional',
      opcaoNumero: 14,
      titulo: '14. Modo Profissional / Painel de Gestão do WhatsApp (Atendente)',
      icone: '👔',
      categoria: 'profissional',
      descricao: 'Fluxo especial ativado quando a mensagem é enviada por um Profissional/Atendente cadastrado.',
      desfecho: 'Permite gerenciar agendamentos pendentes, aprovar/recusar solicitações e ver compromissos do dia no chat.',
      variaveis: ['{primeiro_nome}', '{estabelecimento}', '{data_horario}'],
      passos: [
        {
          numero: 1,
          titulo: 'Identificação',
          ator: 'sistema',
          mensagem: 'Remetente identificado como Profissional/Atendente cadastrado.',
        },
        {
          numero: 2,
          titulo: 'Alternador de Papel',
          ator: 'bot',
          mensagem: 'Olá! Como deseja interagir agora?\n1️⃣ Modo Profissional (Agenda & Pendências)\n2️⃣ Modo Cliente',
        },
        {
          numero: 3,
          titulo: 'Painel de Atendimento',
          ator: 'bot',
          mensagem: '👔 Painel do Profissional:\n1️⃣ Agendamentos Pendentes (3 aguardando)\n2️⃣ Agenda de Hoje\n0️⃣ Alternar Modo',
        },
        {
          numero: 4,
          titulo: 'Aprovação por Botão (SignalR)',
          ator: 'atendente',
          mensagem: 'Atendente clica em "✅ Confirmar". Status atualizado em tempo real na agenda.',
        },
      ],
    },
    {
      key: 'opc15Encerramento',
      opcaoNumero: 15,
      titulo: '15. Encerramento Inteligente & Reações de Saída',
      icone: '🛑',
      categoria: 'sistema',
      descricao: 'Encerramento automatizado com suporte a reações por emoji (🛑, 🔚, 🔴, ❌, 👋) ou frase normalizada.',
      desfecho: 'Finaliza a sessão do cliente, limpa buffers e envia a mensagem de despedida.',
      variaveis: ['{primeiro_nome}', '{estabelecimento}'],
      passos: [
        {
          numero: 1,
          titulo: 'Gatilho de Saída',
          ator: 'cliente',
          mensagem: 'sair',
        },
        {
          numero: 2,
          titulo: 'Limpeza de Buffer',
          ator: 'sistema',
          mensagem: 'Sessão resetada e restaurada para o estado inicial.',
        },
        {
          numero: 3,
          titulo: 'Mensagem de Despedida',
          ator: 'bot',
          mensagem: '👋 Atendimento encerrado com sucesso! Agradecemos o seu contato com o FasTo. Tenha um ótimo dia!',
        },
      ],
    },
  ]);

  protected filteredFluxos = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.selectedCategoria();

    return this.fluxosList().filter((f) => {
      const matchCat = cat === 'todos' || f.categoria === cat;
      const matchQuery =
        !q ||
        f.titulo.toLowerCase().includes(q) ||
        f.descricao.toLowerCase().includes(q) ||
        f.key.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  });

  protected currentFluxo = computed(() => {
    const key = this.selectedFluxoKey();
    return this.fluxosList().find((f) => f.key === key) || this.fluxosList()[0];
  });

  ngOnInit(): void {
    if (this.filteredFluxos().length > 0) {
      this.selectedFluxoKey.set(this.filteredFluxos()[0].key);
    }
    this.iniciarSimulacao();
  }

  selectFluxo(key: string): void {
    this.selectedFluxoKey.set(key);
    this.iniciarSimulacao();
  }

  setCategoria(cat: string): void {
    this.selectedCategoria.set(cat);
    const list = this.filteredFluxos();
    if (list.length > 0) {
      this.selectedFluxoKey.set(list[0].key);
    }
    this.iniciarSimulacao();
  }

  // --- LÓGICA DA SIMULAÇÃO INTERATIVA ---
  
  protected iniciarSimulacao(): void {
    this.stepIndex.set(0);
    this.chatHistory.set([]);
  }

  protected resetarSimulacao(): void {
    this.userMessageInput.set('');
    this.iniciarSimulacao();
  }

  protected enviarMensagemSimulada(): void {
    const textoDigitado = this.userMessageInput().trim();
    if (!textoDigitado) return;

    const fluxo = this.currentFluxo();
    const horaAtual = this.getHoraFormatada();

    // Adiciona mensagem enviada pelo cliente no histórico
    const novoHistorico = [...this.chatHistory()];
    novoHistorico.push({
      id: 'msg_cli_' + Date.now(),
      autor: 'cliente',
      texto: textoDigitado,
      hora: horaAtual,
    });

    this.chatHistory.set(novoHistorico);
    this.userMessageInput.set('');

    // Processa a resposta automatizada do Bot / Sistema
    setTimeout(() => {
      this.processarRespostaSimulada(textoDigitado, fluxo);
    }, 300);
  }

  private processarRespostaSimulada(inputUser: string, fluxo: FluxoDetelhado): void {
    const inputNorm = inputUser.toLowerCase();
    const horaAtual = this.getHoraFormatada();

    // Comandos globais de reset/menu
    if (inputNorm === '0' || inputNorm === 'menu' || inputNorm === 'reset' || inputNorm === 'reiniciar') {
      this.iniciarSimulacao();
      return;
    }

    const historico = [...this.chatHistory()];
    let curIdx = this.stepIndex();

    // Tratamento dinâmico para opções de pós-atendimento (1: Encerrar / 2: Voltar ao menu)
    if (curIdx > 0 && curIdx < fluxo.passos.length) {
      const msgAnterior = fluxo.passos[curIdx]?.mensagem || '';
      if (msgAnterior.includes('1️⃣ Encerrar') || msgAnterior.includes('2️⃣ Voltar')) {
        if (inputNorm === '2' || inputNorm === 'voltar') {
          historico.push({
            id: 'msg_bot_menu_' + Date.now(),
            autor: 'bot',
            texto: '🔄 Voltando ao menu principal...\n\nDigite uma opção de 1 a 10 ou envie sua mensagem.',
            hora: horaAtual,
          });
          this.stepIndex.set(0);
          this.chatHistory.set(historico);
          return;
        } else if (inputNorm === '1' || inputNorm === 'encerrar' || inputNorm === 'sair') {
          historico.push({
            id: 'msg_bot_bye_' + Date.now(),
            autor: 'bot',
            texto: '👋 Atendimento encerrado com sucesso! Agradecemos o seu contato com o FasTo. Tenha um ótimo dia!',
            hora: horaAtual,
          });
          this.stepIndex.set(fluxo.passos.length);
          this.chatHistory.set(historico);
          return;
        }
      }
    }

    // Se estiver no início (nenhuma resposta do bot enviada ainda)
    if (curIdx === 0 && fluxo.passos.length > 0) {
      // Se o primeiro passo for a provocação do cliente (ex: '1', '2', etc.), avançamos para o passo de resposta do bot
      if (fluxo.passos[0].ator === 'cliente') {
        curIdx = 1;
      }
    } else {
      curIdx = curIdx + 1;
      // Se o próximo passo for um ator cliente (ex: etapas intermediárias), pula para a resposta do bot
      if (curIdx < fluxo.passos.length && fluxo.passos[curIdx].ator === 'cliente') {
        curIdx = curIdx + 1;
      }
    }

    if (curIdx < fluxo.passos.length) {
      const passoAlvo = fluxo.passos[curIdx];
      this.stepIndex.set(curIdx);

      historico.push({
        id: 'msg_bot_' + Date.now(),
        autor: passoAlvo.ator,
        texto: passoAlvo.mensagem,
        hora: horaAtual,
        detalhes: passoAlvo.detalhes,
        fallback: passoAlvo.fallback,
      });

      // Se o passo atual for um evento do sistema e o próximo for a resposta do bot (ex: confirmação final), inclui ambos
      if (passoAlvo.ator === 'sistema' && (curIdx + 1) < fluxo.passos.length) {
        const passoConclusivo = fluxo.passos[curIdx + 1];
        this.stepIndex.set(curIdx + 1);
        historico.push({
          id: 'msg_bot_conc_' + Date.now(),
          autor: passoConclusivo.ator,
          texto: passoConclusivo.mensagem,
          hora: horaAtual,
          detalhes: passoConclusivo.detalhes,
          fallback: passoConclusivo.fallback,
        });
      }

    } else {
      // Fim das etapas do fluxo -> Envia mensagem conclusiva
      historico.push({
        id: 'msg_end_' + Date.now(),
        autor: 'bot',
        texto: '✅ Fluxo concluído com sucesso! Digite "0" para reiniciar esta simulação ou selecione outro fluxo na lista.',
        hora: horaAtual,
      });
    }

    this.chatHistory.set(historico);
  }

  private getHoraFormatada(): string {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
