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

<section className="vitrine">

<div className="container">

{campanha && (

<div className="campanha-header">

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

<div className="grid-produtos">

{produtos.map((p) => {

const img = getImagemUrl(p.produto_imagem);

return (

<div key={p.id_destaque} className="produto-card">

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

);
})}

</div>

</div>

<style jsx>{`

.vitrine{
background:#f4ede6;
padding:60px 20px;
border-radius:30px;
}

/* container */

.container{
max-width:1200px;
margin:auto;
}

/* header campanha */

.campanha-header{
text-align:center;
margin-bottom:50px;
}

.tag-campanha{
background:#c97a7a;
color:white;
padding:6px 14px;
border-radius:20px;
font-size:13px;
font-weight:600;
}

.titulo-campanha{
font-size:40px;
font-weight:800;
margin-top:10px;
color:#3a2a2a;
}

.descricao-campanha{
color:#6b5b5b;
font-size:16px;
margin-top:6px;
}

.btn-catalogo{
display:inline-block;
margin-top:16px;
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

/* grid */

.grid-produtos{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
gap:30px;
}

/* card */

.produto-card{
background:#f7efe6;
border-radius:24px;
overflow:hidden;
box-shadow:0 10px 25px rgba(0,0,0,0.08);
transition:0.3s;
display:flex;
flex-direction:column;
}

.produto-card:hover{
transform:translateY(-6px);
box-shadow:0 18px 40px rgba(0,0,0,0.15);
}

/* imagem */

.produto-img{
position:relative;
height:220px;
overflow:hidden;
}

.produto-img img{
width:100%;
height:100%;
object-fit:cover;
transition:0.4s;
}

.produto-card:hover img{
transform:scale(1.05);
}

/* badge */

.badge-destaque{
position:absolute;
top:12px;
left:12px;
background:#c79266;
color:white;
padding:6px 14px;
border-radius:30px;
font-size:12px;
font-weight:600;
}

/* body */

.produto-body{
padding:20px;
display:flex;
flex-direction:column;
}

/* texto */

.produto-nome{
font-size:17px;
font-weight:700;
color:#3a2a2a;
margin-bottom:4px;
}

.produto-desc{
font-size:13px;
color:#7a6f63;
margin-bottom:12px;
}

/* preço */

.produto-preco{
font-size:22px;
font-weight:800;
color:#c79266;
margin-bottom:18px;
}

/* botões */

.produto-botoes{
display:flex;
gap:10px;
}

.btn-detalhes{
flex:1;
text-align:center;
padding:10px;
border-radius:12px;
background:white;
border:2px solid #e4d8cc;
font-weight:600;
font-size:14px;
color:#4a3a2f;
transition:0.25s;
}

.btn-detalhes:hover{
border-color:#c79266;
color:#c79266;
}

.btn-adicionar{
flex:1;
border:none;
background:#c79266;
color:white;
padding:10px;
border-radius:12px;
font-weight:600;
font-size:14px;
transition:0.25s;
}

.btn-adicionar:hover{
background:#b07c52;
}

`}</style>

</section>

  );
}