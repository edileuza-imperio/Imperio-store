"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";

import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
  FaArrowRight,
  FaCcVisa,
  FaCcMastercard,
  FaCcPaypal,
  FaInfoCircle,
  FaFileContract,
  FaQuestionCircle,
  FaHome,
  FaUserFriends,
  FaShoppingBag,
  FaGift,
  FaShieldAlt,
  FaHeart,
} from "react-icons/fa";

import { SiPix } from "react-icons/si";

import api from "@/Api/conectar";
import "./Footer.css";

type FooterConfig = {
  titulo?: string;
  subtitulo?: string;
  logo_texto?: string;
  descricao?: string;
  copyright_texto?: string;
};

type FooterItem = {
  id_item?: number;
  titulo?: string;
  valor?: string;
  url?: string;
  icone?: string;
  posicao?: number;
};

type FooterData = {
  footer?: FooterConfig;
  links?: FooterItem[];
  redes_sociais?: FooterItem[];
  contatos?: FooterItem[];
  pagamentos?: FooterItem[];
};

type ApiFooterEnvelope = {
  status?: number;
  cache?: boolean;
  dados?: FooterData | Record<string, any>;
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function pick<T>(
  obj: Record<string, any> | undefined,
  ...keys: string[]
): T | undefined {
  if (!obj) return undefined;

  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key] as T;
  }

  return undefined;
}

function normalizeItem(item: Record<string, any>): FooterItem {
  return {
    id_item: Number(pick(item, "id_item")) || undefined,
    titulo:
      String(pick(item, "titulo", "título", "title") ?? "").trim() ||
      undefined,
    valor: String(pick(item, "valor", "value") ?? "").trim() || undefined,
    url: String(pick(item, "url", "link") ?? "").trim() || undefined,
    icone: String(pick(item, "icone", "ícone", "icon") ?? "").trim() || undefined,
    posicao: Number(pick(item, "posicao", "posição", "position")) || 0,
  };
}

function normalizeFooterData(raw: any): FooterData | null {
  const source = raw?.dados?.dados ?? raw?.dados ?? raw ?? null;

  if (!source || typeof source !== "object") return null;

  const footerRaw = pick<Record<string, any>>(
    source,
    "footer",
    "rodape",
    "rodapé"
  );

  const footer: FooterConfig | undefined = footerRaw
    ? {
        titulo:
          String(pick(footerRaw, "titulo", "título") ?? "").trim() ||
          undefined,
        subtitulo:
          String(pick(footerRaw, "subtitulo", "subtítulo") ?? "").trim() ||
          undefined,
        logo_texto:
          String(pick(footerRaw, "logo_texto", "logo texto") ?? "").trim() ||
          undefined,
        descricao:
          String(pick(footerRaw, "descricao", "descrição") ?? "").trim() ||
          undefined,
        copyright_texto:
          String(
            pick(footerRaw, "copyright_texto", "copyright texto") ?? ""
          ).trim() || undefined,
      }
    : undefined;

  return {
    footer,
    links: Array.isArray(source.links) ? source.links.map(normalizeItem) : [],
    redes_sociais: Array.isArray(source.redes_sociais)
      ? source.redes_sociais.map(normalizeItem)
      : [],
    contatos: Array.isArray(source.contatos)
      ? source.contatos.map(normalizeItem)
      : [],
    pagamentos: Array.isArray(source.pagamentos)
      ? source.pagamentos.map(normalizeItem)
      : [],
  };
}

function sortByPosition(items: FooterItem[]) {
  return [...items].sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0));
}

function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

function safeHref(href?: string) {
  const value = String(href ?? "").trim();
  return value && value !== "#" ? value : "#";
}

function resolveContactHref(item: FooterItem) {
  const titulo = normalizeText(item.titulo);
  const url = safeHref(item.url);
  const valor = String(item.valor ?? "").trim();

  if (titulo.includes("email")) {
    return url !== "#" ? url : valor ? `mailto:${valor}` : "#";
  }

  if (
    titulo.includes("telefone") ||
    titulo.includes("celular") ||
    titulo.includes("whatsapp")
  ) {
    const digits = valor.replace(/[^\d+]/g, "");
    return url !== "#" ? url : digits ? `tel:${digits}` : "#";
  }

  return url !== "#" ? url : valor || "#";
}

