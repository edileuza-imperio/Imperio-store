"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CircleDollarSign,
  Eye,
  EyeOff,
  Loader2,
  Package,
  PackageOpen,
  Pencil,
  RefreshCw,
  Search,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";



/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

type Produto = {
  id_produto: number;
  status_id: number;
  marca_id: number | null;
  sku: string;
  nome: string;
  slug: string;
  descricao: string | null;
  descricao_curta: string | null;
  preco: string | number;
  preco_promocional: string | number | null;
  custo: string | number | null;
  peso: string | number | null;
  largura: string | number | null;
  altura: string | number | null;
  comprimento: string | number | null;
  controlar_estoque: boolean | number;
  permitir_venda_sem_estoque: boolean | number;
  destaque: boolean | number;
  ativo: boolean | number;
  seo_titulo: string | null;
  seo_descricao: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
};

type RespostaAPI<T> = {
  sucesso: boolean;
  mensagem: string;
  dados: T | null;
};

type RespostaPromocional = "sim" | "nao" | null;

type FormularioProduto = {
  sku: string;
  nome: string;
  slug: string;
  descricao: string;
  descricao_curta: string;
  preco: string;
  preco_promocional: string;
  resposta_promocional: RespostaPromocional;
  custo: string;
  ativo: boolean;
  destaque: boolean;
};

type Filtro = "todos" | "ativos" | "inativos" | "destaques";

/*
|--------------------------------------------------------------------------
| CONFIGURAÇÕES
|--------------------------------------------------------------------------
*/

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

const formularioInicial: FormularioProduto = {
  sku: "",
  nome: "",
  slug: "",
  descricao: "",
  descricao_curta: "",
  preco: "",
  preco_promocional: "",
  resposta_promocional: null,
  custo: "",
  ativo: true,
  destaque: false,
};

/*
|--------------------------------------------------------------------------
| FUNÇÕES AUXILIARES
|--------------------------------------------------------------------------
*/

function ehVerdadeiro(
  valor: boolean | number | string | null | undefined,
): boolean {
  return valor === true || valor === 1 || valor === "1" || valor === "true";
}

function formatarPreco(valor: string | number | null | undefined): string {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function gerarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/*
|--------------------------------------------------------------------------
| COMUNICAÇÃO COM A API
|--------------------------------------------------------------------------
*/

async function requisicao<T>(
  rota: string,
  opcoes: RequestInit = {},
): Promise<RespostaAPI<T>> {
  if (!API_URL) {
    throw new Error("A variável NEXT_PUBLIC_API_URL não está configurada.");
  }

  const resposta = await fetch(`${API_URL}${rota}`, {
    ...opcoes,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
      ...opcoes.headers,
    },
    cache: "no-store",
  });

  let resultado: RespostaAPI<T>;

  try {
    resultado = await resposta.json();
  } catch {
    throw new Error("A API retornou uma resposta inválida.");
  }

  if (!resposta.ok || resultado.sucesso === false) {
    throw new Error(
      resultado.mensagem ||
        `Erro na comunicação com a API (${resposta.status}).`,
    );
  }

  return resultado;
}

