"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import {
  FiArrowRight,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiLoader,
  FiShoppingCart,
} from "react-icons/fi";

import styles from "./Destaques.module.css";

import { formatarPreco } from "@/hooks/destaque/functions";
import { moverCarousel } from "@/hooks/carrinho";
import { useAutoplayRef, useCarouselRef } from "@/hooks/vitrine.service";

import ModalCarrinho from "@/app/(site)/Vitrine/Destaques/modal/modal";
import SkeletonDestaques from "@/app/(site)/Vitrine/Destaques/destaque/SkeletonDestaques";
import { ItemResolvido, useVitrine, Vitrine } from "./useVitrine";

type Props = {
  slug?: string;
  vitrine?: Vitrine | null;
  tituloPersonalizado?: string;
  subtituloPersonalizado?: string;
  limite?: number;
  className?: string;
  verMaisHref?: string;
  verMaisTexto?: string;
  onAdicionarCarrinho?: (item: ItemResolvido) => void;
};

function numero(valor: unknown): number {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function calcularDisponivel(item: any): number {
  const disponivel =
    item?.disponivel ??
    item?.estoque_disponivel ??
    item?.quantidade_disponivel ??
    item?.entidade?.disponivel ??
    item?.entidade?.estoque_disponivel ??
    item?.entidade?.quantidade_disponivel;

  if (disponivel !== undefined && disponivel !== null) {
    return Math.max(numero(disponivel), 0);
  }

  const quantidade = numero(
    item?.quantidade ??
      item?.estoque ??
      item?.entidade?.quantidade ??
      item?.entidade?.estoque ??
      0
  );

  const reservado = numero(
    item?.reservado ??
      item?.entidade?.reservado ??
      0
  );

  return Math.max(quantidade - reservado, 0);
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

  const [podeVoltar, setPodeVoltar] = useState(false);
  const [podeAvancar, setPodeAvancar] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [abrindoCarrinho, setAbrindoCarrinho] = useState(false);

  const carouselRef = useCarouselRef();
  const autoplayRef = useAutoplayRef();

  const { loading, erro, vitrine, itens, adicionandoId, adicionarCarrinho } =
    useVitrine({
      slug,
      vitrineProp,
      limite,
      onAdicionarCarrinho,
      onAbrirCarrinho: () => {
        setAbrindoCarrinho(true);

        window.setTimeout(() => {
          router.push("/Carrinho");
        }, 700);

        window.setTimeout(() => {
          setAbrindoCarrinho(false);
        }, 1200);
      },
    });

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
  }, [carouselRef, itens.length, loading]);

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
      const distancia = larguraCard + 18;

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
  }, [
    carouselRef,
    autoplayRef,
    loading,
    itens.length,
    pausado,
    abrindoCarrinho,
  ]);

  if (loading) {
    return <SkeletonDestaques className={className} />;
  }

  if (erro || !vitrine || itens.length === 0) {
    return null;
  }

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

              const estaAdicionando =
                adicionandoId === String(item.id_vitrine_item);

              const disponivel = calcularDisponivel(item);
              const esgotado = item.tipo_item === "produto" && disponivel <= 0;

              return (
                <article
                  key={String(item.id_vitrine_item)}
                  className={`${styles.card} destaque-card`}
                >
                  <div className={styles.media}>
                    <Link href={linkVisualizarCard} className={styles.imageLink}>
                      {item.imagem_final ? (
                        <Image
                          src={item.imagem_final}
                          alt={item.titulo_final}
                          fill
                          sizes="(max-width: 480px) 88vw, (max-width: 768px) 82vw, (max-width: 1100px) 42vw, 296px"
                          className={`${styles.image} ${
                            esgotado ? styles.imageSoldOut : ""
                          }`}
                          quality={80}
                          priority={index < 2}
                        />
                      ) : (
                        <div className={styles.noImage}>
                          <span>Sem imagem</span>
                        </div>
                      )}
                    </Link>

                    {item.economia_final && !esgotado && (
                      <span className={styles.economyBadge}>
                        {item.economia_final}
                      </span>
                    )}

                    {esgotado && (
                      <span className={styles.soldOutBadge}>
                        Esgotado
                      </span>
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

                    <Link href={linkVisualizarCard} className={styles.cardLink}>
                      <h3 className={styles.cardTitle}>
                        {item.titulo_final}
                      </h3>
                    </Link>

                    {item.subtitulo_final && (
                      <p className={styles.subtitle}>
                        {item.subtitulo_final}
                      </p>
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
                          <strong className={styles.price}>
                            {precoFormatado}
                          </strong>
                        )}
                      </div>
                    )}

                    {item.tipo_item === "produto" && (
                      <div
                        className={`${styles.stockInfo} ${
                          esgotado ? styles.stockBad : styles.stockOk
                        }`}
                      >
                        {esgotado
                          ? "Produto indisponível"
                          : `${disponivel} em estoque`}
                      </div>
                    )}

                    <div className={styles.actions}>
                      {item.tipo_item === "produto" ? (
                        <button
                          type="button"
                          className={`${styles.cartButton} ${
                            esgotado ? styles.cartButtonDisabled : ""
                          }`}
                          onClick={() => {
                            if (esgotado) return;
                            adicionarCarrinho(item);
                          }}
                          disabled={estaAdicionando || abrindoCarrinho || esgotado}
                        >
                          {estaAdicionando ? (
                            <FiLoader
                              className={`${styles.inlineIcon} ${styles.spin}`}
                            />
                          ) : abrindoCarrinho ? (
                            <FiCheckCircle className={styles.inlineIcon} />
                          ) : (
                            <FiShoppingCart className={styles.inlineIcon} />
                          )}

                          <span>
                            {esgotado
                              ? "Esgotado"
                              : estaAdicionando
                              ? "Adicionando..."
                              : abrindoCarrinho
                              ? "Abrindo..."
                              : "Carrinho"}
                          </span>
                        </button>
                      ) : (
                        <Link
                          href={item.link_final || linkVisualizarCard}
                          className={styles.cartButton}
                        >
                          <FiArrowRight className={styles.inlineIcon} />
                          <span>Acessar</span>
                        </Link>
                      )}

                      <Link
                        href={linkVisualizarCard}
                        className={styles.viewButton}
                      >
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