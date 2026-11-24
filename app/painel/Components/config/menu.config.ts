/* ==========================================================
   UNIVERSO IMPÉRIO
   CONFIGURAÇÃO CENTRAL DO PAINEL ADMINISTRATIVO
========================================================== */

/* ==========================================================
   1. TIPOS
========================================================== */

export interface MenuItem {
  nome: string;
  rota: string;
  icone: string;
}

export interface MenuDropdownItem {
  titulo: string;
  descricao: string;
  rota: string;
  icone: string;
}

export interface MenuDropdownGrupo {
  titulo: string;
  itens: MenuDropdownItem[];
}

export interface MenuDropdownConfig {
  id: string;
  nome: string;
  titulo: string;
  descricao: string;
  icone: string;
  badge: string;
  rodape: string;
  identificador: string;
  ariaLabel: string;
  grupos: MenuDropdownGrupo[];
}

export interface IndicadorDashboard {
  titulo: string;
  valor: string;
  descricao: string;
  icone: string;
  cor: string;
  detalhe: string;
}

export interface OperacaoDashboard {
  titulo: string;
  descricao: string;
  icone: string;
  rota: string;
  etiqueta: string;
}

export interface ResumoDashboard {
  titulo: string;
  descricao: string;
  valor: string;
  icone: string;
  cor: string;
}

export interface AcessoDashboard {
  nome: string;
  descricao: string;
  rota: string;
  icone: string;
}

/* ==========================================================
   2. ROTAS DO PAINEL
========================================================== */

export const ROTAS_PAINEL = {
  painel: "/painel",

  /* PRINCIPAL */
  pedidos: "/painel/pedidos",
  entregas: "/painel/entregas",
  cadastrarEntrega: "/painel/entregas/cadastrar",
  eventosEntrega: "/painel/entregas/eventos",
  configuracoes: "/painel/configuracoes",

  /* PESSOAS */
  clientes: "/painel/clientes",
  usuarios: "/painel/usuarios",

  /* PRODUTOS */
  produtos: "/painel/produtos",
  listarProdutos: "/painel/produtos/Listar",
  cadastrarProduto: "/painel/produtos/cadastrar",
  imagensProdutos: "/painel/produtos/imagens",
  categorias: "/painel/categorias",
  marcas: "/painel/marcas",
  atributos: "/painel/atributos",
  variacoes: "/painel/variacoes",

  /* ESTOQUE */
  estoque: "/painel/estoque",
  locaisEstoque: "/painel/estoque/locais",
  saldosEstoque: "/painel/estoque/saldos",
  reservasEstoque: "/painel/estoque/reservas",
  movimentacoesEstoque: "/painel/estoque/movimentacoes",

  /* CUPONS */
  cupons: "/painel/cupons",
  cadastrarCupom: "/painel/cupons/cadastrar",
  utilizacoesCupons: "/painel/cupons/utilizacoes",

  /* CONTEÚDO */
  conteudo: "/painel/conteudo",
  navbar: "/painel/conteudo/navbar",
  banners: "/painel/conteudo/banners",
  campanhas: "/painel/conteudo/campanhas",
  secoes: "/painel/conteudo/secoes",
  footer: "/painel/conteudo/footer",
  menus: "/painel/conteudo/menus",
  identidadeVisual: "/painel/conteudo/identidade-visual",

  /* MARKETING E RELATÓRIOS */
  marketing: "/painel/marketing",
  relatorios: "/painel/relatorios",
} as const;

/* ==========================================================
   3. NAVEGAÇÃO PRINCIPAL
========================================================== */

export const MENU_ADMINISTRATIVO = {
  painel: {
    nome: "Painel",
    rota: ROTAS_PAINEL.painel,
    icone: "layout-dashboard",
  },

  pedidos: {
    nome: "Pedidos",
    rota: ROTAS_PAINEL.pedidos,
    icone: "shopping-cart",
  },

  configuracoes: {
    nome: "Configurações",
    rota: ROTAS_PAINEL.configuracoes,
    icone: "settings",
  },
} as const;

/* ==========================================================
   4. ROTAS PRINCIPAIS DO MENU
========================================================== */

export const ROTAS_MENU = {
  painel: ROTAS_PAINEL.painel,
  pedidos: ROTAS_PAINEL.pedidos,
  configuracoes: ROTAS_PAINEL.configuracoes,
} as const;

/* ==========================================================
   5. IDENTIDADE DO PAINEL
========================================================== */

export const IDENTIDADE_PAINEL = {
  nome: "UNIVERSO",
  marca: "IMPÉRIO V3",
  rotaInicial: ROTAS_PAINEL.painel,
  descricao: "Painel administrativo do Universo Império",
  icone: "crown",
} as const;

