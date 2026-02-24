// ProdutoDestaque.tsx
import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { useEffect, useMemo, useRef, useState } from "react";

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

export default function ProdutoDestaque() {
  const [itens, setItens] = useState<ProdutoDestaqueApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);

  // toast simples
  const [toast, setToast] = useState<{ show: boolean; text: string }>({
    show: false,
    text: "",
  });
  const toastTimer = useRef<number | null>(null);

  function showToast(text: string) {
    setToast({ show: true, text });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToast({ show: false, text: "" });
    }, 1800);
  }

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
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  async function adicionarCarrinho(produtoId: number, nome: string) {
    try {
      setAddingId(produtoId);
      await api.post(rotas.carrinho.adicionar, { produto_id: produtoId, qtd: 1 });
      showToast(`✅ ${nome} adicionado ao carrinho`);
    } catch (e: any) {
      showToast(
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
        <article key={`${item.produto_id}-${item.ordem ?? ""}`} className="pdCard2">
          <a className="pdMedia2" href={detalhesHref} aria-label={`Detalhes ${item.produto_nome}`}>
            <div className="pdGlow" />

            {imagemUrl ? (
              <img className="pdImg2" src={imagemUrl} alt={item.produto_nome} loading="lazy" />
            ) : (
              <div className="pdImgFallback2">Sem imagem</div>
            )}

            <div className="pdOverlay" />

            <div className="pdBadges">
              {descontoPct > 0 ? (
                <div className="pdBadge2">
                  <span>-{descontoPct}%</span>
                </div>
              ) : (
                <div className="pdBadge2 pdBadgeSoft">
                  <span>Destaque</span>
                </div>
              )}

              {semEstoque ? <div className="pdStock2">Esgotado</div> : null}
            </div>
          </a>

          <div className="pdBody2">
            <div className="pdTitle2">{item.produto_nome}</div>

            <div className="pdDesc2">{item.produto_descricao || " "}</div>

            <div className="pdPriceRow2">
              <div className="pdPrices2">
                <div className="pdPrice2">
                  {precoFinal != null ? formatBRL(precoFinal) : "Preço sob consulta"}
                </div>
                {temPromo && preco != null ? (
                  <div className="pdOldPrice2">{formatBRL(preco)}</div>
                ) : null}
              </div>

              {temPromo ? <div className="pdPill">Oferta</div> : <div className="pdPill pdPillMuted">Seleção</div>}
            </div>

            <div className="pdActions2">
              <a href={detalhesHref} className="pdBtn2 pdBtnGhost2">
                <IconEye />
                Detalhes
              </a>

              <button
                className="pdBtn2 pdBtnPrimary2"
                onClick={() => adicionarCarrinho(item.produto_id, item.produto_nome)}
                disabled={semEstoque || addingId === item.produto_id}
              >
                <IconCart />
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
    <section className="pdWrap2">
      <div className="pdContainer2">
        <div className="pdHeader2">
          <div>
            <h2 className="pdH2b">Destaques</h2>
            <p className="pdSub2">Mais elegante, mais premium • tons creme</p>
          </div>
          <div className="pdCount2">
            {!loading && !erro ? `${itens.length} item(ns)` : ""}
          </div>
        </div>

        <div className="pdLayout2">
          {/* MINI BANNER ESQUERDA */}
          <aside className="pdBanner2">
            <div className="pdBannerInner2">
              <div className="pdBannerTop2">
                <div className="pdChip2">Coleção</div>
                <div className="pdChip2 pdChipSoft2">Creme</div>
              </div>

              <div className="pdBannerTitle2">Um toque de charme</div>
              <div className="pdBannerText2">
                Destaques escolhidos pra presentear. Visual premium, acabamento
                delicado e ofertas do dia.
              </div>

              <div className="pdBannerCTA2">
                <a className="pdBannerBtn2" href={rotas.produtos.catalogo}>
                  Ver catálogo
                </a>
                <div className="pdHint2">Pagamento fácil • Pix/Cartão</div>
              </div>

              <div className="pdStats2">
                <div className="pdStatBox2">
                  <div className="pdStatLabel2">Ofertas</div>
                  <div className="pdStatValue2">até 30% OFF</div>
                </div>
                <div className="pdStatBox2">
                  <div className="pdStatLabel2">Envio</div>
                  <div className="pdStatValue2">rápido</div>
                </div>
              </div>

              <div className="pdBannerFoot2">
                <span className="pdDot" />
                Atualizado todos os dias
              </div>
            </div>
          </aside>

          {/* DIREITA: PRODUTOS */}
          <div className="pdRight2">
            {loading ? (
              <div className="pdAlert2">Carregando…</div>
            ) : erro ? (
              <div className="pdAlert2 pdAlertErr2">{erro}</div>
            ) : itens.length === 0 ? (
              <div className="pdAlert2">Nenhum destaque ativo no momento.</div>
            ) : (
              <div className="pdGrid2">{cards}</div>
            )}
          </div>
        </div>

        {/* Toast */}
        <div className={`pdToast ${toast.show ? "pdToastShow" : ""}`}>
          {toast.text}
        </div>
      </div>

      <style>{`
        /* =========================
           Layout / Fundo creme
           ========================= */
        .pdWrap2{
          padding: 34px 16px 46px;
          background:
            radial-gradient(1200px 520px at 18% 0%, #fffaf1 0%, #f6efe4 55%, #f1e7d9 100%);
        }
        .pdContainer2{ max-width: 1140px; margin: 0 auto; }

        .pdHeader2{
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          gap:16px;
          margin-bottom: 16px;
        }
        .pdH2b{
          margin:0;
          font-size: 30px;
          letter-spacing: -0.7px;
          color:#3f3327;
          font-weight: 1000;
        }
        .pdSub2{
          margin:6px 0 0;
          font-size: 13px;
          color:#6b5a49;
          font-weight: 650;
          opacity: .95;
        }
        .pdCount2{
          font-size: 12px;
          color:#6b5a49;
          font-weight: 950;
          background: rgba(255,255,255,.62);
          border: 1px solid rgba(111, 92, 73, .14);
          padding: 8px 12px;
          border-radius: 999px;
          backdrop-filter: blur(6px);
          white-space: nowrap;
        }

        .pdLayout2{
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 16px;
          align-items: start;
        }

        /* =========================
           Banner (esquerda)
           ========================= */
        .pdBanner2{ position: sticky; top: 14px; }
        .pdBannerInner2{
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(111, 92, 73, .18);
          background:
            linear-gradient(160deg, rgba(255,253,247,1) 0%,
              rgba(255,244,227,1) 45%,
              rgba(240,226,205,1) 100%);
          box-shadow: 0 18px 48px rgba(0,0,0,.12);
          padding: 16px;
          position: relative;
        }
        .pdBannerInner2:before{
          content:"";
          position:absolute;
          inset:-1px;
          border-radius: 24px;
          background: radial-gradient(500px 220px at 20% 10%, rgba(255,255,255,.65), transparent 60%);
          pointer-events:none;
        }

        .pdBannerTop2{ display:flex; gap:10px; align-items:center; margin-bottom: 12px; position:relative; }
        .pdChip2{
          font-size: 12px;
          font-weight: 950;
          padding: 6px 10px;
          border-radius: 999px;
          color:#3f3327;
          background: rgba(255,255,255,.68);
          border: 1px solid rgba(111, 92, 73, .14);
        }
        .pdChipSoft2{ opacity:.92; }

        .pdBannerTitle2{
          font-size: 22px;
          font-weight: 1000;
          letter-spacing: -0.4px;
          color:#2f261e;
          margin-bottom: 6px;
          position:relative;
        }
        .pdBannerText2{
          font-size: 13px;
          line-height: 1.45;
          color:#6b5a49;
          font-weight: 650;
          opacity: .96;
          margin-bottom: 14px;
          position:relative;
        }

        .pdBannerCTA2{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:12px;
          margin-bottom: 14px;
          position:relative;
        }
        .pdBannerBtn2{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          padding: 10px 12px;
          border-radius: 14px;
          text-decoration:none;
          color:#ffffff;
          font-weight: 980;
          font-size: 13px;
          background: linear-gradient(135deg, #d1a67f 0%, #b88962 100%);
          box-shadow: 0 14px 28px rgba(184,137,98,.40);
          border: 1px solid rgba(255,255,255,.18);
          transition: filter .12s ease, transform .12s ease;
        }
        .pdBannerBtn2:hover{ filter: brightness(1.02); }
        .pdBannerBtn2:active{ transform: translateY(1px); }
        .pdHint2{
          font-size: 12px;
          color:#6b5a49;
          font-weight: 850;
          opacity: .92;
          text-align: right;
        }

        .pdStats2{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          position:relative;
        }
        .pdStatBox2{
          border-radius: 16px;
          background: rgba(255,255,255,.58);
          border: 1px solid rgba(111, 92, 73, .12);
          padding: 10px;
        }
        .pdStatLabel2{
          font-size: 11px;
          font-weight: 950;
          color:#6b5a49;
          opacity: .92;
          margin-bottom: 6px;
        }
        .pdStatValue2{
          font-size: 13px;
          font-weight: 1000;
          color:#2f261e;
          letter-spacing: -0.2px;
        }

        .pdBannerFoot2{
          margin-top: 12px;
          display:flex;
          align-items:center;
          gap: 8px;
          font-size: 12px;
          color:#6b5a49;
          font-weight: 850;
          opacity: .95;
          position:relative;
        }
        .pdDot{
          width: 8px; height: 8px; border-radius: 999px;
          background: linear-gradient(135deg, #d1a67f, #b88962);
          box-shadow: 0 6px 14px rgba(184,137,98,.35);
        }

        /* =========================
           Grid (direita) - não estica
           ========================= */
        .pdRight2{ min-width: 0; }
        .pdGrid2{
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 260px));
          gap: 16px;
          justify-content: start;
        }

        /* =========================
           CARD SUPER PREMIUM
           ========================= */
        .pdCard2{
          width: 260px;
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          background: linear-gradient(180deg, rgba(255,253,247,1) 0%, rgba(255,248,237,1) 100%);
          box-shadow: 0 14px 46px rgba(0,0,0,.10);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .pdCard2:before{
          content:"";
          position:absolute;
          inset:0;
          border-radius: 24px;
          padding: 1px;
          background: linear-gradient(135deg,
            rgba(210, 166, 127, .55),
            rgba(255,255,255,.55),
            rgba(184, 137, 98, .35));
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
                  mask-composite: exclude;
          pointer-events:none;
        }
        .pdCard2:hover{
          transform: translateY(-3px);
          box-shadow: 0 20px 62px rgba(0,0,0,.14);
        }

        .pdMedia2{
          position: relative;
          display:block;
          height: 190px;
          background: #efe3d2;
          overflow:hidden;
          text-decoration:none;
        }

        .pdGlow{
          position:absolute;
          inset:-30px -50px auto auto;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,.7), transparent 60%);
          filter: blur(2px);
          opacity: .9;
          pointer-events:none;
          z-index: 1;
        }

        .pdImg2{
          width:100%;
          height:100%;
          object-fit: cover;
          transform: scale(1.02);
          transition: transform .45s ease;
          display:block;
        }
        .pdCard2:hover .pdImg2{ transform: scale(1.09); }

        .pdOverlay{
          position:absolute;
          inset:auto 0 0 0;
          height: 70%;
          background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.22) 100%);
          opacity: .22;
          pointer-events:none;
          z-index: 2;
        }

        .pdImgFallback2{
          height:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#7b6a5a;
          font-weight:1000;
          font-size: 13px;
        }

        .pdBadges{
          position:absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          z-index: 3;
        }

        .pdBadge2{
          padding: 7px 10px;
          border-radius: 999px;
          font-weight: 1000;
          font-size: 12px;
          color: #ffffff;
          background: rgba(30, 20, 12, .92);
          box-shadow: 0 12px 22px rgba(0,0,0,.20);
        }
        .pdBadgeSoft{
          background: rgba(255,255,255,.78);
          color:#3f3327;
          border: 1px solid rgba(111, 92, 73, .18);
          box-shadow: 0 12px 22px rgba(0,0,0,.10);
          backdrop-filter: blur(6px);
        }

        .pdStock2{
          padding: 7px 10px;
          border-radius: 999px;
          font-weight: 1000;
          font-size: 12px;
          color: #3f3327;
          background: rgba(255, 255, 255, .78);
          border: 1px solid rgba(111, 92, 73, .18);
          backdrop-filter: blur(6px);
        }

        .pdBody2{
          padding: 14px 14px 16px;
          position: relative;
          z-index: 1;
        }

        .pdTitle2{
          color:#2f261e;
          font-weight: 1000;
          font-size: 15.5px;
          letter-spacing: -0.25px;
          line-height: 1.15;
          margin-bottom: 8px;
        }

        .pdDesc2{
          color:#6b5a49;
          font-size: 13px;
          line-height: 1.35;
          opacity: .92;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
          margin-bottom: 12px;
        }

        .pdPriceRow2{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap: 10px;
          margin-bottom: 12px;
        }

        .pdPrices2{
          display:flex;
          align-items: baseline;
          gap: 10px;
          min-width: 0;
        }
        .pdPrice2{
          font-weight: 1000;
          font-size: 15.5px;
          color:#2f261e;
          letter-spacing: -0.2px;
          white-space: nowrap;
        }
        .pdOldPrice2{
          font-weight: 900;
          font-size: 12px;
          color:#8b7a6a;
          text-decoration: line-through;
          white-space: nowrap;
        }

        .pdPill{
          font-size: 12px;
          font-weight: 1000;
          padding: 6px 10px;
          border-radius: 999px;
          color:#3f3327;
          background: rgba(255,255,255,.70);
          border: 1px solid rgba(184, 137, 98, .26);
          backdrop-filter: blur(6px);
          white-space: nowrap;
        }
        .pdPillMuted{
          border-color: rgba(111, 92, 73, .14);
          opacity: .95;
        }

        .pdActions2{
          display:flex;
          gap: 10px;
        }

        .pdBtn2{
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
          transition: transform .12s ease, filter .12s ease, background .12s ease, border-color .12s ease;
          user-select:none;
        }
        .pdBtn2:active{ transform: translateY(1px); }

        .pdBtnGhost2{
          background: rgba(255,255,255,.78);
          color:#3f3327;
          border-color: rgba(111, 92, 73, .18);
        }
        .pdBtnGhost2:hover{ filter: brightness(0.985); }

        .pdBtnPrimary2{
          background: linear-gradient(135deg, #d1a67f 0%, #b88962 100%);
          color: #ffffff;
          box-shadow: 0 14px 28px rgba(184, 137, 98, .40);
          border: 1px solid rgba(255,255,255,.18);
        }
        .pdBtnPrimary2:hover{ filter: brightness(1.02); }
        .pdBtnPrimary2:disabled{
          opacity: .60;
          cursor:not-allowed;
          box-shadow:none;
        }

        /* ===== Alert ===== */
        .pdAlert2{
          border-radius: 18px;
          padding: 14px;
          background: rgba(255,255,255,.70);
          border: 1px solid rgba(111, 92, 73, .16);
          color:#3f3327;
          font-weight: 900;
        }
        .pdAlertErr2{
          color:#8a1f1f;
          background: rgba(185,28,28,.06);
          border-color: rgba(185,28,28,.18);
        }

        /* ===== Toast ===== */
        .pdToast{
          position: fixed;
          right: 16px;
          bottom: 16px;
          max-width: 340px;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(255, 248, 237, .92);
          border: 1px solid rgba(111, 92, 73, .18);
          box-shadow: 0 16px 46px rgba(0,0,0,.16);
          color:#2f261e;
          font-weight: 950;
          font-size: 13px;
          transform: translateY(10px);
          opacity: 0;
          pointer-events: none;
          transition: opacity .18s ease, transform .18s ease;
          z-index: 9999;
          backdrop-filter: blur(8px);
        }
        .pdToastShow{
          opacity: 1;
          transform: translateY(0);
        }

        /* ===== Responsivo ===== */
        @media (max-width: 980px){
          .pdLayout2{ grid-template-columns: 1fr; }
          .pdBanner2{ position: relative; top: 0; }
        }

        @media (max-width: 560px){
          .pdWrap2{ padding: 26px 12px 34px; }
          .pdH2b{ font-size: 24px; }
          .pdHeader2{ align-items: flex-start; }
          .pdCount2{ margin-top: 4px; }

          .pdGrid2{
            grid-template-columns: 1fr;
            justify-content: stretch;
          }
          .pdCard2{ width: 100%; }
        }
      `}</style>
    </section>
  );
}