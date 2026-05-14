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
  FiCheck,
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
  verMaisTexto = "Ver mais",
  onAdicionarCarrinho,
}: Props) {
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string>("");
  const [vitrine, setVitrine] = useState<Vitrine | null>(
    vitrineProp || null
  );

  const [itens, setItens] = useState<ItemResolvido[]>([]);

  const [adicionandoId, setAdicionandoId] = useState<string | null>(
    null
  );

  const [itensCarrinho, setItensCarrinho] = useState<number[]>([]);

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
          setErro("Nenhuma vitrine informada.");
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

                  imagem_final: obterMelhorImagem(
                    item,
                    produto
                  ),

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

        try {
          const carrinhoResponse = await api.get("/carrinho", {
            withCredentials: true,
          });

          const carrinhoItens =
            normalizarLista<any>(carrinhoResponse?.data);

          const ids = carrinhoItens
            .map((item: any) => Number(item.produto_id))
            .filter(Boolean);

          setItensCarrinho(ids);
        } catch {
          setItensCarrinho([]);
        }
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

  function moverCarousel(direcao: "left" | "right") {
    if (!carouselRef.current) return;

    const largura = carouselRef.current.offsetWidth;

    carouselRef.current.scrollBy({
      left: direcao === "left" ? -largura : largura,
      behavior: "smooth",
    });
  }

  async function adicionarNoCarrinhoBanco(
    item: ItemResolvido
  ) {
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

    if (item.tipo_item !== "produto" || !item.produto_id) {
      return;
    }

    try {
      setAdicionandoId(String(item.id_vitrine_item));

      await adicionarNoCarrinhoBanco(item);

      setItensCarrinho((prev) => [
        ...new Set([...prev, Number(item.produto_id)]),
      ]);

      toast.success("Produto adicionado ao carrinho.");
    } catch (error: any) {
      console.error(error);

      const mensagemErro =
        error?.response?.data?.dados?.erro ||
        error?.response?.data?.mensagem ||
        "Não foi possível adicionar.";

      toast.error(mensagemErro);
    } finally {
      setAdicionandoId(null);
    }
  }

  if (loading) {
    return (
      <section className={`destaques-section ${className}`}>
        <div className="loading-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton-card" />
          ))}
        </div>

        <style jsx>{`
          .loading-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }

          .skeleton-card {
            height: 420px;
            border-radius: 28px;
            background: linear-gradient(
              90deg,
              #f8e8e1 25%,
              #fff6f1 50%,
              #f8e8e1 75%
            );

            background-size: 400% 100%;

            animation: shimmer 1.5s infinite;
          }

          @keyframes shimmer {
            0% {
              background-position: 100% 0;
            }

            100% {
              background-position: -100% 0;
            }
          }

          @media (max-width: 900px) {
            .loading-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 640px) {
            .loading-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
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
        <div className="container">
          <div className="topo">
            <div>
              <span className="badge">
                {vitrine?.tipo || "Produtos"}
              </span>

              <h2>
                {tituloPersonalizado ||
                  vitrine?.titulo ||
                  vitrine?.nome}
              </h2>

              {(subtituloPersonalizado ||
                vitrine?.subtitulo) && (
                <p>
                  {subtituloPersonalizado ||
                    vitrine?.subtitulo}
                </p>
              )}
            </div>

            <div className="acoes-topo">
              <button
                type="button"
                className="nav-btn"
                onClick={() => moverCarousel("left")}
              >
                <FiChevronLeft />
              </button>

              <button
                type="button"
                className="nav-btn"
                onClick={() => moverCarousel("right")}
              >
                <FiChevronRight />
              </button>

              <Link
                href={linkVerMais}
                className="btn-vermais"
              >
                {verMaisTexto}
              </Link>
            </div>
          </div>

          <div ref={carouselRef} className="carousel">
            {itens.map((item) => {
              const precoFormatado = formatarPreco(
                item.preco_final
              );

              const precoOriginalFormatado = formatarPreco(
                item.preco_original
              );

              const estaNoCarrinho = itensCarrinho.includes(
                Number(item.produto_id)
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
                    className="imagem-area"
                  >
                    {item.economia_final && (
                      <span className="tag-off">
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
                    <Link
                      href={item.link_final || "#"}
                      className="titulo-link"
                    >
                      <h3>{item.titulo_final}</h3>
                    </Link>

                    {item.subtitulo_final && (
                      <p className="subtitulo">
                        {item.subtitulo_final}
                      </p>
                    )}

                    <div className="precos">
                      {precoOriginalFormatado && (
                        <span className="preco-antigo">
                          {precoOriginalFormatado}
                        </span>
                      )}

                      {precoFormatado && (
                        <strong>{precoFormatado}</strong>
                      )}
                    </div>

                    <div className="botoes">
                      {item.tipo_item === "produto" ? (
                        <button
                          type="button"
                          className={`btn-carrinho ${
                            estaNoCarrinho
                              ? "adicionado"
                              : ""
                          }`}
                          onClick={() =>
                            handleAdicionarCarrinho(item)
                          }
                          disabled={
                            estaAdicionando ||
                            estaNoCarrinho
                          }
                        >
                          {estaAdicionando ? (
                            <>
                              <span className="mini-loader" />
                              <span>Adicionando</span>
                            </>
                          ) : estaNoCarrinho ? (
                            <>
                              <FiCheck />
                              <span>No carrinho</span>
                            </>
                          ) : (
                            <>
                              <FiShoppingCart />
                              <span>Adicionar</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <Link
                          href={item.link_final || "#"}
                          className="btn-carrinho"
                        >
                          <FiArrowRight />
                          <span>Acessar</span>
                        </Link>
                      )}

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
        }

        .container {
          width: 100%;
        }

        .topo {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .badge {
          display: inline-flex;
          padding: 8px 16px;
          border-radius: 999px;
          background: #f6dfd7;
          color: #9a5f55;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 14px;
        }

        h2 {
          margin: 0;
          font-size: 34px;
          color: #2f2a28;
          font-weight: 800;
        }

        .topo p {
          margin: 10px 0 0;
          color: #7c6f69;
          font-size: 15px;
        }

        .acoes-topo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .nav-btn {
          width: 48px;
          height: 48px;
          border: none;
          border-radius: 16px;
          background: #fff;
          color: #8b5e54;
          cursor: pointer;
          font-size: 22px;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
        }

        .btn-vermais {
          height: 48px;
          padding: 0 20px;
          border-radius: 16px;
          background: linear-gradient(
            135deg,
            #c9897b,
            #8b5e54
          );

          color: #fff;
          display: flex;
          align-items: center;
          text-decoration: none;
          font-weight: 700;
        }

        .carousel {
          display: flex;
          gap: 22px;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none;
        }

        .carousel::-webkit-scrollbar {
          display: none;
        }

        .card {
          min-width: 290px;
          max-width: 290px;
          background: #fffdfb;
          border-radius: 28px;
          overflow: hidden;
          border: 1px solid #f4e5de;
          transition: all 0.25s ease;
          flex-shrink: 0;
        }

        .card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.08);
        }

        .imagem-area {
          position: relative;
          width: 100%;
          height: 270px;
          background: #fff7f3;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .imagem {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .tag-off {
          position: absolute;
          top: 14px;
          left: 14px;
          z-index: 2;
          background: #d45b5b;
          color: #fff;
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }

        .conteudo {
          padding: 18px;
        }

        .titulo-link {
          text-decoration: none;
        }

        h3 {
          margin: 0;
          color: #2f2a28;
          font-size: 17px;
          font-weight: 700;
          line-height: 1.4;
        }

        .subtitulo {
          margin: 8px 0 16px;
          color: #7c6f69;
          font-size: 14px;
          line-height: 1.6;
          min-height: 44px;
        }

        .precos {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 18px;
        }

        .preco-antigo {
          color: #9ca3af;
          text-decoration: line-through;
          font-size: 14px;
        }

        .precos strong {
          font-size: 24px;
          color: #8b5e54;
        }

        .botoes {
          display: grid;
          grid-template-columns: 1fr 54px;
          gap: 12px;
        }

        .btn-carrinho,
        .btn-visualizar {
          height: 52px;
          border-radius: 16px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-size: 15px;
          font-weight: 700;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .btn-carrinho {
          background: linear-gradient(
            135deg,
            #c9897b,
            #8b5e54
          );

          color: #fff;
        }

        .btn-carrinho:hover {
          transform: translateY(-2px);
        }

        .btn-carrinho.adicionado {
          background: #ecfdf3;
          color: #0f9f6e;
        }

        .btn-visualizar {
          background: #f7f1ee;
          color: #8b5e54;
        }

        .mini-loader {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .topo {
            flex-direction: column;
            align-items: flex-start;
          }

          .acoes-topo {
            width: 100%;
            justify-content: space-between;
          }

          .card {
            min-width: 240px;
            max-width: 240px;
          }

          .imagem-area {
            height: 220px;
          }

          h2 {
            font-size: 28px;
          }
        }
      `}</style>
    </>
  );
}