/* ==========================================================
   6. CONFIGURAÇÃO GERAL DOS MENUS
========================================================== */

export const CONFIG_MENU = {
  id: "admin-navigation",
  ariaLabel: "Menu administrativo",
  classeBase: "admin-nav-link",
  classeAtiva: "active",
  fecharAoNavegar: true,
  fecharComEscape: true,
} as const;

/* ==========================================================
   7. MENUS DROPDOWN

   PADRÃO:
   1. VISÃO GERAL
   2. GERENCIAMENTO
   3. ORGANIZAÇÃO
========================================================== */

export const MENU_DROPDOWNS = {
  /* --------------------------------------------------------
     CUPONS
  -------------------------------------------------------- */

  cupons: {
    id: "cupons",
    nome: "Cupons",
    titulo: "Central de cupons",
    descricao: "Gerencie descontos e utilizações",
    icone: "ticket",
    badge: "V3",
    rodape: "Universo Império",
    identificador: "CUPONS",
    ariaLabel: "Navegação de cupons",

    grupos: [
      {
        titulo: "VISÃO GERAL",
        itens: [
          {
            titulo: "Listar cupons",
            descricao: "Visualizar e consultar cupons cadastrados",
            rota: ROTAS_PAINEL.cupons,
            icone: "ticket",
          },
          {
            titulo: "Utilizações",
            descricao: "Consultar histórico de cupons utilizados",
            rota: ROTAS_PAINEL.utilizacoesCupons,
            icone: "receipt-text",
          },
        ],
      },

      {
        titulo: "GERENCIAMENTO",
        itens: [
          {
            titulo: "Cadastrar cupom",
            descricao: "Criar um novo cupom de desconto",
            rota: ROTAS_PAINEL.cadastrarCupom,
            icone: "ticket-plus",
          },
        ],
      },
    ],
  },

  /* --------------------------------------------------------
     PEDIDOS E ENTREGAS
  -------------------------------------------------------- */

  pedidos: {
    id: "pedidos",
    nome: "Pedidos",
    titulo: "Central de pedidos e entregas",
    descricao: "Acompanhe vendas, envios e rastreamento",
    icone: "shopping-cart",
    badge: "V3",
    rodape: "Universo Império",
    identificador: "PEDIDOS",
    ariaLabel: "Navegação de pedidos e entregas",

    grupos: [
      {
        titulo: "VISÃO GERAL",
        itens: [
          {
            titulo: "Listar pedidos",
            descricao: "Consultar pedidos recebidos e acompanhar seus status",
            rota: ROTAS_PAINEL.pedidos,
            icone: "shopping-cart",
          },
          {
            titulo: "Entregas",
            descricao:
              "Visualizar envios, transportadoras e códigos de rastreio",
            rota: ROTAS_PAINEL.entregas,
            icone: "truck",
          },
        ],
      },
      {
        titulo: "GERENCIAMENTO DE ENTREGAS",
        itens: [
          {
            titulo: "Cadastrar entrega",
            descricao: "Vincular uma entrega a um pedido existente",
            rota: ROTAS_PAINEL.cadastrarEntrega,
            icone: "package-plus",
          },
          {
            titulo: "Eventos e rastreamento",
            descricao: "Consultar e registrar atualizações do transporte",
            rota: ROTAS_PAINEL.eventosEntrega,
            icone: "route",
          },
        ],
      },
    ],
  },

  /* --------------------------------------------------------
     PESSOAS
  -------------------------------------------------------- */

  pessoas: {
    id: "pessoas",
    nome: "Pessoas",
    titulo: "Central de pessoas",
    descricao: "Gerencie clientes e usuários",
    icone: "users",
    badge: "V3",
    rodape: "Universo Império",
    identificador: "PESSOAS",
    ariaLabel: "Navegação de pessoas",

    grupos: [
      {
        titulo: "GERENCIAMENTO",
        itens: [
          {
            titulo: "Clientes",
            descricao: "Consultar e gerenciar clientes cadastrados",
            rota: ROTAS_PAINEL.clientes,
            icone: "user-round",
          },
          {
            titulo: "Usuários",
            descricao: "Gerenciar usuários do painel administrativo",
            rota: ROTAS_PAINEL.usuarios,
            icone: "users-round",
          },
        ],
      },
    ],
  },

  /* --------------------------------------------------------
     PRODUTOS
  -------------------------------------------------------- */

  produtos: {
    id: "produtos",
    nome: "Produtos",
    titulo: "Central de produtos",
    descricao: "Gerencie seu catálogo de produtos",
    icone: "package",
    badge: "V3",
    rodape: "Universo Império",
    identificador: "PRODUTOS",
    ariaLabel: "Navegação de produtos",

    grupos: [
      {
        titulo: "VISÃO GERAL",
        itens: [
          {
            titulo: "Dashboard de produtos",
            descricao: "Indicadores, cards e gráficos do catálogo",
            rota: ROTAS_PAINEL.produtos,
            icone: "layout-dashboard",
          },
          {
            titulo: "Listar produtos",
            descricao: "Visualizar todos os produtos cadastrados",
            rota: ROTAS_PAINEL.listarProdutos,
            icone: "package",
          },
        ],
      },

      {
        titulo: "GERENCIAMENTO",
        itens: [
          {
            titulo: "Cadastrar produto",
            descricao: "Adicionar um novo produto ao catálogo",
            rota: ROTAS_PAINEL.cadastrarProduto,
            icone: "plus-circle",
          },
          {
            titulo: "Imagens",
            descricao: "Gerenciar a galeria de imagens dos produtos",
            rota: ROTAS_PAINEL.imagensProdutos,
            icone: "image",
          },
        ],
      },

      {
        titulo: "ORGANIZAÇÃO",
        itens: [
          {
            titulo: "Categorias",
            descricao: "Organizar categorias dos produtos",
            rota: ROTAS_PAINEL.categorias,
            icone: "layers",
          },
          {
            titulo: "Marcas",
            descricao: "Gerenciar marcas cadastradas",
            rota: ROTAS_PAINEL.marcas,
            icone: "tags",
          },
          {
            titulo: "Atributos",
            descricao: "Configurar características dos produtos",
            rota: ROTAS_PAINEL.atributos,
            icone: "sliders-horizontal",
          },
          {
            titulo: "Variações de produtos",
            descricao: "Gerenciar tamanhos, cores e combinações",
            rota: ROTAS_PAINEL.variacoes,
            icone: "layers",
          },
        ],
      },
    ],
  },

  /* --------------------------------------------------------
     ESTOQUE
  -------------------------------------------------------- */

  estoque: {
    id: "estoque",
    nome: "Estoque",
    titulo: "Central de estoque",
    descricao: "Controle locais, saldos, reservas e movimentações",
    icone: "package",
    badge: "V3",
    rodape: "Universo Império",
    identificador: "ESTOQUE",
    ariaLabel: "Navegação de estoque",

    grupos: [
      {
        titulo: "VISÃO GERAL",
        itens: [
          {
            titulo: "Visão geral do estoque",
            descricao: "Acompanhar a situação geral do estoque",
            rota: ROTAS_PAINEL.estoque,
            icone: "layout-dashboard",
          },
        ],
      },
      {
        titulo: "GERENCIAMENTO",
        itens: [
          {
            titulo: "Locais de estoque",
            descricao: "Gerenciar depósitos e locais de armazenamento",
            rota: ROTAS_PAINEL.locaisEstoque,
            icone: "map-pin",
          },
          {
            titulo: "Saldos",
            descricao: "Consultar quantidades por produto e local",
            rota: ROTAS_PAINEL.saldosEstoque,
            icone: "boxes",
          },
          {
            titulo: "Reservas",
            descricao: "Acompanhar produtos reservados para pedidos",
            rota: ROTAS_PAINEL.reservasEstoque,
            icone: "calendar-clock",
          },
          {
            titulo: "Movimentações",
            descricao: "Consultar entradas, saídas e ajustes de estoque",
            rota: ROTAS_PAINEL.movimentacoesEstoque,
            icone: "arrow-left-right",
          },
        ],
      },
    ],
  },

  /* --------------------------------------------------------
     CONTEÚDO / CMS
  -------------------------------------------------------- */

  conteudo: {
    id: "conteudo",
    nome: "Conteúdo",
    titulo: "Central de conteúdo",
    descricao: "Gerencie a aparência e o conteúdo da sua loja",
    icone: "layout-template",
    badge: "CMS",
    rodape: "Universo Império",
    identificador: "CONTEUDO",
    ariaLabel: "Navegação de conteúdo",

    grupos: [
      {
        titulo: "VISÃO GERAL",
        itens: [
          {
            titulo: "Visão geral do conteúdo",
            descricao: "Acessar a central de conteúdo da loja",
            rota: ROTAS_PAINEL.conteudo,
            icone: "layout-dashboard",
          },
        ],
      },

      {
        titulo: "GERENCIAMENTO",
        itens: [
          {
            titulo: "Navbar",
            descricao: "Gerenciar logo, menus e navegação",
            rota: ROTAS_PAINEL.navbar,
            icone: "panel-top",
          },
          {
            titulo: "Banners",
            descricao: "Gerenciar imagens, campanhas e carrosséis",
            rota: ROTAS_PAINEL.banners,
            icone: "image",
          },
          {
            titulo: "Campanhas",
            descricao: "Gerenciar promoções, descontos e ofertas",
            rota: ROTAS_PAINEL.campanhas,
            icone: "megaphone",
          },
          {
            titulo: "Seções da página inicial",
            descricao: "Gerenciar vitrines, títulos e blocos",
            rota: ROTAS_PAINEL.secoes,
            icone: "layout-template",
          },
          {
            titulo: "Footer",
            descricao: "Gerenciar links, contatos e informações",
            rota: ROTAS_PAINEL.footer,
            icone: "panel-bottom",
          },
          {
            titulo: "Menus e navegação",
            descricao: "Organizar links e menus da loja",
            rota: ROTAS_PAINEL.menus,
            icone: "menu",
          },
        ],
      },

      {
        titulo: "ORGANIZAÇÃO",
        itens: [
          {
            titulo: "Identidade visual",
            descricao: "Configurar logotipo, cores e aparência da loja",
            rota: ROTAS_PAINEL.identidadeVisual,
            icone: "palette",
          },
        ],
      },
    ],
  },
} satisfies Record<string, MenuDropdownConfig>;

