"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/site/menu/navbar";
import api from "@/Api/conectar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  FaBoxOpen,
  FaPlus,
  FaTag,
  FaLayerGroup,
  FaStar,
  FaTrash,
  FaImage,
  FaMoneyBillWave,
  FaWarehouse,
} from "react-icons/fa";

type Produto = {
  id_produto: number;
  nome: string;
  slug: string;
  descricao?: string;
  preco?: number | string;
  estoque?: number;
  imagem?: string;
  categoria_id?: number | null;
  categoria_nome?: string | null;
  statusid?: number | null;
  catalogo?: number;
  destaque?: number | boolean;
  criado?: string;
  atualizado?: string;
};

type Categoria = {
  id_categoria: number;
  nome: string;
  icone?: string;
  statusid?: number;
};

type Status = {
  id_status: number;
  nome?: string;
  titulo?: string;
  codigo?: string;
};

type NovoProdutoModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  categorias: Categoria[];
  statusList: Status[];
};

function getImagemUrl(caminho?: string) {
  if (!caminho) return "";
  const base = api.defaults.baseURL || "";
  const clean = String(caminho).replace(/^\/+/, "");
  const baseFinal = base.endsWith("/") ? base.slice(0, -1) : base;
  return `${baseFinal}/${clean}`;
}

