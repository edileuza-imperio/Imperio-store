// src/config/admin.ts
type Id = number | string;

export const admin = {
  api: {
    base: "/admin",

    // =========================
    // DASHBOARD
    // =========================
    index: "/admin",
    dashboard: "/admin/dashboard",
    cards: "/admin/cards",

    // =========================
    // PRODUTOS
    // =========================
    produtos: "/admin/produtos",
    produtosStatus: "/admin/produtos/status",

    produtoCriar: "/admin/produto/criar",
    produtoRemover: (produtoId: Id) =>
      `/admin/produto/${produtoId}/remover`,

    // =========================
    // CATÁLOGO
    // =========================
    produtosCatalogo: "/admin/produtos/catalogo",
    catalogoSim: (produtoId: Id) =>
      `/admin/produtos/${produtoId}/catalogo/sim`,
    catalogoNao: (produtoId: Id) =>
      `/admin/produtos/${produtoId}/catalogo/nao`,

    // =========================
    // DESTAQUES
    // =========================
    destaquesListar: "/admin/produtos/destaques",
    destaquesCriar: "/admin/produtos/destaques/criar",
    destaqueRemover: (idDestaque: Id) =>
      `/admin/produtos/destaques/${idDestaque}/remover`,

    // =========================
    // CATEGORIAS (NOVO CRUD)
    // =========================
    categoriasListar: "/admin/categorias",
    categoriasAtivas: "/admin/categorias/ativas",
    categoriasOrdenadas: "/admin/categorias/ordenadas",

    categoriaBuscar: (id: Id) =>
      `/admin/categorias/${id}`,

    categoriaCriar: "/admin/categorias",

    categoriaAtualizar: (id: Id) =>
      `/admin/categorias/${id}`,

    categoriaDesativar: (id: Id) =>
      `/admin/categorias/${id}/desativar`,

    categoriaRemover: (id: Id) =>
      `/admin/categorias/${id}`,
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