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

<div className="campanha">

<span className="badge-campanha">
Campanha
</span>

<h1>{campanha.titulo}</h1>

<p>{campanha.descricao}</p>

<Link
href={`/campanha/${campanha.slug}`}
className="btn-catalogo"
>
Ver catálogo
</Link>

</div>

)}

<div className="produtos">

{produtos.map((p)=>{

const img = getImagemUrl(p.produto_imagem);

return(

<div key={p.id_destaque} className="card">

<div className="img">

<img src={img} />

<span className="badge">
Destaque
</span>

</div>

<div className="body">

<h3>{p.produto_nome}</h3>

<p className="desc">
{p.produto_descricao}
</p>

<div className="preco">
{formatMoney(p.produto_preco)}
</div>

<div className="botoes">

<Link
href={`/produto/${p.produto_slug}`}
className="btn-detalhes"
>
Detalhes
</Link>

<button className="btn-add">
Adicionar
</button>

</div>

</div>

</div>

)

})}

</div>

</div>

<style jsx>{`

.vitrine{
background:#f3ebe3;
padding:70px 20px;
}

.container{
max-width:1200px;
margin:auto;
}

/* campanha */

.campanha{
text-align:center;
margin-bottom:60px;
}

.badge-campanha{
background:#d87f7f;
color:white;
padding:6px 14px;
border-radius:20px;
font-size:13px;
}

.campanha h1{
font-size:42px;
margin-top:10px;
font-weight:800;
color:#2c1f1f;
}

.campanha p{
color:#6e5c5c;
margin-top:6px;
}

.btn-catalogo{
display:inline-block;
margin-top:15px;
background:#c78c5c;
color:white;
padding:10px 22px;
border-radius:12px;
font-weight:600;
transition:.2s;
}

.btn-catalogo:hover{
background:#b67949;
}

/* produtos */

.produtos{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
gap:30px;
}

/* card */

.card{
background:white;
border-radius:20px;
overflow:hidden;
box-shadow:0 8px 25px rgba(0,0,0,0.08);
transition:.3s;
}

.card:hover{
transform:translateY(-6px);
box-shadow:0 18px 40px rgba(0,0,0,0.15);
}

/* imagem */

.img{
height:210px;
position:relative;
overflow:hidden;
}

.img img{
width:100%;
height:100%;
object-fit:cover;
transition:.4s;
}

.card:hover img{
transform:scale(1.05);
}

.badge{
position:absolute;
top:10px;
left:10px;
background:#c78c5c;
color:white;
padding:5px 12px;
border-radius:20px;
font-size:12px;
}

/* body */

.body{
padding:20px;
}

.body h3{
font-size:17px;
margin-bottom:4px;
}

.desc{
font-size:13px;
color:#777;
margin-bottom:10px;
}

.preco{
font-size:22px;
font-weight:800;
color:#c78c5c;
margin-bottom:16px;
}

/* botões */

.botoes{
display:flex;
gap:10px;
}

.btn-detalhes{
flex:1;
text-align:center;
padding:10px;
border-radius:10px;
border:2px solid #eee;
color:#333;
font-weight:600;
}

.btn-detalhes:hover{
border-color:#c78c5c;
color:#c78c5c;
}

.btn-add{
flex:1;
background:#c78c5c;
color:white;
border:none;
padding:10px;
border-radius:10px;
font-weight:600;
}

.btn-add:hover{
background:#b67949;
}

`}</style>

</section>

  );
}