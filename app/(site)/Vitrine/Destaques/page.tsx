// app/(site)/Vitrine/Destaques/page.tsx

"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";

import Image from "next/image";
import Link from "next/link";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCreditCard,
  FiEye,
  FiLoader,
  FiLock,
  FiShield,
  FiShoppingCart,
  FiTruck,
} from "react-icons/fi";

import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import api from "@/Api/conectar";
import { imagemFundo } from "@/components/Bibioteca/imagem";
import { rotas } from "@/components/Bibioteca/config/rotas";
import "./Destaques.css";

type ApiResposta<T> = {
  status: number;
  mensagem: string;
  dados: T;
};

type VitrinesPayload = {
  vitrines: Vitrine[];
};

type ItemVitrine = {
  id_vitrine_item?: number;
  produto_id?: number;
  campanha_id?: number;
  categoria_id?: number;

  tipo_item?: "produto" | "campanha" | "categoria" | string;

  titulo_final?: string;
  subtitulo_final?: string | null;
  descricao_final?: string | null;
  imagem_final?: string | null;
  slug_final?: string | null;
  link_final?: string | null;

  preco_original?: number | string | null;
  preco_final?: number | string | null;
  preco_formatado?: string | null;
  preco_final_formatado?: string | null;
  preco_promocional_formatado?: string | null;

  quantidade?: number | string;
  reservado?: number | string;
  disponivel?: number | string;
  esgotado?: boolean | number | string;
};

type Vitrine = {
  id_vitrine?: number;
  nome?: string;
  slug?: string;
  titulo?: string;
  subtitulo?: string | null;
  tipo?: "produto" | "campanha" | "categoria" | string;
  status_id?: number | string;
  nivel_id?: number | string;
  ordem?: number | string;
  itens?: ItemVitrine[];
};

function extrairVitrines(payload: ApiResposta<VitrinesPayload>): Vitrine[] {
  return Array.isArray(payload?.dados?.vitrines) ? payload.dados.vitrines : [];
}

function normalizarTexto(texto?: string | null) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ehVitrineDeProduto(vitrine: Vitrine) {
  return normalizarTexto(vitrine.tipo) === "produto";
}

function ordenarPorOrdem(a: Vitrine, b: Vitrine) {
  const ordemA = Number(a.ordem ?? 0);
  const ordemB = Number(b.ordem ?? 0);

  if (ordemA !== ordemB) return ordemA - ordemB;

  return Number(a.id_vitrine ?? 0) - Number(b.id_vitrine ?? 0);
}

function converterNumero(valor: unknown) {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  if (typeof valor === "string") {
    const texto = valor.trim();

    if (!texto) return 0;

    // Banco/API geralmente retorna decimal como "39.00".
    // Se vier em pt-BR como "39,90", também funciona.
    const numero = texto.includes(",")
      ? Number(texto.replace(/\./g, "").replace(",", "."))
      : Number(texto);

    return Number.isFinite(numero) ? numero : 0;
  }

  return 0;
}

function formatarMoeda(valor?: number | string | null) {
  const numero = converterNumero(valor);

  if (numero <= 0) return "";

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numero);
}

function obterPrecoAtual(item: ItemVitrine) {
  return (
    item.preco_final_formatado ||
    item.preco_formatado ||
    item.preco_promocional_formatado ||
    formatarMoeda(item.preco_final)
  );
}

function obterPrecoAntigo(item: ItemVitrine) {
  const precoAtual = converterNumero(item.preco_final);
  const precoOriginal = converterNumero(item.preco_original);

  if (precoOriginal <= 0 || precoOriginal <= precoAtual) return "";

  return formatarMoeda(item.preco_original);
}

function limitarTexto(texto?: string | null, limite = 82) {
  const limpo = String(texto || "").trim();

  if (!limpo) return "";

  return limpo.length > limite ? `${limpo.slice(0, limite)}...` : limpo;
}

function montarLinkItem(item: ItemVitrine) {
  if (item.link_final) return item.link_final;

  if (item.slug_final) {
    return rotas.paginas.vitrineVisualizar(String(item.slug_final));
  }

  if (item.produto_id) {
    return rotas.paginas.vitrineVisualizar(String(item.produto_id));
  }

  return "#";
}

