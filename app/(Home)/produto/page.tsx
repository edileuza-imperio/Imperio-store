"use client";

import {
  BadgePercent,
  Check,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  Minus,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import ROTAS from "@/app/constants/rotas";
import CarrinhoService from "@/Services/Carrinho/CarrinhoService";
import conexao from "@/Services/Conexao/Conexao";
import ImagemService from "@/Services/Imagem/ImagemService";



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
  sku?: string | null;
  nome: string;
  slug?: string | null;
  descricao?: string | null;
  descricao_curta?: string | null;
  preco: string | number;
  preco_promocional?: string | number | null;
  destaque?: boolean | number | string;
  ativo?: boolean | number | string;
  criado_em?: string | null;
  imagem_url?: string | null;
  imagem?: string | null;
  miniatura?: string | null;
  imagem_principal?: string | ProdutoImagem | null;
  imagens?: ProdutoImagem[] | null;
  controlar_estoque?: boolean | number | string;
  permitir_venda_sem_estoque?: boolean | number | string;
  estoque?: number | string | null;
  estoque_atual?: number | string | null;
  quantidade_estoque?: number | string | null;
}

interface RespostaProdutos {
  sucesso: boolean;
  mensagem?: string;
  dados?: {
    produtos?: Produto[];
    total?: number;
  } | null;
}

type Filtro = "todos" | "ofertas" | "destaques";
type Ordenacao =
  | "relevancia"
  | "recentes"
  | "menor-preco"
  | "maior-preco"
  | "nome";

const PRODUTOS_POR_CARREGAMENTO = 10;
const CHAVE_CARRINHO = "universo-imperio:carrinho:v1";
const EVENTO_CARRINHO = "universo-imperio:carrinho:atualizado";

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function normalizarResposta(valor: unknown): RespostaProdutos {
  let atual: unknown = valor;

  for (let tentativa = 0; tentativa < 6; tentativa += 1) {
    if (!ehObjeto(atual)) break;
    if ("sucesso" in atual) return atual as unknown as RespostaProdutos;
    if ("data" in atual && atual.data !== undefined) {
      atual = atual.data;
      continue;
    }
    if ("dados" in atual && atual.dados !== undefined) {
      atual = atual.dados;
      continue;
    }
    break;
  }

  throw new Error(
    "A resposta da API de produtos não está no formato esperado.",
  );
}

function verdadeiro(valor: unknown): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;
  return ["1", "true", "sim", "ativo"].includes(
    String(valor ?? "")
      .trim()
      .toLowerCase(),
  );
}

function numero(valor: string | number | null | undefined): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  const texto = String(valor ?? "0").trim();
  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  const resultado = Number(normalizado);
  return Number.isFinite(resultado) ? resultado : 0;
}

