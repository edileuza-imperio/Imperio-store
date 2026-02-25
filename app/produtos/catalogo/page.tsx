"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";

import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";

type Produto = {
  id_produto?: number;
  id?: number;

  nome: string;
  descricao?: string | null;

  preco?: number | string | null;
  preco_promocional?: number | string | null;
  parcelamento?: number | string | null;

  slug?: string | null;
  imagem?: string | null;

  estoque?: number | string | null;
  ilimitado?: number | boolean | string | null;

  statusid?: number | string | null;
  catalogo?: number | string | null;

  categoria_id?: number | string | null;
  categoria_nome?: string | null;
};

type CatalogoPayload = Produto[] | { produtos?: Produto[] };

type ApiResponse<T> = {
  mensagem?: string;
  message?: string;
  status?: number;
  data?: T;
  dados?: T;
};

const STATUS = {
  ATIVO: 1,
  CATALOGO_SIM: 1, // ✅ backend retorna catalogo: 1
} as const;

function parseNumber(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  if (typeof v === "string") {
    const s0 = v.trim();
    if (!s0) return null;

    const s = s0.replace(/\s/g, "").replace(/[R$\u00A0]/g, "");
    const hasDot = s.includes(".");
    const hasComma = s.includes(",");

    let normalized = s;
    if (hasDot && hasComma) normalized = s.replace(/\./g, "").replace(",", ".");
    else if (hasComma && !hasDot) normalized = s.replace(",", ".");
    else normalized = s;

    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asInt(v: unknown): number | null {
  const n = parseNumber(v);
  return n === null ? null : Math.trunc(n);
}

function brl(v: unknown): string | null {
  const n = parseNumber(v);
  if (n === null) return null;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  return payload as T;
}

function extractProdutos(payload: any): Produto[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.produtos)) return payload.produtos;
  return [];
}

function buildImageUrl(path: string | null | undefined): string | null {
  const raw = (path || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;

  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  const normalized = raw.startsWith("/") ? raw : `/${raw}`;
  return `${base}${normalized}`;
}

function formatEstoque(
  estoque: unknown,
  ilimitado: unknown
): { texto: string; semEstoque: boolean } {
  const ilimit =
    ilimitado === true ||
    ilimitado === 1 ||
    ilimitado === "1" ||
    ilimitado === "true";

  if (ilimit) return { texto: "Estoque ilimitado", semEstoque: false };

  const n = asInt(estoque);
  if (n === null) return { texto: "Estoque: —", semEstoque: false };
  if (n <= 0) return { texto: "Esgotado", semEstoque: true };
  return { texto: `Estoque: ${n}`, semEstoque: false };
}

function calcDiscountPercent(preco: number, promo: number) {
  if (preco <= 0) return 0;
  const pct = Math.round(((preco - promo) / preco) * 100);
  return pct > 0 ? pct : 0;
}

function getFinalPrice(p: Produto): number | null {
  const preco = parseNumber(p.preco);
  const promo = parseNumber(p.preco_promocional);

  const temPromo = promo != null && preco != null && promo > 0 && promo < preco;
  return temPromo ? promo! : preco;
}

/* ===== Icons (sem libs) ===== */
function IconSearch() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10 2a8 8 0 1 1 5.293 13.707l4 4a1 1 0 0 1-1.414 1.414l-4-4A8 8 0 0 1 10 2Zm0 2a6 6 0 1 0 0 12a6 6 0 0 0 0-12Z"
      />
    </svg>
  );
}
function IconSpark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2l1.6 6.2L20 10l-6.4 1.8L12 18l-1.6-6.2L4 10l6.4-1.8L12 2Zm7 9l.9 3.1L23 15l-3.1.9L19 19l-.9-3.1L15 15l3.1-.9L19 11Z"
      />
    </svg>
  );
}
function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 5c5.5 0 9.6 4.1 10.9 6.3c.2.4.2.9 0 1.3C21.6 14.9 17.5 19 12 19S2.4 14.9 1.1 12.6c-.2-.4-.2-.9 0-1.3C2.4 9.1 6.5 5 12 5Zm0 2C7.6 7 4.1 10.2 3.1 12c1 1.8 4.5 5 8.9 5s7.9-3.2 8.9-5C19.9 10.2 16.4 7 12 7Zm0 2.5A2.5 2.5 0 1 1 12 14a2.5 2.5 0 0 1 0-5Z"
      />
    </svg>
  );
}
function IconCart() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 18a2 2 0 1 0 0 4a2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4a2 2 0 0 0 0-4ZM6.2 6h15.6c.8 0 1.4.7 1.2 1.5l-1.5 7.1c-.1.6-.7 1.1-1.3 1.1H8.2c-.6 0-1.2-.4-1.3-1L5 3H2a1 1 0 1 1 0-2h3c.5 0 .9.3 1 .8L6.2 6Zm.6 2l1.2 6h11.7l1.2-6H6.8Z"
      />
    </svg>
  );
}