/* ==========================================================
   8. DASHBOARD — INDICADORES
========================================================== */

export const INDICADORES_DASHBOARD: IndicadorDashboard[] = [
  {
    titulo: "Faturamento",
    valor: "R$ 0,00",
    descricao: "Faturamento da loja",
    icone: "credit-card",
    cor: "pink",
    detalhe: "Visão geral das vendas",
  },
  {
    titulo: "Pedidos",
    valor: "0",
    descricao: "Pedidos recebidos",
    icone: "shopping-cart",
    cor: "blue",
    detalhe: "Acompanhe suas vendas",
  },
  {
    titulo: "Clientes",
    valor: "0",
    descricao: "Clientes cadastrados",
    icone: "users",
    cor: "purple",
    detalhe: "Relacionamento com clientes",
  },
  {
    titulo: "Produtos",
    valor: "0",
    descricao: "Produtos cadastrados",
    icone: "package",
    cor: "green",
    detalhe: "Itens disponíveis na loja",
  },
];

/* ==========================================================
   9. DASHBOARD — CENTRAL DE OPERAÇÕES
========================================================== */

export const OPERACOES_DASHBOARD: OperacaoDashboard[] = [
  {
    titulo: "Produtos",
    descricao: "Cadastre, edite e organize os produtos da sua loja.",
    icone: "package",
    rota: ROTAS_PAINEL.produtos,
    etiqueta: "CATÁLOGO",
  },
  {
    titulo: "Pedidos",
    descricao: "Acompanhe compras, pagamentos e entregas.",
    icone: "shopping-cart",
    rota: ROTAS_PAINEL.pedidos,
    etiqueta: "VENDAS",
  },
  {
    titulo: "Clientes",
    descricao: "Consulte cadastros e gerencie seus clientes.",
    icone: "users",
    rota: ROTAS_PAINEL.clientes,
    etiqueta: "RELACIONAMENTO",
  },
  {
    titulo: "Configurações",
    descricao: "Personalize o funcionamento da sua loja.",
    icone: "settings",
    rota: ROTAS_PAINEL.configuracoes,
    etiqueta: "SISTEMA",
  },
];

