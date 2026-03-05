"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
  statusid?: number;
  nivel?: number; // 👈 precisa vir da API (ex: 9)
};

type Produto = {
  id_destaque: number;
  produto_nome: string;
  produto_slug: string;
  produto_descricao?: string;
  produto_preco: string;
  produto_imagem?: string;
  nivel?: number; // 👈 precisa vir da API (ex: 9)
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

export default function DestaquesSection() {
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      setLoading(true);

      // ===== CAMPANHAS =====
      const resCamp = await api.get("/admin/campanhas");
      const campanhas: Campanha[] = resCamp.data?.dados?.campanhas ?? [];

      // ✅ só pega campanha se: statusid === 3 (destaque) E nivel === 9
      const destaqueNivel9 =
        campanhas.find((c) => Number(c.statusid) === 3 && Number(c.nivel) === 9) ??
        null;

      // ===== PRODUTOS EM DESTAQUE =====
      const resProd = await api.get("/admin/produtos/destaques");
      const lista: Produto[] = resProd.data?.dados ?? [];

      // ✅ só mantém produtos nivel 9
      const produtosNivel9 = Array.isArray(lista)
        ? lista.filter((p) => Number(p.nivel) === 9)
        : [];

      // ✅ regra: se NÃO for nível 9, some com tudo (campanha + cards)
      if (!destaqueNivel9 || produtosNivel9.length === 0) {
        setCampanha(null);
        setProdutos([]);
        return;
      }

      setCampanha(destaqueNivel9);
      setProdutos(produtosNivel9);
    } catch (err) {
      // se der erro, não mostra nada pra não ficar “meio carregado”
      setCampanha(null);
      setProdutos([]);
      console.error("Erro ao carregar destaques:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const temConteudo = useMemo(() => !!campanha && produtos.length > 0, [campanha, produtos]);

  // ✅ se não tem nível 9 (ou está carregando), não renderiza nada
  if (loading || !temConteudo) return null;

  return (
    <section className="py-5" style={{ background: "#f5eee8" }}>
      <div className="container">
        {/* CAMPANHA */}
        {campanha && (
          <div className="text-center mb-5">
            <span
              className="badge px-3 py-2 mb-3"
              style={{
                background: "#2e7d32", // ✅ verde (destaque)
                fontSize: "13px",
              }}
            >
              Destaque • nível 9
            </span>

            <h1 className="fw-bold mb-2" style={{ letterSpacing: "0.5px" }}>
              {campanha.titulo}
            </h1>

            {campanha.descricao ? <p className="text-muted mb-3">{campanha.descricao}</p> : null}

            <Link
              href={`/campanha/${campanha.slug}`}
              className="btn text-white px-4"
              style={{
                background: "#c78c5c",
                borderRadius: "10px",
              }}
            >
              Ver catálogo
            </Link>
          </div>
        )}

        {/* PRODUTOS */}
        <div className="row g-4">
          {produtos.map((p) => {
            const img = getImagemUrl(p.produto_imagem);

            return (
              <div key={p.id_destaque} className="col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm h-100 rounded-4 cardHover">
                  {/* IMAGEM */}
                  <div className="position-relative">
                    {img ? (
                      <img src={img} alt={p.produto_nome} className="card-img-top imgHover" />
                    ) : (
                      <div className="imgFallback">Sem imagem</div>
                    )}

                    <span
                      className="badge position-absolute px-3 py-2"
                      style={{
                        top: "12px",
                        left: "12px",
                        background: "#2e7d32", // ✅ verde (destaque)
                        borderRadius: "20px",
                        fontSize: "12px",
                      }}
                    >
                      Destaque • nível 9
                    </span>
                  </div>

                  {/* BODY */}
                  <div className="card-body d-flex flex-column p-4">
                    <h5 className="fw-semibold mb-1" style={{ fontSize: "18px" }}>
                      {p.produto_nome}
                    </h5>

                    {p.produto_descricao ? (
                      <p className="text-muted mb-2" style={{ fontSize: "14px" }}>
                        {p.produto_descricao}
                      </p>
                    ) : null}

                    <div className="fw-bold mb-3" style={{ color: "#c78c5c", fontSize: "22px" }}>
                      {formatMoney(p.produto_preco)}
                    </div>

                    {/* BOTÕES */}
                    <div className="d-flex gap-2 mt-auto">
                      <Link
                        href={`/produto/${p.produto_slug}`}
                        className="btn btn-light border w-100"
                        style={{ borderRadius: "10px", fontWeight: "500" }}
                      >
                        Detalhes
                      </Link>

                      <button
                        type="button"
                        className="btn w-100 text-white"
                        style={{
                          background: "#c78c5c",
                          borderRadius: "10px",
                          fontWeight: "600",
                        }}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ✅ hover via CSS (melhora INP vs JS mouse events) */}
        <style jsx>{`
          .cardHover {
            cursor: pointer;
            overflow: hidden;
            transition: transform 0.22s ease, box-shadow 0.22s ease;
          }
          .cardHover:hover {
            transform: translateY(-6px);
          }
          .imgHover {
            height: 240px;
            width: 100%;
            object-fit: cover;
            transition: transform 0.28s ease;
          }
          .cardHover:hover .imgHover {
            transform: scale(1.03);
          }
          .imgFallback {
            height: 240px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.06);
            color: rgba(0, 0, 0, 0.55);
            font-weight: 600;
          }
        `}</style>
      </div>
    </section>
  );
}