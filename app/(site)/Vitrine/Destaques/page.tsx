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

  if (!valor) return "";

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

  const percentual = Math.round(
    ((original - final) / original) * 100
  );

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
  verMaisTexto = "Ver mais",
  onAdicionarCarrinho,
}: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string>("");

  const [vitrine, setVitrine] = useState<Vitrine | null>(
    vitrineProp || null
  );

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
          const vitrineResponse = await api.get(
            `/vitrine/slug/${slug}`
          );

          const vitrineData = normalizarDados<Vitrine>(
            vitrineResponse?.data
          );

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

          let itensData = normalizarLista<VitrineItem>(
            itensResponse?.data
          );

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
          setVitrine(null);
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
                const res = await api.get(
                  `/produto/${item.produto_id}`
                );

                const produto =
                  normalizarDados<EntidadeGenerica>(
                    res?.data
                  ) || {};

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
                  item.titulo_personalizado ||
                  "Item da vitrine",

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
                  item.titulo_personalizado ||
                  "Item da vitrine",

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

        setErro("Não foi possível carregar a vitrine.");
        setItens([]);
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

    const width = carouselRef.current.offsetWidth;

    carouselRef.current.scrollBy({
      left: direction === "left" ? -width : width,
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

  async function handleAdicionarCarrinho(
    item: ItemResolvido
  ) {
    if (onAdicionarCarrinho) {
      onAdicionarCarrinho(item);

      return;
    }

    try {
      setAdicionandoId(String(item.id_vitrine_item));

      await adicionarNoCarrinhoBanco(item);

      toast.success(
        "Produto adicionado ao carrinho com sucesso."
      );
    } catch (error: any) {
      console.error(error);

      const mensagem =
        error?.response?.data?.dados?.erro ||
        error?.response?.data?.mensagem ||
        "Erro ao adicionar produto.";

      toast.error(mensagem);
    } finally {
      setAdicionandoId(null);
    }
  }

  if (loading) {
    return null;
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
      <section
        className={`destaques-section ${className}`}
      >
        <div className="destaques-container">
          <div className="destaques-header">
            <div>
              <span className="badge">
                {vitrine?.tipo || "Vitrine"}
              </span>

              <h2 className="title">
                {tituloPersonalizado ||
                  vitrine?.titulo ||
                  vitrine?.nome}
              </h2>

              {(subtituloPersonalizado ||
                vitrine?.subtitulo) && (
                <p className="subtitle">
                  {subtituloPersonalizado ||
                    vitrine?.subtitulo}
                </p>
              )}
            </div>

            <div className="header-actions">
              <button
                className="arrow-btn"
                onClick={() =>
                  scrollCarousel("left")
                }
              >
                <FiChevronLeft />
              </button>

              <button
                className="arrow-btn"
                onClick={() =>
                  scrollCarousel("right")
                }
              >
                <FiChevronRight />
              </button>

              <Link
                href={linkVerMais}
                className="btn-ver-mais"
              >
                {verMaisTexto}
              </Link>
            </div>
          </div>

          <div
            ref={carouselRef}
            className="carousel"
          >
            {itens.map((item) => {
              const precoFormatado = formatarPreco(
                item.preco_final
              );

              const precoOriginalFormatado =
                formatarPreco(item.preco_original);

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
                    className="image-wrapper"
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
                        className="image"
                      />
                    ) : (
                      <div className="sem-imagem">
                        Sem imagem
                      </div>
                    )}
                  </Link>

                  <div className="content">
                    <h3 className="product-title">
                      {item.titulo_final}
                    </h3>

                    {item.subtitulo_final && (
                      <p className="product-subtitle">
                        {item.subtitulo_final}
                      </p>
                    )}

                    <div className="prices">
                      {precoOriginalFormatado && (
                        <span className="old-price">
                          {precoOriginalFormatado}
                        </span>
                      )}

                      {precoFormatado && (
                        <strong className="price">
                          {precoFormatado}
                        </strong>
                      )}
                    </div>

                    <div className="buttons">
                      <button
                        type="button"
                        className="btn-cart"
                        onClick={() =>
                          handleAdicionarCarrinho(
                            item
                          )
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
                        className="btn-view"
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
          padding: 42px 0;
        }

        .destaques-container {
          width: 100%;
        }

        .destaques-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
          flex-wrap: wrap;
        }

        .badge {
          display: inline-flex;
          padding: 7px 14px;
          border-radius: 999px;
          background: #f7e7df;
          color: #a14d67;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .title {
          margin: 0;
          font-size: 32px;
          font-weight: 800;
          color: #3e2b2f;
        }

        .subtitle {
          margin-top: 10px;
          color: #7a6a6e;
          font-size: 15px;
          line-height: 1.6;
          max-width: 620px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .arrow-btn {
          width: 46px;
          height: 46px;
          border: none;
          border-radius: 14px;
          background: #fff7f2;
          color: #a14d67;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          transition: 0.2s;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
        }

        .arrow-btn:hover {
          transform: translateY(-2px);
          background: #fce9e1;
        }

        .btn-ver-mais {
          height: 46px;
          padding: 0 18px;
          border-radius: 14px;
          background: linear-gradient(
            135deg,
            #b76e79 0%,
            #d89c8d 100%
          );
          color: #fff;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .carousel {
          display: flex;
          gap: 18px;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none;
          padding-bottom: 6px;
        }

        .carousel::-webkit-scrollbar {
          display: none;
        }

        .card {
          min-width: 260px;
          max-width: 260px;
          background: #fffdfb;
          border-radius: 26px;
          overflow: hidden;
          flex-shrink: 0;
          border: 1px solid #f3e4dc;
          transition: 0.25s ease;
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.04);
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 34px rgba(0, 0, 0, 0.08);
        }

        .image-wrapper {
          position: relative;
          width: 100%;
          height: 260px;
          background: #f8f3ef;
          display: block;
          overflow: hidden;
        }

        .image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: 0.3s;
        }

        .card:hover .image {
          transform: scale(1.05);
        }

        .off-badge {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 5;
          background: #b76e79;
          color: #fff;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .sem-imagem {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9b8c8c;
          font-size: 14px;
        }

        .content {
          padding: 18px;
        }

        .product-title {
          font-size: 17px;
          font-weight: 700;
          color: #3f2e32;
          margin: 0 0 8px;
          line-height: 1.4;
        }

        .product-subtitle {
          font-size: 14px;
          color: #7b6f72;
          line-height: 1.6;
          margin-bottom: 16px;
          min-height: 42px;
        }

        .prices {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 18px;
        }

        .old-price {
          color: #9ca3af;
          font-size: 14px;
          text-decoration: line-through;
        }

        .price {
          color: #b76e79;
          font-size: 24px;
          font-weight: 800;
        }

        .buttons {
          display: flex;
          gap: 10px;
        }

        .btn-cart {
          flex: 1;
          height: 48px;
          border: none;
          border-radius: 14px;
          background: linear-gradient(
            135deg,
            #b76e79 0%,
            #d89c8d 100%
          );
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
        }

        .btn-view {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #fff3ec;
          color: #b76e79;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 18px;
        }

        @media (max-width: 768px) {
          .title {
            font-size: 24px;
          }

          .card {
            min-width: 210px;
            max-width: 210px;
          }

          .image-wrapper {
            height: 210px;
          }

          .header-actions {
            width: 100%;
            justify-content: space-between;
          }

          .btn-ver-mais {
            flex: 1;
          }
        }
      `}</style>
    </>
  );
}