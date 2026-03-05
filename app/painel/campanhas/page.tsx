"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import {
FiPlus,
FiTrash2,
FiPackage,
FiX
} from "react-icons/fi";

type Campanha={
id_campanha:number
titulo:string
slug:string
descricao?:string
banner?:string
inicio?:string
fim?:string
}

type Produto={
id_produto:number
nome:string
}

export default function CampanhasPage(){

const [campanhas,setCampanhas]=useState<Campanha[]>([])
const [produtos,setProdutos]=useState<Produto[]>([])

const [openModal,setOpenModal]=useState(false)
const [openProdutos,setOpenProdutos]=useState(false)

const [titulo,setTitulo]=useState("")
const [slug,setSlug]=useState("")
const [descricao,setDescricao]=useState("")
const [banner,setBanner]=useState("")
const [inicio,setInicio]=useState("")
const [fim,setFim]=useState("")

const [campanhaSelecionada,setCampanhaSelecionada]=useState<number|null>(null)

const [produtosSelecionados,setProdutosSelecionados]=useState<number[]>([])

async function carregarCampanhas(){

const res = await api.get("/admin/campanhas")

const lista=
res?.data?.dados?.campanhas ??
res?.data?.dados ??
res?.data ??
[]

setCampanhas(lista)

}

async function carregarProdutos(){

const res = await api.get("/admin/produtos")

const lista=
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
banner,
inicio,
fim,
statusid:3

})

const id = res?.data?.dados?.id_campanha

if(id && produtosSelecionados.length>0){

await api.post(`/admin/campanha/${id}/produtos`,{

produtos:produtosSelecionados

})

}

setOpenModal(false)

resetForm()

carregarCampanhas()

}

function resetForm(){

setTitulo("")
setSlug("")
setDescricao("")
setBanner("")
setInicio("")
setFim("")
setProdutosSelecionados([])

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

<div className="topBar">

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

<div className="cardHeader">

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

<FiPackage/> Produtos

</button>

</div>

</div>
))}

</div>


{/* MODAL CAMPANHA */}

{openModal &&(

<div className="overlay">

<div className="modal">

<div className="modalHeader">

<h2>Criar campanha</h2>

<button
className="btnClose"
onClick={()=>setOpenModal(false)}
>

<FiX/>

</button>

</div>

<div className="formGrid">

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

<input
placeholder="Texto do banner"
value={banner}
onChange={e=>setBanner(e.target.value)}
/>

<input
type="datetime-local"
value={inicio}
onChange={e=>setInicio(e.target.value)}
/>

<input
type="datetime-local"
value={fim}
onChange={e=>setFim(e.target.value)}
/>

</div>

<div className="produtosBox">

<h4>Produtos da campanha</h4>

<div className="produtosList">

{produtos.map(p=>{

const checked = produtosSelecionados.includes(p.id_produto)

return(

<label key={p.id_produto}>

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

</div>

<div className="modalActions">

<button
className="btnCancel"
onClick={()=>setOpenModal(false)}
>
Cancelar
</button>

<button
className="btnPrimary"
onClick={criarCampanha}
>
Criar campanha
</button>

</div>

</div>

</div>

)}


<style jsx>{`

.page{
padding:35px;
background:#f5f7fb;
min-height:100vh;
}

.topBar{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:30px;
}

.topBar h1{
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
border-radius:14px;
padding:20px;
box-shadow:0 10px 30px rgba(0,0,0,.06);
display:flex;
flex-direction:column;
gap:8px;
}

.cardHeader{
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
padding:8px 14px;
border-radius:8px;
display:flex;
align-items:center;
gap:6px;
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
padding:9px 16px;
border-radius:8px;
display:flex;
align-items:center;
gap:6px;
}

.btnCancel{
background:#e5e7eb;
border:none;
padding:9px 16px;
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
border-radius:14px;
width:650px;
display:flex;
flex-direction:column;
gap:14px;
}

.modalHeader{
display:flex;
justify-content:space-between;
align-items:center;
}

.formGrid{
display:grid;
grid-template-columns:1fr 1fr;
gap:10px;
}

.formGrid textarea{
grid-column:span 2;
}

.produtosBox{
border-top:1px solid #eee;
padding-top:10px;
}

.produtosList{
max-height:200px;
overflow:auto;
display:flex;
flex-direction:column;
gap:6px;
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