"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

import { FiShoppingCart, FiEye, FiArrowRight } from "react-icons/fi";
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

  const baseURL = typeof api === "string" ? api : (api as any)?.defaults?.baseURL || "";

  if (!baseURL) return valor;

  if (valor.startsWith("/")) {
    return `${baseURL}${valor}`;
  }

  return `${baseURL}/${valor}`;
}

function obterMelhorImagem(item?: VitrineItem | null, entidade?: EntidadeGenerica | null) {
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

function descobrirTipoItem(item: VitrineItem, tipoVitrine?: string): ItemResolvido["tipo_item"] {
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
  const [vitrine, setVitrine] = useState<Vitrine | null>(vitrineProp || null);
  const [itens, setItens] = useState<ItemResolvido[]>([]);
  const [adicionandoId, setAdicionandoId] = useState<string | null>(null);

  const carouselRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    const startDragging = (pageX: number) => {
      isDown = true;
      carousel.classList.add("dragging");
      startX = pageX - carousel.offsetLeft;
      scrollLeft = carousel.scrollLeft;
    };

    const stopDragging = () => {
      isDown = false;
      carousel.classList.remove("dragging");
    };

    const move = (pageX: number) => {
      if (!isDown) return;

      const x = pageX - carousel.offsetLeft;
      const walk = (x - startX) * 1.3;

      carousel.scrollLeft = scrollLeft - walk;
    };

    const mouseDown = (e: MouseEvent) => startDragging(e.pageX);

    const mouseMove = (e: MouseEvent) => {
      e.preventDefault();
      move(e.pageX);
    };

    const touchStart = (e: TouchEvent) => startDragging(e.touches[0].pageX);

    const touchMove = (e: TouchEvent) => move(e.touches[0].pageX);

    carousel.addEventListener("mousedown", mouseDown);
    carousel.addEventListener("mouseleave", stopDragging);
    carousel.addEventListener("mouseup", stopDragging);
    carousel.addEventListener("mousemove", mouseMove);

    carousel.addEventListener("touchstart", touchStart, { passive: true });
    carousel.addEventListener("touchend", stopDragging);
    carousel.addEventListener("touchmove", touchMove, { passive: true });

    return () => {
      carousel.removeEventListener("mousedown", mouseDown);
      carousel.removeEventListener("mouseleave", stopDragging);
      carousel.removeEventListener("mouseup", stopDragging);
      carousel.removeEventListener("mousemove", mouseMove);

      carousel.removeEventListener("touchstart", touchStart);
      carousel.removeEventListener("touchend", stopDragging);
      carousel.removeEventListener("touchmove", touchMove);
    };
  }, []);

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
          precoPromocional !== null && !Number.isNaN(precoPromocional) ? precoPromocional : null,
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

    if (item.tipo_item !== "produto" || !item.produto_id) {
      return;
    }

    try {
      setAdicionandoId(String(item.id_vitrine_item));

      await adicionarNoCarrinhoBanco(item);

      toast.success("Produto adicionado ao carrinho com sucesso.");
    } catch (error: any) {
      console.error("Erro ao adicionar no carrinho:", error);

      const mensagemErro =
        error?.response?.data?.dados?.erro ||
        error?.response?.data?.mensagem ||
        "Não foi possível adicionar o produto ao carrinho.";

      toast.error(mensagemErro);
    } finally {
      setAdicionandoId(null);
    }
  }

  if (loading) {
    return <section className={`destaques-section ${className}`}>Carregando...</section>;
  }

  if (erro || !vitrine || itens.length === 0) {
    return null;
  }

  const linkVerMais =
    verMaisHref || (vitrine.slug ? `/Vitrine/${vitrine.slug}` : slug ? `/Vitrine/${slug}` : "#");

  return (
    <section className={`destaques-section ${className}`}>
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

          <Link href={linkVerMais} className="btn-ver-mais">
            <span>{verMaisTexto}</span>
            <FiArrowRight className="btn-icon" />
          </Link>
        </div>

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
              <article key={String(item.id_vitrine_item)} className="destaque-card destaque-slide">
                <div className="destaque-imagem-wrap">
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
                </div>

                <div className="destaque-conteudo">
                  <Link href={item.link_final || "#" } className="titulo-link">
                    <h3 className="destaque-titulo">{item.titulo_final}</h3>
                  </Link>

                  {item.subtitulo_final && <p className="destaque-subtitulo">{item.subtitulo_final}</p>}

                  {item.descricao_final && <p className="destaque-descricao">{item.descricao_final}</p>}

                  {(precoFormatado || precoOriginalFormatado) && (
                    <div className="destaque-precos">
                      {precoOriginalFormatado && (
                        <span className="preco-original">{precoOriginalFormatado}</span>
                      )}

                      {precoFormatado && <strong className="destaque-preco">{precoFormatado}</strong>}
                    </div>
                  )}

                  <div className="destaque-acoes">
                    {item.tipo_item === "produto" ? (
                      <button
                        type="button"
                        className="btn-carrinho"
                        onClick={() => handleAdicionarCarrinho(item)}
                        disabled={estaAdicionando}
                      >
                        <FiShoppingCart className="btn-icon" />
                        <span>{estaAdicionando ? "Adicionando..." : "Carrinho"}</span>
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
      </div>
    </section>
  );
}