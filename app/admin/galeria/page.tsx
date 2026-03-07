"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  FiImage,
  FiSearch,
  FiTrash2,
  FiExternalLink,
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi";

type ImgItem = {
  id_imagem: number;
  produto_id: number;
  imagem: string; // "upload/produtos/galeria/xxx.jpg"
  ordem?: number;
  criado?: string;
  produto_nome?: string | null;
};

type ApiResp = {
  dados?: {
    page?: number;
    limit?: number;
    total?: number;
    imagens?: ImgItem[];
  };
};

function normalizarCaminho(caminho?: string) {
  if (!caminho) return "";
  let c = String(caminho).trim().replace(/\\/g, "/");
  c = c.replace(/^\/+/, "");
  c = c.replace(/^public\//, "");
  return c;
}

function getImagemUrl(caminho?: string) {
  const c = normalizarCaminho(caminho);
  if (!c) return "";
  const base = String(api.defaults.baseURL || "").replace(/\/+$/, "");
  return `${base}/${c}`;
}

export default function GaleriaPage() {
  const [loading, setLoading] = useState(true);

  // dados
  const [itens, setItens] = useState<ImgItem[]>([]);
  const [total, setTotal] = useState(0);

  // filtros/paginação
  const [busca, setBusca] = useState("");
  const [somenteGaleria, setSomenteGaleria] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);

  const totalPaginas = useMemo(() => {
    const t = Math.ceil((total || 0) / (limit || 1));
    return Math.max(1, t);
  }, [total, limit]);

  async function carregar() {
    try {
      setLoading(true);

      const params: any = {
        page,
        limit,
        somente_galeria: somenteGaleria ? 1 : 0,
      };

      const res = await api.get<ApiResp>("/admin/galeria", { params });

      const dados = res?.data?.dados || {};
      const imgs = Array.isArray(dados.imagens) ? dados.imagens : [];

      setItens(imgs);
      setTotal(Number(dados.total || 0));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar galeria");
      setItens([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  async function removerImagem(id_imagem: number) {
    if (!confirm("Deseja excluir esta imagem da galeria?")) return;

    try {
      await api.delete(`/admin/produto/imagem/${id_imagem}/remover`);
      toast.success("Imagem removida!");

      // atualiza lista sem recarregar tudo (mais rápido)
      setItens((prev) => prev.filter((x) => x.id_imagem !== id_imagem));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error(err);
      toast.error("Erro ao remover imagem");
    }
  }

  // carrega quando muda pagina/limit/filtro
  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, somenteGaleria]);

  // reset page quando muda limit ou filtro
  useEffect(() => {
    setPage(1);
  }, [limit, somenteGaleria]);

  // filtro local por nome do produto (sem bater no back)
  const itensFiltrados = useMemo(() => {
    const b = busca.trim().toLowerCase();
    if (!b) return itens;

    return itens.filter((i) =>
      String(i.produto_nome || "")
        .toLowerCase()
        .includes(b)
    );
  }, [itens, busca]);

  return (
    <div className="wrap">
      <ToastContainer position="top-right" autoClose={2500} />

      <div className="topbar">
        <div className="titleBox">
          <div className="iconTitle">
            <FiImage size={22} />
          </div>
          <div>
            <h1>Galeria</h1>
            <p>Imagens extras dos produtos (upload/produtos/galeria)</p>
          </div>
        </div>

        <div className="actions">
          <Link href="/painel" className="btn ghost">
            Voltar ao Dashboard
          </Link>

          <div className="select">
            <span>Por página</span>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
              <option value={96}>96</option>
            </select>
          </div>
        </div>
      </div>

      <div className="filters">
        <div className="search">
          <FiSearch />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome do produto (local)"
          />
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={somenteGaleria}
            onChange={(e) => setSomenteGaleria(e.target.checked)}
          />
          Somente galeria
        </label>

        <div className="meta">
          Total no banco: <b>{total}</b>
        </div>
      </div>

      <div className="pager">
        <button
          className="pbtn"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1 || loading}
        >
          <FiArrowLeft /> Anterior
        </button>

        <div className="pinfo">
          Página <b>{page}</b> de <b>{totalPaginas}</b>
        </div>

        <button
          className="pbtn"
          onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
          disabled={page >= totalPaginas || loading}
        >
          Próximo <FiArrowRight />
        </button>
      </div>

      {loading ? (
        <div className="loading">Carregando galeria...</div>
      ) : itensFiltrados.length === 0 ? (
        <div className="empty">Nenhuma imagem encontrada.</div>
      ) : (
        <div className="grid">
          {itensFiltrados.map((item) => {
            const url = getImagemUrl(item.imagem);

            return (
              <div key={item.id_imagem} className="card">
                <div className="thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {url ? <img src={url} alt={item.produto_nome || "Imagem"} /> : <div className="noimg">Sem imagem</div>}
                </div>

                <div className="body">
                  <div className="pname" title={item.produto_nome || ""}>
                    {item.produto_nome || "Produto sem nome"}
                  </div>

                  <div className="sub">
                    <span>ID imagem: <b>#{item.id_imagem}</b></span>
                    <span>Produto: <b>#{item.produto_id}</b></span>
                  </div>

                  <div className="path" title={item.imagem}>
                    {item.imagem}
                  </div>

                  <div className="btns">
                    <a className="btn ghost" href={url} target="_blank" rel="noreferrer">
                      <FiExternalLink /> Abrir
                    </a>

                    <button className="btn danger" onClick={() => removerImagem(item.id_imagem)}>
                      <FiTrash2 /> Excluir
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .titleBox {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .iconTitle {
          width: 46px;
          height: 46px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          box-shadow: 0 10px 22px rgba(124, 58, 237, 0.28);
        }

        h1 {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #111827;
        }

        p {
          margin: 2px 0 0;
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }

        .actions {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .select {
          display: flex;
          gap: 8px;
          align-items: center;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: 999px;
          padding: 10px 12px;
          box-shadow: 0 10px 26px rgba(0, 0, 0, 0.05);
          color: #64748b;
          font-size: 12px;
          font-weight: 800;
        }

        .select select {
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 999px;
          padding: 6px 10px;
          outline: none;
          font-weight: 800;
          cursor: pointer;
        }

        .filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.07);
          border-radius: 16px;
          padding: 12px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
        }

        .search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          padding: 10px 12px;
          min-width: min(520px, 100%);
        }

        .search input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
        }

        .check {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          color: #334155;
          user-select: none;
        }

        .meta {
          font-size: 13px;
          color: #334155;
          font-weight: 800;
        }

        .pager {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .pbtn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: #fff;
          cursor: pointer;
          font-weight: 900;
          color: #111827;
          transition: 0.2s;
        }

        .pbtn:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 30px rgba(0, 0, 0, 0.08);
        }

        .pbtn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .pinfo {
          font-size: 13px;
          color: #64748b;
          font-weight: 900;
        }

        .loading,
        .empty {
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(0, 0, 0, 0.02);
          font-size: 13px;
          color: #64748b;
          font-weight: 800;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 14px;
        }

        .card {
          background: #fff;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.06);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          transition: 0.2s;
        }

        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 55px rgba(0, 0, 0, 0.12);
        }

        .thumb {
          height: 170px;
          background: #eef2ff;
          position: relative;
        }

        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .noimg {
          height: 100%;
          display: grid;
          place-items: center;
          color: #64748b;
          font-weight: 900;
          font-size: 13px;
        }

        .body {
          padding: 12px;
          display: grid;
          gap: 8px;
        }

        .pname {
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sub {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          font-size: 12px;
          color: #475569;
          font-weight: 800;
        }

        .path {
          font-size: 11px;
          color: #64748b;
          font-weight: 800;
          opacity: 0.95;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          border-top: 1px dashed rgba(0, 0, 0, 0.12);
          padding-top: 8px;
        }

        .btns {
          display: flex;
          gap: 10px;
          margin-top: 6px;
        }

        .btn {
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 900;
          border: 1px solid rgba(0, 0, 0, 0.1);
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .btn.ghost {
          background: rgba(0, 0, 0, 0.03);
          color: #111827;
        }

        .btn.danger {
          background: #ef4444;
          border-color: #ef4444;
          color: #fff;
        }
      `}</style>
    </div>
  );
}