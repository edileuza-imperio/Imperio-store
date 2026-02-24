// src/config/admin.ts
type Id = number | string;

export const admin = {
  api: {
    base: "/admin",

    index: "/admin",
    dashboard: "/admin/dashboard",
    cards: "/admin/cards",

    produtos: "/admin/produtos",
    produtosStatus: "/admin/produtos/status",

    // ✅ Catálogo
    produtosCatalogo: "/admin/produtos/catalogo",

    // ✅ Destaques
    destaquesCriar: "/admin/produtos/destaques/criar",
    destaqueRemover: (idDestaque: Id) => `/admin/produtos/destaques/${idDestaque}/remover`,

    // ✅ Catálogo (sim/não)
    catalogoSim: (produtoId: Id) => `/admin/produtos/${produtoId}/catalogo/sim`,
    catalogoNao: (produtoId: Id) => `/admin/produtos/${produtoId}/catalogo/nao`,

    // ✅ Remover produto
    produtoRemover: (produtoId: Id) => `/admin/produto/${produtoId}/remover`,
  },

  paginas: {
    index: "/admin",
    dashboard: "/admin/dashboard",

    usuarios: "/admin/usuarios",
    produtos: "/admin/produtos",
    categorias: "/admin/categorias",
    pedidos: "/admin/pedidos",
    cupons: "/admin/cupons",
    configuracoes: "/admin/configuracoes",
    catalogo: "/admin/catalogo",
  },
} as const;

export type AdminRotas = typeof admin;