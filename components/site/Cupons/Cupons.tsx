"use client";

import { TicketPercent, CalendarDays, Copy, Check, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

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
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregarCupons = async () => {
      setLoading(true);
      setErro(null);

      try {
        const res = await api.get(rotas.cupons.ativos);

        if (res.data?.status !== 200) {
          setErro(res.data?.mensagem || "Erro ao carregar cupons.");
          setCupons([]);
          return;
        }

        const dados: Cupom[] = (res.data?.dados ?? []).map((c: any) => ({
          codigo: String(c.codigo ?? "").trim(),
          descricao: String(c.descricao ?? "").trim(),
          desconto:
            c.tipo_codigo === "frete"
              ? "FRETE GRÁTIS"
              : c.tipo_codigo === "valor"
              ? `R$ ${Number(c.desconto ?? 0).toFixed(2).replace(".", ",")}`
              : `${Number(c.desconto ?? 0)}%`,
          expiracao: c.expiracao ? c.expiracao.split("-").reverse().join("/") : "Indefinido",
          tipo: String(c.tipo_codigo ?? "padrao"),
        }));

        setCupons(dados);
      } catch (err: any) {
        console.error("Erro ao carregar cupons ativos:", err);
        setErro("Não foi possível carregar os cupons.");
        setCupons([]);
      } finally {
        setLoading(false);
      }
    };

    carregarCupons();
  }, []);

  const copiar = async (codigo: string) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(codigo);
      window.setTimeout(() => setCopiado(null), 1800);
    } catch {
      // fallback simples
      setCopiado(null);
    }
  };

  const theme = useMemo(
    () => ({
      rose: "#b76e79",
      roseSoft: "#d9a5ad",
      gold: "#d4af37",
      ink: "#1f2937",
      muted: "rgba(31,41,55,.70)",
      line: "rgba(31,41,55,.10)",
      cream: "#fff6ee",
      cream2: "#fff1e6",
      paper: "#ffffff",
    }),
    []
  );

  const corTipo = (tipo: string) => {
    switch (tipo) {
      case "frete":
        return `linear-gradient(135deg, ${theme.gold}, ${theme.roseSoft})`;
      case "valor":
        return `linear-gradient(135deg, ${theme.rose}, #923f45)`;
      default:
        return `linear-gradient(135deg, ${theme.roseSoft}, ${theme.gold})`;
    }
  };

  if (loading) {
    return (
      <section className="cx-section">
        <div className="cx-wrap">
          <div className="cx-head">
            <div className="cx-icon" aria-hidden="true">
              <Sparkles size={28} />
            </div>
            <div className="cx-titles">
              <div className="cx-titleSkel" />
              <div className="cx-subSkel" />
            </div>
          </div>

          <div className="cx-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="cx-card cx-skel">
                <div className="cx-skelTop" />
                <div className="cx-skelBody">
                  <div className="cx-line" />
                  <div className="cx-line short" />
                  <div className="cx-chip" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <style jsx>{styles}</style>
      </section>
    );
  }

  if (erro) {
    return (
      <section className="cx-section">
        <div className="cx-wrap">
          <div className="cx-state cx-erro">{erro}</div>
        </div>
        <style jsx>{styles}</style>
      </section>
    );
  }

  return (
    <section className="cx-section">
      <div className="cx-wrap">
        {/* HEADER */}
        <header className="cx-head">
          <div className="cx-icon" aria-hidden="true">
            <Sparkles size={28} />
          </div>

          <div className="cx-titles">
            <h2 className="cx-title">
              Cupons <span>Exclusivos</span>
            </h2>
            <p className="cx-sub">
              Copie o código e aproveite descontos especiais — com a cara do Universo Império.
            </p>
          </div>
        </header>

        {/* EMPTY */}
        {cupons.length === 0 ? (
          <div className="cx-empty">
            <div className="cx-emptyBadge">
              <TicketPercent size={18} />
            </div>
            <h3>Nenhum cupom disponível</h3>
            <p>Assim que tivermos promoções ativas, elas aparecem aqui.</p>
          </div>
        ) : (
          <div className="cx-grid">
            {cupons.map((cupom) => (
              <article key={cupom.codigo} className="cx-card">
                {/* Top */}
                <div className="cx-top" style={{ background: corTipo(cupom.tipo) }}>
                  <span className="cx-pill">
                    <TicketPercent size={14} /> Cupom
                  </span>

                  <div className="cx-discount">
                    <strong>{cupom.desconto}</strong>
                    {cupom.tipo !== "frete" && <small>OFF</small>}
                  </div>
                </div>

                {/* Body */}
                <div className="cx-body">
                  <p className="cx-desc">{cupom.descricao}</p>

                  <div className="cx-codeBox">
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

                  <div className="cx-meta">
                    <CalendarDays size={14} />
                    <span>Válido até: {cupom.expiracao}</span>
                  </div>
                </div>

                {/* decor */}
                <div className="cx-corner" aria-hidden="true" />
              </article>
            ))}
          </div>
        )}
      </div>

      <style jsx>{styles}</style>
    </section>
  );
}

