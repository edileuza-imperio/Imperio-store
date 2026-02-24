"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { rotas } from "@/components/Bibioteca/config/rotas";
import { FaEye, FaSearch, FaFilter } from "react-icons/fa";

interface ProdutoApi {
  id_produto: number;
  nome: string;
  preco: any;
  estoque: any;
  catalogo: any;
  categoria_nome?: string;
  slug?: string;
  imagem?: string;
}

interface ProdutoUI {
  id_produto: number;
  nome: string;
  preco: number;
  estoque: number;
  publicado: boolean;
  categoria_nome?: string;
  slug?: string;
  imagem?: string;
}

function getImagemUrl(caminho?: string) {
  if (!caminho) return undefined;
  const base = api.defaults.baseURL || "";
  const baseFinal = base.endsWith("/") ? base : `${base}/`;
  return `${baseFinal}${String(caminho).replace(/^\/+/, "")}`;
}

function isPublicado(valor: any): boolean {
  if (valor === true) return true;
  if (valor === false) return false;

  const v = String(valor ?? "").trim().toLowerCase();

  if (v === "1" || v === "true") return true;
  if (v === "0" || v === "false" || v === "" || v === "null" || v === "undefined") return false;

  if (v === "5") return true;
  if (v === "6") return false;

  const n = Number(v);
  if (!Number.isNaN(n)) return n > 0;

  return false;
}

function resolveLista(resData: any): any[] {
  const root = resData?.dados ?? resData?.data ?? resData;
  if (Array.isArray(root)) return root;
  if (root && typeof root === "object") {
    if (Array.isArray(root.dados)) return root.dados;
    if (root.dados && Array.isArray(root.dados.dados)) return root.dados.dados;
  }
  return [];
}

type Filtro = "todos" | "publicados" | "ocultos";

