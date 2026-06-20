"use client";

import { use, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import api from "@/Api/conectar";

import { imagemFundo } from "@/components/Bibioteca/imagem";

import {
  FiShoppingCart,
  FiEye,
  FiChevronRight,
  FiFilter,
  FiHeart,
} from "react-icons/fi";

import "../../../../components/styles/vitrine.css";
import { rotas } from "@/components/Bibioteca/config/rotas";

type Produto = {
  id_produto: number;
  nome: string;
  slug?: string;
  descricao?: string;
  descricao_curta?: string;
  imagem?: string;
  miniatura?: string;
  banner?: string;
  foto?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  marca?: string;
  status_id?: number;
  statusid?: number;
  estoque?: number;
  quantidade?: number;
};

type Item = {
  id_vitrine_item?: number;
  vitrine_id?: number;
  produto_id?: number;
  titulo_personalizado?: string;
  subtitulo_personalizado?: string;
  imagem_personalizada?: string;
  ordem?: number;
  status_id?: number;
  statusid?: number;
};

type Vitrine = {
  id_vitrine: number;
  nome?: string;
  titulo?: string;
  subtitulo?: string;
  descricao?: string;
  slug?: string;
  tipo?: string;
  status_id?: number;
  statusid?: number;
  ordem?: number;
};

type VitrinePageProps = {
  params: Promise<{ slug: string }>;
};

function pegarDados<T>(res: any): T {
  return (
    res?.data?.dados?.dados ??
    res?.data?.dados?.lista ??
    res?.data?.dados?.itens ??
    res?.data?.dados ??
    res?.data ??
    null
  ) as T;
}

function formatarPreco(valor?: number | string) {
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarTitulo(slug: string) {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function obterPrecoNumero(produto: Produto) {
  const valor = produto.preco_promocional || produto.preco;
  const numero = Number(valor);
  return Number.isNaN(numero) ? 0 : numero;
}

function produtoAtivo(produto: Produto) {
  const status = produto.status_id ?? produto.statusid;
  return status === undefined || Number(status) === 1;
}

function estoqueProduto(produto: Produto) {
  return Number(produto.estoque ?? produto.quantidade ?? 0);
}

export default function VitrinePage({ params }: VitrinePageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vitrine, setVitrine] = useState<Vitrine | null>(null);
  const [loading, setLoading] = useState(true);
  const [porPagina, setPorPagina] = useState(12);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [ordenacao, setOrdenacao] = useState("relevancia");
  const [adicionando, setAdicionando] = useState<number | null>(null);

  async function adicionarCarrinho(produto: Produto) {
    try {
      setAdicionando(produto.id_produto);

      await api.post(rotas.carrinho.adicionar, {
        produto_id: produto.id_produto,
        quantidade: 1,
      });

      toast.success("Produto adicionado ao carrinho!");
      window.dispatchEvent(new CustomEvent("carrinhoAtualizado"));
    } catch (error: any) {
      console.error("Erro ao adicionar ao carrinho:", error);

      const mensagem =
        error?.response?.data?.erro ||
        error?.response?.data?.mensagem ||
        "Não foi possível adicionar ao carrinho.";

      toast.error(mensagem);

      if (
        String(mensagem).toLowerCase().includes("login") ||
        error?.response?.status === 401
      ) {
        router.push(rotas.paginas.login);
      }
    } finally {
      setAdicionando(null);
    }
  }

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);

        const vitrineRes = await api.get(rotas.vitrines.buscarPorSlug(slug));
        const vitrineData = pegarDados<Vitrine | null>(vitrineRes);

        if (!ativo) return;

        setVitrine(vitrineData);

        if (!vitrineData?.id_vitrine) {
          setProdutos([]);
          return;
        }

        const itensRes = await api.get(rotas.vitrines.itens(vitrineData.id_vitrine));
        const itensData = pegarDados<Item[]>(itensRes);
        const itens = Array.isArray(itensData) ? itensData : [];

        const itensAtivos = itens
          .filter((item) => Number(item.status_id ?? item.statusid ?? 1) === 1)
          .sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0));

        const lista = await Promise.all(
          itensAtivos.map(async (item) => {
            if (!item.produto_id) return null;

            try {
              const res = await api.get(rotas.produtos.buscar(item.produto_id));
              const produto = pegarDados<Produto | null>(res);

              if (!produto || !produtoAtivo(produto)) return null;

              return {
                ...produto,
                nome: item.titulo_personalizado || produto.nome,
                descricao:
                  item.subtitulo_personalizado ||
                  produto.descricao_curta ||
                  produto.descricao ||
                  "",
                imagem:
                  item.imagem_personalizada ||
                  produto.imagem ||
                  produto.miniatura ||
                  produto.banner ||
                  produto.foto ||
                  "",
              };
            } catch {
              return null;
            }
          })
        );

        if (!ativo) return;
        setProdutos(lista.filter(Boolean) as Produto[]);
      } catch (error) {
        console.error("Erro ao carregar vitrine:", error);
        if (!ativo) return;
        setProdutos([]);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [slug]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [porPagina, ordenacao]);

  const produtosOrdenados = useMemo(() => {
    const lista = [...produtos];

    switch (ordenacao) {
      case "menor-preco":
        return lista.sort((a, b) => obterPrecoNumero(a) - obterPrecoNumero(b));
      case "maior-preco":
        return lista.sort((a, b) => obterPrecoNumero(b) - obterPrecoNumero(a));
      case "nome-az":
        return lista.sort((a, b) => a.nome.localeCompare(b.nome));
      case "nome-za":
        return lista.sort((a, b) => b.nome.localeCompare(a.nome));
      default:
        return lista;
    }
  }, [produtos, ordenacao]);

  const totalProdutos = produtosOrdenados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalProdutos / porPagina));

  const produtosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * porPagina;
    return produtosOrdenados.slice(inicio, inicio + porPagina);
  }, [produtosOrdenados, paginaAtual, porPagina]);

  const titulo = vitrine?.titulo || vitrine?.nome || formatarTitulo(slug);
  const subtitulo =
    vitrine?.subtitulo ||
    "Produtos selecionados com carinho para você encontrar opções especiais.";

  return (
    <main className="vitrinePage">
      <section className="vitrineHero">
        <div className="vitrineContainer">
          <nav className="vitrineBreadcrumb">
            <Link href="/">Início</Link>
            <FiChevronRight />
            <Link href="/vitrine">Vitrines</Link>
            <FiChevronRight />
            <span>{titulo}</span>
          </nav>

          <div className="vitrineHeroContent">
            <span className="vitrineBadge">
              <FiHeart />
              Coleção Especial
            </span>

            <h1>{titulo}</h1>
            <p>{subtitulo}</p>
          </div>
        </div>
      </section>

      <section className="vitrineCatalogo">
        <div className="vitrineContainer">
          {loading ? (
            <div className="vitrineStateBox">
              <div className="vitrineSpinner" />
              <p>Carregando produtos...</p>
            </div>
          ) : produtos.length === 0 ? (
            <div className="vitrineStateBox">
              <h2>Nenhum produto encontrado</h2>
              <p>Essa vitrine ainda não possui produtos cadastrados.</p>
            </div>
          ) : (
            <>
              <div className="vitrineTopbar">
                <div>
                  <strong>{totalProdutos}</strong>
                  <span> produtos encontrados</span>
                </div>

                <div className="vitrineControls">
                  <label>
                    <FiFilter />
                    <select
                      value={ordenacao}
                      onChange={(e) => setOrdenacao(e.target.value)}
                    >
                      <option value="relevancia">Relevância</option>
                      <option value="menor-preco">Menor preço</option>
                      <option value="maior-preco">Maior preço</option>
                      <option value="nome-az">Nome A-Z</option>
                      <option value="nome-za">Nome Z-A</option>
                    </select>
                  </label>

                  <label>
                    <select
                      value={porPagina}
                      onChange={(e) => setPorPagina(Number(e.target.value))}
                    >
                      <option value={8}>8 por página</option>
                      <option value={12}>12 por página</option>
                      <option value={16}>16 por página</option>
                      <option value={24}>24 por página</option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="vitrineGrid">
                {produtosPaginados.map((produto, index) => {
                  const precoFinal = formatarPreco(
                    produto.preco_promocional || produto.preco
                  );

                  const precoOriginal =
                    produto.preco_promocional && produto.preco
                      ? formatarPreco(produto.preco)
                      : null;

                  const produtoHref = `/produto/${produto.slug || produto.id_produto}`;
                  const imagemProduto = imagemFundo(produto.imagem);
                  const estoque = estoqueProduto(produto);
                  const indisponivel = estoque <= 0;
                  const carregandoBotao = adicionando === produto.id_produto;

                  return (
                    <article key={produto.id_produto} className="vitrineCard">
                      <Link href={produtoHref} className="vitrineImageBox">
                        {imagemProduto ? (
                          <Image
                            src={imagemProduto}
                            alt={produto.nome || "Produto"}
                            fill
                            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw"
                            className="vitrineProductImage"
                            priority={index < 2}
                          />
                        ) : (
                          <div className="vitrineNoImage">Sem imagem</div>
                        )}

                        {produto.marca && (
                          <span className="vitrineTag">{produto.marca}</span>
                        )}

                        {indisponivel && (
                          <span className="vitrineSoldOut">Indisponível</span>
                        )}
                      </Link>

                      <div className="vitrineCardBody">
                        <Link href={produtoHref} className="vitrineTitleLink">
                          <h3>{produto.nome}</h3>
                        </Link>

                        <p>{produto.descricao || "Produto disponível nesta vitrine."}</p>

                        <div className="vitrinePriceArea">
                          {precoOriginal && <span>{precoOriginal}</span>}
                          {precoFinal && <strong>{precoFinal}</strong>}
                        </div>

                        <div className="vitrineActions">
                          <button
                            type="button"
                            onClick={() => adicionarCarrinho(produto)}
                            disabled={indisponivel || carregandoBotao}
                          >
                            <FiShoppingCart />
                            {indisponivel
                              ? "Esgotado"
                              : carregandoBotao
                              ? "Adicionando..."
                              : "Adicionar"}
                          </button>

                          <Link href={produtoHref}>
                            <FiEye />
                            Ver
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {totalPaginas > 1 && (
                <div className="vitrinePagination">
                  <button
                    type="button"
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                  >
                    Anterior
                  </button>

                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                    (pagina) => (
                      <button
                        type="button"
                        key={pagina}
                        onClick={() => setPaginaAtual(pagina)}
                        className={paginaAtual === pagina ? "active" : ""}
                      >
                        {pagina}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                    }
                    disabled={paginaAtual === totalPaginas}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}