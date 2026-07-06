"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

import {
  FiArrowRight,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiGift,
  FiHeart,
  FiLoader,
  FiPackage,
  FiShield,
  FiShoppingCart,
  FiTruck,
} from "react-icons/fi";

import "./Destaques.css";

import { imagemFundo } from "@/components/Bibioteca/imagem";
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

const CARD_LABELS = [
  "Mais amado",
  "Novidade",
  "Especial",
  "Presente ideal",
  "Seleção premium",
];

const TRUST_ITEMS = [
  {
    icon: FiTruck,
    title: "Entrega cuidadosa",
    text: "Produtos preparados com carinho",
  },
  {
    icon: FiShield,
    title: "Compra segura",
    text: "Pedido acompanhado do início ao fim",
  },
  {
    icon: FiGift,
    title: "Embalagem especial",
    text: "Detalhes pensados para presentear",
  },
  {
    icon: FiHeart,
    title: "Mimos selecionados",
    text: "Opções delicadas para momentos especiais",
  },
];

function limitarTexto(texto?: string | null, limite = 88) {
  if (!texto) return "";

  const limpo = String(texto).trim();
  return limpo.length > limite ? `${limpo.slice(0, limite)}...` : limpo;
}

function obterSeloCard(
  item: ItemResolvido,
  index: number,
  esgotado: boolean
) {
  if (esgotado) return "Esgotado";
  if (item.economia_final) return String(item.economia_final);

  return CARD_LABELS[index % CARD_LABELS.length];
}

