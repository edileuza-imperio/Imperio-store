"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/Api/conectar";
import Link from "next/link";

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

  if (loading) {
    return (
      <div className="container">
        <h2>Carregando produtos...</h2>
      </div>
    );
  }

  return (
    <div className="container">

      <div className="header">
        <h1>Produtos da Categoria</h1>
      </div>

      {produtos.length === 0 && (
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

      <style jsx>{`

        .container{
          max-width:1200px;
          margin:auto;
          padding:30px 20px;
        }

        .header{
          margin-bottom:30px;
        }

        h1{
          font-size:28px;
          font-weight:700;
        }

        .grid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
          gap:20px;
        }

        .card{
          background:white;
          border-radius:10px;
          overflow:hidden;
          text-decoration:none;
          color:black;
          box-shadow:0 4px 10px rgba(0,0,0,0.06);
          transition:all .2s;
        }

        .card:hover{
          transform:translateY(-4px);
          box-shadow:0 8px 20px rgba(0,0,0,0.1);
        }

        .imageWrap{
          width:100%;
          height:180px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#f5f5f5;
        }

        .imageWrap img{
          max-width:100%;
          max-height:100%;
          object-fit:contain;
        }

        .info{
          padding:15px;
        }

        h3{
          font-size:15px;
          margin-bottom:8px;
          font-weight:500;
        }

        .price{
          display:flex;
          flex-direction:column;
        }

        .old{
          text-decoration:line-through;
          color:#888;
          font-size:13px;
        }

        .current{
          font-size:18px;
          font-weight:700;
          color:#e60023;
        }

        .empty{
          padding:40px;
          text-align:center;
          color:#777;
        }

      `}</style>
    </div>
  );
}