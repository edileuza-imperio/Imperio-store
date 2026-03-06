'use client';

import api from '@/Api/conectar';
import { rotas } from '@/components/Bibioteca/config/rotas';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;

  if (typeof v === 'string') {
    let cleaned = v.trim();
    if (!cleaned) return null;

    cleaned = cleaned.replace(/R\$/gi, '').replace(/\s/g, '');

    const hasComma = cleaned.includes(',');
    const hasDot = cleaned.includes('.');

    if (hasComma && hasDot) {
      if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (hasComma) {
      cleaned = cleaned.replace(',', '.');
    } else {
      const dots = (cleaned.match(/\./g) || []).length;
      if (dots > 1) {
        const lastDot = cleaned.lastIndexOf('.');
        cleaned =
          cleaned.slice(0, lastDot).replace(/\./g, '') + cleaned.slice(lastDot);
      }
    }

    cleaned = cleaned.replace(/[^\d.-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function buildImageUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;

  const base = (api.defaults.baseURL || '').replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : `/${path}`;
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

        console.log('[ProdutoDestaque] buscando destaques:', endpoint);

        const res = await api.get<ApiResponse<ProdutoDestaqueApi[]>>(endpoint, {
          withCredentials: true,
        });

        console.log('[ProdutoDestaque] resposta destaques:', res.data);

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
          '[ProdutoDestaque] erro ao carregar:',
          e?.response?.data || e
        );

        setErro(
          e?.response?.data?.message ||
            e?.response?.data?.mensagem ||
            e?.message ||
            'Erro ao carregar produtos em destaque'
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
        alert('Produto inválido para adicionar ao carrinho.');
        return;
      }

      if (addingId) return;

      setAddingId(produtoId);

      const payload = {
        produto_id: produtoId,
        quantidade: 1,
      };

      console.log('[ProdutoDestaque] enviando para carrinho:', {
        rota: rotas.carrinho.adicionar,
        payload,
      });

      const res = await api.post(rotas.carrinho.adicionar, payload, {
        withCredentials: true,
      });

      console.log('[ProdutoDestaque] resposta carrinho:', res.data);

      alert(`"${item.produto_nome}" foi adicionado ao carrinho!`);
    } catch (e: any) {
      console.error(
        '[ProdutoDestaque] erro ao adicionar no carrinho:',
        e?.response?.data || e
      );

      alert(
        e?.response?.data?.message ||
          e?.response?.data?.mensagem ||
          e?.response?.data?.erro ||
          e?.message ||
          'Erro ao adicionar no carrinho'
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
        <article key={`${item.produto_id}-${item.ordem ?? ''}`} className="pdCard">
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

            <div className="pdDesc">{item.produto_descricao || ' '}</div>

            <div className="pdPriceRow">
              <div className="pdPrices">
                <div className="pdPrice">
                  {precoFinal != null
                    ? formatBRL(precoFinal)
                    : 'Preço sob consulta'}
                </div>

                {temPromo && preco != null ? (
                  <div className="pdOldPrice">{formatBRL(preco)}</div>
                ) : null}
              </div>

              <div className={`pdTag ${temPromo ? 'pdTagOffer' : ''}`}>
                {temPromo ? 'Oferta' : 'Destaque'}
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
                  ? 'Indisponível'
                  : adicionando
                  ? 'Adicionando...'
                  : 'Adicionar'}
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
            {!loading && !erro ? `${itens.length} item(ns)` : ''}
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
        * { box-sizing: border-box; }

        .pdWrap {
          padding: 40px 16px 56px;
          background: linear-gradient(135deg, #faf8f3 0%, #f5f0e8 50%, #f0e8df 100%);
          min-height: 100vh;
        }

        .pdContainer {
          max-width: 1280px;
          margin: 0 auto;
        }

        /* Header */
        .pdHeader {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .pdH2 {
          margin: 0;
          font-size: 36px;
          font-weight: 900;
          letter-spacing: -0.8px;
          color: #2d2416;
          line-height: 1.1;
        }

        .pdSub {
          margin: 8px 0 0;
          font-size: 13px;
          color: #6b5a49;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .pdCount {
          font-size: 12px;
          color: #6b5a49;
          font-weight: 900;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(111, 92, 73, 0.15);
          padding: 10px 16px;
          border-radius: 999px;
          backdrop-filter: blur(8px);
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        /* Layout */
        .pdLayout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          align-items: start;
        }

        /* Banner Sidebar */
        .pdBanner {
          position: sticky;
          top: 20px;
        }

        .pdBannerInner {
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(111, 92, 73, 0.16);
          background: linear-gradient(160deg, rgba(255, 253, 248, 1) 0%, rgba(255, 246, 232, 1) 45%, rgba(240, 228, 208, 1) 100%);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
          padding: 24px;
          backdrop-filter: blur(10px);
        }

        .pdBannerTop {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 16px;
        }

        .pdBannerChip {
          font-size: 12px;
          font-weight: 900;
          padding: 8px 14px;
          border-radius: 999px;
          color: #3f3327;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(111, 92, 73, 0.14);
          backdrop-filter: blur(6px);
          transition: all 0.2s ease;
        }

        .pdBannerChip:hover {
          background: rgba(255, 255, 255, 0.85);
          border-color: rgba(111, 92, 73, 0.22);
        }

        .pdBannerChip2 {
          opacity: 0.85;
        }

        .pdBannerTitle {
          font-size: 26px;
          font-weight: 950;
          letter-spacing: -0.4px;
          color: #2d2416;
          margin-bottom: 10px;
          line-height: 1.2;
        }

        .pdBannerText {
          font-size: 14px;
          line-height: 1.5;
          color: #6b5a49;
          font-weight: 700;
          opacity: 0.95;
          margin-bottom: 18px;
        }

        .pdBannerCTA {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 18px;
        }

        .pdBannerBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 16px;
          border-radius: 14px;
          text-decoration: none;
          color: #ffffff;
          font-weight: 950;
          font-size: 13px;
          background: linear-gradient(135deg, #d4a574 0%, #b8896a 100%);
          box-shadow: 0 12px 28px rgba(184, 137, 98, 0.38);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.25s ease;
          cursor: pointer;
        }

        .pdBannerBtn:hover {
          filter: brightness(1.08);
          transform: translateY(-2px);
          box-shadow: 0 16px 36px rgba(184, 137, 98, 0.45);
        }

        .pdBannerBtn:active {
          transform: translateY(0);
        }

        .pdBannerHint {
          font-size: 11px;
          color: #6b5a49;
          font-weight: 900;
          opacity: 0.85;
          text-align: right;
          letter-spacing: 0.2px;
        }

        .pdBannerMini {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding-top: 18px;
          border-top: 1px solid rgba(111, 92, 73, 0.12);
        }

        .pdBannerMiniBox {
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(111, 92, 73, 0.12);
          padding: 12px;
          backdrop-filter: blur(6px);
          transition: all 0.2s ease;
        }

        .pdBannerMiniBox:hover {
          background: rgba(255, 255, 255, 0.75);
          border-color: rgba(111, 92, 73, 0.18);
        }

        .pdMiniLabel {
          font-size: 10px;
          font-weight: 950;
          color: #6b5a49;
          opacity: 0.85;
          margin-bottom: 6px;
          letter-spacing: 0.3px;
          text-transform: uppercase;
        }

        .pdMiniValue {
          font-size: 14px;
          font-weight: 950;
          color: #2d2416;
          letter-spacing: -0.2px;
        }

        /* Right Content */
        .pdRight {
          min-width: 0;
        }

        /* Grid */
        .pdGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
          justify-content: start;
        }

        /* Card */
        .pdCard {
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(111, 92, 73, 0.15);
          background: linear-gradient(180deg, rgba(255, 253, 248, 1) 0%, rgba(255, 248, 238, 1) 100%);
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.08);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .pdCard:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 52px rgba(0, 0, 0, 0.14);
          border-color: rgba(111, 92, 73, 0.24);
        }

        /* Media */
        .pdMedia {
          position: relative;
          display: block;
          height: 220px;
          background: linear-gradient(135deg, #efe3d2 0%, #e8dcc8 100%);
          overflow: hidden;
          text-decoration: none;
        }

        .pdImg {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.02);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: block;
        }

        .pdCard:hover .pdImg {
          transform: scale(1.09);
        }

        .pdImgFallback {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8b7a6a;
          font-weight: 950;
          font-size: 13px;
        }

        /* Badge */
        .pdBadge {
          position: absolute;
          top: 14px;
          left: 14px;
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 950;
          font-size: 12px;
          color: #ffffff;
          background: rgba(20, 10, 5, 0.92);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.22);
          backdrop-filter: blur(8px);
        }

        .pdStock {
          position: absolute;
          top: 14px;
          right: 14px;
          padding: 8px 12px;
          border-radius: 999px;
          font-weight: 950;
          font-size: 12px;
          color: #3f3327;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(111, 92, 73, 0.18);
          backdrop-filter: blur(8px);
        }

        /* Body */
        .pdBody {
          padding: 18px 16px 20px;
        }

        .pdTitle {
          color: #3f3327;
          font-weight: 950;
          font-size: 15px;
          letter-spacing: -0.2px;
          line-height: 1.25;
          margin: 0;
        }

        .pdDesc {
          margin-top: 10px;
          color: #6b5a49;
          font-size: 13px;
          line-height: 1.4;
          opacity: 0.9;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
        }

        /* Price Row */
        .pdPriceRow {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-top: 14px;
          border-top: 1px solid rgba(111, 92, 73, 0.1);
        }

        .pdPrices {
          display: flex;
          align-items: baseline;
          gap: 10px;
          min-width: 0;
        }

        .pdPrice {
          font-weight: 950;
          font-size: 16px;
          color: #2d2416;
          letter-spacing: -0.2px;
          white-space: nowrap;
        }

        .pdOldPrice {
          font-weight: 850;
          font-size: 12px;
          color: #8b7a6a;
          text-decoration: line-through;
          white-space: nowrap;
        }

        .pdTag {
          font-size: 11px;
          font-weight: 950;
          padding: 6px 10px;
          border-radius: 999px;
          color: #3f3327;
          background: rgba(255, 255, 255, 0.65);
          border: 1px solid rgba(111, 92, 73, 0.14);
          backdrop-filter: blur(6px);
          white-space: nowrap;
          letter-spacing: 0.2px;
        }

        .pdTagOffer {
          background: rgba(255, 255, 255, 0.75);
          border-color: rgba(184, 137, 98, 0.3);
          color: #8b5f2f;
        }

        /* Actions */
        .pdActions {
          margin-top: 14px;
          display: flex;
          gap: 10px;
        }

        .pdBtn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 11px 12px;
          border-radius: 12px;
          font-weight: 950;
          font-size: 12px;
          border: 1px solid transparent;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          font-family: inherit;
        }

        .pdBtn:active {
          transform: translateY(1px);
        }

        .pdBtnGhost {
          background: rgba(255, 255, 255, 0.75);
          color: #3f3327;
          border-color: rgba(111, 92, 73, 0.18);
        }

        .pdBtnGhost:hover {
          filter: brightness(0.96);
          border-color: rgba(111, 92, 73, 0.28);
        }

        .pdBtnPrimary {
          background: linear-gradient(135deg, #d4a574 0%, #b8896a 100%);
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(184, 137, 98, 0.35);
        }

        .pdBtnPrimary:hover {
          filter: brightness(1.06);
          transform: translateY(-1px);
          box-shadow: 0 14px 32px rgba(184, 137, 98, 0.42);
        }

        .pdBtnPrimary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        /* Alert */
        .pdAlert {
          border-radius: 18px;
          padding: 16px 18px;
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(111, 92, 73, 0.16);
          color: #3f3327;
          font-weight: 850;
          font-size: 14px;
          text-align: center;
          backdrop-filter: blur(6px);
        }

        .pdAlertErr {
          color: #8a1f1f;
          background: rgba(185, 28, 28, 0.08);
          border-color: rgba(185, 28, 28, 0.18);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .pdLayout {
            grid-template-columns: 1fr;
          }

          .pdBanner {
            position: relative;
            top: 0;
          }

          .pdGrid {
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .pdWrap {
            padding: 32px 12px 44px;
          }

          .pdH2 {
            font-size: 28px;
          }

          .pdHeader {
            align-items: flex-start;
            margin-bottom: 24px;
          }

          .pdCount {
            margin-top: 4px;
          }

          .pdGrid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          }

          .pdCard {
            border-radius: 16px;
          }

          .pdMedia {
            height: 200px;
          }

          .pdBannerInner {
            padding: 18px;
          }

          .pdBannerTitle {
            font-size: 22px;
          }
        }

        @media (max-width: 560px) {
          .pdWrap {
            padding: 24px 12px 32px;
          }

          .pdH2 {
            font-size: 24px;
          }

          .pdHeader {
            flex-direction: column;
            gap: 12px;
          }

          .pdGrid {
            grid-template-columns: 1fr;
          }

          .pdCard {
            width: 100%;
          }

          .pdMedia {
            height: 180px;
          }

          .pdBody {
            padding: 14px 12px 16px;
          }

          .pdBtn {
            padding: 10px 10px;
            font-size: 11px;
          }
        }
      `}</style>
    </section>
  );
}