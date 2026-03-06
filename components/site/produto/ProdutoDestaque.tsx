"use client";

import api from "@/Api/conectar";
import { rotas } from "@/components/Bibioteca/config/rotas";
import Link from "next/link";
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
  mensagem?: string;
  status?: number;
  data?: T;
  dados?: T;
};

function resolveApiData<T>(payload: any): T {
  if (Array.isArray(payload)) return payload as T;

  if (payload?.data != null) return payload.data as T;
  if (payload?.dados != null) return payload.dados as T;

  if (payload?.dados?.dados != null) return payload.dados.dados as T;
  if (payload?.data?.data != null) return payload.data.data as T;

  return payload as T;
}

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;

  if (typeof v === "string") {
    let cleaned = v.trim();
    if (!cleaned) return null;

    cleaned = cleaned.replace(/R\$/gi, "").replace(/\s/g, "");

    const hasComma = cleaned.includes(",");
    const hasDot = cleaned.includes(".");

    if (hasComma && hasDot) {
      if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
        cleaned = cleaned.replace(/\./g, "").replace(",", ".");
      } else {
        cleaned = cleaned.replace(/,/g, "");
      }
    } else if (hasComma) {
      cleaned = cleaned.replace(",", ".");
    } else {
      const dots = (cleaned.match(/\./g) || []).length;

      if (dots > 1) {
        const lastDot = cleaned.lastIndexOf(".");
        cleaned =
          cleaned.slice(0, lastDot).replace(/\./g, "") + cleaned.slice(lastDot);
      }
    }

    cleaned = cleaned.replace(/[^\d.-]/g, "");

    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
        const endpoint = rotas.produtos.destaques.listar;

        console.log("[ProdutoDestaque] buscando destaques:", endpoint);

        const res = await api.get<ApiResponse<ProdutoDestaqueApi[]>>(endpoint, {
          withCredentials: true,
        });

        console.log("[ProdutoDestaque] resposta destaques:", res.data);

        const data = resolveApiData<ProdutoDestaqueApi[]>(res.data);
        if (!alive) return;

        const finalArray = Array.isArray(data) ? data : [];

        finalArray.sort(
          (a, b) => Number(a.ordem ?? 9999) - Number(b.ordem ?? 9999)
        );

        setItens(finalArray);
      } catch (e: any) {
        if (!alive) return;

        console.error(
          "[ProdutoDestaque] erro ao carregar:",
          e?.response?.data || e
        );

        setErro(
          e?.response?.data?.message ||
            e?.response?.data?.mensagem ||
            e?.message ||
            "Erro ao carregar produtos em destaque"
        );
        setItens([]);
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

  async function adicionarCarrinho(item: ProdutoDestaqueApi) {
    try {
      const produtoId = Number(item.produto_id || 0);

      if (!produtoId) {
        alert("Produto inválido para adicionar ao carrinho.");
        return;
      }

      if (addingId) return;

      setAddingId(produtoId);

      const payload = {
        produto_id: produtoId,
        quantidade: 1,
      };

      console.log("[ProdutoDestaque] enviando para carrinho:", {
        rota: rotas.carrinho.adicionar,
        payload,
      });

      const res = await api.post(rotas.carrinho.adicionar, payload, {
        withCredentials: true,
      });

      console.log("[ProdutoDestaque] resposta carrinho:", res.data);

      alert(`"${item.produto_nome}" foi adicionado ao carrinho!`);
    } catch (e: any) {
      console.error(
        "[ProdutoDestaque] erro ao adicionar no carrinho:",
        e?.response?.data || e
      );

      alert(
        e?.response?.data?.message ||
          e?.response?.data?.mensagem ||
          e?.response?.data?.erro ||
          e?.message ||
          "Erro ao adicionar no carrinho"
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

      const adicionando = addingId === item.produto_id;

      return (
        <article key={`${item.produto_id}-${item.ordem ?? ""}`} className="pdCard">
          <Link
            className="pdMedia"
            href={detalhesHref}
            aria-label={`Detalhes ${item.produto_nome}`}
          >
            {imagemUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="pdImg"
                src={imagemUrl}
                alt={item.produto_nome}
                loading="lazy"
              />
            ) : (
              <div className="pdImgFallback">Sem imagem</div>
            )}

            {descontoPct > 0 ? (
              <div className="pdBadge">
                <span>-{descontoPct}%</span>
              </div>
            ) : null}

            {semEstoque ? <div className="pdStock">Esgotado</div> : null}
          </Link>

          <div className="pdBody">
            <div className="pdTitle">{item.produto_nome}</div>

            <div className="pdDesc">{item.produto_descricao || " "}</div>

            <div className="pdPriceRow">
              <div className="pdPrices">
                <div className="pdPrice">
                  {precoFinal != null
                    ? formatBRL(precoFinal)
                    : "Preço sob consulta"}
                </div>

                {temPromo && preco != null ? (
                  <div className="pdOldPrice">{formatBRL(preco)}</div>
                ) : null}
              </div>

              <div className={`pdTag ${temPromo ? "pdTagOffer" : ""}`}>
                {temPromo ? "Oferta" : "Destaque"}
              </div>
            </div>

            <div className="pdActions">
              <Link href={detalhesHref} className="pdBtn pdBtnGhost">
                Detalhes
              </Link>

              <button
                type="button"
                className="pdBtn pdBtnPrimary"
                onClick={() => adicionarCarrinho(item)}
                disabled={semEstoque || adicionando}
              >
                {semEstoque
                  ? "Indisponível"
                  : adicionando
                  ? "Adicionando..."
                  : "Adicionar"}
              </button>
            </div>
          </div>
        </article>
      );
    });
  }, [itens, addingId]);

  return (
    <section className="pdWrap">
      <div className="pdContainer">
        <div className="pdHeader">
          <div>
            <h2 className="pdH2">Destaques</h2>
            <p className="pdSub">Selecionados com carinho • tons creme</p>
          </div>

          <div className="pdCount">
            {!loading && !erro ? `${itens.length} item(ns)` : ""}
          </div>
        </div>

        <div className="pdLayout">
          <aside className="pdBanner">
            <div className="pdBannerInner">
              <div className="pdBannerTop">
                <div className="pdBannerChip">Novidades</div>
                <div className="pdBannerChip pdBannerChip2">Frete</div>
              </div>

              <div className="pdBannerTitle">Coleção Creme</div>
              <div className="pdBannerText">
                Produtos selecionados para presentear — delicados, elegantes e com
                preço especial.
              </div>

              <div className="pdBannerCTA">
                <Link className="pdBannerBtn" href={rotas.produtos.catalogo}>
                  Ver catálogo
                </Link>
                <div className="pdBannerHint">Atualizado diariamente</div>
              </div>

              <div className="pdBannerMini">
                <div className="pdBannerMiniBox">
                  <div className="pdMiniLabel">Oferta do dia</div>
                  <div className="pdMiniValue">até 30% OFF</div>
                </div>
                <div className="pdBannerMiniBox">
                  <div className="pdMiniLabel">Pagamento</div>
                  <div className="pdMiniValue">Pix / Cartão</div>
                </div>
              </div>
            </div>
          </aside>

          <div className="pdRight">
            {loading ? (
              <div className="pdAlert">Carregando…</div>
            ) : erro ? (
              <div className="pdAlert pdAlertErr">{erro}</div>
            ) : itens.length === 0 ? (
              <div className="pdAlert">Nenhum destaque ativo no momento.</div>
            ) : (
              <div className="pdGrid">{cards}</div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .pdWrap{
          padding: 34px 16px 46px;
          background: radial-gradient(1200px 520px at 18% 0%, #fffaf1 0%, #f6efe4 55%, #f1e7d9 100%);
        }
        .pdContainer{ max-width: 1140px; margin: 0 auto; }

        .pdHeader{
          display:flex; align-items:flex-end; justify-content:space-between;
          gap:16px; margin-bottom: 16px;
        }
        .pdH2{
          margin:0; font-size: 28px; letter-spacing: -0.6px;
          color:#3f3327; font-weight: 950;
        }
        .pdSub{ margin:6px 0 0; font-size: 13px; color:#6b5a49; font-weight: 650; }
        .pdCount{
          font-size: 12px; color:#6b5a49; font-weight: 900;
          background: rgba(255,255,255,.62);
          border: 1px solid rgba(111, 92, 73, .14);
          padding: 8px 12px; border-radius: 999px;
          backdrop-filter: blur(6px);
          white-space: nowrap;
        }

        .pdLayout{
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 16px;
          align-items: start;
        }

        .pdBanner{ position: sticky; top: 14px; }
        .pdBannerInner{
          border-radius: 22px; overflow: hidden;
          border: 1px solid rgba(111, 92, 73, .18);
          background: linear-gradient(160deg, rgba(255,253,247,1) 0%, rgba(255,244,227,1) 45%, rgba(240,226,205,1) 100%);
          box-shadow: 0 14px 40px rgba(0,0,0,.10);
          padding: 16px;
        }
        .pdBannerTop{ display:flex; gap:10px; align-items:center; margin-bottom: 12px; }
        .pdBannerChip{
          font-size: 12px; font-weight: 950; padding: 6px 10px; border-radius: 999px;
          color:#3f3327; background: rgba(255,255,255,.65);
          border: 1px solid rgba(111, 92, 73, .14);
        }
        .pdBannerChip2{ opacity: .92; }
        .pdBannerTitle{
          font-size: 22px; font-weight: 980; letter-spacing: -0.4px;
          color:#2f261e; margin-bottom: 6px;
        }
        .pdBannerText{
          font-size: 13px; line-height: 1.45; color:#6b5a49; font-weight: 650;
          opacity: .95; margin-bottom: 14px;
        }
        .pdBannerCTA{
          display:flex; align-items:center; justify-content:space-between;
          gap:12px; margin-bottom: 14px;
        }
        .pdBannerBtn{
          display:inline-flex; align-items:center; justify-content:center;
          padding: 10px 12px; border-radius: 14px;
          text-decoration:none; color:#ffffff; font-weight: 950; font-size: 13px;
          background: linear-gradient(135deg, #d1a67f 0%, #b88962 100%);
          box-shadow: 0 12px 24px rgba(184,137,98,.35);
          border: 1px solid rgba(255,255,255,.18);
        }
        .pdBannerBtn:hover{ filter: brightness(1.02); color:#fff; }
        .pdBannerHint{ font-size: 12px; color:#6b5a49; font-weight: 800; opacity: .9; text-align: right; }
        .pdBannerMini{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .pdBannerMiniBox{
          border-radius: 16px;
          background: rgba(255,255,255,.55);
          border: 1px solid rgba(111, 92, 73, .12);
          padding: 10px;
        }
        .pdMiniLabel{ font-size: 11px; font-weight: 900; color:#6b5a49; opacity: .9; margin-bottom: 6px; }
        .pdMiniValue{ font-size: 13px; font-weight: 980; color:#2f261e; letter-spacing: -0.2px; }

        .pdRight{ min-width: 0; }

        .pdGrid{
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 260px));
          gap: 16px;
          justify-content: start;
        }

        .pdCard{
          width: 260px;
          border-radius: 22px;
          overflow:hidden;
          border: 1px solid rgba(111, 92, 73, .16);
          background: linear-gradient(180deg, rgba(255,253,247,1) 0%, rgba(255,248,237,1) 100%);
          box-shadow: 0 10px 32px rgba(0,0,0,.09);
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .pdCard:hover{
          transform: translateY(-3px);
          box-shadow: 0 16px 46px rgba(0,0,0,.13);
          border-color: rgba(111, 92, 73, .26);
        }

        .pdMedia{
          position: relative; display:block;
          height: 190px;
          background: #efe3d2;
          overflow:hidden;
          text-decoration:none;
        }
        .pdImg{
          width:100%; height:100%;
          object-fit: cover;
          transform: scale(1.02);
          transition: transform .35s ease;
          display:block;
        }
        .pdCard:hover .pdImg{ transform: scale(1.07); }
        .pdImgFallback{
          height:100%;
          display:flex; align-items:center; justify-content:center;
          color:#7b6a5a; font-weight:900; font-size: 13px;
        }

        .pdBadge{
          position:absolute; top: 12px; left: 12px;
          padding: 7px 10px; border-radius: 999px;
          font-weight: 980; font-size: 12px;
          color: #ffffff; background: rgba(30, 20, 12, .92);
          box-shadow: 0 10px 20px rgba(0,0,0,.18);
        }
        .pdStock{
          position:absolute; top: 12px; right: 12px;
          padding: 7px 10px; border-radius: 999px;
          font-weight: 980; font-size: 12px;
          color: #3f3327;
          background: rgba(255, 255, 255, .78);
          border: 1px solid rgba(111, 92, 73, .18);
          backdrop-filter: blur(6px);
        }

        .pdBody{ padding: 14px 14px 16px; }
        .pdTitle{
          color:#3f3327; font-weight: 980; font-size: 15px;
          letter-spacing: -0.2px; line-height: 1.15;
        }
        .pdDesc{
          margin-top: 8px;
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

        .pdPriceRow{
          margin-top: 12px;
          display:flex; align-items:center; justify-content:space-between;
          gap: 10px;
        }
        .pdPrices{ display:flex; align-items: baseline; gap: 10px; min-width: 0; }
        .pdPrice{ font-weight: 980; font-size: 15px; color:#2f261e; letter-spacing: -0.2px; white-space: nowrap; }
        .pdOldPrice{ font-weight: 850; font-size: 12px; color:#8b7a6a; text-decoration: line-through; white-space: nowrap; }
        .pdTag{
          font-size: 12px; font-weight: 980;
          padding: 6px 10px; border-radius: 999px;
          color:#3f3327;
          background: rgba(255,255,255,.62);
          border: 1px solid rgba(111, 92, 73, .14);
          backdrop-filter: blur(6px);
          white-space: nowrap;
        }
        .pdTagOffer{ background: rgba(255,255,255,.72); border-color: rgba(184,137,98,.28); }

        .pdActions{ margin-top: 12px; display:flex; gap: 10px; }
        .pdBtn{
          flex: 1;
          display:inline-flex; align-items:center; justify-content:center;
          padding: 10px 12px;
          border-radius: 14px;
          font-weight: 980; font-size: 13px;
          border: 1px solid transparent;
          cursor:pointer;
          text-decoration:none;
          transition: transform .12s ease, filter .12s ease, background .12s ease, border-color .12s ease;
          user-select:none;
        }
        .pdBtn:active{ transform: translateY(1px); }

        .pdBtnGhost{
          background: rgba(255,255,255,.72);
          color:#3f3327;
          border-color: rgba(111, 92, 73, .18);
        }
        .pdBtnGhost:hover{ filter: brightness(0.98); color:#3f3327; }

        .pdBtnPrimary{
          background: linear-gradient(135deg, #d1a67f 0%, #b88962 100%);
          color: #ffffff;
          box-shadow: 0 12px 26px rgba(184, 137, 98, .35);
        }
        .pdBtnPrimary:hover{ filter: brightness(1.02); }
        .pdBtnPrimary:disabled{ opacity: .55; cursor:not-allowed; box-shadow:none; }

        .pdAlert{
          border-radius: 18px;
          padding: 14px;
          background: rgba(255,255,255,.65);
          border: 1px solid rgba(111, 92, 73, .16);
          color:#3f3327;
          font-weight: 850;
        }
        .pdAlertErr{
          color:#8a1f1f;
          background: rgba(185,28,28,.06);
          border-color: rgba(185,28,28,.18);
        }

        @media (max-width: 980px){
          .pdLayout{ grid-template-columns: 1fr; }
          .pdBanner{ position: relative; top: 0; }
          .pdGrid{ grid-template-columns: repeat(auto-fill, minmax(240px, 240px)); }
          .pdCard{ width: 240px; }
        }
        @media (max-width: 560px){
          .pdWrap{ padding: 26px 12px 34px; }
          .pdH2{ font-size: 24px; }
          .pdHeader{ align-items: flex-start; }
          .pdCount{ margin-top: 4px; }
          .pdGrid{ grid-template-columns: 1fr; justify-content: stretch; }
          .pdCard{ width: 100%; }
        }
      `}</style>
    </section>
  );
}