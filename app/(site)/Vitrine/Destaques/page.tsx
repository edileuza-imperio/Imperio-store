// app/(site)/Vitrine/Destaques/page.tsx

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
} from "react-icons/fi";

import api from "@/Api/conectar";
import { imagemFundo } from "@/components/Bibioteca/imagem";
import { rotas } from "@/components/Bibioteca/config/rotas";
import "./Destaques.css";

type ItemVitrine = {
  id_vitrine_item?: number;
  produto_id?: number;
  campanha_id?: number;
  categoria_id?: number;
  tipo_item?: string;
  titulo_final?: string;
  descricao_final?: string;
  imagem_final?: string;
  slug_final?: string;
  link_final?: string;
  preco_final?: number | string;
  preco_original?: number | string;
  disponivel?: number | string;
  esgotado?: boolean;
};

type Vitrine = {
  id_vitrine?: number;
  id?: number;
  nome?: string;
  titulo?: string;
  subtitulo?: string | null;
  slug?: string;
  tipo?: string;
  status_id?: number | string;
  ordem?: number | string;
  itens?: ItemVitrine[];
};

function extrairLista(payload: any): Vitrine[] {
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function normalizarTexto(texto?: string | null) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ehCampanha(vitrine: Vitrine) {
  return normalizarTexto(vitrine.tipo).includes("campanha");
}

function ehVitrineParaDestaques(vitrine: Vitrine) {
  const tipo = normalizarTexto(vitrine.tipo);

  if (ehCampanha(vitrine)) return false;

  return (
    tipo === "produto" ||
    tipo === "categoria" ||
    tipo === "vitrine" ||
    tipo === ""
  );
}

function ordenarPorOrdem(a: Vitrine, b: Vitrine) {
  const ordemA = Number(a.ordem ?? 0);
  const ordemB = Number(b.ordem ?? 0);

  if (ordemA !== ordemB) return ordemA - ordemB;

  return Number(a.id_vitrine ?? a.id ?? 0) - Number(b.id_vitrine ?? b.id ?? 0);
}

function formatarPreco(valor?: number | string | null) {
  const numero = Number(valor ?? 0);

  if (!Number.isFinite(numero) || numero <= 0) {
    return "";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
}

function limitarTexto(texto?: string | null, limite = 82) {
  const limpo = String(texto || "").trim();

  if (!limpo) return "";

  return limpo.length > limite ? `${limpo.slice(0, limite)}...` : limpo;
}

function montarLinkItem(item: ItemVitrine) {
  if (item.link_final) return item.link_final;

  const identificador =
    item.slug_final ||
    item.produto_id ||
    item.campanha_id ||
    item.categoria_id;

  if (!identificador) return "#";

  return rotas.paginas.vitrineVisualizar(String(identificador));
}

function montarChaveVitrine(vitrine: Vitrine, index: number) {
  return String(vitrine.id_vitrine || vitrine.id || vitrine.slug || index);
}

function montarChaveItem(item: ItemVitrine, index: number) {
  return String(
    item.id_vitrine_item ||
      item.produto_id ||
      item.campanha_id ||
      item.categoria_id ||
      index
  );
}

function moverCarousel(
  element: HTMLDivElement | null,
  direction: "prev" | "next"
) {
  if (!element) return;

  const card = element.querySelector<HTMLElement>(".destaques-pro-card");
  const cardWidth = card?.offsetWidth || 280;
  const gap = 18;
  const distance = cardWidth + gap;

  element.scrollBy({
    left: direction === "next" ? distance : -distance,
    behavior: "smooth",
  });
}

function VitrineDestaqueSection({
  vitrine,
  index,
}: {
  vitrine: Vitrine;
  index: number;
}) {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [pausado, setPausado] = useState(false);

  const titulo = vitrine.titulo || vitrine.nome || "Produtos em destaque";
  const subtitulo =
    vitrine.subtitulo || "Selecionamos opções especiais para você.";

  const itens = vitrine.itens || [];

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel || itens.length <= 1) return;

    const intervalo = window.setInterval(() => {
      if (pausado) return;

      const card = carousel.querySelector<HTMLElement>(".destaques-pro-card");
      const larguraCard = card?.offsetWidth || 280;
      const distancia = larguraCard + 18;

      const maxScroll = carousel.scrollWidth - carousel.clientWidth;

      if (carousel.scrollLeft >= maxScroll - 12) {
        carousel.scrollTo({
          left: 0,
          behavior: "smooth",
        });
      } else {
        carousel.scrollBy({
          left: distancia,
          behavior: "smooth",
        });
      }
    }, 3800);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [itens.length, pausado]);

  return (
    <section
      className="destaques-pro-section"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onTouchStart={() => setPausado(true)}
      onTouchEnd={() => setPausado(false)}
    >
      <div className="destaques-pro-container">
        <div className="destaques-pro-header">
          <div className="destaques-pro-title-area">
            <span className="destaques-pro-kicker">Destaques</span>

            <h2>{titulo}</h2>
            <p>{subtitulo}</p>
          </div>

          {itens.length > 1 && (
            <div className="destaques-pro-controls">
              <button
                type="button"
                className="destaques-pro-nav"
                onClick={() => moverCarousel(carouselRef.current, "prev")}
                aria-label="Voltar produtos"
              >
                <FiChevronLeft />
              </button>

              <button
                type="button"
                className="destaques-pro-nav"
                onClick={() => moverCarousel(carouselRef.current, "next")}
                aria-label="Avançar produtos"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </div>

        {itens.length === 0 ? (
          <div className="destaques-pro-empty">
            Nenhum item cadastrado nesta vitrine ainda.
          </div>
        ) : (
          <div className="destaques-pro-carousel-shell">
            <div ref={carouselRef} className="destaques-pro-carousel">
              {itens.map((item, itemIndex) => {
                const imagem = imagemFundo(item.imagem_final);
                const preco = formatarPreco(item.preco_final);
                const precoOriginal = formatarPreco(item.preco_original);
                const link = montarLinkItem(item);

                const estoque = Number(item.disponivel ?? 0);
                const esgotado =
                  item.tipo_item === "produto" &&
                  (Boolean(item.esgotado) || estoque <= 0);

                return (
                  <Link
                    key={montarChaveItem(item, itemIndex)}
                    href={link}
                    className={`destaques-pro-card ${
                      esgotado ? "destaques-pro-card-disabled" : ""
                    }`}
                  >
                    <div className="destaques-pro-media">
                      {imagem ? (
                        <Image
                          src={imagem}
                          alt={item.titulo_final || "Produto"}
                          fill
                          sizes="(max-width: 768px) 78vw, 280px"
                          className="destaques-pro-image"
                          priority={index === 0 && itemIndex < 2}
                        />
                      ) : (
                        <div className="destaques-pro-no-image">
                          Sem imagem
                        </div>
                      )}

                      <div className="destaques-pro-media-gradient" />

                      {esgotado && (
                        <span className="destaques-pro-soldout">Esgotado</span>
                      )}
                    </div>

                    <div className="destaques-pro-content">
                      <span className="destaques-pro-tag">
                        {item.tipo_item === "categoria"
                          ? "Categoria especial"
                          : "Produto selecionado"}
                      </span>

                      <h3>{item.titulo_final || "Produto"}</h3>

                      {item.descricao_final && (
                        <p>{limitarTexto(item.descricao_final)}</p>
                      )}

                      <div className="destaques-pro-footer">
                        <div className="destaques-pro-price-area">
                          {precoOriginal && (
                            <span className="destaques-pro-old-price">
                              {precoOriginal}
                            </span>
                          )}

                          {preco ? (
                            <strong className="destaques-pro-price">
                              {preco}
                            </strong>
                          ) : (
                            <strong className="destaques-pro-price-soft">
                              Ver detalhes
                            </strong>
                          )}
                        </div>

                        <span className="destaques-pro-link-text">
                          Ver detalhes
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="destaques-pro-fade destaques-pro-fade-left" />
            <div className="destaques-pro-fade destaques-pro-fade-right" />
          </div>
        )}
      </div>
    </section>
  );
}

export default function Destaques() {
  const [vitrines, setVitrines] = useState<Vitrine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDestaques() {
      try {
        setLoading(true);

        const response = await api.get("/vitrines/com-itens", {
          withCredentials: true,
        });

        const lista = extrairLista(response.data);

        setVitrines(lista);
      } catch (error) {
        console.error("Erro ao carregar vitrines de destaque:", error);
        setVitrines([]);
      } finally {
        setLoading(false);
      }
    }

    carregarDestaques();
  }, []);

  const vitrinesDestaque = useMemo(() => {
    return vitrines
      .filter(ehVitrineParaDestaques)
      .filter((vitrine) => String(vitrine.status_id ?? "1") === "1")
      .sort(ordenarPorOrdem);
  }, [vitrines]);

  if (loading) {
    return (
      <section className="destaques-pro-section">
        <div className="destaques-pro-container">
          <div className="destaques-pro-loading">
            <FiLoader className="destaques-pro-spin" />
            Carregando destaques...
          </div>
        </div>
      </section>
    );
  }

  if (vitrinesDestaque.length === 0) {
    return null;
  }

  return (
    <>
      {vitrinesDestaque.map((vitrine, index) => (
        <VitrineDestaqueSection
          key={montarChaveVitrine(vitrine, index)}
          vitrine={vitrine}
          index={index}
        />
      ))}
    </>
  );
}