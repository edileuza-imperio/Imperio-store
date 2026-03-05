"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import { FiStar } from "react-icons/fi";

/* ==============================
TIPOS
============================== */

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
  banner?: string;
  statusid?: number;
  inicio?: string;
  fim?: string;
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

/* ==============================
UTILS
============================== */

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

/* ==============================
COMPONENTE
============================== */

export default function DestaquesSection() {

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<ProdutoDestaque[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {

    try {

      /* ==============================
      CAMPANHAS
      ============================== */

      const resCamp = await api.get("/admin/campanhas");

      const listaCamp: Campanha[] =
        resCamp?.data?.dados?.campanhas ?? [];

      const destaque = listaCamp.find(
        (c) => Number(c.statusid) === 3
      );

      setCampanha(destaque || null);

      /* ==============================
      PRODUTOS DESTAQUE
      ============================== */

      const resProd = await api.get("/admin/produtos/destaques");

      const listaProd: ProdutoDestaque[] =
        resProd?.data?.dados ?? [];

      setProdutos(listaProd.slice(0, 2));

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
    return <div>Carregando destaques...</div>;
  }

  return (

    <section className="section">

      <div className="titulo">
        <h2>Destaques</h2>
        <span>Selecionados com carinho • tons creme</span>
      </div>

      <div className="layout">

        {/* CAMPANHA */}

        {campanha && (

          <div className="campanha">

            <div className="tags">
              <span>Novidades</span>
              <span>Festas</span>
            </div>

            <h3>{campanha.titulo}</h3>

            <p>
              {campanha.descricao ||
                "Produtos selecionados para presentear."}
            </p>

            <Link
              href={`/campanha/${campanha.slug}`}
              className="btnCatalogo"
            >
              Ver catálogo
            </Link>

            <div className="infos">

              <div>
                <span>Oferta do dia</span>
                <b>até 30% OFF</b>
              </div>

              <div>
                <span>Pagamento</span>
                <b>Pix / Cartão</b>
              </div>

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

                </div>

                <div className="info">

                  <h4>{p.produto_nome}</h4>

                  <p className="desc">
                    {p.produto_descricao}
                  </p>

                  <div className="preco">
                    {formatMoneyBR(p.produto_preco)}
                  </div>

                  <div className="badge">
                    <FiStar />
                    Destaque
                  </div>

                  <div className="botoes">

                    <Link
                      href={`/produto/${p.produto_slug}`}
                      className="detalhes"
                    >
                      Detalhes
                    </Link>

                    <button className="add">
                      Adicionar
                    </button>

                  </div>

                </div>

              </div>

            );
          })}

        </div>

      </div>

<style jsx>{`

.section{
  background:#e9decd;
  padding:40px;
  border-radius:20px;
}

.titulo{
  text-align:center;
  margin-bottom:20px;
}

.layout{
  display:flex;
  gap:20px;
  justify-content:center;
}

.campanha{
  background:#f4eadc;
  padding:25px;
  width:260px;
  border-radius:18px;
}

.tags{
  display:flex;
  gap:8px;
  margin-bottom:10px;
}

.tags span{
  background:#fff;
  padding:4px 8px;
  border-radius:10px;
  font-size:11px;
}

.produtos{
  display:flex;
  gap:16px;
}

.produto{
  background:#f4eadc;
  width:200px;
  border-radius:18px;
  overflow:hidden;
}

.imagem{
  height:130px;
}

.imagem img{
  width:100%;
  height:100%;
  object-fit:cover;
}

.info{
  padding:10px;
}

.preco{
  font-weight:700;
  margin-top:4px;
}

.badge{
  margin-top:4px;
  font-size:11px;
  background:#eee;
  display:inline-flex;
  gap:4px;
  padding:3px 8px;
  border-radius:10px;
}

.botoes{
  display:flex;
  gap:6px;
  margin-top:8px;
}

.detalhes{
  flex:1;
  background:#ddd;
  border-radius:8px;
  font-size:11px;
  text-align:center;
  padding:6px;
}

.add{
  flex:1;
  border:none;
  background:#c79b6e;
  color:white;
  border-radius:8px;
  font-size:11px;
}

`}</style>

    </section>
  );
}