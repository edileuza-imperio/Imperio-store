"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/Api/conectar";

import {
  FiShoppingCart,
  FiEye,
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiCheckCircle,
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
    typeof api === "string" ? api : (api as any)?.defaults?.baseURL || "";

  if (!baseURL) return valor;

  if (valor.startsWith("/")) return `${baseURL}${valor}`;

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
  if (valor === null || valor === undefined || valor === "") return null;

  const numero = Number(valor);
  if (Number.isNaN(numero)) return null;

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
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string>("");
  const [vitrine, setVitrine] = useState<Vitrine | null>(vitrineProp || null);
  const [itens, setItens] = useState<ItemResolvido[]>([]);
  const [adicionandoId, setAdicionandoId] = useState<string | null>(null);
  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [abrindoCarrinho, setAbrindoCarrinho] = useState(false);

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<number | null>(null);

  const vitrineComItens = useMemo(() => {
    if (!vitrineProp) return null;

    const lista = Array.isArray(vitrineProp.itens) ? vitrineProp.itens : [];
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
          const vitrineData = normalizarDados<Vitrine>(vitrineResponse?.data);

          if (!vitrineData || !vitrineData.id_vitrine) {
            if (!ativo) return;
            setErro("Vitrine não encontrada.");
            setVitrine(null);
            setItens([]);
            return;
          }

          const itensResponse = await api.get(`/vitrine/${vitrineData.id_vitrine}/itens`);
          let itensData = normalizarLista<VitrineItem>(itensResponse?.data);

          if (limite) itensData = itensData.slice(0, limite);

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

        const listaItens = Array.isArray(vitrineAtual.itens) ? vitrineAtual.itens : [];

        const itensResolvidos: ItemResolvido[] = await Promise.all(
          listaItens.map(async (item) => {
            const tipoItem = descobrirTipoItem(item, vitrineAtual?.tipo);

            try {
              if (tipoItem === "produto" && item.produto_id) {
                const res = await api.get(`/produto/${item.produto_id}`);
                const produto = normalizarDados<EntidadeGenerica>(res?.data) || {};

                const precoPromocional =
                  produto.preco_promocional !== null &&
                  produto.preco_promocional !== undefined &&
                  produto.preco_promocional !== ""
                    ? produto.preco_promocional
                    : null;

                const precoFinal = precoPromocional || produto.preco || null;
                const precoOriginal = precoPromocional ? produto.preco || null : null;

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
                    item.subtitulo_personalizado ||
                    "",
                  imagem_final: obterMelhorImagem(item, produto),
                  link_final: produto.slug
                    ? `/produto/${produto.slug}`
                    : `/produto/${item.produto_id}`,
                  preco_final: precoFinal,
                  preco_original: precoOriginal,
                  marca_final: produto.marca || "",
                  sku_final: produto.sku || "",
                  economia_final: calcularEconomia(precoOriginal, precoFinal),
                };
              }

              if (tipoItem === "campanha" && item.campanha_id) {
                const res = await api.get(`/campanha/${item.campanha_id}`);
                const campanha = normalizarDados<EntidadeGenerica>(res?.data) || {};

                return {
                  ...item,
                  entidade: campanha,
                  tipo_item: "campanha",
                  titulo_final:
                    item.titulo_personalizado ||
                    campanha.nome ||
                    campanha.titulo ||
                    `Campanha #${item.campanha_id}`,
                  subtitulo_final:
                    item.subtitulo_personalizado ||
                    campanha.subtitulo ||
                    campanha.descricao ||
                    "",
                  descricao_final: campanha.descricao_curta || campanha.descricao || "",
                  imagem_final: obterMelhorImagem(item, campanha),
                  link_final: campanha.slug
                    ? `/campanha/${campanha.slug}`
                    : `/campanha/${item.campanha_id}`,
                  preco_final: null,
                  preco_original: null,
                  marca_final: "",
                  sku_final: "",
                  economia_final: null,
                };
              }

              if (tipoItem === "categoria" && item.categoria_id) {
                const res = await api.get(`/categoria/${item.categoria_id}`);
                const categoria = normalizarDados<EntidadeGenerica>(res?.data) || {};

                return {
                  ...item,
                  entidade: categoria,
                  tipo_item: "categoria",
                  titulo_final:
                    item.titulo_personalizado ||
                    categoria.nome ||
                    categoria.titulo ||
                    `Categoria #${item.categoria_id}`,
                  subtitulo_final:
                    item.subtitulo_personalizado ||
                    categoria.subtitulo ||
                    categoria.descricao_curta ||
                    "",
                  descricao_final: categoria.descricao_curta || categoria.descricao || "",
                  imagem_final: obterMelhorImagem(item, categoria),
                  link_final: categoria.slug
                    ? `/categoria/${categoria.slug}`
                    : `/categoria/${item.categoria_id}`,
                  preco_final: null,
                  preco_original: null,
                  marca_final: "",
                  sku_final: "",
                  economia_final: null,
                };
              }

              return {
                ...item,
                entidade: null,
                tipo_item: tipoItem,
                titulo_final: item.titulo_personalizado || "Item da vitrine",
                subtitulo_final: item.subtitulo_personalizado || "",
                descricao_final: item.subtitulo_personalizado || "",
                imagem_final: resolverImagem(item.imagem_personalizada || ""),
                link_final: "#",
                preco_final: null,
                preco_original: null,
                marca_final: "",
                sku_final: "",
                economia_final: null,
              };
            } catch {
              return {
                ...item,
                entidade: null,
                tipo_item: tipoItem,
                titulo_final: item.titulo_personalizado || "Item da vitrine",
                subtitulo_final: item.subtitulo_personalizado || "",
                descricao_final: item.subtitulo_personalizado || "",
                imagem_final: resolverImagem(item.imagem_personalizada || ""),
                link_final: "#",
                preco_final: null,
                preco_original: null,
                marca_final: "",
                sku_final: "",
                economia_final: null,
              };
            }
          })
        );

        if (!ativo) return;
        setItens(itensResolvidos);
      } catch (error) {
        console.error("Erro ao carregar vitrine:", error);
        if (!ativo) return;
        setErro("Não foi possível carregar a vitrine.");
        setVitrine(null);
        setItens([]);
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [slug, limite, vitrineComItens]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const atualizarBotoes = () => {
      const { scrollLeft, scrollWidth, clientWidth } = carousel;
      const maxScroll = scrollWidth - clientWidth;

      setPodeVoltar(scrollLeft > 4);
      setPodeAvancar(scrollLeft < maxScroll - 4);
    };

    atualizarBotoes();
    carousel.addEventListener("scroll", atualizarBotoes);
    window.addEventListener("resize", atualizarBotoes);

    return () => {
      carousel.removeEventListener("scroll", atualizarBotoes);
      window.removeEventListener("resize", atualizarBotoes);
    };
  }, [itens.length, loading]);

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || loading || itens.length <= 1) return;

    if (autoplayRef.current) {
      window.clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }

    autoplayRef.current = window.setInterval(() => {
      if (pausado || abrindoCarrinho) return;

      const card = carousel.querySelector<HTMLElement>(".destaque-card");
      const larguraCard = card?.offsetWidth || 280;
      const gap = 18;
      const distancia = larguraCard + gap;

      const { scrollLeft, scrollWidth, clientWidth } = carousel;
      const maxScroll = scrollWidth - clientWidth;

      if (scrollLeft >= maxScroll - 8) {
        carousel.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        carousel.scrollBy({ left: distancia, behavior: "smooth" });
      }
    }, 3200);

    const handleVisibility = () => {
      setPausado(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (autoplayRef.current) {
        window.clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [loading, itens.length, pausado, abrindoCarrinho]);

  function moverCarousel(direcao: "prev" | "next") {
    const carousel = carouselRef.current;
    if (!carousel) return;

    const card = carousel.querySelector<HTMLElement>(".destaque-card");
    const larguraCard = card?.offsetWidth || 280;
    const gap = 18;
    const distancia = larguraCard + gap;

    const { scrollLeft, scrollWidth, clientWidth } = carousel;
    const maxScroll = scrollWidth - clientWidth;

    if (direcao === "next") {
      if (scrollLeft >= maxScroll - 8) {
        carousel.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        carousel.scrollBy({ left: distancia, behavior: "smooth" });
      }
    } else {
      if (scrollLeft <= 8) {
        carousel.scrollTo({ left: maxScroll, behavior: "smooth" });
      } else {
        carousel.scrollBy({ left: -distancia, behavior: "smooth" });
      }
    }
  }

  async function adicionarNoCarrinhoBanco(item: ItemResolvido) {
    if (item.tipo_item !== "produto" || !item.produto_id) return;

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
          precoPromocional !== null && !Number.isNaN(precoPromocional)
            ? precoPromocional
            : null,
      },
      { withCredentials: true }
    );
  }

  async function handleAdicionarCarrinho(item: ItemResolvido) {
    if (onAdicionarCarrinho) {
      onAdicionarCarrinho(item);
      return;
    }

    if (item.tipo_item !== "produto" || !item.produto_id) return;

    const toastId = toast.loading("Adicionando ao carrinho...");

    try {
      setAdicionandoId(String(item.id_vitrine_item));

      await adicionarNoCarrinhoBanco(item);

      toast.update(toastId, {
        render: "Produto adicionado com sucesso.",
        type: "success",
        isLoading: false,
        autoClose: 1200,
        closeButton: true,
      });

      setAbrindoCarrinho(true);

      window.setTimeout(() => {
        router.push("/Carrinho");
      }, 700);
    } catch (error: any) {
      console.error("Erro ao adicionar no carrinho:", error);

      const mensagemErro =
        error?.response?.data?.dados?.erro ||
        error?.response?.data?.mensagem ||
        "Não foi possível adicionar o produto ao carrinho.";

      toast.update(toastId, {
        render: mensagemErro,
        type: "error",
        isLoading: false,
        autoClose: 2500,
        closeButton: true,
      });
    } finally {
      setAdicionandoId(null);
      window.setTimeout(() => setAbrindoCarrinho(false), 1200);
    }
  }

  if (loading) {
    return (
      <section className={`destaques-section ${className}`}>
        <div className="destaques-container">
          <div className="destaques-header destaques-header-row">
            <div className="destaques-header-texto">
              <div className="skeleton skeleton-badge" />
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
            </div>
            <div className="skeleton skeleton-button" />
          </div>

          <div className="skeleton-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <article className="skeleton-card" key={index}>
                <div className="skeleton skeleton-image" />
                <div className="skeleton-body">
                  <div className="skeleton skeleton-line title" />
                  <div className="skeleton skeleton-line" />
                  <div className="skeleton skeleton-line short" />
                  <div className="skeleton-actions">
                    <div className="skeleton skeleton-btn" />
                    <div className="skeleton skeleton-btn outline" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <style jsx>{`
          .destaques-section {
            padding: 28px 0;
          }

          .destaques-container {
            max-width: 1280px;
            margin: 0 auto;
            padding: 0 16px;
          }

          .destaques-header-row {
            display: flex;
            align-items: end;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 18px;
          }

          .destaques-header-texto {
            flex: 1;
          }

          .skeleton {
            position: relative;
            overflow: hidden;
            background: #eadfd8;
            border-radius: 16px;
          }

          .skeleton::before {
            content: "";
            position: absolute;
            top: 0;
            left: -160px;
            width: 120px;
            height: 100%;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(255, 255, 255, 0.7),
              transparent
            );
            animation: shimmer 1.15s infinite;
          }

          .skeleton-badge {
            width: 86px;
            height: 26px;
            margin-bottom: 12px;
            border-radius: 999px;
          }

          .skeleton-title {
            width: min(360px, 70%);
            height: 38px;
            margin-bottom: 10px;
          }

          .skeleton-text {
            width: min(520px, 90%);
            height: 18px;
          }

          .skeleton-button {
            width: 124px;
            height: 44px;
            border-radius: 14px;
          }

          .skeleton-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 18px;
          }

          .skeleton-card {
            border-radius: 24px;
            overflow: hidden;
            background: rgba(255, 255, 255, 0.72);
            box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
          }

          .skeleton-image {
            width: 100%;
            aspect-ratio: 1 / 1;
            border-radius: 0;
          }

          .skeleton-body {
            padding: 16px;
          }

          .skeleton-line {
            height: 16px;
            margin-bottom: 10px;
          }

          .skeleton-line.title {
            height: 22px;
            width: 82%;
          }

          .skeleton-line.short {
            width: 62%;
            margin-bottom: 18px;
          }

          .skeleton-actions {
            display: flex;
            gap: 10px;
          }

          .skeleton-btn {
            flex: 1;
            height: 42px;
            border-radius: 14px;
          }

          .skeleton-btn.outline {
            background: #f2e7e1;
          }

          @keyframes shimmer {
            100% {
              left: 120%;
            }
          }

          @media (max-width: 900px) {
            .skeleton-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }

            .destaques-header-row {
              align-items: flex-start;
              flex-direction: column;
            }

            .skeleton-button {
              width: 100%;
              max-width: 180px;
            }
          }

          @media (max-width: 640px) {
            .skeleton-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </section>
    );
  }

  if (erro || !vitrine || itens.length === 0) return null;

  const linkVerMais =
    verMaisHref ||
    (vitrine.slug ? `/Vitrine/${vitrine.slug}` : slug ? `/Vitrine/${slug}` : "#");

  return (
    <section
      className={`destaques-section ${className}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={() => setPausado(true)}
      onTouchEnd={() => setPausado(false)}
    >
      <div className="destaques-container">
        <div className="destaques-header destaques-header-row">
          <div className="destaques-header-texto">
            <span className="destaques-badge">{vitrine?.tipo || "Vitrine"}</span>

            <h2 className="destaques-title">
              {tituloPersonalizado || vitrine?.titulo || vitrine?.nome}
            </h2>

            {(subtituloPersonalizado || vitrine?.subtitulo) && (
              <p className="destaques-description">
                {subtituloPersonalizado || vitrine?.subtitulo}
              </p>
            )}
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="nav-btn"
              onClick={() => moverCarousel("prev")}
              disabled={!podeVoltar || abrindoCarrinho}
              aria-label="Anterior"
            >
              <FiChevronLeft />
            </button>

            <button
              type="button"
              className="nav-btn"
              onClick={() => moverCarousel("next")}
              disabled={!podeAvancar || abrindoCarrinho}
              aria-label="Próximo"
            >
              <FiChevronRight />
            </button>

            <Link href={linkVerMais} className="btn-ver-mais">
              <span>{verMaisTexto}</span>
              <FiArrowRight className="btn-icon" />
            </Link>
          </div>
        </div>

        <div className="carousel-shell">
          <div ref={carouselRef} className="destaques-carousel">
            {itens.map((item) => {
              const precoFormatado = formatarPreco(item.preco_final);
              const precoOriginalFormatado = formatarPreco(item.preco_original);

              const slugVisualizacao =
                item.entidade?.slug ||
                (item.produto_id ? String(item.produto_id) : null) ||
                (item.campanha_id ? String(item.campanha_id) : null) ||
                (item.categoria_id ? String(item.categoria_id) : null);

              const linkVisualizarCard = slugVisualizacao
                ? `/Vitrine/visualizar/${slugVisualizacao}`
                : "#";

              const estaAdicionando = adicionandoId === String(item.id_vitrine_item);

              return (
                <article key={String(item.id_vitrine_item)} className="destaque-card">
                  <div className="destaque-media">
                    <Link href={item.link_final || "#"} className="imagem-link">
                      {item.imagem_final ? (
                        <img
                          src={item.imagem_final}
                          alt={item.titulo_final}
                          className="destaque-imagem"
                        />
                      ) : (
                        <div className="destaque-sem-imagem">
                          <span>Sem imagem</span>
                        </div>
                      )}
                    </Link>

                    {item.economia_final && (
                      <span className="economia-badge">{item.economia_final}</span>
                    )}
                  </div>

                  <div className="destaque-conteudo">
                    <div className="destaque-meta">
                      {item.marca_final && (
                        <span className="meta-chip">{item.marca_final}</span>
                      )}

                      {item.sku_final && (
                        <span className="meta-chip">SKU {item.sku_final}</span>
                      )}
                    </div>

                    <Link href={item.link_final || "#"} className="titulo-link">
                      <h3 className="destaque-titulo">{item.titulo_final}</h3>
                    </Link>

                    {item.subtitulo_final && (
                      <p className="destaque-subtitulo">{item.subtitulo_final}</p>
                    )}

                    {item.descricao_final && (
                      <p className="destaque-descricao">{item.descricao_final}</p>
                    )}

                    {(precoFormatado || precoOriginalFormatado) && (
                      <div className="destaque-precos">
                        {precoOriginalFormatado && (
                          <span className="preco-original">{precoOriginalFormatado}</span>
                        )}

                        {precoFormatado && (
                          <strong className="destaque-preco">{precoFormatado}</strong>
                        )}
                      </div>
                    )}

                    <div className="destaque-acoes">
                      {item.tipo_item === "produto" ? (
                        <button
                          type="button"
                          className="btn-carrinho"
                          onClick={() => handleAdicionarCarrinho(item)}
                          disabled={estaAdicionando || abrindoCarrinho}
                        >
                          {estaAdicionando ? (
                            <FiLoader className="btn-icon spin" />
                          ) : abrindoCarrinho ? (
                            <FiCheckCircle className="btn-icon" />
                          ) : (
                            <FiShoppingCart className="btn-icon" />
                          )}

                          <span>
                            {estaAdicionando
                              ? "Adicionando..."
                              : abrindoCarrinho
                              ? "Abrindo..."
                              : "Carrinho"}
                          </span>
                        </button>
                      ) : (
                        <Link href={item.link_final || "#"} className="btn-carrinho">
                          <FiArrowRight className="btn-icon" />
                          <span>Acessar</span>
                        </Link>
                      )}

                      <Link href={linkVisualizarCard} className="btn-visualizar">
                        <FiEye className="btn-icon" />
                        <span>Visualizar</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="carousel-fade left" />
          <div className="carousel-fade right" />
        </div>
      </div>

      {abrindoCarrinho && (
        <div className="cart-overlay">
          <div className="cart-card">
            <div className="cart-spinner" />
            <h3>Levando você para o carrinho</h3>
            <p>Seu produto foi adicionado com sucesso.</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .destaques-section {
          padding: 28px 0;
        }

        .destaques-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .destaques-header-row {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 20px;
        }

        .destaques-header-texto {
          min-width: 0;
        }

        .destaques-badge {
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(183, 110, 121, 0.12);
          color: #8b4d59;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .destaques-title {
          margin: 0;
          font-size: 30px;
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #6d4c52;
        }

        .destaques-description {
          margin: 10px 0 0;
          max-width: 720px;
          color: #8b6b70;
          font-size: 15px;
          line-height: 1.75;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .nav-btn {
          width: 46px;
          height: 46px;
          border: 1px solid rgba(183, 110, 121, 0.14);
          background: rgba(255, 250, 247, 0.96);
          color: #6d4c52;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          cursor: pointer;
          box-shadow: 0 14px 32px rgba(183, 110, 121, 0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }

        .nav-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 18px 38px rgba(183, 110, 121, 0.12);
        }

        .nav-btn:disabled {
          opacity: 0.38;
          cursor: not-allowed;
          transform: none;
          box-shadow: 0 10px 24px rgba(183, 110, 121, 0.04);
        }

        .btn-ver-mais {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          height: 46px;
          padding: 0 18px;
          border-radius: 14px;
          background: linear-gradient(135deg, #b76e79 0%, #9d5c67 100%);
          color: #fffaf7;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 16px 34px rgba(183, 110, 121, 0.18);
          white-space: nowrap;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .btn-ver-mais:hover {
          transform: translateY(-1px);
          box-shadow: 0 20px 42px rgba(183, 110, 121, 0.22);
        }

        .btn-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .spin {
          animation: spin 0.8s linear infinite;
        }

        .carousel-shell {
          position: relative;
        }

        .carousel-fade {
          position: absolute;
          top: 0;
          bottom: 14px;
          width: 42px;
          pointer-events: none;
          z-index: 2;
        }

        .carousel-fade.left {
          left: 0;
          background: linear-gradient(to right, rgba(248, 239, 236, 0.96), transparent);
        }

        .carousel-fade.right {
          right: 0;
          background: linear-gradient(to left, rgba(248, 239, 236, 0.96), transparent);
        }

        .destaques-carousel {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: clamp(250px, 24vw, 290px);
          gap: 18px;
          overflow-x: auto;
          overflow-y: hidden;
          padding: 6px 2px 14px;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          cursor: grab;
          user-select: none;
        }

        .destaques-carousel.dragging {
          cursor: grabbing;
          scroll-snap-type: none;
        }

        .destaques-carousel::-webkit-scrollbar {
          display: none;
        }

        .destaque-card {
          scroll-snap-align: start;
          overflow: hidden;
          border-radius: 26px;
          background: rgba(255, 250, 247, 0.98);
          border: 1px solid rgba(183, 110, 121, 0.1);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
          min-height: 100%;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .destaque-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 24px 54px rgba(15, 23, 42, 0.1);
        }

        .destaque-media {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, #f5ebe7 0%, #fffaf7 100%);
        }

        .imagem-link {
          display: block;
          text-decoration: none;
        }

        .destaque-imagem {
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          display: block;
          transition: transform 0.35s ease;
        }

        .destaque-card:hover .destaque-imagem {
          transform: scale(1.03);
        }

        .destaque-sem-imagem {
          width: 100%;
          aspect-ratio: 1 / 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b6b70;
          font-size: 14px;
          background:
            radial-gradient(circle at top, rgba(183, 110, 121, 0.08), transparent 46%),
            #f7efeb;
        }

        .economia-badge {
          position: absolute;
          left: 14px;
          top: 14px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(109, 76, 82, 0.94);
          color: #fffaf7;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.04em;
          box-shadow: 0 12px 26px rgba(109, 76, 82, 0.18);
        }

        .destaque-conteudo {
          padding: 16px 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .destaque-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .meta-chip {
          display: inline-flex;
          align-items: center;
          height: 24px;
          padding: 0 10px;
          border-radius: 999px;
          background: #f4e8e4;
          color: #8b4d59;
          font-size: 11px;
          font-weight: 700;
        }

        .titulo-link {
          text-decoration: none;
          color: inherit;
        }

        .destaque-titulo {
          margin: 0;
          color: #2f1f22;
          font-size: 18px;
          line-height: 1.3;
          font-weight: 800;
          letter-spacing: -0.02em;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 46px;
        }

        .destaque-subtitulo {
          margin: 0;
          color: #6f5c60;
          font-size: 13px;
          line-height: 1.7;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .destaque-descricao {
          margin: 0;
          color: #8b6b70;
          font-size: 13px;
          line-height: 1.7;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .destaque-precos {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-top: auto;
          padding-top: 4px;
          flex-wrap: wrap;
        }

        .preco-original {
          color: #a89a9d;
          font-size: 13px;
          text-decoration: line-through;
        }

        .destaque-preco {
          color: #6d4c52;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .destaque-acoes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 4px;
        }

        .btn-carrinho,
        .btn-visualizar {
          width: 100%;
          min-width: 0;
          height: 46px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease,
            background 0.2s ease, border-color 0.2s ease;
          white-space: nowrap;
        }

        .btn-carrinho {
          border: none;
          background: linear-gradient(135deg, #b76e79 0%, #9d5c67 100%);
          color: #fffaf7;
          box-shadow: 0 14px 28px rgba(183, 110, 121, 0.18);
          cursor: pointer;
        }

        .btn-carrinho:hover,
        .btn-visualizar:hover {
          transform: translateY(-1px);
        }

        .btn-carrinho:disabled {
          opacity: 0.72;
          cursor: not-allowed;
          transform: none;
        }

        .btn-visualizar {
          border: 1px solid #ecd7d3;
          color: #6d4c52;
          background: #fff;
        }

        .btn-visualizar:hover {
          border-color: #dcb7b0;
          background: #fff7f5;
        }

        .cart-overlay {
          position: fixed;
          inset: 0;
          z-index: 80;
          background: rgba(15, 23, 42, 0.42);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .cart-card {
          width: 100%;
          max-width: 360px;
          background: rgba(255, 250, 247, 0.98);
          border: 1px solid rgba(183, 110, 121, 0.1);
          border-radius: 28px;
          padding: 30px 24px;
          text-align: center;
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.18);
        }

        .cart-spinner {
          width: 54px;
          height: 54px;
          margin: 0 auto 18px;
          border-radius: 50%;
          border: 4px solid #eadfd8;
          border-top-color: #b76e79;
          animation: spin 0.85s linear infinite;
        }

        .cart-card h3 {
          margin: 0 0 8px;
          font-size: 22px;
          color: #6d4c52;
        }

        .cart-card p {
          margin: 0;
          color: #8b6b70;
          font-size: 14px;
          line-height: 1.7;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .destaques-title {
            font-size: 26px;
          }

          .destaques-carousel {
            grid-auto-columns: minmax(250px, 280px);
          }
        }

        @media (max-width: 768px) {
          .destaques-section {
            padding: 20px 0;
          }

          .destaques-header-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .header-actions {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
          }

          .btn-ver-mais {
            margin-left: auto;
          }

          .destaques-title {
            font-size: 24px;
          }

          .destaques-description {
            font-size: 14px;
          }

          .destaques-carousel {
            grid-auto-columns: minmax(240px, 78vw);
            gap: 14px;
            padding-bottom: 10px;
          }

          .destaque-titulo {
            font-size: 17px;
          }

          .destaque-acoes {
            grid-template-columns: 1fr 1fr;
          }

          .carousel-fade {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .destaques-container {
            padding: 0 12px;
          }

          .destaques-carousel {
            grid-auto-columns: 86vw;
          }

          .nav-btn {
            width: 42px;
            height: 42px;
            border-radius: 12px;
          }

          .btn-ver-mais {
            height: 42px;
            padding: 0 14px;
            font-size: 13px;
          }

          .destaque-conteudo {
            padding: 14px;
          }

          .destaque-card {
            border-radius: 22px;
          }

          .destaque-acoes {
            grid-template-columns: 1fr;
          }

          .btn-carrinho,
          .btn-visualizar {
            height: 44px;
          }
        }
      `}</style>
    </section>
  );
}