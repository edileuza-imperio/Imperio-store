export const rotas = {
  menu: {
    listar: "/menu",
    ativos: "/menu/ativos",

    buscar: (id: number | string) => `/menu/${id}`,
    criar: "/menu",
    atualizar: (id: number | string) => `/menu/${id}`,
    deletar: (id: number | string) => `/menu/${id}`,

    comItens: "/menu/com-itens",

    itensDoMenu: (menuId: number | string) => `/menu/${menuId}/itens`,
    criarItem: (menuId: number | string) => `/menu/${menuId}/itens`,
    atualizarItem: (itemId: number | string) => `/menu/item/${itemId}`,
    deletarItem: (itemId: number | string) => `/menu/item/${itemId}`,
  },

  usuariosSistema: {
    listar: "/usuarios-sistema",
    buscar: (id: number | string) => `/usuarios-sistema/${id}`,
    criar: "/usuarios-sistema",
    atualizar: (id: number | string) => `/usuarios-sistema/${id}`,
    deletar: (id: number | string) => `/usuarios-sistema/${id}`,
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

    buscar: (id: number | string) => `/banners/${id}`,
    criar: "/banners",
    atualizar: (id: number | string) => `/banners/${id}`,
    deletar: (id: number | string) => `/banners/${id}`,

    incrementarView: (id: number | string) => `/banners/${id}/view`,
    incrementarClick: (id: number | string) => `/banners/${id}/click`,
  },
} as const;