"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaEdit, FaStar, FaPlus, FaTrash, FaBook } from "react-icons/fa";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NovoProdutoModal from "@/components/Modal/NovoProdutoModal";

interface Produto {
  id_produto: number;
  nome: string;
  slug: string;
  preco: number;
  estoque: number;
  statusNome?: string;
  statusCor?: string;
  destaque?: boolean;
  id_destaque?: number;
  catalogo?: number;
  imagem?: string;
}

export const getImagemUrl = (caminho?: string) => {
  if (!caminho) return undefined;

  const base = api.defaults.baseURL || "";
  const caminhoLimpo = String(caminho).replace(/^\/+/, "");
  const baseFinal = base.endsWith("/") ? base : `${base}/`;

  return `${baseFinal}${caminhoLimpo}`;
};

export default function ProdutosPage() {

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalNovoProduto, setModalNovoProduto] = useState(false);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {

    try {

      setLoading(true);

      const res = await api.get("/admin/produtos");

      let lista = res.data?.dados || res.data || [];

      if (lista.dados) lista = lista.dados;

      if (!Array.isArray(lista)) {
        console.log("API retornou formato inesperado:", lista);
        lista = [];
      }

      const convertidos = lista.map((p: any) => ({
        ...p,
        preco: Number(p.preco || 0),
        estoque: Number(p.estoque || 0),
        imagem: getImagemUrl(p.imagem),
      }));

      setProdutos(convertidos);

    } catch (err) {

      console.error("Erro ao carregar produtos", err);
      toast.error("Erro ao carregar produtos");

    } finally {

      setLoading(false);

    }

  };

  const excluirProduto = async (id: number) => {

    if (!confirm("Deseja excluir este produto?")) return;

    try {

      await api.delete(`/admin/produto/${id}`);

      setProdutos((p) => p.filter((i) => i.id_produto !== id));

      toast.success("Produto excluído");

    } catch {

      toast.error("Erro ao excluir produto");

    }

  };

  return (

    <div className="container-fluid py-4 dashboard-bg">

      <ToastContainer position="top-right" autoClose={2500} theme="colored" />

      {/* MODAL */}
      <NovoProdutoModal
        open={modalNovoProduto}
        onClose={() => setModalNovoProduto(false)}
        onCreated={async () => {
          setModalNovoProduto(false);
          await carregarProdutos();
        }}
      />

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">

        <div>
          <h1 className="fw-bold title">Produtos</h1>
          <p className="text-muted">Gerencie os produtos cadastrados</p>
        </div>

        <div className="d-flex gap-2">

          <button
            className="btn btn-gold"
            onClick={() => setModalNovoProduto(true)}
          >
            <FaPlus /> Novo Produto
          </button>

          <Link href="/admin/catalogo" className="btn btn-dark-soft">
            <FaBook /> Catálogo
          </Link>

        </div>

      </div>

      {loading ? (

        <div className="text-center py-5">
          Carregando produtos...
        </div>

      ) : (

        <div className="row g-4">

          {produtos.map((prod) => (

            <div key={prod.id_produto} className="col-12 col-sm-6 col-md-4 col-xl-3">

              <div className="produto-card">

                <div className="card-image">

                  {prod.imagem ? (
                    <img src={prod.imagem} alt={prod.nome} />
                  ) : (
                    <div className="no-image">Sem imagem</div>
                  )}

                </div>

                <div className="card-body">

                  <h6 className="produto-nome">
                    {prod.nome}
                  </h6>

                  <p className="preco">
                    R$ {prod.preco.toFixed(2)}
                  </p>

                  <small className="estoque">
                    Estoque: {prod.estoque}
                  </small>

                  <div className="acoes">

                    <Link href={`/admin/produto/${prod.slug}`}>
                      <FaEdit />
                    </Link>

                    <button
                      onClick={() => excluirProduto(prod.id_produto)}
                      className="danger"
                    >
                      <FaTrash />
                    </button>

                  </div>

                </div>

              </div>

            </div>

          ))}

          {!produtos.length && (

            <div className="col-12">

              <div className="alert alert-light border">
                Nenhum produto encontrado
              </div>

            </div>

          )}

        </div>

      )}

      <style jsx global>{`

.dashboard-bg{
background:#f5f6fa;
min-height:100vh;
}

.title{
color:#6b4c4f;
}

.btn-gold{
background:#d4af37;
color:#fff;
border:none;
}

.btn-dark-soft{
background:#6b4c4f;
color:#fff;
border:none;
}

.produto-card{
background:#fff;
border-radius:14px;
overflow:hidden;
box-shadow:0 6px 18px rgba(0,0,0,0.06);
transition:all .2s;
height:100%;
}

.produto-card:hover{
transform:translateY(-4px);
box-shadow:0 12px 30px rgba(0,0,0,0.12);
}

.card-image{
height:180px;
background:#eee;
}

.card-image img,
.no-image{
width:100%;
height:100%;
object-fit:cover;
display:flex;
align-items:center;
justify-content:center;
}

.card-body{
padding:14px;
}

.produto-nome{
color:#6b4c4f;
margin-bottom:6px;
}

.preco{
font-weight:600;
margin-bottom:2px;
}

.estoque{
color:#888;
font-size:12px;
}

.acoes{
margin-top:12px;
display:flex;
gap:14px;
font-size:1.1rem;
}

.acoes button,
.acoes a{
border:none;
background:none;
cursor:pointer;
color:#6b4c4f;
}

.acoes .danger{
color:#e74c3c;
}

.acoes button:hover,
.acoes a:hover{
color:#d4af37;
}

`}</style>

    </div>

  );
}