export default function CatalogoPage() {
  const [produtos, setProdutos] = useState<ProdutoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const itensPorPagina = 9;

  const fetchProdutos = async () => {
    try {
      setLoading(true);
      const res = await api.get(rotas.admin.api.produtosCatalogo, { withCredentials: true });
      const lista = resolveLista(res.data) as ProdutoApi[];

      const normalizados: ProdutoUI[] = lista.map((p) => ({
        id_produto: Number(p.id_produto),
        nome: String(p.nome ?? ""),
        preco: Number(p.preco ?? 0),
        estoque: Number(p.estoque ?? 0),
        publicado: isPublicado(p.catalogo),
        categoria_nome: p.categoria_nome ?? "Sem categoria",
        slug: p.slug ?? undefined,
        imagem: getImagemUrl(p.imagem),
      }));

      setProdutos(normalizados);
    } catch (err: any) {
      console.error(err?.response?.data || err?.message || err);
      toast.error("Erro ao carregar produtos");
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCatalogo = async (produto: ProdutoUI) => {
    try {
      setProdutos((prev) =>
        prev.map((p) =>
          p.id_produto === produto.id_produto ? { ...p, publicado: !produto.publicado } : p
        )
      );

      if (produto.publicado) {
        await api.put(rotas.admin.api.catalogoNao(produto.id_produto), null, { withCredentials: true });
        toast.info("Produto removido do catálogo");
      } else {
        await api.put(rotas.admin.api.catalogoSim(produto.id_produto), null, { withCredentials: true });
        toast.success("Produto publicado no catálogo");
      }

      await fetchProdutos();
    } catch (err: any) {
      console.error(err?.response?.data || err?.message || err);
      toast.error("Erro ao atualizar catálogo");

      setProdutos((prev) =>
        prev.map((p) =>
          p.id_produto === produto.id_produto ? { ...p, publicado: produto.publicado } : p
        )
      );
    }
  };

  // ✅ filtro + busca
  const produtosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const passaFiltro =
        filtro === "todos" ? true : filtro === "publicados" ? p.publicado : !p.publicado;

      const passaBusca =
        !q ||
        p.nome.toLowerCase().includes(q) ||
        (p.categoria_nome ?? "").toLowerCase().includes(q) ||
        String(p.id_produto).includes(q);

      return passaFiltro && passaBusca;
    });
  }, [produtos, busca, filtro]);

  const totalPaginas = useMemo(
    () => Math.ceil(produtosFiltrados.length / itensPorPagina),
    [produtosFiltrados.length]
  );

  const produtosPagina = useMemo(() => {
    const ini = (paginaAtual - 1) * itensPorPagina;
    return produtosFiltrados.slice(ini, ini + itensPorPagina);
  }, [produtosFiltrados, paginaAtual]);

  useEffect(() => {
    if (paginaAtual > totalPaginas && totalPaginas > 0) setPaginaAtual(totalPaginas);
    if (totalPaginas === 0) setPaginaAtual(1);
  }, [totalPaginas, paginaAtual]);

  const publicadosCount = useMemo(() => produtos.filter((p) => p.publicado).length, [produtos]);

  if (loading) return <div className="page-loading">Carregando catálogo...</div>;

  return (
    <div className="page">
      <ToastContainer position="top-right" />

      {/* Header / Summary */}
      <div className="header">
        <div className="headerLeft">
          <h1>Catálogo</h1>
          <p>Publique/oculte produtos que aparecem no site.</p>
        </div>

        <div className="headerStats">
          <div className="stat">
            <span className="statLabel">Total</span>
            <strong className="statValue">{produtos.length}</strong>
          </div>
          <div className="stat">
            <span className="statLabel">Publicados</span>
            <strong className="statValue">{publicadosCount}</strong>
          </div>
          <div className="stat">
            <span className="statLabel">Ocultos</span>
            <strong className="statValue">{Math.max(0, produtos.length - publicadosCount)}</strong>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search">
          <FaSearch />
          <input
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPaginaAtual(1);
            }}
            placeholder="Buscar por nome, categoria ou ID…"
          />
        </div>

        <div className="filter">
          <FaFilter />
          <select
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value as Filtro);
              setPaginaAtual(1);
            }}
          >
            <option value="todos">Todos</option>
            <option value="publicados">Publicados</option>
            <option value="ocultos">Ocultos</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {produtosFiltrados.length === 0 ? (
        <div className="empty">
          <div className="emptyCard">
            <strong>Nenhum produto encontrado</strong>
            <span>Tente ajustar a busca ou o filtro.</span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid">
            {produtosPagina.map((produto) => (
              <div key={produto.id_produto} className="card">
                <div className="media">
                  {produto.imagem ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={produto.imagem} alt={produto.nome} />
                  ) : (
                    <div className="noImage">Sem imagem</div>
                  )}

                  <div className="overlay" />

                  <div className="topRow">
                    <span className={`badge ${produto.publicado ? "on" : "off"}`}>
                      {produto.publicado ? "Publicado" : "Oculto"}
                    </span>

                    <span className="idPill">#{produto.id_produto}</span>
                  </div>

                  <div className="bottomRow">
                    <span className="category">{produto.categoria_nome || "Sem categoria"}</span>
                  </div>
                </div>

                <div className="body">
                  <h3 title={produto.nome}>{produto.nome}</h3>

                  <div className="meta">
                    <div className="chip">
                      <span>Preço</span>
                      <strong>R$ {Number(produto.preco).toFixed(2)}</strong>
                    </div>

                    <div className="chip">
                      <span>Estoque</span>
                      <strong>{Number(produto.estoque)}</strong>
                    </div>
                  </div>

                  <div className="actions">
                    <button
                      className={`btn ${produto.publicado ? "danger" : "success"}`}
                      onClick={() => toggleCatalogo(produto)}
                    >
                      {produto.publicado ? "Ocultar" : "Publicar"}
                    </button>

                    <button
                      className="btn ghost"
                      onClick={() =>
                        produto.slug
                          ? window.open(`/produto/${produto.slug}`, "_blank")
                          : toast.info("Produto sem página")
                      }
                      title="Ver página"
                    >
                      <FaEye />
                      Ver
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPaginas > 1 && (
            <div className="pagination">
              <button
                className="pageBtn"
                disabled={paginaAtual === 1}
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              >
                ←
              </button>

              {Array.from({ length: totalPaginas }).map((_, i) => (
                <button
                  key={i}
                  className={`pageBtn ${paginaAtual === i + 1 ? "active" : ""}`}
                  onClick={() => setPaginaAtual(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button
                className="pageBtn"
                disabled={paginaAtual === totalPaginas}
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              >
                →
              </button>
            </div>
          )}
        </>
      )}

      <style jsx global>{`
        :root{
          --bg: #f6f7fb;
          --card: #ffffff;
          --text: #1f2937;
          --muted: #6b7280;
          --border: rgba(15, 23, 42, 0.08);
          --shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
          --shadow2: 0 10px 24px rgba(15, 23, 42, 0.10);
          --radius: 18px;

          --ok: #22c55e;
          --bad: #ef4444;
          --accent: #6b4c4f; /* sua cor */
        }

        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: var(--bg);
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          color: var(--text);
        }

        .page { padding: 28px; min-height: 100vh; }

        .page-loading{
          text-align: center;
          padding: 60px 20px;
          color: var(--muted);
        }

        .header{
          background: linear-gradient(135deg, rgba(107,76,79,0.10), rgba(255,255,255,0.6));
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px 18px;
          display: flex;
          gap: 18px;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
          margin-bottom: 16px;
        }

        .headerLeft h1{
          margin: 0;
          font-size: 26px;
          letter-spacing: -0.3px;
        }
        .headerLeft p{
          margin: 6px 0 0;
          color: var(--muted);
        }

        .headerStats{
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .stat{
          background: rgba(255,255,255,0.75);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 10px 12px;
          min-width: 110px;
        }
        .statLabel{
          display: block;
          font-size: 12px;
          color: var(--muted);
        }
        .statValue{
          font-size: 18px;
          letter-spacing: -0.3px;
        }

        .toolbar{
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          margin: 14px 0 18px;
          flex-wrap: wrap;
        }

        .search, .filter{
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px 12px;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
        }
        .search{
          flex: 1;
          min-width: 260px;
        }
        .search input{
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
          background: transparent;
          color: var(--text);
        }
        .filter select{
          border: none;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: var(--text);
          cursor: pointer;
        }

        .grid{
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 18px;
        }

        .card{
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .card:hover{
          transform: translateY(-6px);
          box-shadow: var(--shadow2);
        }

        .media{
          position: relative;
          height: 190px;
          background: #eef2f7;
        }
        .media img{
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.02);
        }
        .noImage{
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          font-weight: 600;
        }
        .overlay{
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.40));
          pointer-events: none;
        }

        .topRow{
          position: absolute;
          top: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .badge{
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          color: #fff;
          letter-spacing: 0.2px;
          box-shadow: 0 10px 22px rgba(0,0,0,0.25);
        }
        .badge.on{ background: rgba(34,197,94,0.95); }
        .badge.off{ background: rgba(239,68,68,0.95); }

        .idPill{
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          color: #111827;
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(255,255,255,0.55);
          backdrop-filter: blur(6px);
        }

        .bottomRow{
          position: absolute;
          bottom: 12px;
          left: 12px;
          right: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .category{
          color: rgba(255,255,255,0.92);
          font-size: 13px;
          font-weight: 700;
          text-shadow: 0 10px 22px rgba(0,0,0,0.35);
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .body{ padding: 14px 14px 16px; }

        .body h3{
          margin: 0 0 10px;
          font-size: 16px;
          letter-spacing: -0.2px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .meta{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .chip{
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 10px 10px;
          background: rgba(15, 23, 42, 0.02);
        }
        .chip span{
          display:block;
          font-size: 12px;
          color: var(--muted);
          margin-bottom: 2px;
        }
        .chip strong{
          font-size: 14px;
          letter-spacing: -0.2px;
        }

        .actions{
          display: grid;
          grid-template-columns: 1fr 0.8fr;
          gap: 10px;
        }

        .btn{
          border: none;
          cursor: pointer;
          padding: 11px 12px;
          border-radius: 14px;
          font-weight: 800;
          transition: transform .12s ease, opacity .12s ease, box-shadow .12s ease;
          outline: none;
        }
        .btn:active{ transform: scale(0.98); }
        .btn:hover{ opacity: 0.95; }

        .btn.success{
          background: rgba(34,197,94,0.95);
          color: #fff;
          box-shadow: 0 12px 22px rgba(34,197,94,0.22);
        }
        .btn.danger{
          background: rgba(239,68,68,0.95);
          color: #fff;
          box-shadow: 0 12px 22px rgba(239,68,68,0.22);
        }

        .btn.ghost{
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(107,76,79,0.08);
          color: var(--accent);
          border: 1px solid rgba(107,76,79,0.18);
        }
        .btn.ghost:hover{
          background: rgba(107,76,79,0.12);
        }

        .pagination{
          margin-top: 22px;
          display: flex;
          justify-content: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .pageBtn{
          min-width: 38px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--card);
          cursor: pointer;
          font-weight: 800;
          color: var(--text);
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
          transition: .15s ease;
        }
        .pageBtn:hover{ transform: translateY(-2px); }
        .pageBtn:disabled{
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
        }
        .pageBtn.active{
          background: var(--accent);
          color: #fff;
          border-color: rgba(107,76,79,0.35);
        }

        .empty{
          padding: 24px 0;
          display: flex;
          justify-content: center;
        }
        .emptyCard{
          width: min(520px, 100%);
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px;
          text-align: center;
          box-shadow: 0 10px 22px rgba(15, 23, 42, 0.05);
          color: var(--muted);
        }
        .emptyCard strong{
          display:block;
          color: var(--text);
          margin-bottom: 6px;
        }

        @media (max-width: 520px){
          .header{ flex-direction: column; align-items: stretch; }
          .headerStats{ justify-content: flex-start; }
          .actions{ grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}