// ProdutoDestaque.tsx
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { useEffect, useMemo, useState } from "react";

type ProdutoDestaqueApi = {
  produto_id: number;
  ordem?: number;
  statusid: number;

  produto_nome: string;
  produto_slug: string;
  produto_imagem: string | null;
  produto_preco: number | string | null;
  produto_preco_promocional?: number | string | null;
  produto_descricao: string | null;
  produto_estoque?: number | string | null;
  produto_ilimitado?: number | string | null;
};

type ApiResponse<T> = {
  message?: string;
  status?: number;
  data?: T;
  dados?: T;
};

function resolveApiData<T>(payload: any): T {
  if (Array.isArray(payload)) return payload as T;
  if (payload?.data != null) return payload.data as T;
  if (payload?.dados != null) return payload.dados as T;
  return payload as T;
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  const base = (api.defaults.baseURL || "").replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

function calcDiscountPercent(preco: number, promo: number) {
  if (preco <= 0) return 0;
  const pct = Math.round(((preco - promo) / preco) * 100);
  return pct > 0 ? pct : 0;
}

export default function ProdutoDestaque() {
  const [itens, setItens] = useState<ProdutoDestaqueApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;

    async function carregar() {
      setLoading(true);
      setErro(null);

      try {
        const res = await api.get<ApiResponse<ProdutoDestaqueApi[]>>(
          rotas.produtos.destaques.ativos
        );
        const data = resolveApiData<ProdutoDestaqueApi[]>(res.data);

        if (!alive) return;
        setItens(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!alive) return;
        setErro(
          e?.response?.data?.message ||
            e?.message ||
            "Erro ao carregar produtos em destaque"
        );
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    carregar();
    return () => {
      alive = false;
    };
  }, []);

  async function adicionarCarrinho(produtoId: number) {
    try {
      setAddingId(produtoId);
      // ajuste o payload conforme seu backend espera
      await api.post(rotas.carrinho.adicionar, { produto_id: produtoId, qtd: 1 });
      // feedback simples (pode trocar por toast)
      alert("Adicionado ao carrinho!");
    } catch (e: any) {
      alert(
        e?.response?.data?.message || e?.message || "Erro ao adicionar no carrinho"
      );
    } finally {
      setAddingId(null);
    }
  }

  const cards = useMemo(() => {
    return itens.map((item) => {
      const preco = toNumber(item.produto_preco);
      const promo = toNumber(item.produto_preco_promocional);

      const temPromo =
        preco != null && promo != null && promo > 0 && promo < preco;

      const precoFinal =
        temPromo && promo != null ? promo : preco != null ? preco : null;

      const descontoPct =
        temPromo && preco != null && promo != null
          ? calcDiscountPercent(preco, promo)
          : 0;

      const imagemUrl = buildImageUrl(item.produto_imagem);
      const detalhesHref = rotas.produtos.paginas.produto(item.produto_slug);

      const estoque = toNumber(item.produto_estoque);
      const ilimitado = toNumber(item.produto_ilimitado);
      const semEstoque =
        (ilimitado ?? 0) !== 1 && estoque != null && estoque <= 0;

      return (
        <article key={`${item.produto_id}-${item.ordem ?? ""}`} className="pd-card">
          <a className="pd-media" href={detalhesHref} aria-label={`Ver ${item.produto_nome}`}>
            {imagemUrl ? (
              <img className="pd-img" src={imagemUrl} alt={item.produto_nome} loading="lazy" />
            ) : (
              <div className="pd-imgFallback">Sem imagem</div>
            )}

            {descontoPct > 0 ? (
              <div className="pd-badge">
                <span>-{descontoPct}%</span>
              </div>
            ) : null}

            {semEstoque ? <div className="pd-stock">Esgotado</div> : null}
          </a>

          <div className="pd-body">
            <div className="pd-top">
              <h3 className="pd-title">{item.produto_nome}</h3>

              {item.produto_descricao ? (
                <p className="pd-desc">{item.produto_descricao}</p>
              ) : (
                <p className="pd-desc pd-descEmpty"> </p>
              )}
            </div>

            <div className="pd-priceRow">
              <div className="pd-prices">
                <div className="pd-price">
                  {precoFinal != null ? formatBRL(precoFinal) : "Preço sob consulta"}
                </div>

                {temPromo && preco != null ? (
                  <div className="pd-oldPrice">{formatBRL(preco)}</div>
                ) : null}
              </div>

              {temPromo ? <div className="pd-tag">Oferta</div> : <div className="pd-tag pd-tagMuted">Destaque</div>}
            </div>

            <div className="pd-actions">
              <a href={detalhesHref} className="pd-btn pd-btnGhost">
                Detalhes
              </a>

              <button
                className="pd-btn pd-btnPrimary"
                onClick={() => adicionarCarrinho(item.produto_id)}
                disabled={semEstoque || addingId === item.produto_id}
              >
                {semEstoque
                  ? "Indisponível"
                  : addingId === item.produto_id
                  ? "Adicionando…"
                  : "Adicionar"}
              </button>
            </div>
          </div>
        </article>
      );
    });
  }, [itens, addingId]);

  return (
    <section className="pd-wrap">
      <div className="pd-header">
        <div>
          <h2 className="pd-h2">Destaques</h2>
          <p className="pd-sub">Selecionados com carinho • tons creme</p>
        </div>

        <div className="pd-count">{!loading && !erro ? `${itens.length} item(ns)` : ""}</div>
      </div>

      {loading ? (
        <div className="pd-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="pd-skelCard">
              <div className="pd-skelImg" />
              <div className="pd-skelBody">
                <div className="pd-skelLine pd-skelLine1" />
                <div className="pd-skelLine pd-skelLine2" />
                <div className="pd-skelLine pd-skelLine3" />
                <div className="pd-skelBtns">
                  <div className="pd-skelBtn" />
                  <div className="pd-skelBtn pd-skelBtn2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : erro ? (
        <div className="pd-alert pd-alertErr">{erro}</div>
      ) : itens.length === 0 ? (
        <div className="pd-alert">Nenhum destaque ativo no momento.</div>
      ) : (
        <div className="pd-grid">{cards}</div>
      )}

      <style>{`
        /* =========================
           Paleta creme (premium)
           ========================= */
        .pd-wrap{
          padding: 34px 18px 40px;
          background: radial-gradient(1200px 500px at 20% 0%, #fffaf1 0%, #f6efe4 60%, #f1e7d9 100%);
        }

        .pd-header{
          max-width: 1120px;
          margin: 0 auto 18px;
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap:16px;
        }

        .pd-h2{
          margin:0;
          font-size: 28px;
          letter-spacing: -0.5px;
          color:#3f3327;
          font-weight: 900;
        }

        .pd-sub{
          margin:6px 0 0;
          font-size: 13px;
          color:#6b5a49;
          opacity: .9;
          font-weight: 600;
        }

        .pd-count{
          font-size: 12px;
          color:#6b5a49;
          font-weight: 800;
          background: rgba(255,255,255,.55);
          border: 1px solid rgba(111, 92, 73, .15);
          padding: 8px 12px;
          border-radius: 999px;
          backdrop-filter: blur(6px);
        }

        .pd-grid{
          max-width: 1120px;
          margin: 0 auto;
          display:grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        /* =========================
           Card (premium)
           ========================= */
        .pd-card{
          border-radius: 20px;
          overflow:hidden;
          border: 1px solid rgba(111, 92, 73, .16);
          background: linear-gradient(180deg, rgba(255, 253, 247, 1) 0%, rgba(255, 248, 237, 1) 100%);
          box-shadow: 0 8px 28px rgba(0,0,0,.08);
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .pd-card:hover{
          transform: translateY(-3px);
          box-shadow: 0 14px 40px rgba(0,0,0,.12);
          border-color: rgba(111, 92, 73, .26);
        }

        .pd-media{
          position: relative;
          display:block;
          height: 230px;
          background: #efe3d2;
          overflow:hidden;
        }

        .pd-img{
          width:100%;
          height:100%;
          object-fit: cover;
          transform: scale(1.02);
          transition: transform .35s ease;
          display:block;
        }
        .pd-card:hover .pd-img{ transform: scale(1.07); }

        .pd-imgFallback{
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#7b6a5a;
          font-weight:800;
          font-size: 13px;
        }

        .pd-badge{
          position:absolute;
          top: 12px;
          left: 12px;
          padding: 7px 10px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 12px;
          color: #ffffff;
          background: rgba(30, 20, 12, .92);
          box-shadow: 0 10px 20px rgba(0,0,0,.18);
        }

        .pd-stock{
          position:absolute;
          top: 12px;
          right: 12px;
          padding: 7px 10px;
          border-radius: 999px;
          font-weight: 900;
          font-size: 12px;
          color: #3f3327;
          background: rgba(255, 255, 255, .75);
          border: 1px solid rgba(111, 92, 73, .18);
          backdrop-filter: blur(6px);
        }

        .pd-body{ padding: 14px 14px 16px; }

        .pd-title{
          margin:0;
          color:#3f3327;
          font-weight: 950;
          font-size: 16px;
          letter-spacing: -0.2px;
          line-height: 1.15;
        }

        .pd-desc{
          margin: 8px 0 0;
          color:#6b5a49;
          font-size: 13px;
          line-height: 1.35;
          opacity: .92;

          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
        }
        .pd-descEmpty{ opacity: 0; }

        .pd-priceRow{
          margin-top: 12px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 12px;
        }

        .pd-prices{
          display:flex;
          align-items: baseline;
          gap: 10px;
        }

        .pd-price{
          font-weight: 950;
          font-size: 16px;
          color:#2f261e;
          letter-spacing: -0.2px;
        }

        .pd-oldPrice{
          font-weight: 800;
          font-size: 12px;
          color:#8b7a6a;
          text-decoration: line-through;
        }

        .pd-tag{
          font-size: 12px;
          font-weight: 900;
          padding: 6px 10px;
          border-radius: 999px;
          color:#3f3327;
          background: rgba(255,255,255,.55);
          border: 1px solid rgba(111, 92, 73, .14);
          backdrop-filter: blur(6px);
          white-space: nowrap;
        }
        .pd-tagMuted{ opacity: .9; }

        .pd-actions{
          margin-top: 14px;
          display:flex;
          gap: 10px;
        }

        .pd-btn{
          flex: 1;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 14px;
          font-weight: 950;
          font-size: 13px;
          border: 1px solid transparent;
          cursor:pointer;
          text-decoration:none;
          transition: transform .12s ease, filter .12s ease, background .12s ease, border-color .12s ease;
          user-select:none;
        }
        .pd-btn:active{ transform: translateY(1px); }

        .pd-btnGhost{
          background: rgba(255,255,255,.6);
          color:#3f3327;
          border-color: rgba(111, 92, 73, .18);
        }
        .pd-btnGhost:hover{ filter: brightness(0.98); }

        .pd-btnPrimary{
          background: linear-gradient(135deg, #d1a67f 0%, #b88962 100%);
          color: #ffffff;
          box-shadow: 0 10px 22px rgba(184, 137, 98, .35);
        }
        .pd-btnPrimary:hover{ filter: brightness(1.02); }
        .pd-btnPrimary:disabled{
          opacity: .55;
          cursor:not-allowed;
          box-shadow:none;
        }

        /* =========================
           Alerts / Skeleton
           ========================= */
        .pd-alert{
          max-width: 1120px;
          margin: 0 auto;
          border-radius: 18px;
          padding: 14px;
          background: rgba(255,255,255,.65);
          border: 1px solid rgba(111, 92, 73, .16);
          color:#3f3327;
          font-weight: 800;
        }
        .pd-alertErr{
          color:#8a1f1f;
          background: rgba(185,28,28,.06);
          border-color: rgba(185,28,28,.18);
        }

        .pd-skelCard{
          border-radius: 20px;
          overflow:hidden;
          border: 1px solid rgba(111, 92, 73, .14);
          background: rgba(255,255,255,.55);
          box-shadow: 0 8px 28px rgba(0,0,0,.06);
        }
        .pd-skelImg{
          height: 230px;
          background: linear-gradient(90deg, rgba(239,227,210,.7) 0%, rgba(255,248,237,.9) 50%, rgba(239,227,210,.7) 100%);
          background-size: 200% 100%;
          animation: pdShimmer 1.1s infinite linear;
        }
        .pd-skelBody{ padding: 14px; }
        .pd-skelLine{
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(231,221,207,.7) 0%, rgba(255,248,237,.9) 50%, rgba(231,221,207,.7) 100%);
          background-size: 200% 100%;
          animation: pdShimmer 1.1s infinite linear;
          margin-bottom: 10px;
        }
        .pd-skelLine1{ width: 70%; }
        .pd-skelLine2{ width: 90%; }
        .pd-skelLine3{ width: 55%; }

        .pd-skelBtns{
          display:flex;
          gap:10px;
          margin-top: 14px;
        }
        .pd-skelBtn{
          flex:1;
          height: 38px;
          border-radius: 14px;
          background: linear-gradient(90deg, rgba(231,221,207,.7) 0%, rgba(255,248,237,.9) 50%, rgba(231,221,207,.7) 100%);
          background-size: 200% 100%;
          animation: pdShimmer 1.1s infinite linear;
        }
        .pd-skelBtn2{ opacity: .95; }

        @keyframes pdShimmer{
          0%{ background-position: 0% 0%; }
          100%{ background-position: 200% 0%; }
        }

        /* =========================
           Responsivo
           ========================= */
        @media (max-width: 520px){
          .pd-wrap{ padding: 26px 14px 34px; }
          .pd-h2{ font-size: 24px; }
          .pd-media{ height: 210px; }
        }
      `}</style>
    </section>
  );
}