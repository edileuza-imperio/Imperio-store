"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import {
  Plus,
  FolderOpen,
  Search,
  RefreshCcw,
} from "lucide-react";

type Categoria = {
  id_categoria: number;
  nome: string;
  slug: string;
  descricao?: string;
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  async function carregarCategorias() {
    try {
      setLoading(true);

      const response = await api.get("/painel/categorias");

      setCategorias(response.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  const categoriasFiltradas = categorias.filter((categoria) =>
    categoria.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <>
      <div className="container">
        <div className="header">
          <div>
            <h1>Categorias</h1>
            <p>Gerencie todas as categorias do sistema</p>
          </div>

          <button onClick={carregarCategorias} className="btnAtualizar">
            <RefreshCcw size={18} />
            Atualizar
          </button>
        </div>

        <div className="busca">
          <Search size={18} className="iconeBusca" />

          <input
            type="text"
            placeholder="Pesquisar categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="cardResumo">
          <span>Total de Categorias</span>
          <h2>{categorias.length}</h2>
        </div>

        {loading ? (
          <div className="vazio">
            Carregando categorias...
          </div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="vazio">
            <FolderOpen size={50} />
            <h3>Nenhuma categoria encontrada</h3>
            <p>Cadastre sua primeira categoria.</p>
          </div>
        ) : (
          <div className="grid">
            {categoriasFiltradas.map((categoria) => (
              <div
                key={categoria.id_categoria}
                className="card"
              >
                <div className="topoCard">
                  <div className="iconeCard">
                    <FolderOpen />
                  </div>

                  <div>
                    <h2>{categoria.nome}</h2>
                    <span>{categoria.slug}</span>
                  </div>
                </div>

                <p className="descricao">
                  {categoria.descricao ||
                    "Nenhuma descrição cadastrada."}
                </p>

                <Link
                  href={`/sistema/categorias/${categoria.id_categoria}`}
                  className="btnEditar"
                >
                  Editar
                </Link>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/sistema/categorias/cadastrar"
          className="btnFlutuante"
        >
          <Plus size={30} />
        </Link>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 30px;
          background: #f8fafc;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          gap: 20px;
          flex-wrap: wrap;
        }

        .header h1 {
          margin: 0;
          font-size: 2rem;
          color: #1e293b;
        }

        .header p {
          margin-top: 5px;
          color: #64748b;
        }

        .btnAtualizar {
          display: flex;
          align-items: center;
          gap: 8px;
          border: none;
          background: white;
          padding: 12px 18px;
          border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        }

        .busca {
          position: relative;
          margin-bottom: 25px;
        }

        .iconeBusca {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .busca input {
          width: 100%;
          padding: 14px 14px 14px 45px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          font-size: 15px;
          outline: none;
        }

        .cardResumo {
          background: white;
          border-radius: 24px;
          padding: 25px;
          margin-bottom: 30px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.05);
        }

        .cardResumo span {
          color: #64748b;
        }

        .cardResumo h2 {
          margin-top: 10px;
          font-size: 2rem;
          color: #0f172a;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .card {
          background: white;
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
          transition: 0.3s;
        }

        .card:hover {
          transform: translateY(-5px);
        }

        .topoCard {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }

        .iconeCard {
          width: 55px;
          height: 55px;
          border-radius: 16px;
          background: #fce7f3;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #db2777;
        }

        .topoCard h2 {
          margin: 0;
          color: #0f172a;
          font-size: 1rem;
        }

        .topoCard span {
          color: #64748b;
          font-size: 0.85rem;
        }

        .descricao {
          color: #475569;
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .btnEditar {
          display: inline-block;
          background: #0f172a;
          color: white;
          text-decoration: none;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 14px;
        }

        .btnFlutuante {
          position: fixed;
          bottom: 25px;
          right: 25px;
          width: 65px;
          height: 65px;
          border-radius: 50%;
          background: #e11d48;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          box-shadow: 0 10px 30px rgba(225, 29, 72, 0.4);
          transition: 0.3s;
          z-index: 999;
        }

        .btnFlutuante:hover {
          transform: scale(1.1);
        }

        .vazio {
          background: white;
          border-radius: 24px;
          padding: 50px;
          text-align: center;
          color: #64748b;
        }

        .vazio h3 {
          margin-top: 15px;
          color: #0f172a;
        }

        @media (max-width: 768px) {
          .container {
            padding: 15px;
          }

          .header {
            flex-direction: column;
            align-items: stretch;
          }

          .btnAtualizar {
            justify-content: center;
          }

          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}