function moeda(valor: string | number | null | undefined): string {
  return numero(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function temOferta(produto: Produto): boolean {
  const preco = numero(produto.preco);
  const promocional = numero(produto.preco_promocional);
  return preco > 0 && promocional > 0 && promocional < preco;
}

function precoAtual(produto: Produto): number {
  return temOferta(produto)
    ? numero(produto.preco_promocional)
    : numero(produto.preco);
}

function percentualDesconto(produto: Produto): number {
  if (!temOferta(produto)) return 0;
  return Math.round(
    (1 - numero(produto.preco_promocional) / numero(produto.preco)) * 100,
  );
}

function mensagemErro(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Não foi possível adicionar este produto. Tente novamente.";
}

function imagemDoProduto(produto: Produto): string | null {
  const principal = produto.imagem_principal;
  const objetoPrincipal =
    typeof principal === "object" && principal !== null ? principal : null;

  const imagens = Array.isArray(produto.imagens)
    ? [...produto.imagens].sort((a, b) => {
        const prioridadeA = verdadeiro(a.principal) ? 0 : 1;
        const prioridadeB = verdadeiro(b.principal) ? 0 : 1;
        return (
          prioridadeA - prioridadeB ||
          Number(a.ordem ?? 0) - Number(b.ordem ?? 0)
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
    if (typeof candidato !== "string" || !candidato.trim()) continue;
    try {
      return ImagemService.produto(candidato.trim());
    } catch (error) {
      console.warn("[CATÁLOGO] Não foi possível resolver a imagem:", error);
    }
  }
  return null;
}

function produtoDisponivel(produto: Produto): boolean {
  if (produto.ativo !== undefined && !verdadeiro(produto.ativo)) return false;
  const controlaEstoque = verdadeiro(produto.controlar_estoque);
  const estoqueInformado =
    produto.estoque ?? produto.estoque_atual ?? produto.quantidade_estoque;
  if (
    controlaEstoque &&
    estoqueInformado !== null &&
    estoqueInformado !== undefined &&
    numero(estoqueInformado) <= 0 &&
    !verdadeiro(produto.permitir_venda_sem_estoque)
  ) {
    return false;
  }
  return true;
}

function sincronizarCarrinhoLocal(
  produtoAtual: Produto,
  resumo: Awaited<ReturnType<typeof CarrinhoService.adicionar>>,
): void {
  try {
    let metadadosAnteriores: Array<Record<string, unknown>> = [];
    try {
      const salvos = window.localStorage.getItem(CHAVE_CARRINHO);
      const interpretados: unknown = salvos ? JSON.parse(salvos) : [];
      if (Array.isArray(interpretados)) {
        metadadosAnteriores = interpretados.filter(ehObjeto);
      }
    } catch {
      metadadosAnteriores = [];
    }

    const anterioresPorProduto = new Map(
      metadadosAnteriores.map((item) => [
        Number(item.produto_id ?? item.id),
        item,
      ]),
    );

    const itens = (Array.isArray(resumo.itens) ? resumo.itens : []).map(
      (item) => {
        const produtoId = Number(item.produto_id);
        const anterior = anterioresPorProduto.get(produtoId) ?? {};
        const ehProdutoAtual = produtoId === produtoAtual.id_produto;
        return {
          id: String(item.produto_id ?? item.id_item),
          produto_id: item.produto_id,
          slug:
            item.slug ??
            String(
              anterior.slug ??
                (ehProdutoAtual ? (produtoAtual.slug ?? "") : ""),
            ),
          nome:
            item.nome ??
            String(
              anterior.nome ?? (ehProdutoAtual ? produtoAtual.nome : "Produto"),
            ),
          sku:
            item.sku ??
            String(
              anterior.sku ?? (ehProdutoAtual ? (produtoAtual.sku ?? "") : ""),
            ),
          imagem:
            item.imagem ??
            (anterior.imagem as string | null | undefined) ??
            (ehProdutoAtual ? imagemDoProduto(produtoAtual) : null),
          preco: numero(
            item.preco_unitario ??
              (anterior.preco as number | string | undefined) ??
              (ehProdutoAtual ? precoAtual(produtoAtual) : 0),
          ),
          quantidade: item.quantidade,
        };
      },
    );

    window.localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
    window.dispatchEvent(
      new CustomEvent(EVENTO_CARRINHO, { detail: { itens } }),
    );
  } catch (error) {
    console.warn(
      "[CATÁLOGO] Não foi possível sincronizar a interface do carrinho:",
      error,
    );
  }
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("relevancia");
  const [limiteVisivel, setLimiteVisivel] = useState(PRODUTOS_POR_CARREGAMENTO);
  const [imagensComErro, setImagensComErro] = useState<number[]>([]);
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});
  const [adicionandoId, setAdicionandoId] = useState<number | null>(null);
  const [ultimoAdicionadoId, setUltimoAdicionadoId] = useState<number | null>(
    null,
  );

  const carregarProdutos = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await conexao.get<unknown>(ROTAS.PRODUTOS.LISTAR);
      const payload = normalizarResposta(resposta.data);
      if (!payload.sucesso) {
        throw new Error(
          payload.mensagem || "Não foi possível carregar os produtos.",
        );
      }
      const lista = Array.isArray(payload.dados?.produtos)
        ? payload.dados.produtos.filter(
            (produto) => Number(produto.id_produto) > 0,
          )
        : [];
      setProdutos(lista);
      setImagensComErro([]);
      setLimiteVisivel(PRODUTOS_POR_CARREGAMENTO);
    } catch (error) {
      console.error("[PRODUTOS] Erro ao carregar catálogo:", error);
      const mensagem =
        error instanceof Error
          ? error.message
          : "Ocorreu um erro ao consultar os produtos.";
      setProdutos([]);
      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarProdutos();
  }, [carregarProdutos]);

  useEffect(() => {
    setLimiteVisivel(PRODUTOS_POR_CARREGAMENTO);
  }, [busca, filtro, ordenacao]);

  useEffect(() => {
    if (ultimoAdicionadoId === null) return;
    const timeout = window.setTimeout(() => setUltimoAdicionadoId(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [ultimoAdicionadoId]);

  const adicionarAoCarrinho = useCallback(
    async (produto: Produto) => {
      if (adicionandoId !== null) return;
      const quantidade = Math.max(
        1,
        Math.min(9999, Math.trunc(quantidades[produto.id_produto] ?? 1)),
      );
      const preco = precoAtual(produto);

      if (!Number.isInteger(produto.id_produto) || produto.id_produto <= 0) {
        toast.error("Não foi possível identificar este produto.");
        return;
      }
      if (!Number.isFinite(preco) || preco < 0) {
        toast.error("O preço deste produto é inválido.");
        return;
      }
      if (!produtoDisponivel(produto)) {
        toast.error("Este produto está indisponível no momento.");
        return;
      }

      setAdicionandoId(produto.id_produto);
      setUltimoAdicionadoId(null);
      try {
        const resumo = await CarrinhoService.adicionar({
          produto_id: produto.id_produto,
          variacao_id: null,
          quantidade,
          preco_unitario: preco,
        });
        sincronizarCarrinhoLocal(produto, resumo);
        setQuantidades((atuais) => ({ ...atuais, [produto.id_produto]: 1 }));
        setUltimoAdicionadoId(produto.id_produto);
        toast.success(
          `${quantidade} ${quantidade === 1 ? "unidade" : "unidades"} de ${produto.nome} adicionada${quantidade === 1 ? "" : "s"} ao carrinho.`,
        );
      } catch (error) {
        console.error("[CATÁLOGO][CARRINHO] Falha ao adicionar:", error);
        toast.error(mensagemErro(error));
      } finally {
        setAdicionandoId(null);
      }
    },
    [adicionandoId, quantidades],
  );

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    const lista = produtos.filter((produto) => {
      const corresponde =
        !termo ||
        [
          produto.nome,
          produto.sku,
          produto.descricao_curta,
          produto.descricao,
        ].some((campo) =>
          String(campo ?? "")
            .toLocaleLowerCase("pt-BR")
            .includes(termo),
        );
      if (!corresponde) return false;
      if (filtro === "ofertas" && !temOferta(produto)) return false;
      if (filtro === "destaques" && !verdadeiro(produto.destaque)) return false;
      return true;
    });

    switch (ordenacao) {
      case "menor-preco":
        lista.sort((a, b) => precoAtual(a) - precoAtual(b));
        break;
      case "maior-preco":
        lista.sort((a, b) => precoAtual(b) - precoAtual(a));
        break;
      case "nome":
        lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
        break;
      case "recentes":
        lista.sort(
          (a, b) =>
            new Date(b.criado_em ?? 0).getTime() -
            new Date(a.criado_em ?? 0).getTime(),
        );
        break;
      default:
        lista.sort(
          (a, b) =>
            Number(verdadeiro(b.destaque)) - Number(verdadeiro(a.destaque)),
        );
    }
    return lista;
  }, [produtos, busca, filtro, ordenacao]);

  const exibidos = produtosFiltrados.slice(0, limiteVisivel);
  const restantes = Math.max(0, produtosFiltrados.length - exibidos.length);
  const totalOfertas = produtos.filter(temOferta).length;
  const totalDestaques = produtos.filter((produto) =>
    verdadeiro(produto.destaque),
  ).length;

  function alterarQuantidade(produtoId: number, valor: number) {
    const quantidade = Math.max(1, Math.min(9999, Math.trunc(valor) || 1));
    setQuantidades((atuais) => ({ ...atuais, [produtoId]: quantidade }));
  }

  function limparFiltros() {
    setBusca("");
    setFiltro("todos");
    setOrdenacao("relevancia");
    setLimiteVisivel(PRODUTOS_POR_CARREGAMENTO);
  }

  return (
    <main className="ui-catalogo">
      <div className="ui-catalogo__container">
        <section className="ui-catalogo__hero">
          <div className="ui-catalogo__hero-copy">
            <span className="ui-catalogo__eyebrow">
              <Sparkles size={14} /> UNIVERSO IMPÉRIO · CURADORIA ESPECIAL
            </span>
            <h1>
              Encontre algo <em>especial.</em>
            </h1>
            <p>
              Presentes, decoração e detalhes escolhidos para transformar
              momentos em lembranças.
            </p>
            <div className="ui-catalogo__hero-note">
              <span className="ui-catalogo__hero-dot" /> Novidades e peças
              selecionadas para você
            </div>
          </div>
          <div className="ui-catalogo__hero-art" aria-hidden="true">
            <span className="ui-catalogo__art-ring ui-catalogo__art-ring--one" />
            <span className="ui-catalogo__art-ring ui-catalogo__art-ring--two" />
            <span className="ui-catalogo__art-monogram">
              U<span>I</span>
            </span>
            <span className="ui-catalogo__art-caption">
              UNIVERSO
              <br />
              IMPÉRIO
            </span>
          </div>
        </section>

        <section
          className="ui-catalogo__intro-row"
          aria-label="Resumo do catálogo"
        >
          <div>
            <span className="ui-catalogo__section-kicker">NOSSA LOJA</span>
            <h2>Explore nossa coleção</h2>
            <p>
              Descubra produtos que combinam beleza, cuidado e personalidade.
            </p>
          </div>
          {!carregando && !erro && (
            <div className="ui-catalogo__total">
              <strong>
                {produtosFiltrados.length.toString().padStart(2, "0")}
              </strong>
              <span>
                produtos
                <br />
                encontrados
              </span>
            </div>
          )}
        </section>

        <section
          className="ui-catalogo__toolbar"
          aria-label="Pesquisa e filtros"
        >
          <div
            className="ui-catalogo__filters"
            role="group"
            aria-label="Filtrar produtos"
          >
            <button
              type="button"
              className={`ui-catalogo__filter ${filtro === "todos" ? "is-active" : ""}`}
              onClick={() => setFiltro("todos")}
            >
              Todos <span>{produtos.length}</span>
            </button>
            <button
              type="button"
              className={`ui-catalogo__filter ${filtro === "ofertas" ? "is-active" : ""}`}
              onClick={() => setFiltro("ofertas")}
            >
              <BadgePercent size={14} /> Ofertas <span>{totalOfertas}</span>
            </button>
            <button
              type="button"
              className={`ui-catalogo__filter ${filtro === "destaques" ? "is-active" : ""}`}
              onClick={() => setFiltro("destaques")}
            >
              <Star size={13} /> Destaques <span>{totalDestaques}</span>
            </button>
          </div>
          <div className="ui-catalogo__controls">
            <label className="ui-catalogo__search">
              <Search size={17} />
              <input
                type="search"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por produto ou código..."
                aria-label="Buscar produtos"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca("")}
                  aria-label="Limpar busca"
                >
                  <X size={15} />
                </button>
              )}
            </label>
            <label className="ui-catalogo__sort">
              <SlidersHorizontal size={15} />
              <select
                value={ordenacao}
                onChange={(event) =>
                  setOrdenacao(event.target.value as Ordenacao)
                }
                aria-label="Ordenar produtos"
              >
                <option value="relevancia">Relevância</option>
                <option value="recentes">Mais recentes</option>
                <option value="menor-preco">Menor preço</option>
                <option value="maior-preco">Maior preço</option>
                <option value="nome">Nome A–Z</option>
              </select>
              <ChevronDown size={14} />
            </label>
            <button
              type="button"
              className="ui-catalogo__refresh"
              onClick={() => void carregarProdutos()}
              disabled={carregando}
              aria-label="Atualizar catálogo"
            >
              <RefreshCw
                size={15}
                className={carregando ? "is-spinning" : ""}
              />
              <span>Atualizar</span>
            </button>
          </div>
        </section>

        {!carregando && !erro && (
          <div className="ui-catalogo__result-line">
            <span>
              {produtosFiltrados.length === 1
                ? "1 produto disponível"
                : `${produtosFiltrados.length} produtos disponíveis`}
            </span>
            {(busca || filtro !== "todos" || ordenacao !== "relevancia") && (
              <button type="button" onClick={limparFiltros}>
                Limpar filtros <X size={13} />
              </button>
            )}
          </div>
        )}

        {carregando && (
          <div className="ui-catalogo__state">
            <LoaderCircle size={34} className="is-spinning" />
            <h3>Preparando nossa coleção</h3>
            <p>Estamos buscando os produtos disponíveis para você.</p>
          </div>
        )}

        {!carregando && erro && (
          <div className="ui-catalogo__state ui-catalogo__state--error">
            <span className="ui-catalogo__state-icon">
              <Package size={28} />
            </span>
            <h3>Não foi possível carregar os produtos</h3>
            <p>{erro}</p>
            <button type="button" onClick={() => void carregarProdutos()}>
              <RefreshCw size={15} /> Tentar novamente
            </button>
          </div>
        )}

        {!carregando && !erro && produtosFiltrados.length > 0 && (
          <>
            <section
              className="ui-catalogo__grid"
              aria-label="Produtos disponíveis"
            >
              {exibidos.map((produto, index) => {
                const imagem = imagemDoProduto(produto);
                const imagemFalhou = imagensComErro.includes(
                  produto.id_produto,
                );
                const oferta = temOferta(produto);
                const destaque = verdadeiro(produto.destaque);
                const quantidade = quantidades[produto.id_produto] ?? 1;
                const adicionando = adicionandoId === produto.id_produto;
                const adicionado = ultimoAdicionadoId === produto.id_produto;
                const disponivel = produtoDisponivel(produto);
                const hrefProduto = produto.slug
                  ? `/produto/${encodeURIComponent(produto.slug)}`
                  : null;

                return (
                  <article
                    className="ui-produto-card"
                    key={produto.id_produto}
                    style={{
                      animationDelay: `${Math.min(index % PRODUTOS_POR_CARREGAMENTO, 9) * 35}ms`,
                    }}
                  >
                    <div className="ui-produto-card__media">
                      {hrefProduto ? (
                        <Link
                          href={hrefProduto}
                          className="ui-produto-card__image-link"
                          aria-label={`Ver detalhes de ${produto.nome}`}
                        >
                          {imagem && !imagemFalhou ? (
                            <img
                              src={imagem}
                              alt={produto.nome}
                              className="ui-produto-card__image"
                              loading="lazy"
                              decoding="async"
                              onError={() =>
                                setImagensComErro((atuais) =>
                                  atuais.includes(produto.id_produto)
                                    ? atuais
                                    : [...atuais, produto.id_produto],
                                )
                              }
                            />
                          ) : (
                            <div className="ui-produto-card__placeholder">
                              <Package size={34} />
                              <span>UNIVERSO IMPÉRIO</span>
                            </div>
                          )}
                        </Link>
                      ) : (
                        <div className="ui-produto-card__image-link">
                          {imagem && !imagemFalhou ? (
                            <img
                              src={imagem}
                              alt={produto.nome}
                              className="ui-produto-card__image"
                              loading="lazy"
                              decoding="async"
                              onError={() =>
                                setImagensComErro((atuais) =>
                                  atuais.includes(produto.id_produto)
                                    ? atuais
                                    : [...atuais, produto.id_produto],
                                )
                              }
                            />
                          ) : (
                            <div className="ui-produto-card__placeholder">
                              <Package size={34} />
                              <span>UNIVERSO IMPÉRIO</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div className="ui-produto-card__badges">
                        {oferta && (
                          <span className="ui-produto-card__badge ui-produto-card__badge--sale">
                            -{percentualDesconto(produto)}% OFF
                          </span>
                        )}
                        {destaque && (
                          <span className="ui-produto-card__badge ui-produto-card__badge--featured">
                            <Star size={11} fill="currentColor" /> Destaque
                          </span>
                        )}
                      </div>
                      {hrefProduto && (
                        <Link
                          href={hrefProduto}
                          className="ui-produto-card__quick-view"
                        >
                          Ver detalhes <ChevronRight size={14} />
                        </Link>
                      )}
                    </div>

                    <div className="ui-produto-card__body">
                      <div className="ui-produto-card__meta">
                        <span>
                          {produto.sku
                            ? `REF. ${produto.sku}`
                            : "COLEÇÃO UNIVERSO IMPÉRIO"}
                        </span>
                        {!disponivel && (
                          <span className="ui-produto-card__unavailable">
                            Indisponível
                          </span>
                        )}
                      </div>
                      <h3 className="ui-produto-card__title">
                        {hrefProduto ? (
                          <Link href={hrefProduto}>{produto.nome}</Link>
                        ) : (
                          produto.nome
                        )}
                      </h3>
                      {produto.descricao_curta && (
                        <p className="ui-produto-card__description">
                          {produto.descricao_curta}
                        </p>
                      )}

                      <div className="ui-produto-card__price-area">
                        {oferta && (
                          <span className="ui-produto-card__old-price">
                            De {moeda(produto.preco)}
                          </span>
                        )}
                        <strong className="ui-produto-card__price">
                          {moeda(precoAtual(produto))}
                        </strong>
                        {oferta && (
                          <span className="ui-produto-card__saving">
                            Você economiza{" "}
                            {moeda(numero(produto.preco) - precoAtual(produto))}
                          </span>
                        )}
                      </div>

                      <div className="ui-produto-card__actions">
                        <div
                          className="ui-quantity"
                          aria-label={`Quantidade de ${produto.nome}`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              alterarQuantidade(
                                produto.id_produto,
                                quantidade - 1,
                              )
                            }
                            disabled={quantidade <= 1 || adicionando}
                            aria-label="Diminuir quantidade"
                          >
                            <Minus size={13} />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={9999}
                            value={quantidade}
                            disabled={adicionando}
                            onChange={(event) =>
                              alterarQuantidade(
                                produto.id_produto,
                                Number(event.target.value),
                              )
                            }
                            aria-label="Quantidade"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              alterarQuantidade(
                                produto.id_produto,
                                quantidade + 1,
                              )
                            }
                            disabled={quantidade >= 9999 || adicionando}
                            aria-label="Aumentar quantidade"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <button
                          type="button"
                          className={`ui-produto-card__add ${adicionado ? "is-added" : ""}`}
                          onClick={() => void adicionarAoCarrinho(produto)}
                          disabled={!disponivel || adicionandoId !== null}
                        >
                          {adicionando ? (
                            <LoaderCircle size={16} className="is-spinning" />
                          ) : adicionado ? (
                            <Check size={16} />
                          ) : (
                            <ShoppingBag size={16} />
                          )}
                          <span>
                            {adicionando
                              ? "Adicionando"
                              : adicionado
                                ? "Adicionado"
                                : disponivel
                                  ? "Adicionar"
                                  : "Indisponível"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <div className="ui-catalogo__load-more">
              <p>
                Mostrando <strong>{exibidos.length}</strong> de{" "}
                <strong>{produtosFiltrados.length}</strong> produtos
              </p>
              {restantes > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    setLimiteVisivel((atual) =>
                      Math.min(
                        atual + PRODUTOS_POR_CARREGAMENTO,
                        produtosFiltrados.length,
                      ),
                    )
                  }
                >
                  Ver mais produtos{" "}
                  <span>+{Math.min(restantes, PRODUTOS_POR_CARREGAMENTO)}</span>{" "}
                  <ChevronDown size={16} />
                </button>
              ) : produtosFiltrados.length > PRODUTOS_POR_CARREGAMENTO ? (
                <button
                  type="button"
                  className="ui-catalogo__show-less"
                  onClick={() => {
                    setLimiteVisivel(PRODUTOS_POR_CARREGAMENTO);
                    document
                      .querySelector(".ui-catalogo__intro-row")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  Mostrar menos <ChevronDown size={15} />
                </button>
              ) : null}
            </div>
          </>
        )}

        {!carregando && !erro && produtosFiltrados.length === 0 && (
          <div className="ui-catalogo__state ui-catalogo__state--empty">
            <span className="ui-catalogo__state-icon">
              <Search size={27} />
            </span>
            <h3>
              {busca
                ? "Não encontramos esse produto"
                : "Nenhum produto disponível"}
            </h3>
            <p>
              {busca
                ? "Tente buscar por outro nome ou código de produto."
                : "Os produtos ativos cadastrados na loja aparecerão aqui."}
            </p>
            {(busca || filtro !== "todos") && (
              <button type="button" onClick={limparFiltros}>
                Limpar filtros <X size={14} />
              </button>
            )}
          </div>
        )}

        <footer className="ui-catalogo__trust">
          <div>
            <span>
              <ShoppingBag size={17} />
            </span>
            <p>
              <strong>Compra fácil</strong>
              <small>Escolha seus produtos com tranquilidade</small>
            </p>
          </div>
          <div>
            <span>
              <Check size={17} />
            </span>
            <p>
              <strong>Compra segura</strong>
              <small>Processamento protegido pela loja</small>
            </p>
          </div>
          <div>
            <span>
              <Package size={17} />
            </span>
            <p>
              <strong>Entrega</strong>
              <small>Consulte as opções no carrinho</small>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