export default function CatalogoPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"relevancia" | "menor" | "maior" | "nome">(
    "relevancia"
  );

  const [toast, setToast] = useState<{ show: boolean; text: string }>({
    show: false,
    text: "",
  });
  const toastTimer = useRef<number | null>(null);

  function showToast(text: string) {
    setToast({ show: true, text });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(
      () => setToast({ show: false, text: "" }),
      1800
    );
  }

  const placeholderSvg = useMemo(() => {
    const svg = encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="900" height="700">
        <rect width="100%" height="100%" fill="#efe3d2"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
          fill="#7b6a5a" font-family="Arial" font-size="28" font-weight="700">
          Sem imagem
        </text>
      </svg>
    `);
    return `data:image/svg+xml;charset=utf-8,${svg}`;
  }, []);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErro(null);

        const res = await api.get<ApiResponse<CatalogoPayload>>(rotas.produtos.catalogo);
        const payload = resolveApi<CatalogoPayload>(res.data);
        const lista = extractProdutos(payload);

        if (!alive) return;
        setProdutos(lista);
      } catch (e: any) {
        console.error("❌ Erro ao buscar catálogo:", e);
        if (!alive) return;
        setErro(e?.response?.data?.mensagem || e?.message || "Não foi possível carregar o catálogo.");
        setProdutos([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const filtrados = useMemo(() => {
    const qn = q.trim().toLowerCase();

    // ✅ filtro correto de catálogo/status
    const base = produtos.filter((p) => {
      const statusId = asInt(p.statusid);
      const catalogoId = asInt(p.catalogo);
      return statusId === STATUS.ATIVO && catalogoId === STATUS.CATALOGO_SIM;
    });

    const searched = !qn
      ? base
      : base.filter((p) => (p.nome || "").toLowerCase().includes(qn));

    const sorted = [...searched].sort((a, b) => {
      const ap = getFinalPrice(a) ?? 0;
      const bp = getFinalPrice(b) ?? 0;

      if (sort === "menor") return ap - bp;
      if (sort === "maior") return bp - ap;
      if (sort === "nome")
        return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
      return 0;
    });

    return sorted;
  }, [produtos, q, sort]);

  const stats = useMemo(() => {
    let promos = 0;
    let min: number | null = null;

    for (const p of filtrados) {
      const preco = parseNumber(p.preco);
      const promo = parseNumber(p.preco_promocional);
      const temPromo = promo != null && preco != null && promo > 0 && promo < preco;
      if (temPromo) promos++;

      const final = getFinalPrice(p);
      if (final != null && final > 0) min = min == null ? final : Math.min(min, final);
    }

    return { promos, min };
  }, [filtrados]);

  async function addCarrinho(p: Produto) {
    const id = (p.id_produto ?? p.id) as number | undefined;
    if (!id) return;

    const { semEstoque } = formatEstoque(p.estoque, p.ilimitado);
    if (semEstoque) {
      showToast("⚠️ Produto esgotado");
      return;
    }

    try {
      setAddingId(id);
      await api.post(rotas.carrinho.adicionar, { produto_id: id, qtd: 1 });
      showToast(`✅ ${p.nome} adicionado ao carrinho`);
    } catch (e: any) {
      showToast(e?.response?.data?.mensagem || e?.message || "Erro ao adicionar no carrinho");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <>
      <style jsx global>{`
        :root{
          --cream-1:#fffaf1;
          --cream-2:#f6efe4;
          --cream-3:#f1e7d9;

          --ink:#2f261e;
          --muted:#6b5a49;

          --accent:#b88962;
          --accent2:#d1a67f;

          --shadow: 0 14px 46px rgba(0,0,0,.10);
          --shadow2: 0 20px 62px rgba(0,0,0,.14);
        }

        body{
          margin:0;
          background: radial-gradient(1200px 520px at 18% 0%, var(--cream-1) 0%, var(--cream-2) 55%, var(--cream-3) 100%);
          color: var(--ink);
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        }

        .siteShell{ min-height:100vh; display:flex; flex-direction:column; }
        .siteHeader{ position:relative; z-index:9999; }
        .siteMain{ flex:1; }

        .page{
          max-width: 1180px;
          margin: 26px auto 80px;
          padding: 0 16px;
        }

        .hero{
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .h1{ margin:0; font-size: 30px; letter-spacing:-0.7px; font-weight: 1000; }
        .sub{ margin:6px 0 0; color: var(--muted); font-size: 13px; font-weight: 650; opacity:.95; }

        .count{
          font-size: 12px;
          color: var(--muted);
          font-weight: 950;
          background: rgba(255,255,255,.62);
          border: 1px solid rgba(111,92,73,.14);
          padding: 8px 12px;
          border-radius: 999px;
          backdrop-filter: blur(6px);
          white-space: nowrap;
          display:inline-flex;
          align-items:center;
          gap:10px;
        }
        .dot{
          width: 8px; height: 8px; border-radius: 999px;
          background: linear-gradient(135deg, var(--accent2), var(--accent));
          box-shadow: 0 6px 14px rgba(184,137,98,.35);
        }

        .bar{
          display:flex;
          gap: 12px;
          align-items:center;
          justify-content:space-between;
          padding: 12px;
          border-radius: 18px;
          border: 1px solid rgba(111,92,73,.18);
          background: rgba(255,255,255,.62);
          backdrop-filter: blur(8px);
          box-shadow: 0 18px 46px rgba(0,0,0,.08);
          margin-bottom: 14px;
        }

        .search{
          flex:1;
          display:flex;
          align-items:center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(111,92,73,.18);
          background: rgba(255,255,255,.78);
        }
        .search svg{ color: #6b5a49; }
        .search input{
          width:100%;
          border:0;
          outline:none;
          background: transparent;
          font-weight: 850;
          color: var(--ink);
        }

        .rightTools{ display:flex; align-items:center; gap: 10px; flex-wrap: wrap; }

        .select{
          height: 40px;
          border-radius: 14px;
          border: 1px solid rgba(111,92,73,.18);
          background: rgba(255,255,255,.78);
          padding: 0 12px;
          font-weight: 900;
          color: var(--ink);
          outline:none;
        }

        .chip{
          height: 40px;
          padding: 0 12px;
          border-radius: 14px;
          border: 1px solid rgba(111,92,73,.18);
          background: rgba(255,255,255,.78);
          font-weight: 1000;
          color: var(--ink);
          cursor:pointer;
        }

        .banner{
          position: relative;
          border-radius: 22px;
          overflow:hidden;
          border: 1px solid rgba(111,92,73,.18);
          background: linear-gradient(135deg, rgba(255,253,247,1) 0%,
              rgba(255,244,227,1) 38%,
              rgba(240,226,205,1) 100%);
          box-shadow: 0 18px 52px rgba(0,0,0,.12);
          padding: 16px;
          margin-bottom: 16px;
        }
        .bannerInner{
          position:relative;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 14px;
        }
        .bChip{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,.70);
          border: 1px solid rgba(111,92,73,.14);
          color: var(--ink);
          font-weight: 1000;
          font-size: 12px;
          backdrop-filter: blur(8px);
          white-space:nowrap;
        }
        .bTitle{ margin:0; font-size: 20px; font-weight: 1000; letter-spacing:-0.3px; }
        .bText{ margin: 6px 0 0; color: var(--muted); font-size: 13px; font-weight: 700; line-height: 1.45; max-width: 740px; }
        .bRight{ display:flex; gap: 10px; flex-wrap:wrap; justify-content:flex-end; }
        .bBtn{
          height: 42px;
          padding: 0 14px;
          border-radius: 14px;
          border: 1px solid rgba(111,92,73,.18);
          background: rgba(255,255,255,.78);
          font-weight: 1000;
          color: var(--ink);
          cursor:pointer;
          text-decoration:none;
          display:inline-flex;
          align-items:center;
          gap: 8px;
          user-select:none;
          white-space:nowrap;
        }
        .bBtnPrimary{
          background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%);
          border-color: rgba(255,255,255,.18);
          color:#fff;
          box-shadow: 0 14px 28px rgba(184,137,98,.40);
        }

        .grid{
          display:grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 260px));
          gap: 16px;
          justify-content: start;
        }

        .card{
          width: 260px;
          border-radius: 24px;
          overflow:hidden;
          position:relative;
          background: linear-gradient(180deg, rgba(255,253,247,1) 0%, rgba(255,248,237,1) 100%);
          box-shadow: var(--shadow);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .card:hover{ transform: translateY(-3px); box-shadow: var(--shadow2); }

        .media{
          position:relative;
          height: 190px;
          background: #efe3d2;
          overflow:hidden;
          text-decoration:none;
          display:block;
        }
        .img{
          width:100%;
          height:100%;
          object-fit: cover;
          transform: scale(1.02);
          transition: transform .45s ease;
          display:block;
        }
        .card:hover .img{ transform: scale(1.09); }

        .badges{
          position:absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          z-index: 3;
        }
        .badge{
          padding: 7px 10px;
          border-radius: 999px;
          font-weight: 1000;
          font-size: 12px;
          background: rgba(255,255,255,.78);
          border: 1px solid rgba(111,92,73,.18);
          backdrop-filter: blur(6px);
          color: var(--ink);
          box-shadow: 0 12px 22px rgba(0,0,0,.10);
          white-space:nowrap;
        }
        .badgeDark{
          background: rgba(30, 20, 12, .92);
          color:#fff;
          box-shadow: 0 12px 22px rgba(0,0,0,.20);
        }

        .body{ padding: 14px 14px 16px; }
        .name{ margin: 0; font-size: 15.5px; font-weight: 1000; letter-spacing: -0.25px; line-height: 1.15; }
        .desc{
          margin: 8px 0 0;
          color: var(--muted);
          font-size: 13px;
          line-height: 1.35;
          opacity:.92;
          display:-webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow:hidden;
          min-height: 36px;
        }

        .priceRow{ margin-top: 12px; display:flex; align-items:center; justify-content:space-between; gap: 10px; }
        .prices{ display:flex; align-items:baseline; gap: 10px; }
        .price{ font-weight: 1000; font-size: 15.5px; white-space:nowrap; }
        .old{ font-weight: 900; font-size: 12px; color:#8b7a6a; text-decoration: line-through; white-space:nowrap; }
        .pill{ font-size: 12px; font-weight: 1000; padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,.70); border: 1px solid rgba(184, 137, 98, .26); backdrop-filter: blur(6px); white-space:nowrap; }

        .actions{ margin-top: 12px; display:flex; gap: 10px; }
        .aBtn{
          flex: 1;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 14px;
          font-weight: 1000;
          font-size: 13px;
          border: 1px solid transparent;
          cursor:pointer;
          text-decoration:none;
          user-select:none;
        }
        .ghost{ background: rgba(255,255,255,.78); color: var(--ink); border: 1px solid rgba(111,92,73,.18); }
        .primary{
          background: linear-gradient(135deg, var(--accent2) 0%, var(--accent) 100%);
          color: #fff;
          box-shadow: 0 14px 28px rgba(184, 137, 98, .40);
          border: 1px solid rgba(255,255,255,.18);
        }
        .primary:disabled{ opacity:.6; cursor:not-allowed; box-shadow:none; }

        .alert{
          border-radius: 18px;
          padding: 14px;
          background: rgba(255,255,255,.70);
          border: 1px solid rgba(111,92,73,.16);
          font-weight: 900;
          margin-bottom: 12px;
        }
        .alertErr{ color:#8a1f1f; background: rgba(185,28,28,.06); border-color: rgba(185,28,28,.18); }

        .toast{
          position: fixed;
          right: 16px;
          bottom: 16px;
          max-width: 360px;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(255, 248, 237, .92);
          border: 1px solid rgba(111, 92, 73, .18);
          box-shadow: 0 16px 46px rgba(0,0,0,.16);
          font-weight: 950;
          font-size: 13px;
          transform: translateY(10px);
          opacity: 0;
          pointer-events: none;
          transition: opacity .18s ease, transform .18s ease;
          z-index: 9999;
          backdrop-filter: blur(8px);
        }
        .toastShow{ opacity: 1; transform: translateY(0); }

        @media (max-width: 760px){
          .hero{ align-items:flex-start; flex-direction:column; }
          .bar{ flex-direction:column; align-items:stretch; }
          .bannerInner{ flex-direction:column; align-items:flex-start; }
          .bRight{ justify-content:flex-start; }
        }

        @media (max-width: 560px){
          .h1{ font-size: 24px; }
          .grid{ grid-template-columns: 1fr; justify-content: stretch; }
          .card{ width: 100%; }
        }
      `}</style>

      <div className="siteShell">
        <header className="siteHeader">
          <Navbar />
        </header>

        <div className="siteMain">
          <main className="page">
            <div className="hero">
              <div>
                <h1 className="h1">Catálogo</h1>
                <p className="sub">Produtos em catálogo</p>
              </div>

              <div className="count">
                <span className="dot" />
                {loading ? "Carregando..." : `${filtrados.length} produto(s)`}
              </div>
            </div>

            <div className="bar">
              <div className="search">
                <IconSearch />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar produto..."
                  aria-label="Buscar produto"
                />
              </div>

              <div className="rightTools">
                <select
                  className="select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as any)}
                >
                  <option value="relevancia">Relevância</option>
                  <option value="menor">Menor preço</option>
                  <option value="maior">Maior preço</option>
                  <option value="nome">Nome A–Z</option>
                </select>

                <button className="chip" type="button" onClick={() => setQ("")}>
                  Limpar busca
                </button>
              </div>
            </div>

            <section className="banner" aria-label="Banner do catálogo">
              <div className="bannerInner">
                <div>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                    <span className="bChip">
                      <IconSpark />
                      Catálogo
                    </span>
                    <span className="bChip">
                      {stats.promos > 0 ? `${stats.promos} promo(s)` : "Sem promoções"}
                    </span>
                  </div>

                  <h3 className="bTitle">Escolha o seu 💛</h3>
                  <p className="bText">
                    {stats.min != null ? `A partir de ${brl(stats.min)}.` : "Confira os produtos disponíveis."}
                  </p>
                </div>

                <div className="bRight">
                  <Link className="bBtn bBtnPrimary" href={rotas.produtos.paginas.destaques}>
                    Ver destaques
                  </Link>
                  <a className="bBtn" href="https://wa.me/5599999999999" target="_blank" rel="noreferrer">
                    Falar no Whats
                  </a>
                </div>
              </div>
            </section>

            {erro ? <div className="alert alertErr">❌ {erro}</div> : null}
            {loading ? <div className="alert">Carregando produtos…</div> : null}
            {!loading && !erro && filtrados.length === 0 ? (
              <div className="alert">Nenhum produto encontrado.</div>
            ) : null}

            <section className="grid">
              {!loading &&
                !erro &&
                filtrados.map((p, idx) => {
                  const id = (p.id_produto ?? p.id ?? idx) as number;
                  const slug = (p.slug || "").trim();

                  const preco = parseNumber(p.preco);
                  const promo = parseNumber(p.preco_promocional);
                  const temPromo = promo != null && preco != null && promo > 0 && promo < preco;

                  const precoFinal = temPromo ? promo : preco;
                  const desconto = temPromo ? calcDiscountPercent(preco!, promo!) : 0;

                  const { texto: estoqueTexto, semEstoque } = formatEstoque(p.estoque, p.ilimitado);

                  const detalhesHref = slug ? rotas.produtos.paginas.produto(slug) : "#";
                  const img = buildImageUrl(p.imagem);

                  return (
                    <article className="card" key={id}>
                      <a className="media" href={detalhesHref} aria-label={`Ver ${p.nome}`}>
                        {img ? (
                          <img
                            className="img"
                            src={img}
                            alt={p.nome}
                            loading="lazy"
                            onError={(e) => {
                              const t = e.currentTarget;
                              if (t.src !== placeholderSvg) t.src = placeholderSvg;
                            }}
                          />
                        ) : (
                          <img className="img" src={placeholderSvg} alt="Sem imagem" />
                        )}

                        <div className="badges">
                          {desconto > 0 ? (
                            <div className="badge badgeDark">-{desconto}%</div>
                          ) : (
                            <div className="badge">Catálogo</div>
                          )}
                          {semEstoque ? <div className="badge">Esgotado</div> : null}
                        </div>
                      </a>

                      <div className="body">
                        <h3 className="name">{p.nome}</h3>
                        <p className="desc">{p.descricao || "Sem descrição."}</p>

                        <div className="priceRow">
                          <div className="prices">
                            <div className="price">
                              {precoFinal != null ? brl(precoFinal) : "Preço sob consulta"}
                            </div>
                            {temPromo && preco != null ? <div className="old">{brl(preco)}</div> : null}
                          </div>
                          <div className="pill">{temPromo ? "Oferta" : estoqueTexto}</div>
                        </div>

                        <div className="actions">
                          {slug ? (
                            <Link href={detalhesHref} className="aBtn ghost">
                              <IconEye />
                              Detalhes
                            </Link>
                          ) : (
                            <button className="aBtn ghost" disabled>
                              <IconEye />
                              Detalhes
                            </button>
                          )}

                          <button
                            className="aBtn primary"
                            onClick={() => addCarrinho(p)}
                            disabled={semEstoque || addingId === (p.id_produto ?? p.id)}
                          >
                            <IconCart />
                            {semEstoque
                              ? "Indisponível"
                              : addingId === (p.id_produto ?? p.id)
                              ? "Adicionando…"
                              : "Adicionar"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
            </section>

            <div className={`toast ${toast.show ? "toastShow" : ""}`}>{toast.text}</div>
          </main>
        </div>

        <FooterPrincipal />
      </div>
    </>
  );
}