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
  },
} as const;

export type AdminRotas = typeof admin;