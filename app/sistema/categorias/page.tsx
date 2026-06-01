"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import {
  FolderOpen,
  Tag,
  Search,
  Plus,
  Boxes,
  RefreshCcw,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

type Categoria = {
  id_categoria: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  icone?: string | null;
  imagem?: string | null;
  ordem?: number;
  status_id?: number;
  site_config_id?: number;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [limite, setLimite] = useState("6");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    carregarCategorias();
  }, []);

  async function carregarCategorias() {
    try {
      setLoading(true);
      setErro(null);

      const response = await api.get("/painel/categorias");

      const lista =
        response.data?.dados?.dados ||
        response.data?.dados ||
        response.data ||
        [];

      setCategorias(Array.isArray(lista) ? lista : []);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      setCategorias([]);
      setErro("Não foi possível carregar as categorias.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirCategoria(id: number) {
    if (!confirm("Deseja excluir esta categoria?")) return;

    try {
      await api.delete(`/painel/categoria/${id}`);

      setCategorias((prev) =>
        prev.filter((item) => item.id_categoria !== id)
      );
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      alert("Erro ao excluir categoria.");
    }
  }

  const categoriasFiltradas = useMemo(() => {
    const filtro = busca.toLowerCase().trim();

    if (!filtro) return categorias;

    return categorias.filter((categoria) => {
      return (
        (categoria.nome || "").toLowerCase().includes(filtro) ||
        (categoria.slug || "").toLowerCase().includes(filtro) ||
        (categoria.descricao || "").toLowerCase().includes(filtro)
      );
    });
  }, [categorias, busca]);

  const categoriasExibidas =
    limite === "todos"
      ? categoriasFiltradas
      : categoriasFiltradas.slice(0, Number(limite));

  if (loading) {
    return <div className="loading">Carregando categorias...</div>;
  }

  return (
    <>
      <div className="container">
        {/* HEADER */}
        <div className="header">
          <div className="headerLeft">
            <div className="headerBadge">
              <Tag size={16} />
              <span>Gerenciamento</span>
            </div>

            <h1>Sistema de Categorias</h1>
            <p>Controle todas as categorias cadastradas</p>
          </div>

          <div className="headerRight">
            <button onClick={carregarCategorias} className="refreshButton">
              <RefreshCcw size={18} />
              Atualizar
            </button>

            <div className="stats">
              <Boxes size={20} />
              <span>{categorias.length} categorias</span>
            </div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="toolbar">
          <div className="searchBox">
            <Search size={18} />
            <input
              placeholder="Pesquisar categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <select value={limite} onChange={(e) => setLimite(e.target.value)}>
            <option value="6">Mostrar 6</option>
            <option value="9">Mostrar 9</option>
            <option value="12">Mostrar 12</option>
            <option value="todos">Mostrar todos</option>
          </select>
        </div>

        {/* ERRO */}
        {erro ? (
          <div className="estado erro">
            <AlertCircle size={42} />
            <h3>Algo deu errado</h3>
            <p>{erro}</p>
          </div>
        ) : null}

        {/* GRID */}
        {!erro && categoriasExibidas.length === 0 ? (
          <div className="estado">
            <FolderOpen size={42} />
            <h3>Nenhuma categoria encontrada</h3>
            <p>Cadastre a primeira categoria usando o botão flutuante.</p>
          </div>
        ) : (
          <div className="grid">
            {categoriasExibidas.map((categoria) => {
              const descricao =
                categoria.descricao || "Sem descrição disponível";

              return (
                <article key={categoria.id_categoria} className="card">
                  <div className="cardHeader">
                    <div className="cardIcon">
                      <FolderOpen size={20} />
                    </div>

                    <div className="cardTitle">
                      <h3>{categoria.nome}</h3>
                      <span>{categoria.slug}</span>
                    </div>

                    <Link
                      href={`/sistema/categorias/${categoria.id_categoria}`}
                      className="miniAction"
                      aria-label="Editar categoria"
                    >
                      <ArrowRight size={18} />
                    </Link>
                  </div>

                  <p className="description">
                    {descricao.length > 160
                      ? descricao.substring(0, 160) + "..."
                      : descricao}
                  </p>

                  <div className="info">
                    <span>
                      <Tag size={14} />
                      {categoria.slug || "Sem slug"}
                    </span>

                    <span>
                      <Boxes size={14} />
                      Ordem: {categoria.ordem ?? "-"}
                    </span>
                  </div>

                  <div className="actions">
                    <Link
                      href={`/sistema/categorias/${categoria.id_categoria}`}
                      className="editButton"
                    >
                      Editar
                    </Link>

                    <button
                      className="deleteButton"
                      onClick={() => excluirCategoria(categoria.id_categoria)}
                    >
                      Excluir
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* BOTÃO FLUTUANTE */}
        <Link
          href="/sistema/categorias/cadastrar"
          className="floatingButton"
          aria-label="Adicionar categoria"
        >
          <Plus size={28} />
        </Link>
      </div>

      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .loading {
          min-height: 300px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 600;
          color: #a85d6a;
        }

        .header {
          background: linear-gradient(135deg, #a85d6a, #d88b99);
          color: white;
          border-radius: 28px;
          padding: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          box-shadow: 0 20px 40px rgba(168, 93, 106, 0.25);
        }

        .headerLeft {
          flex: 1;
        }

        .headerBadge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.15);
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .header h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1.1;
        }

        .header p {
          margin-top: 8px;
          opacity: 0.9;
        }

        .headerRight {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .refreshButton {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: none;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          padding: 12px 18px;
          border-radius: 16px;
          font-weight: 700;
          transition: 0.25s;
        }

        .refreshButton:hover {
          background: rgba(255, 255, 255, 0.22);
          transform: translateY(-1px);
        }

        .stats {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.15);
          padding: 12px 18px;
          border-radius: 16px;
          font-weight: 600;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          gap: 20px;
        }

        .searchBox {
          flex: 1;
          background: white;
          border: 1px solid #eee;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 16px;
          height: 50px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
        }

        .searchBox input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
        }

        .toolbar select {
          border: 1px solid #eee;
          background: white;
          border-radius: 16px;
          padding: 0 16px;
          min-width: 180px;
          outline: none;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }

        .card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid #eee;
          transition: 0.35s;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          padding: 22px;
          position: relative;
        }

        .card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(135deg, #a85d6a, #d88b99);
        }

        .card:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.12);
        }

        .cardHeader {
          display: grid;
          grid-template-columns: 52px 1fr auto;
          gap: 14px;
          align-items: center;
          margin-bottom: 18px;
        }

        .cardIcon {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          background: linear-gradient(135deg, #fce7e9, #f8d7dc);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a85d6a;
          flex-shrink: 0;
        }

        .cardTitle h3 {
          margin: 0;
          color: #222;
          font-size: 17px;
          font-weight: 800;
        }

        .cardTitle span {
          display: block;
          margin-top: 4px;
          color: #777;
          font-size: 13px;
          word-break: break-word;
        }

        .miniAction {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          background: #f8fafc;
          color: #222;
          border: 1px solid #e2e8f0;
          transition: 0.2s;
        }

        .miniAction:hover {
          transform: translateY(-1px);
          background: #eef2f7;
        }

        .description {
          margin: 0;
          color: #666;
          line-height: 1.7;
          font-size: 14px;
          min-height: 56px;
        }

        .info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 18px;
        }

        .info span {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #666;
          font-size: 14px;
        }

        .actions {
          margin-top: 20px;
          display: flex;
          gap: 12px;
        }

        .editButton {
          flex: 1;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #eef7ff;
          color: #0d6efd;
          text-decoration: none;
          font-weight: 600;
        }

        .deleteButton {
          flex: 1;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #fff1f1;
          color: #dc3545;
          font-weight: 600;
          height: 44px;
        }

        .estado {
          background: white;
          border-radius: 24px;
          padding: 50px 20px;
          text-align: center;
          color: #666;
          border: 1px solid #eee;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
        }

        .estado h3 {
          margin-top: 14px;
          margin-bottom: 6px;
          color: #222;
        }

        .estado.erro {
          color: #dc3545;
        }

        .floatingButton {
          position: fixed;
          right: 30px;
          bottom: 30px;
          width: 70px;
          height: 70px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: white;
          background: linear-gradient(135deg, #a85d6a, #d88b99);
          box-shadow: 0 15px 40px rgba(168, 93, 106, 0.4);
          z-index: 999;
          transition: 0.25s;
        }

        .floatingButton:hover {
          transform: scale(1.08);
        }

        @media (max-width: 768px) {
          .toolbar {
            flex-direction: column;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .header {
            flex-direction: column;
            align-items: stretch;
          }

          .headerRight {
            align-items: stretch;
          }

          .refreshButton {
            justify-content: center;
          }

          .stats {
            justify-content: center;
          }

          .cardHeader {
            grid-template-columns: 52px 1fr;
          }

          .miniAction {
            display: none;
          }

          .actions {
            flex-direction: column;
          }

          .floatingButton {
            right: 16px;
            bottom: 16px;
          }
        }
      `}</style>
    </>
  );
}