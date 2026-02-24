// src/config/rotas.ts
type Id = number | string;

export const rotas = {
  inicio: "/",

  paginas: {
    login: "/login",
  },

  auth: {
    me: "/me",
    logout: "/logout",
    loginEtapa1: "/login/etapa1",
    loginEtapa2: "/login/etapa2",
  },

  carrinho: {
    adicionar: "/carrinho/adicionar",
  },

  admin: {
    // ✅ backend do admin (PainelAdministrativo@index)
    dashboard: "/admin/dashboard",

    // ✅ VOCÊ USA ISSO NO app/cadastro/page.tsx
    configLogin: "/configuracoes/login",

    // (opcional) páginas do painel (front)
    paginas: {
      dashboard: "/admin",
      usuarios: "/admin/usuarios",
      produtos: "/admin/produtos",
      categorias: "/admin/categorias",
      pedidos: "/admin/pedidos",
      cupons: "/admin/cupons",
      configuracoes: "/admin/configuracoes",
    },
  },

  menu: {
    listar: "/menu",
    ativos: "/menu/ativos",

    buscar: (id: Id) => `/menu/${id}`,
    criar: "/menu",
    atualizar: (id: Id) => `/menu/${id}`,
    deletar: (id: Id) => `/menu/${id}`,

    comItens: "/menu/com-itens",

    itensDoMenu: (menuId: Id) => `/menu/${menuId}/itens`,
    criarItem: (menuId: Id) => `/menu/${menuId}/itens`,
    atualizarItem: (itemId: Id) => `/menu/item/${itemId}`,
    deletarItem: (itemId: Id) => `/menu/item/${itemId}`,
  },

  usuariosSistema: {
    listar: "/usuarios-sistema",
    buscar: (id: Id) => `/usuarios-sistema/${id}`,
    criar: "/usuarios-sistema",
    atualizar: (id: Id) => `/usuarios-sistema/${id}`,
    deletar: (id: Id) => `/usuarios-sistema/${id}`,
  },

  banners: {
    listar: "/banners",
    ativos: "/banners/ativos",

    buscar: (id: Id) => `/banners/${id}`,
    criar: "/banners",
    atualizar: (id: Id) => `/banners/${id}`,
    deletar: (id: Id) => `/banners/${id}`,

    incrementarView: (id: Id) => `/banners/${id}/view`,
    incrementarClick: (id: Id) => `/banners/${id}/click`,
  },

  categorias: {
    listar: "/categorias",
    ativas: "/categorias/ativas",
    ordenadas: "/categorias/ordenadas",

    buscar: (id: Id) => `/categorias/${id}`,
    criar: "/categorias",
    atualizar: (id: Id) => `/categorias/${id}`,
    deletar: (id: Id) => `/categorias/${id}`,
  },

  produtos: {
    listar: "/produtos",
    buscar: (id: Id) => `/produtos/${id}`,

    buscarPorSlugApi: (slug: string) =>
      `/produto/slug/${encodeURIComponent(slug)}`,

    pesquisar: "/produtos/pesquisa",

    // ✅ você mudou o backend pra /catalogo (controller CatalogoController@listar)
    catalogo: "/catalogo",

    criar: "/produtos",
    atualizar: (id: Id) => `/produtos/${id}`,
    deletar: (id: Id) => `/produtos/${id}`,

    destaques: {
      listar: "/produtos/destaques",
      ativos: "/produtos/destaques/ativos",
      status: "/produtos/destaques/status",

      criar: "/produtos/destaques",
      atualizar: (id: Id) => `/produtos/destaques/${id}`,
      deletar: (id: Id) => `/produtos/destaques/${id}`,
    },

    paginas: {
      destaques: "/produtos/destaques",
      produto: (slug: string) => `/produto/${encodeURIComponent(slug)}`,
    },
  },

  cupons: {
    listar: "/cupons",
    ativos: "/cupons/ativos",
    inativos: "/cupons/inativos",

    buscarPorCodigo: (codigo: string) =>
      `/cupom/${encodeURIComponent(codigo)}`,
  },
} as const;