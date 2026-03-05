"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import { FiStar } from "react-icons/fi";

/* =============================
TIPOS
============================= */

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
  banner?: string;
  statusid?: number;
};

type ProdutoDestaque = {
  id_destaque: number;
  produto_id: number;
  produto_nome: string;
  produto_slug: string;
  produto_descricao?: string;
  produto_preco: string;
  produto_imagem?: string;
};

/* =============================
UTILS
============================= */

function formatMoneyBR(value?: any) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";

  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getImagemUrl(caminho?: string) {
  if (!caminho) return undefined;

  const base = api.defaults.baseURL || "";
  const clean = String(caminho).replace(/^\/+/, "");
  const baseFinal = base.endsWith("/") ? base : `${base}/`;

  return `${baseFinal}${clean}`;
}

/* =============================
COMPONENTE
============================= */

export default function DestaquesSection() {

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<ProdutoDestaque[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {

    try {

      const resCamp = await api.get("/admin/campanhas");

      const listaCamp: Campanha[] =
        resCamp?.data?.dados?.campanhas ?? [];

      const destaque = listaCamp.find(
        (c) => Number(c.statusid) === 3
      );

      setCampanha(destaque || null);

      const resProd = await api.get("/admin/produtos/destaques");

      const listaProd: ProdutoDestaque[] =
        resProd?.data?.dados ?? [];

      setProdutos(listaProd);

    } catch (erro) {

      console.error("Erro ao carregar destaques:", erro);

    } finally {

      setLoading(false);

    }
  }

  useEffect(() => {
    carregar();
  }, []);

  if (loading) {
    return <div>Carregando campanha...</div>;
  }

  return (
    <section className="section">

      {/* HEADER CAMPANHA */}

      {campanha && (
        <div className="headerCampanha">

          <div className="headerTexto">

            <span className="tag">
              <FiStar />
              Campanha
            </span>

            <h2>{campanha.titulo}</h2>

            <p>
              {campanha.descricao}
            </p>

            <Link
              href={`/campanha/${campanha.slug}`}
              className="btnCatalogo"
            >
              Ver catálogo
            </Link>

          </div>

        </div>
      )}

      {/* PRODUTOS */}

      <div className="produtos">

        {produtos.map((p) => {

          const img = getImagemUrl(p.produto_imagem);

          return (

            <div key={p.id_destaque} className="produto">

              <div className="imagem">

                {img && (
                  <img src={img} alt={p.produto_nome} />
                )}

                <span className="badge">
                  Destaque
                </span>

              </div>

              <div className="info">

                <h4>{p.produto_nome}</h4>

                <p className="desc">
                  {p.produto_descricao}
                </p>

                <div className="preco">
                  {formatMoneyBR(p.produto_preco)}
                </div>

                <Link
                  href={`/produto/${p.produto_slug}`}
                  className="btnProduto"
                >
                  Ver produto
                </Link>

              </div>

            </div>

          );
        })}

      </div>

<style jsx>{`

.section{
  padding:60px 20px;
  background:#efe6d7;
  border-radius:24px;
}

/* HEADER CAMPANHA */

.headerCampanha{
  text-align:center;
  margin-bottom:40px;
}

.tag{
  display:inline-flex;
  gap:6px;
  align-items:center;
  font-size:12px;
  font-weight:700;
  background:#fff;
  padding:6px 12px;
  border-radius:20px;
}

.headerCampanha h2{
  font-size:32px;
  font-weight:800;
  margin-top:12px;
}

.headerCampanha p{
  margin-top:8px;
  color:#6c6357;
}

.btnCatalogo{
  display:inline-block;
  margin-top:16px;
  padding:10px 18px;
  background:#c79b6e;
  color:white;
  border-radius:12px;
  font-weight:600;
}

/* PRODUTOS */

.produtos{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:20px;
}

.produto{
  background:#fff;
  border-radius:18px;
  overflow:hidden;
  box-shadow:0 10px 25px rgba(0,0,0,0.08);
  transition:0.2s;
}

.produto:hover{
  transform:translateY(-4px);
}

.imagem{
  position:relative;
  height:180px;
}

.imagem img{
  width:100%;
  height:100%;
  object-fit:cover;
}

.badge{
  position:absolute;
  top:10px;
  left:10px;
  background:#000;
  color:#fff;
  font-size:11px;
  padding:4px 10px;
  border-radius:12px;
}

.info{
  padding:14px;
}

.info h4{
  font-size:14px;
  font-weight:700;
}

.desc{
  font-size:12px;
  color:#777;
  margin-top:4px;
}

.preco{
  margin-top:8px;
  font-weight:700;
}

.btnProduto{
  display:block;
  margin-top:10px;
  text-align:center;
  background:#c79b6e;
  color:white;
  padding:8px;
  border-radius:10px;
  font-size:13px;
}

`}</style>

    </section>
  );
}