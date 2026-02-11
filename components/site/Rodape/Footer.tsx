"use client";

import React from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";

export default function FooterPrincipal() {
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

  return (
    <>
      <style>{`
        :root{
          /* Paleta do site (clara + rosa queimado + dourado) */
          --cream:#fff6ee;
          --cream2:#fff1e6;
          --paper:#ffffff;

          --text:#1f2937;     /* grafite */
          --muted:#6b7280;

          --rose:#b76e79;     /* rosa queimado */
          --roseSoft:#d9a5ad;
          --gold:#d4af37;

          --line: rgba(31,41,55,.10);
          --soft: rgba(255,255,255,.65);
          --shadow: 0 22px 60px rgba(31,41,55,.12);
        }

        .ft{
          background:
            radial-gradient(1100px 420px at 15% 0%, rgba(183,110,121,.14), transparent 60%),
            radial-gradient(900px 420px at 85% 0%, rgba(212,175,55,.12), transparent 60%),
            linear-gradient(180deg, var(--cream) 0%, var(--cream2) 100%);
          border-top: 1px solid var(--line);
          color: var(--text);
          position: relative;
          overflow: hidden;
        }

        /* linha superior “premium” */
        .ft::before{
          content:"";
          position:absolute;
          left:0; right:0; top:0;
          height:3px;
          background: linear-gradient(90deg, rgba(0,0,0,0), rgba(183,110,121,.65), rgba(212,175,55,.75), rgba(0,0,0,0));
        }

        .ft-wrap{
          padding: 52px 0 18px;
        }

        .ft-h{
          font-weight: 950;
          font-size: .9rem;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: rgba(31,41,55,.80);
          margin-bottom: 14px;
        }

        /* Brand */
        .ft-brand{
          display:flex;
          align-items:center;
          gap:12px;
          margin-bottom: 10px;
        }

        .ft-logo{
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: rgba(183,110,121,.14);
          border: 1px solid rgba(183,110,121,.22);
          box-shadow: 0 18px 40px rgba(183,110,121,.12);
          color: var(--text);
          font-weight: 950;
          letter-spacing: .6px;
          user-select:none;
        }

        .ft-title{
          margin:0;
          font-size: 1.2rem;
          font-weight: 950;
          line-height: 1.05;
          color: var(--text);
        }

        .ft-sub{
          margin:0;
          font-size: .9rem;
          color: rgba(31,41,55,.65);
        }

        .ft-desc{
          color: rgba(31,41,55,.72);
          margin: 10px 0 0;
          line-height: 1.55;
          font-size: .95rem;
          max-width: 520px;
        }

        /* Badges */
        .ft-badges{
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top: 16px;
        }

        .ft-badge{
          display:inline-flex;
          align-items:center;
          gap:10px;
          padding: 9px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,.70);
          border: 1px solid rgba(31,41,55,.10);
          color: rgba(31,41,55,.80);
          font-size: .88rem;
          box-shadow: 0 12px 26px rgba(31,41,55,.08);
          white-space: nowrap;
        }

        .ft-dot{
          width:10px;
          height:10px;
          border-radius: 999px;
          background: linear-gradient(135deg, var(--gold), var(--rose));
          box-shadow: 0 0 0 6px rgba(212,175,55,.10);
          flex:0 0 auto;
        }

        /* Social */
        .ft-social{
          display:flex;
          gap:10px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .ft-social a{
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: rgba(255,255,255,.78);
          border: 1px solid rgba(31,41,55,.10);
          color: rgba(31,41,55,.75);
          transition: .16s ease;
          font-size: 1.05rem;
          box-shadow: 0 14px 30px rgba(31,41,55,.08);
        }

        .ft-social a:hover{
          transform: translateY(-1px);
          color: #1f2937;
          background: linear-gradient(135deg, rgba(183,110,121,.22), rgba(212,175,55,.22));
          border-color: rgba(183,110,121,.30);
          box-shadow: 0 18px 44px rgba(183,110,121,.16);
        }

        /* Links (mais limpo e combinando) */
        .ft-links{
          list-style:none;
          padding:0;
          margin:0;
          display:flex;
          flex-direction:column;
          gap:10px;
        }

        .ft-link{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:14px;
          padding: 11px 12px;
          border-radius: 18px;
          text-decoration:none;
          color: rgba(31,41,55,.78);
          background: rgba(255,255,255,.72);
          border: 1px solid rgba(31,41,55,.10);
          transition: .16s ease;
          box-shadow: 0 14px 30px rgba(31,41,55,.08);
        }

        .ft-link-left{
          display:flex;
          align-items:center;
          gap:10px;
          font-weight: 800;
        }

        .ft-link-ico{
          width: 36px;
          height: 36px;
          border-radius: 16px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: rgba(183,110,121,.10);
          border: 1px solid rgba(183,110,121,.18);
          color: rgba(31,41,55,.85);
          flex: 0 0 auto;
        }

        .ft-link:hover{
          transform: translateY(-1px);
          border-color: rgba(183,110,121,.28);
          background: rgba(255,255,255,.86);
          box-shadow: 0 22px 50px rgba(183,110,121,.14);
        }

        .ft-link-arrow{
          color: rgba(183,110,121,.9);
          font-weight: 900;
          transition: .16s ease;
        }
        .ft-link:hover .ft-link-arrow{
          transform: translateX(2px);
        }

        /* Contato */
        .ft-contact{
          display:flex;
          flex-direction:column;
          gap:12px;
        }

        .ft-contact-item{
          display:flex;
          align-items:flex-start;
          gap:12px;
          padding: 12px;
          border-radius: 18px;
          background: rgba(255,255,255,.72);
          border: 1px solid rgba(31,41,55,.10);
          box-shadow: 0 14px 30px rgba(31,41,55,.08);
        }

        .ft-ico{
          width: 42px;
          height: 42px;
          border-radius: 16px;
          background: rgba(212,175,55,.10);
          border: 1px solid rgba(212,175,55,.22);
          display:flex;
          align-items:center;
          justify-content:center;
          color: rgba(31,41,55,.85);
          flex: 0 0 auto;
          margin-top: 1px;
        }

        .ft-ct-title{
          font-weight: 950;
          color: var(--text);
          margin: 0 0 2px;
          font-size: .95rem;
        }

        .ft-ct-text{
          margin:0;
          color: rgba(31,41,55,.72);
          font-size: .93rem;
          line-height: 1.35;
          word-break: break-word;
        }

        .ft-contact a{
          color: rgba(31,41,55,.82);
          font-weight: 850;
          text-decoration:none;
        }
        .ft-contact a:hover{
          color: var(--rose);
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .ft-divider{
          height: 1px;
          background: rgba(31,41,55,.10);
          margin: 26px 0 14px;
        }

        .ft-bottom{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 12px;
          color: rgba(31,41,55,.62);
          font-size: .9rem;
          padding-bottom: 18px;
        }

        .ft-bottom a{
          color: rgba(183,110,121,.95);
          text-decoration:none;
          font-weight: 900;
        }
        .ft-bottom a:hover{
          color: rgba(31,41,55,.95);
        }

        @media (max-width: 991.98px){
          .ft-wrap{ padding: 44px 0 16px; }
        }

        @media (max-width: 576px){
          .ft-wrap{ padding: 36px 0 14px; }
          .ft-bottom{ flex-direction: column; align-items:flex-start; }
        }
      `}</style>

      <footer className="ft">
        <div className="container ft-wrap">
          <div className="row g-4">
            {/* Brand */}
            <div className="col-lg-5">
              <div className="ft-brand">
                <div className="ft-logo">UI</div>
                <div>
                  <p className="ft-title">Universo Império</p>
                  <p className="ft-sub">Decorações & Eventos</p>
                </div>
              </div>

              <p className="ft-desc">
                Produtos selecionados para festas e eventos. Atendimento rápido, qualidade e uma experiência premium do início ao fim.
              </p>

              <div className="ft-badges">
                <span className="ft-badge">
                  <span className="ft-dot" /> Pagamento seguro
                </span>
                <span className="ft-badge">
                  <span className="ft-dot" /> Suporte no WhatsApp
                </span>
              </div>

              <div className="ft-social" aria-label="Redes sociais">
                {redesSociais.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" aria-label={r.label} title={r.label}>
                    {r.icone}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className="col-lg-3 col-md-6">
              <div className="ft-h">Navegação</div>
              <ul className="ft-links">
                {links.map((l, i) => (
                  <li key={i}>
                    <a className="ft-link" href={l.url}>
                      <span className="ft-link-left">
                        <span className="ft-link-ico">
                          <span className="ft-dot" style={{ width: 8, height: 8, boxShadow: "0 0 0 5px rgba(212,175,55,.10)" }} />
                        </span>
                        {l.titulo}
                      </span>
                      <span className="ft-link-arrow">→</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contato */}
            <div className="col-lg-4 col-md-6">
              <div className="ft-h">Contato</div>

              <div className="ft-contact">
                <div className="ft-contact-item">
                  <div className="ft-ico"><FaPhoneAlt /></div>
                  <div>
                    <p className="ft-ct-title">Telefone</p>
                    <p className="ft-ct-text">
                      <a href="tel:+5511991483834">(11) 99148-3834</a>
                    </p>
                  </div>
                </div>

                <div className="ft-contact-item">
                  <div className="ft-ico"><FaEnvelope /></div>
                  <div>
                    <p className="ft-ct-title">E-mail</p>
                    <p className="ft-ct-text">
                      <a href="mailto:imperiofestasecestas@gmail.com">imperiofestasecestas@gmail.com</a>
                    </p>
                  </div>
                </div>

                <div className="ft-contact-item">
                  <div className="ft-ico"><FaMapMarkerAlt /></div>
                  <div>
                    <p className="ft-ct-title">Endereço</p>
                    <p className="ft-ct-text">
                      Rua Manoel Fernandes, Jundiapeba, Mogi das Cruzes - SP
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="ft-divider" />

          <div className="ft-bottom">
            <div>© {new Date().getFullYear()} Universo Império. Todos os direitos reservados.</div>
            <div>
              <a href="/politica">Privacidade</a> • <a href="/faq">Ajuda</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
