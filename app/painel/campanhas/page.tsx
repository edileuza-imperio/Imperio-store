"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { FiPlus, FiTrash2, FiTag } from "react-icons/fi";

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

const [pagina,setPagina]=useState(1)
const porPagina=6

async function carregar(){

const res=await api.get("/admin/campanhas")

const lista=
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

const totalPaginas=Math.ceil(campanhas.length/porPagina)

const campanhasPagina=campanhas.slice(
(pagina-1)*porPagina,
pagina*porPagina
)

return(

<div className="page">

<div className="topBar">

<div>

<h1>Campanhas</h1>
<p>Gerencie promoções da loja</p>

</div>

<button
className="btnCreate"
onClick={()=>setOpenModal(true)}
>

<FiPlus/> Nova campanha

</button>

</div>


<div className="cards">

{campanhasPagina.map(c=>(
<div key={c.id_campanha} className="card">

<div className="cardIcon">
<FiTag/>
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

<button
className="btnDelete"
onClick={()=>remover(c.id_campanha)}
>

<FiTrash2/>

</button>

</div>
))}

</div>


<div className="pagination">

<button
disabled={pagina===1}
onClick={()=>setPagina(pagina-1)}
>
Anterior
</button>

{Array.from({length:totalPaginas}).map((_,i)=>{

const p=i+1

return(

<button
key={p}
className={pagina===p?"active":""}
onClick={()=>setPagina(p)}
>

{p}

</button>

)

})}

<button
disabled={pagina===totalPaginas}
onClick={()=>setPagina(pagina+1)}
>
Próximo
</button>

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
gap:25px;
background:#f8fafc;
min-height:100vh;
}

.topBar{
display:flex;
justify-content:space-between;
align-items:center;
}

.topBar h1{
font-weight:800;
margin:0;
}

.topBar p{
margin:0;
color:#64748b;
}

.btnCreate{
background:#7c3aed;
color:white;
border:none;
padding:10px 16px;
border-radius:10px;
display:flex;
gap:6px;
align-items:center;
font-weight:600;
box-shadow:0 8px 20px rgba(124,58,237,.3);
}

.cards{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
gap:20px;
}

.card{

background:white;
border-radius:14px;
padding:18px;
display:flex;
flex-direction:column;
gap:10px;
position:relative;
box-shadow:0 10px 25px rgba(0,0,0,.06);
transition:.2s;

}

.card:hover{

transform:translateY(-4px);
box-shadow:0 15px 40px rgba(0,0,0,.1);

}

.cardIcon{

background:#ede9fe;
color:#7c3aed;
width:42px;
height:42px;
border-radius:10px;
display:flex;
align-items:center;
justify-content:center;

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

.btnDelete{

position:absolute;
top:12px;
right:12px;
border:none;
background:#fee2e2;
color:#dc2626;
padding:6px;
border-radius:8px;

}

.pagination{

display:flex;
gap:8px;
justify-content:center;

}

.pagination button{

border:1px solid #ddd;
background:white;
padding:6px 10px;
border-radius:6px;

}

.pagination button.active{

background:#7c3aed;
color:white;

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
width:400px;
display:flex;
flex-direction:column;
gap:10px;

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