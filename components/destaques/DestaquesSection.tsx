"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
};

type Produto = {
  id_produto?: number;
  nome?: string;
  slug?: string;
  descricao?: string;
  preco?: string | number;
  imagem?: string;

  id_destaque?: number;
  produto_nome?: string;
  produto_slug?: string;
  produto_descricao?: string;
  produto_preco?: string;
  produto_imagem?: string;

  ordem?: number;
};

function getImagemUrl(caminho?: string) {
  if (!caminho) return "";
  const base = api.defaults.baseURL || "";
  const clean = String(caminho).replace(/^\/+/, "");
  return `${base}/${clean}`;
}

function formatMoney(value: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function normalizarProduto(p: Produto) {
  return {
    key:
      p.id_produto ??
      p.id_destaque ??
      `${p.slug ?? p.produto_slug ?? ""}-${p.ordem ?? ""}`,
    nome: p.nome ?? p.produto_nome ?? "",
    slug: p.slug ?? p.produto_slug ?? "",
    descricao: p.descricao ?? p.produto_descricao ?? "",
    preco: p.preco ?? p.produto_preco ?? 0,
    imagem: p.imagem ?? p.produto_imagem ?? "",
  };
}

export default function DestaquesSection() {
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      setLoading(true);

      const res = await api.get("/admin/campanha/destaques");
      const dados = res.data?.dados ?? {};

      const camp: Campanha | null = dados.campanha ?? null;
      const prods: Produto[] = Array.isArray(dados.produtos) ? dados.produtos : [];

      if (!camp || prods.length === 0) {
        setCampanha(null);
        setProdutos([]);
        return;
      }

      setCampanha(camp);
      setProdutos(prods);
    } catch (err) {
      console.error("Erro ao carregar destaques:", err);
      setCampanha(null);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const temConteudo = useMemo(() => !!campanha && produtos.length > 0, [campanha, produtos]);

  if (loading || !temConteudo || !campanha) return null;

  const camp = campanha;

  return (
    <section className="py-5 uiSection">
      <div className="container">
        {/* BANNER (igual seu, só com botão flutuante) */}
        <div className="p-5 rounded-4 text-center mb-5 uiBanner position-relative">
          <h2 className="fw-bold mb-2">{camp.titulo}</h2>

          {camp.descricao ? (
            <p className="mb-0 uiBannerDesc">{camp.descricao}</p>
          ) : (
            <p className="mb-0 uiBannerDesc">Produtos selecionados para você.</p>
          )}

          {/* ✅ botão flutuante */}
          <Link
            href={`/campanha/${camp.slug}`}
            className="btn uiFloatingBtn"
            title="Ver coleção"
          >
            <i className="bi bi-grid me-2" />
            Ver coleção
          </Link>
        </div>

        {/* PRODUTOS (SÓ O DESIGN DOS CARDS) */}
        <div className="row g-4">
          {produtos.map((raw) => {
            const p = normalizarProduto(raw);
            const img = getImagemUrl(p.imagem);

            return (
              <div key={p.key} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                <div className="card border-0 h-100 uiCard">
                  {/* imagem */}
                  <div className="uiImgWrap position-relative">
                    {img ? (
                      <img src={img} alt={p.nome} className="uiImg" />
                    ) : (
                      <div className="uiNoImg">
                        <div className="text-center">
                          <i className="bi bi-image fs-2 d-block mb-1" />
                          <span className="small fw-semibold">Sem imagem</span>
                        </div>
                      </div>
                    )}

                    <span className="badge uiBadge">
                      <i className="bi bi-star-fill me-1" />
                      Destaque
                    </span>
                  </div>

                  {/* body */}
                  <div className="card-body d-flex flex-column">
                    <h6 className="fw-semibold mb-1 uiTitleClamp">{p.nome}</h6>

                    <p className="small text-muted mb-2 uiDescClamp">
                      {p.descricao ? p.descricao : "Produto selecionado para destaque."}
                    </p>

                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="fw-bold fs-5 uiPrice">{formatMoney(p.preco)}</div>
                      <span className="badge uiMiniPill">
                        <i className="bi bi-patch-check me-1" />
                        Top
                      </span>
                    </div>

                    {/* botões com ícone (como você pediu) */}
                    <div className="mt-auto d-flex gap-2">
                      <Link
                        href={`/produto/${p.slug}`}
                        className="btn uiBtnSoft w-100"
                        title="Ver detalhes"
                      >
                        <i className="bi bi-eye" />
                      </Link>

                      <button
                        type="button"
                        className="btn uiBtnPrimary w-100"
                        title="Adicionar ao carrinho"
                        onClick={() => console.log("Adicionar:", p.slug)}
                      >
                        <i className="bi bi-cart-plus" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <style jsx>{`
          /* fundo geral */
          .uiSection {
            background: #fbf3ee; /* creme */
          }

          /* banner igual sua ideia, só mais premium */
          .uiBanner {
            background: linear-gradient(135deg, #c57a7a 0%, #e7c9b7 65%, #fbf3ee 140%);
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.18);
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
            overflow: hidden;
          }

          .uiBanner::after {
            content: "";
            position: absolute;
            inset: 0;
            opacity: 0.09;
            background-image: radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px);
            background-size: 10px 10px;
            pointer-events: none;
          }

          .uiBannerDesc {
            opacity: 0.9;
            max-width: 860px;
            margin: 0 auto;
          }

          /* ✅ botão flutuante */
          .uiFloatingBtn {
            position: absolute;
            right: 18px;
            bottom: -18px;
            background: #fff;
            color: #8a4a4a;
            border: 1px solid rgba(0, 0, 0, 0.08);
            border-radius: 999px;
            padding: 10px 16px;
            font-weight: 800;
            box-shadow: 0 14px 30px rgba(0, 0, 0, 0.18);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            z-index: 2;
          }

          .uiFloatingBtn:hover {
            background: #fff7f2;
            border-color: rgba(197, 122, 122, 0.28);
            color: #7a3f3f;
          }

          /* ===== Cards premium ===== */
          .uiCard {
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 18px rgba(0, 0, 0, 0.08);
            transition: transform 0.18s ease, box-shadow 0.18s ease;
            background: #fff;
          }

          .uiCard:hover {
            transform: translateY(-5px);
            box-shadow: 0 18px 34px rgba(0, 0, 0, 0.14);
          }

          .uiImgWrap {
            height: 240px;
            overflow: hidden;
            background: #f7e6dc;
          }

          .uiImg {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.25s ease;
            display: block;
          }

          .uiCard:hover .uiImg {
            transform: scale(1.05);
          }

          .uiNoImg {
            height: 240px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(0, 0, 0, 0.55);
            background: linear-gradient(135deg, #f7e6dc 0%, #fbf3ee 100%);
          }

          .uiBadge {
            position: absolute;
            top: 12px;
            left: 12px;
            background: #c57a7a;
            border: 1px solid rgba(255, 255, 255, 0.22);
            border-radius: 999px;
            padding: 8px 12px;
            font-weight: 800;
          }

          .uiMiniPill {
            background: rgba(231, 201, 183, 0.55);
            color: #6b3a3a;
            border: 1px solid rgba(197, 122, 122, 0.18);
            border-radius: 999px;
            padding: 6px 10px;
            font-weight: 800;
          }

          .uiPrice {
            color: #c57a7a;
          }

          .uiBtnPrimary {
            background: #c57a7a;
            color: #fff;
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 12px;
            font-weight: 800;
          }

          .uiBtnPrimary:hover {
            background: #b86f6f;
            color: #fff;
          }

          .uiBtnSoft {
            background: #fff;
            color: #3b2a2a;
            border: 1px solid rgba(0, 0, 0, 0.12);
            border-radius: 12px;
            font-weight: 800;
          }

          .uiBtnSoft:hover {
            background: #fff7f2;
            border-color: rgba(197, 122, 122, 0.25);
          }

          /* clamp */
          .uiTitleClamp {
            display: -webkit-box;
            -webkit-line-clamp: 1;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .uiDescClamp {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            min-height: 38px;
          }

          /* em telas pequenas, não deixar botão flutuante esmagar */
          @media (max-width: 576px) {
            .uiFloatingBtn {
              position: static;
              margin-top: 16px;
              box-shadow: 0 10px 22px rgba(0, 0, 0, 0.16);
            }
          }
        `}</style>
      </div>
    </section>
  );
}