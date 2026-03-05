"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { FiTrash2, FiTag, FiPlus, FiX, FiSearch } from "react-icons/fi";

type Campanha = {
  id_campanha: number;
  titulo: string;
  slug: string;
  descricao?: string | null;
  banner?: string | null;
  statusid: number;
};

type Produto = {
  id_produto: number;
  nome: string;
};

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CampanhasPage() {

  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [aba, setAba] = useState<"detalhes" | "produtos">("detalhes");

  const [titulo, setTitulo] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");
  const [bannerTexto, setBannerTexto] = useState("");

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosSelecionados, setProdutosSelecionados] = useState<number[]>([]);
  const [buscaProduto, setBuscaProduto] = useState("");

  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(6);

  const [saving, setSaving] = useState(false);

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

      console.error(err);

    } finally {

      setLoading(false);

    }

  }

  async function carregarProdutos() {

    const res = await api.get("/admin/produtos");

    const data =
      res?.data?.dados ??
      res?.data ??
      [];

    setProdutos(Array.isArray(data) ? data : []);

  }

  useEffect(() => {

    carregarCampanhas();

  }, []);

  function abrirModal() {

    setOpenModal(true);
    setAba("detalhes");

  }

  function abrirProdutos() {

    setAba("produtos");

    if (produtos.length === 0) {

      carregarProdutos();

    }

  }

  function fecharModal() {

    setOpenModal(false);

    setTitulo("");
    setSlug("");
    setDescricao("");
    setBannerTexto("");
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

    const termo = buscaProduto.toLowerCase();

    if (!termo) return produtos;

    return produtos.filter(p =>
      p.nome.toLowerCase().includes(termo)
    );

  }, [buscaProduto, produtos]);

  async function criarCampanha() {

    if (!titulo.trim()) {

      alert("Preencha o título");

      return;

    }

    try {

      setSaving(true);

      const slugFinal = slug ? slugify(slug) : slugify(titulo);

      const res = await api.post("/admin/campanhas", {

        titulo,
        slug: slugFinal,
        descricao,
        banner: bannerTexto,
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

      console.error(err);

    } finally {

      setSaving(false);

    }

  }

  async function remover(id: number) {

    if (!confirm("Remover campanha?")) return;

    await api.delete(`/admin/campanhas/${id}`);

    carregarCampanhas();

  }

  const totalPaginas = Math.ceil(campanhas.length / porPagina);

  const campanhasPagina = campanhas.slice(

    (pagina - 1) * porPagina,
    pagina * porPagina

  );

  return (

    <div className="container">

      <div className="header">

        <div>
          <h2>Campanhas</h2>
          <p>Gerencie campanhas promocionais</p>
        </div>

        <button className="btn btn-primary" onClick={abrirModal}>
          <FiPlus /> Nova campanha
        </button>

      </div>

      <div className="grid">

        {campanhasPagina.map(c => (

          <div key={c.id_campanha} className="card">

            <div className="top">

              <div className="icon">
                <FiTag />
              </div>

              <button
                className="btn btn-danger btn-sm"
                onClick={() => remover(c.id_campanha)}
              >
                <FiTrash2 />
              </button>

            </div>

            <h4>{c.titulo}</h4>

            <p className="slug">/{c.slug}</p>

            <p>{c.banner || "Sem banner"}</p>

            <button
              className="btn btn-outline-primary btn-sm"
              onClick={abrirProdutos}
            >
              Produtos
            </button>

          </div>

        ))}

      </div>

      <div className="pagination">

        <select
          value={porPagina}
          onChange={(e) => {

            setPorPagina(Number(e.target.value));
            setPagina(1);

          }}
        >

          <option value={6}>6</option>
          <option value={12}>12</option>
          <option value={24}>24</option>

        </select>

        <button
          disabled={pagina === 1}
          onClick={() => setPagina(pagina - 1)}
        >
          Anterior
        </button>

        {Array.from({ length: totalPaginas }).map((_, i) => {

          const p = i + 1;

          return (

            <button
              key={p}
              className={pagina === p ? "active" : ""}
              onClick={() => setPagina(p)}
            >

              {p}

            </button>

          );

        })}

        <button
          disabled={pagina === totalPaginas}
          onClick={() => setPagina(pagina + 1)}
        >
          Próximo
        </button>

      </div>

      {openModal && (

        <div className="overlay">

          <div className="modal">

            <div className="modalHeader">

              <h3>Criar campanha</h3>

              <button
                className="btn btn-light"
                onClick={fecharModal}
              >
                <FiX />
              </button>

            </div>

            {aba === "detalhes" && (

              <>

                <input
                  className="form-control"
                  placeholder="Título"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />

                <input
                  className="form-control"
                  placeholder="Slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />

                <textarea
                  className="form-control"
                  placeholder="Descrição"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />

                <textarea
                  className="form-control"
                  placeholder="Texto do banner"
                  value={bannerTexto}
                  onChange={(e) => setBannerTexto(e.target.value)}
                />

                <button
                  className="btn btn-primary"
                  onClick={criarCampanha}
                >
                  {saving ? "Criando..." : "Criar"}
                </button>

              </>

            )}

            {aba === "produtos" && (

              <div>

                <div className="search">

                  <FiSearch />

                  <input
                    className="form-control"
                    placeholder="Buscar produto"
                    value={buscaProduto}
                    onChange={(e) => setBuscaProduto(e.target.value)}
                  />

                </div>

                <div className="produtos">

                  {produtosFiltrados.map(p => {

                    const checked = produtosSelecionados.includes(p.id_produto);

                    return (

                      <label key={p.id_produto}>

                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProduto(p.id_produto)}
                        />

                        {p.nome}

                      </label>

                    );

                  })}

                </div>

              </div>

            )}

          </div>

        </div>

      )}

<style jsx>{`

.container{
padding:20px;
display:flex;
flex-direction:column;
gap:20px;
}

.grid{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(250px,1fr));
gap:20px;
}

.card{
background:white;
border-radius:12px;
padding:20px;
box-shadow:0 10px 30px rgba(0,0,0,0.05);
display:flex;
flex-direction:column;
gap:10px;
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

.pagination{
display:flex;
gap:8px;
justify-content:center;
}

.pagination button{
border:1px solid #ddd;
padding:6px 10px;
border-radius:6px;
background:white;
}

.pagination button.active{
background:#7c3aed;
color:white;
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
padding:20px;
border-radius:10px;
width:500px;
display:flex;
flex-direction:column;
gap:10px;
}

.produtos{
max-height:200px;
overflow:auto;
display:flex;
flex-direction:column;
gap:6px;
}

`}</style>

    </div>

  );

}