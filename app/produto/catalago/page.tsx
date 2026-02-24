// app/produtos/catalogo/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Catálogo | Universo Império",
  description: "Catálogo de produtos",
};

export default function CatalogoPage() {
  return (
    <main className="wrap">
      <header className="header">
        <div className="crumbs">
          <Link href="/">Início</Link>
          <span className="sep">/</span>
          <span>Catálogo</span>
        </div>

        <h1 className="title">Catálogo</h1>
        <p className="subtitle">
          Página simples do catálogo. Depois você personaliza como quiser.
        </p>
      </header>

      <section className="content">
        <div className="card">
          <h2 className="cardTitle">Em construção</h2>
          <p className="cardText">
            Aqui você pode listar produtos, filtros por categoria, busca e
            paginação.
          </p>

          <div className="actions">
            <Link className="btnPrimary" href="/">
              Voltar para o início
            </Link>

            <a className="btnGhost" href="https://www.universoimperio.com.br">
              Site
            </a>
          </div>
        </div>
      </section>

      <style>{`
        .wrap{
          min-height: 100vh;
          padding: 34px 16px 60px;
          background: radial-gradient(1200px 520px at 18% 0%, #fffaf1 0%, #f6efe4 55%, #f1e7d9 100%);
        }

        .header{
          max-width: 980px;
          margin: 0 auto 18px;
        }

        .crumbs{
          display:flex;
          align-items:center;
          gap: 10px;
          font-size: 13px;
          font-weight: 800;
          color: #6b5a49;
          opacity: .95;
        }
        .crumbs a{
          color: inherit;
          text-decoration: none;
        }
        .crumbs a:hover{ text-decoration: underline; }
        .sep{ opacity: .6; }

        .title{
          margin: 10px 0 6px;
          font-size: 30px;
          letter-spacing: -0.7px;
          color:#3f3327;
          font-weight: 1000;
        }

        .subtitle{
          margin: 0;
          font-size: 13px;
          color:#6b5a49;
          font-weight: 650;
          opacity: .95;
        }

        .content{
          max-width: 980px;
          margin: 18px auto 0;
        }

        .card{
          border-radius: 22px;
          padding: 18px;
          border: 1px solid rgba(111, 92, 73, .16);
          background: linear-gradient(180deg, rgba(255,253,247,1) 0%, rgba(255,248,237,1) 100%);
          box-shadow: 0 18px 48px rgba(0,0,0,.10);
        }

        .cardTitle{
          margin: 0 0 6px;
          font-size: 18px;
          font-weight: 1000;
          color:#2f261e;
          letter-spacing: -0.2px;
        }

        .cardText{
          margin: 0 0 14px;
          font-size: 13px;
          line-height: 1.45;
          color:#6b5a49;
          font-weight: 650;
        }

        .actions{
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btnPrimary, .btnGhost{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 10px 12px;
          border-radius: 14px;
          font-weight: 1000;
          font-size: 13px;
          text-decoration:none;
          border: 1px solid transparent;
          cursor:pointer;
          user-select:none;
        }

        .btnPrimary{
          background: linear-gradient(135deg, #d1a67f 0%, #b88962 100%);
          color: #ffffff;
          box-shadow: 0 14px 28px rgba(184, 137, 98, .40);
          border-color: rgba(255,255,255,.18);
        }
        .btnPrimary:hover{ filter: brightness(1.02); }

        .btnGhost{
          background: rgba(255,255,255,.78);
          color:#3f3327;
          border-color: rgba(111, 92, 73, .18);
        }
        .btnGhost:hover{ filter: brightness(0.985); }

        @media (max-width: 520px){
          .title{ font-size: 24px; }
        }
      `}</style>
    </main>
  );
}