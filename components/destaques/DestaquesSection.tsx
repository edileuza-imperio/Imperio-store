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

        <div className="row g-4 justify-content-center">

          {produtos.map((p) => {

            const img = getImagemUrl(p.produto_imagem);

            return (

              <div
                key={p.id_destaque}
                className="col-lg-4 col-md-6 col-sm-8"
              >

                <div className="produto-card">

                  <div className="produto-img">

                    <img
                      src={img}
                      alt={p.produto_nome}
                    />

                  </div>

                  <div className="produto-body">

                    <h5 className="produto-nome">
                      {p.produto_nome}
                    </h5>

                    <p className="produto-desc">
                      {p.produto_descricao}
                    </p>

                    <div className="produto-info">

                      <span className="produto-preco">
                        {formatMoney(p.produto_preco)}
                      </span>

                      <span className="badge-destaque">
                        Destaque
                      </span>

                    </div>

                    <div className="produto-botoes">

                      <Link
                        href={`/produto/${p.produto_slug}`}
                        className="btn-detalhes"
                      >
                        Detalhes
                      </Link>

                      <button className="btn-adicionar">
                        Adicionar
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

.vitrine{
background:#f4ede6;
border-radius:30px;
}

/* HEADER CAMPANHA */

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
border-radius:12px;
font-weight:600;
transition:0.25s;
}

.btn-catalogo:hover{
background:#b86666;
}

/* CARD */

.produto-card{
background:#f7efe6;
border-radius:22px;
overflow:hidden;
box-shadow:0 6px 20px rgba(0,0,0,0.08);
transition:0.25s;
}

.produto-card:hover{
transform:translateY(-6px);
box-shadow:0 15px 35px rgba(0,0,0,0.15);
}

.produto-img{
height:220px;
overflow:hidden;
}

.produto-img img{
width:100%;
height:100%;
object-fit:cover;
}

.produto-body{
padding:20px;
}

/* TEXTO */

.produto-nome{
font-weight:700;
font-size:16px;
color:#3a2a2a;
margin-bottom:4px;
}

.produto-desc{
font-size:13px;
color:#7a6f63;
margin-bottom:12px;
}

/* PREÇO + BADGE */

.produto-info{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:14px;
}

.produto-preco{
font-weight:800;
font-size:18px;
color:#000;
}

.badge-destaque{
background:#eee5db;
padding:5px 12px;
border-radius:20px;
font-size:12px;
font-weight:600;
color:#6b5b5b;
}

/* BOTÕES */

.produto-botoes{
display:flex;
gap:10px;
}

.btn-detalhes{
flex:1;
text-align:center;
padding:9px;
border-radius:12px;
background:#eee;
color:#333;
font-size:13px;
font-weight:600;
}

.btn-adicionar{
flex:1;
border:none;
background:#c79266;
color:white;
padding:9px;
border-radius:12px;
font-size:13px;
font-weight:600;
transition:0.2s;
}

.btn-adicionar:hover{
background:#b37c52;
}

`}</style>

    </section>
  );
}