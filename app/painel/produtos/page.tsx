"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  FaEdit,
  FaStar,
  FaPlus,
  FaTrash,
  FaBook,
  FaImages,
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
  imagem?: string; // ✅ aqui fica só o caminho do banco (ex: upload/produtos/...)
}

export const getImagemUrl = (caminho?: string) => {
  if (!caminho) return undefined;

  // normaliza (remove \ do Windows e barras no começo)
  let c = String(caminho).trim().replace(/\\/g, "/");
  c = c.replace(/^\/+/, "");

  // se vier "public/upload/..." ou "public/..."
  c = c.replace(/^public\//, "");

  const base = String(api.defaults.baseURL || "").replace(/\/+$/, "");
  return `${base}/${c}`;
};

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalNovoProduto, setModalNovoProduto] = useState(false);

  // ✅ paginação
  const [itensPorPagina, setItensPorPagina] = useState<number>(12);
  const [pagina, setPagina] = useState<number>(1);

  // ✅ modal upload galeria (miniaturas)
  const [galeriaOpen, setGaleriaOpen] = useState(false);
  const [galeriaProduto, setGaleriaProduto] = useState<Produto | null>(null);
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaPreview, setGaleriaPreview] = useState<string[]>([]);
  const [galeriaSending, setGaleriaSending] = useState(false);
  const inputGaleriaRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    carregarProdutos();
  }, []);

  useEffect(() => {
    setPagina(1);
  }, [itensPorPagina]);

  // limpa blob urls do preview ao desmontar
  useEffect(() => {
    return () => {
      galeriaPreview.forEach((u) => URL.revokeObjectURL(u));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);

      const res = await api.get("/admin/produtos");

      let lista = res.data?.dados || res.data;
      if (lista?.dados) lista = lista.dados;
      if (!Array.isArray(lista)) lista = [];

      // ✅ NÃO CONVERTE a imagem aqui (deixa o caminho cru do banco)
      const convertidos: Produto[] = lista.map((p: any) => ({
        ...p,
        preco: Number(p.preco || 0),
        estoque: Number(p.estoque || 0),
        imagem: p.imagem ? String(p.imagem) : undefined,
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
        if (!produto.id_destaque) {
          toast.error("Não foi possível remover: id_destaque ausente.");
          return;
        }

        await api.delete(
          `/admin/produtos/destaques/${produto.id_destaque}/remover`
        );

        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto
              ? { ...i, destaque: false, id_destaque: undefined }
              : i
          )
        );

        toast.success("Removido do destaque");
      } else {
        const res = await api.post("/admin/produtos/destaques/criar", {
          produto_id: produto.id_produto,
        });

        const idDestaque =
          res.data?.id_destaque ??
          res.data?.dados?.id_destaque ??
          res.data?.dados?.id ??
          res.data?.id ??
          undefined;

        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto
              ? { ...i, destaque: true, id_destaque: idDestaque }
              : i
          )
        );

        toast.success("Adicionado ao destaque");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar destaque");
    }
  };

  const toggleCatalogo = async (produto: Produto) => {
    try {
      if (produto.catalogo === 1) {
        await api.put(`/admin/produtos/${produto.id_produto}/catalogo/nao`);

        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto ? { ...i, catalogo: 0 } : i
          )
        );

        toast.success("Removido do catálogo");
      } else {
        await api.put(`/admin/produtos/${produto.id_produto}/catalogo/sim`);

        setProdutos((p) =>
          p.map((i) =>
            i.id_produto === produto.id_produto ? { ...i, catalogo: 1 } : i
          )
        );

        toast.success("Adicionado ao catálogo");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar catálogo");
    }
  };

  const excluirProduto = async (id: number) => {
    if (!confirm("Deseja excluir este produto?")) return;

    try {
      await api.delete(`/admin/produto/${id}/remover`);
      setProdutos((p) => p.filter((i) => i.id_produto !== id));
      toast.success("Produto excluído com sucesso");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir produto");
    }
  };

  // ===== paginação (front) =====
  const totalPaginas = useMemo(() => {
    const total = Math.ceil((produtos?.length || 0) / itensPorPagina);
    return Math.max(total, 1);
  }, [produtos, itensPorPagina]);

  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
    if (pagina < 1) setPagina(1);
  }, [pagina, totalPaginas]);

  const produtosPaginados = useMemo(() => {
    const start = (pagina - 1) * itensPorPagina;
    const end = start + itensPorPagina;
    return produtos.slice(start, end);
  }, [produtos, pagina, itensPorPagina]);

  const paginas = useMemo(() => {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }, [totalPaginas]);

  // ====== GALERIA (miniaturas) ======
  function abrirGaleria(prod: Produto) {
    setGaleriaProduto(prod);
    setGaleriaOpen(true);
    limparGaleriaSelecao();
  }

  function fecharGaleria() {
    setGaleriaOpen(false);
    setGaleriaProduto(null);
    limparGaleriaSelecao();
  }

  function limparGaleriaSelecao() {
    galeriaPreview.forEach((u) => URL.revokeObjectURL(u));
    setGaleriaFiles([]);
    setGaleriaPreview([]);
    if (inputGaleriaRef.current) inputGaleriaRef.current.value = "";
  }

  function onPickGaleria(filesList: FileList | null) {
    if (!filesList) return;

    const files = Array.from(filesList);
    const ok = files.filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f.name));

    if (ok.length === 0) {
      toast.error("Selecione imagens válidas (jpg, png, webp, gif).");
      return;
    }

    const limitadas = ok.slice(0, 12);
    const previews = limitadas.map((f) => URL.createObjectURL(f));

    galeriaPreview.forEach((u) => URL.revokeObjectURL(u));

    setGaleriaFiles(limitadas);
    setGaleriaPreview(previews);
  }

  async function enviarGaleria() {
    if (!galeriaProduto) return;
    if (galeriaFiles.length === 0) {
      toast.info("Selecione pelo menos 1 imagem.");
      return;
    }

    try {
      setGaleriaSending(true);

      // ✅ back deve aceitar: imagens[] (multiple)
      const form = new FormData();
      galeriaFiles.forEach((file) => form.append("imagens[]", file));

      await api.post(`/admin/produto/${galeriaProduto.id_produto}/imagens`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Imagens adicionadas com sucesso!");
      fecharGaleria();
      await carregarProdutos();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar imagens. Verifique a rota do backend.");
    } finally {
      setGaleriaSending(false);
    }
  }

  // fecha modal com ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") fecharGaleria();
    }
    if (galeriaOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galeriaOpen]);

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

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="title">Produtos</h2>
          <p className="text-muted">Gerencie os produtos cadastrados</p>
        </div>

        <div className="top-actions">
          <div className="pagerSelect">
            <span>Por página</span>
            <select
              value={itensPorPagina}
              onChange={(e) => setItensPorPagina(Number(e.target.value))}
            >
              <option value={8}>8</option>
              <option value={12}>12</option>
              <option value={16}>16</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>

          <button className="btn btn-gold" onClick={() => setModalNovoProduto(true)}>
            <FaPlus /> Novo Produto
          </button>
        </div>
      </div>

      {!loading && produtos.length > 0 && totalPaginas > 1 && (
        <div className="pagerBar">
          <div className="pagerInfo">
            Página <b>{pagina}</b> de <b>{totalPaginas}</b> — Total:{" "}
            <b>{produtos.length}</b>
          </div>

          <div className="pagerNumbers" aria-label="Paginação">
            {paginas.map((p) => (
              <button
                key={p}
                type="button"
                className={`pageBtn ${p === pagina ? "active" : ""}`}
                onClick={() => setPagina(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">Carregando produtos...</div>
      ) : (
        <div className="row g-4">
          {produtosPaginados.map((prod) => {
            const urlImg = getImagemUrl(prod.imagem);
            return (
              <div key={prod.id_produto} className="col-xl-3 col-lg-4 col-md-6">
                <div className="produto-card">
                  <div className="card-image">
                    {urlImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={urlImg} alt={prod.nome} />
                    ) : (
                      <div className="no-image">Sem imagem</div>
                    )}

                    <div className="badges">
                      {prod.destaque && (
                        <span className="badge badge-destaque">Destaque</span>
                      )}
                      {prod.catalogo === 1 && (
                        <span className="badge badge-catalogo">Catálogo</span>
                      )}
                    </div>

                    <button
                      type="button"
                      className="btnThumbs"
                      onClick={() => abrirGaleria(prod)}
                      title="Adicionar imagens (miniaturas)"
                    >
                      <FaImages />
                    </button>
                  </div>

                  <div className="card-body">
                    <h6 className="produto-nome">{prod.nome}</h6>

                    <p className="preco">R$ {prod.preco.toFixed(2)}</p>

                    <small className="estoque">Estoque: {prod.estoque}</small>

                    <div className="acoes">
                      <Link href={`/admin/produto/${prod.slug}`} title="Editar">
                        <FaEdit />
                      </Link>

                      <button onClick={() => toggleDestaque(prod)} title="Destaque">
                        <FaStar />
                      </button>

                      <button
                        onClick={() => toggleCatalogo(prod)}
                        title="Catálogo"
                        className={prod.catalogo === 1 ? "catalogo-on" : "catalogo-off"}
                      >
                        <FaBook />
                      </button>

                      <button
                        onClick={() => excluirProduto(prod.id_produto)}
                        className="danger"
                        title="Excluir"
                      >
                        <FaTrash />
                      </button>
                    </div>

                    {/* 🔎 debug opcional: mostra o caminho que vem do banco */}
                    {/* <div style={{ fontSize: 10, opacity: 0.6, marginTop: 8 }}>
                      {prod.imagem}
                    </div> */}
                  </div>
                </div>
              </div>
            );
          })}

          {!produtos.length && (
            <div className="col-12">
              <div className="alert alert-light border">Nenhum produto encontrado</div>
            </div>
          )}
        </div>
      )}

      {/* ✅ MODAL: adicionar miniaturas */}
      {galeriaOpen && (
        <div className="thumbOverlay" onClick={fecharGaleria}>
          <div className="thumbModal" onClick={(e) => e.stopPropagation()}>
            <div className="thumbHeader">
              <div className="thumbTitle">
                <div className="thumbH">Adicionar imagens (miniaturas)</div>
                <div className="thumbSub">
                  Produto: <b>{galeriaProduto?.nome}</b> (#{galeriaProduto?.id_produto})
                </div>
              </div>

              <button
                className="thumbClose"
                type="button"
                onClick={fecharGaleria}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <div className="thumbBody">
              <div className="thumbPick">
                <input
                  ref={inputGaleriaRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => onPickGaleria(e.target.files)}
                />

                <div className="thumbHint">
                  Selecione até <b>12</b> imagens.
                </div>
              </div>

              {galeriaPreview.length > 0 ? (
                <div className="thumbGrid">
                  {galeriaPreview.map((src, idx) => (
                    <div key={src} className="thumbItem">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`preview-${idx}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="thumbEmpty">Nenhuma imagem selecionada ainda.</div>
              )}
            </div>

            <div className="thumbFooter">
              <button className="thumbBtn ghost" type="button" onClick={fecharGaleria}>
                Cancelar
              </button>

              <button
                className="thumbBtn primary"
                type="button"
                onClick={enviarGaleria}
                disabled={galeriaSending || galeriaFiles.length === 0}
              >
                {galeriaSending ? "Enviando..." : "Salvar imagens"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .dashboard-bg {
          background: #f6f7fb;
          min-height: 100vh;
        }

        .title {
          color: #6b4c4f;
          font-weight: 700;
        }

        .btn-gold {
          background: #d4af37;
          color: #fff;
          border: none;
          display: inline-flex;
          gap: 8px;
          align-items: center;
        }

        .top-actions {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .pagerSelect {
          display: flex;
          gap: 10px;
          align-items: center;
          background: #fff;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 999px;
          padding: 10px 12px;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.06);
          color: #6b4c4f;
          font-weight: 700;
          font-size: 12px;
        }

        .pagerSelect select {
          border: 1px solid rgba(0, 0, 0, 0.12);
          border-radius: 999px;
          padding: 6px 10px;
          outline: none;
          background: #fff;
          font-weight: 700;
          cursor: pointer;
        }

        .pagerBar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;

          background: rgba(255, 255, 255, 0.78);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 14px;
          padding: 10px 12px;
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
        }

        .pagerInfo {
          color: #6b4c4f;
          font-size: 13px;
        }

        .pagerNumbers {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: flex-end;
        }

        .pageBtn {
          min-width: 36px;
          height: 34px;
          padding: 0 10px;
          border-radius: 10px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: #fff;
          font-weight: 800;
          color: #6b4c4f;
          cursor: pointer;
          transition: 0.15s;
        }

        .pageBtn:hover {
          transform: translateY(-1px);
          border-color: rgba(0, 0, 0, 0.18);
        }

        .pageBtn.active {
          background: #d4af37;
          border-color: #d4af37;
          color: #fff;
        }

        .produto-card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
          transition: 0.2s;
        }

        .produto-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.12);
        }

        .card-image {
          height: 150px;
          position: relative;
          background: #eee;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .no-image {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }

        .badges {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 6px;
          z-index: 2;
        }

        .badge {
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 999px;
          color: #fff;
        }

        .badge-destaque {
          background: #e74c3c;
        }

        .badge-catalogo {
          background: #22c55e;
        }

        .card-body {
          padding: 12px;
        }

        .produto-nome {
          margin-bottom: 4px;
          font-size: 14px;
        }

        .preco {
          font-weight: 600;
          margin-bottom: 2px;
        }

        .estoque {
          font-size: 12px;
          color: #888;
        }

        .acoes {
          margin-top: 8px;
          display: flex;
          gap: 12px;
          font-size: 16px;
        }

        .acoes button,
        .acoes a {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b4c4f;
          text-decoration: none;
        }

        .acoes .danger {
          color: #e74c3c;
        }

        .catalogo-on {
          color: #22c55e;
        }

        .catalogo-off {
          color: #999;
        }

        .acoes button:hover,
        .acoes a:hover {
          color: #d4af37;
        }

        /* ✅ botão de miniaturas (sobre a imagem) */
        .btnThumbs {
          position: absolute;
          left: 10px;
          bottom: 10px;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: rgba(0, 0, 0, 0.35);
          color: #fff;
          display: grid;
          place-items: center;
          cursor: pointer;
          z-index: 2;
          transition: 0.15s;
          backdrop-filter: blur(6px);
        }
        .btnThumbs:hover {
          transform: translateY(-1px);
          background: rgba(0, 0, 0, 0.48);
        }

        /* ✅ modal galeria */
        .thumbOverlay {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.55);
          backdrop-filter: blur(3px);
          z-index: 999999;
          display: grid;
          place-items: center;
          padding: 16px;
        }

        .thumbModal {
          width: min(720px, 96vw);
          background: #fff;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
          overflow: hidden;
        }

        .thumbHeader {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 14px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          align-items: center;
        }

        .thumbH {
          font-weight: 900;
          color: #111827;
        }

        .thumbSub {
          margin-top: 2px;
          font-size: 12px;
          color: #6b7280;
          font-weight: 700;
        }

        .thumbClose {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.03);
          cursor: pointer;
          font-size: 22px;
          line-height: 1;
        }

        .thumbBody {
          padding: 14px;
          display: grid;
          gap: 12px;
        }

        .thumbPick {
          display: grid;
          gap: 8px;
        }

        .thumbPick input[type="file"] {
          border: 1px dashed rgba(0, 0, 0, 0.18);
          padding: 12px;
          border-radius: 14px;
          background: rgba(0, 0, 0, 0.02);
        }

        .thumbHint {
          font-size: 12px;
          color: #6b7280;
          font-weight: 700;
        }

        .thumbGrid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 10px;
        }

        .thumbItem {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: #f8fafc;
          height: 110px;
        }

        .thumbItem img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .thumbEmpty {
          padding: 14px;
          border-radius: 14px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(0, 0, 0, 0.02);
          font-size: 13px;
          color: #6b7280;
          font-weight: 700;
        }

        .thumbFooter {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 14px;
          border-top: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.7);
        }

        .thumbBtn {
          border-radius: 14px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 900;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .thumbBtn.ghost {
          background: rgba(0, 0, 0, 0.04);
        }

        .thumbBtn.primary {
          background: #d4af37;
          border-color: #d4af37;
          color: #fff;
        }

        .thumbBtn.primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}