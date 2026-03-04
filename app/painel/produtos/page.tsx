"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FaEdit,
  FaStar,
  FaPlus,
  FaTrash,
  FaBook
} from "react-icons/fa";

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
  destaque?: boolean;
  id_destaque?: number;
  catalogo?: number;
  imagem?: string;
}

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

      let lista = res.data?.dados || res.data;

      if (lista?.dados) lista = lista.dados;

      if (!Array.isArray(lista)) lista = [];

      const convertidos = lista.map((p: any) => ({
        ...p,
        preco: Number(p.preco || 0),
        estoque: Number(p.estoque || 0),
      }));

      setProdutos(convertidos);

    } catch (err) {

      console.error(err);
      toast.error("Erro ao carregar produtos");

    } finally {

      setLoading(false);

    }

  };

  const toggleDestaque = async (produto: Produto) => {

    try {

      if (produto.destaque) {

        await api.delete(`/admin/destaque/${produto.id_destaque}`);

        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto
              ? { ...i, destaque: false }
              : i
          )
        );

        toast.success("Removido do destaque");

      } else {

        const res = await api.post("/admin/destaque", {
          produto_id: produto.id_produto
        });

        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto
              ? {
                  ...i,
                  destaque: true,
                  id_destaque: res.data?.id_destaque
                }
              : i
          )
        );

        toast.success("Adicionado ao destaque");

      }

    } catch {

      toast.error("Erro ao alterar destaque");

    }

  };

  const toggleCatalogo = async (produto: Produto) => {

    try {

      if (produto.catalogo === 1) {

        await api.put(`/admin/catalogo/nao/${produto.id_produto}`);

        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto
              ? { ...i, catalogo: 0 }
              : i
          )
        );

        toast.success("Removido do catálogo");

      } else {

        await api.put(`/admin/catalogo/sim/${produto.id_produto}`);

        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto
              ? { ...i, catalogo: 1 }
              : i
          )
        );

        toast.success("Adicionado ao catálogo");

      }

    } catch {

      toast.error("Erro ao atualizar catálogo");

    }

  };

  const excluirProduto = async (id: number) => {

    if (!confirm("Deseja excluir este produto?")) return;

    try {

      await api.delete(`/admin/produto/${id}`);

      setProdutos((p) =>
        p.filter((i) => i.id_produto !== id)
      );

      toast.success("Produto excluído");

    } catch {

      toast.error("Erro ao excluir");

    }

  };

  return (

    <div className="container-fluid py-4 dashboard-bg">

      <ToastContainer position="top-right" autoClose={2500} />

      <NovoProdutoModal
        open={modalNovoProduto}
        onClose={() => setModalNovoProduto(false)}
        onCreated={async () => {
          setModalNovoProduto(false);
          await carregarProdutos();
        }}
      />

      <div className="d-flex justify-content-between mb-4">

        <div>
          <h2 className="title">Produtos</h2>
          <p className="text-muted">Gerencie os produtos</p>
        </div>

        <button
          className="btn btn-gold"
          onClick={() => setModalNovoProduto(true)}
        >
          <FaPlus /> Novo Produto
        </button>

      </div>

      {loading ? (

        <div className="text-center py-5">
          Carregando produtos...
        </div>

      ) : (

        <div className="row g-4">

          {produtos.map((prod) => (

            <div key={prod.id_produto} className="col-xl-3 col-lg-4 col-md-6">

              <div className="produto-card">

                <div className="card-image">

                  {prod.imagem ? (
                    <img src={prod.imagem} />
                  ) : (
                    <div className="no-image">Sem imagem</div>
                  )}

                  <div className="badges">

                    {prod.destaque && (
                      <span className="badge badge-destaque">
                        Destaque
                      </span>
                    )}

                    {prod.catalogo === 1 && (
                      <span className="badge badge-catalogo">
                        Catálogo
                      </span>
                    )}

                  </div>

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
                      onClick={() => toggleDestaque(prod)}
                      title="Destaque"
                    >
                      <FaStar />
                    </button>

                    <button
                      onClick={() => toggleCatalogo(prod)}
                      title="Catálogo"
                      className={
                        prod.catalogo === 1
                          ? "catalogo-on"
                          : "catalogo-off"
                      }
                    >
                      <FaBook />
                    </button>

                    <button
                      onClick={() =>
                        excluirProduto(prod.id_produto)
                      }
                      className="danger"
                    >
                      <FaTrash />
                    </button>

                  </div>

                </div>

              </div>

            </div>

          ))}

        </div>

      )}

      <style jsx global>{`

.dashboard-bg{
background:#f6f7fb;
min-height:100vh;
}

.title{
color:#6b4c4f;
font-weight:700;
}

.btn-gold{
background:#d4af37;
color:#fff;
border:none;
}

.produto-card{
background:#fff;
border-radius:14px;
overflow:hidden;
box-shadow:0 8px 20px rgba(0,0,0,0.06);
transition:.2s;
}

.produto-card:hover{
transform:translateY(-4px);
box-shadow:0 14px 30px rgba(0,0,0,0.12);
}

.card-image{
height:180px;
position:relative;
background:#eee;
}

.card-image img{
width:100%;
height:100%;
object-fit:cover;
}

.no-image{
display:flex;
align-items:center;
justify-content:center;
height:100%;
}

.badges{
position:absolute;
top:10px;
right:10px;
display:flex;
gap:6px;
}

.badge{
font-size:11px;
padding:4px 10px;
border-radius:999px;
color:#fff;
}

.badge-destaque{
background:#e74c3c;
}

.badge-catalogo{
background:#22c55e;
}

.card-body{
padding:14px;
}

.produto-nome{
margin-bottom:4px;
}

.preco{
font-weight:600;
}

.estoque{
font-size:12px;
color:#888;
}

.acoes{
margin-top:10px;
display:flex;
gap:14px;
font-size:18px;
}

.acoes button,
.acoes a{
background:none;
border:none;
cursor:pointer;
color:#6b4c4f;
}

.acoes .danger{
color:#e74c3c;
}

.catalogo-on{
color:#22c55e;
}

.catalogo-off{
color:#999;
}

.acoes button:hover,
.acoes a:hover{
color:#d4af37;
}

`}</style>

    </div>

  );
}