const styles = `
  :global(:root){
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
    --shadowHover: 0 34px 90px rgba(31,41,55,.18);
    --radius: 26px;
  }

  .cx-section{
    background:
      radial-gradient(1100px 520px at 15% 0%, rgba(183,110,121,.14), transparent 60%),
      radial-gradient(900px 520px at 85% 0%, rgba(212,175,55,.12), transparent 60%),
      linear-gradient(135deg, var(--cream), var(--cream2));
    padding: clamp(22px, 4vw, 44px) 0;
  }

  .cx-wrap{
    width: min(1200px, 92vw);
    margin: 0 auto;
  }

  /* Header */
  .cx-head{
    display:flex;
    align-items:center;
    gap: 16px;
    margin-bottom: clamp(18px, 3vw, 28px);
  }

  .cx-icon{
    width: 64px;
    height: 64px;
    border-radius: 22px;
    display:grid;
    place-items:center;
    background: rgba(255,255,255,.82);
    border: 1px solid var(--line);
    box-shadow: 0 18px 44px rgba(31,41,55,.10);
    position: relative;
    overflow:hidden;
    flex: 0 0 auto;
  }
  .cx-icon::before{
    content:"";
    position:absolute;
    inset:-1px;
    background:
      radial-gradient(120px 80px at 20% 20%, rgba(183,110,121,.22), transparent 60%),
      radial-gradient(120px 80px at 80% 30%, rgba(212,175,55,.18), transparent 60%);
    pointer-events:none;
  }
  .cx-icon :global(svg){ position: relative; z-index: 1; color: var(--ink); }

  .cx-title{
    margin: 0;
    font-size: clamp(22px, 2.6vw, 34px);
    font-weight: 950;
    letter-spacing: -0.04em;
    color: var(--ink);
    line-height: 1.1;
  }
  .cx-title span{ color: var(--rose); }

  .cx-sub{
    margin: 8px 0 0;
    color: var(--muted);
    max-width: 64ch;
    font-size: 14px;
    line-height: 1.55;
  }

  /* Grid (responsivo top) */
  .cx-grid{
    display:grid;
    gap: 14px;
    grid-template-columns: repeat(1, minmax(0, 1fr));
  }
  @media (min-width: 560px){
    .cx-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
  }
  @media (min-width: 980px){
    .cx-grid{ grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
    .cx-head{ gap: 18px; }
    .cx-icon{ width: 74px; height: 74px; }
  }

  /* Card */
  .cx-card{
    position: relative;
    background: rgba(255,255,255,.86);
    border: 1px solid rgba(31,41,55,.10);
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: 0 18px 50px rgba(31,41,55,.10);
    transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
    min-height: 260px;
  }
  .cx-card:hover{
    transform: translateY(-6px);
    box-shadow: var(--shadowHover);
    border-color: rgba(183,110,121,.22);
  }

  .cx-top{
    padding: 18px 18px;
    color: #fff;
    display:flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
  }
  .cx-top::after{
    content:"";
    position:absolute;
    inset:0;
    background:
      radial-gradient(420px 140px at 20% 20%, rgba(255,255,255,.22), transparent 60%),
      radial-gradient(420px 140px at 80% 30%, rgba(0,0,0,.12), transparent 60%);
    pointer-events:none;
  }

  .cx-pill{
    position: relative;
    z-index: 1;
    background: rgba(255,255,255,.22);
    border: 1px solid rgba(255,255,255,.28);
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    display:inline-flex;
    align-items:center;
    gap: 8px;
    letter-spacing: .6px;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .cx-discount{
    position: relative;
    z-index: 1;
    text-align:right;
    line-height: 1;
  }
  .cx-discount strong{
    font-size: 28px;
    font-weight: 950;
  }
  .cx-discount small{
    display:block;
    margin-top: 6px;
    font-size: 11px;
    letter-spacing: 2px;
    opacity: .95;
  }

  .cx-body{
    padding: 18px;
    display:flex;
    flex-direction: column;
    gap: 12px;
  }

  .cx-desc{
    margin: 0;
    color: var(--muted);
    line-height: 1.55;
    font-size: 14px;
    min-height: 44px;
  }

  .cx-codeBox{
    background: rgba(255,255,255,.92);
    border: 1.8px dashed rgba(212,175,55,.45);
    border-radius: 18px;
    padding: 12px 12px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap: 10px;
    box-shadow: 0 14px 30px rgba(31,41,55,.08);
  }

  .cx-code{
    font-weight: 950;
    letter-spacing: 2px;
    color: var(--ink);
    font-size: 15px;
    text-transform: uppercase;
    overflow:hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 58%;
  }

  .cx-copy{
    border: 0;
    border-radius: 999px;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 950;
    display:flex;
    align-items:center;
    gap: 8px;
    cursor:pointer;
    color: #1f2937;
    background: linear-gradient(135deg, rgba(183,110,121,.26), rgba(212,175,55,.22));
    box-shadow: 0 12px 26px rgba(183,110,121,.14);
    transition: transform .16s ease, filter .16s ease, box-shadow .16s ease;
    white-space: nowrap;
    flex: 0 0 auto;
  }
  .cx-copy:hover{
    transform: translateY(-1px);
    filter: brightness(1.02);
    box-shadow: 0 18px 40px rgba(183,110,121,.20);
  }
  .cx-copy.is-copied{
    background: linear-gradient(135deg, rgba(212,175,55,.35), rgba(183,110,121,.20));
  }

  .cx-meta{
    display:flex;
    align-items:center;
    gap: 8px;
    color: var(--muted2);
    font-size: 13px;
  }

  .cx-corner{
    position:absolute;
    right:-64px;
    bottom:-64px;
    width: 170px;
    height: 170px;
    border-radius: 999px;
    background: radial-gradient(circle at 30% 30%, rgba(212,175,55,.22), rgba(183,110,121,.18), transparent 60%);
    pointer-events:none;
  }

  /* Empty */
  .cx-empty{
    background: rgba(255,255,255,.82);
    border: 1px solid var(--line);
    border-radius: 26px;
    padding: 26px;
    text-align:center;
    box-shadow: 0 18px 50px rgba(31,41,55,.10);
  }
  .cx-emptyBadge{
    width: 54px;
    height: 54px;
    margin: 0 auto 12px;
    border-radius: 18px;
    display:grid;
    place-items:center;
    background: linear-gradient(135deg, rgba(183,110,121,.22), rgba(212,175,55,.20));
    border: 1px solid rgba(31,41,55,.08);
  }
  .cx-empty h3{
    margin: 0 0 6px;
    font-weight: 950;
    color: var(--ink);
    letter-spacing: -0.02em;
  }
  .cx-empty p{
    margin: 0;
    color: var(--muted);
    line-height: 1.55;
  }

  /* Error */
  .cx-state{
    text-align:center;
    padding: 24px 14px;
    background: rgba(255,255,255,.82);
    border: 1px solid var(--line);
    border-radius: 22px;
    box-shadow: 0 18px 50px rgba(31,41,55,.10);
    color: var(--muted);
  }
  .cx-erro{ color: #b4232c; }

  /* Skeleton */
  .cx-skel{
    overflow:hidden;
  }
  .cx-skelTop{
    height: 84px;
    background: linear-gradient(90deg, rgba(31,41,55,.06), rgba(31,41,55,.10), rgba(31,41,55,.06));
    background-size: 300% 100%;
    animation: shimmer 1.2s linear infinite;
  }
  .cx-skelBody{
    padding: 18px;
    display:flex;
    flex-direction: column;
    gap: 10px;
  }
  .cx-line{
    height: 12px;
    border-radius: 10px;
    background: linear-gradient(90deg, rgba(31,41,55,.06), rgba(31,41,55,.10), rgba(31,41,55,.06));
    background-size: 300% 100%;
    animation: shimmer 1.2s linear infinite;
  }
  .cx-line.short{ width: 72%; }
  .cx-chip{
    height: 44px;
    border-radius: 18px;
    background: linear-gradient(90deg, rgba(31,41,55,.06), rgba(31,41,55,.10), rgba(31,41,55,.06));
    background-size: 300% 100%;
    animation: shimmer 1.2s linear infinite;
    margin-top: 4px;
  }
  .cx-titleSkel{
    width: min(420px, 68vw);
    height: 26px;
    border-radius: 14px;
    background: linear-gradient(90deg, rgba(31,41,55,.06), rgba(31,41,55,.10), rgba(31,41,55,.06));
    background-size: 300% 100%;
    animation: shimmer 1.2s linear infinite;
  }
  .cx-subSkel{
    width: min(520px, 76vw);
    height: 14px;
    border-radius: 10px;
    margin-top: 10px;
    background: linear-gradient(90deg, rgba(31,41,55,.06), rgba(31,41,55,.10), rgba(31,41,55,.06));
    background-size: 300% 100%;
    animation: shimmer 1.2s linear infinite;
  }

  @keyframes shimmer{
    0%{ background-position: 0% 50%; }
    100%{ background-position: 100% 50%; }
  }

  /* Mobile micro ajustes */
  @media (max-width: 420px){
    .cx-head{ align-items:flex-start; }
    .cx-icon{ width: 56px; height: 56px; border-radius: 18px; }
    .cx-sub{ font-size: 13px; }
    .cx-code{ max-width: 52%; }
  }
`;