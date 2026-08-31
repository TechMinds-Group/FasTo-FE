import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Topico {
  icone: string;
  titulo: string;
  descricao: string;
}

interface Versao {
  versao: string;
  data: string;
  welcome?: string;
  topicos?: Topico[];
  novidades?: Topico[];
  mudancas?: Topico[];
  removidos?: Topico[];
}

interface ResultadoBusca {
  icone: string;
  titulo: string;
  descricao: string;
  versao: string;
  secao: string;
}

@Component({
  selector: 'app-guia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guia.component.html',
  styleUrl: './guia.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuiaComponent {
  protected readonly versoes: Versao[] = [
    {
      versao: '1.1.0',
      data: 'Julho 2026',
      welcome: 'Novidades e melhorias para facilitar o dia a dia do seu estabelecimento.',
      novidades: [
        {
          icone: 'fas fa-link',
          titulo: 'Link Compartilhável para Clientes',
          descricao: 'Gere um link temporário para cada cliente. O cliente pode visualizar seus dados (histórico e status de agendamentos) sem precisar fazer login. O link expira após o período configurado.',
        },
        {
          icone: 'fas fa-cog',
          titulo: 'Tela de Configurações',
          descricao: 'Nova tela para ajustar as preferências e dados do seu estabelecimento. Acesse pelo menu "Configurações".',
        },
      ],
      mudancas: [
        {
          icone: 'fas fa-bars',
          titulo: 'Sidebar Responsiva com Collapse',
          descricao: 'A sidebar agora pode ser recolhida, mostrando apenas os ícones. Ideal para telas menores ou quando você quer mais espaço para o conteúdo principal.',
        },
        {
          icone: 'fas fa-palette',
          titulo: 'Ajustes de Tema e UI',
          descricao: 'Correções de cor e alinhamento nos ícones do menu Configurações e no badge de versão para melhor consistência visual entre tema claro e escuro.',
        },
      ],
      topicos: [
        {
          icone: 'fas fa-link',
          titulo: 'Clientes > Compartilhar Link',
          descricao: 'Nos detalhes do cliente, clique em "Gerar Link" para criar um link temporário. Copie o link e envie ao cliente. O link expira automaticamente com base na configuração de validade.',
        },
        {
          icone: 'fas fa-cog',
          titulo: 'Configurações > Validade do Link',
          descricao: 'Acesse o menu "Configurações" para definir por quantos dias o link compartilhável fica ativo (mínimo 1, máximo 365 dias). O padrão é 5 dias.',
        },
        {
          icone: 'fas fa-eye',
          titulo: 'Visualização Pública do Cliente',
          descricao: 'Ao acessar o link, o cliente vê seus dados e seus agendamentos recentes. Nenhuma alteração é permitida — apenas consulta.',
        },
        {
          icone: 'fas fa-bars',
          titulo: 'Sidebar Recolhível',
          descricao: 'Clique no ícone de hambúrguer no topo da sidebar para recolhê-la. Isso exibe apenas os ícones, dando mais espaço para o conteúdo principal. Clique novamente para expandir.',
        },
      ],
    },
    {
      versao: '1.0.0',
      data: 'Julho 2026',
      welcome: 'Bem-vindo ao FasTo! O sistema definitivo para gestão de agendamentos por WhatsApp e automação de atendimento para qualquer tipo de estabelecimento.',
      topicos: [
        {
          icone: 'fas fa-th-large',
          titulo: 'Dashboard',
          descricao: 'Visão geral do negócio. Acompanhe o faturamento, total de atendimentos concluídos, ocupação da agenda e gráficos em tempo real.',
        },
        {
          icone: 'fas fa-users',
          titulo: 'Gestão > Clientes',
          descricao: 'Gerencie o cadastro de clientes. Cadastre novos clientes, veja o histórico de atendimentos e acesse contato direto via WhatsApp.',
        },

        {
          icone: 'fas fa-concierge-bell',
          titulo: 'Serviços',
          descricao: 'Cadastre as opções de atendimento oferecidas pelo seu estabelecimento. Cada serviço possui nome, preço e duração em minutos.',
        },
        {
          icone: 'fas fa-users-gear',
          titulo: 'Gestão > Atendentes & Usuários',
          descricao: 'Gerencie os atendentes e usuários da sua empresa com acesso ao sistema. Defina permissões e funções de acesso.',
        },
        {
          icone: 'fas fa-credit-card',
          titulo: 'Configurações > Assinatura',
          descricao: 'Consulte o plano contratado do sistema FasTo e acompanhe o uso da licença do estabelecimento.',
        },
        {
          icone: 'fas fa-language',
          titulo: 'Menu do Perfil > Idioma',
          descricao: 'Altere o idioma do sistema entre português, inglês e espanhol.',
        },
        {
          icone: 'fas fa-circle-half-stroke',
          titulo: 'Menu do Perfil > Tema',
          descricao: 'Alterne entre tema claro e escuro.',
        },
        {
          icone: 'fas fa-right-from-bracket',
          titulo: 'Menu do Perfil > Sair',
          descricao: 'Encerre sua sessão no sistema com segurança. O acesso ao fasto será bloqueado até o próximo login.',
        },
      ],
    },
  ];

  protected readonly versaoSelecionada = signal<Versao>(this.versoes[0]);
  protected readonly busca = signal('');

  protected readonly resultadosBusca = computed(() => {
    const q = this.busca().toLowerCase().trim();
    if (!q) return [];

    const resultados: ResultadoBusca[] = [];

    for (const v of this.versoes) {
      const secoes: { itens: Topico[] | undefined; nome: string }[] = [
        { itens: v.topicos, nome: 'Como usar' },
        { itens: v.novidades, nome: 'Novidades' },
        { itens: v.mudancas, nome: 'Melhorias' },
        { itens: v.removidos, nome: 'O que deixou de ter' },
      ];

      for (const secao of secoes) {
        if (!secao.itens) continue;
        for (const item of secao.itens) {
          if (
            item.titulo.toLowerCase().includes(q) ||
            item.descricao.toLowerCase().includes(q)
          ) {
            resultados.push({
              icone: item.icone,
              titulo: item.titulo,
              descricao: item.descricao,
              versao: `V ${v.versao}`,
              secao: secao.nome,
            });
          }
        }
      }
    }

    return resultados;
  });

  protected selecionarVersao(v: Versao): void {
    this.versaoSelecionada.set(v);
  }

  protected buscar(texto: string): void {
    this.busca.set(texto);
  }
}

