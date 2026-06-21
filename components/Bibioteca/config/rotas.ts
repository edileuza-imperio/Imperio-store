// src/config/rotas.ts
import { admin } from "./admin";

type Id = number | string;

export const rotas = {
  paginas: {
    home: "/",
    login: "/login",

    carrinho: "/Carrinho",
    checkout: "/checkout",
    pagamento: (pedidoId: Id) => `/Carrinho/pagamento/${pedidoId}`,
    pedidoConfirmado: (pedidoId: Id) => `/pedido-confirmado/${pedidoId}`,

    vitrine: (slug: Id) => `/Vitrine/${slug}`,
    vitrineVisualizar: (slug: Id) => `/Vitrine/visualizar/${slug}`,

    produto: (slug: Id) => `/produto/${slug}`,
    campanha: (slug: Id) => `/campanha/${slug}`,
    categoria: (slug: Id) => `/categoria/${slug}`,
  },

  site: {
    listar: "/site-configs",
    buscar: (id: Id) => `/site-config/${id}`,
    menu: "/menus",
  },

  inicio: {
    home: "/",
    navbar: "/bootstrap/navbar",
    homeBootstrap: "/bootstrap/home",
    cards: "/cards",
  },

  auth: {
    me: "/me",
    logout: "/logout",
    loginEtapa1: "/login",
    loginEtapa2: "/login2",
    verificarPainel: "/verificar-painel",
  },

  carrinho: {
    buscar: "/carrinho",
    itens: "/carrinho/itens",
    adicionar: "/carrinho/adicionar",
    atualizarItem: (itemId: Id) => `/carrinho/item/${itemId}`,
    removerItem: (itemId: Id) => `/carrinho/item/${itemId}`,
    recalcular: "/carrinho/recalcular",
    finalizar: "/carrinho/finalizar",
    cancelar: "/carrinho/cancelar",
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

  vitrines: {
    listar: "/vitrines",
    listarComItens: "/vitrines/com-itens",

    buscar: (id: Id) => `/vitrine/${id}`,
    buscarPorSlug: (slug: Id) => `/vitrine/slug/${slug}`,

    itens: (id: Id) => `/vitrine/${id}/itens`,
    buscarItem: (itemId: Id) => `/vitrine/item/${itemId}`,

    criar: "/vitrine",
    atualizar: (id: Id) => `/vitrine/${id}`,
    atualizarStatus: (id: Id) => `/vitrine/${id}/status`,
    deletar: (id: Id) => `/vitrine/${id}`,

    adicionarItem: (id: Id) => `/vitrine/${id}/item`,
    atualizarItem: (itemId: Id) => `/vitrine/item/${itemId}`,
    removerItem: (itemId: Id) => `/vitrine/item/${itemId}`,
    removerTodosItens: (id: Id) => `/vitrine/${id}/itens`,

    uploadImagem: "/vitrine/upload-imagem",
  },

  produtos: {
    listar: "/produtos",
    buscar: (id: Id) => `/produto/${id}`,
    buscarPorSlug: (slug: Id) => `/produto/slug/${slug}`,
    listarPorCategoria: (categoriaId: Id) => `/produtos/categoria/${categoriaId}`,
    listarPorCategoriaSlug: (slug: Id) => `/produtos/categoria/slug/${slug}`,

    criar: "/produto",
    atualizar: (id: Id) => `/produto/${id}`,
    deletar: (id: Id) => `/produto/${id}`,

    estoque: (produtoId: Id) => `/produto/${produtoId}/estoque`,
    zerarEstoque: "/painel/produtos/zerar-estoque",
    zerarEstoqueProduto: (id: Id) => `/painel/produto/${id}/zerar-estoque`,
    atualizarEstoquePainel: (id: Id) => `/painel/produto/${id}/estoque`,

    destaques: "/produtos-destaque",
    destaquesPorTipo: (tipo: Id) => `/produtos-destaque/${tipo}`,
    definirDestaque: (produtoId: Id) => `/produto/${produtoId}/destaque`,
    removerDestaque: (produtoId: Id) => `/produto/${produtoId}/destaque`,
  },

  campanhas: {
    listar: "/campanhas",
    buscar: (id: Id) => `/campanha/${id}`,
    buscarPorSlug: (slug: Id) => `/campanha/slug/${slug}`,
    criar: "/campanha",
    atualizar: (id: Id) => `/campanha/${id}`,
    atualizarStatus: (id: Id) => `/campanha/${id}/status`,
    deletar: (id: Id) => `/campanha/${id}`,
  },

  categorias: {
    listar: "/categorias",
    buscar: (id: Id) => `/categoria/${id}`,
    buscarPorSlug: (slug: Id) => `/categoria/slug/${slug}`,
    listarPorSite: (siteConfigId: Id) => `/categorias/site/${siteConfigId}`,
    listarAtivasPorSite: (siteConfigId: Id) =>
      `/categorias/site/${siteConfigId}/ativas`,

    criar: "/categoria",
    atualizar: (id: Id) => `/categoria/${id}`,
    atualizarStatus: (id: Id) => `/categoria/${id}/status`,
    deletar: (id: Id) => `/categoria/${id}`,
  },

  usuarios: {
    listar: "/usuarios",
    buscar: (id: Id) => `/usuario/${id}`,
    criar: "/criarusuarios",
    enderecos: "/usuario/endereco",

    atualizar: (id: Id) => `/usuario/${id}`,
    atualizarSenha: (id: Id) => `/usuario/${id}/senha`,
    atualizarPin: (id: Id) => `/usuario/${id}/pin`,
    resetarPin: (id: Id) => `/usuario/${id}/resetar-pin`,
    limparPin: (id: Id) => `/usuario/${id}/limpar-pin`,
    deletar: (id: Id) => `/usuario/${id}`,
  },

  pedidos: {
    listar: "/pedidos",
    buscar: (id: Id) => `/pedido/${id}`,
    buscarComItens: (id: Id) => `/pedido/${id}/com-itens`,
    listarPorUsuario: (usuarioId: Id) => `/pedidos/usuario/${usuarioId}`,
    buscarPorCarrinho: (carrinhoId: Id) => `/pedido/carrinho/${carrinhoId}`,
    buscarPorPaymentId: (paymentId: Id) => `/pedido/payment/${paymentId}`,
    buscarPorPreferenceId: (preferenceId: Id) =>
      `/pedido/preference/${preferenceId}`,
    buscarPorExternal: (externalReference: Id) =>
      `/pedido/external/${externalReference}`,

    criar: "/pedido",
    checkout: "/pedido/checkout",
    atualizar: (id: Id) => `/pedido/${id}`,
    atualizarStatus: (id: Id) => `/pedido/${id}/status`,
    atualizarPagamento: (id: Id) => `/pedido/${id}/pagamento`,
    atualizarPreferencia: (id: Id) => `/pedido/${id}/preferencia`,
    deletar: (id: Id) => `/pedido/${id}`,
  },

  mercadoPago: {
    status: "/mercado/status",
    metodos: "/mercado/metodos",
    criarPreferencia: "/mercado/preferencia",
    buscarPreferencia: (id: Id) => `/mercado/preferencia/${id}`,
    atualizarPreferencia: (id: Id) => `/mercado/preferencia/${id}`,

    pagamentoPix: "/mercado/pagamento/pix",
    pagamentoCartao: "/mercado/pagamento/cartao",
    pagamentoBoleto: "/mercado/pagamento/boleto",

    verificarPagamento: "/mercado/pagamento/verificar",
    verificarPagamentoGet: (id: Id) => `/mercado/pagamento/verificar/${id}`,
    buscarPagamento: (id: Id) => `/mercado/pagamento/${id}`,
    buscarPagamentoExternal: (externalReference: Id) =>
      `/mercado/pagamento/external/${externalReference}`,
    cancelarPagamento: (id: Id) => `/mercado/pagamento/${id}/cancelar`,
    reembolsarPagamento: (id: Id) => `/mercado/pagamento/${id}/reembolso`,

    webhook: "/mercado/webhook",
    webhookMp: "/webhook/mp",
    testarToken: "/mercado/testar-token",
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

  status: {
    listar: "/status",
    buscar: (id: Id) => `/status/${id}`,
    criar: "/status",
    atualizar: (id: Id) => `/status/${id}`,
    deletar: (id: Id) => `/status/${id}`,
  },

  niveis: {
    listar: "/niveis",
    buscar: (id: Id) => `/nivel/${id}`,
    criar: "/nivel",
    atualizar: (id: Id) => `/nivel/${id}`,
    deletar: (id: Id) => `/nivel/${id}`,
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

  mensagens: {
    listar: "/mensagens",
    buscar: (id: Id) => `/mensagem/${id}`,
    criar: "/mensagem",
    deletar: (id: Id) => `/mensagem/${id}`,
    pedido: "/mensagem/pedido",
    pedidoComNome: (nome: Id, pedidoId: Id) =>
      `/mensagem/pedido/${nome}/${pedidoId}`,
  },

  painel: {
    campanhas: "/painel/campanhas",
    campanhaCadastrar: "/painel/campanha",
    campanhaBuscar: (id: Id) => `/painel/campanha/${id}`,
    campanhaAtualizar: (id: Id) => `/painel/campanha/${id}`,
    campanhaStatus: (id: Id) => `/painel/campanha/${id}/status`,
    status: "/painel/status",
  },

  upload: {
    arquivo: (caminho: Id) => `/upload/${caminho}`,
    midia: (tipo: Id, slug: Id, arquivo: Id) =>
      `/midia/${tipo}/${slug}/${arquivo}`,
  },

  cache: {
    listar: "/cache",
    buscar: (key: Id) => `/cache/${key}`,
    deletar: (key: Id) => `/cache/${key}`,
  },

  admin,
} as const;

export type Rotas = typeof rotas;