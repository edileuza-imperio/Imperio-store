// src/config/rotas.ts
import { admin } from "./admin";

type Id = number | string;

export const rotas = {
  site: {
    listar: "/site-configs",
    buscar: (id: Id) => `/site-config/${id}`,
    menu: "/menus",
  },

  inicio: {
    home: "/",
    navbar: "/navbar",
  },

  paginas: {
    login: "/login",
  },
  painel: {
    campanhas: "/painel/campanhas",
    campanhaCadastrar: "/painel/campanha",
    campanhaBuscar: (id: number | string) => `/painel/campanha/${id}`,
    campanhaAtualizar: (id: number | string) => `/painel/campanha/${id}`,
    campanhaStatus: (id: number | string) => `/painel/campanha/${id}/status`,
    status: "/painel/status",
  },
  auth: {
    me: "/me",
    logout: "/logout",
    loginEtapa1: "/login",
    loginEtapa2: "/login2",
  },

  configLogin: "/config-login",

  carrinho: {
    adicionar: "/carrinho/adicionar",
  },

  menu: {
    listar: "/menus",
    buscar: (id: Id) => `/menu/${id}`,
    itensDoMenu: (menuId: Id) => `/menu/${menuId}/itens`,
    menuCompleto: (menuId: Id) => `/menu/${menuId}/completo`,
    criar: "/menu",
    atualizar: (id: Id) => `/menu/${id}`,
    deletar: (id: Id) => `/menu/${id}`,

    criarItem: "/menu-item",
    atualizarItem: (itemId: Id) => `/menu-item/${itemId}`,
    deletarItem: (itemId: Id) => `/menu-item/${itemId}`,
  },

  usuarios: {
    listar: "/usuarios",
    buscar: (id: Id) => `/usuario/${id}`,
    criar: "/criarusuarios",
    atualizar: (id: Id) => `/usuario/${id}`,
    atualizarSenha: (id: Id) => `/usuario/${id}/senha`,
    atualizarPin: (id: Id) => `/usuario/${id}/pin`,
    resetarPin: (id: Id) => `/usuario/${id}/resetar-pin`,
    limparPin: (id: Id) => `/usuario/${id}/limpar-pin`,
    deletar: (id: Id) => `/usuario/${id}`,
  },

  configuracaoLogin: {
    listar: "/configuracoes-login",
    buscar: (id: Id) => `/configuracao-login/${id}`,
    ativa: "/configuracao-login-ativa",
    criar: "/configuracao-login",
    atualizar: (id: Id) => `/configuracao-login/${id}`,
    atualizarStatus: (id: Id) => `/configuracao-login/${id}/status`,
    deletar: (id: Id) => `/configuracao-login/${id}`,
  },

  tipoLogin: {
    listar: "/tipos-login",
    buscar: (id: Id) => `/tipo-login/${id}`,
    criar: "/tipo-login",
    atualizar: (id: Id) => `/tipo-login/${id}`,
    deletar: (id: Id) => `/tipo-login/${id}`,
  },

  niveis: {
    listar: "/niveis",
    buscar: (id: Id) => `/nivel/${id}`,
    criar: "/nivel",
    atualizar: (id: Id) => `/nivel/${id}`,
    deletar: (id: Id) => `/nivel/${id}`,
  },

  status: {
    listar: "/status",
    buscar: (id: Id) => `/status/${id}`,
    criar: "/status",
    atualizar: (id: Id) => `/status/${id}`,
    deletar: (id: Id) => `/status/${id}`,
  },

  categorias: {
    listar: "/categorias",
    buscar: (id: Id) => `/categoria/${id}`,
    listarPorSite: (siteConfigId: Id) => `/categorias/site/${siteConfigId}`,
    listarAtivasPorSite: (siteConfigId: Id) =>
      `/categorias/site/${siteConfigId}/ativas`,
    criar: "/categoria",
    atualizar: (id: Id) => `/categoria/${id}`,
    atualizarStatus: (id: Id) => `/categoria/${id}/status`,
    deletar: (id: Id) => `/categoria/${id}`,
  },

  banners: {
    listar: "/banners",
    buscar: (id: Id) => `/banner/${id}`,
    criar: "/banner",
    atualizar: (id: Id) => `/banner/${id}/atualizar`,
    atualizarStatus: (id: Id) => `/banner/${id}/status`,
    deletar: (id: Id) => `/banner/${id}`,
    incrementarView: (id: Id) => `/banner/${id}/view`,
    incrementarClick: (id: Id) => `/banner/${id}/click`,
  },

  admin,
} as const;