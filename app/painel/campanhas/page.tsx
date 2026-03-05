"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import {
FiPlus,
FiTrash2,
FiPackage
} from "react-icons/fi";

type Campanha = {
id_campanha:number
titulo:string
slug:string
descricao?:string
}

type Produto = {
id_produto:number
nome:string
}

export default function CampanhasPage(){

const [campanhas,setCampanhas]=useState<Campanha[]>([])
const [produtos,setProdutos]=useState<Produto[]>([])
const [produtosSelecionados,setProdutosSelecionados]=useState<number[]>([])

const [openModal,setOpenModal]=useState(false)
const [openProdutos,setOpenProdutos]=useState(false)

const [titulo,setTitulo]=useState("")
const [slug,setSlug]=useState("")
const [descricao,setDescricao]=useState("")

const [campanhaSelecionada,setCampanhaSelecionada]=useState<number|null>(null)

async function carregarCampanhas(){

const res = await api.get("/admin/campanhas")

const lista =
res?.data?.dados?.campanhas ??
res?.data?.dados ??
res?.data ??
[]

setCampanhas(lista)

}

async function carregarProdutos(){

const res = await api.get("/admin/produtos")

const lista =
res?.data?.dados ??
res?.data ??
[]

setProdutos(lista)

}

useEffect(()=>{

carregarCampanhas()
carregarProdutos()

},[])

async function criarCampanha(){

const res = await api.post("/admin/campanhas",{

titulo,
slug,
descricao,
statusid:3

})

setOpenModal(false)

setTitulo("")
setSlug("")
setDescricao("")

carregarCampanhas()

}

async function removerCampanha(id:number){

if(!confirm("Remover campanha?")) return

await api.delete(`/admin/campanhas/${id}`)

carregarCampanhas()

}

function abrirProdutos(id:number){

setCampanhaSelecionada(id)
setOpenProdutos(true)
setProdutosSelecionados([])

}

function toggleProduto(id:number){

setProdutosSelecionados(prev=>
prev.includes(id)
? prev.filter(p=>p!==id)
: [...prev,id]
)

}

async function salvarProdutos(){

if(!campanhaSelecionada) return

await api.post(`/admin/campanha/${campanhaSelecionada}/produtos`,{

produtos:produtosSelecionados

})

setOpenProdutos(false)

}

return(

<div className="page">

<div className="header">

<div>
<h1>Campanhas</h1>
<p>Gerencie campanhas promocionais</p>
</div>

<button
className="btnPrimary"
onClick={()=>setOpenModal(true)}
>

<FiPlus/> Nova campanha

</button>

</div>


<div className="grid">

{campanhas.map(c=>(
<div key={c.id_campanha} className="card">

<div className="cardTop">

<h3>{c.titulo}</h3>

<button
className="btnDelete"
onClick={()=>removerCampanha(c.id_campanha)}
>

<FiTrash2/>

</button>

</div>

<span className="slug">/{c.slug}</span>

<p className="desc">

{c.descricao || "Sem descrição"}

</p>

<div className="cardFooter">

<button
className="btnProdutos"
onClick={()=>abrirProdutos(c.id_campanha)}
>

<FiPackage/> Vincular produtos

</button>

</div>

</div>
))}

</div>


{/* MODAL CRIAR CAMPANHA */}

{openModal &&(

<div className="overlay">

<div className="modal">

<h2>Criar campanha</h2>

<input
placeholder="Título"
value={titulo}
onChange={e=>setTitulo(e.target.value)}
/>

<input
placeholder="Slug"
value={slug}
onChange={e=>setSlug(e.target.value)}
/>

<textarea
placeholder="Descrição"
value={descricao}
onChange={e=>setDescricao(e.target.value)}
/>

<div className="modalActions">

<button
onClick={()=>setOpenModal(false)}
className="btnCancel"
>
Cancelar
</button>

<button
onClick={criarCampanha}
className="btnPrimary"
>
Criar
</button>

</div>

</div>

</div>

)}


{/* MODAL PRODUTOS */}

{openProdutos &&(

<div className="overlay">

<div className="modalLarge">

<h2>Vincular produtos</h2>

<div className="produtos">

{produtos.map(p=>{

const checked = produtosSelecionados.includes(p.id_produto)

return(

<label key={p.id_produto} className="produto">

<input
type="checkbox"
checked={checked}
onChange={()=>toggleProduto(p.id_produto)}
/>

{p.nome}

</label>

)

})}

</div>

<div className="modalActions">

<button
className="btnCancel"
onClick={()=>setOpenProdutos(false)}
>
Cancelar
</button>

<button
className="btnPrimary"
onClick={salvarProdutos}
>
Salvar produtos
</button>

</div>

</div>

</div>

)}


<style jsx>{`

.page{
padding:30px;
background:#f6f7fb;
min-height:100vh;
}

.header{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:25px;
}

.header h1{
font-size:28px;
font-weight:800;
}

.grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
gap:20px;
}

.card{
background:white;
padding:20px;
border-radius:14px;
box-shadow:0 8px 25px rgba(0,0,0,.05);
display:flex;
flex-direction:column;
gap:10px;
}

.cardTop{
display:flex;
justify-content:space-between;
align-items:center;
}

.slug{
font-size:12px;
color:#64748b;
}

.desc{
font-size:14px;
color:#334155;
}

.cardFooter{
margin-top:auto;
}

.btnProdutos{
background:#6366f1;
color:white;
border:none;
padding:7px 14px;
border-radius:8px;
display:flex;
gap:6px;
align-items:center;
}

.btnDelete{
background:#fee2e2;
border:none;
color:#dc2626;
padding:6px;
border-radius:8px;
}

.btnPrimary{
background:#6366f1;
color:white;
border:none;
padding:8px 14px;
border-radius:8px;
display:flex;
gap:6px;
align-items:center;
}

.btnCancel{
background:#e5e7eb;
border:none;
padding:8px 14px;
border-radius:8px;
}

.overlay{
position:fixed;
inset:0;
background:rgba(0,0,0,.6);
display:flex;
align-items:center;
justify-content:center;
}

.modal{
background:white;
padding:25px;
border-radius:12px;
width:420px;
display:flex;
flex-direction:column;
gap:10px;
}

.modalLarge{
background:white;
padding:25px;
border-radius:12px;
width:600px;
display:flex;
flex-direction:column;
gap:12px;
}

.produtos{
max-height:300px;
overflow:auto;
display:flex;
flex-direction:column;
gap:8px;
}

.produto{
display:flex;
gap:8px;
}

.modalActions{
display:flex;
justify-content:flex-end;
gap:10px;
}

`}</style>

</div>

)

}