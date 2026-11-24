"use client";

import {
  ArrowRight,
  BadgePercent,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Package,
  PackageOpen,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";

import CarrinhoService from "@/Services/Carrinho/CarrinhoService";
import conexao from "@/Services/Conexao/Conexao";
import ImagemService from "@/Services/Imagem/ImagemService";
import ROTAS from "@/app/constants/rotas";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type Registro = Record<string, unknown>;

interface ProdutoImagem {
  url?: string | null;
  imagem_url?: string | null;
  caminho?: string | null;
  arquivo?: string | null;
  nome_arquivo?: string | null;
  principal?: boolean | number | string;
  ordem?: number;
  texto_alternativo?: string | null;
}

interface Produto {
  id_produto: number;
  status_id?: number;
  marca_id?: number | null;
  sku?: string | null;
  nome: string;
  slug: string;
  descricao?: string | null;
  descricao_curta?: string | null;
  preco: string | number;
  preco_promocional?: string | number | null;
  destaque?: boolean | number | string;
  ativo?: boolean | number | string;
  imagem_url?: string | null;
  imagem?: string | null;
  miniatura?: string | null;
  imagem_principal?: string | ProdutoImagem | null;
  imagens?: ProdutoImagem[] | null;
}

interface CategoriaResumo {
  id_categoria: number;
  nome: string;
  slug?: string;
  descricao?: string | null;
  imagem_url?: string | null;
}

type Ordenacao = "relevancia" | "menor-preco" | "maior-preco" | "nome";
type FiltroRapido = "todos" | "ofertas" | "destaques";

const LOTE_INICIAL = 10;
const TAMANHO_LOTE = 10;

function ehRegistro(valor: unknown): valor is Registro {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function normalizarResposta(valor: unknown): Registro {
  let atual: unknown = valor;

  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    if (typeof atual === "string") {
      try {
        atual = JSON.parse(atual) as unknown;
      } catch {
        throw new Error("A API retornou um conteúdo que não é JSON válido.");
      }
    }

    if (!ehRegistro(atual)) break;
    if ("sucesso" in atual) return atual;
    if ("data" in atual && atual.data !== undefined) {
      atual = atual.data;
      continue;
    }
    break;
  }

  if (!ehRegistro(atual)) {
    throw new Error("Não foi possível interpretar a resposta da API.");
  }
  return atual;
}

function ehVerdadeiro(valor: unknown): boolean {
  return (
    valor === true ||
    valor === 1 ||
    valor === "1" ||
    (typeof valor === "string" &&
      ["true", "sim", "ativo"].includes(valor.toLowerCase()))
  );
}

function numeroPreco(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (typeof valor !== "string" || !valor.trim()) return 0;

  const texto = valor.trim();
  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const convertido = Number(normalizado);
  return Number.isFinite(convertido) ? convertido : 0;
}

function formatarPreco(valor: unknown): string {
  return numeroPreco(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function temPromocao(produto: Produto): boolean {
  const promocional = numeroPreco(produto.preco_promocional);
  const normal = numeroPreco(produto.preco);
  return promocional > 0 && normal > 0 && promocional < normal;
}

function precoAtual(produto: Produto): number {
  return temPromocao(produto)
    ? numeroPreco(produto.preco_promocional)
    : numeroPreco(produto.preco);
}

function resolverCaminhoImagem(
  valor: unknown,
  contexto: "produto" | "geral" = "produto",
): string | null {
  if (typeof valor !== "string" || !valor.trim()) return null;
  const caminho = valor.trim();

  if (
    /^(https?:\/\/|data:|blob:|\/\/)/i.test(caminho) ||
    caminho.startsWith("/")
  ) {
    return caminho;
  }

  try {
    return contexto === "produto"
      ? ImagemService.produto(caminho) ||
          ImagemService.resolver(caminho) ||
          caminho
      : ImagemService.resolver(caminho) || caminho;
  } catch (error) {
    console.warn("[CATEGORIA] Não foi possível resolver a imagem:", error);
    return caminho;
  }
}

function obterImagemProduto(produto: Produto): string | null {
  const principal = produto.imagem_principal;
  const objetoPrincipal =
    typeof principal === "object" && principal !== null ? principal : null;
  const imagens = Array.isArray(produto.imagens)
    ? [...produto.imagens].sort((a, b) => {
        const principalA = ehVerdadeiro(a.principal) ? 0 : 1;
        const principalB = ehVerdadeiro(b.principal) ? 0 : 1;
        return (
          principalA - principalB || Number(a.ordem ?? 0) - Number(b.ordem ?? 0)
        );
      })
    : [];
  const primeira = imagens[0];

  const candidatos: unknown[] = [
    produto.imagem_url,
    typeof principal === "string" ? principal : null,
    objetoPrincipal?.url,
    objetoPrincipal?.imagem_url,
    objetoPrincipal?.caminho,
    objetoPrincipal?.arquivo,
    objetoPrincipal?.nome_arquivo,
    primeira?.url,
    primeira?.imagem_url,
    primeira?.caminho,
    primeira?.arquivo,
    primeira?.nome_arquivo,
    produto.imagem,
    produto.miniatura,
  ];

  for (const candidato of candidatos) {
    const resolvida = resolverCaminhoImagem(candidato, "produto");
    if (resolvida) return resolvida;
  }
  return null;
}

function mensagemErro(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível adicionar este produto ao carrinho. Tente novamente.";
}

export default function CatalogoCategoria() {
  const params = useParams<{ id: string }>();
  const categoriaId = useMemo(() => {
    const valor = params?.id;
    const convertido = Number(valor);
    return Number.isInteger(convertido) && convertido > 0 ? convertido : null;
  }, [params?.id]);

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categoria, setCategoria] = useState<CategoriaResumo | null>(null);
  const [outrasCategorias, setOutrasCategorias] = useState<CategoriaResumo[]>(
    [],
  );
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("relevancia");
  const [filtroRapido, setFiltroRapido] = useState<FiltroRapido>("todos");
  const [precoMaximo, setPrecoMaximo] = useState<number | null>(null);
  const [quantidadeVisivel, setQuantidadeVisivel] = useState(LOTE_INICIAL);
  const [filtrosMobileAbertos, setFiltrosMobileAbertos] = useState(false);
  const [imagensComErro, setImagensComErro] = useState<number[]>([]);
  const [adicionandoId, setAdicionandoId] = useState<number | null>(null);

  const carregarProdutos = useCallback(async () => {
    if (categoriaId === null) {
      setProdutos([]);
      setCategoria(null);
      setErro("O endereço desta categoria não é válido.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      const [respostaProdutos, respostaCategorias] = await Promise.all([
        conexao.get<unknown>(ROTAS.PRODUTOS.LISTAR_POR_CATEGORIA(categoriaId)),
        conexao.get<unknown>(ROTAS.CATEGORIAS.LISTAR).catch(() => null),
      ]);

      const payload = normalizarResposta(respostaProdutos.data);
      if (payload.sucesso !== true) {
        throw new Error(
          typeof payload.mensagem === "string"
            ? payload.mensagem
            : "Não foi possível carregar os produtos desta categoria.",
        );
      }

      const dados = ehRegistro(payload.dados) ? payload.dados : {};
      const listaBruta = Array.isArray(dados.produtos) ? dados.produtos : [];
      const lista = listaBruta.filter(
        (item): item is Produto =>
          ehRegistro(item) &&
          Number(item.id_produto) > 0 &&
          typeof item.nome === "string",
      );
      setProdutos(lista);
      setImagensComErro([]);
      setQuantidadeVisivel(LOTE_INICIAL);

      let categorias: CategoriaResumo[] = [];
      if (respostaCategorias) {
        try {
          const payloadCategorias = normalizarResposta(respostaCategorias.data);
          const dadosCategorias = ehRegistro(payloadCategorias.dados)
            ? payloadCategorias.dados
            : {};
          categorias = Array.isArray(dadosCategorias.categorias)
            ? (dadosCategorias.categorias as CategoriaResumo[])
            : [];
        } catch (categoriaError) {
          console.warn(
            "[CATEGORIA] Não foi possível carregar categorias relacionadas:",
            categoriaError,
          );
        }
      }

      const encontrada = categorias.find(
        (item) => Number(item.id_categoria) === categoriaId,
      );
      setCategoria(encontrada ?? null);
      setOutrasCategorias(
        categorias
          .filter((item) => Number(item.id_categoria) !== categoriaId)
          .slice(0, 6),
      );
    } catch (error) {
      console.error("[CATEGORIA] Erro ao carregar produtos:", error);
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os produtos.",
      );
      setProdutos([]);
    } finally {
      setCarregando(false);
    }
  }, [categoriaId]);

  useEffect(() => {
    void carregarProdutos();
  }, [carregarProdutos]);

  const maiorPrecoDisponivel = useMemo(
    () =>
      produtos.length ? Math.ceil(Math.max(...produtos.map(precoAtual))) : 0,
    [produtos],
  );

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const resultado = produtos.filter((produto) => {
      const correspondeBusca =
        !termo ||
        [
          produto.nome,
          produto.sku,
          produto.descricao_curta,
          produto.descricao,
        ].some((valor) =>
          String(valor ?? "")
            .toLocaleLowerCase("pt-BR")
            .includes(termo),
        );
      const correspondeFiltro =
        filtroRapido === "todos" ||
        (filtroRapido === "ofertas" && temPromocao(produto)) ||
        (filtroRapido === "destaques" && ehVerdadeiro(produto.destaque));
      const correspondePreco =
        precoMaximo === null || precoAtual(produto) <= precoMaximo;
      return correspondeBusca && correspondeFiltro && correspondePreco;
    });

    switch (ordenacao) {
      case "menor-preco":
        resultado.sort((a, b) => precoAtual(a) - precoAtual(b));
        break;
      case "maior-preco":
        resultado.sort((a, b) => precoAtual(b) - precoAtual(a));
        break;
      case "nome":
        resultado.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        break;
      default:
        resultado.sort(
          (a, b) =>
            Number(ehVerdadeiro(b.destaque)) - Number(ehVerdadeiro(a.destaque)),
        );
    }
    return resultado;
  }, [produtos, busca, ordenacao, filtroRapido, precoMaximo]);

  const produtosExibidos = produtosFiltrados.slice(0, quantidadeVisivel);
  const totalOfertas = useMemo(
    () => produtos.filter(temPromocao).length,
    [produtos],
  );
  const totalDestaques = useMemo(
    () => produtos.filter((item) => ehVerdadeiro(item.destaque)).length,
    [produtos],
  );
  const nomeCategoria = categoria?.nome || `Categoria ${categoriaId ?? ""}`;
  const imagemCategoria = resolverCaminhoImagem(categoria?.imagem_url, "geral");
  const possuiFiltros =
    busca.trim() !== "" || filtroRapido !== "todos" || precoMaximo !== null;
  const restantes = Math.max(
    0,
    produtosFiltrados.length - produtosExibidos.length,
  );

  function redefinirQuantidadeVisivel() {
    setQuantidadeVisivel(LOTE_INICIAL);
  }

  function limparFiltros() {
    setBusca("");
    setFiltroRapido("todos");
    setPrecoMaximo(null);
    setOrdenacao("relevancia");
    redefinirQuantidadeVisivel();
  }

  function alterarBusca(valor: string) {
    setBusca(valor);
    redefinirQuantidadeVisivel();
  }

  function alterarFiltro(valor: FiltroRapido) {
    setFiltroRapido(valor);
    redefinirQuantidadeVisivel();
    setFiltrosMobileAbertos(false);
  }

  function alterarPreco(valor: number | null) {
    setPrecoMaximo(valor);
    redefinirQuantidadeVisivel();
  }

  function alterarOrdenacao(valor: Ordenacao) {
    setOrdenacao(valor);
    redefinirQuantidadeVisivel();
  }

  async function adicionarAoCarrinho(produto: Produto) {
    if (adicionandoId !== null) return;
    const preco = precoAtual(produto);
    if (
      !Number.isInteger(Number(produto.id_produto)) ||
      Number(produto.id_produto) <= 0
    ) {
      toast.error("Não foi possível identificar este produto.");
      return;
    }
    if (!Number.isFinite(preco) || preco < 0) {
      toast.error("O preço deste produto é inválido.");
      return;
    }

    setAdicionandoId(produto.id_produto);
    try {
      const resumo = await CarrinhoService.adicionar({
        produto_id: Number(produto.id_produto),
        variacao_id: null,
        quantidade: 1,
        preco_unitario: preco,
      });
      const total = Number(resumo.total_itens);
      toast.success(
        `${produto.nome} adicionado ao carrinho${Number.isFinite(total) ? ` · ${total} ${total === 1 ? "item" : "itens"}` : ""}.`,
      );
    } catch (error) {
      console.error("[CATEGORIA][CARRINHO] Erro ao adicionar produto:", error);
      toast.error(mensagemErro(error));
    } finally {
      setAdicionandoId(null);
    }
  }

  function marcarImagemComErro(produtoId: number) {
    setImagensComErro((atuais) =>
      atuais.includes(produtoId) ? atuais : [...atuais, produtoId],
    );
  }

  return (
    <main className="categoria-page">
      <div className="categoria-page__container">
        <nav className="categoria-breadcrumb" aria-label="Navegação estrutural">
          <Link href="/">Início</Link>
          <ChevronRight size={13} aria-hidden="true" />
          <Link href="/#categorias">Categorias</Link>
          <ChevronRight size={13} aria-hidden="true" />
          <span aria-current="page">{nomeCategoria}</span>
        </nav>

        <header className="categoria-heading">
          <div className="categoria-heading__copy">
            <span className="categoria-heading__eyebrow">
              <Sparkles size={13} /> COLEÇÃO UNIVERSO IMPÉRIO
            </span>
            <h1>{nomeCategoria}</h1>
            <p>
              {categoria?.descricao ||
                "Explore nossa seleção e encontre produtos escolhidos para fazer parte dos seus momentos."}
            </p>
          </div>
          <div className="categoria-heading__stat" aria-live="polite">
            <strong>
              {carregando
                ? "—"
                : produtosFiltrados.length.toString().padStart(2, "0")}
            </strong>
            <span>
              {produtosFiltrados.length === 1
                ? "produto encontrado"
                : "produtos encontrados"}
            </span>
          </div>
        </header>

        <section className="categoria-controls" aria-label="Pesquisa e filtros">
          <div className="categoria-controls__top">
            <label className="categoria-search">
              <Search size={17} aria-hidden="true" />
              <input
                type="search"
                value={busca}
                onChange={(event) => alterarBusca(event.target.value)}
                placeholder="Buscar nesta coleção..."
                aria-label="Buscar produtos nesta categoria"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => alterarBusca("")}
                  aria-label="Limpar busca"
                >
                  <X size={15} />
                </button>
              )}
            </label>

            <div className="categoria-controls__right">
              <label className="categoria-sort">
                <SlidersHorizontal size={15} aria-hidden="true" />
                <span>Ordenar</span>
                <select
                  value={ordenacao}
                  onChange={(event) =>
                    alterarOrdenacao(event.target.value as Ordenacao)
                  }
                  aria-label="Ordenar produtos"
                >
                  <option value="relevancia">Relevância</option>
                  <option value="menor-preco">Menor preço</option>
                  <option value="maior-preco">Maior preço</option>
                  <option value="nome">Nome A–Z</option>
                </select>
                <ChevronDown size={13} aria-hidden="true" />
              </label>
              <button
                type="button"
                className="categoria-refresh"
                onClick={() => void carregarProdutos()}
                disabled={carregando}
                aria-label="Atualizar produtos"
                title="Atualizar produtos"
              >
                <RefreshCw
                  size={16}
                  className={carregando ? "is-spinning" : ""}
                />
              </button>
            </div>
          </div>

          <div className="categoria-controls__bottom">
            <div
              className="categoria-filter-tabs"
              role="group"
              aria-label="Filtrar produtos"
            >
              <button
                type="button"
                className={filtroRapido === "todos" ? "is-active" : ""}
                onClick={() => alterarFiltro("todos")}
              >
                Todos <span>{produtos.length}</span>
              </button>
              <button
                type="button"
                className={filtroRapido === "ofertas" ? "is-active" : ""}
                onClick={() => alterarFiltro("ofertas")}
              >
                <BadgePercent size={14} /> Ofertas <span>{totalOfertas}</span>
              </button>
              <button
                type="button"
                className={filtroRapido === "destaques" ? "is-active" : ""}
                onClick={() => alterarFiltro("destaques")}
              >
                <Star size={14} /> Destaques <span>{totalDestaques}</span>
              </button>
            </div>

            <details className="categoria-price-filter">
              <summary>
                <SlidersHorizontal size={14} />
                Preço máximo
                <strong>
                  {formatarPreco(precoMaximo ?? maiorPrecoDisponivel)}
                </strong>
                <ChevronDown size={13} />
              </summary>
              <div className="categoria-price-filter__panel">
                <input
                  type="range"
                  min={0}
                  max={Math.max(maiorPrecoDisponivel, 1)}
                  step={1}
                  value={precoMaximo ?? maiorPrecoDisponivel}
                  onChange={(event) => alterarPreco(Number(event.target.value))}
                  disabled={produtos.length === 0}
                  aria-label="Preço máximo"
                />
                <div>
                  <span>R$ 0</span>
                  <span>{formatarPreco(maiorPrecoDisponivel)}</span>
                </div>
                {precoMaximo !== null && (
                  <button type="button" onClick={() => alterarPreco(null)}>
                    Remover limite de preço
                  </button>
                )}
              </div>
            </details>

            {possuiFiltros && (
              <button
                type="button"
                className="categoria-clear-filters"
                onClick={limparFiltros}
              >
                Limpar filtros <X size={13} />
              </button>
            )}
          </div>
        </section>

        <section
          className="categoria-results"
          aria-label={`Produtos de ${nomeCategoria}`}
        >
          <div className="categoria-results__heading">
            <div>
              <span className="categoria-results__eyebrow">A SELEÇÃO</span>
              <h2>Encontre o seu próximo favorito</h2>
            </div>
            {!carregando && !erro && (
              <span className="categoria-results__count">
                {produtosFiltrados.length}{" "}
                {produtosFiltrados.length === 1 ? "resultado" : "resultados"}
              </span>
            )}
          </div>

          {carregando && (
            <div
              className="categoria-product-grid"
              aria-label="Carregando produtos"
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <div className="categoria-skeleton" key={index}>
                  <div className="categoria-skeleton__media" />
                  <span />
                  <span />
                  <b />
                </div>
              ))}
            </div>
          )}

          {!carregando && erro && (
            <div className="categoria-state categoria-state--error">
              <span className="categoria-state__icon">
                <RefreshCw size={24} />
              </span>
              <span className="categoria-state__eyebrow">
                CATÁLOGO INDISPONÍVEL
              </span>
              <h2>Não foi possível carregar esta coleção.</h2>
              <p>{erro}</p>
              <button
                type="button"
                className="categoria-primary-button"
                onClick={() => void carregarProdutos()}
              >
                <RefreshCw size={15} /> Tentar novamente
              </button>
            </div>
          )}

          {!carregando && !erro && produtosFiltrados.length > 0 && (
            <>
              <div className="categoria-product-grid">
                {produtosExibidos.map((produto) => {
                  const imagem = obterImagemProduto(produto);
                  const imagemFalhou = imagensComErro.includes(
                    produto.id_produto,
                  );
                  const promocao = temPromocao(produto);
                  const desconto = promocao
                    ? Math.round(
                        (1 -
                          numeroPreco(produto.preco_promocional) /
                            numeroPreco(produto.preco)) *
                          100,
                      )
                    : 0;
                  const destaque = ehVerdadeiro(produto.destaque);
                  const adicionando = adicionandoId === produto.id_produto;
                  const slug =
                    produto.slug?.trim() || String(produto.id_produto);

                  return (
                    <article
                      className="categoria-product-card"
                      key={produto.id_produto}
                    >
                      <div className="categoria-product-card__media-wrap">
                        <Link
                          href={`/produto/${encodeURIComponent(slug)}`}
                          className="categoria-product-card__media"
                          aria-label={`Ver detalhes de ${produto.nome}`}
                        >
                          {imagem && !imagemFalhou ? (
                            <img
                              src={imagem}
                              alt={produto.nome}
                              loading="lazy"
                              decoding="async"
                              onError={() =>
                                marcarImagemComErro(produto.id_produto)
                              }
                            />
                          ) : (
                            <div className="categoria-product-card__placeholder">
                              <Package size={38} strokeWidth={1.2} />
                              <span>UNIVERSO IMPÉRIO</span>
                            </div>
                          )}
                          <div className="categoria-product-card__badges">
                            {promocao && (
                              <span className="categoria-badge categoria-badge--sale">
                                -{desconto}%
                              </span>
                            )}
                            {destaque && (
                              <span className="categoria-badge categoria-badge--featured">
                                <Star size={10} fill="currentColor" /> Destaque
                              </span>
                            )}
                          </div>
                          <span className="categoria-product-card__quick-view">
                            Ver produto <ArrowRight size={14} />
                          </span>
                        </Link>
                      </div>

                      <div className="categoria-product-card__body">
                        {produto.sku && (
                          <span className="categoria-product-card__sku">
                            REF. {produto.sku}
                          </span>
                        )}
                        <Link
                          href={`/produto/${encodeURIComponent(slug)}`}
                          className="categoria-product-card__title-link"
                        >
                          <h3>{produto.nome}</h3>
                        </Link>
                        {produto.descricao_curta && (
                          <p className="categoria-product-card__description">
                            {produto.descricao_curta}
                          </p>
                        )}

                        <div className="categoria-product-card__purchase">
                          <div className="categoria-product-card__price">
                            {promocao && (
                              <del>{formatarPreco(produto.preco)}</del>
                            )}
                            <strong>
                              {formatarPreco(precoAtual(produto))}
                            </strong>
                            {promocao && (
                              <small>
                                Economize{" "}
                                {formatarPreco(
                                  numeroPreco(produto.preco) -
                                    precoAtual(produto),
                                )}
                              </small>
                            )}
                          </div>
                          <button
                            type="button"
                            className="categoria-add-cart"
                            onClick={() => void adicionarAoCarrinho(produto)}
                            disabled={adicionandoId !== null}
                            aria-label={`Adicionar ${produto.nome} ao carrinho`}
                          >
                            {adicionando ? (
                              <LoaderCircle size={16} className="is-spinning" />
                            ) : (
                              <ShoppingBag size={16} />
                            )}
                            <span>
                              {adicionando ? "Adicionando" : "Adicionar"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="categoria-load-more">
                <div className="categoria-load-more__meta">
                  <span>
                    Mostrando <strong>{produtosExibidos.length}</strong> de{" "}
                    <strong>{produtosFiltrados.length}</strong> produtos
                  </span>
                  <div className="categoria-load-more__track">
                    <span
                      style={{
                        width: `${produtosFiltrados.length ? (produtosExibidos.length / produtosFiltrados.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                {restantes > 0 ? (
                  <button
                    type="button"
                    className="categoria-load-more__button"
                    onClick={() =>
                      setQuantidadeVisivel((atual) =>
                        Math.min(
                          atual + TAMANHO_LOTE,
                          produtosFiltrados.length,
                        ),
                      )
                    }
                  >
                    Ver mais produtos{" "}
                    <span>+{Math.min(TAMANHO_LOTE, restantes)}</span>{" "}
                    <ArrowRight size={16} />
                  </button>
                ) : produtosFiltrados.length > LOTE_INICIAL ? (
                  <button
                    type="button"
                    className="categoria-load-more__button categoria-load-more__button--quiet"
                    onClick={() => {
                      setQuantidadeVisivel(LOTE_INICIAL);
                      document
                        .querySelector(".categoria-results")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                  >
                    Mostrar menos <ChevronDown size={15} />
                  </button>
                ) : null}
              </div>
            </>
          )}

          {!carregando && !erro && produtosFiltrados.length === 0 && (
            <div className="categoria-state categoria-state--empty">
              <span className="categoria-state__icon">
                <PackageOpen size={31} />
              </span>
              <span className="categoria-state__eyebrow">
                {produtos.length === 0
                  ? "NOVIDADES EM BREVE"
                  : "AJUSTE SUA BUSCA"}
              </span>
              <h2>
                {produtos.length === 0
                  ? "Esta coleção está sendo preparada."
                  : "Nenhum produto encontrado."}
              </h2>
              <p>
                {produtos.length === 0
                  ? `Ainda não há produtos publicados em ${nomeCategoria}. Explore outras coleções da loja.`
                  : "Tente outro termo ou remova alguns filtros para ver mais opções."}
              </p>
              <div className="categoria-state__actions">
                {possuiFiltros && (
                  <button
                    type="button"
                    className="categoria-outline-button"
                    onClick={limparFiltros}
                  >
                    Limpar filtros <X size={14} />
                  </button>
                )}
                <Link href="/#categorias" className="categoria-primary-button">
                  Explorar categorias <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          )}
        </section>

        {!carregando && !erro && outrasCategorias.length > 0 && (
          <section className="categoria-related">
            <div className="categoria-related__heading">
              <div>
                <span>MAIS PARA DESCOBRIR</span>
                <h2>Continue explorando</h2>
              </div>
              <Link href="/#categorias">
                Todas as categorias <ArrowRight size={14} />
              </Link>
            </div>
            <div className="categoria-related__list">
              {outrasCategorias.map((item) => (
                <Link
                  href={`/produto/categoria/${item.id_categoria}`}
                  key={item.id_categoria}
                  className="categoria-related-link"
                >
                  <span>{item.nome.charAt(0).toLocaleUpperCase("pt-BR")}</span>
                  <strong>{item.nome}</strong>
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
