"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import {
  FiTrash2,
  FiTag,
  FiPlus,
  FiX,
  FiSearch,
  FiCheck
} from "react-icons/fi";

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
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState<number[]>([]);
  const [buscaProduto, setBuscaProduto] = useState("");

  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [saving, setSaving] = useState(false);

  // ==============================
  // CARREGAR CAMPANHAS
  // ==============================

  async function carregarCampanhas() {

    try {

      setLoading(true);

      const res = await api.get("/admin/campanhas");

      const lista =
        res?.data?.dados?.campanhas ??
        res?.data?.dados ??
        res?.data ??
        [];

      setCampanhas(Array.isArray(lista) ? lista : []);

    } catch (err) {

      console.error("Erro campanhas:", err);
      setCampanhas([]);

    } finally {

      setLoading(false);

    }

  }

  // ==============================
  // CARREGAR PRODUTOS
  // ==============================

  async function carregarProdutos() {

    try {

      setLoadingProdutos(true);

      const res = await api.get("/admin/produtos");

      const data =
        res?.data?.dados ??
        res?.data ??
        [];

      setProdutos(Array.isArray(data) ? data : []);

    } catch (err) {

      console.error("Erro produtos:", err);
      setProdutos([]);

    } finally {

      setLoadingProdutos(false);

    }

  }

  useEffect(() => {
    carregarCampanhas();
  }, []);

  // ==============================
  // REMOVER CAMPANHA
  // ==============================

  async function remover(id: number) {

    if (!confirm("Remover campanha?")) return;

    try {

      await api.delete(`/admin/campanhas/${id}`);

      carregarCampanhas();

    } catch (err) {

      console.error(err);

    }

  }

  // ==============================
  // MODAL
  // ==============================

  function abrirModal() {

    setOpenModal(true);

    if (produtos.length === 0) {
      carregarProdutos();
    }

  }

  function fecharModal() {

    setOpenModal(false);

    setTitulo("");
    setSlug("");
    setDescricao("");
    setProdutosSelecionados([]);

  }

  function toggleProduto(id: number) {

    setProdutosSelecionados(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );

  }

  const produtosFiltrados = useMemo(() => {

    if (!buscaProduto) return produtos;

    return produtos.filter(p =>
      p.nome.toLowerCase().includes(buscaProduto.toLowerCase())
    );

  }, [buscaProduto, produtos]);

  // ==============================
  // CRIAR CAMPANHA
  // ==============================

  async function criarCampanha() {

    if (!titulo || !slug) {

      alert("Preencha título e slug");

      return;

    }

    try {

      setSaving(true);

      const res = await api.post("/admin/campanhas", {
        titulo,
        slug,
        descricao,
        statusid: 3
      });

      const id = res?.data?.dados?.id_campanha;

      if (id && produtosSelecionados.length > 0) {

        await api.post(`/admin/campanha/${id}/produtos`, {
          produtos: produtosSelecionados
        });

      }

      fecharModal();

      carregarCampanhas();

    } catch (err) {

      console.error("Erro criar campanha:", err);

    } finally {

      setSaving(false);

    }

  }

  // ==============================
  // RENDER
  // ==============================

  return (

    <div className="container">

      <div className="header">

        <div>
          <h1>Campanhas</h1>
          <p>Gerencie campanhas promocionais</p>
        </div>

        <button className="primary" onClick={abrirModal}>
          <FiPlus /> Nova campanha
        </button>

      </div>

      <div className="grid">

        {loading && <p>Carregando...</p>}

        {!loading && campanhas.length === 0 && (
          <p>Nenhuma campanha criada</p>
        )}

        {Array.isArray(campanhas) && campanhas.map(c => (

          <div key={c.id_campanha} className="card">

            <div className="top">

              <div className="icon">
                <FiTag />
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

      {/* MODAL */}

      {openModal && (

        <div className="overlay">

          <div className="modal">

            <div className="modalHeader">

              <h2>Criar campanha</h2>

              <button onClick={fecharModal}>
                <FiX />
              </button>

            </div>

            <input
              placeholder="Título"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
            />

            <input
              placeholder="Slug"
              value={slug}
              onChange={e => setSlug(e.target.value)}
            />

            <textarea
              placeholder="Descrição"
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
            />

            <div className="produtosBox">

              <input
                placeholder="Buscar produto..."
                value={buscaProduto}
                onChange={e => setBuscaProduto(e.target.value)}
              />

              <div className="produtos">

                {produtosFiltrados.map(p => {

                  const checked = produtosSelecionados.includes(p.id_produto);

                  return (

                    <button
                      key={p.id_produto}
                      className={`produto ${checked ? "ativo" : ""}`}
                      onClick={() => toggleProduto(p.id_produto)}
                    >

                      {checked && <FiCheck />}

                      {p.nome}

                    </button>

                  );

                })}

              </div>

            </div>

            <button
              className="primary"
              onClick={criarCampanha}
              disabled={saving}
            >
              {saving ? "Criando..." : "Criar campanha"}
            </button>

          </div>

        </div>

      )}

      <style jsx>{`

      .container{
        display:flex;
        flex-direction:column;
        gap:20px;
      }

      .header{
        display:flex;
        justify-content:space-between;
        align-items:center;
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
        box-shadow:0 8px 30px rgba(0,0,0,0.05);
      }

      .top{
        display:flex;
        justify-content:space-between;
      }

      .icon{
        background:#7c3aed;
        color:white;
        width:40px;
        height:40px;
        display:flex;
        align-items:center;
        justify-content:center;
        border-radius:10px;
      }

      .delete{
        background:red;
        color:white;
        border:none;
        padding:6px;
        border-radius:8px;
      }

      .primary{
        background:#7c3aed;
        color:white;
        border:none;
        padding:10px 14px;
        border-radius:10px;
      }

      .overlay{
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.6);
        display:flex;
        align-items:center;
        justify-content:center;
      }

      .modal{
        background:white;
        padding:25px;
        border-radius:14px;
        width:600px;
        display:flex;
        flex-direction:column;
        gap:10px;
      }

      .produtos{
        display:grid;
        grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
        gap:8px;
        max-height:200px;
        overflow:auto;
      }

      .produto{
        border:1px solid #ddd;
        padding:8px;
        border-radius:8px;
        background:white;
      }

      .produto.ativo{
        background:#ede9fe;
      }

      `}</style>

    </div>

  );

}