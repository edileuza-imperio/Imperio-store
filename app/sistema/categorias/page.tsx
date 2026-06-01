"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/Api/conectar";
import {
  Plus,
  Search,
  RefreshCcw,
  FolderOpen,
  Tag,
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
};

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  function extrairCategorias(resposta: any): Categoria[] {
    const dados = resposta?.dados;

    if (Array.isArray(resposta)) return resposta;
    if (Array.isArray(dados)) return dados;
    if (Array.isArray(dados?.dados)) return dados.dados;

    return [];
  }

  async function carregarCategorias() {
    try {
      setLoading(true);
      setErro(null);

      const response = await api.get("/painel/categorias");
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
      <main className="page">
        <section className="hero">
          <div className="heroLeft">
            <div className="heroBadge">
              <Tag size={16} />
              <span>Gerenciamento</span>
            </div>

            <h1>Categorias</h1>
            <p>
              Organize, edite e acompanhe as categorias do sistema com uma
              interface mais limpa e direta.
            </p>
          </div>

          <div className="heroRight">
            <button onClick={carregarCategorias} className="refreshButton">
              <RefreshCcw size={18} />
              Atualizar
            </button>

            <div className="heroStat">
              <strong>{Array.isArray(categorias) ? categorias.length : 0}</strong>
              <span>categorias cadastradas</span>
            </div>
          </div>
        </section>

        <section className="searchSection">
          <div className="searchBox">
            <Search size={18} className="searchIcon" />
            <input
              type="text"
              placeholder="Pesquisar por nome, slug ou descrição..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </section>

        {loading ? (
          <section className="stateCard">
            <FolderOpen size={42} />
            <h3>Carregando categorias...</h3>
            <p>Aguarde um momento enquanto buscamos os dados.</p>
          </section>
        ) : erro ? (
          <section className="stateCard error">
            <AlertCircle size={42} />
            <h3>Algo deu errado</h3>
            <p>{erro}</p>
          </section>
        ) : categoriasFiltradas.length === 0 ? (
          <section className="stateCard">
            <FolderOpen size={42} />
            <h3>Nenhuma categoria encontrada</h3>
            <p>Cadastre uma nova categoria usando o botão no canto.</p>
          </section>
        ) : (
          <section className="grid">
            {categoriasFiltradas.map((categoria) => (
              <article key={categoria.id_categoria} className="card">
                <div className="cardTop">
                  <div className="cardIcon">
                    <FolderOpen size={20} />
                  </div>

                  <div className="cardTitle">
                    <h2>{categoria.nome}</h2>
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

                <p className="cardDescription">
                  {categoria.descricao?.trim()
                    ? categoria.descricao
                    : "Nenhuma descrição cadastrada."}
                </p>

                <div className="cardFooter">
                  <div className="meta">
                    <span>ID #{categoria.id_categoria}</span>
                  </div>

                  <Link
                    href={`/sistema/categorias/${categoria.id_categoria}`}
                    className="editButton"
                  >
                    Editar
                  </Link>
                </div>
              </article>
            ))}
          </section>
        )}

        <Link href="/sistema/categorias/cadastrar" className="fab">
          <Plus size={22} />
          <span>Nova categoria</span>
        </Link>
      </main>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 28px;
          background:
            radial-gradient(circle at top left, rgba(236, 72, 153, 0.09), transparent 28%),
            radial-gradient(circle at top right, rgba(15, 23, 42, 0.05), transparent 26%),
            linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
        }

        .hero {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
          padding: 28px;
          border: 1px solid rgba(226, 232, 240, 0.9);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(10px);
          box-shadow: 0 18px 50px rgba(15, 23, 42, 0.06);
        }

        .heroLeft {
          max-width: 760px;
        }

        .heroBadge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: #fff1f6;
          color: #be185d;
          font-size: 0.88rem;
          font-weight: 700;
          margin-bottom: 14px;
        }

        .hero h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1.05;
          color: #0f172a;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .hero p {
          margin: 12px 0 0;
          color: #64748b;
          line-height: 1.7;
          font-size: 1rem;
        }

        .heroRight {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 14px;
          min-width: 220px;
        }

        .refreshButton {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          color: #0f172a;
          padding: 12px 16px;
          border-radius: 16px;
          cursor: pointer;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .refreshButton:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.1);
        }

        .heroStat {
          min-width: 220px;
          padding: 18px 18px 16px;
          border-radius: 22px;
          background: linear-gradient(135deg, #0f172a, #1f2937);
          color: #fff;
          box-shadow: 0 18px 36px rgba(15, 23, 42, 0.18);
        }

        .heroStat strong {
          display: block;
          font-size: 2rem;
          line-height: 1;
          margin-bottom: 6px;
        }

        .heroStat span {
          display: block;
          font-size: 0.92rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .searchSection {
          margin-bottom: 18px;
        }

        .searchBox {
          position: relative;
        }

        .searchIcon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
        }

        .searchBox input {
          width: 100%;
          height: 58px;
          padding: 0 18px 0 46px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: #fff;
          outline: none;
          font-size: 0.98rem;
          color: #0f172a;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .searchBox input:focus {
          border-color: #ec4899;
          box-shadow: 0 0 0 4px rgba(236, 72, 153, 0.12);
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 18px;
          padding-bottom: 96px;
        }

        .card {
          position: relative;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.06);
          padding: 22px;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(90deg, #ec4899, #f97316);
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.1);
        }

        .cardTop {
          display: grid;
          grid-template-columns: 52px 1fr auto;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        }

        .cardIcon {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fce7f3, #fbcfe8);
          color: #db2777;
          flex-shrink: 0;
        }

        .cardTitle h2 {
          margin: 0;
          font-size: 1.04rem;
          color: #0f172a;
          font-weight: 800;
          line-height: 1.2;
        }

        .cardTitle span {
          display: block;
          margin-top: 4px;
          font-size: 0.88rem;
          color: #64748b;
          word-break: break-word;
        }

        .miniAction {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          background: #f8fafc;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .miniAction:hover {
          transform: translateY(-1px);
          background: #eef2f7;
        }

        .cardDescription {
          margin: 0;
          color: #475569;
          line-height: 1.65;
          min-height: 54px;
        }

        .cardFooter {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 18px;
        }

        .meta span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 999px;
          background: #f8fafc;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
        }

        .editButton {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 15px;
          border-radius: 14px;
          background: #0f172a;
          color: #fff;
          text-decoration: none;
          font-weight: 700;
          transition: transform 0.2s ease, background 0.2s ease;
        }

        .editButton:hover {
          transform: translateY(-1px);
          background: #111827;
        }

        .stateCard {
          margin-top: 20px;
          padding: 54px 20px;
          border: 1px solid #e2e8f0;
          border-radius: 26px;
          background: #fff;
          text-align: center;
          color: #64748b;
          box-shadow: 0 14px 32px rgba(15, 23, 42, 0.05);
        }

        .stateCard h3 {
          margin: 12px 0 8px;
          color: #0f172a;
          font-size: 1.2rem;
        }

        .stateCard p {
          margin: 0;
          line-height: 1.6;
        }

        .stateCard.error {
          color: #b91c1c;
        }

        .fab {
          position: fixed;
          right: 22px;
          bottom: 22px;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 14px 18px;
          border-radius: 999px;
          background: linear-gradient(135deg, #ec4899, #db2777);
          color: #fff;
          text-decoration: none;
          box-shadow: 0 18px 38px rgba(219, 39, 119, 0.35);
          z-index: 50;
          font-weight: 800;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .fab:hover {
          transform: scale(1.04);
          box-shadow: 0 22px 44px rgba(219, 39, 119, 0.42);
        }

        .fab span {
          white-space: nowrap;
        }

        @media (max-width: 820px) {
          .page {
            padding: 16px;
          }

          .hero {
            flex-direction: column;
            padding: 20px;
          }

          .heroRight {
            width: 100%;
            align-items: stretch;
          }

          .heroStat,
          .refreshButton {
            width: 100%;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .cardTop {
            grid-template-columns: 52px 1fr;
          }

          .miniAction {
            display: none;
          }

          .cardFooter {
            flex-direction: column;
            align-items: stretch;
          }

          .editButton {
            width: 100%;
          }

          .fab {
            right: 16px;
            bottom: 16px;
          }
        }
      `}</style>
    </>
  );
}