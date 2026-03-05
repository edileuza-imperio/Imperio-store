"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import {
  FiImage,
  FiSearch,
  FiRefreshCw,
  FiX,
  FiInfo,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type ImagemGaleria = {
  id_imagem: number;
  produto_id: number;
  imagem: string; // ex: upload/produtos/galeria/xxx.jpg  (ou upload/produtos/xxx.jpg)
  ordem?: number;
  criado?: string;
  produto_nome?: string; // opcional (se o backend devolver)
};

const PAGE_SIZE = 24;

function getImagemUrl(caminho?: string) {
  if (!caminho) return undefined;

  let c = String(caminho).trim().replace(/\\/g, "/");
  c = c.replace(/^\/+/, "");
  c = c.replace(/^public\//, "");

  const base = String(api.defaults.baseURL || "").replace(/\/+$/, "");
  return `${base}/${c}`;
}

function isGaleriaPath(path?: string) {
  if (!path) return false;
  const p = path.replace(/\\/g, "/").toLowerCase();
  return p.includes("upload/produtos/galeria/");
}

export default function GaleriaPage() {
  const [imagens, setImagens] = useState<ImagemGaleria[]>([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [onlyGaleria, setOnlyGaleria] = useState(true);

  const [pagina, setPagina] = useState(1);
  const [selected, setSelected] = useState<ImagemGaleria | null>(null);

  async function carregarGaleria() {
    try {
      setLoading(true);

      // ✅ TENTATIVAS: usa o endpoint que existir no seu backend
      // 1) /admin/galeria
      // 2) /admin/produtos/imagens
      // 3) /admin/imagens
      // (Se nenhum existir, você vai ver o toast e a tela vai ficar vazia)
      const tries = ["/admin/galeria", "/admin/produtos/imagens", "/admin/imagens"];

      let res: any = null;
      let ok = false;

      for (const url of tries) {
        try {
          res = await api.get(url);
          ok = true;
          break;
        } catch {
          // tenta próximo
        }
      }

      if (!ok) {
        toast.error("Não encontrei um endpoint de galeria. Crie um GET no backend (ex: /admin/galeria).");
        setImagens([]);
        return;
      }

      // ✅ normaliza: aceita vários formatos
      const data =
        res?.data?.dados?.imagens ??
        res?.data?.dados?.dados ??
        res?.data?.dados ??
        res?.data ??
        [];

      const lista: ImagemGaleria[] = Array.isArray(data) ? data : [];

      setImagens(
        lista
          .map((x: any) => ({
            id_imagem: Number(x.id_imagem ?? x.id ?? 0),
            produto_id: Number(x.produto_id ?? x.produtoId ?? 0),
            imagem: String(x.imagem ?? ""),
            ordem: x.ordem !== undefined ? Number(x.ordem) : undefined,
            criado: x.criado ? String(x.criado) : undefined,
            produto_nome: x.produto_nome ? String(x.produto_nome) : undefined,
          }))
          .filter((x) => x.id_imagem > 0 && x.imagem)
      );
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar galeria");
      setImagens([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarGaleria();
  }, []);

  const filtradas = useMemo(() => {
    const termo = q.trim().toLowerCase();

    return imagens.filter((img) => {
      if (onlyGaleria && !isGaleriaPath(img.imagem)) return false;

      if (!termo) return true;

      const blob =
        `${img.id_imagem} ${img.produto_id} ${img.imagem} ${img.produto_nome ?? ""}`.toLowerCase();

      return blob.includes(termo);
    });
  }, [imagens, q, onlyGaleria]);

  const totalPaginas = useMemo(() => {
    const t = Math.ceil(filtradas.length / PAGE_SIZE);
    return Math.max(t, 1);
  }, [filtradas.length]);

  useEffect(() => {
    setPagina(1);
  }, [q, onlyGaleria]);

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
    if (pagina < 1) setPagina(1);
  }, [pagina, totalPaginas]);

  const paginadas = useMemo(() => {
    const start = (pagina - 1) * PAGE_SIZE;
    return filtradas.slice(start, start + PAGE_SIZE);
  }, [filtradas, pagina]);

  return (
    <div className="wrap">
      <ToastContainer position="top-right" autoClose={2500} />

      <div className="header">
        <div className="title">
          <div className="badgeIcon">
            <FiImage size={18} />
          </div>
          <div>
            <h1>Galeria</h1>
            <p>Imagens extras dos produtos (produto_imagem)</p>
          </div>
        </div>

        <button className="btn refresh" onClick={carregarGaleria} disabled={loading}>
          <FiRefreshCw size={16} />
          Atualizar
        </button>
      </div>

      <div className="toolbar">
        <div className="search">
          <FiSearch size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por produto_id, id_imagem, nome, caminho..."
          />
          {q && (
            <button className="clear" onClick={() => setQ("")} title="Limpar">
              <FiX size={16} />
            </button>
          )}
        </div>

        <label className="toggle">
          <input
            type="checkbox"
            checked={onlyGaleria}
            onChange={(e) => setOnlyGaleria(e.target.checked)}
          />
          <span>Somente /upload/produtos/galeria</span>
        </label>

        <div className="meta">
          <span>
            Total: <b>{filtradas.length}</b>
          </span>
          <span>
            Página: <b>{pagina}</b>/<b>{totalPaginas}</b>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="state">Carregando galeria...</div>
      ) : paginadas.length === 0 ? (
        <div className="empty">
          <div className="emptyIcon">
            <FiInfo size={18} />
          </div>
          <div>
            <b>Nenhuma imagem encontrada</b>
            <div className="muted">
              Se você já tem registros em <code>produto_imagem</code>, crie um endpoint GET que retorne essa lista
              (ex: <code>/admin/galeria</code>).
            </div>
          </div>
        </div>
      ) : (
        <div className="grid">
          {paginadas.map((img) => {
            const url = getImagemUrl(img.imagem);
            const ehGaleria = isGaleriaPath(img.imagem);

            return (
              <button
                key={img.id_imagem}
                className="tile"
                type="button"
                onClick={() => setSelected(img)}
              >
                <div className="thumb">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
                      alt={`img-${img.id_imagem}`}
                      onError={(e) => {
                        // fallback visual quando 404/403
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                        const parent = e.currentTarget.parentElement;
                        if (parent) parent.classList.add("broken");
                      }}
                    />
                  ) : null}

                  <div className="flags">
                    <span className={`pill ${ehGaleria ? "ok" : "warn"}`}>
                      {ehGaleria ? "galeria" : "fora"}
                    </span>
                  </div>
                </div>

                <div className="info">
                  <div className="line">
                    <b>#{img.id_imagem}</b>
                    <span className="muted">produto {img.produto_id}</span>
                  </div>

                  <div className="path" title={img.imagem}>
                    {img.imagem}
                  </div>

                  {img.produto_nome && <div className="muted">{img.produto_nome}</div>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* PAGINAÇÃO */}
      {!loading && totalPaginas > 1 && (
        <div className="pager">
          <button className="pbtn" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina <= 1}>
            Anterior
          </button>

          <div className="pnums">
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`pnum ${p === pagina ? "active" : ""}`}
                onClick={() => setPagina(p)}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            className="pbtn"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina >= totalPaginas}
          >
            Próximo
          </button>
        </div>
      )}

      {/* MODAL DETALHE */}
      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="mhead">
              <div className="mtitle">
                <b>Imagem #{selected.id_imagem}</b>
                <span className="muted">produto {selected.produto_id}</span>
              </div>

              <button className="mclose" onClick={() => setSelected(null)} aria-label="Fechar">
                ×
              </button>
            </div>

            <div className="mbody">
              <div className="preview">
                {getImagemUrl(selected.imagem) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getImagemUrl(selected.imagem)} alt="preview" />
                ) : (
                  <div className="state">Sem URL</div>
                )}
              </div>

              <div className="details">
                <div className="row">
                  <span className="k">Caminho</span>
                  <span className="v">
                    <code>{selected.imagem}</code>
                  </span>
                </div>

                <div className="row">
                  <span className="k">URL</span>
                  <span className="v">
                    <code>{getImagemUrl(selected.imagem)}</code>
                  </span>
                </div>

                {selected.ordem !== undefined && (
                  <div className="row">
                    <span className="k">Ordem</span>
                    <span className="v">{selected.ordem}</span>
                  </div>
                )}

                {selected.criado && (
                  <div className="row">
                    <span className="k">Criado</span>
                    <span className="v">{selected.criado}</span>
                  </div>
                )}

                {selected.produto_nome && (
                  <div className="row">
                    <span className="k">Produto</span>
                    <span className="v">{selected.produto_nome}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mfoot">
              <button className="btn ghost" onClick={() => setSelected(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .wrap {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
        }

        .title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .badgeIcon {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          box-shadow: 0 8px 18px rgba(124, 58, 237, 0.25);
        }

        h1 {
          font-size: 22px;
          margin: 0;
        }

        p {
          margin: 2px 0 0 0;
          color: #64748b;
          font-size: 13px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          cursor: pointer;
          font-weight: 800;
        }

        .btn.refresh {
          background: #fff;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn.ghost {
          background: rgba(0, 0, 0, 0.04);
        }

        .toolbar {
          display: grid;
          grid-template-columns: 1fr auto auto;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        @media (max-width: 900px) {
          .toolbar {
            grid-template-columns: 1fr;
          }
        }

        .search {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          padding: 10px 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        }

        .search input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
        }

        .clear {
          background: transparent;
          border: none;
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        .toggle {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          padding: 10px 12px;
          font-weight: 800;
          color: #334155;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        }

        .toggle input {
          width: 18px;
          height: 18px;
        }

        .meta {
          display: inline-flex;
          gap: 12px;
          justify-content: flex-end;
          color: #334155;
          font-weight: 700;
        }

        .state {
          padding: 18px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.06);
          color: #64748b;
          font-weight: 800;
        }

        .empty {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 16px;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.03);
          border: 1px solid rgba(0, 0, 0, 0.06);
        }

        .emptyIcon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .muted {
          color: #64748b;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 14px;
        }

        .tile {
          text-align: left;
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          cursor: pointer;
          transition: 0.2s;
          padding: 0;
        }

        .tile:hover {
          transform: translateY(-3px);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.12);
        }

        .thumb {
          height: 150px;
          background: #eef2ff;
          position: relative;
          display: grid;
          place-items: center;
        }

        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .thumb.broken::after {
          content: "Não carregou";
          font-weight: 900;
          color: #334155;
        }

        .flags {
          position: absolute;
          top: 10px;
          left: 10px;
          display: flex;
          gap: 8px;
        }

        .pill {
          font-size: 11px;
          font-weight: 900;
          padding: 6px 10px;
          border-radius: 999px;
          color: #fff;
          background: #64748b;
        }

        .pill.ok {
          background: #22c55e;
        }

        .pill.warn {
          background: #f59e0b;
        }

        .info {
          padding: 12px;
          display: grid;
          gap: 8px;
        }

        .line {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          align-items: baseline;
        }

        .path {
          font-size: 12px;
          color: #334155;
          opacity: 0.85;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .pager {
          display: flex;
          gap: 10px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          padding: 10px 12px;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
        }

        .pbtn {
          border-radius: 12px;
          padding: 10px 12px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #fff;
          cursor: pointer;
          font-weight: 900;
        }

        .pbtn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .pnums {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          flex: 1;
        }

        .pnum {
          min-width: 38px;
          height: 36px;
          padding: 0 10px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: #fff;
          cursor: pointer;
          font-weight: 900;
        }

        .pnum.active {
          background: #7c3aed;
          border-color: #7c3aed;
          color: #fff;
        }

        /* modal */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.55);
          backdrop-filter: blur(3px);
          display: grid;
          place-items: center;
          z-index: 999999;
          padding: 16px;
        }

        .modal {
          width: min(980px, 96vw);
          background: #fff;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
        }

        .mhead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .mtitle {
          display: flex;
          gap: 10px;
          align-items: baseline;
        }

        .mclose {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.03);
          cursor: pointer;
          font-size: 22px;
          line-height: 1;
        }

        .mbody {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 14px;
          padding: 14px;
        }

        @media (max-width: 900px) {
          .mbody {
            grid-template-columns: 1fr;
          }
        }

        .preview {
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #f8fafc;
          height: 420px;
        }

        .preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .details {
          display: grid;
          gap: 10px;
          align-content: start;
        }

        .row {
          display: grid;
          grid-template-columns: 110px 1fr;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(0, 0, 0, 0.02);
        }

        .k {
          font-weight: 900;
          color: #111827;
        }

        .v {
          color: #334155;
          overflow-wrap: anywhere;
        }

        .mfoot {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.7);
        }
      `}</style>
    </div>
  );
}