/**
 * Centralização das rotas da API Universo Império V3.
 *
 * Backend:
 * - PHP
 * - Rotas centralizadas em Site.php
 * - Rotas administrativas protegidas exigem sessão autenticada.
 */

const ROTAS = {
  // =====================================================
  // INÍCIO
  // =====================================================

  HOME: "/",

  // =====================================================
  // PÁGINAS DO FRONTEND
  // =====================================================

  PAGINAS: {
    // Páginas públicas do fluxo de compra no Next.js.
    LOJA: {
      // O catálogo Next.js está em app/(Home)/produto/page.tsx (URL /produto).
      PRODUTO: "/produto",
      PRODUTOS: "/produto", // Alias para manter compatibilidade com componentes existentes.
      PRODUTO_DETALHE: (slug: string) => `/produto/${encodeURIComponent(slug)}`,
      PRODUTO_CATEGORIA: "/produto/categoria",
      RECUPERAR_SENHA: "/recuperar-senha",
      // Página de catálogo: app/(Home)/produto/page.tsx (URL /produto).
      RESULTADOS_PRODUTOS: (termo: string) =>
        `/produto?busca=${encodeURIComponent(termo.trim())}`,
      CARRINHO: "/carrinho",
      PAGAMENTO: "/pagamento",
      PEDIDOS: "/minha-conta/pedidos",
    },

    PAINEL: {
      BANNERS: {
        LISTAR: "/painel/conteudo/banners",
        CADASTRAR: "/painel/conteudo/banners/cadastrar",
        EDITAR: (id: number) => `/painel/conteudo/banners/cadastrar?id=${id}`,
      },

      CAMPANHAS: {
        LISTAR: "/painel/conteudo/campanhas",
        CADASTRAR: "/painel/conteudo/campanhas/cadastrar",
        EDITAR: (id: number) => `/painel/conteudo/campanhas/${id}/editar`,
      },

      SECOES: {
        // Rotas de navegação do frontend (Next.js), não são endpoints da API.
        LISTAR: "/painel/conteudo/secoes",
        CADASTRAR: "/painel/conteudo/secoes/cadastrar",
        EDITAR: (id: number) => `/painel/conteudo/secoes/${id}/editar`,
        ITENS: (id: number) => `/painel/conteudo/secoes/${id}/itens`,
      },

      FOOTER: {
        LISTAR: "/painel/conteudo/footer",
      },

      CUPONS: {
        LISTAR: "/painel/cupons",
        CADASTRAR: "/painel/cupons/cadastrar",
        EDITAR: (id: number) => `/painel/cupons/${id}/editar`,
      },

      PEDIDOS: {
        LISTAR: "/painel/pedidos",
        DETALHE: (id: number) => `/painel/pedidos/${id}`,
      },

      ENTREGAS: {
        LISTAR: "/painel/entregas",
        DETALHE: (id: number) => `/painel/entregas/${id}`,
      },

      ESTOQUE: {
        LISTAR: "/painel/estoque",
        LOCAIS: "/painel/estoque/locais",
        SALDOS: "/painel/estoque/saldos",
        RESERVAS: "/painel/estoque/reservas",
        MOVIMENTOS: "/painel/estoque/movimentacoes",
      },
    },
  },

  // =====================================================
  // NAVBAR
  // =====================================================

  NAVBAR: {
    ESTRUTURA: "/navbar",
    CONTADORES: "/navbar/contadores",

    MENU: {
      CADASTRAR: "/navbar/menu",
      ATUALIZAR: (id: number) => `/navbar/menu/${id}`,
      EXCLUIR: (id: number) => `/navbar/menu/${id}`,
      ALTERAR_STATUS: (id: number) => `/navbar/menu/${id}/status`,
    },

    ITEM: {
      CADASTRAR: "/navbar/item",
      ATUALIZAR: (id: number) => `/navbar/item/${id}`,
      EXCLUIR: (id: number) => `/navbar/item/${id}`,
      ALTERAR_STATUS: (id: number) => `/navbar/item/${id}/status`,
      ALTERAR_ORDEM: (id: number) => `/navbar/item/${id}/ordem`,
    },

    // Associações de papéis aos itens da Navbar.
    PAPEIS: {
      LISTAR_POR_ITEM: (menuItemId: number) =>
        `/painel/navbar/itens/${menuItemId}/papeis`,

      LISTAR_ITENS_POR_PAPEL: (papelId: number) =>
        `/painel/navbar/papeis/${papelId}/itens`,

      LISTAR_ASSOCIACOES_POR_ITEM: (menuItemId: number) =>
        `/painel/navbar/itens/${menuItemId}/associacoes`,

      LISTAR_ASSOCIACOES_POR_PAPEL: (papelId: number) =>
        `/painel/navbar/papeis/${papelId}/associacoes`,

      ATRIBUIR_ITEM: (papelId: number, menuItemId: number) =>
        `/painel/navbar/papeis/${papelId}/itens/${menuItemId}`,

      REMOVER_ITEM: (papelId: number, menuItemId: number) =>
        `/painel/navbar/papeis/${papelId}/itens/${menuItemId}`,

      SINCRONIZAR_ITENS: (papelId: number) =>
        `/painel/navbar/papeis/${papelId}/itens`,
    },
  },

  // =====================================================
  // AUTENTICAÇÃO
  // =====================================================

  AUTH: {
    REGISTRAR: "/auth/registrar",
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    VERIFICAR: "/auth/verificar",
    USUARIO_ATUAL: "/auth/me",
    USUARIO_ID: "/auth/usuario-id",
    SESSAO_ATUAL: "/auth/sessao",
    RENOVAR_SESSAO: "/auth/renovar-sessao",
    ALTERAR_SENHA: "/auth/alterar-senha",
  },

  // =====================================================
  // USUÁRIOS
  // =====================================================

  USUARIOS: {
    LISTAR: "/usuarios",
    BUSCAR_POR_ID: (id: number) => `/usuarios/${id}`,

    BUSCAR_POR_EMAIL: (email: string) =>
      `/usuarios/email/${encodeURIComponent(email)}`,

    CADASTRAR: "/usuarios",
    ATUALIZAR: (id: number) => `/usuarios/${id}`,
    ATUALIZAR_SENHA: (id: number) => `/usuarios/${id}/senha`,
    ALTERAR_STATUS: (id: number) => `/usuarios/${id}/status`,
    VERIFICAR_EMAIL: (id: number) => `/usuarios/${id}/verificar-email`,
    REGISTRAR_ULTIMO_ACESSO: (id: number) => `/usuarios/${id}/ultimo-acesso`,

    PAPEIS: {
      LISTAR: (usuarioId: number) => `/painel/usuarios/${usuarioId}/papeis`,

      ATRIBUIR: (usuarioId: number, papelId: number) =>
        `/painel/usuarios/${usuarioId}/papeis/${papelId}`,

      REMOVER: (usuarioId: number, papelId: number) =>
        `/painel/usuarios/${usuarioId}/papeis/${papelId}`,
    },
  },

  // =====================================================
  // CLIENTES
  // =====================================================

  CLIENTES: {
    /**
     * Endpoints definidos em Routes/modules/Site.php:
     * GET    /painel/clientes/gerenciamento/             -> clientes.listar
     * GET    /painel/clientes/gerenciamento/{id}         -> clientes.listar
     * POST   /painel/clientes/gerenciamento/             -> clientes.gerenciar
     * PUT    /painel/clientes/gerenciamento/{id}         -> clientes.gerenciar
     * PUT    /painel/clientes/gerenciamento/{id}/status  -> clientes.gerenciar
     *
     * O grupo também exige sessão autenticada.
     */
    BASE: "/painel/clientes/gerenciamento",

    // Listar e cadastrar usam a raiz do grupo. Mantemos a barra final
    // porque a rota PHP foi registrada com Home::Get('/') / Home::Post('/').
    LISTAR: "/painel/clientes/gerenciamento/",
    CADASTRAR: "/painel/clientes/gerenciamento/",

    BUSCAR_POR_ID: (id: number) => `/painel/clientes/gerenciamento/${id}`,

    ATUALIZAR: (id: number) => `/painel/clientes/gerenciamento/${id}`,

    ALTERAR_STATUS: (id: number) =>
      `/painel/clientes/gerenciamento/${id}/status`,

    ENDERECOS: {
      LISTAR: (clienteId: number) =>
        `/painel/clientes/gerenciamento/${clienteId}/enderecos`,

      BUSCAR_POR_ID: (clienteId: number, enderecoId: number) =>
        `/painel/clientes/gerenciamento/${clienteId}/enderecos/${enderecoId}`,

      CADASTRAR: (clienteId: number) =>
        `/painel/clientes/gerenciamento/${clienteId}/enderecos`,

      ATUALIZAR: (clienteId: number, enderecoId: number) =>
        `/painel/clientes/gerenciamento/${clienteId}/enderecos/${enderecoId}`,

      DEFINIR_PRINCIPAL: (clienteId: number, enderecoId: number) =>
        `/painel/clientes/gerenciamento/${clienteId}/enderecos/${enderecoId}/principal`,

      EXCLUIR: (clienteId: number, enderecoId: number) =>
        `/painel/clientes/gerenciamento/${clienteId}/enderecos/${enderecoId}`,
    },
  },

  // =====================================================
  // SESSÕES
  // =====================================================

  SESSOES: {
    CRIAR: "/sessoes",

    BUSCAR_POR_ID: (idSessao: string) =>
      `/sessoes/${encodeURIComponent(idSessao)}`,

    BUSCAR_ATIVA: (idSessao: string) =>
      `/sessoes/ativa/${encodeURIComponent(idSessao)}`,

    LISTAR_POR_USUARIO: (usuarioId: number) => `/usuarios/${usuarioId}/sessoes`,

    RENOVAR: (idSessao: string) =>
      `/sessoes/${encodeURIComponent(idSessao)}/renovar`,

    REVOGAR: (idSessao: string) =>
      `/sessoes/${encodeURIComponent(idSessao)}/revogar`,

    REVOGAR_TODAS: (usuarioId: number) =>
      `/usuarios/${usuarioId}/sessoes/revogar`,
  },

  // =====================================================
  // RECUPERAÇÃO DE SENHA
  // =====================================================

  TOKENS_RECUPERACAO: {
    // POST /tokens-recuperacao: solicita o envio do link por e-mail.
    SOLICITAR: "/tokens-recuperacao",
    // Alias legado para chamadas que ainda utilizam CRIAR.
    CRIAR: "/tokens-recuperacao",
    // POST /tokens-recuperacao/redefinir: troca a senha com token válido.
    REDEFINIR: "/tokens-recuperacao/redefinir",

    BUSCAR_POR_ID: (idToken: number) => `/tokens-recuperacao/${idToken}`,

    BUSCAR_POR_HASH: (hash: string) =>
      `/tokens-recuperacao/hash/${encodeURIComponent(hash)}`,

    BUSCAR_VALIDO: (hash: string, statusAtivoId: number) =>
      `/tokens-recuperacao/valido/${encodeURIComponent(hash)}/${statusAtivoId}`,

    LISTAR_POR_USUARIO: (usuarioId: number) =>
      `/usuarios/${usuarioId}/tokens-recuperacao`,

    MARCAR_UTILIZADO: (idToken: number) =>
      `/tokens-recuperacao/${idToken}/utilizado`,

    ALTERAR_STATUS: (idToken: number) =>
      `/tokens-recuperacao/${idToken}/status`,

    INVALIDAR_POR_USUARIO: (usuarioId: number) =>
      `/usuarios/${usuarioId}/tokens-recuperacao/invalidar`,
  },

  // =====================================================
  // IMAGENS PÚBLICAS
  // =====================================================

  IMAGENS: {
    // GET /imagens/produto — ImagemController@mostrarProduto (Site.php).
    // O ImagemService continua responsável por montar os parâmetros da imagem.
    PRODUTO: "/imagens/produto",
    // GET /imagens/banner — ImagemController@mostrarBanner (Site.php).
    BANNER: "/imagens/banner",
  },

  // =====================================================
  // PRODUTOS
  // =====================================================

  PRODUTOS: {
    LISTAR: "/produtos",
    // GET /produtos/pesquisar?termo=... — pesquisa pública usada no autocomplete da Navbar.
    PESQUISAR: "/produtos/pesquisar",
    PESQUISAR_POR_TERMO: (termo: string) =>
      `/produtos/pesquisar?termo=${encodeURIComponent(termo.trim())}`,

    BUSCAR_POR_SKU: (sku: string) => `/produtos/sku/${encodeURIComponent(sku)}`,

    BUSCAR_POR_SLUG: (slug: string) =>
      `/produtos/slug/${encodeURIComponent(slug)}`,

    LISTAR_POR_CATEGORIA: (categoriaId: number) =>
      `/produtos/categoria/${categoriaId}`,

    BUSCAR_POR_ID: (id: number) => `/produtos/${id}`,

    PAINEL: {
      LISTAR: "/painel/produtos",
      PESQUISAR: "/painel/produtos/pesquisar",
      INDICADORES: "/painel/produtos/indicadores",
      CADASTRAR: "/painel/produtos",

      BUSCAR_POR_ID: (id: number) => `/painel/produtos/${id}`,

      BUSCAR_COMPLETO: (id: number) => `/painel/produtos/${id}/completo`,

      ATUALIZAR: (id: number) => `/painel/produtos/${id}`,

      EXCLUIR: (id: number) => `/painel/produtos/${id}`,

      ALTERAR_STATUS: (id: number) => `/painel/produtos/${id}/status`,

      ALTERAR_ATIVO: (id: number) => `/painel/produtos/${id}/ativo`,

      ALTERAR_DESTAQUE: (id: number) => `/painel/produtos/${id}/destaque`,

      CATEGORIAS: {
        LISTAR: (produtoId: number) =>
          `/painel/produtos/${produtoId}/categorias`,

        ADICIONAR: (produtoId: number) =>
          `/painel/produtos/${produtoId}/categorias`,

        SINCRONIZAR: (produtoId: number) =>
          `/painel/produtos/${produtoId}/categorias`,

        REMOVER: (produtoId: number, categoriaId: number) =>
          `/painel/produtos/${produtoId}/categorias/${categoriaId}`,
      },

      IMAGENS: {
        LISTAR: (produtoId: number) => `/painel/produtos/${produtoId}/imagens`,

        CADASTRAR: (produtoId: number) =>
          `/painel/produtos/${produtoId}/imagens`,

        SUBSTITUIR: (produtoId: number, idImagem: number) =>
          `/painel/produtos/${produtoId}/imagens/${idImagem}/substituir`,

        DEFINIR_PRINCIPAL: (produtoId: number, idImagem: number) =>
          `/painel/produtos/${produtoId}/imagens/${idImagem}/principal`,

        EXCLUIR: (produtoId: number, idImagem: number) =>
          `/painel/produtos/${produtoId}/imagens/${idImagem}`,
      },

      ATRIBUTOS: {
        LISTAR: "/painel/atributos",
        CADASTRAR: "/painel/atributos",
        ATUALIZAR: (id: number) => `/painel/atributos/${id}`,
        EXCLUIR: (id: number) => `/painel/atributos/${id}`,
      },

      VARIACOES: {
        LISTAR: (produtoId: number) =>
          `/painel/produtos/${produtoId}/variacoes`,

        CADASTRAR: (produtoId: number) =>
          `/painel/produtos/${produtoId}/variacoes`,

        ATUALIZAR: (produtoId: number, idVariacao: number) =>
          `/painel/produtos/${produtoId}/variacoes/${idVariacao}`,

        EXCLUIR: (produtoId: number, idVariacao: number) =>
          `/painel/produtos/${produtoId}/variacoes/${idVariacao}`,

        ATRIBUTOS: {
          DEFINIR: (produtoId: number, idVariacao: number) =>
            `/painel/produtos/${produtoId}/variacoes/${idVariacao}/atributos`,

          REMOVER: (
            produtoId: number,
            idVariacao: number,
            atributoId: number,
          ) =>
            `/painel/produtos/${produtoId}/variacoes/${idVariacao}/atributos/${atributoId}`,
        },
      },
    },
  },

  // =====================================================
  // CUPONS
  // =====================================================

  CUPONS: {
    // GET /cupons: lista apenas cupons públicos e válidos.
    LISTAR_PUBLICOS: "/cupons",

    // POST /cupons/validar: valida cupom no checkout.
    VALIDAR: "/cupons/validar",

    // Gerenciamento administrativo: endpoints protegidos por /painel.
    PAINEL: {
      LISTAR: "/painel/cupons",
      CADASTRAR: "/painel/cupons",
      BUSCAR_POR_ID: (id: number) => `/painel/cupons/${id}`,
      ATUALIZAR: (id: number) => `/painel/cupons/${id}`,
      DESATIVAR: (id: number) => `/painel/cupons/${id}/desativar`,
      CONFIGURAR_PRODUTOS: (id: number) => `/painel/cupons/${id}/produtos`,
      CONFIGURAR_CATEGORIAS: (id: number) => `/painel/cupons/${id}/categorias`,
    },
  },

  // =====================================================
  // VITRINES
  // =====================================================

  VITRINES: {
    // -----------------------------------------------------
    // CATÁLOGO PÚBLICO
    // -----------------------------------------------------

    LISTAR: "/vitrines",

    BUSCAR_POR_ID: (id: number) => `/vitrines/${id}`,

    BUSCAR_POR_CODIGO: (codigo: string) =>
      `/vitrines/codigo/${encodeURIComponent(codigo)}`,

    ITENS: {
      LISTAR: (vitrineId: number) => `/vitrines/${vitrineId}/itens`,
    },

    // -----------------------------------------------------
    // PAINEL ADMINISTRATIVO
    // Os caminhos abaixo incluem /painel porque o Site.php registra
    // essas rotas dentro de Home::group('/painel').
    // -----------------------------------------------------

    PAINEL: {
      LISTAR: "/painel/vitrines",

      BUSCAR_POR_ID: (id: number) => `/painel/vitrines/${id}`,

      CADASTRAR: "/painel/vitrines",

      ATUALIZAR: (id: number) => `/painel/vitrines/${id}`,

      EXCLUIR: (id: number) => `/painel/vitrines/${id}`,

      ALTERAR_STATUS: (id: number) => `/painel/vitrines/${id}/status`,

      ALTERAR_ATIVO: (id: number) => `/painel/vitrines/${id}/ativo`,

      ALTERAR_ORDEM: (id: number) => `/painel/vitrines/${id}/ordem`,

      // ---------------------------------------------------
      // ITENS DAS VITRINES
      // ---------------------------------------------------

      ITENS: {
        // Listar itens de uma vitrine.
        LISTAR: (vitrineId: number) => `/painel/vitrines/${vitrineId}/itens`,

        // Associar um produto à vitrine.
        CADASTRAR: (vitrineId: number) => `/painel/vitrines/${vitrineId}/itens`,

        // Remover todos os itens de uma vitrine.
        EXCLUIR_TODOS: (vitrineId: number) =>
          `/painel/vitrines/${vitrineId}/itens`,

        // Buscar, atualizar e remover um item específico.
        BUSCAR_POR_ID: (id: number) => `/painel/vitrine-itens/${id}`,

        ATUALIZAR: (id: number) => `/painel/vitrine-itens/${id}`,

        EXCLUIR: (id: number) => `/painel/vitrine-itens/${id}`,

        ALTERAR_STATUS: (id: number) => `/painel/vitrine-itens/${id}/status`,

        ALTERAR_ATIVO: (id: number) => `/painel/vitrine-itens/${id}/ativo`,

        ALTERAR_ORDEM: (id: number) => `/painel/vitrine-itens/${id}/ordem`,

        // Consultar vitrines associadas a um produto.
        LISTAR_POR_PRODUTO: (produtoId: number) =>
          `/painel/produtos/${produtoId}/vitrines`,
      },
    },
  },

  // =====================================================
  // BANNERS
  // =====================================================

  BANNERS: {
    // Listagem pública utilizada pela vitrine da loja.
    PUBLICOS: "/banners",

    // Entrega a imagem pelo controller público:
    // GET /imagens/banner?arquivo=nome-do-arquivo.jpeg
    IMAGEM: (arquivo: string) =>
      `/imagens/banner?arquivo=${encodeURIComponent(arquivo)}`,

    PAINEL: {
      LISTAR: "/painel/banners",
      CONTADORES: "/painel/banners/contadores",

      BUSCAR_POR_ID: (id: number) => `/painel/banners/${id}`,

      CADASTRAR: "/painel/banners",

      ATUALIZAR: (id: number) => `/painel/banners/${id}`,

      ALTERAR_ATIVO: (id: number) => `/painel/banners/${id}/ativo`,

      ALTERAR_STATUS: (id: number) => `/painel/banners/${id}/status`,

      ALTERAR_ORDEM: (id: number) => `/painel/banners/${id}/ordem`,

      EXCLUIR: (id: number) => `/painel/banners/${id}`,

      // Upload da imagem do banner.
      UPLOAD: "/painel/banners/upload",
    },
  },

  // =====================================================
  // CAMPANHAS
  // =====================================================

  CAMPANHAS: {
    // -----------------------------------------------------
    // CATÁLOGO PÚBLICO
    // -----------------------------------------------------

    LISTAR_PUBLICAS: "/campanhas",

    BUSCAR_PUBLICA_POR_SLUG: (slug: string) =>
      `/campanhas/slug/${encodeURIComponent(slug)}`,

    LISTAR_PRODUTOS_PUBLICOS: (campanhaId: number) =>
      `/campanhas/${campanhaId}/produtos`,

    // -----------------------------------------------------
    // PAINEL ADMINISTRATIVO
    // Todas as rotas abaixo exigem autenticação.
    // -----------------------------------------------------

    PAINEL: {
      LISTAR: "/painel/campanhas",

      BUSCAR_POR_ID: (id: number) => `/painel/campanhas/${id}`,

      CADASTRAR: "/painel/campanhas",

      UPLOAD: "/painel/campanhas/upload",

      ATUALIZAR: (id: number) => `/painel/campanhas/${id}`,

      EXCLUIR: (id: number) => `/painel/campanhas/${id}`,

      // Produtos vinculados à campanha.
      PRODUTOS: {
        LISTAR: (campanhaId: number) =>
          `/painel/campanhas/${campanhaId}/produtos`,

        BUSCAR: (campanhaId: number, produtoId: number) =>
          `/painel/campanhas/${campanhaId}/produtos/${produtoId}`,

        ADICIONAR: (campanhaId: number) =>
          `/painel/campanhas/${campanhaId}/produtos`,

        ATUALIZAR: (campanhaId: number, produtoId: number) =>
          `/painel/campanhas/${campanhaId}/produtos/${produtoId}`,

        REMOVER: (campanhaId: number, produtoId: number) =>
          `/painel/campanhas/${campanhaId}/produtos/${produtoId}`,
      },

      // Consultar campanhas vinculadas a um produto.
      LISTAR_POR_PRODUTO: (produtoId: number) =>
        `/painel/produtos/${produtoId}/campanhas`,
    },
  },

  // =====================================================
  // MARCAS
  // =====================================================

  MARCAS: {
    PAINEL: {
      LISTAR: "/painel/marcas",
      BUSCAR_POR_ID: (id: number) => `/painel/marcas/${id}`,
      CADASTRAR: "/painel/marcas",
      ATUALIZAR: (id: number) => `/painel/marcas/${id}`,
      EXCLUIR: (id: number) => `/painel/marcas/${id}`,
    },
  },

  // =====================================================
  // CATEGORIAS
  // =====================================================

  CATEGORIAS: {
    LISTAR: "/categorias",

    PAINEL: {
      LISTAR: "/painel/categorias",
      ARVORE: "/painel/categorias/arvore",

      BUSCAR_POR_ID: (id: number) => `/painel/categorias/${id}`,

      CADASTRAR: "/painel/categorias",

      ATUALIZAR: (id: number) => `/painel/categorias/${id}`,

      EXCLUIR: (id: number) => `/painel/categorias/${id}`,
    },
  },

  // =====================================================
  // PAPÉIS E PERMISSÕES
  // =====================================================

  PERMISSOES: {
    PAPEIS: {
      LISTAR: "/painel/papeis",

      BUSCAR_POR_ID: (id: number) => `/painel/papeis/${id}`,

      BUSCAR_POR_CODIGO: (codigo: string) =>
        `/painel/papeis/codigo/${encodeURIComponent(codigo)}`,

      CADASTRAR: "/painel/papeis",

      ATUALIZAR: (id: number) => `/painel/papeis/${id}`,

      ALTERAR_STATUS: (id: number) => `/painel/papeis/${id}/status`,

      EXCLUIR: (id: number) => `/painel/papeis/${id}`,

      LISTAR_PERMISSOES: (papelId: number) =>
        `/painel/papeis/${papelId}/permissoes`,

      ATRIBUIR_PERMISSAO: (papelId: number, permissaoId: number) =>
        `/painel/papeis/${papelId}/permissoes/${permissaoId}`,

      REMOVER_PERMISSAO: (papelId: number, permissaoId: number) =>
        `/painel/papeis/${papelId}/permissoes/${permissaoId}`,

      TEM_PERMISSAO: (papelId: number, codigoPermissao: string) =>
        `/painel/papeis/${papelId}/tem-permissao/${encodeURIComponent(codigoPermissao)}`,
    },

    PERMISSOES: {
      LISTAR: "/painel/permissoes",

      BUSCAR_POR_ID: (id: number) => `/painel/permissoes/${id}`,

      BUSCAR_POR_CODIGO: (codigo: string) =>
        `/painel/permissoes/codigo/${encodeURIComponent(codigo)}`,

      LISTAR_POR_MODULO: (modulo: string) =>
        `/painel/permissoes/modulo/${encodeURIComponent(modulo)}`,

      CADASTRAR: "/painel/permissoes",

      ATUALIZAR: (id: number) => `/painel/permissoes/${id}`,

      ALTERAR_STATUS: (id: number) => `/painel/permissoes/${id}/status`,

      EXCLUIR: (id: number) => `/painel/permissoes/${id}`,
    },

    USUARIOS: {
      LISTAR_PAPEIS: (usuarioId: number) =>
        `/painel/usuarios/${usuarioId}/papeis`,

      ATRIBUIR_PAPEL: (usuarioId: number, papelId: number) =>
        `/painel/usuarios/${usuarioId}/papeis/${papelId}`,

      REMOVER_PAPEL: (usuarioId: number, papelId: number) =>
        `/painel/usuarios/${usuarioId}/papeis/${papelId}`,
    },

    STATUS: {
      LISTAR: "/painel/status",

      LISTAR_POR_GRUPO: (grupo: string) =>
        `/painel/status/grupo/${encodeURIComponent(grupo)}`,

      BUSCAR_POR_CODIGO: (grupo: string, codigo: string) =>
        `/painel/status/grupo/${encodeURIComponent(grupo)}/codigo/${encodeURIComponent(codigo)}`,

      BUSCAR_POR_ID: (id: number) => `/painel/status/${id}`,

      CADASTRAR: "/painel/status",

      ATUALIZAR: (id: number) => `/painel/status/${id}`,

      ALTERAR_DISPONIBILIDADE: (id: number) =>
        `/painel/status/${id}/disponibilidade`,

      EXCLUIR: (id: number) => `/painel/status/${id}`,
    },

    CONTADORES: "/painel/permissoes/contadores",
    TUDO: "/painel/permissoes/tudo",
  },

  // =====================================================
  // RODAPÉS
  // =====================================================

  RODAPES: {
    // -----------------------------------------------------
    // CATÁLOGO PÚBLICO
    // -----------------------------------------------------

    // Lista os rodapés ativos com seus itens ativos.
    LISTAR_PUBLICOS: "/rodapes",

    // Busca um rodapé público pelo código.
    BUSCAR_PUBLICO_POR_CODIGO: (codigo: string) =>
      `/rodapes/codigo/${encodeURIComponent(codigo)}`,

    // Configuração visual pública: nome, descrição e imagem.
    CONFIGURACAO_PUBLICA: "/rodape-configuracao",

    // Redes sociais públicas e ativas.
    REDES_SOCIAIS_PUBLICAS: "/rodape-redes-sociais",

    // -----------------------------------------------------
    // PAINEL ADMINISTRATIVO
    // Todas as rotas abaixo exigem autenticação.
    // -----------------------------------------------------

    PAINEL: {
      // Rodapés.
      LISTAR: "/painel/rodapes",

      BUSCAR_POR_ID: (id: number) => `/painel/rodapes/${id}`,

      CADASTRAR: "/painel/rodapes",

      ATUALIZAR: (id: number) => `/painel/rodapes/${id}`,

      ALTERAR_ATIVO: (id: number) => `/painel/rodapes/${id}/ativo`,

      ALTERAR_STATUS: (id: number) => `/painel/rodapes/${id}/status`,

      EXCLUIR: (id: number) => `/painel/rodapes/${id}`,

      // ---------------------------------------------------
      // ITENS DO RODAPÉ
      // ---------------------------------------------------

      ITENS: {
        // Listar os itens de um rodapé.
        LISTAR: (rodapeId: number) => `/painel/rodapes/${rodapeId}/itens`,

        // Cadastrar um item no rodapé.
        CADASTRAR: (rodapeId: number) => `/painel/rodapes/${rodapeId}/itens`,

        // Buscar um item pelo ID.
        BUSCAR_POR_ID: (id: number) => `/painel/rodape-itens/${id}`,

        // Atualizar um item.
        ATUALIZAR: (id: number) => `/painel/rodape-itens/${id}`,

        // Ativar ou desativar um item.
        ALTERAR_ATIVO: (id: number) => `/painel/rodape-itens/${id}/ativo`,

        // Alterar o status cadastral de um item.
        ALTERAR_STATUS: (id: number) => `/painel/rodape-itens/${id}/status`,

        // Alterar a ordem de exibição.
        ALTERAR_ORDEM: (id: number) => `/painel/rodape-itens/${id}/ordem`,

        // Excluir um item.
        EXCLUIR: (id: number) => `/painel/rodape-itens/${id}`,
      },

      // ---------------------------------------------------
      // CONFIGURAÇÃO VISUAL DO RODAPÉ
      // ---------------------------------------------------

      CONFIGURACAO: {
        LISTAR: "/painel/rodape-configuracoes",
        BUSCAR_POR_ID: (id: number) => `/painel/rodape-configuracoes/${id}`,
        CADASTRAR: "/painel/rodape-configuracoes",
        ATUALIZAR: (id: number) => `/painel/rodape-configuracoes/${id}`,
        ALTERAR_ATIVO: (id: number) =>
          `/painel/rodape-configuracoes/${id}/ativo`,
        ALTERAR_STATUS: (id: number) =>
          `/painel/rodape-configuracoes/${id}/status`,
        EXCLUIR: (id: number) => `/painel/rodape-configuracoes/${id}`,
      },

      // ---------------------------------------------------
      // REDES SOCIAIS DO RODAPÉ
      // ---------------------------------------------------

      REDES_SOCIAIS: {
        LISTAR: (configuracaoId: number) =>
          `/painel/rodape-configuracoes/${configuracaoId}/redes-sociais`,
        CADASTRAR: (configuracaoId: number) =>
          `/painel/rodape-configuracoes/${configuracaoId}/redes-sociais`,
        BUSCAR_POR_ID: (id: number) => `/painel/rodape-redes-sociais/${id}`,
        ATUALIZAR: (id: number) => `/painel/rodape-redes-sociais/${id}`,
        ALTERAR_ATIVO: (id: number) =>
          `/painel/rodape-redes-sociais/${id}/ativo`,
        ALTERAR_STATUS: (id: number) =>
          `/painel/rodape-redes-sociais/${id}/status`,
        ALTERAR_ORDEM: (id: number) =>
          `/painel/rodape-redes-sociais/${id}/ordem`,
        EXCLUIR: (id: number) => `/painel/rodape-redes-sociais/${id}`,
      },
    },
  },

  // =====================================================
  // CHECKOUT
  // =====================================================

  CHECKOUT: {
    // POST /checkout/cliente: consulta/identifica o comprador da sessão do carrinho.
    BUSCAR_CLIENTE: "/checkout/cliente",

    // POST /checkout/identificacao: identifica o comprador antes do pagamento.
    IDENTIFICACAO: "/checkout/identificacao",
  },

  // =====================================================
  // FRETE
  // =====================================================

  FRETE: {
    // Cotação pública. O backend usa a sessão para localizar o carrinho,
    // o endereço de entrega e os dados físicos dos produtos no MySQL.
    COTAR: "/frete/cotar",
  },

  // =====================================================
  // MERCADO PAGO
  // =====================================================

  MERCADO_PAGO: {
    // Criação de cobrança pelo backend (PIX ou cartão via Payment Brick).
    // Corresponde à rota pública POST /mercado-pago/criar-pagamento
    // registrada no Site.php e ao método MercadoPagoController@criarPagamento.
    CRIAR_PAGAMENTO: "/mercado-pago/criar-pagamento",

    // Notificação do Mercado Pago. Uso exclusivo do servidor/gateway.
    WEBHOOK: "/mercado-pago/webhook",

    // Alias legado ainda registrado no Site.php (GET e POST).
    WEBHOOK_LEGADO: "/mercado/webhook",
  },

  // =====================================================
  // PAGAMENTOS
  // =====================================================

  PAGAMENTOS: {
    // Consulta pública. O controller deve retornar somente dados sanitizados.
    BUSCAR_PUBLICO_POR_REFERENCIA: (referencia: string) =>
      `/pagamentos/referencia/${encodeURIComponent(referencia)}`,

    // Rotas administrativas registradas dentro de /painel no Site.php.
    PAINEL: {
      LISTAR: "/painel/pagamentos",
      LISTAR_POR_PEDIDO: (pedidoId: number) =>
        `/painel/pedidos/${pedidoId}/pagamentos`,
      RESUMO: (pagamentoId: number) =>
        `/painel/pagamentos/${pagamentoId}/resumo`,
      LISTAR_EVENTOS: (pagamentoId: number) =>
        `/painel/pagamentos/${pagamentoId}/eventos`,
      BUSCAR_EVENTO: (eventoId: number) =>
        `/painel/pagamentos/eventos/${eventoId}`,
      BUSCAR_POR_REFERENCIA: (referencia: string) =>
        `/painel/pagamentos/referencia/${encodeURIComponent(referencia)}`,
      CADASTRAR: "/painel/pagamentos",
      CADASTRAR_EVENTO: (pagamentoId: number) =>
        `/painel/pagamentos/${pagamentoId}/eventos`,
      ATUALIZAR: (pagamentoId: number) => `/painel/pagamentos/${pagamentoId}`,
      ALTERAR_STATUS: (pagamentoId: number) =>
        `/painel/pagamentos/${pagamentoId}/status`,
      BUSCAR_POR_ID: (pagamentoId: number) =>
        `/painel/pagamentos/${pagamentoId}`,
    },
  },

  // =====================================================
  // CARRINHO DE COMPRAS
  // =====================================================

  CARRINHO: {
    // Rotas públicas: permitem carrinho de visitante.
    CRIAR: "/carrinho",
    BUSCAR: "/carrinho/buscar",
    ADICIONAR: "/carrinho/adicionar",

    BUSCAR_POR_ID: (carrinhoId: number) => `/carrinho/${carrinhoId}`,
    LISTAR_ITENS: (carrinhoId: number) => `/carrinho/${carrinhoId}/itens`,

    ITENS: {
      ATUALIZAR: (itemId: number) => `/carrinho/itens/${itemId}`,
      ALTERAR_QUANTIDADE: (itemId: number) =>
        `/carrinho/itens/${itemId}/quantidade`,
      REMOVER: (itemId: number) => `/carrinho/itens/${itemId}`,
    },

    LIMPAR: (carrinhoId: number) => `/carrinho/${carrinhoId}/limpar`,
    ALTERAR_STATUS: (carrinhoId: number) => `/carrinho/${carrinhoId}/status`,
    EXCLUIR: (carrinhoId: number) => `/carrinho/${carrinhoId}`,
  },

  // =====================================================
  // LISTAS DE DESEJOS
  // =====================================================

  LISTAS_DESEJOS: {
    // -----------------------------------------------------
    // CONSULTAS
    // -----------------------------------------------------

    // Lista compartilhada/publicamente acessível.
    BUSCAR_PUBLICA: (id: number) => `/listas-desejos/publica/${id}`,

    // Listas pertencentes a um cliente.
    LISTAR_POR_CLIENTE: (clienteId: number) =>
      `/clientes/${clienteId}/listas-desejos`,

    // Listas em que um produto está incluído.
    LISTAR_POR_PRODUTO: (produtoId: number) =>
      `/produtos/${produtoId}/listas-desejos`,

    // Listar listas de desejos.
    LISTAR: "/listas-desejos",

    // Buscar uma lista pelo ID.
    BUSCAR_POR_ID: (id: number) => `/listas-desejos/${id}`,

    // -----------------------------------------------------
    // CADASTRO, ATUALIZAÇÃO E EXCLUSÃO
    // -----------------------------------------------------

    CADASTRAR: "/listas-desejos",

    ATUALIZAR: (id: number) => `/listas-desejos/${id}`,

    ALTERAR_VISIBILIDADE: (id: number) => `/listas-desejos/${id}/visibilidade`,

    ALTERAR_STATUS: (id: number) => `/listas-desejos/${id}/status`,

    // O controller recebe cliente_id pela query string.
    EXCLUIR: (id: number, clienteId: number) =>
      `/listas-desejos/${id}?cliente_id=${clienteId}`,

    // -----------------------------------------------------
    // ITENS DA LISTA
    // -----------------------------------------------------

    ITENS: {
      // Listar produtos de uma lista.
      LISTAR: (listaId: number) => `/listas-desejos/${listaId}/itens`,

      // Contar produtos de uma lista.
      CONTAR: (listaId: number) => `/listas-desejos/${listaId}/itens/contagem`,

      // Adicionar produto à lista.
      ADICIONAR: (listaId: number) => `/listas-desejos/${listaId}/itens`,

      // Remover um produto específico da lista.
      REMOVER: (listaId: number, produtoId: number) =>
        `/listas-desejos/${listaId}/itens/${produtoId}`,

      // Remover todos os produtos da lista.
      REMOVER_TODOS: (listaId: number) => `/listas-desejos/${listaId}/itens`,
    },
  },

  // =====================================================
  // E-MAIL TRANSACIONAL PÚBLICO
  // =====================================================

  EMAIL: {
    // POST /email/enviar-template — fluxo público limitado pelo controller.
    ENVIAR_TEMPLATE: "/email/enviar-template",
  },

  // =====================================================
  // MENSAGENS TEMPLATE - E-MAILS E NOTIFICAÇÕES
  // =====================================================

  MENSAGENS_TEMPLATES: {
    // Gerenciamento administrativo: rotas protegidas por /painel.
    // Permissão utilizada no Site.php: marketing.gerenciar.

    // GET /painel/mensagens-templates
    LISTAR: "/painel/mensagens-templates",

    // GET /painel/mensagens-templates/codigo/{codigo}
    BUSCAR_POR_CODIGO: (codigo: string) =>
      `/painel/mensagens-templates/codigo/${encodeURIComponent(codigo)}`,

    // POST /painel/mensagens-templates
    CADASTRAR: "/painel/mensagens-templates",

    // POST /painel/email/enviar-template (autenticado + marketing.gerenciar).
    ENVIAR_EMAIL: "/painel/email/enviar-template",

    // GET /painel/mensagens-templates/{id}
    BUSCAR_POR_ID: (id: number) => `/painel/mensagens-templates/${id}`,

    // PUT /painel/mensagens-templates/{id}
    ATUALIZAR: (id: number) => `/painel/mensagens-templates/${id}`,

    // PUT /painel/mensagens-templates/{id}/ativar
    ATIVAR: (id: number) => `/painel/mensagens-templates/${id}/ativar`,

    // PUT /painel/mensagens-templates/{id}/desativar
    DESATIVAR: (id: number) => `/painel/mensagens-templates/${id}/desativar`,
  },

  // =====================================================
  // COMPOSIÇÃO DA PÁGINA INICIAL (HOME)
  // =====================================================

  HOME_BLOCOS: {
    // GET /home/blocos?pagina=HOME — consulta pública de blocos publicados.
    LISTAR_PUBLICADOS: "/home/blocos",

    PAINEL: {
      LISTAR_TIPOS: "/painel/home-blocos/tipos",
      LISTAR: "/painel/home-blocos",
      BUSCAR_POR_CODIGO: (codigo: string) =>
        `/painel/home-blocos/codigo/${encodeURIComponent(codigo)}`,
      BUSCAR_POR_ID: (id: number) => `/painel/home-blocos/${id}`,
      CADASTRAR: "/painel/home-blocos",
      ATUALIZAR: (id: number) => `/painel/home-blocos/${id}`,
      ALTERAR_ATIVO: (id: number) => `/painel/home-blocos/${id}/ativo`,
      ALTERAR_ORDEM: (id: number) => `/painel/home-blocos/${id}/ordem`,
      EXCLUIR: (id: number) => `/painel/home-blocos/${id}`,
    },
  },

  // =====================================================
  // PEDIDOS
  // =====================================================

  PEDIDOS: {
    // Área autenticada do cliente: o backend identifica o cliente pela sessão.
    MEUS_PEDIDOS: "/meus-pedidos",
    BUSCAR_MEU_PEDIDO: (id: number) => `/meus-pedidos/${id}`,

    // Rotas administrativas do grupo /painel.
    PAINEL: {
      LISTAR: "/painel/pedidos",
      CADASTRAR: "/painel/pedidos",
      BUSCAR_POR_ID: (id: number) => `/painel/pedidos/${id}`,
      ATUALIZAR: (id: number) => `/painel/pedidos/${id}`,
      ALTERAR_STATUS: (id: number) => `/painel/pedidos/${id}/status`,

      ITENS: {
        LISTAR: (pedidoId: number) => `/painel/pedidos/${pedidoId}/itens`,
        ADICIONAR: (pedidoId: number) => `/painel/pedidos/${pedidoId}/itens`,
        ATUALIZAR: (itemId: number) => `/painel/pedidos/itens/${itemId}`,
        REMOVER: (itemId: number) => `/painel/pedidos/itens/${itemId}`,
      },

      ENDERECOS: {
        LISTAR: (pedidoId: number) => `/painel/pedidos/${pedidoId}/enderecos`,
        BUSCAR_POR_ID: (pedidoId: number, enderecoId: number) =>
          `/painel/pedidos/${pedidoId}/enderecos/${enderecoId}`,
        ADICIONAR: (pedidoId: number) =>
          `/painel/pedidos/${pedidoId}/enderecos`,
        ATUALIZAR: (enderecoId: number) =>
          `/painel/pedidos/enderecos/${enderecoId}`,
      },

      HISTORICO: (pedidoId: number) => `/painel/pedidos/${pedidoId}/historico`,
    },
  },

  // =====================================================
  // ENTREGAS
  // =====================================================

  ENTREGAS: {
    PAINEL: {
      LISTAR: "/painel/entregas",
      CADASTRAR: "/painel/entregas",
      BUSCAR_POR_ID: (id: number) => `/painel/entregas/${id}`,
      ATUALIZAR: (id: number) => `/painel/entregas/${id}`,
      LISTAR_POR_PEDIDO: (pedidoId: number) =>
        `/painel/pedidos/${pedidoId}/entregas`,

      EVENTOS: {
        LISTAR: (entregaId: number) => `/painel/entregas/${entregaId}/eventos`,
        BUSCAR_POR_ID: (eventoId: number) =>
          `/painel/entregas/eventos/${eventoId}`,
        CADASTRAR: (entregaId: number) =>
          `/painel/entregas/${entregaId}/eventos`,
      },
    },
  },

  // =====================================================
  // ESTOQUE
  // =====================================================

  ESTOQUE: {
    PAINEL: {
      LOCAIS: {
        LISTAR: "/painel/estoques/locais",
        BUSCAR_POR_CODIGO: (codigo: string) =>
          `/painel/estoques/locais/codigo/${encodeURIComponent(codigo)}`,
        BUSCAR_POR_ID: (id: number) => `/painel/estoques/locais/${id}`,
        CADASTRAR: "/painel/estoques/locais",
        ATUALIZAR: (id: number) => `/painel/estoques/locais/${id}`,
        ALTERAR_ATIVO: (id: number) => `/painel/estoques/locais/${id}/ativo`,
        EXCLUIR: (id: number) => `/painel/estoques/locais/${id}`,
      },

      SALDOS: {
        LISTAR: "/painel/estoques/saldos",
        BUSCAR_POR_CHAVE: (itemChave: string) =>
          `/painel/estoques/saldos/chave/${encodeURIComponent(itemChave)}`,
        BUSCAR_POR_ID: (id: number) => `/painel/estoques/saldos/${id}`,
        CADASTRAR: "/painel/estoques/saldos",
        ATUALIZAR: (id: number) => `/painel/estoques/saldos/${id}`,
        ATUALIZAR_QUANTIDADES: (id: number) =>
          `/painel/estoques/saldos/${id}/quantidades`,
      },

      RESERVAS: {
        LISTAR: "/painel/estoques/reservas",
        BUSCAR_POR_ID: (id: number) => `/painel/estoques/reservas/${id}`,
        CADASTRAR: "/painel/estoques/reservas",
        ATUALIZAR: (id: number) => `/painel/estoques/reservas/${id}`,
        ALTERAR_STATUS: (id: number) =>
          `/painel/estoques/reservas/${id}/status`,
      },

      MOVIMENTOS: {
        LISTAR: "/painel/estoques/movimentos",
        BUSCAR_POR_ID: (id: number) => `/painel/estoques/movimentos/${id}`,
        CADASTRAR: "/painel/estoques/movimentos",
      },
    },
  },

  // =====================================================
  // PAINEL ADMINISTRATIVO
  // =====================================================

  PAINEL: {
    INICIO: "/painel/",
    DADOS: "/painel/dados",
    CARDS: "/painel/dados/cards",
    CLIENTES: "/painel/clientes",
    VISUALIZAR_SITE: "/painel/site/visualizar",
  },
} as const;

export default ROTAS;
