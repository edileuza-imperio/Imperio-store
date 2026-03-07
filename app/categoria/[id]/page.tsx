"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/Api/conectar";
import Link from "next/link";

import Navbar from "@/components/site/menu/navbar";
import FooterPrincipal from "@/components/site/Rodape/Footer";

type Produto = {
  id_produto: number;
  nome: string;
  preco: string | number;
  preco_promocional?: string | number;
  imagem?: string;
  slug?: string;
};

function formatMoney(valor: any) {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getImagemUrl(caminho?: string) {
  if (!caminho) return "";

  const base = api.defaults.baseURL || "";
  const clean = caminho.replace(/^\/+/, "");

  return `${base}/${clean}`;
}

export default function CategoriaPage() {

  const params = useParams();
  const id = params.id;

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarProdutos() {

    try {

      setLoading(true);

      const res = await api.get(`/produtos/categoria/${id}`);

      const lista = res.data?.dados || res.data || [];

      setProdutos(lista);

    } catch (erro) {

      console.error("Erro ao carregar produtos da categoria", erro);

    } finally {

      setLoading(false);

    }
  }

  useEffect(() => {

    if (id) carregarProdutos();

  }, [id]);

  return (
    <>
      <Navbar />

      <div className="container">

        {/* breadcrumb */}
        <div className="breadcrumb">
          <Link href="/">Home</Link>
          <span>›</span>
          <span>Categoria</span>
        </div>

        <div className="header">
          <h1>Produtos da Categoria</h1>
          <p>Confira os produtos disponíveis nesta categoria</p>
        </div>

        {loading && (
          <div className="loading">
            <h3>Carregando produtos...</h3>
          </div>
        )}

        {!loading && produtos.length === 0 && (
          <div className="empty">
            <p>Nenhum produto encontrado nessa categoria.</p>
          </div>
        )}

        <div className="grid">

          {produtos.map((produto) => {

            const precoPromocional = Number(produto.preco_promocional || 0);
            const precoNormal = Number(produto.preco || 0);

            const precoFinal =
              precoPromocional > 0 ? precoPromocional : precoNormal;

            return (
              <Link
                key={produto.id_produto}
                href={`/produto/${produto.slug || produto.id_produto}`}
                className="card"
              >

                <div className="imageWrap">
                  <img
                    src={getImagemUrl(produto.imagem)}
                    alt={produto.nome}
                  />
                </div>

                <div className="info">

                  <h3>{produto.nome}</h3>

                  <div className="price">

                    {precoPromocional > 0 && (
                      <span className="old">
                        {formatMoney(precoNormal)}
                      </span>
                    )}

                    <span className="current">
                      {formatMoney(precoFinal)}
                    </span>

                  </div>

                </div>

              </Link>
            );
          })}

        </div>

      </div>

      <FooterPrincipal />

      <style jsx>{`

        .container{
          max-width:1200px;
          margin:auto;
          padding:40px 20px;
        }

        .breadcrumb{
          display:flex;
          gap:10px;
          font-size:14px;
          margin-bottom:20px;
          color:#777;
        }

        .breadcrumb a{
          color:#777;
          text-decoration:none;
        }

        .breadcrumb a:hover{
          text-decoration:underline;
        }

        .header{
          margin-bottom:35px;
        }

        h1{
          font-size:32px;
          font-weight:700;
          margin-bottom:6px;
        }

        .header p{
          color:#777;
        }

        .grid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
          gap:22px;
        }

        .card{
          background:white;
          border-radius:12px;
          overflow:hidden;
          text-decoration:none;
          color:black;
          border:1px solid #eee;
          transition:all .25s ease;
        }

        .card:hover{
          transform:translateY(-6px);
          box-shadow:0 12px 28px rgba(0,0,0,0.1);
          border-color:#ddd;
        }

        .imageWrap{
          width:100%;
          height:200px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#fafafa;
        }

        .imageWrap img{
          max-width:100%;
          max-height:100%;
          object-fit:contain;
          padding:10px;
        }

        .info{
          padding:16px;
        }

        h3{
          font-size:15px;
          margin-bottom:10px;
          font-weight:500;
          min-height:38px;
        }

        .price{
          display:flex;
          flex-direction:column;
          gap:4px;
        }

        .old{
          text-decoration:line-through;
          color:#999;
          font-size:13px;
        }

        .current{
          font-size:18px;
          font-weight:700;
          color:#e60023;
        }

        .empty{
          padding:60px;
          text-align:center;
          color:#777;
        }

        .loading{
          padding:60px;
          text-align:center;
        }

      `}</style>
    </>
  );
}