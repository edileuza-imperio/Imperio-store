"use client";

import { TicketPercent, CalendarDays, Copy, Check, Sparkles } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import api from "@/Api/conectar";

interface Cupom {
  codigo: string;
  descricao: string;
  desconto: string;
  expiracao: string;
  tipo: string;
}

export default function Cupons() {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregarCupons = async () => {
      try {
        const res = await api.get("/cupons/ativos");
        const dados: Cupom[] = res.data.dados.map((c: any) => ({
          codigo: c.codigo,
          descricao: c.descricao,
          desconto:
            c.tipo_codigo === "frete"
              ? "FREE"
              : `${c.desconto}${c.tipo_codigo === "valor" ? "R$" : "%"}`,
          expiracao: c.expiracao ? c.expiracao.split("-").reverse().join("/") : "Indefinido",
          tipo: c.tipo_codigo,
        }));
        setCupons(dados);
      } catch (err) {
        console.error("Erro ao carregar cupons ativos:", err);
        setErro("Não foi possível carregar os cupons.");
      } finally {
        setLoading(false);
      }
    };

    carregarCupons();
  }, []);

  const copiar = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    setCopiado(codigo);
    setTimeout(() => setCopiado(null), 2000);
  };

  const theme = useMemo(
    () => ({
      rose: "#b76e79",
      roseSoft: "#d9a5ad",
      gold: "#d4af37",
      ink: "#1f2937",
      cream: "#fff6ee",
      cream2: "#fff1e6",
      line: "rgba(31,41,55,.10)",
      soft: "rgba(255,255,255,.78)",
      muted: "rgba(31,41,55,.70)",
    }),
    []
  );

  const corTipo = (tipo: string) => {
    // Tudo na paleta do site (sem verde neon)
    switch (tipo) {
      case "frete":
        // “frete grátis” com vibe premium (ouro + rose suave)
        return `linear-gradient(135deg, ${theme.gold}, ${theme.roseSoft})`;
      case "dourado":
        return `linear-gradient(135deg, ${theme.gold}, #b9932f)`;
      default:
        // padrão (rosa queimado)
        return `linear-gradient(135deg, ${theme.rose}, #923f45)`;
    }
  };

  if (loading) {
    return <div className="cx-state">Carregando cupons…</div>;
  }

  if (erro) {
    return <div className="cx-state cx-erro">{erro}</div>;
  }

  return (
    <section className="cx-section py-5">
      <div className="container">
        {/* CABEÇALHO */}
        <div className="text-center mb-5">
          <div className="cx-icon mb-3" aria-hidden="true">
            <Sparkles size={30} />
          </div>

          <h2 className="cx-title">
            Cupons <span>Exclusivos</span>
          </h2>

          <p className="cx-subtitle">
            Copie o código e aproveite descontos especiais — combina com sua festa e com seu bolso.
          </p>
        </div>

        {/* GRID */}
        <div className="row g-4">
          {cupons.length === 0 && <p className="text-center">Nenhum cupom disponível no momento.</p>}

          {cupons.map((cupom) => (
            <div key={cupom.codigo} className="col-lg-4 col-md-6">
              <article className="cx-card">
                {/* HEADER */}
                <div className="cx-head" style={{ background: corTipo(cupom.tipo) }}>
                  <span className="cx-badge">
                    <TicketPercent size={14} /> Cupom
                  </span>

                  <div className="cx-discount">
                    <strong>{cupom.desconto}</strong>
                    {cupom.tipo !== "frete" && <small>OFF</small>}
                  </div>
                </div>

                {/* BODY */}
                <div className="cx-body">
                  <p className="cx-desc">{cupom.descricao}</p>

                  {/* CÓDIGO */}
                  <div className="cx-codebox">
                    <span className="cx-code">{cupom.codigo}</span>

                    <button
                      type="button"
                      className={`cx-copy ${copiado === cupom.codigo ? "is-copied" : ""}`}
                      onClick={() => copiar(cupom.codigo)}
                      aria-label={`Copiar cupom ${cupom.codigo}`}
                    >
                      {copiado === cupom.codigo ? (
                        <>
                          <Check size={16} /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy size={16} /> Copiar
                        </>
                      )}
                    </button>
                  </div>

                  {/* INFO */}
                  <div className="cx-info">
                    <CalendarDays size={14} />
                    <span>Válido até: {cupom.expiracao}</span>
                  </div>
                </div>

                {/* “cantinho” decorativo */}
                <div className="cx-corner" aria-hidden="true" />
              </article>
            </div>
          ))}
        </div>
      </div>

      {/* CSS */}
      <style jsx>{`
        :root{
          --rose:#b76e79;
          --roseSoft:#d9a5ad;
          --gold:#d4af37;

          --ink:#1f2937;
          --muted: rgba(31,41,55,.72);
          --muted2: rgba(31,41,55,.58);

          --cream:#fff6ee;
          --cream2:#fff1e6;
          --paper:#ffffff;

          --line: rgba(31,41,55,.10);
          --shadow: 0 24px 60px rgba(31,41,55,.12);
        }

        .cx-section{
          background:
            radial-gradient(1100px 520px at 15% 0%, rgba(183,110,121,.14), transparent 60%),
            radial-gradient(900px 520px at 85% 0%, rgba(212,175,55,.12), transparent 60%),
            linear-gradient(135deg, var(--cream), var(--cream2));
          padding-bottom: 5rem;
        }

        .cx-state{
          text-align:center;
          padding: 3rem 1rem;
          font-size: 1.15rem;
          color: var(--muted);
        }
        .cx-erro{ color: #b4232c; }

        .cx-icon{
          width: 74px;
          height: 74px;
          margin: 0 auto;
          border-radius: 22px;
          display:flex;
          align-items:center;
          justify-content:center;
          color: var(--ink);
          background: rgba(255,255,255,.78);
          border: 1px solid var(--line);
          box-shadow: 0 18px 44px rgba(31,41,55,.10);
          position: relative;
          overflow:hidden;
        }
        .cx-icon::before{
          content:"";
          position:absolute;
          inset:-1px;
          background: radial-gradient(120px 80px at 20% 20%, rgba(183,110,121,.22), transparent 60%),
                      radial-gradient(120px 80px at 80% 30%, rgba(212,175,55,.18), transparent 60%);
          pointer-events:none;
        }
        .cx-icon :global(svg){ position: relative; z-index: 1; }

        .cx-title{
          font-size: 2.35rem;
          font-weight: 950;
          color: var(--ink);
          letter-spacing: -0.5px;
          margin: 0 0 8px;
        }
        .cx-title span{ color: var(--rose); }

        .cx-subtitle{
          color: var(--muted);
          max-width: 560px;
          margin: 0 auto;
        }

        .cx-card{
          position: relative;
          background: rgba(255,255,255,.86);
          border: 1px solid rgba(31,41,55,.10);
          border-radius: 26px;
          overflow: hidden;
          height: 100%;
          box-shadow: 0 18px 50px rgba(31,41,55,.10);
          transition: transform .22s ease, box-shadow .22s ease;
        }
        .cx-card:hover{
          transform: translateY(-6px);
          box-shadow: 0 26px 70px rgba(31,41,55,.16);
        }

        .cx-head{
          padding: 1.45rem 1.55rem;
          display:flex;
          justify-content:space-between;
          align-items:center;
          color: #fff;
          position: relative;
        }
        .cx-head::after{
          content:"";
          position:absolute;
          inset:0;
          background:
            radial-gradient(420px 140px at 20% 20%, rgba(255,255,255,.22), transparent 60%),
            radial-gradient(420px 140px at 80% 30%, rgba(0,0,0,.12), transparent 60%);
          pointer-events:none;
        }

        .cx-badge{
          position: relative;
          z-index: 1;
          background: rgba(255,255,255,.22);
          border: 1px solid rgba(255,255,255,.28);
          padding: 6px 14px;
          border-radius: 999px;
          font-size: .72rem;
          font-weight: 850;
          display:flex;
          align-items:center;
          gap: 7px;
          letter-spacing: .8px;
          text-transform: uppercase;
        }

        .cx-discount{
          position: relative;
          z-index: 1;
          text-align:right;
          line-height: 1;
        }
        .cx-discount strong{
          font-size: 2.25rem;
          font-weight: 950;
        }
        .cx-discount small{
          display:block;
          margin-top: 6px;
          font-size: .72rem;
          letter-spacing: 2px;
          opacity: .95;
        }

        .cx-body{
          padding: 1.6rem 1.55rem 1.55rem;
        }

        .cx-desc{
          color: var(--muted);
          margin: 0 0 1.15rem;
          line-height: 1.55;
          font-size: .95rem;
          min-height: 48px;
        }

        .cx-codebox{
          background: rgba(255,255,255,.92);
          border: 1.8px dashed rgba(212,175,55,.45);
          border-radius: 18px;
          padding: .95rem 1rem;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 10px;
          margin-bottom: 1rem;
          box-shadow: 0 14px 30px rgba(31,41,55,.08);
        }

        .cx-code{
          font-weight: 950;
          letter-spacing: 2px;
          color: var(--ink);
          font-size: 1.05rem;
          text-transform: uppercase;
        }

        .cx-copy{
          border: 0;
          border-radius: 999px;
          padding: .5rem .95rem;
          font-size: .78rem;
          font-weight: 900;
          display:flex;
          align-items:center;
          gap: 8px;
          cursor:pointer;
          color: #1f2937;
          background: linear-gradient(135deg, rgba(183,110,121,.26), rgba(212,175,55,.22));
          box-shadow: 0 12px 26px rgba(183,110,121,.14);
          transition: transform .16s ease, filter .16s ease, box-shadow .16s ease;
          white-space: nowrap;
        }
        .cx-copy:hover{
          transform: translateY(-1px);
          filter: brightness(1.02);
          box-shadow: 0 18px 40px rgba(183,110,121,.20);
        }

        .cx-copy.is-copied{
          background: linear-gradient(135deg, rgba(212,175,55,.35), rgba(183,110,121,.20));
        }

        .cx-info{
          font-size: .85rem;
          color: var(--muted2);
          display:flex;
          align-items:center;
          gap: 8px;
        }

        .cx-corner{
          position:absolute;
          right:-60px;
          bottom:-60px;
          width: 160px;
          height: 160px;
          border-radius: 999px;
          background: radial-gradient(circle at 30% 30%, rgba(212,175,55,.22), rgba(183,110,121,.18), transparent 60%);
          pointer-events:none;
        }

        @media (max-width: 768px){
          .cx-title{ font-size: 1.9rem; }
        }
      `}</style>
    </section>
  );
}
