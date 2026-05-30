"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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


import styles from "./Destaques.module.css";
import { imagemFundo } from "@/components/Bibioteca/imagem";
import { calcularEconomia, descobrirTipoItem, formatarPreco, normalizarDados, normalizarLista, obterMelhorImagem, temValor } from "@/hooks/destaque/functions";
import { adicionarNoCarrinhoBanco, moverCarousel } from "@/Pages/carrinho";
import { useAutoplayRef, useCarouselRef } from "@/Pages/vitrine.service";
import SkeletonDestaques from "@/Pages/destaque/SkeletonDestaques";
import ModalCarrinho from "@/Pages/destaque/modal/modal";







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

  const carouselRef = useCarouselRef();
  const autoplayRef = useAutoplayRef();

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

          const itensResponse = await api.get(
            `/vitrine/${vitrineData.id_vitrine}/itens`
          );

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

        const listaItens = Array.isArray(vitrineAtual.itens)
          ? vitrineAtual.itens
          : [];

        const itensResolvidos: ItemResolvido[] = await Promise.all(
          listaItens.map(async (item) => {
            const tipoItem = descobrirTipoItem(item, vitrineAtual?.tipo);

            try {
              if (tipoItem === "produto" && item.produto_id) {
                const res = await api.get(`/produto/${item.produto_id}`);
                const produto = normalizarDados<EntidadeGenerica>(res?.data) || {};

                const precoPromocional = temValor(produto.preco_promocional)
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
                  descricao_final:
                    campanha.descricao_curta || campanha.descricao || "",
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
                  descricao_final:
                    categoria.descricao_curta || categoria.descricao || "",
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
                imagem_final: imagemFundo(item.imagem_personalizada || ""),
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
                imagem_final: imagemFundo(item.imagem_personalizada || ""),
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

    const handleVisibility = () => setPausado(document.hidden);

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (autoplayRef.current) {
        window.clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [loading, itens.length, pausado, abrindoCarrinho]);




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
  return <SkeletonDestaques className={className} />;
}

  if (erro || !vitrine || itens.length === 0) return null;

  const linkVerMais =
    verMaisHref ||
    (vitrine.slug ? `/Vitrine/${vitrine.slug}` : slug ? `/Vitrine/${slug}` : "#");

  return (
    <section
      className={`${styles.section} ${className}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={() => setPausado(true)}
      onTouchEnd={() => setPausado(false)}
    >
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.badge}>{vitrine?.tipo || "Vitrine"}</span>

            <h2 className={styles.title}>
              {tituloPersonalizado || vitrine?.titulo || vitrine?.nome}
            </h2>

            {(subtituloPersonalizado || vitrine?.subtitulo) && (
              <p className={styles.description}>
                {subtituloPersonalizado || vitrine?.subtitulo}
              </p>
            )}
          </div>

          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.navButton}
              onClick={() => moverCarousel(carouselRef.current, "prev")}
              disabled={!podeVoltar || abrindoCarrinho}
              aria-label="Anterior"
            >
              <FiChevronLeft />
            </button>

            <button
              type="button"
              className={styles.navButton}
              onClick={() => moverCarousel(carouselRef.current, "next")}
              disabled={!podeAvancar || abrindoCarrinho}
              aria-label="Próximo"
            >
              <FiChevronRight />
            </button>

            <Link href={linkVerMais} className={styles.verMaisButton}>
              <span>{verMaisTexto}</span>
              <FiArrowRight className={styles.inlineIcon} />
            </Link>
          </div>
        </div>

        <div className={styles.carouselShell}>
          <div ref={carouselRef} className={styles.carousel}>
            {itens.map((item, index) => {
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
                <article
                  key={String(item.id_vitrine_item)}
                  className={`${styles.card} destaque-card`}
                >
                  <div className={styles.media}>
                    <Link href={item.link_final || "#"} className={styles.imageLink}>
                      {item.imagem_final ? (
                        <Image
                          src={item.imagem_final}
                          alt={item.titulo_final}
                          fill
                          sizes="(max-width: 480px) 86vw, (max-width: 768px) 78vw, (max-width: 1100px) 280px, 290px"
                          className={styles.image}
                          quality={75}
                          priority={index < 2}
                        />
                      ) : (
                        <div className={styles.noImage}>
                          <span>Sem imagem</span>
                        </div>
                      )}
                    </Link>

                    {item.economia_final && (
                      <span className={styles.economyBadge}>{item.economia_final}</span>
                    )}
                  </div>

                  <div className={styles.content}>
                    <div className={styles.meta}>
                      {item.marca_final && (
                        <span className={styles.chip}>{item.marca_final}</span>
                      )}

                      {item.sku_final && (
                        <span className={styles.chip}>SKU {item.sku_final}</span>
                      )}
                    </div>

                    <Link href={item.link_final || "#"} className={styles.cardLink}>
                      <h3 className={styles.cardTitle}>{item.titulo_final}</h3>
                    </Link>

                    {item.subtitulo_final && (
                      <p className={styles.subtitle}>{item.subtitulo_final}</p>
                    )}

                    {item.descricao_final && (
                      <p className={styles.text}>{item.descricao_final}</p>
                    )}

                    {(precoFormatado || precoOriginalFormatado) && (
                      <div className={styles.prices}>
                        {precoOriginalFormatado && (
                          <span className={styles.oldPrice}>
                            {precoOriginalFormatado}
                          </span>
                        )}

                        {precoFormatado && (
                          <strong className={styles.price}>{precoFormatado}</strong>
                        )}
                      </div>
                    )}

                    <div className={styles.actions}>
                      {item.tipo_item === "produto" ? (
                        <button
                          type="button"
                          className={styles.cartButton}
                          onClick={() => handleAdicionarCarrinho(item)}
                          disabled={estaAdicionando || abrindoCarrinho}
                        >
                          {estaAdicionando ? (
                            <FiLoader className={`${styles.inlineIcon} ${styles.spin}`} />
                          ) : abrindoCarrinho ? (
                            <FiCheckCircle className={styles.inlineIcon} />
                          ) : (
                            <FiShoppingCart className={styles.inlineIcon} />
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
                        <Link href={item.link_final || "#"} className={styles.cartButton}>
                          <FiArrowRight className={styles.inlineIcon} />
                          <span>Acessar</span>
                        </Link>
                      )}

                      <Link href={linkVisualizarCard} className={styles.viewButton}>
                        <FiEye className={styles.inlineIcon} />
                        <span>Visualizar</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className={`${styles.carouselFade} ${styles.left}`} />
          <div className={`${styles.carouselFade} ${styles.right}`} />
        </div>
      </div>

      <ModalCarrinho aberto={abrindoCarrinho} />
    </section>
  );
}