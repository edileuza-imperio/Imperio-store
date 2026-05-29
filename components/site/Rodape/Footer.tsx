"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import * as FaIcons from "react-icons/fa";
import * as SiIcons from "react-icons/si";
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
  dados?: FooterData | { [key: string]: any };
};

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function pick<T>(obj: Record<string, any> | undefined, ...keys: string[]): T | undefined {
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
      String(
        pick(item, "titulo", "título", "title") ?? ""
      ).trim() || undefined,
    valor:
      String(
        pick(item, "valor", "value") ?? ""
      ).trim() || undefined,
    url:
      String(
        pick(item, "url", "link") ?? ""
      ).trim() || undefined,
    icone:
      String(
        pick(item, "icone", "ícone", "icon") ?? ""
      ).trim() || undefined,
    posicao: Number(pick(item, "posicao", "posição", "position")) || 0,
  };
}

function normalizeFooterData(raw: any): FooterData | null {
  const source =
    raw?.dados?.dados ??
    raw?.dados ??
    raw ??
    null;

  if (!source || typeof source !== "object") return null;

  const footerRaw =
    pick<Record<string, any>>(source, "footer", "rodape", "rodapé") ?? undefined;

  const footer: FooterConfig | undefined = footerRaw
    ? {
        titulo: String(
          pick(footerRaw, "titulo", "título") ?? ""
        ).trim() || undefined,
        subtitulo: String(
          pick(footerRaw, "subtitulo", "subtítulo") ?? ""
        ).trim() || undefined,
        logo_texto: String(
          pick(footerRaw, "logo_texto", "logo texto") ?? ""
        ).trim() || undefined,
        descricao: String(
          pick(footerRaw, "descricao", "descrição") ?? ""
        ).trim() || undefined,
        copyright_texto: String(
          pick(footerRaw, "copyright_texto", "copyright texto") ?? ""
        ).trim() || undefined,
      }
    : undefined;

  const links = Array.isArray(source.links) ? source.links.map(normalizeItem) : [];
  const redes_sociais = Array.isArray(source.redes_sociais)
    ? source.redes_sociais.map(normalizeItem)
    : [];
  const contatos = Array.isArray(source.contatos)
    ? source.contatos.map(normalizeItem)
    : [];
  const pagamentos = Array.isArray(source.pagamentos)
    ? source.pagamentos.map(normalizeItem)
    : [];

  return {
    footer,
    links,
    redes_sociais,
    contatos,
    pagamentos,
  };
}

function DynamicIcon({ name }: { name?: string }) {
  if (!name) return null;

  const clean = name.trim();

  const faMap: Record<string, React.ComponentType<any>> = {
    FaFacebookF: FaIcons.FaFacebookF,
    FaInstagram: FaIcons.FaInstagram,
    FaWhatsapp: FaIcons.FaWhatsapp,
    FaMapMarkerAlt: FaIcons.FaMapMarkerAlt,
    FaEnvelope: FaIcons.FaEnvelope,
    FaPhoneAlt: FaIcons.FaPhoneAlt,
    FaArrowRight: FaIcons.FaArrowRight,
    FaCcVisa: FaIcons.FaCcVisa,
    FaCcMastercard: FaIcons.FaCcMastercard,
    FaCcPaypal: FaIcons.FaCcPaypal,
    FaInfoCircle: FaIcons.FaInfoCircle,
    FaFileContract: FaIcons.FaFileContract,
    FaQuestionCircle: FaIcons.FaQuestionCircle,
  };

  const siMap: Record<string, React.ComponentType<any>> = {
    SiPix: SiIcons.SiPix,
  };

  const Icon = faMap[clean] || siMap[clean];

  if (!Icon) return null;

  return <Icon />;
}

function sortByPosition(items: FooterItem[]) {
  return [...items].sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0));
}

