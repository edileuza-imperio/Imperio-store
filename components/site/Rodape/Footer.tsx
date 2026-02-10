'use client';

import React from "react";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import 'bootstrap/dist/css/bootstrap.min.css';

export default function FooterPrincipal() {
  const links = [
    { titulo: "Sobre Nós", url: "/sobre" },
    { titulo: "Contato", url: "/contato" },
    { titulo: "Política de Privacidade", url: "/politica" },
    { titulo: "FAQ", url: "/faq" },
  ];

  const redesSociais = [
    { url: "https://www.facebook.com/imperioloja", icone: <FaFacebookF /> },
    { url: "https://www.instagram.com/imperio_festas12", icone: <FaInstagram /> },
  ];

  return (
    <>
      <style>{`
        .footer {
          background: linear-gradient(180deg, rgba(26,26,26,0.95) 0%, rgba(26,26,26,0.85) 100%);
          backdrop-filter: blur(12px);
          border-top: 3px solid #D4AF37;
          color: #fff;
          padding: 4rem 0 2rem;
          font-family: 'Segoe UI', sans-serif;
        }

        .footer-logo-text {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(90deg, #FF6F61, #D4AF37);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
          transition: all 0.3s ease;
        }

        .footer-logo-text:hover {
          transform: scale(1.05);
          filter: drop-shadow(0 0 8px #FF6F61);
        }

        .footer-desc {
          color: #FF6F61;
          font-weight: 500;
          font-size: 0.95rem;
          line-height: 1.4;
        }

        .footer-link {
          color: #D4AF37;
          text-decoration: none;
          transition: all 0.3s ease;
          display: inline-block;
          font-size: 0.95rem;
          position: relative;
        }

        .footer-link::after {
          content: '';
          display: block;
          width: 0;
          height: 2px;
          background: #FF6F61;
          transition: width 0.3s;
          position: absolute;
          bottom: -3px;
          left: 0;
        }

        .footer-link:hover::after {
          width: 100%;
        }

        .footer-social a {
          color: #D4AF37;
          font-size: 1.8rem;
          margin-right: 20px;
          transition: all 0.3s;
        }

        .footer-social a:hover {
          color: #FF6F61;
          transform: translateY(-5px) scale(1.3);
          filter: drop-shadow(0 0 8px #FF6F61);
        }

        .footer-end {
          color: #D4AF37;
          font-weight: 400;
          font-size: 0.9rem;
        }

        .footer-divider {
          border-color: #D4AF37;
          margin: 2.5rem 0;
        }

        .footer-copy {
          color: #D4AF37;
          font-size: 0.9rem;
          margin-top: 1rem;
        }

        @media (max-width: 992px) {
          .footer { padding: 3rem 1.5rem 2rem; }
          .footer-logo-text { font-size: 1.8rem; }
          .footer-social { justify-content: center !important; margin-top: 1rem; display: flex; }
        }

        @media (max-width: 768px) {
          .footer-logo-text { font-size: 1.6rem; }
          .footer-desc { font-size: 0.9rem; }
          .footer-link { font-size: 0.9rem; }
          .footer-end { font-size: 0.85rem; }
        }

        @media (max-width: 480px) {
          .footer-logo-text { font-size: 1.4rem; }
          .footer-desc { text-align: center; }
          .row { flex-direction: column !important; text-align: center; }
          .col-md-3, .col-md-6 { margin-bottom: 1.5rem; }
        }
      `}</style>

      <footer className="footer">
        <div className="container">
          <div className="row align-items-start">

            {/* Nome / Logo */}
            <div className="col-md-3 text-md-start text-center mb-4 mb-md-0">
              <div className="footer-logo-text">Imperio Store</div>
              <p className="footer-desc">Sua loja de confiança com produtos de qualidade.</p>
            </div>

            {/* Links */}
            <div className="col-md-6 mb-4 mb-md-0">
              <div className="row">
                <div className="col-6">
                  <ul className="list-unstyled">
                    {links.slice(0, 2).map((link, i) => (
                      <li key={i} className="mb-2">
                        <a href={link.url} className="footer-link">{link.titulo}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="col-6">
                  <ul className="list-unstyled">
                    {links.slice(2).map((link, i) => (
                      <li key={i} className="mb-2">
                        <a href={link.url} className="footer-link">{link.titulo}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="d-flex footer-social mt-3 justify-content-md-start justify-content-center">
                {redesSociais.map((redes, i) => (
                  <a key={i} href={redes.url} target="_blank" rel="noopener noreferrer">{redes.icone}</a>
                ))}
              </div>
            </div>

            {/* Contato / Informações */}
            <div className="col-md-3 text-md-end text-center">
              <p className="footer-end">(11) 99148-3834</p>
              <p className="footer-end">imperiofestasecestas@gmail.com</p>
              <p className="footer-end">Rua Manoel Fernandes, Jundiapeba, Mogi das Cruzes - SP</p>
              <p className="footer-end">
                <a href="https://www.instagram.com/imperio_festas12" target="_blank" rel="noopener noreferrer" className="footer-link">
                  Instagram
                </a>
              </p>
            </div>

          </div>

          <hr className="footer-divider" />

          <div className="text-center footer-copy">
            &copy; {new Date().getFullYear()} Imperio Store. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </>
  );
}
