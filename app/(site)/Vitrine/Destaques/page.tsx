"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

import {
  FiShoppingCart,
  FiEye,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

import { toast } from "react-toastify";

import {
  EntidadeGenerica,
  ItemResolvido,
  Props,
  Vitrine,
  VitrineItem,
} from "@/components/Bibioteca/Bibiotecas";

function normalizarDados<T = any>(payload: any): T | null {
  return payload?.dados?.dados ?? payload?.dados ?? payload ?? null;
}

function normalizarLista<T = any>(payload: any): T[] {
  const dados = payload?.dados?.dados ?? payload?.dados ?? payload ?? [];
  return Array.isArray(dados) ? dados : [];
}

function resolverImagem(src?: string | null) {
  if (!src) return "";

  const valor = String(src).trim();

  if (
    valor.startsWith("http://") ||
    valor.startsWith("https://") ||
    valor.startsWith("data:image") ||
    valor.startsWith("blob:")
  ) {
    return valor;
  }

  const baseURL =
    typeof api === "string"
      ? api
      : (api as any)?.defaults?.baseURL || "";

  if (!baseURL) return valor;

  if (valor.startsWith("/")) {
    return `${baseURL}${valor}`;
  }

  return `${baseURL}/${valor}`;
}

function obterMelhorImagem(
  item?: VitrineItem | null,
  entidade?: EntidadeGenerica | null
) {
  return resolverImagem(
    item?.imagem_personalizada ||
      entidade?.imagem ||
      entidade?.miniatura ||
      entidade?.banner ||
      entidade?.foto ||
      entidade?.desktop ||
      entidade?.mobile ||
      ""
  );
}

function formatarPreco(valor?: number | string | null) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const numero = Number(valor);

  if (Number.isNaN(numero)) {
    return null;
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function calcularEconomia(
  precoOriginal?: number | string | null,
  precoFinal?: number | string | null
) {
  const original = Number(precoOriginal);
  const final = Number(precoFinal);

  if (
    precoOriginal === null ||
    precoOriginal === undefined ||
    precoFinal === null ||
    precoFinal === undefined ||
    Number.isNaN(original) ||
    Number.isNaN(final) ||
    original <= 0 ||
    final <= 0 ||
    final >= original
  ) {
    return null;
  }

  const percentual = Math.round(((original - final) / original) * 100);

  return `${percentual}% OFF`;
}

function descobrirTipoItem(
  item: VitrineItem,
  tipoVitrine?: string
): ItemResolvido["tipo_item"] {
  if (item.produto_id) return "produto";
  if (item.campanha_id) return "campanha";
  if (item.categoria_id) return "categoria";

  const tipo = String(tipoVitrine || "").toLowerCase();

  if (tipo === "banner") return "banner";

  return "custom";
}

export default function Destaques({
  slug,
  vitrine: vitrineProp,
  tituloPersonalizado,
  subtituloPersonalizado,
  limite,
  className = "",
  verMaisHref,
  verMaisTexto = "Ver tudo",
  onAdicionarCarrinho,
}: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string>("");
  const [vitrine, setVitrine] = useState<Vitrine | null>(vitrineProp || null);
  const [itens, setItens] = useState<ItemResolvido[]>([]);
  const [adicionandoId, setAdicionandoId] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement | null>(null);

  const vitrineComItens = useMemo(() => {
    if (!vitrineProp) return null;

    const lista = Array.isArray(vitrineProp.itens)
      ? vitrineProp.itens
      : [];

    return {
      ...vitrineProp,
      itens: limite ? lista.slice(0, limite) : lista,
    };
  }, [vitrineProp, limite]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        setErro("");

        let vitrineAtual: Vitrine | null = null;

        if (vitrineComItens?.id_vitrine) {
          vitrineAtual = vitrineComItens;
        } else if (slug) {
          const vitrineResponse = await api.get(`/vitrine/slug/${slug}`);

          const vitrineData =
            normalizarDados<Vitrine>(vitrineResponse?.data);

          if (!vitrineData || !vitrineData.id_vitrine) {
            if (!ativo) return;

            setErro("Vitrine não encontrada.");
            setVitrine(null);
            setItens([]);
            return;
          }

          const itensResponse = await api.get(
            `/vitrine/${vitrineData.id_vitrine}/itens`
          );

          let itensData =
            normalizarLista<VitrineItem>(itensResponse?.data);

          if (limite) {
            itensData = itensData.slice(0, limite);
          }

          vitrineAtual = {
            ...vitrineData,
            itens: itensData,
          };
        } else {
          if (!ativo) return;

          setErro("Nenhuma vitrine informada.");
          setItens([]);
          return;
        }

        if (!ativo || !vitrineAtual) return;

        setVitrine(vitrineAtual);

        const listaItens = Array.isArray(vitrineAtual.itens)
          ? vitrineAtual.itens
          : [];

        const itensResolvidos: ItemResolvido[] = await Promise.all(
          listaItens.map(async (item) => {
            const tipoItem = descobrirTipoItem(
              item,
              vitrineAtual?.tipo
            );

            try {
              if (tipoItem === "produto" && item.produto_id) {
                const res = await api.get(`/produto/${item.produto_id}`);

                const produto =
                  normalizarDados<EntidadeGenerica>(res?.data) || {};

                const precoPromocional =
                  produto.preco_promocional !== null &&
                  produto.preco_promocional !== undefined &&
                  produto.preco_promocional !== ""
                    ? produto.preco_promocional
                    : null;

                const precoFinal =
                  precoPromocional || produto.preco || null;

                const precoOriginal = precoPromocional
                  ? produto.preco || null
                  : null;

                return {
                  ...item,
                  entidade: produto,
                  tipo_item: "produto",

                  titulo_final:
                    item.titulo_personalizado ||
                    produto.nome ||
                    produto.titulo ||
                    `Produto #${item.produto_id}`,

                  subtitulo_final:
                    item.subtitulo_personalizado ||
                    produto.subtitulo ||
                    produto.descricao_curta ||
                    "",

                  descricao_final:
                    produto.descricao_curta ||
                    produto.descricao ||
                    "",

                  imagem_final: obterMelhorImagem(item, produto),

                  link_final: produto.slug
                    ? `/produto/${produto.slug}`
                    : `/produto/${item.produto_id}`,

                  preco_final: precoFinal,
                  preco_original: precoOriginal,

                  economia_final: calcularEconomia(
                    precoOriginal,
                    precoFinal
                  ),
                };
              }

              return {
                ...item,
                entidade: null,
                tipo_item: tipoItem,

                titulo_final:
                  item.titulo_personalizado || "Item da vitrine",

                subtitulo_final:
                  item.subtitulo_personalizado || "",

                descricao_final:
                  item.subtitulo_personalizado || "",

                imagem_final: resolverImagem(
                  item.imagem_personalizada || ""
                ),

                link_final: "#",
                preco_final: null,
                preco_original: null,
                economia_final: null,
              };
            } catch {
              return {
                ...item,
                entidade: null,
                tipo_item: tipoItem,

                titulo_final:
                  item.titulo_personalizado || "Item da vitrine",

                subtitulo_final:
                  item.subtitulo_personalizado || "",

                descricao_final:
                  item.subtitulo_personalizado || "",

                imagem_final: resolverImagem(
                  item.imagem_personalizada || ""
                ),

                link_final: "#",
                preco_final: null,
                preco_original: null,
                economia_final: null,
              };
            }
          })
        );

        if (!ativo) return;

        setItens(itensResolvidos);
      } catch (error) {
        console.error(error);

        if (!ativo) return;

        setErro("Erro ao carregar vitrine.");
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [slug, limite, vitrineComItens]);

  function scrollCarousel(direction: "left" | "right") {
    if (!carouselRef.current) return;

    const largura = carouselRef.current.offsetWidth;

    carouselRef.current.scrollBy({
      left: direction === "left" ? -largura * 0.8 : largura * 0.8,
      behavior: "smooth",
    });
  }

  async function adicionarNoCarrinhoBanco(item: ItemResolvido) {
    if (item.tipo_item !== "produto" || !item.produto_id) {
      return;
    }

    const precoBase =
      item.preco_original !== null &&
      item.preco_original !== undefined &&
      item.preco_original !== ""
        ? Number(item.preco_original)
        : Number(item.preco_final || 0);

    const precoPromocional =
      item.preco_original !== null &&
      item.preco_original !== undefined &&
      item.preco_original !== ""
        ? Number(item.preco_final || 0)
        : null;

    await api.post(
      "/carrinho/adicionar",
      {
        produto_id: Number(item.produto_id),
        quantidade: 1,
        preco: Number.isNaN(precoBase) ? 0 : precoBase,
        preco_promocional:
          precoPromocional !== null &&
          !Number.isNaN(precoPromocional)
            ? precoPromocional
            : null,
      },
      {
        withCredentials: true,
      }
    );
  }

  async function handleAdicionarCarrinho(item: ItemResolvido) {
    if (onAdicionarCarrinho) {
      onAdicionarCarrinho(item);
      return;
    }

    try {
      setAdicionandoId(String(item.id_vitrine_item));

      await adicionarNoCarrinhoBanco(item);

      toast.success("Produto adicionado ao carrinho.");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.mensagem ||
          "Erro ao adicionar produto."
      );
    } finally {
      setAdicionandoId(null);
    }
  }

  if (loading) {
    return (
      <section className={`destaques-section ${className}`}>
        <div className="loading-skeleton">
          <div className="skeleton-header" />

          <div className="skeleton-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="skeleton-card" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (erro || !vitrine || itens.length === 0) {
    return null;
  }

  const linkVerMais =
    verMaisHref ||
    (vitrine.slug
      ? `/Vitrine/${vitrine.slug}`
      : slug
      ? `/Vitrine/${slug}`
      : "#");

  return (
    <>
      <section className={`destaques-section ${className}`}>
        <div className="destaques-container">
          <div className="destaques-header">
            <div>
              <span className="badge">
                {vitrine?.tipo || "Coleção"}
              </span>

              <h2 className="titulo">
                {tituloPersonalizado ||
                  vitrine?.titulo ||
                  vitrine?.nome}
              </h2>

              {(subtituloPersonalizado || vitrine?.subtitulo) && (
                <p className="subtitulo">
                  {subtituloPersonalizado ||
                    vitrine?.subtitulo}
                </p>
              )}
            </div>

            <div className="header-right">
              <div className="nav-buttons">
                <button
                  className="nav-btn"
                  onClick={() => scrollCarousel("left")}
                >
                  <FiChevronLeft />
                </button>

                <button
                  className="nav-btn"
                  onClick={() => scrollCarousel("right")}
                >
                  <FiChevronRight />
                </button>
              </div>

              <Link href={linkVerMais} className="ver-mais">
                {verMaisTexto}
              </Link>
            </div>
          </div>

          <div ref={carouselRef} className="carousel">
            {itens.map((item) => {
              const preco = formatarPreco(item.preco_final);

              const precoOriginal = formatarPreco(
                item.preco_original
              );

              const estaAdicionando =
                adicionandoId ===
                String(item.id_vitrine_item);

              return (
                <article
                  key={String(item.id_vitrine_item)}
                  className="card"
                >
                  <Link
                    href={item.link_final || "#"}
                    className="image-area"
                  >
                    {item.economia_final && (
                      <span className="off-badge">
                        {item.economia_final}
                      </span>
                    )}

                    {item.imagem_final ? (
                      <img
                        src={item.imagem_final}
                        alt={item.titulo_final}
                        className="imagem"
                      />
                    ) : (
                      <div className="sem-imagem">
                        Sem imagem
                      </div>
                    )}
                  </Link>

                  <div className="conteudo">
                    <h3 className="nome">
                      {item.titulo_final}
                    </h3>

                    {item.subtitulo_final && (
                      <p className="descricao">
                        {item.subtitulo_final}
                      </p>
                    )}

                    <div className="precos">
                      {precoOriginal && (
                        <span className="preco-antigo">
                          {precoOriginal}
                        </span>
                      )}

                      {preco && (
                        <strong className="preco">
                          {preco}
                        </strong>
                      )}
                    </div>

                    <div className="acoes">
                      <button
                        type="button"
                        className="btn-carrinho"
                        onClick={() =>
                          handleAdicionarCarrinho(item)
                        }
                        disabled={estaAdicionando}
                      >
                        <FiShoppingCart />

                        <span>
                          {estaAdicionando
                            ? "Adicionando..."
                            : "Carrinho"}
                        </span>
                      </button>

                      <Link
                        href={item.link_final || "#"}
                        className="btn-visualizar"
                      >
                        <FiEye />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <style jsx>{`
        .destaques-section {
          width: 100%;
          padding: 40px 0;
          overflow: hidden;
          background: #fffaf7;
        }

        .destaques-container {
          width: 100%;
        }

        .destaques-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .badge {
          display: inline-flex;
          padding: 7px 14px;
          border-radius: 999px;
          background: #f7e1d9;
          color: #a75d5d;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .titulo {
          margin: 0;
          font-size: 34px;
          font-weight: 800;
          color: #2d1f1f;
        }

        .subtitulo {
          margin-top: 10px;
          color: #7b6b6b;
          font-size: 15px;
          max-width: 620px;
          line-height: 1.7;
        }

        .nav-buttons {
          display: flex;
          gap: 10px;
        }

        .nav-btn {
          width: 44px;
          height: 44px;
          border: none;
          border-radius: 14px;
          background: #ffffff;
          color: #8c5b5b;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.06);
          transition: 0.2s;
        }

        .nav-btn:hover {
          transform: translateY(-2px);
          background: #b76e79;
          color: #fff;
        }

        .ver-mais {
          height: 44px;
          padding: 0 20px;
          border-radius: 14px;
          background: #b76e79;
          color: #fff;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }

        .ver-mais:hover {
          background: #9f5d67;
        }

        .carousel {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none;
          padding-bottom: 10px;
        }

        .carousel::-webkit-scrollbar {
          display: none;
        }

        .card {
          flex: 0 0 280px;
          background: #ffffff;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.06);
          transition: 0.25s;
          border: 1px solid #f4e8e2;
        }

        .card:hover {
          transform: translateY(-6px);
        }

        .image-area {
          position: relative;
          width: 100%;
          height: 280px;
          background: #fff4ef;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .imagem {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: 0.35s;
        }

        .card:hover .imagem {
          transform: scale(1.05);
        }

        .off-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 5;
          background: #b76e79;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
          padding: 8px 12px;
          border-radius: 999px;
        }

        .conteudo {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .nome {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #2c1f1f;
          line-height: 1.4;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 48px;
        }

        .descricao {
          margin: 0;
          font-size: 14px;
          color: #7c6f6f;
          line-height: 1.6;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 44px;
        }

        .precos {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-height: 56px;
          justify-content: center;
        }

        .preco-antigo {
          font-size: 14px;
          color: #9ca3af;
          text-decoration: line-through;
        }

        .preco {
          font-size: 24px;
          font-weight: 800;
          color: #b76e79;
        }

        .acoes {
          display: grid;
          grid-template-columns: 1fr 54px;
          gap: 12px;
          margin-top: auto;
        }

        .btn-carrinho,
        .btn-visualizar {
          height: 52px;
          border: none;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn-carrinho {
          background: linear-gradient(
            135deg,
            #b76e79 0%,
            #cf8b8b 100%
          );
          color: #fff;
          font-size: 15px;
          font-weight: 700;
        }

        .btn-carrinho:hover {
          transform: translateY(-2px);
        }

        .btn-visualizar {
          background: #f8ebe6;
          color: #a45d5d;
          font-size: 18px;
        }

        .btn-visualizar:hover {
          background: #b76e79;
          color: #fff;
        }

        .loading-skeleton {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .skeleton-header {
          width: 260px;
          height: 38px;
          border-radius: 14px;
          background: #f3e3de;
          animation: pulse 1.2s infinite;
        }

        .skeleton-grid {
          display: flex;
          gap: 18px;
        }

        .skeleton-card {
          width: 280px;
          height: 420px;
          border-radius: 24px;
          background: #f3e3de;
          animation: pulse 1.2s infinite;
        }

        @keyframes pulse {
          0% {
            opacity: 0.6;
          }

          50% {
            opacity: 1;
          }

          100% {
            opacity: 0.6;
          }
        }

        @media (max-width: 768px) {
          .destaques-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }

          .titulo {
            font-size: 28px;
          }

          .card {
            flex: 0 0 230px;
          }

          .image-area {
            height: 220px;
          }

          .acoes {
            grid-template-columns: 1fr;
          }

          .btn-visualizar {
            display: none;
          }
        }
      `}</style>
    </>
  );
}