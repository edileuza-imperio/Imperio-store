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

import "./Destaques.css";

import { formatarPreco } from "@/hooks/destaque/functions";
import { moverCarousel } from "@/hooks/carrinho";
import { useAutoplayRef, useCarouselRef } from "@/hooks/vitrine.service";
import { rotas } from "@/components/Bibioteca/config/rotas";

import { ItemResolvido, useVitrine, Vitrine } from "./useVitrine";
import SkeletonDestaques from "./destaque/SkeletonDestaques";
import ModalCarrinho from "./modal/modal";

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
          router.push(rotas.paginas.carrinho);
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
    (vitrine.slug
      ? rotas.paginas.vitrine(vitrine.slug)
      : slug
      ? rotas.paginas.vitrine(slug)
      : "#");

  return (
    <section
      className={`destaques-section ${className}`}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={() => setPausado(true)}
      onTouchEnd={() => setPausado(false)}
    >
      <div className="destaques-container">
        <div className="destaques-header">
          <div className="destaques-header-text">
            <span className="destaques-badge">
              {vitrine.tipo || "Vitrine"}
            </span>

            <h2 className="destaques-title">
              {tituloPersonalizado || vitrine.titulo || vitrine.nome}
            </h2>

            {(subtituloPersonalizado || vitrine.subtitulo) && (
              <p className="destaques-description">
                {subtituloPersonalizado || vitrine.subtitulo}
              </p>
            )}
          </div>

          <div className="destaques-header-actions">
            <button
              type="button"
              className="destaques-nav-button"
              onClick={() => moverCarousel(carouselRef.current, "prev")}
              disabled={!podeVoltar || abrindoCarrinho}
              aria-label="Anterior"
            >
              <FiChevronLeft />
            </button>

            <button
              type="button"
              className="destaques-nav-button"
              onClick={() => moverCarousel(carouselRef.current, "next")}
              disabled={!podeAvancar || abrindoCarrinho}
              aria-label="Próximo"
            >
              <FiChevronRight />
            </button>

            <Link href={linkVerMais} className="destaques-ver-mais-button">
              <span>{verMaisTexto}</span>
              <FiArrowRight className="destaques-inline-icon" />
            </Link>
          </div>
        </div>

        <div className="destaques-carousel-shell">
          <div ref={carouselRef} className="destaques-carousel">
            {itens.map((item, index) => {
              const precoFormatado = formatarPreco(item.preco_final);
              const precoOriginalFormatado = formatarPreco(item.preco_original);

              const slugVisualizacao =
                item.slug_final ||
                (item.produto_id ? String(item.produto_id) : null) ||
                (item.campanha_id ? String(item.campanha_id) : null) ||
                (item.categoria_id ? String(item.categoria_id) : null);

              const linkVisualizarCard = slugVisualizacao
                ? rotas.paginas.vitrineVisualizar(slugVisualizacao)
                : "#";

              const estaAdicionando =
                adicionandoId === String(item.id_vitrine_item);

              const disponivel = Number(item.disponivel ?? 0);
              const esgotado = Boolean(item.esgotado);

              return (
                <article
                  key={String(item.id_vitrine_item)}
                  className="destaques-card destaque-card"
                >
                  <div className="destaques-media">
                    <Link
                      href={linkVisualizarCard}
                      className="destaques-image-link"
                    >
                      {item.imagem_final ? (
                        <Image
                          src={item.imagem_final}
                          alt={item.titulo_final}
                          fill
                          sizes="(max-width: 480px) 88vw, (max-width: 768px) 82vw, (max-width: 1100px) 42vw, 296px"
                          className={`destaques-image ${
                            esgotado ? "destaques-image-sold-out" : ""
                          }`}
                          quality={80}
                          priority={index < 2}
                        />
                      ) : (
                        <div className="destaques-no-image">
                          <span>Sem imagem</span>
                        </div>
                      )}
                    </Link>

                    {item.economia_final && !esgotado && (
                      <span className="destaques-economy-badge">
                        {item.economia_final}
                      </span>
                    )}

                    {esgotado && (
                      <span className="destaques-sold-out-badge">
                        Esgotado
                      </span>
                    )}
                  </div>

                  <div className="destaques-content">
                    <div className="destaques-meta">
                      {item.marca_final && (
                        <span className="destaques-chip">
                          {item.marca_final}
                        </span>
                      )}

                      {item.sku_final && (
                        <span className="destaques-chip">
                          SKU {item.sku_final}
                        </span>
                      )}
                    </div>

                    <Link
                      href={linkVisualizarCard}
                      className="destaques-card-link"
                    >
                      <h3 className="destaques-card-title">
                        {item.titulo_final}
                      </h3>
                    </Link>

                    {item.subtitulo_final && (
                      <p className="destaques-subtitle">
                        {item.subtitulo_final}
                      </p>
                    )}

                    {item.descricao_final && (
                      <p className="destaques-text">
                        {item.descricao_final}
                      </p>
                    )}

                    {(precoFormatado || precoOriginalFormatado) && (
                      <div className="destaques-prices">
                        {precoOriginalFormatado && (
                          <span className="destaques-old-price">
                            {precoOriginalFormatado}
                          </span>
                        )}

                        {precoFormatado && (
                          <strong className="destaques-price">
                            {precoFormatado}
                          </strong>
                        )}
                      </div>
                    )}

                    {item.tipo_item === "produto" && (
                      <div
                        className={`destaques-stock-info ${
                          esgotado
                            ? "destaques-stock-bad"
                            : "destaques-stock-ok"
                        }`}
                      >
                        {esgotado
                          ? "Produto indisponível"
                          : `${disponivel} em estoque`}
                      </div>
                    )}

                    <div className="destaques-actions">
                      {item.tipo_item === "produto" ? (
                        <button
                          type="button"
                          className={`destaques-cart-button ${
                            esgotado ? "destaques-cart-button-disabled" : ""
                          }`}
                          onClick={() => {
                            if (esgotado) return;
                            adicionarCarrinho(item);
                          }}
                          disabled={
                            estaAdicionando || abrindoCarrinho || esgotado
                          }
                        >
                          {estaAdicionando ? (
                            <FiLoader className="destaques-inline-icon destaques-spin" />
                          ) : abrindoCarrinho ? (
                            <FiCheckCircle className="destaques-inline-icon" />
                          ) : (
                            <FiShoppingCart className="destaques-inline-icon" />
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
                          className="destaques-cart-button"
                        >
                          <FiArrowRight className="destaques-inline-icon" />
                          <span>Acessar</span>
                        </Link>
                      )}

                      <Link
                        href={linkVisualizarCard}
                        className="destaques-view-button"
                      >
                        <FiEye className="destaques-inline-icon" />
                        <span>Visualizar</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="destaques-carousel-fade destaques-left" />
          <div className="destaques-carousel-fade destaques-right" />
        </div>
      </div>

      <ModalCarrinho aberto={abrindoCarrinho} />
    </section>
  );
}