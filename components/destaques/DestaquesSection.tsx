"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
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

    <section className="vitrine py-5">

      <div className="container">

        {campanha && (

          <div className="campanha-header text-center mb-5">

            <span className="tag-campanha">
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
              className="btn-catalogo"
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
                className="col-lg-4 col-md-6"
              >

                <div className="produto-card">

                  <div className="produto-img">

                    <img
                      src={img}
                      alt={p.produto_nome}
                    />

                    <span className="badge-destaque">
                      Destaque
                    </span>

                  </div>

                  <div className="produto-body">

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
                      className="btn-produto"
                    >
                      Ver produto
                    </Link>

                  </div>

                </div>

              </div>

            );
          })}

        </div>

      </div>

<style jsx>{`

.vitrine{
background:#f4ede6;
border-radius:30px;
}

/* CAMPANHA HEADER */

.tag-campanha{
background:#d48b8b;
color:white;
padding:6px 14px;
border-radius:20px;
font-size:13px;
font-weight:600;
}

.titulo-campanha{
font-size:38px;
font-weight:800;
margin-top:10px;
color:#3a2a2a;
}

.descricao-campanha{
color:#6b5b5b;
font-size:16px;
max-width:600px;
margin:auto;
}

.btn-catalogo{
display:inline-block;
margin-top:15px;
background:#c97a7a;
color:white;
padding:10px 20px;
border-radius:10px;
font-weight:600;
transition:0.25s;
}

.btn-catalogo:hover{
background:#b86666;
}

/* PRODUTO CARD */

.produto-card{
background:white;
border-radius:18px;
overflow:hidden;
box-shadow:0 8px 25px rgba(0,0,0,0.08);
transition:0.25s;
}

.produto-card:hover{
transform:translateY(-6px);
box-shadow:0 15px 35px rgba(0,0,0,0.15);
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
top:12px;
left:12px;
background:#c97a7a;
color:white;
padding:5px 12px;
font-size:12px;
border-radius:10px;
}

.produto-body{
padding:18px;
}

.produto-nome{
font-size:18px;
font-weight:700;
color:#3a2a2a;
}

.produto-desc{
font-size:14px;
color:#777;
margin-top:4px;
}

.produto-preco{
font-size:22px;
font-weight:800;
color:#c97a7a;
margin-top:8px;
}

.btn-produto{
display:block;
margin-top:12px;
text-align:center;
border:1px solid #c97a7a;
color:#c97a7a;
padding:8px;
border-radius:8px;
font-weight:600;
transition:0.25s;
}

.btn-produto:hover{
background:#c97a7a;
color:white;
}

`}</style>

    </section>
  );
}