export default function FooterProfissional() {
  const [data, setData] = useState<FooterData | null>(null);

  useEffect(() => {
    async function carregarFooter() {
      try {
        const response = await api.get("/footer");
        const normalized = normalizeFooterData(response.data as ApiFooterEnvelope);
        setData(normalized);
      } catch (error) {
        console.error("Erro ao carregar footer:", error);
        setData(null);
      }
    }

    carregarFooter();
  }, []);

  const footer = data?.footer;

  const links = useMemo(() => sortByPosition(data?.links || []), [data?.links]);
  const redesSociais = useMemo(
    () => sortByPosition(data?.redes_sociais || []),
    [data?.redes_sociais]
  );
  const contatos = useMemo(
    () => sortByPosition(data?.contatos || []),
    [data?.contatos]
  );
  const pagamentos = useMemo(
    () => sortByPosition(data?.pagamentos || []),
    [data?.pagamentos]
  );

  const bottomLinks = useMemo(() => {
    return links.filter((item) => {
      const titulo = normalizeText(item.titulo);
      return titulo.includes("politica") || titulo.includes("termos") || titulo.includes("privacidade");
    });
  }, [links]);

  const navLinks = useMemo(() => {
    return links.filter((item) => {
      const titulo = normalizeText(item.titulo);
      return !titulo.includes("politica") && !titulo.includes("termos") && !titulo.includes("privacidade");
    });
  }, [links]);

  const contatoLink = (item: FooterItem) => {
    const titulo = normalizeText(item.titulo);
    const url = item.url || "#";

    if (titulo.includes("email")) return url || `mailto:${item.valor ?? ""}`;
    if (titulo.includes("telefone") || titulo.includes("celular")) return url || `tel:${item.valor ?? ""}`;
    return url;
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topGrid}>
          <section className={styles.brandCard}>
            <div className={styles.brandHeader}>
              <div className={styles.logo}>{footer?.logo_texto || "UI"}</div>
              <div>
                <h2 className={styles.brandTitle}>{footer?.titulo || "Universo Império"}</h2>
                <p className={styles.brandSubtitle}>{footer?.subtitulo || "Decorações & Eventos"}</p>
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

            <div className={styles.social} aria-label="Redes sociais">
              {redesSociais.map((rede, idx) => (
                <a
                  key={rede.id_item || idx}
                  href={rede.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialLink}
                  title={rede.titulo || "Rede social"}
                  aria-label={rede.titulo || "Rede social"}
                >
                  <DynamicIcon name={rede.icone} />
                </a>
              ))}
            </div>
          </section>

          <section className={styles.column}>
            <h3 className={styles.sectionTitle}>Navegação</h3>
            <ul className={styles.linkList}>
              {navLinks.map((link, idx) => (
                <li key={link.id_item || idx}>
                  <Link href={link.url || "#"} className={styles.navLink}>
                    <span>{link.titulo}</span>
                    <FaIcons.FaArrowRight className={styles.navArrow} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.columnWide}>
            <h3 className={styles.sectionTitle}>Contato</h3>
            <div className={styles.contactList}>
              {contatos.map((contato, idx) => (
                <div key={contato.id_item || idx} className={styles.contactItem}>
                  <div className={styles.contactIcon}>
                    <DynamicIcon name={contato.icone} />
                  </div>

                  <div className={styles.contactTextBlock}>
                    <h4 className={styles.contactTitle}>{contato.titulo}</h4>
                    {contato.url || contato.valor ? (
                      <a
                        href={contatoLink(contato)}
                        className={styles.contactText}
                        target={normalizeText(contato.titulo).includes("http") ? "_blank" : undefined}
                        rel={normalizeText(contato.titulo).includes("http") ? "noopener noreferrer" : undefined}
                      >
                        {contato.valor}
                      </a>
                    ) : (
                      <p className={styles.contactText}>{contato.valor}</p>
                    )}
                  </div>
                </div>
              ))}
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

            <div className={styles.payments}>
              {pagamentos.map((metodo, idx) => (
                <div
                  key={metodo.id_item || idx}
                  className={styles.paymentItem}
                  title={metodo.titulo || "Pagamento"}
                  aria-label={metodo.titulo || "Pagamento"}
                >
                  <DynamicIcon name={metodo.icone} />
                </div>
              ))}
            </div>
          </div>

          <ul className={styles.bottomLinks}>
            {bottomLinks.map((item, idx) => (
              <li key={item.id_item || idx}>
                <a href={item.url || "#"} className={styles.bottomLink}>
                  {item.titulo}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}