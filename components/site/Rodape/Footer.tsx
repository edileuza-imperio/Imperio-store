"use client";

import React from "react";
import Link from "next/link";
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

export default function FooterProfissional() {
  const links = [
    { titulo: "Sobre Nós", url: "/sobre" },
    { titulo: "Contato", url: "/contato" },
    { titulo: "Política de Privacidade", url: "/politica" },
    { titulo: "FAQ", url: "/faq" },
  ];

  const redesSociais = [
    { url: "https://www.facebook.com/imperioloja", label: "Facebook", icone: <FaFacebookF /> },
    { url: "https://www.instagram.com/imperio_festas12", label: "Instagram", icone: <FaInstagram /> },
    { url: "https://wa.me/5511991483834", label: "WhatsApp", icone: <FaWhatsapp /> },
  ];

  const metodosPagamento = [
    { label: "Visa", icone: <FaCcVisa /> },
    { label: "Mastercard", icone: <FaCcMastercard /> },
    { label: "PayPal", icone: <FaCcPaypal /> },
  ];

  return (
    <footer className="footer">
      <div className="container footer-wrapper">
        <div className="row g-4">
          {/* BRAND SECTION */}
          <div className="col-lg-5">
            <div className="footer-brand">
              <div className="footer-logo">UI</div>
              <div>
                <p className="footer-title">Universo Império</p>
                <p className="footer-subtitle">Decorações & Eventos</p>
              </div>
            </div>

            <p className="footer-description">
              Productos seleccionados para fiestas y eventos. Atención rápida, calidad y una experiencia premium del inicio al fin.
            </p>

            <div className="footer-badges">
              <span className="footer-badge">
                <span className="footer-badge-dot" /> Pago seguro
              </span>
              <span className="footer-badge">
                <span className="footer-badge-dot" /> Soporte en WhatsApp
              </span>
            </div>

            <div className="footer-social" aria-label="Redes sociales">
              {redesSociais.map((rede, idx) => (
                <a
                  key={idx}
                  href={rede.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-social-link"
                  title={rede.label}
                  aria-label={rede.label}
                >
                  {rede.icone}
                </a>
              ))}
            </div>
          </div>

          {/* LINKS SECTION */}
          <div className="col-lg-2 col-sm-6">
            <h3 className="footer-section-title">Navegación</h3>
            <ul className="footer-links">
              {links.map((link, idx) => (
                <li key={idx}>
                  <Link href={link.url} className="footer-link">
                    <span>{link.titulo}</span>
                    <FaArrowRight className="footer-link-arrow" size={12} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CONTACT SECTION */}
          <div className="col-lg-5">
            <h3 className="footer-section-title">Contacto</h3>
            <div className="footer-contact">
              <div className="footer-contact-item">
                <div className="footer-contact-icon">
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <h4 className="footer-contact-title">Dirección</h4>
                  <p className="footer-contact-text">
                    Calle Principal 123, São Paulo, SP 01234-567
                  </p>
                </div>
              </div>

              <div className="footer-contact-item">
                <div className="footer-contact-icon">
                  <FaEnvelope />
                </div>
                <div>
                  <h4 className="footer-contact-title">Email</h4>
                  <p className="footer-contact-text">
                    <a href="mailto:contato@imperio.com.br" className="footer-contact-link">
                      contato@imperio.com.br
                    </a>
                  </p>
                </div>
              </div>

              <div className="footer-contact-item">
                <div className="footer-contact-icon">
                  <FaPhoneAlt />
                </div>
                <div>
                  <h4 className="footer-contact-title">Teléfono</h4>
                  <p className="footer-contact-text">
                    <a href="tel:+5511991483834" className="footer-contact-link">
                      +55 (11) 99148-3834
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="footer-divider" />

        {/* BOTTOM SECTION */}
        <div className="footer-bottom">
          <p className="footer-bottom-text">
            © 2024 Universo Império. Todos los derechos reservados.
          </p>

          <div className="footer-payments">
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--color-textMuted)", marginRight: "8px" }}>
              Métodos de pago:
            </span>
            {metodosPagamento.map((metodo, idx) => (
              <div key={idx} className="footer-payment-item" title={metodo.label}>
                {metodo.icone}
              </div>
            ))}
          </div>

          <ul className="footer-bottom-links">
            <li>
              <a href="/politica" className="footer-bottom-link">
                Política de Privacidad
              </a>
            </li>
            <li>
              <a href="/terminos" className="footer-bottom-link">
                Términos de Servicio
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
