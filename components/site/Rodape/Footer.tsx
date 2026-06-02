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
} from "react-icons/fa";
import { SiPix } from "react-icons/si";
import api from "@/Api/conectar";
import styles from "./Footer.module.css";

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
    titulo: String(pick(item, "titulo", "título", "title") ?? "").trim() || undefined,
    valor: String(pick(item, "valor", "value") ?? "").trim() || undefined,
    url: String(pick(item, "url", "link") ?? "").trim() || undefined,
    icone: String(pick(item, "icone", "ícone", "icon") ?? "").trim() || undefined,
    posicao: Number(pick(item, "posicao", "posição", "position")) || 0,
  };
}

function normalizeFooterData(raw: any): FooterData | null {
  const source = raw?.dados?.dados ?? raw?.dados ?? raw ?? null;

  if (!source || typeof source !== "object") return null;

  const footerRaw = pick<Record<string, any>>(source, "footer", "rodape", "rodapé");

  const footer: FooterConfig | undefined = footerRaw
    ? {
        titulo: String(pick(footerRaw, "titulo", "título") ?? "").trim() || undefined,
        subtitulo:
          String(pick(footerRaw, "subtitulo", "subtítulo") ?? "").trim() || undefined,
        logo_texto:
          String(pick(footerRaw, "logo_texto", "logo texto") ?? "").trim() || undefined,
        descricao:
          String(pick(footerRaw, "descricao", "descrição") ?? "").trim() || undefined,
        copyright_texto:
          String(pick(footerRaw, "copyright_texto", "copyright texto") ?? "").trim() ||
          undefined,
      }
    : undefined;

  return {
    footer,
    links: Array.isArray(source.links) ? source.links.map(normalizeItem) : [],
    redes_sociais: Array.isArray(source.redes_sociais)
      ? source.redes_sociais.map(normalizeItem)
      : [],
    contatos: Array.isArray(source.contatos) ? source.contatos.map(normalizeItem) : [],
    pagamentos: Array.isArray(source.pagamentos) ? source.pagamentos.map(normalizeItem) : [],
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

  if (titulo.includes("telefone") || titulo.includes("celular") || titulo.includes("whatsapp")) {
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
  };

  const siMap: Record<string, ComponentType<any>> = {
    SiPix,
  };

  const Icon = faMap[clean] || siMap[clean];

  if (!Icon) return null;

  return <Icon aria-hidden="true" focusable="false" />;
}

function FooterSkeleton() {
  return (
    <footer className={styles.footer} aria-busy="true" aria-live="polite">
      <div className={styles.container}>
        <div className={styles.topGrid}>
          <section className={styles.brandCard}>
            <div className={styles.brandHeader}>
              <div className={styles.logo} />
              <div className={styles.skelBlock}>
                <div className={styles.skelTitle} />
                <div className={styles.skelSubtitle} />
              </div>
            </div>

            <div className={styles.skelTextLg} />
            <div className={styles.skelTextMd} />

            <div className={styles.badges}>
              <span className={styles.skelBadge} />
              <span className={styles.skelBadge} />
            </div>

            <div className={styles.social}>
              <span className={styles.skelSocial} />
              <span className={styles.skelSocial} />
              <span className={styles.skelSocial} />
              <span className={styles.skelSocial} />
            </div>
          </section>

          <section className={styles.column}>
            <div className={styles.skelSectionTitle} />
            <div className={styles.skelNavList}>
              <span className={styles.skelNavItem} />
              <span className={styles.skelNavItem} />
              <span className={styles.skelNavItem} />
              <span className={styles.skelNavItem} />
            </div>
          </section>

          <section className={styles.columnWide}>
            <div className={styles.skelSectionTitle} />
            <div className={styles.skelContactList}>
              <span className={styles.skelContactItem} />
              <span className={styles.skelContactItem} />
              <span className={styles.skelContactItem} />
            </div>
          </section>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <span className={styles.skelCopy} />
          <span className={styles.skelPayments} />
          <span className={styles.skelBottomLinks} />
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

  const links = useMemo(() => sortByPosition(data?.links || []), [data?.links]);
  const redesSociais = useMemo(
    () => sortByPosition(data?.redes_sociais || []),
    [data?.redes_sociais]
  );
  const contatos = useMemo(() => sortByPosition(data?.contatos || []), [data?.contatos]);
  const pagamentos = useMemo(() => sortByPosition(data?.pagamentos || []), [data?.pagamentos]);

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
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topGrid}>
          <section className={styles.brandCard} aria-labelledby="footer-brand-title">
            <div className={styles.brandHeader}>
              <div className={styles.logo} aria-hidden="true">
                {(footer?.logo_texto || "UI").slice(0, 3)}
              </div>

              <div>
                <h2 id="footer-brand-title" className={styles.brandTitle}>
                  {footer?.titulo || "Universo Império"}
                </h2>
                <p className={styles.brandSubtitle}>
                  {footer?.subtitulo || "Decorações & Eventos"}
                </p>
              </div>
            </div>

            <p className={styles.description}>
              {footer?.descricao ||
                "Produtos selecionados para festas e eventos. Atendimento rápido, qualidade premium e uma experiência confortável do início ao fim."}
            </p>

            <div className={styles.badges}>
              <span className={styles.badge}>Pagamento Seguro</span>
              <span className={styles.badge}>Suporte WhatsApp</span>
            </div>

            <nav className={styles.social} aria-label="Redes sociais">
              {redesSociais.map((rede, idx) => {
                const href = safeHref(rede.url);

                return (
                  <a
                    key={rede.id_item || idx}
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className={styles.socialLink}
                    title={rede.titulo || "Rede social"}
                    aria-label={rede.titulo || "Rede social"}
                  >
                    <DynamicIcon name={rede.icone} />
                  </a>
                );
              })}
            </nav>
          </section>

          <section className={styles.column} aria-labelledby="footer-nav-title">
            <h3 id="footer-nav-title" className={styles.sectionTitle}>
              Navegação
            </h3>

            <ul className={styles.linkList}>
              {navLinks.map((link, idx) => {
                const href = safeHref(link.url);
                const external = !isInternalHref(href);

                return (
                  <li key={link.id_item || idx}>
                    {external ? (
                      <a href={href} className={styles.navLink}>
                        <span>{link.titulo}</span>
                        <FaArrowRight className={styles.navArrow} aria-hidden="true" />
                      </a>
                    ) : (
                      <Link href={href} className={styles.navLink}>
                        <span>{link.titulo}</span>
                        <FaArrowRight className={styles.navArrow} aria-hidden="true" />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={styles.columnWide} aria-labelledby="footer-contact-title">
            <h3 id="footer-contact-title" className={styles.sectionTitle}>
              Contato
            </h3>

            <div className={styles.contactList}>
              {contatos.map((contato, idx) => {
                const href = resolveContactHref(contato);
                const external = href.startsWith("http");

                return (
                  <article key={contato.id_item || idx} className={styles.contactItem}>
                    <div className={styles.contactIcon} aria-hidden="true">
                      <DynamicIcon name={contato.icone} />
                    </div>

                    <div className={styles.contactTextBlock}>
                      <h4 className={styles.contactTitle}>{contato.titulo}</h4>

                      {contato.url || contato.valor ? (
                        <a
                          href={href}
                          className={styles.contactText}
                          target={external ? "_blank" : undefined}
                          rel={external ? "noopener noreferrer" : undefined}
                        >
                          {contato.valor || contato.url}
                        </a>
                      ) : (
                        <p className={styles.contactText}>Sem informação</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <div className={styles.divider} />

        <div className={styles.bottom}>
          <p className={styles.copy}>
            {footer?.copyright_texto || "© 2024 Universo Império. Todos os direitos reservados."}
          </p>

          <div className={styles.paymentWrap}>
            <span className={styles.paymentLabel}>Formas de pagamento:</span>

            <div className={styles.payments} aria-label="Formas de pagamento">
              {pagamentos.map((metodo, idx) => (
                <span
                  key={metodo.id_item || idx}
                  className={styles.paymentItem}
                  role="img"
                  aria-label={metodo.titulo || "Forma de pagamento"}
                  title={metodo.titulo || "Forma de pagamento"}
                >
                  <DynamicIcon name={metodo.icone} />
                </span>
              ))}
            </div>
          </div>

          <ul className={styles.bottomLinks}>
            {bottomLinks.map((item, idx) => {
              const href = safeHref(item.url);
              const external = !isInternalHref(href);

              return (
                <li key={item.id_item || idx}>
                  {external ? (
                    <a href={href} className={styles.bottomLink}>
                      {item.titulo}
                    </a>
                  ) : (
                    <Link href={href} className={styles.bottomLink}>
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