function montarChaveVitrine(vitrine: Vitrine, index: number) {
  return String(vitrine.id_vitrine || vitrine.slug || index);
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

function getProdutoId(item: ItemVitrine) {
  return Number(item.produto_id || 0);
}

function getItemKey(item: ItemVitrine) {
  return String(item.id_vitrine_item || item.produto_id || "");
}

function itemEstaEsgotado(item: ItemVitrine) {
  if (item.tipo_item !== "produto") return false;

  const disponivel = converterNumero(item.disponivel);
  const esgotado = String(item.esgotado ?? "0") === "1" || item.esgotado === true;

  return esgotado || disponivel <= 0;
}

function moverCarousel(
  element: HTMLDivElement | null,
  direction: "prev" | "next"
) {
  if (!element) return;

  const card = element.querySelector<HTMLElement>(".destaques-pro-card");
  const cardWidth = card?.offsetWidth || 292;
  const gap = 20;
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
  const [adicionandoProdutoId, setAdicionandoProdutoId] = useState<string | null>(
    null
  );

  const titulo = vitrine.titulo || vitrine.nome || "Produtos em destaque";
  const subtitulo =
    vitrine.subtitulo || "Selecionamos opções especiais para você.";

  const itens = useMemo(() => {
    return (vitrine.itens || []).filter((item) => item.tipo_item === "produto");
  }, [vitrine.itens]);

  async function adicionarAoCarrinho(
    event: MouseEvent<HTMLButtonElement>,
    item: ItemVitrine
  ) {
    event.preventDefault();
    event.stopPropagation();

    const produtoId = getProdutoId(item);

    if (!produtoId) {
      toast.error("Não foi possível identificar o produto.", {
        icon: false,
      });
      return;
    }

    const itemKey = getItemKey(item);

    try {
      setAdicionandoProdutoId(itemKey);

      await api.post(
        "/carrinho/adicionar",
        {
          produto_id: produtoId,
          quantidade: 1,
        },
        {
          withCredentials: true,
        }
      );

      toast.success(
        `${item.titulo_final || "Produto"} foi adicionado ao carrinho.`,
        {
          icon: <FiShoppingCart />,
        }
      );

      window.dispatchEvent(new CustomEvent("carrinho:atualizado"));
    } catch (error: any) {
      console.error("Erro ao adicionar ao carrinho:", error);

      toast.error(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          "Não foi possível adicionar ao carrinho.",
        {
          icon: false,
        }
      );
    } finally {
      setAdicionandoProdutoId(null);
    }
  }

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel || itens.length <= 1) return;

    const intervalo = window.setInterval(() => {
      if (pausado) return;

      const card = carousel.querySelector<HTMLElement>(".destaques-pro-card");
      const larguraCard = card?.offsetWidth || 292;
      const distancia = larguraCard + 20;

      const maxScroll = carousel.scrollWidth - carousel.clientWidth;

      if (carousel.scrollLeft >= maxScroll - 14) {
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
    }, 4200);

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
            <span className="destaques-pro-kicker">🇧🇷 Seleção especial</span>

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
            Nenhum produto cadastrado nesta vitrine ainda.
          </div>
        ) : (
          <>
            <div className="destaques-pro-carousel-shell">
              <div ref={carouselRef} className="destaques-pro-carousel">
                {itens.map((item, itemIndex) => {
                  const imagem = imagemFundo(item.imagem_final || "");
                  const preco = obterPrecoAtual(item);
                  const precoOriginal = obterPrecoAntigo(item);
                  const link = montarLinkItem(item);
                  const esgotado = itemEstaEsgotado(item);
                  const itemKey = getItemKey(item);
                  const estaAdicionando = adicionandoProdutoId === itemKey;

                  return (
                    <article
                      key={montarChaveItem(item, itemIndex)}
                      className={`destaques-pro-card ${
                        esgotado ? "destaques-pro-card-disabled" : ""
                      }`}
                    >
                      <Link href={link} className="destaques-pro-card-link">
                        <div className="destaques-pro-media">
                          {imagem ? (
                            <Image
                              src={imagem}
                              alt={item.titulo_final || "Produto"}
                              fill
                              sizes="(max-width: 768px) 82vw, 292px"
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
                            <span className="destaques-pro-soldout">
                              Esgotado
                            </span>
                          )}
                        </div>

                        <div className="destaques-pro-content">
                          <span className="destaques-pro-tag">
                            Produto selecionado
                          </span>

                          <h3>{item.titulo_final || "Produto"}</h3>

                          {item.descricao_final && (
                            <p>{limitarTexto(item.descricao_final)}</p>
                          )}
                        </div>
                      </Link>

                      <div className="destaques-pro-bottom">
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

                        <div className="destaques-pro-actions">
                          <Link
                            href={link}
                            className="destaques-pro-action-btn destaques-pro-action-view"
                            aria-label={`Visualizar ${
                              item.titulo_final || "produto"
                            }`}
                          >
                            <FiEye />
                            <span>Visualizar</span>
                          </Link>

                          <button
                            type="button"
                            className="destaques-pro-action-btn destaques-pro-action-cart"
                            aria-label={`Adicionar ${
                              item.titulo_final || "produto"
                            } ao carrinho`}
                            onClick={(event) => adicionarAoCarrinho(event, item)}
                            disabled={estaAdicionando || esgotado}
                          >
                            {estaAdicionando ? (
                              <FiLoader className="destaques-pro-spin" />
                            ) : (
                              <FiShoppingCart />
                            )}

                            <span>
                              {estaAdicionando ? "Adicionando" : "Carrinho"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="destaques-pro-fade destaques-pro-fade-left" />
              <div className="destaques-pro-fade destaques-pro-fade-right" />
            </div>

            <div
              className="destaques-pro-trust-bar"
              aria-label="Benefícios da compra"
            >
              <div className="destaques-pro-trust-item">
                <FiShield />
                <div>
                  <strong>Produtos oficiais</strong>
                  <span>Qualidade e autenticidade garantidas</span>
                </div>
              </div>

              <div className="destaques-pro-trust-item">
                <FiLock />
                <div>
                  <strong>Compra segura</strong>
                  <span>Ambiente protegido e confiável</span>
                </div>
              </div>

              <div className="destaques-pro-trust-item">
                <FiCreditCard />
                <div>
                  <strong>Parcele em até 6x</strong>
                  <span>Sem juros no cartão</span>
                </div>
              </div>

              <div className="destaques-pro-trust-item">
                <FiTruck />
                <div>
                  <strong>Entrega para todo o Brasil</strong>
                  <span>Com rastreamento completo</span>
                </div>
              </div>
            </div>
          </>
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

        const response = await api.get<ApiResposta<VitrinesPayload>>(
          "/vitrines/com-itens",
          {
            withCredentials: true,
          }
        );

        setVitrines(extrairVitrines(response.data));
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
      .filter(ehVitrineDeProduto)
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
      <ToastContainer
        position="top-right"
        autoClose={2600}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        className="destaques-toast-container"
        toastClassName="destaques-toast"
        progressClassName="destaques-toast-progress"
      />

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