/*
|--------------------------------------------------------------------------
| COMPONENTE PRINCIPAL
|--------------------------------------------------------------------------
*/

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(8);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [modalAberto, setModalAberto] = useState(false);

  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  const [formulario, setFormulario] =
    useState<FormularioProduto>(formularioInicial);

  /*
  |--------------------------------------------------------------------------
  | CARREGAR PRODUTOS
  |--------------------------------------------------------------------------
  */

  const carregarProdutos = useCallback(async (termo = "") => {
    try {
      setCarregando(true);
      setErro("");

      const rota = termo.trim()
        ? `/painel/produtos/pesquisar?termo=${encodeURIComponent(termo.trim())}`
        : "/painel/produtos";

      const resultado = await requisicao<{
        produtos: Produto[];
        total: number;
      }>(rota);

      const lista = resultado.dados?.produtos;

      if (!Array.isArray(lista)) {
        throw new Error("A API não retornou uma lista válida de produtos.");
      }

      setProdutos(lista);
    } catch (error) {
      console.error("[PRODUTOS]", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os produtos.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  /*
  |--------------------------------------------------------------------------
  | FILTROS
  |--------------------------------------------------------------------------
  */

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      if (filtro === "ativos" && !ehVerdadeiro(produto.ativo)) {
        return false;
      }

      if (filtro === "inativos" && ehVerdadeiro(produto.ativo)) {
        return false;
      }

      if (filtro === "destaques" && !ehVerdadeiro(produto.destaque)) {
        return false;
      }

      return true;
    });
  }, [produtos, filtro]);

  /*
  |--------------------------------------------------------------------------
  | PAGINAÇÃO LOCAL
  |--------------------------------------------------------------------------
  */

  const totalPaginas = Math.max(
    1,
    Math.ceil(produtosFiltrados.length / itensPorPagina),
  );
  const paginaAtualSegura = Math.min(paginaAtual, totalPaginas);

  const produtosPaginados = useMemo(() => {
    const inicio = (paginaAtualSegura - 1) * itensPorPagina;
    return produtosFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [produtosFiltrados, paginaAtualSegura, itensPorPagina]);

  const paginasVisiveis = useMemo(() => {
    const quantidade = Math.min(5, totalPaginas);
    let inicio = Math.max(1, paginaAtualSegura - 2);
    const fimMaximo = Math.max(1, totalPaginas - quantidade + 1);
    inicio = Math.min(inicio, fimMaximo);

    return Array.from({ length: quantidade }, (_, indice) => inicio + indice);
  }, [paginaAtualSegura, totalPaginas]);

  /*
  |--------------------------------------------------------------------------
  | PESQUISA
  |--------------------------------------------------------------------------
  */

  function pesquisar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaginaAtual(1);
    carregarProdutos(busca);
  }

  /*
  |--------------------------------------------------------------------------
  | ABRIR EDIÇÃO
  |--------------------------------------------------------------------------
  */

  function abrirEdicao(produto: Produto) {
    const possuiPromocao = Number(produto.preco_promocional ?? 0) > 0;

    setProdutoEditando(produto);

    setFormulario({
      sku: produto.sku || "",
      nome: produto.nome || "",
      slug: gerarSlug(produto.nome || ""),
      descricao: produto.descricao || "",
      descricao_curta: produto.descricao_curta || "",
      preco: String(produto.preco ?? ""),
      preco_promocional: possuiPromocao
        ? String(produto.preco_promocional)
        : "",
      resposta_promocional: possuiPromocao ? "sim" : "nao",
      custo: String(produto.custo ?? ""),
      ativo: ehVerdadeiro(produto.ativo),
      destaque: ehVerdadeiro(produto.destaque),
    });

    setErro("");
    setMensagem("");
    setModalAberto(true);
  }

  /*
  |--------------------------------------------------------------------------
  | ATUALIZAR CAMPO
  |--------------------------------------------------------------------------
  */

  function atualizarCampo<K extends keyof FormularioProduto>(
    campo: K,
    valor: FormularioProduto[K],
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | NOME E SLUG AUTOMÁTICO
  |--------------------------------------------------------------------------
  */

  function atualizarNome(nome: string) {
    setFormulario((anterior) => ({
      ...anterior,
      nome,
      slug: gerarSlug(nome),
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | ESCOLHA DO PREÇO PROMOCIONAL
  |--------------------------------------------------------------------------
  */

  function escolherPromocao(resposta: "sim" | "nao") {
    setFormulario((anterior) => ({
      ...anterior,
      resposta_promocional: resposta,
      preco_promocional: resposta === "sim" ? anterior.preco_promocional : "",
    }));
  }

  function alterarRespostaPromocao() {
    setFormulario((anterior) => ({
      ...anterior,
      resposta_promocional: null,
      preco_promocional: "",
    }));
  }

  /*
  |--------------------------------------------------------------------------
  | ATUALIZAR PRODUTO
  |--------------------------------------------------------------------------
  */

  async function salvarProduto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!produtoEditando) {
      setErro("Selecione um produto para editar.");
      return;
    }

    if (
      formulario.resposta_promocional === "sim" &&
      (!formulario.preco_promocional.trim() ||
        Number(formulario.preco_promocional) <= 0)
    ) {
      setErro("Informe um preço promocional válido.");
      return;
    }

    if (formulario.resposta_promocional === null) {
      setErro("Informe se o produto terá preço promocional.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setMensagem("");

      const slug = gerarSlug(formulario.nome);

      const dados = {
        sku: formulario.sku.trim(),
        nome: formulario.nome.trim(),
        slug,
        descricao: formulario.descricao.trim() || null,
        descricao_curta: formulario.descricao_curta.trim() || null,
        preco: formulario.preco,

        preco_promocional:
          formulario.resposta_promocional === "sim"
            ? formulario.preco_promocional
            : null,

        custo: formulario.custo || null,

        ativo: formulario.ativo,
        destaque: formulario.destaque,
      };

      const resultado = await requisicao(
        `/painel/produtos/${produtoEditando.id_produto}`,
        {
          method: "PUT",
          body: JSON.stringify(dados),
        },
      );

      setMensagem(resultado.mensagem || "Produto atualizado com sucesso.");

      setModalAberto(false);

      await carregarProdutos(busca);
    } catch (error) {
      console.error("[SALVAR PRODUTO]", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o produto.",
      );
    } finally {
      setSalvando(false);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | ATIVAR / DESATIVAR
  |--------------------------------------------------------------------------
  */

  async function alterarAtivo(produto: Produto) {
    const novoEstado = !ehVerdadeiro(produto.ativo);

    try {
      setErro("");
      setMensagem("");

      const resultado = await requisicao(
        `/painel/produtos/${produto.id_produto}/ativo`,
        {
          method: "PUT",
          body: JSON.stringify({
            ativo: novoEstado,
          }),
        },
      );

      setMensagem(
        resultado.mensagem ||
          (novoEstado ? "Produto ativado." : "Produto desativado."),
      );

      await carregarProdutos(busca);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o produto.",
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | DESTAQUE
  |--------------------------------------------------------------------------
  */

  async function alterarDestaque(produto: Produto) {
    const novoEstado = !ehVerdadeiro(produto.destaque);

    try {
      setErro("");
      setMensagem("");

      const resultado = await requisicao(
        `/painel/produtos/${produto.id_produto}/destaque`,
        {
          method: "PUT",
          body: JSON.stringify({
            destaque: novoEstado,
          }),
        },
      );

      setMensagem(resultado.mensagem || "Destaque atualizado.");

      await carregarProdutos(busca);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o destaque.",
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | EXCLUIR PRODUTO
  |--------------------------------------------------------------------------
  */

  async function excluirProduto(produto: Produto) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o produto "${produto.nome}"?\n\nEssa ação não poderá ser desfeita.`,
    );

    if (!confirmar) return;

    try {
      setErro("");
      setMensagem("");

      const resultado = await requisicao(
        `/painel/produtos/${produto.id_produto}`,
        {
          method: "DELETE",
        },
      );

      setMensagem(resultado.mensagem || "Produto excluído com sucesso.");

      await carregarProdutos(busca);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir o produto.",
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | FECHAR MODAL
  |--------------------------------------------------------------------------
  */

  function fecharModal() {
    if (salvando) return;

    setModalAberto(false);
    setErro("");
  }

  /*
  |--------------------------------------------------------------------------
  | INTERFACE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="produtos-page">
      {/* CABEÇALHO */}

      <header className="page-header">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            GERENCIAMENTO DA LOJA
          </div>

          <h1>Produtos cadastrados</h1>

          <p>
            Visualize e organize os produtos cadastrados no catálogo do Universo
            Império.
          </p>
        </div>
      </header>

      {/* MENSAGENS */}

      {erro && !modalAberto && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{erro}</span>

          <button
            onClick={() => setErro("")}
            type="button"
            aria-label="Fechar mensagem"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {mensagem && (
        <div className="alert alert-success">
          <Check size={18} />
          <span>{mensagem}</span>

          <button
            onClick={() => setMensagem("")}
            type="button"
            aria-label="Fechar mensagem"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* LISTAGEM */}

      <section id="listar-produtos" className="products-panel">
        <div className="panel-top">
          <div>
            <span className="panel-label">CATÁLOGO</span>

            <h2>Listar produtos</h2>

            <p>Use a pesquisa e os filtros para encontrar um produto.</p>
          </div>

          <button
            className="refresh-button"
            onClick={() => carregarProdutos(busca)}
            disabled={carregando}
            type="button"
            title="Atualizar produtos"
          >
            <RefreshCw size={17} className={carregando ? "spin" : ""} />
            Atualizar
          </button>
        </div>

        {/* PESQUISA */}

        <div className="toolbar">
          <form className="search-form" onSubmit={pesquisar}>
            <Search size={18} />

            <input
              type="search"
              placeholder="Pesquisar por nome, SKU ou slug..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />

            <button type="submit" disabled={carregando}>
              Buscar
            </button>
          </form>

          <div className="filter-area">
            <Tag size={17} />

            <select
              value={filtro}
              onChange={(event) => {
                setFiltro(event.target.value as Filtro);
                setPaginaAtual(1);
              }}
              aria-label="Filtrar produtos"
            >
              <option value="todos">Todos os produtos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
              <option value="destaques">Em destaque</option>
            </select>
          </div>
        </div>

        {/* CATÁLOGO EM CARDS */}
        <div className="products-grid">
          {carregando ? (
            <div className="catalog-feedback" role="status" aria-live="polite">
              <Loader2 className="spin" size={28} />
              <strong>Carregando produtos...</strong>
              <span>Estamos buscando os produtos do catálogo.</span>
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="catalog-feedback empty" role="status">
              <PackageOpen size={38} />
              <strong>Nenhum produto encontrado</strong>
              <span>
                Ajuste a busca ou os filtros para localizar outros produtos.
              </span>
            </div>
          ) : (
            produtosPaginados.map((produto) => {
              const ativo = ehVerdadeiro(produto.ativo);
              const destaque = ehVerdadeiro(produto.destaque);
              const possuiPromocao = Number(produto.preco_promocional ?? 0) > 0;

              return (
                <article className="product-card" key={produto.id_produto}>
                  <div className="product-card-top">
                    <div className="product-card-identity">
                      <div className="product-placeholder">
                        <Package size={23} />
                      </div>
                      <div className="product-info">
                        <strong title={produto.nome}>{produto.nome}</strong>
                        <small title={produto.slug}>
                          {produto.slug || "Sem slug"}
                        </small>
                      </div>
                    </div>
                    <button
                      className={`star-button ${destaque ? "star-active" : ""}`}
                      onClick={() => alterarDestaque(produto)}
                      type="button"
                      title={
                        destaque ? "Remover destaque" : "Adicionar destaque"
                      }
                      aria-label={
                        destaque ? "Remover destaque" : "Adicionar destaque"
                      }
                    >
                      <Star
                        size={18}
                        fill={destaque ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  <div className="product-card-tags">
                    <span
                      className={`status-badge ${ativo ? "status-active" : "status-inactive"}`}
                    >
                      <span />
                      {ativo ? "Ativo" : "Inativo"}
                    </span>
                    {destaque && (
                      <span className="featured-badge">
                        <Star size={12} fill="currentColor" /> Em destaque
                      </span>
                    )}
                  </div>

                  <div className="product-card-details">
                    <div className="product-card-description">
                      <span>SKU</span>
                      <strong className="sku">
                        {produto.sku || "Não informado"}
                      </strong>
                    </div>
                    <div className="product-card-description">
                      <span>Descrição</span>
                      <p>
                        {produto.descricao_curta ||
                          "Nenhuma descrição curta cadastrada."}
                      </p>
                    </div>
                  </div>

                  <div className="product-card-price">
                    <span>Preço de venda</span>
                    {possuiPromocao ? (
                      <div className="price-values">
                        <strong className="promo-price">
                          {formatarPreco(produto.preco_promocional)}
                        </strong>
                        <small>
                          <s>{formatarPreco(produto.preco)}</s>
                        </small>
                      </div>
                    ) : (
                      <strong>{formatarPreco(produto.preco)}</strong>
                    )}
                  </div>

                  <div className="product-card-actions">
                    <button
                      type="button"
                      className="card-action-button edit"
                      onClick={() => abrirEdicao(produto)}
                    >
                      <Pencil size={15} />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      className="card-action-icon visibility"
                      onClick={() => alterarAtivo(produto)}
                      title={ativo ? "Desativar produto" : "Ativar produto"}
                      aria-label={
                        ativo ? "Desativar produto" : "Ativar produto"
                      }
                    >
                      {ativo ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                    <button
                      type="button"
                      className="card-action-icon delete"
                      onClick={() => excluirProduto(produto)}
                      title="Excluir produto"
                      aria-label="Excluir produto"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <footer className="catalog-footer">
          <div className="catalog-footer-summary">
            <span>
              Mostrando{" "}
              <strong>
                {produtosFiltrados.length === 0
                  ? 0
                  : (paginaAtualSegura - 1) * itensPorPagina + 1}
              </strong>{" "}
              –{" "}
              <strong>
                {Math.min(
                  paginaAtualSegura * itensPorPagina,
                  produtosFiltrados.length,
                )}
              </strong>{" "}
              de <strong>{produtosFiltrados.length}</strong> produtos
            </span>
            <label className="page-size-control">
              Itens por página
              <select
                value={itensPorPagina}
                onChange={(event) => {
                  setItensPorPagina(Number(event.target.value));
                  setPaginaAtual(1);
                }}
                aria-label="Quantidade de produtos por página"
              >
                <option value={6}>6</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={16}>16</option>
              </select>
            </label>
          </div>

          {produtosFiltrados.length > 0 && (
            <nav
              className="catalog-pagination"
              aria-label="Paginação de produtos"
            >
              <button
                type="button"
                onClick={() => setPaginaAtual(1)}
                disabled={paginaAtualSegura === 1}
                aria-label="Primeira página"
                title="Primeira página"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setPaginaAtual((pagina) => Math.max(1, pagina - 1))
                }
                disabled={paginaAtualSegura === 1}
                aria-label="Página anterior"
                title="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>

              {paginasVisiveis.map((pagina) => (
                <button
                  key={pagina}
                  type="button"
                  className={
                    pagina === paginaAtualSegura
                      ? "page-number active"
                      : "page-number"
                  }
                  onClick={() => setPaginaAtual(pagina)}
                  aria-current={
                    pagina === paginaAtualSegura ? "page" : undefined
                  }
                >
                  {pagina}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))
                }
                disabled={paginaAtualSegura === totalPaginas}
                aria-label="Próxima página"
                title="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPaginaAtual(totalPaginas)}
                disabled={paginaAtualSegura === totalPaginas}
                aria-label="Última página"
                title="Última página"
              >
                <ChevronsRight size={16} />
              </button>
            </nav>
          )}
        </footer>
      </section>

      {/* MODAL EXCLUSIVO PARA EDIÇÃO */}

      {modalAberto && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharModal();
            }
          }}
        >
          <section
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* CABEÇALHO DO MODAL */}

            <header className="modal-header">
              <div>
                <span className="panel-label">GERENCIAMENTO DE PRODUTOS</span>

                <h2 id="modal-title">Editar produto</h2>

                <p>Atualize as informações deste produto no catálogo.</p>
              </div>

              <button
                className="modal-close"
                type="button"
                onClick={fecharModal}
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            </header>

            {/* FORMULÁRIO COM ROLAGEM */}

            <form onSubmit={salvarProduto}>
              {erro && (
                <div className="alert alert-error modal-error">
                  <AlertCircle size={18} />

                  <span>{erro}</span>
                </div>
              )}

              <div className="form-section">
                <div className="form-section-heading">
                  <span className="section-number">01</span>

                  <div>
                    <h3>Informações gerais</h3>

                    <p>Identificação e descrição do produto.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    SKU
                    <input
                      required
                      value={formulario.sku}
                      onChange={(event) =>
                        atualizarCampo("sku", event.target.value)
                      }
                      placeholder="Ex.: PRD-00000001"
                    />
                    <small>Código único de identificação.</small>
                  </label>

                  <label>
                    Nome do produto
                    <input
                      required
                      value={formulario.nome}
                      onChange={(event) => atualizarNome(event.target.value)}
                      placeholder="Digite o nome do produto"
                    />
                  </label>

                  <label className="full">
                    Slug automático
                    <input
                      value={formulario.slug}
                      readOnly
                      placeholder="Será gerado pelo nome"
                    />
                    <small>
                      Gerado automaticamente conforme você digita o nome do
                      produto.
                    </small>
                  </label>

                  <label className="full">
                    Descrição curta
                    <input
                      value={formulario.descricao_curta}
                      onChange={(event) =>
                        atualizarCampo("descricao_curta", event.target.value)
                      }
                      placeholder="Resumo do produto para a loja"
                    />
                  </label>

                  <label className="full">
                    Descrição completa
                    <textarea
                      rows={5}
                      value={formulario.descricao}
                      onChange={(event) =>
                        atualizarCampo("descricao", event.target.value)
                      }
                      placeholder="Descreva os detalhes do produto..."
                    />
                  </label>
                </div>
              </div>

              <div className="form-divider" />

              <div className="form-section">
                <div className="form-section-heading">
                  <span className="section-number">02</span>

                  <div>
                    <h3>Preços e valores</h3>

                    <p>Defina o preço de venda e as condições promocionais.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    Preço de venda
                    <div className="money-input">
                      <span>R$</span>

                      <input
                        required
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={formulario.preco}
                        onChange={(event) =>
                          atualizarCampo("preco", event.target.value)
                        }
                        placeholder="0,00"
                      />
                    </div>
                  </label>

                  <label>
                    Custo do produto
                    <div className="money-input">
                      <span>R$</span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formulario.custo}
                        onChange={(event) =>
                          atualizarCampo("custo", event.target.value)
                        }
                        placeholder="Opcional"
                      />
                    </div>
                  </label>

                  {/* PERGUNTA DA PROMOÇÃO */}

                  <div className="full promotion-question">
                    <div className="promotion-heading">
                      <div className="promotion-icon">
                        <CircleDollarSign size={22} />
                      </div>

                      <div>
                        <strong>Este produto terá preço promocional?</strong>

                        <small>Escolha uma opção para continuar.</small>
                      </div>
                    </div>

                    {/* SIM OU NÃO */}

                    {formulario.resposta_promocional === null && (
                      <div className="promotion-options">
                        <button
                          type="button"
                          className="promotion-choice yes"
                          onClick={() => escolherPromocao("sim")}
                        >
                          <Check size={18} />
                          Sim, terá promoção
                        </button>

                        <button
                          type="button"
                          className="promotion-choice no"
                          onClick={() => escolherPromocao("nao")}
                        >
                          <X size={18} />
                          Não terá promoção
                        </button>
                      </div>
                    )}

                    {/* SIM: MOSTRA O CAMPO DE PREÇO */}

                    {formulario.resposta_promocional === "sim" && (
                      <div className="promotion-result">
                        <div className="promotion-selected yes-selected">
                          <span className="selected-icon">
                            <Check size={15} />
                          </span>

                          <div>
                            <strong>Sim, este produto terá promoção.</strong>

                            <small>Informe o valor promocional abaixo.</small>
                          </div>
                        </div>

                        <label className="promotion-price-field">
                          Preço promocional
                          <div className="money-input promo-money-input">
                            <span>R$</span>

                            <input
                              required
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={formulario.preco_promocional}
                              onChange={(event) =>
                                atualizarCampo(
                                  "preco_promocional",
                                  event.target.value,
                                )
                              }
                              placeholder="Informe o preço promocional"
                            />
                          </div>
                          <small>
                            O cliente verá o preço promocional no lugar do preço
                            normal.
                          </small>
                        </label>

                        <button
                          type="button"
                          className="change-answer"
                          onClick={alterarRespostaPromocao}
                        >
                          Alterar resposta
                        </button>
                      </div>
                    )}

                    {/* NÃO: NÃO MOSTRA O CAMPO */}

                    {formulario.resposta_promocional === "nao" && (
                      <div className="promotion-result">
                        <div className="promotion-selected no-selected">
                          <span className="selected-icon">
                            <Check size={15} />
                          </span>

                          <div>
                            <strong>
                              Não, este produto não terá promoção.
                            </strong>

                            <small>
                              Será utilizado somente o preço de venda.
                            </small>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="change-answer"
                          onClick={alterarRespostaPromocao}
                        >
                          Alterar resposta
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-divider" />

              <div className="form-section">
                <div className="form-section-heading">
                  <span className="section-number">03</span>

                  <div>
                    <h3>Disponibilidade e destaque</h3>

                    <p>Configure como o produto será apresentado na loja.</p>
                  </div>
                </div>

                <div className="form-options">
                  <label className="check-option">
                    <input
                      type="checkbox"
                      checked={formulario.ativo}
                      onChange={(event) =>
                        atualizarCampo("ativo", event.target.checked)
                      }
                    />

                    <span className="custom-check">
                      <Check size={14} />
                    </span>

                    <span className="check-text">
                      <strong>Produto ativo</strong>

                      <small>Disponibilizar o produto no catálogo.</small>
                    </span>
                  </label>

                  <label className="check-option">
                    <input
                      type="checkbox"
                      checked={formulario.destaque}
                      onChange={(event) =>
                        atualizarCampo("destaque", event.target.checked)
                      }
                    />

                    <span className="custom-check">
                      <Check size={14} />
                    </span>

                    <span className="check-text">
                      <strong>Produto em destaque</strong>

                      <small>Marcar o produto como destaque.</small>
                    </span>
                  </label>
                </div>
              </div>

              {/* RODAPÉ FIXO */}

              <footer className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={fecharModal}
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={salvando}
                >
                  {salvando ? (
                    <>
                      <Loader2 size={17} className="spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      Salvar alterações
                    </>
                  )}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
