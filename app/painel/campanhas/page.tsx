"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { FiTrash2, FiTag } from "react-icons/fi";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
  statusid: number;
};

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarCampanhas() {
    try {
      const res = await api.get("/admin/campanhas");

      const lista = res?.data?.dados?.campanhas ?? [];

      setCampanhas(lista);
    } catch (err) {
      console.error("Erro campanhas", err);
    } finally {
      setLoading(false);
    }
  }

  async function remover(id: number) {
    if (!confirm("Remover campanha?")) return;

    try {
      await api.delete(`/admin/campanhas/${id}`);

      carregarCampanhas();
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    carregarCampanhas();
  }, []);

  return (
    <div className="container">

      <div className="header">
        <h1>Campanhas</h1>
        <p>Gerencie campanhas promocionais</p>
      </div>

      <div className="grid">

        {loading && <p>Carregando...</p>}

        {!loading && campanhas.length === 0 && (
          <p>Nenhuma campanha criada</p>
        )}

        {campanhas.map((c) => (
          <div key={c.id_campanha} className="campanhaCard">

            <div className="top">

              <div className="icon">
                <FiTag size={20} />
              </div>

              <button
                className="delete"
                onClick={() => remover(c.id_campanha)}
              >
                <FiTrash2 />
              </button>

            </div>

            <h3>{c.titulo}</h3>

            <p className="slug">{c.slug}</p>

            {c.descricao && (
              <p className="desc">{c.descricao}</p>
            )}

          </div>
        ))}

      </div>

      <style jsx>{`

      .container{
        display:flex;
        flex-direction:column;
        gap:25px;
      }

      .header h1{
        font-size:28px;
        font-weight:700;
      }

      .header p{
        color:#64748b;
        font-size:14px;
      }

      .grid{
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(260px,1fr));
        gap:20px;
      }

      .campanhaCard{
        background:linear-gradient(180deg,#fff,#fafafa);
        border-radius:16px;
        padding:22px;
        border:1px solid rgba(0,0,0,0.05);
        box-shadow:0 8px 30px rgba(0,0,0,0.05);
        display:flex;
        flex-direction:column;
        gap:10px;
        transition:0.25s;
      }

      .campanhaCard:hover{
        transform:translateY(-5px);
        box-shadow:0 18px 50px rgba(0,0,0,0.12);
      }

      .top{
        display:flex;
        justify-content:space-between;
        align-items:center;
      }

      .icon{
        width:40px;
        height:40px;
        background:#7c3aed;
        color:white;
        border-radius:10px;
        display:flex;
        align-items:center;
        justify-content:center;
      }

      .delete{
        background:#ef4444;
        border:none;
        color:white;
        padding:6px;
        border-radius:8px;
        cursor:pointer;
      }

      h3{
        font-size:18px;
        font-weight:600;
      }

      .slug{
        font-size:13px;
        color:#64748b;
      }

      .desc{
        font-size:14px;
        color:#444;
      }

      `}</style>

    </div>
  );
}