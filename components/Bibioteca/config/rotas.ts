// src/config/rotas.ts

type Id = number | string;

export const rotas = {
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

  auth: {
    me: "/me",
    logout: "/logout",
    loginEtapa1: "/login/etapa1",
    loginEtapa2: "/login/etapa2",
  },

  admin: {
    configLogin: "/configuracoes/login",
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

  cupons: {
    listar: "/cupons",
    ativos: "/cupons/ativos",
    inativos: "/cupons/inativos",

    buscarPorCodigo: (codigo: string) => `/cupom/${encodeURIComponent(codigo)}`,
  },
} as const;