"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
  banner?: string;
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
      const res = await api.get("/admin/campanha/destaques");

      const dados = res.data?.dados ?? {};

      const camp: Campanha | null = dados.campanha ?? null;
      const prods: Produto[] = Array.isArray(dados.produtos)
        ? dados.produtos
        : [];

      if (!camp || prods.length === 0) {
        setCampanha(null);
        setProdutos([]);
        return;
      }

      setCampanha(camp);
      setProdutos(prods);
    } catch (err) {
      console.error(err);
      setCampanha(null);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const temConteudo = useMemo(
    () => !!campanha && produtos.length > 0,
    [campanha, produtos]
  );

  if (loading || !temConteudo) return null;

  return (
    <section className="destaquesSection">
      <div className="container">

        {/* ================= CAMAPNHA HEADER ================= */}

        <div className="campanhaHeader">

          {campanha?.banner && (
            <div className="bannerCampanha">
              <img src={getImagemUrl(campanha.banner)} alt={campanha.titulo} />
            </div>
          )}

          <div className="campanhaTexto">
            <span className="badgeCampanha">
              Campanha Especial
            </span>

            <h2>{campanha.titulo}</h2>

            {campanha.descricao && (
              <p>{campanha.descricao}</p>
            )}

            <Link
              href={`/campanha/${campanha.slug}`}
              className="btnVerCampanha"
            >
              Ver coleção completa
            </Link>
          </div>
        </div>


        {/* ================= PRODUTOS ================= */}

        <div className="row g-4">

          {produtos.map((raw) => {

            const p = normalizarProduto(raw);

            const img = getImagemUrl(p.imagem);

            return (
              <div key={p.key} className="col-md-6 col-lg-4 col-xl-3">

                <div className="produtoCard">

                  <div className="produtoImagem">

                    {img ? (
                      <img src={img} alt={p.nome} />
                    ) : (
                      <div className="semImagem">
                        Produto
                      </div>
                    )}

                    <span className="badgeProduto">
                      Destaque
                    </span>

                  </div>


                  <div className="produtoInfo">

                    <h5>{p.nome}</h5>

                    {p.descricao && (
                      <p className="descricao">
                        {p.descricao}
                      </p>
                    )}

                    <div className="preco">
                      {formatMoney(p.preco)}
                    </div>

                    <div className="botoes">

                      <Link
                        href={`/produto/${p.slug}`}
                        className="btnDetalhes"
                      >
                        Detalhes
                      </Link>

                      <button className="btnComprar">
                        Comprar
                      </button>

                    </div>

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      </div>


      <style jsx>{`

      .destaquesSection{
        background:#f8f6f3;
        padding:80px 0;
      }

      .campanhaHeader{
        text-align:center;
        margin-bottom:60px;
      }

      .bannerCampanha{
        max-width:1000px;
        margin:auto;
        margin-bottom:30px;
        border-radius:16px;
        overflow:hidden;
        box-shadow:0 10px 25px rgba(0,0,0,0.08);
      }

      .bannerCampanha img{
        width:100%;
        object-fit:cover;
      }

      .badgeCampanha{
        background:#2e7d32;
        color:white;
        padding:6px 16px;
        border-radius:20px;
        font-size:12px;
      }

      .campanhaTexto h2{
        margin-top:14px;
        font-weight:700;
        font-size:34px;
      }

      .campanhaTexto p{
        color:#666;
        max-width:600px;
        margin:auto;
      }

      .btnVerCampanha{
        margin-top:18px;
        background:#c78c5c;
        color:white;
        padding:10px 22px;
        border-radius:10px;
        text-decoration:none;
        font-weight:600;
      }

      .produtoCard{
        background:white;
        border-radius:16px;
        overflow:hidden;
        transition:0.25s;
        box-shadow:0 6px 18px rgba(0,0,0,0.08);
        height:100%;
      }

      .produtoCard:hover{
        transform:translateY(-6px);
        box-shadow:0 14px 28px rgba(0,0,0,0.12);
      }

      .produtoImagem{
        position:relative;
        height:230px;
        overflow:hidden;
      }

      .produtoImagem img{
        width:100%;
        height:100%;
        object-fit:cover;
        transition:0.3s;
      }

      .produtoCard:hover img{
        transform:scale(1.05);
      }

      .badgeProduto{
        position:absolute;
        top:12px;
        left:12px;
        background:#2e7d32;
        color:white;
        padding:5px 14px;
        border-radius:20px;
        font-size:11px;
      }

      .produtoInfo{
        padding:18px;
      }

      .produtoInfo h5{
        font-size:17px;
        font-weight:600;
      }

      .descricao{
        font-size:13px;
        color:#777;
        margin:6px 0;
      }

      .preco{
        font-size:22px;
        font-weight:700;
        color:#c78c5c;
        margin-bottom:10px;
      }

      .botoes{
        display:flex;
        gap:8px;
      }

      .btnDetalhes{
        flex:1;
        border:1px solid #ddd;
        padding:8px;
        border-radius:8px;
        text-align:center;
        text-decoration:none;
        font-size:14px;
      }

      .btnComprar{
        flex:1;
        background:#c78c5c;
        color:white;
        border:none;
        border-radius:8px;
        font-size:14px;
        font-weight:600;
      }

      .semImagem{
        height:100%;
        display:flex;
        align-items:center;
        justify-content:center;
        background:#eee;
      }

      `}</style>
    </section>
  );
}