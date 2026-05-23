"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Produto = {
  id_produto?: number | string;
  id?: number | string;
  nome?: string;
  slug?: string;
  descricao?: string;
  imagem?: string;
  miniatura?: string;
  preco?: number | string;
  preco_promocional?: number | string | null;
  sku?: string;
  modelo?: string;
  marca?: string;
  categoria_id?: number | string;
  status_id?: number | string;
};

type Categoria = {
  id_categoria?: number | string;
  id?: number | string;
  nome?: string;
};

function extrairListaProdutos(data: any): Produto[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data?.dados?.dados)) return data.dados.dados;
  if (Array.isArray(data?.produtos)) return data.produtos;
  if (Array.isArray(data?.dados?.produtos)) return data.dados.produtos;
  return [];
}

function extrairListaCategorias(data: any): Categoria[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.dados)) return data.dados;
  if (Array.isArray(data?.dados?.dados)) return data.dados.dados;
  if (Array.isArray(data?.categorias)) return data.categorias;
  if (Array.isArray(data?.dados?.categorias)) return data.dados.categorias;
  return [];
}

function formatarPreco(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function resolverImagem(produto: Produto) {
  const imagem = produto.imagem || produto.miniatura || "";
  if (!imagem) return "";

  if (imagem.startsWith("http://") || imagem.startsWith("https://")) {
    return imagem;
  }

  const baseURL = api.defaults.baseURL || "";
  const limpa = imagem.replace(/^\/+/, "");

  if (limpa.startsWith("upload/")) {
    return `${baseURL}/${limpa}`;
  }

  return `${baseURL}/upload/${limpa}`;
}

type EditForm = {
  nome: string;
  sku: string;
  marca: string;
  modelo: string;
  preco: string;
  preco_promocional: string;
  categoria_id: string;
  status_id: string;
  descricao: string;
};

export default function ProdutosListaPage() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [excluindoId, setExcluindoId] = useState<string | number | null>(null);

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(6);

  const [editandoId, setEditandoId] = useState<string | number | null>(null);
  const [salvandoId, setSalvandoId] = useState<string | number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    nome: "",
    sku: "",
    marca: "",
    modelo: "",
    preco: "",
    preco_promocional: "",
    categoria_id: "",
    status_id: "",
    descricao: "",
  });

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, itensPorPagina]);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const [produtosResponse, categoriasResponse] = await Promise.all([
        api.get("/painel/produtos"),
        api.get("/painel/categorias"),
      ]);

      setProdutos(extrairListaProdutos(produtosResponse?.data));
      setCategorias(extrairListaCategorias(categoriasResponse?.data));
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error?.response?.data || error);
      setErro(
        error?.response?.data?.mensagem ||
          "Erro ao carregar produtos e categorias."
      );
    } finally {
      setCarregando(false);
    }
  }

  function getId(produto: Produto) {
    return produto.id_produto ?? produto.id;
  }

  function getCategoriaNome(categoriaId?: string | number) {
    const categoria = categorias.find(
      (c) => String(c.id_categoria ?? c.id) === String(categoriaId)
    );

    return categoria?.nome || "Sem categoria";
  }

  function abrirEdicao(produto: Produto) {
    const id = getId(produto);
    if (!id) return;

    setEditandoId(id);
    setEditForm({
      nome: produto.nome || "",
      sku: produto.sku || "",
      marca: produto.marca || "",
      modelo: produto.modelo || "",
      preco: String(produto.preco ?? ""),
      preco_promocional:
        produto.preco_promocional !== null &&
        produto.preco_promocional !== undefined
          ? String(produto.preco_promocional)
          : "",
      categoria_id: String(produto.categoria_id ?? ""),
      status_id: String(produto.status_id ?? ""),
      descricao: produto.descricao || "",
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setEditForm({
      nome: "",
      sku: "",
      marca: "",
      modelo: "",
      preco: "",
      preco_promocional: "",
      categoria_id: "",
      status_id: "",
      descricao: "",
    });
  }

  async function salvarEdicao(id: number | string) {
    try {
      setSalvandoId(id);

      const payload = {
        nome: editForm.nome.trim(),
        sku: editForm.sku.trim(),
        marca: editForm.marca.trim(),
        modelo: editForm.modelo.trim(),
        preco: editForm.preco,
        preco_promocional: editForm.preco_promocional || null,
        categoria_id: editForm.categoria_id,
        status_id: editForm.status_id,
        descricao: editForm.descricao.trim(),
      };

      await api.put(`/painel/produto/${id}`, payload);

      await carregarDados();
      cancelarEdicao();
    } catch (error: any) {
      console.error("Erro ao salvar edição:", error?.response?.data || error);
      alert(
        error?.response?.data?.mensagem ||
          "Erro ao salvar alterações."
      );
    } finally {
      setSalvandoId(null);
    }
  }

  async function excluirProduto(id: number | string) {
    const confirmar = window.confirm("Deseja excluir este produto?");
    if (!confirmar) return;

    try {
      setExcluindoId(id);

      await api.delete(`/painel/produto/${id}`);

      setProdutos((prev) =>
        prev.filter((produto) => String(getId(produto)) !== String(id))
      );
    } catch (error: any) {
      console.error("Erro ao excluir produto:", error?.response?.data || error);
      alert(
        error?.response?.data?.mensagem ||
          "Erro ao excluir produto."
      );
    } finally {
      setExcluindoId(null);
    }
  }

  const produtosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();

    if (!termo) return produtos;

    return produtos.filter((produto) => {
      const nome = (produto.nome || "").toLowerCase();
      const sku = (produto.sku || "").toLowerCase();
      const marca = (produto.marca || "").toLowerCase();
      const modelo = (produto.modelo || "").toLowerCase();
      const slug = (produto.slug || "").toLowerCase();
      const descricao = (produto.descricao || "").toLowerCase();
      const categoriaNome = getCategoriaNome(produto.categoria_id).toLowerCase();

      return (
        nome.includes(termo) ||
        sku.includes(termo) ||
        marca.includes(termo) ||
        modelo.includes(termo) ||
        slug.includes(termo) ||
        descricao.includes(termo) ||
        categoriaNome.includes(termo)
      );
    });
  }, [produtos, busca, categorias]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(produtosFiltrados.length / itensPorPagina)
  );

  const paginaSegura = Math.min(paginaAtual, totalPaginas);

  const inicio = (paginaSegura - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;

  const produtosPaginados = produtosFiltrados.slice(inicio, fim);

  function irPaginaAnterior() {
    setPaginaAtual((prev) => Math.max(prev - 1, 1));
  }

  function irProximaPagina() {
    setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas));
  }

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1>Produtos</h1>
          <p>
            {produtos.length} produto(s) cadastrados
          </p>
        </div>

        <div className="header-actions">
          <button className="btn secondary" onClick={carregarDados} type="button">
            Atualizar
          </button>

          <Link href="/Admin/produtos/cadastrar" className="btn primary">
            Cadastrar Produto
          </Link>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="text"
          placeholder="Buscar por nome, SKU, marca, modelo, slug ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="search"
        />

        <div className="toolbar-right">
          <label className="select-label">
            Itens por página
            <select
              value={itensPorPagina}
              onChange={(e) => setItensPorPagina(Number(e.target.value))}
              className="select"
            >
              <option value={4}>4</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
            </select>
          </label>

          <div className="counter">
            {produtosFiltrados.length} resultado(s)
          </div>
        </div>
      </div>

      {carregando && <div className="state">Carregando produtos...</div>}

      {!carregando && erro && <div className="state error">{erro}</div>}

      {!carregando && !erro && produtosFiltrados.length === 0 && (
        <div className="state">Nenhum produto encontrado.</div>
      )}

      {!carregando && !erro && produtosFiltrados.length > 0 && (
        <>
          <div className="grid">
            {produtosPaginados.map((produto) => {
              const id = getId(produto);
              const imagemUrl = resolverImagem(produto);
              const precoNormal = Number(produto.preco || 0);
              const precoPromo = produto.preco_promocional
                ? Number(produto.preco_promocional)
                : 0;

              const editando = String(editandoId) === String(id);

              return (
                <div className="card" key={String(id)}>
                  <div className="image-box">
                    {imagemUrl ? (
                      <img
                        src={imagemUrl}
                        alt={produto.nome || "Produto"}
                        className="image"
                        loading="lazy"
                      />
                    ) : (
                      <div className="image-placeholder">
                        <span>Sem imagem</span>
                      </div>
                    )}
                  </div>

                  <div className="content">
                    {editando ? (
                      <>
                        <div className="edit-grid">
                          <label>
                            Nome
                            <input
                              value={editForm.nome}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  nome: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label>
                            SKU
                            <input
                              value={editForm.sku}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  sku: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label>
                            Marca
                            <input
                              value={editForm.marca}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  marca: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label>
                            Modelo
                            <input
                              value={editForm.modelo}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  modelo: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label>
                            Preço
                            <input
                              value={editForm.preco}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  preco: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label>
                            Promoção
                            <input
                              value={editForm.preco_promocional}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  preco_promocional: e.target.value,
                                }))
                              }
                            />
                          </label>

                          <label className="full">
                            Categoria
                            <select
                              value={editForm.categoria_id}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  categoria_id: e.target.value,
                                }))
                              }
                            >
                              <option value="">Selecione</option>
                              {categorias.map((cat) => (
                                <option
                                  key={String(cat.id_categoria ?? cat.id)}
                                  value={String(cat.id_categoria ?? cat.id)}
                                >
                                  {cat.nome}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="full">
                            Status
                            <select
                              value={editForm.status_id}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  status_id: e.target.value,
                                }))
                              }
                            >
                              <option value="">Selecione</option>
                              <option value="1">Ativo</option>
                              <option value="0">Inativo</option>
                            </select>
                          </label>

                          <label className="full">
                            Descrição
                            <textarea
                              rows={4}
                              value={editForm.descricao}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  descricao: e.target.value,
                                }))
                              }
                            />
                          </label>
                        </div>

                        <div className="actions edit-actions">
                          <button
                            className="btn action cancel"
                            type="button"
                            onClick={cancelarEdicao}
                          >
                            Cancelar
                          </button>

                          <button
                            className="btn action save"
                            type="button"
                            onClick={() => salvarEdicao(id!)}
                            disabled={salvandoId === id}
                          >
                            {salvandoId === id ? "Salvando..." : "Salvar"}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="top-line">
                          <span className="badge">ID #{id}</span>
                          <span className="sku">{produto.sku || "Sem SKU"}</span>
                        </div>

                        <h3>{produto.nome || "-"}</h3>

                        <p className="slug">{produto.slug || "-"}</p>

                        <div className="meta">
                          <div>
                            <small>Marca</small>
                            <strong>{produto.marca || "-"}</strong>
                          </div>

                          <div>
                            <small>Modelo</small>
                            <strong>{produto.modelo || "-"}</strong>
                          </div>
                        </div>

                        <div className="category">
                          {getCategoriaNome(produto.categoria_id)}
                        </div>

                        <p className="description">
                          {produto.descricao?.trim() || "Sem descrição cadastrada."}
                        </p>

                        <div className="prices">
                          {precoPromo > 0 ? (
                            <>
                              <span className="old-price">
                                {formatarPreco(precoNormal)}
                              </span>
                              <strong className="price">
                                {formatarPreco(precoPromo)}
                              </strong>
                            </>
                          ) : (
                            <strong className="price">
                              {formatarPreco(precoNormal)}
                            </strong>
                          )}
                        </div>

                        <div className="actions">
                          <button
                            className="btn action view"
                            type="button"
                            onClick={() => router.push(`/Admin/produtos/${id}`)}
                          >
                            Ver
                          </button>

                          <button
                            className="btn action edit"
                            type="button"
                            onClick={() => abrirEdicao(produto)}
                          >
                            Editar
                          </button>

                          <button
                            className="btn action delete"
                            type="button"
                            onClick={() => excluirProduto(id!)}
                            disabled={excluindoId === id}
                          >
                            {excluindoId === id ? "Excluindo..." : "Excluir"}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pagination">
            <button
              type="button"
              className="page-btn"
              onClick={irPaginaAnterior}
              disabled={paginaSegura === 1}
            >
              Anterior
            </button>

            <div className="page-info">
              Página <strong>{paginaSegura}</strong> de{" "}
              <strong>{totalPaginas}</strong>
            </div>

            <button
              type="button"
              className="page-btn"
              onClick={irProximaPagina}
              disabled={paginaSegura === totalPaginas}
            >
              Próxima
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 24px;
          background: #f3f4f6;
          color: #111827;
        }

        .header {
          max-width: 1400px;
          margin: 0 auto 18px auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          background: #111827;
          color: #fff;
          padding: 22px 24px;
          border-radius: 22px;
          box-shadow: 0 16px 40px rgba(17, 24, 39, 0.16);
        }

        .header h1 {
          margin: 0;
          font-size: 2rem;
          line-height: 1.1;
        }

        .header p {
          margin: 8px 0 0;
          color: rgba(255, 255, 255, 0.8);
        }

        .header-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          border: none;
          border-radius: 14px;
          padding: 12px 18px;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s ease;
        }

        .btn.primary {
          background: #7c3aed;
          color: #fff;
        }

        .btn.secondary {
          background: rgba(255, 255, 255, 0.12);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        .toolbar {
          max-width: 1400px;
          margin: 0 auto 20px auto;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }

        .search {
          flex: 1;
          min-width: 280px;
          border: 1px solid #d1d5db;
          border-radius: 16px;
          padding: 15px 18px;
          font-size: 15px;
          outline: none;
          background: #fff;
          box-shadow: 0 10px 25px rgba(17, 24, 39, 0.04);
        }

        .toolbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .select-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 700;
          color: #374151;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 10px 12px;
        }

        .select {
          border: none;
          outline: none;
          background: transparent;
          font-weight: 700;
          color: #111827;
        }

        .counter {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          padding: 12px 14px;
          font-weight: 700;
          color: #374151;
        }

        .state {
          max-width: 1400px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 10px 25px rgba(17, 24, 39, 0.05);
        }

        .state.error {
          color: #b91c1c;
          border-color: #fecaca;
          background: #fff5f5;
        }

        .grid {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .card {
          background: #fff;
          border-radius: 22px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
          box-shadow: 0 14px 34px rgba(17, 24, 39, 0.08);
          display: flex;
          flex-direction: column;
        }

        .image-box {
          height: 240px;
          background: linear-gradient(135deg, #eef2ff, #f5f3ff);
          overflow: hidden;
        }

        .image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-weight: 700;
        }

        .content {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .top-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .badge {
          background: #eef2ff;
          color: #4338ca;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .sku {
          background: #f8fafc;
          color: #6b7280;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 700;
        }

        .content h3 {
          margin: 0;
          font-size: 18px;
          line-height: 1.3;
          color: #111827;
        }

        .slug {
          margin: -4px 0 0;
          color: #6b7280;
          font-size: 13px;
          word-break: break-word;
        }

        .meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .meta > div {
          background: #f8fafc;
          border-radius: 14px;
          padding: 10px;
        }

        .meta small {
          display: block;
          color: #6b7280;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .meta strong {
          color: #111827;
          font-size: 13px;
          word-break: break-word;
        }

        .category {
          width: fit-content;
          background: linear-gradient(135deg, #f5f3ff, #eef2ff);
          color: #4f46e5;
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 700;
        }

        .description {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: #4b5563;
          min-height: 42px;
        }

        .prices {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 2px;
        }

        .old-price {
          color: #9ca3af;
          text-decoration: line-through;
          font-size: 13px;
        }

        .price {
          font-size: 22px;
          color: #111827;
        }

        .actions {
          margin-top: auto;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .btn.action {
          min-height: 44px;
          border-radius: 14px;
          font-weight: 700;
        }

        .view {
          background: rgba(59, 130, 246, 0.12);
          color: #1d4ed8;
        }

        .edit {
          background: rgba(139, 92, 246, 0.12);
          color: #7c3aed;
        }

        .delete {
          background: rgba(239, 68, 68, 0.12);
          color: #b91c1c;
        }

        .delete:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .pagination {
          max-width: 1400px;
          margin: 18px auto 0 auto;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          padding: 14px 16px;
          box-shadow: 0 10px 25px rgba(17, 24, 39, 0.05);
        }

        .page-btn {
          border: none;
          border-radius: 12px;
          padding: 10px 16px;
          font-weight: 700;
          cursor: pointer;
          background: #111827;
          color: #fff;
        }

        .page-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .page-info {
          font-weight: 700;
          color: #374151;
        }

        .edit-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .edit-grid label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          font-weight: 700;
          color: #374151;
        }

        .edit-grid input,
        .edit-grid select,
        .edit-grid textarea {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
          background: #fff;
          color: #111827;
          resize: vertical;
        }

        .edit-grid .full {
          grid-column: 1 / -1;
        }

        .edit-actions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-top: 6px;
        }

        .cancel {
          background: #f3f4f6;
          color: #111827;
        }

        .save {
          background: #16a34a;
          color: #fff;
        }

        @media (max-width: 768px) {
          .page {
            padding: 16px;
          }

          .header {
            padding: 20px;
            border-radius: 18px;
          }

          .header h1 {
            font-size: 1.7rem;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions .btn {
            flex: 1;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .meta {
            grid-template-columns: 1fr;
          }

          .actions {
            grid-template-columns: 1fr;
          }

          .edit-grid {
            grid-template-columns: 1fr;
          }

          .edit-actions {
            grid-template-columns: 1fr;
          }

          .toolbar-right {
            width: 100%;
          }

          .select-label,
          .counter {
            width: 100%;
            justify-content: space-between;
          }

          .pagination {
            flex-direction: column;
          }

          .page-btn,
          .page-info {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}