function DynamicIcon({ name }: { name?: string }) {
  if (!name) return null;

  const clean = name.trim();

  const faMap: Record<string, ComponentType<any>> = {
    FaFacebookF,
    FaInstagram,
    FaWhatsapp,
    FaMapMarkerAlt,
    FaEnvelope,
    FaPhoneAlt,
    FaArrowRight,
    FaCcVisa,
    FaCcMastercard,
    FaCcPaypal,
    FaInfoCircle,
    FaFileContract,
    FaQuestionCircle,
    FaHome,
    FaUserFriends,
    FaShoppingBag,
    FaGift,
    FaShieldAlt,
    FaHeart,
  };

  const siMap: Record<string, ComponentType<any>> = {
    SiPix,
  };

  const Icon = faMap[clean] || siMap[clean];

  if (!Icon) return null;

  return <Icon aria-hidden="true" focusable="false" />;
}

function getNavIcon(title?: string) {
  const titulo = normalizeText(title);

  if (titulo.includes("sobre")) return <FaInfoCircle aria-hidden="true" />;
  if (titulo.includes("quem")) return <FaUserFriends aria-hidden="true" />;
  if (titulo.includes("pergunta") || titulo.includes("faq")) {
    return <FaQuestionCircle aria-hidden="true" />;
  }
  if (titulo.includes("pedido")) return <FaShoppingBag aria-hidden="true" />;
  if (titulo.includes("troca") || titulo.includes("devolu")) {
    return <FaGift aria-hidden="true" />;
  }
  if (titulo.includes("termo") || titulo.includes("politica")) {
    return <FaFileContract aria-hidden="true" />;
  }

  return <FaHome aria-hidden="true" />;
}

function getContactFallbackIcon(title?: string) {
  const titulo = normalizeText(title);

  if (titulo.includes("email")) return <FaEnvelope aria-hidden="true" />;
  if (
    titulo.includes("telefone") ||
    titulo.includes("celular") ||
    titulo.includes("whatsapp")
  ) {
    return <FaPhoneAlt aria-hidden="true" />;
  }

  return <FaMapMarkerAlt aria-hidden="true" />;
}

const fallbackLinks: FooterItem[] = [
  { titulo: "Sobre Nós", url: "/sobre", posicao: 1 },
  { titulo: "Quem Somos", url: "/quem-somos", posicao: 2 },
  { titulo: "Perguntas Frequentes", url: "/perguntas-frequentes", posicao: 3 },
  { titulo: "Acompanhe seu Pedido", url: "/pedido", posicao: 4 },
  { titulo: "Trocas e Devoluções", url: "/trocas-e-devolucoes", posicao: 5 },
  { titulo: "Política de Privacidade", url: "/politica", posicao: 99 },
];

const fallbackSocial: FooterItem[] = [
  { titulo: "Facebook", url: "#", icone: "FaFacebookF", posicao: 1 },
  { titulo: "Instagram", url: "#", icone: "FaInstagram", posicao: 2 },
  { titulo: "WhatsApp", url: "#", icone: "FaWhatsapp", posicao: 3 },
];

const fallbackPayments: FooterItem[] = [
  { titulo: "Visa", icone: "FaCcVisa", posicao: 1 },
  { titulo: "Mastercard", icone: "FaCcMastercard", posicao: 2 },
  { titulo: "Pix", icone: "SiPix", posicao: 3 },
];

function FooterSkeleton() {
  return (
    <footer className="ui-footer" aria-busy="true" aria-live="polite">
      <div className="ui-footer-shell">
        <div className="ui-footer-grid">
          <section className="ui-footer-brand">
            <span className="ui-skeleton-logo" />
            <span className="ui-skeleton-title" />
            <span className="ui-skeleton-line" />
            <span className="ui-skeleton-line short" />
          </section>

          <section className="ui-footer-nav">
            <span className="ui-skeleton-title small" />
            <span className="ui-skeleton-nav" />
            <span className="ui-skeleton-nav" />
            <span className="ui-skeleton-nav" />
          </section>

          <section className="ui-footer-contact">
            <span className="ui-skeleton-title small" />
            <span className="ui-skeleton-contact" />
            <span className="ui-skeleton-contact" />
            <span className="ui-skeleton-contact" />
          </section>
        </div>
      </div>
    </footer>
  );
}