/* ==========================================================
   10. DASHBOARD — RESUMO OPERACIONAL
========================================================== */

export const RESUMO_DASHBOARD: ResumoDashboard[] = [
  {
    titulo: "Pedidos pendentes",
    descricao: "Aguardando processamento",
    valor: "0",
    icone: "clock",
    cor: "warning",
  },
  {
    titulo: "Estoque baixo",
    descricao: "Produtos que precisam de atenção",
    valor: "0",
    icone: "alert-circle",
    cor: "danger",
  },
  {
    titulo: "Novos clientes",
    descricao: "Cadastros recentes",
    valor: "0",
    icone: "user-plus",
    cor: "success",
  },
  {
    titulo: "Produtos cadastrados",
    descricao: "Itens no catálogo",
    valor: "0",
    icone: "package",
    cor: "info",
  },
];

/* ==========================================================
   11. DASHBOARD — ACESSOS RÁPIDOS
========================================================== */

export const ACESSOS_DASHBOARD: AcessoDashboard[] = [
  {
    nome: "Produtos",
    descricao: "Gerenciar catálogo",
    rota: ROTAS_PAINEL.produtos,
    icone: "package",
  },
  {
    nome: "Categorias",
    descricao: "Organizar produtos",
    rota: ROTAS_PAINEL.categorias,
    icone: "layers",
  },
  {
    nome: "Pedidos",
    descricao: "Acompanhar vendas",
    rota: ROTAS_PAINEL.pedidos,
    icone: "shopping-cart",
  },
  {
    nome: "Clientes",
    descricao: "Base de clientes",
    rota: ROTAS_PAINEL.clientes,
    icone: "users",
  },
  {
    nome: "Marketing",
    descricao: "Campanhas e ofertas",
    rota: ROTAS_PAINEL.marketing,
    icone: "megaphone",
  },
  {
    nome: "Relatórios",
    descricao: "Análises da loja",
    rota: ROTAS_PAINEL.relatorios,
    icone: "bar-chart",
  },
];

