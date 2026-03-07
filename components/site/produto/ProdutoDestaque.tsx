'use client';

import api from '@/Api/conectar';
import { rotas } from '@/components/Bibioteca/config/rotas';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FiArrowRight, FiShoppingCart } from 'react-icons/fi';

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

        const res = await api.get<ApiResponse<ProdutoDestaqueApi[]>>(endpoint, {
          withCredentials: true,
        });

        const data = resolveApiData<ProdutoDestaqueApi[]>(res.data);
        if (!alive) return;

        const finalArray = Array.isArray(data) ? data : [];

        finalArray.sort(
          (a, b) => Number(a.ordem ?? 9999) - Number(b.ordem ?? 9999)
        );

        setItens(finalArray);
      } catch (e: any) {
        if (!alive) return;

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

      const res = await api.post(rotas.carrinho.adicionar, payload, {
        withCredentials: true,
      });

      alert(`"${item.produto_nome}" foi adicionado ao carrinho!`);
    } catch (e: any) {
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
        <article key={`${item.produto_id}-${item.ordem ?? ''}`} className="pd-card">
          <Link
            className="pd-media"
            href={detalhesHref}
            aria-label={`Detalhes ${item.produto_nome}`}
          >
            {imagemUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="pd-img"
                src={imagemUrl}
                alt={item.produto_nome}
                loading="lazy"
              />
            ) : (
              <div className="pd-img-fallback">Sem imagem</div>
            )}

            {descontoPct > 0 ? (
              <div className="pd-badge">
                <span>-{descontoPct}%</span>
              </div>
            ) : null}

            {semEstoque ? <div className="pd-stock">Esgotado</div> : null}
          </Link>

          <div className="pd-body">
            <div className="pd-title">{item.produto_nome}</div>

            <div className="pd-desc">{item.produto_descricao || ' '}</div>

            <div className="pd-price-row">
              <div className="pd-prices">
                <div className="pd-price">
                  {precoFinal != null
                    ? formatBRL(precoFinal)
                    : 'Preço sob consulta'}
                </div>

                {temPromo && preco != null ? (
                  <div className="pd-old-price">{formatBRL(preco)}</div>
                ) : null}
              </div>

              <div className={`pd-tag ${temPromo ? 'pd-tag-offer' : ''}`}>
                {temPromo ? 'Oferta' : 'Destaque'}
              </div>
            </div>

            <div className="pd-actions">
              <Link href={detalhesHref} className="pd-btn pd-btn-ghost">
                Detalhes
              </Link>

              <button
                type="button"
                className="pd-btn pd-btn-primary"
                onClick={() => adicionarCarrinho(item)}
                disabled={semEstoque || adicionando}
                title="Adicionar ao carrinho"
              >
                <FiShoppingCart size={16} />
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
    <section className="pd-wrap">
      <div className="pd-container">
        <div className="pd-header">
          <div>
            <h2 className="pd-h2">Destaques</h2>
            <p className="pd-sub">Selecionados com carinho • Coleção Premium</p>
          </div>

          <div className="pd-count">
            {!loading && !erro ? `${itens.length} item(ns)` : ''}
          </div>
        </div>

        <div className="pd-layout">
          <aside className="pd-banner">
            <div className="pd-banner-inner">
              <div className="pd-banner-top">
                <div className="pd-banner-chip">Novidades</div>
                <div className="pd-banner-chip pd-banner-chip2">Frete</div>
              </div>

              <div className="pd-banner-title">Coleção Premium</div>
              <div className="pd-banner-text">
                Produtos selecionados para presentear — delicados, elegantes e com preço especial.
              </div>

              <div className="pd-banner-cta">
                <Link className="pd-banner-btn" href={rotas.produtos.catalogo}>
                  Ver Catálogo
                  <FiArrowRight size={16} />
                </Link>
                <div className="pd-banner-hint">Atualizado diariamente</div>
              </div>

              <div className="pd-banner-mini">
                <div className="pd-banner-mini-box">
                  <div className="pd-mini-label">Oferta do dia</div>
                  <div className="pd-mini-value">até 30% OFF</div>
                </div>
                <div className="pd-banner-mini-box">
                  <div className="pd-mini-label">Pagamento</div>
                  <div className="pd-mini-value">Pix / Cartão</div>
                </div>
              </div>
            </div>
          </aside>

          <div className="pd-right">
            {loading ? (
              <div className="pd-loading">Carregando produtos...</div>
            ) : erro ? (
              <div className="pd-error">{erro}</div>
            ) : itens.length === 0 ? (
              <div className="pd-loading">Nenhum destaque ativo no momento.</div>
            ) : (
              <div className="pd-grid">{cards}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