export default function FooterProfissional() {
  const [data, setData] = useState<FooterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function carregarFooter() {
      try {
        setLoading(true);
        const response = await api.get("/footer");
        const normalized = normalizeFooterData(response.data as ApiFooterEnvelope);

        if (active) {
          setData(normalized);
        }
      } catch (error) {
        console.error("Erro ao carregar footer:", error);
        if (active) {
          setData(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    carregarFooter();

    return () => {
      active = false;
    };
  }, []);

  const footer = data?.footer;

  const links = useMemo(() => {
    const items = data?.links?.length ? data.links : fallbackLinks;
    return sortByPosition(items);
  }, [data?.links]);

  const redesSociais = useMemo(() => {
    const items = data?.redes_sociais?.length
      ? data.redes_sociais
      : fallbackSocial;

    return sortByPosition(items);
  }, [data?.redes_sociais]);

  const contatos = useMemo(
    () => sortByPosition(data?.contatos || []),
    [data?.contatos]
  );

  const pagamentos = useMemo(() => {
    const items = data?.pagamentos?.length ? data.pagamentos : fallbackPayments;
    return sortByPosition(items);
  }, [data?.pagamentos]);

  const bottomLinks = useMemo(() => {
    return links.filter((item) => {
      const titulo = normalizeText(item.titulo);
      return (
        titulo.includes("politica") ||
        titulo.includes("termos") ||
        titulo.includes("privacidade")
      );
    });
  }, [links]);

  const navLinks = useMemo(() => {
    return links.filter((item) => {
      const titulo = normalizeText(item.titulo);
      return (
        !titulo.includes("politica") &&
        !titulo.includes("termos") &&
        !titulo.includes("privacidade")
      );
    });
  }, [links]);

  if (loading) return <FooterSkeleton />;

  return (
    <footer className="ui-footer">
      <div className="ui-footer-shell">
        <div className="ui-footer-grid">
          <section className="ui-footer-brand" aria-labelledby="footer-brand-title">
            <div className="ui-footer-logo-wrap" aria-hidden="true">
              <div className="ui-footer-crown">♛</div>

              <div className="ui-footer-logo">
                {(footer?.logo_texto || "UI").slice(0, 3)}
              </div>

              <span className="ui-footer-spark one">✦</span>
              <span className="ui-footer-spark two">✦</span>
            </div>

            <h2 id="footer-brand-title" className="ui-footer-brand-title">
              {footer?.titulo || "Universo Império"}
            </h2>

            <p className="ui-footer-brand-subtitle">
              {footer?.subtitulo || "Mimos & Presentes"}
            </p>

            <div className="ui-footer-mini-divider" aria-hidden="true">
              <span />
              <strong>♥</strong>
              <span />
            </div>

            <p className="ui-footer-description">
              {footer?.descricao ||
                "Produtos selecionados para festas e eventos. Atendimento rápido, qualidade premium e uma experiência confortável do início ao fim."}
            </p>

            <nav className="ui-footer-social" aria-label="Redes sociais">
              {redesSociais.map((rede, idx) => {
                const href = safeHref(rede.url);
                const external = href.startsWith("http");

                return (
                  <a
                    key={rede.id_item || idx}
                    href={href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                    className="ui-footer-social-link"
                    title={rede.titulo || "Rede social"}
                    aria-label={rede.titulo || "Rede social"}
                  >
                    <DynamicIcon name={rede.icone} />
                  </a>
                );
              })}
            </nav>
          </section>

          <section className="ui-footer-nav" aria-labelledby="footer-nav-title">
            <h3 id="footer-nav-title" className="ui-footer-section-title">
              Navegação
            </h3>

            <div className="ui-footer-title-divider" aria-hidden="true">
              <span />
              <strong>♥</strong>
              <span />
            </div>

            <ul className="ui-footer-link-list">
              {navLinks.map((link, idx) => {
                const href = safeHref(link.url);
                const external = !isInternalHref(href);

                const content = (
                  <>
                    <span className="ui-footer-nav-icon">
                      <DynamicIcon name={link.icone} />
                      {!link.icone && getNavIcon(link.titulo)}
                    </span>

                    <span>{link.titulo}</span>

                    <FaArrowRight
                      className="ui-footer-nav-arrow"
                      aria-hidden="true"
                    />
                  </>
                );

                return (
                  <li key={link.id_item || idx}>
                    {external ? (
                      <a href={href} className="ui-footer-nav-link">
                        {content}
                      </a>
                    ) : (
                      <Link href={href} className="ui-footer-nav-link">
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="ui-footer-contact" aria-labelledby="footer-contact-title">
            <h3 id="footer-contact-title" className="ui-footer-section-title">
              Contato
            </h3>

            <div className="ui-footer-title-divider" aria-hidden="true">
              <span />
              <strong>♥</strong>
              <span />
            </div>

            <div className="ui-footer-contact-list">
              {contatos.length === 0 && (
                <>
                  <article className="ui-footer-contact-item">
                    <span className="ui-footer-contact-icon">
                      <FaMapMarkerAlt aria-hidden="true" />
                    </span>

                    <div>
                      <h4>Endereço</h4>
                      <p>Atendimento online para todo o Brasil</p>
                    </div>
                  </article>

                  <article className="ui-footer-contact-item">
                    <span className="ui-footer-contact-icon">
                      <FaEnvelope aria-hidden="true" />
                    </span>

                    <div>
                      <h4>Email</h4>
                      <p>contato@imperio.com.br</p>
                    </div>
                  </article>
                </>
              )}

              {contatos.map((contato, idx) => {
                const href = resolveContactHref(contato);
                const external = href.startsWith("http");

                return (
                  <article
                    key={contato.id_item || idx}
                    className="ui-footer-contact-item"
                  >
                    <span className="ui-footer-contact-icon" aria-hidden="true">
                      <DynamicIcon name={contato.icone} />
                      {!contato.icone && getContactFallbackIcon(contato.titulo)}
                    </span>

                    <div>
                      <h4>{contato.titulo}</h4>

                      {contato.url || contato.valor ? (
                        <a
                          href={href}
                          className="ui-footer-contact-text"
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                        >
                          {contato.valor || contato.url}
                        </a>
                      ) : (
                        <p className="ui-footer-contact-text">Sem informação</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <div className="ui-footer-bottom">
          <p className="ui-footer-copy">
            <FaHeart aria-hidden="true" />
            <span>
              {footer?.copyright_texto ||
                "© 2024 Universo Império. Todos os direitos reservados."}
            </span>
          </p>

          <div className="ui-footer-payments-wrap">
            <span className="ui-footer-payment-label">Formas de pagamento</span>

            <div className="ui-footer-payments" aria-label="Formas de pagamento">
              {pagamentos.map((metodo, idx) => (
                <span
                  key={metodo.id_item || idx}
                  className="ui-footer-payment-item"
                  role="img"
                  aria-label={metodo.titulo || "Forma de pagamento"}
                  title={metodo.titulo || "Forma de pagamento"}
                >
                  <DynamicIcon name={metodo.icone} />
                  {!metodo.icone && <span>{metodo.titulo?.slice(0, 4)}</span>}
                </span>
              ))}
            </div>
          </div>

          <ul className="ui-footer-bottom-links">
            {bottomLinks.map((item, idx) => {
              const href = safeHref(item.url);
              const external = !isInternalHref(href);

              return (
                <li key={item.id_item || idx}>
                  {external ? (
                    <a href={href} className="ui-footer-bottom-link">
                      <FaShieldAlt aria-hidden="true" />
                      {item.titulo}
                    </a>
                  ) : (
                    <Link href={href} className="ui-footer-bottom-link">
                      <FaShieldAlt aria-hidden="true" />
                      {item.titulo}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </footer>
  );
}