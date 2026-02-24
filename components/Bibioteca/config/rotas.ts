// components/Bibioteca/config/rotas.ts
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
    configLogin: "/configuracoes/login",
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

  // ✅ ROTAS DE API (backend)
  produtos: {
    listar: "/produtos",
    buscar: (id: Id) => `/produtos/${id}`,

    // backend: /produto/slug/{slug}
    buscarPorSlugApi: (slug: string) =>
      `/produto/slug/${encodeURIComponent(slug)}`,

    pesquisar: "/produtos/pesquisa",

    // ✅ backend: /produtos/catalogo existe também, mas você decidiu usar /catalogo
    catalogo: "/catalogo",

    // ✅ NOVO: backend: /catalogo/destaques (somente em destaque)
    catalogoDestaques: "/catalogo/destaques",

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

    // ✅ ROTAS DE PÁGINA (frontend)
    paginas: {
      // sua página em app/catalogo/page.tsx
      catalogo: "/catalogo",

      // sua página de destaque (se existir)
      destaques: "/produtos/destaques",

      // sua página dinâmica em app/produto/[slug]/page.tsx
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