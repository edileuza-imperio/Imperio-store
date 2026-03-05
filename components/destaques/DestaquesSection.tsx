"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
  banner?: string;
  statusid?: number;
};

type Produto = {
  id_destaque: number;
  produto_nome: string;
  produto_slug: string;
  produto_descricao?: string;
  produto_preco: string;
  produto_imagem?: string;
};

function getImagemUrl(caminho?: string) {
  if (!caminho) return "";

  const base = api.defaults.baseURL || "";
  const clean = caminho.replace(/^\/+/, "");

  return `${base}/${clean}`;
}

function formatMoney(value: any) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function DestaquesSection() {

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  async function carregar() {

    const resCamp = await api.get("/admin/campanhas");

    const campanhas = resCamp.data.dados.campanhas;

    const destaque = campanhas.find(
      (c: Campanha) => c.statusid === 3
    );

    setCampanha(destaque);

    const resProd = await api.get("/admin/produtos/destaques");

    setProdutos(resProd.data.dados);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (

    <section className="container py-5">

      {campanha && (

        <div className="text-center mb-5">

          <span className="badge bg-dark px-3 py-2 mb-2">
            Campanha
          </span>

          <h1 className="titulo-campanha">
            {campanha.titulo}
          </h1>

          <p className="descricao-campanha">
            {campanha.descricao}
          </p>

          <Link
            href={`/campanha/${campanha.slug}`}
            className="btn btn-dark mt-2"
          >
            Ver catálogo
          </Link>

        </div>

      )}

      <div className="row g-4">

        {produtos.map((p) => {

          const img = getImagemUrl(p.produto_imagem);

          return (

            <div
              key={p.id_destaque}
              className="col-lg-6 col-md-6"
            >

              <div className="card produto-card">

                <div className="produto-img">

                  <img
                    src={img}
                    alt={p.produto_nome}
                  />

                  <span className="badge-destaque">
                    Destaque
                  </span>

                </div>

                <div className="card-body">

                  <h5 className="produto-nome">
                    {p.produto_nome}
                  </h5>

                  <p className="produto-desc">
                    {p.produto_descricao}
                  </p>

                  <div className="produto-preco">
                    {formatMoney(p.produto_preco)}
                  </div>

                  <Link
                    href={`/produto/${p.produto_slug}`}
                    className="btn btn-outline-dark btn-sm mt-2"
                  >
                    Ver produto
                  </Link>

                </div>

              </div>

            </div>

          );
        })}

      </div>

<style jsx>{`

.titulo-campanha{
font-size:36px;
font-weight:800;
color:#1c1c1c;
}

.descricao-campanha{
color:#666;
font-size:15px;
}

.produto-card{
border-radius:18px;
overflow:hidden;
border:none;
box-shadow:0 8px 20px rgba(0,0,0,0.08);
transition:0.25s;
}

.produto-card:hover{
transform:translateY(-5px);
box-shadow:0 12px 28px rgba(0,0,0,0.12);
}

.produto-img{
position:relative;
height:260px;
overflow:hidden;
}

.produto-img img{
width:100%;
height:100%;
object-fit:cover;
}

.badge-destaque{
position:absolute;
top:10px;
left:10px;
background:black;
color:white;
padding:4px 10px;
font-size:12px;
border-radius:10px;
}

.produto-nome{
font-size:18px;
font-weight:700;
}

.produto-desc{
font-size:13px;
color:#777;
}

.produto-preco{
font-size:20px;
font-weight:800;
margin-top:5px;
}

`}</style>

    </section>
  );
}