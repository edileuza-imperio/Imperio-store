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
          descricao: String(c.descricao ?? ""),
          desconto:
            c.tipo_codigo === "frete"
              ? "FRETE GRÁTIS"
              : c.tipo_codigo === "valor"
              ? `R$ ${c.desconto}`
              : `${c.desconto}%`,
          expiracao: c.expiracao ? String(c.expiracao).split("-").reverse().join("/") : "Indefinido",
          tipo: String(c.tipo_codigo ?? ""),
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
      setTimeout(() => setCopiado(null), 1600);
    } catch {
      setErro("Não foi possível copiar. Copie manualmente.");
    }
  };

  const theme = useMemo(
    () => ({
      rose: "#b76e79",
      roseSoft: "#d9a5ad",
      gold: "#d4af37",
      ink: "#0b1220",
      muted: "rgba(31,41,55,.72)",
      paper: "rgba(255,255,255,.92)",
      line: "rgba(31,41,55,.10)",
      shadow: "0 22px 64px rgba(2, 6, 23, .10)",
      shadowHover: "0 30px 84px rgba(2, 6, 23, .14)",
      cream: "#fff6ee",
      cream2: "#fff1e6",
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
      <section className="cx-wrap">
        <div className="cx-container">
          <div className="cx-state">Carregando cupons…</div>
        </div>

        <style jsx>{styles(theme)}</style>
      </section>
    );
  }

  if (erro) {
    return (
      <section className="cx-wrap">
        <div className="cx-container">
          <div className="cx-state cx-err">{erro}</div>
        </div>

        <style jsx>{styles(theme)}</style>
      </section>
    );
  }

  return (
    <section className="cx-wrap">
      <div className="cx-container">
        {/* Header */}
        <header className="cx-head">
          <div className="cx-mark" aria-hidden="true">
            <Sparkles size={22} />
          </div>

          <div className="cx-titles">
            <h2 className="cx-title">
              Cupons <span>Exclusivos</span>
            </h2>
            <p className="cx-subtitle">
              Copie o código e aproveite descontos especiais — perfeito para sua festa.
            </p>
          </div>
        </header>

        {/* Grid */}
        {cupons.length === 0 ? (
          <div className="cx-empty">
            <div className="cx-emptyCard">
              <TicketPercent size={18} />
              <div>
                <strong>Nenhum cupom disponível</strong>
                <p>Volte em breve — sempre pintam novidades por aqui.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="cx-grid" role="list" aria-label="Lista de cupons">
            {cupons.map((cupom) => {
              const isCopied = copiado === cupom.codigo;

              return (
                <article key={cupom.codigo} className="cx-card" role="listitem">
                  {/* Top bar */}
                  <div className="cx-top" style={{ background: corTipo(cupom.tipo) }}>
                    <div className="cx-topLeft">
                      <span className="cx-pill">
                        <TicketPercent size={14} />
                        Cupom
                      </span>
                      <span className="cx-kind">{cupom.tipo || "promo"}</span>
                    </div>

                    <div className="cx-discount">
                      <span className="cx-discountValue">{cupom.desconto}</span>
                    </div>

                    <div className="cx-topGlow" aria-hidden="true" />
                  </div>

                  {/* Body */}
                  <div className="cx-body">
                    <p className="cx-desc">{cupom.descricao}</p>

                    <div className="cx-codeBox" aria-label={`Código do cupom ${cupom.codigo}`}>
                      <span className="cx-code">{cupom.codigo}</span>

                      <button
                        type="button"
                        className={`cx-copy ${isCopied ? "isCopied" : ""}`}
                        onClick={() => copiar(cupom.codigo)}
                        aria-label={isCopied ? "Cupom copiado" : `Copiar cupom ${cupom.codigo}`}
                      >
                        {isCopied ? (
                          <>
                            <Check size={16} />
                            Copiado
                          </>
                        ) : (
                          <>
                            <Copy size={16} />
                            Copiar
                          </>
                        )}
                      </button>
                    </div>

                    <div className="cx-meta">
                      <CalendarDays size={14} />
                      <span>Válido até: {cupom.expiracao}</span>
                    </div>
                  </div>

                  {/* Corner decor */}
                  <div className="cx-corner" aria-hidden="true" />
                </article>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{styles(theme)}</style>
    </section>
  );
}

function styles(theme: ReturnType<typeof getTheme>) {
  return `
    :global(:root){
      --rose:${theme.rose};
      --roseSoft:${theme.roseSoft};
      --gold:${theme.gold};

      --ink:${theme.ink};
      --muted:${theme.muted};
      --paper:${theme.paper};
      --line:${theme.line};

      --shadow:${theme.shadow};
      --shadowHover:${theme.shadowHover};

      --cream:${theme.cream};
      --cream2:${theme.cream2};

      --r: 24px;
    }

    .cx-wrap{
      background:
        radial-gradient(1100px 520px at 12% 0%, rgba(183,110,121,.14), transparent 60%),
        radial-gradient(900px 520px at 88% 0%, rgba(212,175,55,.12), transparent 60%),
        linear-gradient(135deg, var(--cream), var(--cream2));
      padding: clamp(26px, 4vw, 54px) 0;
    }

    .cx-container{
      width: min(1200px, 92vw);
      margin: 0 auto;
    }

    .cx-state{
      text-align:center;
      padding: 44px 14px;
      color: var(--muted);
      font-weight: 700;
    }
    .cx-err{ color: #b4232c; }

    /* Header */
    .cx-head{
      display:flex;
      align-items:flex-start;
      gap: 14px;
      margin-bottom: clamp(18px, 2vw, 26px);
    }

    .cx-mark{
      width: 54px;
      height: 54px;
      border-radius: 18px;
      display:grid;
      place-items:center;
      background: rgba(255,255,255,.78);
      border: 1px solid var(--line);
      box-shadow: 0 16px 44px rgba(31,41,55,.10);
      position: relative;
      overflow:hidden;
      flex: 0 0 auto;
    }
    .cx-mark::before{
      content:"";
      position:absolute;
      inset:-1px;
      background:
        radial-gradient(140px 90px at 20% 20%, rgba(183,110,121,.22), transparent 60%),
        radial-gradient(140px 90px at 80% 30%, rgba(212,175,55,.18), transparent 60%);
      pointer-events:none;
    }
    .cx-mark :global(svg){ position: relative; z-index: 1; }

    .cx-titles{ min-width: 0; }

    .cx-title{
      margin: 0 0 6px;
      font-weight: 950;
      color: var(--ink);
      letter-spacing: -0.04em;
      font-size: clamp(22px, 2.5vw, 34px);
      line-height: 1.1;
    }
    .cx-title span{ color: var(--rose); }

    .cx-subtitle{
      margin: 0;
      color: var(--muted);
      max-width: 720px;
      line-height: 1.55;
      font-size: 14px;
    }

    /* Empty */
    .cx-empty{ padding: 10px 0 6px; }
    .cx-emptyCard{
      display:flex;
      align-items:flex-start;
      gap: 12px;
      padding: 16px 18px;
      border-radius: var(--r);
      border: 1px solid var(--line);
      background: rgba(255,255,255,.78);
      box-shadow: 0 16px 44px rgba(31,41,55,.08);
      color: var(--ink);
    }
    .cx-emptyCard p{
      margin: 4px 0 0;
      color: var(--muted);
      font-size: 13px;
    }

    /* Grid (melhor responsivo) */
    .cx-grid{
      display:grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }
    @media (min-width: 640px){
      .cx-grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    }
    @media (min-width: 1024px){
      .cx-grid{ grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
    }

    /* Card */
    .cx-card{
      position: relative;
      border-radius: calc(var(--r) + 2px);
      overflow: hidden;
      border: 1px solid rgba(31,41,55,.10);
      background: rgba(255,255,255,.85);
      box-shadow: var(--shadow);
      transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
      min-height: 100%;
      display:flex;
      flex-direction: column;
    }
    .cx-card:hover{
      transform: translateY(-6px);
      box-shadow: var(--shadowHover);
      border-color: rgba(183,110,121,.22);
    }

    /* Top */
    .cx-top{
      position: relative;
      padding: 16px 16px 14px;
      color: #fff;
      display:flex;
      align-items:flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .cx-topGlow{
      position:absolute;
      inset:0;
      background:
        radial-gradient(520px 160px at 18% 20%, rgba(255,255,255,.22), transparent 60%),
        radial-gradient(520px 160px at 82% 30%, rgba(0,0,0,.14), transparent 60%);
      pointer-events:none;
    }

    .cx-topLeft{
      position: relative;
      z-index: 1;
      display:flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }

    .cx-pill{
      display:inline-flex;
      align-items:center;
      gap: 8px;
      padding: 7px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.28);
      background: rgba(255,255,255,.18);
      backdrop-filter: blur(8px);
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .8px;
      text-transform: uppercase;
      width: fit-content;
    }

    .cx-kind{
      font-size: 12px;
      opacity: .92;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      white-space: nowrap;
      overflow:hidden;
      text-overflow: ellipsis;
      max-width: 220px;
    }

    .cx-discount{
      position: relative;
      z-index: 1;
      text-align: right;
      line-height: 1;
      padding-top: 2px;
    }
    .cx-discountValue{
      font-weight: 950;
      font-size: clamp(20px, 2.2vw, 28px);
      letter-spacing: -0.02em;
      text-shadow: 0 18px 40px rgba(0,0,0,.35);
      white-space: nowrap;
    }

    /* Body */
    .cx-body{
      padding: 16px 16px 16px;
      display:flex;
      flex-direction: column;
      gap: 12px;
      flex: 1 1 auto;
    }

    .cx-desc{
      margin: 0;
      color: var(--muted);
      line-height: 1.55;
      font-size: 14px;
      min-height: 42px;
    }

    .cx-codeBox{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap: 10px;
      padding: 12px 12px;
      border-radius: 18px;
      border: 1.8px dashed rgba(212,175,55,.45);
      background: rgba(255,255,255,.92);
      box-shadow: 0 14px 30px rgba(31,41,55,.08);
    }

    .cx-code{
      font-weight: 950;
      letter-spacing: 2px;
      color: var(--ink);
      font-size: 14px;
      text-transform: uppercase;
      overflow:hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 55%;
    }

    .cx-copy{
      border: 0;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 900;
      display:inline-flex;
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
    .cx-copy.isCopied{
      background: linear-gradient(135deg, rgba(212,175,55,.35), rgba(183,110,121,.20));
    }

    .cx-meta{
      display:flex;
      align-items:center;
      gap: 8px;
      color: rgba(31,41,55,.58);
      font-size: 12.5px;
      font-weight: 700;
      margin-top: auto;
    }

    .cx-corner{
      position:absolute;
      right:-60px;
      bottom:-60px;
      width: 170px;
      height: 170px;
      border-radius: 999px;
      background: radial-gradient(circle at 30% 30%, rgba(212,175,55,.22), rgba(183,110,121,.18), transparent 62%);
      pointer-events:none;
    }

    /* A11y */
    .cx-card:focus-within{
      outline: 3px solid rgba(183,110,121,.20);
      outline-offset: 4px;
      border-radius: calc(var(--r) + 6px);
    }

    /* Melhor UX mobile: botões maiores */
    @media (max-width: 420px){
      .cx-top{ padding: 14px 14px 12px; }
      .cx-body{ padding: 14px; }
      .cx-code{ max-width: 52%; }
      .cx-copy{ padding: 10px 12px; }
    }

    @media (prefers-reduced-motion: reduce){
      .cx-card, .cx-copy{ transition: none; }
    }
  `;
}

function getTheme() {
  return {
    rose: "#b76e79",
    roseSoft: "#d9a5ad",
    gold: "#d4af37",
    ink: "#0b1220",
    muted: "rgba(31,41,55,.72)",
    paper: "rgba(255,255,255,.92)",
    line: "rgba(31,41,55,.10)",
    shadow: "0 22px 64px rgba(2, 6, 23, .10)",
    shadowHover: "0 30px 84px rgba(2, 6, 23, .14)",
    cream: "#fff6ee",
    cream2: "#fff1e6",
  } as const;
}