/* ==========================================================
   12. CLASSES VISUAIS DO DASHBOARD
========================================================== */

export const CLASSES_INDICADORES: Record<string, string> = {
  pink: "pink",
  blue: "blue",
  purple: "purple",
  green: "green",
};

export const CLASSES_RESUMO: Record<string, string> = {
  warning: "warning",
  danger: "danger",
  success: "success",
  info: "info",
};

/* ==========================================================
   13. CONFIGURAÇÃO DO DASHBOARD
========================================================== */

export const CONFIG_DASHBOARD = {
  breadcrumb: {
    secao: "PAINEL",
    pagina: "VISÃO GERAL",
    icone: "layout-dashboard",
  },

  ambiente: {
    nome: "AMBIENTE ADMINISTRATIVO",
    status: "ATIVO",
    versao: "V3",
  },

  hero: {
    etiqueta: "CENTRAL DE GESTÃO",
    titulo: "Sua loja,",
    destaque: "em um só lugar.",
    descricao:
      "Bem-vindo ao painel do Universo Império. Gerencie sua operação, acompanhe os indicadores e mantenha tudo organizado.",
    textoBotaoPedidos: "Acompanhar pedidos",
    textoBotaoProdutos: "Gerenciar produtos",
    rotaPedidos: ROTAS_PAINEL.pedidos,
    rotaProdutos: ROTAS_PAINEL.produtos,
  },

  visual: {
    status: "PAINEL ATIVO",
    marca: "UNIVERSO IMPÉRIO",
    titulo: "Gestão inteligente",
    descricao: "Organização para sua operação crescer.",
    rodape: "Estrutura administrativa",
    chipCatalogo: "Catálogo",
    descricaoCatalogo: "Produtos e categorias",
    chipClientes: "Clientes",
    descricaoClientes: "Relacionamento",
  },

  pedidos: {
    titulo: "Pedidos recentes",
    descricao: "Acompanhe as últimas compras realizadas na loja.",
    mensagemVazia: "Nenhum pedido por enquanto",
    descricaoVazia:
      "Quando sua loja receber novas compras, os pedidos aparecerão nesta área para você acompanhar cada etapa.",
    textoBotao: "Acessar gerenciamento de pedidos",
    rota: ROTAS_PAINEL.pedidos,
  },

  informacoes: {
    nome: "Universo Império",
    mensagemRodape: "Feito para organizar e impulsionar sua loja.",
    versao: "V3",
    avisoTitulo: "Dados demonstrativos",
    avisoDescricao:
      "Os indicadores serão atualizados quando a integração com a API estiver disponível.",
  },
} as const;

/* ==========================================================
   14. NOTIFICAÇÕES
========================================================== */

export const CONFIG_NOTIFICACOES = {
  nome: "Notificações",
  ariaLabel: "Notificações",
  icone: "bell",
} as const;

/* ==========================================================
   15. PERFIL
========================================================== */

export const CONFIG_PERFIL = {
  nomePadrao: "Usuário",
  emailPadrao: "Conta autenticada",
} as const;

/* ==========================================================
   16. ROTAS DA API — DASHBOARD
   Endpoints do backend PHP, não páginas Next.js.
========================================================== */

/**
 * Endpoints da API utilizados pelo dashboard administrativo.
 * Estas são rotas do backend PHP, não rotas de navegação do Next.js.
 */
export const ROTAS_API_PAINEL = {
  CARDS: "/painel/dados/cards",
  CLIENTES: "/painel/clientes",
  PRODUTOS: "/painel/produtos/indicadores",
  PEDIDOS: "/painel/pedidos",
} as const;
