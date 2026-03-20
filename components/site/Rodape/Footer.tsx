"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
  FaCcVisa,
  FaCcMastercard,
  FaCcPaypal,
  FaArrowRight,
} from "react-icons/fa";

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

type FooterResponse = {
  footer?: FooterConfig;
  links?: FooterItem[];
  redes_sociais?: FooterItem[];
  contatos?: FooterItem[];
  pagamentos?: FooterItem[];
};

export default function FooterProfissional() {
  const [data, setData] = useState<FooterResponse | null>(null);

  useEffect(() => {
    async function carregarFooter() {
      try {
        const response = await api.get("/footer");
        const dados = response?.data?.dados ?? response?.data ?? null;
        setData(dados);
      } catch (error) {
        console.error("Erro ao carregar footer:", error);
        setData(null);
      }
    }

    carregarFooter();
  }, []);

  const footer = data?.footer;

  const links = useMemo(
    () => [...(data?.links || [])].sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0)),
    [data?.links]
  );

  const redesSociais = useMemo(
    () => [...(data?.redes_sociais || [])].sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0)),
    [data?.redes_sociais]
  );

  const contatos = useMemo(
    () => [...(data?.contatos || [])].sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0)),
    [data?.contatos]
  );

  const metodosPagamento = useMemo(
    () => [...(data?.pagamentos || [])].sort((a, b) => (a.posicao ?? 0) - (b.posicao ?? 0)),
    [data?.pagamentos]
  );

  const renderIcone = (icone?: string) => {
    const nome = String(icone || "").toLowerCase();

    if (nome.includes("facebook")) return <FaFacebookF />;
    if (nome.includes("instagram")) return <FaInstagram />;
    if (nome.includes("whatsapp")) return <FaWhatsapp />;
    if (nome.includes("map")) return <FaMapMarkerAlt />;
    if (nome.includes("envelope") || nome.includes("mail")) return <FaEnvelope />;
    if (nome.includes("phone")) return <FaPhoneAlt />;
    if (nome.includes("visa")) return <FaCcVisa />;
    if (nome.includes("master")) return <FaCcMastercard />;
    if (nome.includes("paypal")) return <FaCcPaypal />;

    return null;
  };

  const bottomLinks = links.filter((item) => {
    const titulo = String(item.titulo || "").toLowerCase();
    return titulo.includes("política") || titulo.includes("termos");
  });

  const navLinks = links.filter((item) => {
    const titulo = String(item.titulo || "").toLowerCase();
    return !titulo.includes("termos") && !titulo.includes("política");
  });

  return (
    <footer className="footer">
      <div className="container footer-wrapper">
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="footer-brand">
              <div className="footer-logo">{footer?.logo_texto || "UI"}</div>
              <div>
                <p className="footer-title">{footer?.titulo || "Universo Império"}</p>
                <p className="footer-subtitle">
                  {footer?.subtitulo || "Decorações & Eventos"}
                </p>
              </div>
            </div>

            <p className="footer-description">
              {footer?.descricao ||
                "Produtos selecionados para festas e eventos. Atendimento rápido, qualidade premium e uma experiência luxuosa do início ao fim."}
            </p>

            <div className="footer-badges">
              <span className="footer-badge">
                <span className="footer-badge-dot" /> Pagamento Seguro
              </span>
              <span className="footer-badge">
                <span className="footer-badge-dot" /> Suporte WhatsApp
              </span>
            </div>

            <div className="footer-social" aria-label="Redes sociais">
              {redesSociais.map((rede, idx) => (
                <a
                  key={rede.id_item || idx}
                  href={rede.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-link"
                  title={rede.titulo || "Rede social"}
                  aria-label={rede.titulo || "Rede social"}
                >
                  {renderIcone(rede.icone)}
                </a>
              ))}
            </div>
          </div>

          <div className="col-lg-2 col-sm-6">
            <h3 className="footer-section-title">Navegação</h3>
            <ul className="footer-links">
              {navLinks.map((link, idx) => (
                <li key={link.id_item || idx}>
                  <Link href={link.url || "#"} className="footer-link">
                    <span>{link.titulo}</span>
                    <FaArrowRight className="footer-link-arrow" size={12} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-lg-5">
            <h3 className="footer-section-title">Contato</h3>
            <div className="footer-contact">
              {contatos.map((contato, idx) => (
                <div key={contato.id_item || idx} className="footer-contact-item">
                  <div className="footer-contact-icon">
                    {renderIcone(contato.icone)}
                  </div>
                  <div>
                    <h4 className="footer-contact-title">{contato.titulo}</h4>
                    <p className="footer-contact-text">
                      {contato.url ? (
                        <a href={contato.url} className="footer-contact-link">
                          {contato.valor}
                        </a>
                      ) : (
                        contato.valor
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="footer-divider" />

        <div className="footer-bottom">
          <p className="footer-bottom-text">
            {footer?.copyright_texto ||
              "© 2024 Universo Império. Todos os direitos reservados."}
          </p>

          <div className="footer-payments">
            <span
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--color-textMuted)",
                marginRight: "8px",
              }}
            >
              Formas de pagamento:
            </span>

            {metodosPagamento.map((metodo, idx) => (
              <div
                key={metodo.id_item || idx}
                className="footer-payment-item"
                title={metodo.titulo || "Pagamento"}
              >
                {renderIcone(metodo.icone)}
              </div>
            ))}
          </div>

          <ul className="footer-bottom-links">
            {bottomLinks.map((item, idx) => (
              <li key={item.id_item || idx}>
                <a href={item.url || "#"} className="footer-bottom-link">
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