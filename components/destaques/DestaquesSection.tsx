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

<section className="ui-vitrine">

<div className="ui-container">

{campanha && (

<div className="ui-campanha">

<span className="ui-badge">
Campanha
</span>

<h1>{campanha.titulo}</h1>

<p>{campanha.descricao}</p>

<Link
href={`/campanha/${campanha.slug}`}
className="ui-btnCatalogo"
>
Ver catálogo
</Link>

</div>

)}

<div className="ui-grid">

{produtos.map((p)=>{

const img = getImagemUrl(p.produto_imagem);

return(

<div key={p.id_destaque} className="ui-card">

<div className="ui-img">

<img src={img} />

<span className="ui-badgeProduto">
Destaque
</span>

</div>

<div className="ui-body">

<h3>{p.produto_nome}</h3>

<p className="ui-desc">
{p.produto_descricao}
</p>

<div className="ui-preco">
{formatMoney(p.produto_preco)}
</div>

<div className="ui-botoes">

<Link
href={`/produto/${p.produto_slug}`}
className="ui-btnDetalhes"
>
Detalhes
</Link>

<button className="ui-btnAdd">
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

.ui-vitrine{
background:#f3ebe3;
padding:60px 20px;
}

.ui-container{
max-width:1100px;
margin:auto;
}

/* campanha */

.ui-campanha{
text-align:center;
margin-bottom:50px;
}

.ui-badge{
background:#d87f7f;
color:white;
padding:6px 14px;
border-radius:20px;
font-size:13px;
}

.ui-campanha h1{
font-size:40px;
margin-top:10px;
font-weight:800;
color:#2c1f1f;
}

.ui-campanha p{
color:#6e5c5c;
margin-top:6px;
}

.ui-btnCatalogo{
display:inline-block;
margin-top:15px;
background:#c78c5c;
color:white;
padding:10px 22px;
border-radius:10px;
font-weight:600;
}

/* grid */

.ui-grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
gap:30px;
}

/* card */

.ui-card{
background:white;
border-radius:20px;
overflow:hidden;
box-shadow:0 8px 25px rgba(0,0,0,0.08);
transition:.3s;
}

.ui-card:hover{
transform:translateY(-5px);
box-shadow:0 15px 35px rgba(0,0,0,0.15);
}

/* imagem */

.ui-img{
height:210px;
position:relative;
overflow:hidden;
}

.ui-img img{
width:100%;
height:100%;
object-fit:cover;
}

.ui-badgeProduto{
position:absolute;
top:10px;
left:10px;
background:#c78c5c;
color:white;
padding:4px 10px;
border-radius:20px;
font-size:12px;
}

/* body */

.ui-body{
padding:20px;
}

.ui-body h3{
font-size:16px;
margin-bottom:4px;
}

.ui-desc{
font-size:13px;
color:#777;
margin-bottom:10px;
}

.ui-preco{
font-size:20px;
font-weight:800;
color:#c78c5c;
margin-bottom:15px;
}

/* botões */

.ui-botoes{
display:flex;
gap:10px;
}

.ui-btnDetalhes{
flex:1;
text-align:center;
padding:9px;
border-radius:8px;
border:1px solid #ddd;
font-weight:600;
}

.ui-btnAdd{
flex:1;
background:#c78c5c;
color:white;
border:none;
padding:9px;
border-radius:8px;
font-weight:600;
}

`}</style>

</section>

  );
}