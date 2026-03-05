"use client";

import { useEffect, useState } from "react";
import api from "@/Api/conectar";
import { FiPlus, FiTrash2 } from "react-icons/fi";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string;
  statusid: number;
};

type Produto = {
  id_produto: number;
  nome: string;
};

export default function CampanhasPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");

  const [produtosSelecionados, setProdutosSelecionados] = useState<number[]>([]);

  async function carregarCampanhas() {
    try {
      const res = await api.get("/admin/campanhas");

      const lista = res?.data?.dados?.campanhas ?? [];

      setCampanhas(lista);
    } catch (err) {
      console.error("Erro campanhas", err);
    }
  }

  async function carregarProdutos() {
    try {
      const res = await api.get("/admin/produtos");

      setProdutos(res.data ?? []);
    } catch (err) {
      console.error("Erro produtos", err);
    }
  }

  async function criarCampanha() {
    try {
      const res = await api.post("/admin/campanhas", {
        titulo,
        slug,
        descricao,
        statusid: 3
      });

      const id = res?.data?.dados?.id_campanha;

      if (produtosSelecionados.length > 0) {
        await api.post(`/admin/campanha/${id}/produtos`, {
          produtos: produtosSelecionados
        });
      }

      setTitulo("");
      setSlug("");
      setDescricao("");
      setProdutosSelecionados([]);

      carregarCampanhas();

    } catch (err) {
      console.error("Erro criar campanha", err);
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

  function toggleProduto(id: number) {
    setProdutosSelecionados((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    );
  }

  useEffect(() => {
    async function init() {
      await carregarCampanhas();
      await carregarProdutos();
      setLoading(false);
    }

    init();
  }, []);

  return (
    <div className="container">

      <h1>Campanhas</h1>

      {/* FORM */}
      <div className="card">

        <h2>Nova Campanha</h2>

        <input
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <input
          placeholder="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />

        <textarea
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <h3>Selecionar Produtos</h3>

        <div className="produtos">
          {produtos.map((p) => (
            <label key={p.id_produto}>
              <input
                type="checkbox"
                checked={produtosSelecionados.includes(p.id_produto)}
                onChange={() => toggleProduto(p.id_produto)}
              />
              {p.nome}
            </label>
          ))}
        </div>

        <button onClick={criarCampanha}>
          <FiPlus /> Criar Campanha
        </button>

      </div>

      {/* LISTA */}
      <div className="card">

        <h2>Campanhas criadas</h2>

        {loading && <p>Carregando...</p>}

        {!loading && campanhas.length === 0 && (
          <p>Nenhuma campanha criada</p>
        )}

        {campanhas.map((c) => (
          <div key={c.id_campanha} className="item">

            <div>
              <strong>{c.titulo}</strong>
              <p>{c.slug}</p>
            </div>

            <button onClick={() => remover(c.id_campanha)}>
              <FiTrash2 />
            </button>

          </div>
        ))}

      </div>

      <style jsx>{`

      .container{
        display:flex;
        flex-direction:column;
        gap:25px;
      }

      h1{
        font-size:28px;
        font-weight:700;
      }

      .card{
        background:white;
        padding:25px;
        border-radius:14px;
        box-shadow:0 10px 30px rgba(0,0,0,0.05);
        display:flex;
        flex-direction:column;
        gap:12px;
      }

      input,textarea{
        padding:10px;
        border-radius:8px;
        border:1px solid #ddd;
      }

      button{
        display:flex;
        align-items:center;
        gap:6px;
        padding:10px;
        border:none;
        border-radius:8px;
        background:#7c3aed;
        color:white;
        cursor:pointer;
      }

      .produtos{
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
        gap:6px;
      }

      .item{
        display:flex;
        justify-content:space-between;
        align-items:center;
        padding:10px;
        border-bottom:1px solid #eee;
      }

      `}</style>

    </div>
  );
}