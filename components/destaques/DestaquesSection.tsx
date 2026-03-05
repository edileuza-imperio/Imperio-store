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

<section
className="py-5"
style={{ background: "#f5eee8" }}
>

<div className="container">

{/* CAMPANHA */}

{campanha && (

<div className="text-center mb-5">

<span
className="badge px-3 py-2 mb-3"
style={{
background:"#d77c7c",
fontSize:"13px"
}}
>
Campanha
</span>

<h1
className="fw-bold mb-2"
style={{letterSpacing:"0.5px"}}
>
{campanha.titulo}
</h1>

<p className="text-muted mb-3">
{campanha.descricao}
</p>

<Link
href={`/campanha/${campanha.slug}`}
className="btn text-white px-4"
style={{
background:"#c78c5c",
borderRadius:"10px"
}}
>
Ver catálogo
</Link>

</div>

)}

{/* PRODUTOS */}

<div className="row g-4">

{produtos.map((p)=>{

const img = getImagemUrl(p.produto_imagem);

return(

<div
key={p.id_destaque}
className="col-md-6 col-lg-4"
>

<div
className="card border-0 shadow-sm h-100 rounded-4"
style={{
transition:"all .25s ease",
cursor:"pointer",
overflow:"hidden"
}}
onMouseEnter={(e)=>{
e.currentTarget.style.transform="translateY(-6px)"
}}
onMouseLeave={(e)=>{
e.currentTarget.style.transform="translateY(0)"
}}
>

{/* IMAGEM */}

<div className="position-relative">

<img
src={img}
className="card-img-top"
style={{
height:"240px",
objectFit:"cover",
transition:"transform .3s"
}}
/>

<span
className="badge position-absolute px-3 py-2"
style={{
top:"12px",
left:"12px",
background:"#c78c5c",
borderRadius:"20px",
fontSize:"12px"
}}
>
Destaque
</span>

</div>

{/* BODY */}

<div className="card-body d-flex flex-column p-4">

<h5
className="fw-semibold mb-1"
style={{fontSize:"18px"}}
>
{p.produto_nome}
</h5>

<p
className="text-muted mb-2"
style={{fontSize:"14px"}}
>
{p.produto_descricao}
</p>

<div
className="fw-bold mb-3"
style={{
color:"#c78c5c",
fontSize:"22px"
}}
>
{formatMoney(p.produto_preco)}
</div>

{/* BOTÕES */}

<div className="d-flex gap-2 mt-auto">

<Link
href={`/produto/${p.produto_slug}`}
className="btn btn-light border w-100"
style={{
borderRadius:"10px",
fontWeight:"500"
}}
>
Detalhes
</Link>

<button
className="btn w-100 text-white"
style={{
background:"#c78c5c",
borderRadius:"10px",
fontWeight:"600"
}}
>
Adicionar
</button>

</div>

</div>

</div>

</div>

)

})}

</div>

</div>

</section>

  );
}