function obterChipCard(
  item: ItemResolvido,
  tipoVitrine: string,
  esgotado: boolean
) {
  if (item.marca_final) return item.marca_final;
  if (esgotado) return "Indisponível";
  if (item.tipo_item === "produto") return "Universo Império";

  return tipoVitrine;
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
          setAbrindoCarrinho(false);
        }, 1600);
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
      const larguraCard = card?.offsetWidth || 276;
      const distancia = larguraCard + 18;

      const { scrollLeft, scrollWidth, clientWidth } = carousel;
      const maxScroll = scrollWidth - clientWidth;

      if (scrollLeft >= maxScroll - 8) {
        carousel.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        carousel.scrollBy({ left: distancia, behavior: "smooth" });
      }
    }, 3600);

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

  const totalItens = itens.length;

  const totalTexto = useMemo(() => {
    if (totalItens === 1) return "1 mimo selecionado";
    return `${totalItens} mimos selecionados`;
  }, [totalItens]);

  if (loading) {
    return <SkeletonDestaques className={className} />;
  }

  if (erro || !vitrine || itens.length === 0) {
    return null;
  }

  const tituloVitrine = tituloPersonalizado || vitrine.titulo || vitrine.nome;
  const subtituloVitrine = subtituloPersonalizado || vitrine.subtitulo;
  const tipoVitrine = vitrine.tipo || "Vitrine";

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
      aria-label={tituloVitrine || "Vitrine de produtos"}
    >
      <div className="destaques-container">
        <div className="destaques-header">
          <div className="destaques-header-text">
            <div className="destaques-kicker-row">
              <span className="destaques-badge">{tipoVitrine}</span>

              <span className="destaques-count">
                <FiPackage aria-hidden="true" />
                {totalTexto}
              </span>
            </div>

            <h2 className="destaques-title">{tituloVitrine}</h2>

            <div className="destaques-ornament" aria-hidden="true">
              <span />
              <strong>♥</strong>
              <span />
            </div>

            {subtituloVitrine && (
              <p className="destaques-description">{subtituloVitrine}</p>
            )}
          </div>

          <div className="destaques-header-actions">
            <button
              type="button"
              className="destaques-nav-button"
              onClick={() => moverCarousel(carouselRef.current, "prev")}
              disabled={!podeVoltar || abrindoCarrinho}
              aria-label="Mostrar produtos anteriores"
            >
              <FiChevronLeft aria-hidden="true" />
            </button>

            <button
              type="button"
              className="destaques-nav-button"
              onClick={() => moverCarousel(carouselRef.current, "next")}
              disabled={!podeAvancar || abrindoCarrinho}
              aria-label="Mostrar próximos produtos"
            >
              <FiChevronRight aria-hidden="true" />
            </button>

            <Link href={linkVerMais} className="destaques-ver-mais-button">
              <span>{verMaisTexto}</span>
              <FiArrowRight className="destaques-inline-icon" />
            </Link>
          </div>
        </div>

        <div className="destaques-carousel-shell">
          <div
            ref={carouselRef}
            className="destaques-carousel"
            aria-roledescription="carrossel"
          >
            {itens.map((item, index) => {
              const imagemProduto = imagemFundo(item.imagem_final);

              const precoFormatado = formatarPreco(item.preco_final);
              const precoOriginalFormatado = formatarPreco(item.preco_original);

              const slugVisualizacao =
                item.slug_final ||
                (item.produto_id ? String(item.produto_id) : null) ||
                (item.campanha_id ? String(item.campanha_id) : null) ||
                (item.categoria_id ? String(item.categoria_id) : null);

              const linkVisualizarCard =
                item.link_final ||
                (slugVisualizacao
                  ? rotas.paginas.vitrineVisualizar(slugVisualizacao)
                  : "#");

              const estaAdicionando =
                adicionandoId === String(item.id_vitrine_item);

              const disponivel = Number(item.disponivel ?? 0);

              const esgotado =
                item.tipo_item === "produto" &&
                (Boolean(item.esgotado) || disponivel <= 0);

              const seloCard = obterSeloCard(item, index, esgotado);
              const chipCard = obterChipCard(item, tipoVitrine, esgotado);
              const descricaoCurta = limitarTexto(item.descricao_final);

              return (
                <article
                  key={String(item.id_vitrine_item)}
                  className={`destaques-card destaque-card ${
                    esgotado ? "destaques-card-esgotado" : ""
                  }`}
                >
                  <div className="destaques-media">
                    <Link
                      href={linkVisualizarCard}
                      className="destaques-image-link"
                      aria-label={`Ver detalhes de ${
                        item.titulo_final || "produto"
                      }`}
                    >
                      {imagemProduto ? (
                        <Image
                          src={imagemProduto}
                          alt={item.titulo_final || "Produto"}
                          fill
                          sizes="(max-width: 480px) 84vw, (max-width: 1024px) 260px, 276px"
                          className={`destaques-image ${
                            esgotado ? "destaques-image-sold-out" : ""
                          }`}
                          quality={88}
                          priority={index < 2}
                        />
                      ) : (
                        <div className="destaques-no-image">
                          <FiGift aria-hidden="true" />
                          <span>Sem imagem</span>
                        </div>
                      )}
                    </Link>

                    <div className="destaques-media-overlay" />

                    <div className="destaques-media-top">
                      <span
                        className={`destaques-card-badge ${
                          esgotado
                            ? "destaques-card-badge-sold"
                            : item.economia_final
                            ? "destaques-card-badge-discount"
                            : ""
                        }`}
                      >
                        {seloCard}
                      </span>

                      <Link
                        href={linkVisualizarCard}
                        className="destaques-heart-button"
                        aria-label={`Ver ${item.titulo_final || "produto"}`}
                      >
                        <FiHeart aria-hidden="true" />
                      </Link>
                    </div>
                  </div>

                  <div className="destaques-content">
                    <div className="destaques-meta">
                      <span className="destaques-chip">{chipCard}</span>

                      {!esgotado && item.tipo_item === "produto" && (
                        <span className="destaques-chip destaques-chip-soft">
                          Pronta entrega
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

                    {descricaoCurta && (
                      <p className="destaques-text">{descricaoCurta}</p>
                    )}

                    {(precoFormatado || precoOriginalFormatado) && (
                      <div className="destaques-prices">
                        {precoOriginalFormatado && (
                          <span className="destaques-old-price">
                            {precoOriginalFormatado}
                          </span>
                        )}

                        {precoFormatado && (
                          <div className="destaques-price-row">
                            <span className="destaques-price-label">
                              Por apenas
                            </span>

                            <strong className="destaques-price">
                              {precoFormatado}
                            </strong>
                          </div>
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

                    <div className="destaques-mini-info">
                      <FiGift aria-hidden="true" />
                      <span>Ideal para presentear</span>
                    </div>

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
                              ? "Adicionado"
                              : "Adicionar"}
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
                        <span>Detalhes</span>
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

        <div className="destaques-benefits" aria-label="Benefícios da loja">
          {TRUST_ITEMS.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div key={benefit.title} className="destaques-benefit-item">
                <span className="destaques-benefit-icon">
                  <Icon aria-hidden="true" />
                </span>

                <span>
                  <strong>{benefit.title}</strong>
                  <small>{benefit.text}</small>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <ModalCarrinho aberto={abrindoCarrinho} />
    </section>
  );
}