function formatMoney(valor: number | string | undefined) {
  const n = Number(valor || 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function NovoProdutoModal({
  open,
  onClose,
  onCreated,
  categorias,
  statusList,
}: NovoProdutoModalProps) {
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [catalogo, setCatalogo] = useState(true);
  const [imagem, setImagem] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!open) return;
    setNome("");
    setSlug("");
    setDescricao("");
    setPreco("");
    setEstoque("");
    setCategoriaId("");
    setStatusId("");
    setCatalogo(true);
    setImagem(null);
    setPreview("");
  }, [open]);

  useEffect(() => {
    if (!imagem) {
      setPreview("");
      return;
    }

    const url = URL.createObjectURL(imagem);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [imagem]);

  useEffect(() => {
    if (!slug.trim() && nome.trim()) {
      setSlug(slugify(nome));
    }
  }, [nome, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("Informe o nome do produto");
      return;
    }

    if (!preco.trim()) {
      toast.error("Informe o preço");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("nome", nome.trim());
      formData.append("slug", slug.trim() || slugify(nome));
      formData.append("descricao", descricao.trim());
      formData.append("preco", String(preco).replace(",", "."));
      formData.append("estoque", estoque ? String(estoque) : "0");
      formData.append("catalogo", catalogo ? "1" : "0");

      if (categoriaId) {
        formData.append("categoria_id", categoriaId);
      }

      if (statusId) {
        formData.append("statusid", statusId);
      }

      if (imagem) {
        formData.append("imagem", imagem);
      }

      await api.post("/admin/produto/criar", formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Produto cadastrado com sucesso");
      onClose();
      onCreated();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.mensagem || "Erro ao cadastrar produto"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop-custom" onClick={onClose} />
      <div className="modal-wrap-custom">
        <div className="modal-card-custom">
          <div className="modal-header-custom">
            <div>
              <h3 className="mb-1">Cadastrar produto</h3>
              <p className="mb-0 text-muted">
                Preencha os dados do novo produto
              </p>
            </div>

            <button
              type="button"
              className="btn-close-custom"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-body-custom">
            <div className="row g-3">
              <div className="col-md-8">
                <label className="form-label fw-semibold">Nome</label>
                <input
                  className="form-control form-control-lg"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Cesta romântica premium"
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Estoque</label>
                <input
                  type="number"
                  min="0"
                  className="form-control form-control-lg"
                  value={estoque}
                  onChange={(e) => setEstoque(e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Slug</label>
                <input
                  className="form-control"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value))}
                  placeholder="slug-do-produto"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Preço</label>
                <input
                  className="form-control"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="99.90"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Categoria</label>
                <select
                  className="form-select"
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.id_categoria}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={statusId}
                  onChange={(e) => setStatusId(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {statusList.map((st, index) => (
                    <option
                      key={st.id_status ?? index}
                      value={st.id_status}
                    >
                      {st.nome || st.titulo || st.codigo || `Status ${st.id_status}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Descrição</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição do produto"
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Imagem principal</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) => setImagem(e.target.files?.[0] || null)}
                />
                <small className="text-muted d-block mt-2">
                  Essa imagem já funciona com sua rota atual.
                </small>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold d-block">
                  Prévia
                </label>

                <div className="preview-box">
                  {preview ? (
                    <img src={preview} alt="Preview" className="preview-image" />
                  ) : (
                    <div className="preview-empty">
                      <FaImage size={24} />
                      <span>Sem imagem selecionada</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-12">
                <div className="form-check form-switch">
                  <input
                    id="catalogo"
                    className="form-check-input"
                    type="checkbox"
                    checked={catalogo}
                    onChange={(e) => setCatalogo(e.target.checked)}
                  />
                  <label htmlFor="catalogo" className="form-check-label fw-semibold">
                    Marcar produto no catálogo
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer-custom">
              <button
                type="button"
                className="btn btn-light btn-lg"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="btn btn-gold btn-lg"
                disabled={loading}
              >
                {loading ? "Cadastrando..." : "Cadastrar produto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function ProdutosAdminPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  const carregarTudo = async () => {
    try {
      setLoading(true);

      const [prodRes, catRes, statusRes] = await Promise.all([
        api.get("/admin/produtos", { withCredentials: true }),
        api.get("/admin/categorias", { withCredentials: true }),
        api.get("/admin/produtos/status", { withCredentials: true }),
      ]);

      const produtosData = prodRes?.data?.dados || prodRes?.data || [];
      const categoriasData =
        catRes?.data?.dados || catRes?.data?.categorias || catRes?.data || [];
      const statusData = statusRes?.data?.dados || statusRes?.data || [];

      setProdutos(Array.isArray(produtosData) ? produtosData : []);
      setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
      setStatusList(Array.isArray(statusData) ? statusData : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const matchBusca =
        !busca.trim() ||
        String(produto.nome || "")
          .toLowerCase()
          .includes(busca.toLowerCase()) ||
        String(produto.slug || "")
          .toLowerCase()
          .includes(busca.toLowerCase()) ||
        String(produto.categoria_nome || "")
          .toLowerCase()
          .includes(busca.toLowerCase());

      const matchCategoria =
        !categoriaFiltro ||
        String(produto.categoria_nome || "") === categoriaFiltro;

      return matchBusca && matchCategoria;
    });
  }, [produtos, busca, categoriaFiltro]);

  const removerProduto = async (id: number) => {
    const ok = window.confirm("Deseja realmente remover este produto?");
    if (!ok) return;

    try {
      await api.delete(`/admin/produto/${id}/remover`, {
        withCredentials: true,
      });

      toast.success("Produto removido com sucesso");
      carregarTudo();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.mensagem || "Erro ao remover produto"
      );
    }
  };

  return (
    <>
      <Navbar />
      <ToastContainer position="top-right" />

      <div className="produtos-admin-page">
        <div className="container py-4 py-md-5">
          <div className="hero-admin mb-4">
            <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
              <div>
                <div className="hero-badge">
                  <FaBoxOpen />
                  Painel de Produtos
                </div>
                <h1 className="hero-title mt-3 mb-2">Gerenciar produtos</h1>
                <p className="hero-subtitle mb-0">
                  Liste, filtre e cadastre produtos com visual profissional.
                </p>
              </div>

              <button
                className="btn btn-gold btn-lg btn-add-product"
                onClick={() => setModalOpen(true)}
              >
                <FaPlus className="me-2" />
                Novo produto
              </button>
            </div>
          </div>

          <div className="stats-grid mb-4">
            <div className="stat-card">
              <div className="stat-icon">
                <FaBoxOpen />
              </div>
              <div>
                <div className="stat-number">{produtos.length}</div>
                <div className="stat-label">Produtos</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaLayerGroup />
              </div>
              <div>
                <div className="stat-number">{categorias.length}</div>
                <div className="stat-label">Categorias</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaStar />
              </div>
              <div>
                <div className="stat-number">
                  {produtos.filter((p) => Boolean(p.destaque)).length}
                </div>
                <div className="stat-label">Destaques</div>
              </div>
            </div>
          </div>

          <div className="filters-card mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-md-8">
                <label className="form-label fw-semibold">Buscar produto</label>
                <input
                  className="form-control form-control-lg"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Digite nome, slug ou categoria..."
                />
              </div>

              <div className="col-md-4">
                <label className="form-label fw-semibold">Filtrar categoria</label>
                <select
                  className="form-select form-select-lg"
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                >
                  <option value="">Todas</option>
                  {categorias.map((cat) => (
                    <option key={cat.id_categoria} value={cat.nome}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">
              <h4>Carregando produtos...</h4>
              <p className="text-muted mb-0">Aguarde um momento.</p>
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="empty-state">
              <h4>Nenhum produto encontrado</h4>
              <p className="text-muted">
                Ajuste os filtros ou cadastre um novo produto.
              </p>
              <button
                className="btn btn-gold"
                onClick={() => setModalOpen(true)}
              >
                <FaPlus className="me-2" />
                Cadastrar agora
              </button>
            </div>
          ) : (
            <div className="row g-4">
              {produtosFiltrados.map((produto) => (
                <div key={produto.id_produto} className="col-sm-6 col-lg-4 col-xl-3">
                  <div className="produto-card h-100">
                    <div className="produto-image-wrap">
                      {produto.imagem ? (
                        <img
                          src={getImagemUrl(produto.imagem)}
                          alt={produto.nome}
                          className="produto-image"
                        />
                      ) : (
                        <div className="produto-no-image">
                          <FaImage size={26} />
                          <span>Sem imagem</span>
                        </div>
                      )}

                      {produto.destaque ? (
                        <div className="badge-top badge-highlight">
                          <FaStar className="me-1" />
                          Destaque
                        </div>
                      ) : null}

                      {produto.catalogo ? (
                        <div className="badge-top badge-catalogo second">
                          Catálogo
                        </div>
                      ) : null}
                    </div>

                    <div className="produto-body">
                      <div className="produto-category">
                        <FaTag className="me-1" />
                        {produto.categoria_nome || "Sem categoria"}
                      </div>

                      <h5 className="produto-title">{produto.nome}</h5>

                      <p className="produto-desc">
                        {produto.descricao
                          ? produto.descricao.length > 80
                            ? `${produto.descricao.slice(0, 80)}...`
                            : produto.descricao
                          : "Produto sem descrição cadastrada."}
                      </p>

                      <div className="produto-infos">
                        <div className="info-line">
                          <FaMoneyBillWave className="info-line-icon" />
                          <span>{formatMoney(produto.preco)}</span>
                        </div>

                        <div className="info-line">
                          <FaWarehouse className="info-line-icon" />
                          <span>Estoque: {produto.estoque ?? 0}</span>
                        </div>
                      </div>

                      <div className="produto-footer">
                        <span className="produto-slug">
                          /produto/{produto.slug}
                        </span>

                        <button
                          className="btn btn-remove"
                          onClick={() => removerProduto(produto.id_produto)}
                        >
                          <FaTrash className="me-2" />
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <NovoProdutoModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={carregarTudo}
          categorias={categorias}
          statusList={statusList}
        />
      </div>

      <style jsx>{`
        .produtos-admin-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top right, rgba(214, 162, 74, 0.08), transparent 24%),
            linear-gradient(180deg, #f8f4ee 0%, #f5efe7 100%);
        }

        .hero-admin {
          background: linear-gradient(135deg, #2b2b2b 0%, #44342a 100%);
          border-radius: 24px;
          padding: 24px;
          color: #fff;
          box-shadow: 0 22px 50px rgba(0, 0, 0, 0.12);
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.14);
          font-size: 13px;
          font-weight: 700;
        }

        .hero-title {
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 900;
          letter-spacing: -0.4px;
        }

        .hero-subtitle {
          color: rgba(255,255,255,0.78);
          font-size: 15px;
        }

        .btn-gold {
          background: linear-gradient(135deg, #d6a24a 0%, #bb8330 100%);
          border: none;
          color: #fff;
          font-weight: 800;
          border-radius: 14px;
          box-shadow: 0 12px 24px rgba(214, 162, 74, 0.25);
        }

        .btn-gold:hover {
          color: #fff;
          transform: translateY(-1px);
        }

        .btn-add-product {
          min-width: 210px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .stat-card {
          background: rgba(255,255,255,0.86);
          border: 1px solid rgba(43,43,43,0.07);
          border-radius: 20px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 10px 24px rgba(0,0,0,0.05);
        }

        .stat-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: rgba(214, 162, 74, 0.14);
          color: #d6a24a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .stat-number {
          font-size: 28px;
          font-weight: 900;
          line-height: 1;
          color: #2b2b2b;
        }

        .stat-label {
          font-size: 14px;
          color: #6c757d;
          font-weight: 700;
          margin-top: 4px;
        }

        .filters-card {
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(43,43,43,0.07);
          border-radius: 22px;
          padding: 20px;
          box-shadow: 0 10px 24px rgba(0,0,0,0.04);
        }

        .produto-card {
          background: rgba(255,255,255,0.94);
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid rgba(43,43,43,0.07);
          box-shadow: 0 14px 28px rgba(0,0,0,0.05);
          transition: transform .16s ease, box-shadow .16s ease;
        }

        .produto-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 34px rgba(0,0,0,0.08);
        }

        .produto-image-wrap {
          position: relative;
          height: 220px;
          background: linear-gradient(180deg, #f6efe3, #fff);
          overflow: hidden;
        }

        .produto-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .produto-no-image {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
          justify-content: center;
          color: #b28a47;
          background: linear-gradient(180deg, #fbf6ee, #f4ece2);
          font-weight: 700;
        }

        .badge-top {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 7px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          color: #fff;
        }

        .badge-highlight {
          background: linear-gradient(135deg, #e6ad45, #c98525);
        }

        .badge-catalogo {
          background: rgba(43,43,43,0.86);
        }

        .badge-catalogo.second {
          left: auto;
          right: 12px;
        }

        .produto-body {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .produto-category {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          width: fit-content;
          background: rgba(214, 162, 74, 0.10);
          color: #b98731;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
        }

        .produto-title {
          margin: 0;
          font-weight: 900;
          font-size: 18px;
          color: #2b2b2b;
          min-height: 44px;
        }

        .produto-desc {
          margin: 0;
          color: #6c757d;
          font-size: 14px;
          min-height: 42px;
        }

        .produto-infos {
          display: grid;
          gap: 8px;
        }

        .info-line {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #3d3d3d;
          font-weight: 700;
        }

        .info-line-icon {
          color: #d6a24a;
        }

        .produto-footer {
          margin-top: auto;
          display: grid;
          gap: 12px;
        }

        .produto-slug {
          display: block;
          font-size: 12px;
          color: #8c8c8c;
          background: #f8f8f8;
          padding: 8px 10px;
          border-radius: 10px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .btn-remove {
          width: 100%;
          border: 1px solid rgba(181, 71, 71, 0.18);
          background: rgba(181, 71, 71, 0.08);
          color: #b54747;
          font-weight: 800;
          border-radius: 12px;
          padding: 10px 14px;
        }

        .empty-state {
          background: rgba(255,255,255,0.86);
          border-radius: 24px;
          padding: 48px 24px;
          text-align: center;
          border: 1px solid rgba(43,43,43,0.07);
          box-shadow: 0 10px 24px rgba(0,0,0,0.04);
        }

        .modal-backdrop-custom {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.46);
          backdrop-filter: blur(3px);
          z-index: 1050;
        }

        .modal-wrap-custom {
          position: fixed;
          inset: 0;
          z-index: 1051;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }

        .modal-card-custom {
          width: min(880px, 100%);
          max-height: 92vh;
          overflow: auto;
          background: #fff;
          border-radius: 24px;
          box-shadow: 0 30px 70px rgba(0,0,0,0.18);
          border: 1px solid rgba(43,43,43,0.08);
        }

        .modal-header-custom {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 22px 14px;
          border-bottom: 1px solid rgba(43,43,43,0.07);
        }

        .btn-close-custom {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(43,43,43,0.08);
          background: #fff;
          font-size: 24px;
          line-height: 1;
        }

        .modal-body-custom {
          padding: 20px 22px 22px;
        }

        .modal-footer-custom {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 20px;
        }

        .preview-box {
          min-height: 180px;
          border: 1px dashed rgba(43,43,43,0.16);
          border-radius: 18px;
          overflow: hidden;
          background: #faf7f2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .preview-image {
          width: 100%;
          height: 180px;
          object-fit: cover;
          display: block;
        }

        .preview-empty {
          min-height: 180px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: center;
          justify-content: center;
          color: #9a7c46;
          font-weight: 700;
        }

        @media (max-width: 991px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}