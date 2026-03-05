"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { FiPlus, FiTrash2, FiTag, FiPackage } from "react-icons/fi";

type Campanha = {
  id_campanha:number
  titulo:string
  slug:string
  banner?:string
}

export default function CampanhasPage(){

const [campanhas,setCampanhas]=useState<Campanha[]>([])
const [openModal,setOpenModal]=useState(false)

const [titulo,setTitulo]=useState("")
const [slug,setSlug]=useState("")
const [banner,setBanner]=useState("")

const [campanhaProdutos,setCampanhaProdutos]=useState<number|null>(null)

async function carregar(){

const res=await api.get("/admin/campanhas")

const lista =
res?.data?.dados?.campanhas ??
res?.data?.dados ??
res?.data ??
[]

setCampanhas(lista)

}

useEffect(()=>{
carregar()
},[])

async function criar(){

await api.post("/admin/campanhas",{

titulo,
slug,
banner,
statusid:3

})

setTitulo("")
setSlug("")
setBanner("")
setOpenModal(false)

carregar()

}

async function remover(id:number){

if(!confirm("Remover campanha?")) return

await api.delete(`/admin/campanhas/${id}`)

carregar()

}

function abrirProdutos(id:number){

setCampanhaProdutos(id)
alert("Aqui abrirá o modal para vincular produtos da campanha "+id)

}

return(

<div className="page">

<div className="topBar">

<div>

<h1>Campanhas</h1>
<p>Gerencie promoções e vitrines da loja</p>

</div>

<button
className="btnCreate"
onClick={()=>setOpenModal(true)}
>

<FiPlus/> Nova campanha

</button>

</div>


<div className="cards">

{campanhas.map(c=>(
<div key={c.id_campanha} className="card">

<div className="cardHeader">

<div className="icon">
<FiTag/>
</div>

<button
className="btnDelete"
onClick={()=>remover(c.id_campanha)}
>
<FiTrash2/>
</button>

</div>


<div className="cardBody">

<h3>{c.titulo}</h3>

<span className="slug">
/{c.slug}
</span>

<p className="banner">
{c.banner || "Sem banner"}
</p>

</div>


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



{openModal &&(

<div className="overlay">

<div className="modalBox">

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
placeholder="Texto do banner"
value={banner}
onChange={e=>setBanner(e.target.value)}
/>

<div className="modalActions">

<button
className="btnCancel"
onClick={()=>setOpenModal(false)}
>
Cancelar
</button>

<button
className="btnSave"
onClick={criar}
>
Criar campanha
</button>

</div>

</div>

</div>

)}


<style jsx>{`

.page{
padding:30px;
display:flex;
flex-direction:column;
gap:30px;
background:#f8fafc;
min-height:100vh;
}

.topBar{
display:flex;
justify-content:space-between;
align-items:center;
}

.topBar h1{
margin:0;
font-weight:800;
font-size:28px;
}

.topBar p{
margin:0;
color:#64748b;
}

.btnCreate{

background:linear-gradient(135deg,#7c3aed,#9333ea);
color:white;
border:none;
padding:10px 18px;
border-radius:10px;
font-weight:600;
display:flex;
align-items:center;
gap:6px;
box-shadow:0 8px 25px rgba(124,58,237,.4);

}

.cards{

display:grid;
grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
gap:22px;

}

.card{

background:white;
border-radius:16px;
padding:18px;
display:flex;
flex-direction:column;
gap:14px;
position:relative;
border:1px solid #eee;
transition:.2s;

}

.card:hover{

transform:translateY(-4px);
box-shadow:0 20px 40px rgba(0,0,0,.1);

}

.cardHeader{

display:flex;
justify-content:space-between;
align-items:center;

}

.icon{

width:42px;
height:42px;
background:#ede9fe;
color:#7c3aed;
border-radius:10px;
display:flex;
align-items:center;
justify-content:center;
font-size:20px;

}

.cardBody{

display:flex;
flex-direction:column;
gap:4px;

}

.cardBody h3{

margin:0;
font-size:17px;
font-weight:700;

}

.slug{

font-size:12px;
color:#64748b;

}

.banner{

font-size:13px;
color:#334155;

}

.cardFooter{

margin-top:auto;
display:flex;
justify-content:flex-end;

}

.btnProdutos{

background:#7c3aed;
color:white;
border:none;
padding:7px 14px;
border-radius:8px;
display:flex;
align-items:center;
gap:6px;
font-size:13px;

}

.btnDelete{

background:#fee2e2;
border:none;
color:#dc2626;
padding:6px;
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

.modalBox{

background:white;
padding:25px;
border-radius:12px;
width:420px;
display:flex;
flex-direction:column;
gap:10px;
box-shadow:0 20px 50px rgba(0,0,0,.3);

}

.modalBox input,
.modalBox textarea{

border:1px solid #ddd;
border-radius:8px;
padding:8px;

}

.modalActions{

display:flex;
justify-content:flex-end;
gap:10px;

}

.btnCancel{

background:#e5e7eb;
border:none;
padding:8px 14px;
border-radius:8px;

}

.btnSave{

background:#7c3aed;
color:white;
border:none;
padding:8px 14px;
border-radius:8px;

}

`}</style>

</div>

)

}