"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import {
  Plus,
  FolderOpen,
  Search,
  RefreshCcw,
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
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  function extrairCategorias(resposta: any): Categoria[] {
    const dados = resposta?.dados;

    if (Array.isArray(dados)) return dados;
    if (Array.isArray(dados?.dados)) return dados.dados;
    if (Array.isArray(resposta)) return resposta;

    return [];
  }

  async function carregarCategorias() {
    try {
      setLoading(true);
      setErro(null);

      const response = await api.get("/painel/categorias");

      console.log("Resposta completa:", response.data);

      const lista = extrairCategorias(response.data);
      setCategorias(lista);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      setErro("Não foi possível carregar as categorias.");
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  const categoriasFiltradas = useMemo(() => {
    if (!Array.isArray(categorias)) return [];

    const termo = busca.trim().toLowerCase();

    if (!termo) return categorias;

    return categorias.filter((categoria) => {
      const nome = categoria.nome?.toLowerCase() || "";
      const slug = categoria.slug?.toLowerCase() || "";
      const descricao = categoria.descricao?.toLowerCase() || "";

      return (
        nome.includes(termo) ||
        slug.includes(termo) ||
        descricao.includes(termo)
      );
    });
  }, [categorias, busca]);

  return (
    <>
      <main className="container">
        <section className="topo">
          <div>
            <h1>Categorias</h1>
            <p>Gerencie as categorias cadastradas no sistema</p>
          </div>

          <button onClick={carregarCategorias} className="btnAtualizar">
            <RefreshCcw size={18} />
            Atualizar
          </button>
        </section>

        <section className="buscaBox">
          <Search size={18} className="iconeBusca" />
          <input
            type="text"
            placeholder="Pesquisar categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </section>

        <section className="resumo">
          <div className="resumoCard">
            <span>Total de categorias</span>
            <strong>{Array.isArray(categorias) ? categorias.length : 0}</strong>
          </div>
        </section>

        {loading ? (
          <section className="estado">
            <FolderOpen size={44} />
            <h3>Carregando categorias...</h3>
            <p>Aguarde um momento.</p>
          </section>
        ) : erro ? (
          <section className="estado erro">
            <AlertCircle size={44} />
            <h3>Ops, algo deu errado</h3>
            <p>{erro}</p>
          </section>
        ) : categoriasFiltradas.length === 0 ? (
          <section className="estado">
            <FolderOpen size={44} />
            <h3>Nenhuma categoria encontrada</h3>
            <p>Cadastre a primeira categoria usando o botão flutuante.</p>
          </section>
        ) : (
          <section className="grid">
            {categoriasFiltradas.map((categoria) => (
              <article key={categoria.id_categoria} className="card">
                <div className="cardTopo">
                  <div className="iconeCard">
                    <FolderOpen size={22} />
                  </div>

                  <div className="infoCard">
                    <h2>{categoria.nome}</h2>
                    <span>{categoria.slug}</span>
                  </div>
                </div>

                <div className="conteudoCard">
                  <p>
                    {categoria.descricao?.trim()
                      ? categoria.descricao
                      : "Nenhuma descrição cadastrada."}
                  </p>
                </div>

                <div className="acoes">
                  <Link
                    href={`/sistema/categorias/${categoria.id_categoria}`}
                    className="btnEditar"
                  >
                    Editar
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}

        <Link href="/sistema/categorias/cadastrar" className="btnFlutuante">
          <Plus size={28} />
        </Link>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 28px;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .topo {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .topo h1 {
          margin: 0;
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
        }

        .topo p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 0.98rem;
        }

        .btnAtualizar {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 0;
          background: #ffffff;
          color: #0f172a;
          padding: 12px 16px;
          border-radius: 14px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          font-weight: 600;
        }

        .btnAtualizar:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
        }

        .buscaBox {
          position: relative;
          margin-bottom: 18px;
        }

        .iconeBusca {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .buscaBox input {
          width: 100%;
          height: 54px;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 0 16px 0 46px;
          outline: none;
          background: #fff;
          font-size: 0.98rem;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .buscaBox input:focus {
          border-color: #ec4899;
          box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.12);
        }

        .resumo {
          margin-bottom: 22px;
        }

        .resumoCard {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 22px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
        }

        .resumoCard span {
          display: block;
          color: #64748b;
          font-size: 0.92rem;
          margin-bottom: 6px;
        }

        .resumoCard strong {
          font-size: 2rem;
          color: #0f172a;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
        }

        .card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 22px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
        }

        .cardTopo {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 16px;
        }

        .iconeCard {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: linear-gradient(135deg, #fce7f3, #fbcfe8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #db2777;
          flex-shrink: 0;
        }

        .infoCard h2 {
          margin: 0;
          font-size: 1.05rem;
          color: #0f172a;
          font-weight: 700;
        }

        .infoCard span {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 0.9rem;
          word-break: break-word;
        }

        .conteudoCard p {
          margin: 0;
          color: #475569;
          line-height: 1.6;
          min-height: 48px;
        }

        .acoes {
          margin-top: 18px;
          display: flex;
          gap: 10px;
        }

        .btnEditar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          background: #0f172a;
          color: #fff;
          padding: 11px 16px;
          border-radius: 14px;
          font-weight: 600;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .btnEditar:hover {
          transform: translateY(-1px);
          background: #111827;
        }

        .btnFlutuante {
          position: fixed;
          right: 24px;
          bottom: 24px;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #ec4899, #db2777);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 16px 36px rgba(219, 39, 119, 0.38);
          z-index: 50;
          text-decoration: none;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .btnFlutuante:hover {
          transform: scale(1.08);
          box-shadow: 0 20px 42px rgba(219, 39, 119, 0.45);
        }

        .estado {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 48px 20px;
          text-align: center;
          color: #64748b;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
        }

        .estado h3 {
          margin: 12px 0 6px;
          color: #0f172a;
          font-size: 1.15rem;
        }

        .estado p {
          margin: 0;
          line-height: 1.5;
        }

        .estado.erro {
          color: #b91c1c;
        }

        @media (max-width: 768px) {
          .container {
            padding: 16px;
          }

          .topo {
            align-items: stretch;
          }

          .btnAtualizar {
            justify-content: center;
            width: 100%;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .btnFlutuante {
            right: 16px;
            bottom: 16px;
            width: 58px;
            height: 58px;
          }
        }
      `}</style>
    </>
  );
}