"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";
import {
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
  FiGrid,
  FiRefreshCw,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiImage,
  FiDollarSign,
  FiBox,
  FiTag,
} from "react-icons/fi";

type Produto = {
  id_produto: number;
  nome: string;
  slug?: string;
  descricao?: string;
  preco?: number | string;
  preco_promocional?: number | string;
  estoque?: number;
  ilimitado?: number;
  imagem?: string;
  categoria_id?: number | null;
  categoria_nome?: string | null;
  statusid?: number | null;
  status_nome?: string | null;
  catalogo?: number;
  destaque?: number | null;
  sku?: string;
  modelo?: string;
};

type Categoria = {
  id_categoria: number;
  nome: string;
};

type AbaModal = "basico" | "precos" | "estoque";

type FormProduto = {
  nome: string;
  descricao: string;
  preco: string;
  preco_promocional: string;
  estoque: string;
  ilimitado: string;
  categoria_id: string;
  sku: string;
  modelo: string;
  destaque: string;
  catalogo: string;
};

const FORM_INICIAL: FormProduto = {
  nome: "",
  descricao: "",
  preco: "",
  preco_promocional: "",
  estoque: "0",
  ilimitado: "0",
  categoria_id: "",
  sku: "",
  modelo: "",
  destaque: "0",
  catalogo: "1",
};

function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  if (payload?.produtos != null) return payload.produtos as T;
  if (payload?.categorias != null) return payload.categorias as T;
  return payload as T;
}

function getImagemUrl(caminho?: string) {
  if (!caminho) return "";
  const base = api.defaults.baseURL || "";

  if (caminho.startsWith("http")) return caminho;

  return `${base.replace(/\/$/, "")}/${String(caminho).replace(/^\/+/, "")}`;
}

function formatMoney(valor?: number | string) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [abaModal, setAbaModal] = useState<AbaModal>("basico");
  const [salvando, setSalvando] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  const [form, setForm] = useState<FormProduto>(FORM_INICIAL);
  const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState("");

  const itensPorPagina = 3;

  async function carregarTudo() {
    try {
      setLoading(true);

      const [resProdutos, resCategorias] = await Promise.all([
        api.get("/produtos"),
        api.get("/categorias"),
      ]);

      const listaProdutos = resolveApi<Produto[]>(resProdutos.data) || [];
      const listaCategorias = resolveApi<Categoria[]>(resCategorias.data) || [];

      setProdutos(Array.isArray(listaProdutos) ? listaProdutos : []);
      setCategorias(Array.isArray(listaCategorias) ? listaCategorias : []);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProdutos([]);
      setCategorias([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, categoriaSelecionada]);

  useEffect(() => {
    if (!modalOpen) return;

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((produto) => {
      const matchBusca =
        !termo ||
        String(produto.nome || "").toLowerCase().includes(termo) ||
        String(produto.descricao || "").toLowerCase().includes(termo) ||
        String(produto.sku || "").toLowerCase().includes(termo) ||
        String(produto.categoria_nome || "").toLowerCase().includes(termo);

      const matchCategoria =
        !categoriaSelecionada ||
        String(produto.categoria_id || "") === categoriaSelecionada ||
        String(produto.categoria_nome || "") === categoriaSelecionada;

      return matchBusca && matchCategoria;
    });
  }, [produtos, busca, categoriaSelecionada]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(produtosFiltrados.length / itensPorPagina)
  );

  const produtosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return produtosFiltrados.slice(inicio, fim);
  }, [produtosFiltrados, paginaAtual]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const paginasVisiveis = useMemo(() => {
    const paginas: number[] = [];

    let inicio = Math.max(1, paginaAtual - 2);
    let fim = Math.min(totalPaginas, paginaAtual + 2);

    if (paginaAtual <= 3) fim = Math.min(totalPaginas, 5);
    if (paginaAtual >= totalPaginas - 2) inicio = Math.max(1, totalPaginas - 4);

    for (let i = inicio; i <= fim; i++) {
      paginas.push(i);
    }

    return paginas;
  }, [paginaAtual, totalPaginas]);

  function irParaPagina(pagina: number) {
    if (pagina < 1 || pagina > totalPaginas) return;
    setPaginaAtual(pagina);
  }

  function abrirNovoModal() {
    setModoEdicao(false);
    setProdutoEditando(null);
    setForm(FORM_INICIAL);
    setImagemArquivo(null);
    setPreviewImagem("");
    setAbaModal("basico");
    setModalOpen(true);
  }

  function abrirEditarModal(produto: Produto) {
    setModoEdicao(true);
    setProdutoEditando(produto);
    setForm({
      nome: String(produto.nome || ""),
      descricao: String(produto.descricao || ""),
      preco: String(produto.preco || ""),
      preco_promocional: String(produto.preco_promocional || ""),
      estoque: String(produto.estoque ?? 0),
      ilimitado: String(produto.ilimitado ?? 0),
      categoria_id: String(produto.categoria_id ?? ""),
      sku: String(produto.sku || ""),
      modelo: String(produto.modelo || ""),
      destaque: String(produto.destaque ?? 0),
      catalogo: String(produto.catalogo ?? 1),
    });
    setImagemArquivo(null);
    setPreviewImagem(produto.imagem ? getImagemUrl(produto.imagem) : "");
    setAbaModal("basico");
    setModalOpen(true);
  }

  function fecharModal() {
    setModalOpen(false);
    setAbaModal("basico");
    setImagemArquivo(null);
    setPreviewImagem("");
    setProdutoEditando(null);
  }

  function atualizarCampo<K extends keyof FormProduto>(
    campo: K,
    valor: FormProduto[K]
  ) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function onSelecionarImagem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setImagemArquivo(file);

    if (file) {
      setPreviewImagem(URL.createObjectURL(file));
    } else if (modoEdicao && produtoEditando?.imagem) {
      setPreviewImagem(getImagemUrl(produtoEditando.imagem));
    } else {
      setPreviewImagem("");
    }
  }

  async function salvarProduto() {
    if (!form.nome.trim()) {
      alert("Preencha o nome do produto.");
      setAbaModal("basico");
      return;
    }

    if (!form.categoria_id) {
      alert("Selecione uma categoria.");
      setAbaModal("basico");
      return;
    }

    if (!form.preco || Number(form.preco) <= 0) {
      alert("Informe um preço válido.");
      setAbaModal("precos");
      return;
    }

    if (form.ilimitado !== "1" && Number(form.estoque || 0) < 0) {
      alert("Informe um estoque válido.");
      setAbaModal("estoque");
      return;
    }

    try {
      setSalvando(true);

      const body = new FormData();
      body.append("nome", form.nome);
      body.append("descricao", form.descricao);
      body.append("preco", form.preco || "0");
      body.append("preco_promocional", form.preco_promocional || "0");
      body.append("estoque", form.ilimitado === "1" ? "0" : form.estoque || "0");
      body.append("ilimitado", form.ilimitado);
      body.append("categoria_id", form.categoria_id);
      body.append("sku", form.sku);
      body.append("modelo", form.modelo);
      body.append("destaque", form.destaque);
      body.append("catalogo", form.catalogo);

      if (imagemArquivo) {
        body.append("imagem", imagemArquivo);
      }

      if (modoEdicao && produtoEditando) {
        await api.put(`/produtos/${produtoEditando.id_produto}`, body, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await api.post("/produtos", body, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      await carregarTudo();
      fecharModal();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          "Erro ao salvar produto."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirProduto(produto: Produto) {
    const confirmar = window.confirm(
      `Deseja excluir o produto "${produto.nome}"?`
    );
    if (!confirmar) return;

    try {
      await api.delete(`/produtos/${produto.id_produto}`);
      await carregarTudo();
    } catch (error: any) {
      console.error("Erro ao excluir produto:", error);
      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          "Erro ao excluir produto."
      );
    }
  }

  return (
    <>
      <div className="produtosPage">
        <section className="hero">
          <div className="heroLeft">
            <div className="heroBadge">
              <FiGrid size={15} />
              Catálogo inteligente
            </div>

            <h1 className="heroTitle">Produtos</h1>

            <p className="heroText">
              Filtre por categoria, pesquise rapidamente, cadastre em modal com
              abas e gerencie os produtos do painel.
            </p>
          </div>

          <div className="heroActions">
            <button
              type="button"
              className="refreshBtn secondary"
              onClick={carregarTudo}
              disabled={loading}
            >
              <FiRefreshCw size={16} />
              Atualizar
            </button>

            <button type="button" className="refreshBtn primary" onClick={abrirNovoModal}>
              <FiPlus size={16} />
              Novo produto
            </button>
          </div>
        </section>

        <section className="filtersBox">
          <div className="inputSearch">
            <FiSearch size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, descrição, SKU ou categoria..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="selectWrap">
            <select
              value={categoriaSelecionada}
              onChange={(e) => setCategoriaSelecionada(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((categoria) => (
                <option key={categoria.id_categoria} value={categoria.id_categoria}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="infoBar">
          <div className="infoCard">
            <span className="infoLabel">Resultados encontrados</span>
            <strong className="infoValue">{produtosFiltrados.length}</strong>
            <small className="infoMeta">
              Página {paginaAtual} de {totalPaginas}
            </small>
          </div>
        </section>

        {loading ? (
          <div className="stateBox">
            <div className="spinner" />
            <p>Carregando produtos...</p>
          </div>
        ) : produtosPaginados.length === 0 ? (
          <div className="stateBox empty">
            <div className="emptyIcon">
              <FiPackage size={26} />
            </div>
            <h3>Nenhum produto encontrado</h3>
            <p>Tente mudar a busca ou selecionar outra categoria.</p>
          </div>
        ) : (
          <>
            <section className="gridProdutos">
              {produtosPaginados.map((produto) => {
                const precoPromocional = Number(produto.preco_promocional || 0);
                const precoNormal = Number(produto.preco || 0);
                const temPromocao =
                  precoPromocional > 0 && precoPromocional < precoNormal;

                const precoFinal = temPromocao ? precoPromocional : precoNormal;
                const imagem = produto.imagem ? getImagemUrl(produto.imagem) : "";

                return (
                  <article key={produto.id_produto} className="cardProduto">
                    <div className="imageLink">
                      {imagem ? (
                        <img
                          src={imagem}
                          alt={produto.nome}
                          className="produtoImagem"
                        />
                      ) : (
                        <div className="produtoSemImagem">
                          <FiPackage size={22} />
                          <span>Sem imagem</span>
                        </div>
                      )}
                    </div>

                    <div className="cardBody">
                      <div className="topInfo">
                        <span className="categoriaTag">
                          {produto.categoria_nome || "Sem categoria"}
                        </span>

                        {produto.destaque ? (
                          <span className="destaqueTag">Destaque</span>
                        ) : null}
                      </div>

                      <h3 className="produtoNome">{produto.nome}</h3>

                      <p className="produtoDescricao">
                        {produto.descricao || "Produto sem descrição cadastrada."}
                      </p>

                      <div className="precoArea">
                        {temPromocao ? (
                          <>
                            <span className="precoAntigo">
                              {formatMoney(precoNormal)}
                            </span>
                            <strong className="precoAtual promo">
                              {formatMoney(precoFinal)}
                            </strong>
                          </>
                        ) : (
                          <strong className="precoAtual">
                            {formatMoney(precoFinal)}
                          </strong>
                        )}
                      </div>

                      <div className="infoRow">
                        <span className="skuText">
                          {produto.sku ? `SKU: ${produto.sku}` : "Sem SKU"}
                        </span>

                        <span className="estoqueText">
                          {Number(produto.ilimitado ?? 0) === 1
                            ? "Estoque ∞"
                            : `Estoque: ${Number(produto.estoque ?? 0)}`}
                        </span>
                      </div>

                      <div className="cardActions">
                        <button
                          type="button"
                          className="actionBtn edit"
                          onClick={() => abrirEditarModal(produto)}
                        >
                          <FiEdit2 size={14} />
                          Editar
                        </button>

                        <button
                          type="button"
                          className="actionBtn delete"
                          onClick={() => excluirProduto(produto)}
                        >
                          <FiTrash2 size={14} />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="pagination">
              <button
                type="button"
                className="pageBtn nav"
                onClick={() => irParaPagina(paginaAtual - 1)}
                disabled={paginaAtual === 1}
              >
                <FiChevronLeft size={16} />
                Anterior
              </button>

              <div className="pageNumbers">
                {paginasVisiveis.map((pagina) => (
                  <button
                    key={pagina}
                    type="button"
                    className={`pageBtn number ${paginaAtual === pagina ? "active" : ""}`}
                    onClick={() => irParaPagina(pagina)}
                  >
                    {pagina}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="pageBtn nav"
                onClick={() => irParaPagina(paginaAtual + 1)}
                disabled={paginaAtual === totalPaginas}
              >
                Próxima
                <FiChevronRight size={16} />
              </button>
            </section>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="modalOverlay" onClick={fecharModal}>
          <div className="modalBox" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div>
                <h2>{modoEdicao ? "Editar produto" : "Cadastrar produto"}</h2>
                <p>
                  Preencha os dados em 3 abas para organizar melhor o cadastro.
                </p>
              </div>

              <button type="button" className="closeBtn" onClick={fecharModal}>
                <FiX size={18} />
              </button>
            </div>

            <div className="tabsRow">
              <button
                type="button"
                className={`tabBtn ${abaModal === "basico" ? "active" : ""}`}
                onClick={() => setAbaModal("basico")}
              >
                <FiTag size={15} />
                Básico
              </button>

              <button
                type="button"
                className={`tabBtn ${abaModal === "precos" ? "active" : ""}`}
                onClick={() => setAbaModal("precos")}
              >
                <FiDollarSign size={15} />
                Preços
              </button>

              <button
                type="button"
                className={`tabBtn ${abaModal === "estoque" ? "active" : ""}`}
                onClick={() => setAbaModal("estoque")}
              >
                <FiBox size={15} />
                Estoque & Imagem
              </button>
            </div>

            <div className="modalBody">
              {abaModal === "basico" && (
                <div className="formGrid">
                  <div className="field col2">
                    <label>Nome do produto</label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => atualizarCampo("nome", e.target.value)}
                      placeholder="Digite o nome do produto"
                    />
                  </div>

                  <div className="field col2">
                    <label>Descrição</label>
                    <textarea
                      value={form.descricao}
                      onChange={(e) => atualizarCampo("descricao", e.target.value)}
                      placeholder="Descrição do produto"
                      rows={4}
                    />
                  </div>

                  <div className="field">
                    <label>Categoria</label>
                    <select
                      value={form.categoria_id}
                      onChange={(e) =>
                        atualizarCampo("categoria_id", e.target.value)
                      }
                    >
                      <option value="">Selecione</option>
                      {categorias.map((categoria) => (
                        <option
                          key={categoria.id_categoria}
                          value={categoria.id_categoria}
                        >
                          {categoria.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label>SKU</label>
                    <input
                      type="text"
                      value={form.sku}
                      onChange={(e) => atualizarCampo("sku", e.target.value)}
                      placeholder="SKU do produto"
                    />
                  </div>

                  <div className="field">
                    <label>Modelo</label>
                    <input
                      type="text"
                      value={form.modelo}
                      onChange={(e) => atualizarCampo("modelo", e.target.value)}
                      placeholder="Modelo"
                    />
                  </div>

                  <div className="field">
                    <label>Catálogo</label>
                    <select
                      value={form.catalogo}
                      onChange={(e) => atualizarCampo("catalogo", e.target.value)}
                    >
                      <option value="1">Visível</option>
                      <option value="0">Oculto</option>
                    </select>
                  </div>
                </div>
              )}

              {abaModal === "precos" && (
                <div className="formGrid">
                  <div className="field">
                    <label>Preço</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.preco}
                      onChange={(e) => atualizarCampo("preco", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="field">
                    <label>Preço promocional</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.preco_promocional}
                      onChange={(e) =>
                        atualizarCampo("preco_promocional", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="field">
                    <label>Destaque</label>
                    <select
                      value={form.destaque}
                      onChange={(e) => atualizarCampo("destaque", e.target.value)}
                    >
                      <option value="0">Não</option>
                      <option value="1">Sim</option>
                    </select>
                  </div>
                </div>
              )}

              {abaModal === "estoque" && (
                <div className="formGrid">
                  <div className="field">
                    <label>Estoque ilimitado</label>
                    <select
                      value={form.ilimitado}
                      onChange={(e) => atualizarCampo("ilimitado", e.target.value)}
                    >
                      <option value="0">Não</option>
                      <option value="1">Sim</option>
                    </select>
                  </div>

                  <div className="field">
                    <label>Quantidade em estoque</label>
                    <input
                      type="number"
                      min="0"
                      value={form.estoque}
                      disabled={form.ilimitado === "1"}
                      onChange={(e) => atualizarCampo("estoque", e.target.value)}
                      placeholder="0"
                    />
                  </div>

                  <div className="field col2">
                    <label>Imagem principal</label>
                    <input type="file" accept="image/*" onChange={onSelecionarImagem} />
                  </div>

                  <div className="field col2">
                    <label>Preview</label>
                    <div className="previewBox">
                      {previewImagem ? (
                        <img
                          src={previewImagem}
                          alt="Preview"
                          className="previewImg"
                        />
                      ) : (
                        <div className="previewEmpty">
                          <FiImage size={22} />
                          <span>Sem imagem selecionada</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modalFooter">
              <button type="button" className="footerBtn light" onClick={fecharModal}>
                Cancelar
              </button>

              <button
                type="button"
                className="footerBtn primary"
                onClick={salvarProduto}
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : modoEdicao
                  ? "Salvar alterações"
                  : "Cadastrar produto"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .produtosPage {
          display: flex;
          flex-direction: column;
          gap: 20px;
          width: 100%;
        }

        .hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 24px;
          border-radius: 26px;
          background:
            radial-gradient(circle at top right, rgba(129, 140, 248, 0.16) 0%, transparent 30%),
            linear-gradient(135deg, #111827 0%, #1f2937 100%);
          color: #fff;
          flex-wrap: wrap;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.14);
        }

        .heroLeft {
          min-width: 0;
        }

        .heroActions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .heroBadge {
          width: fit-content;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 34px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.14);
          font-size: 11px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .heroTitle {
          margin: 0;
          font-size: 30px;
          font-weight: 900;
          line-height: 1.05;
        }

        .heroText {
          margin: 10px 0 0;
          color: rgba(255, 255, 255, 0.78);
          font-size: 14px;
          line-height: 1.7;
          max-width: 600px;
        }

        .refreshBtn {
          border: 0;
          outline: 0;
          min-height: 46px;
          padding: 0 18px;
          border-radius: 15px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.1);
        }

        .refreshBtn.primary {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff;
        }

        .refreshBtn.secondary {
          background: #fff;
          color: #111827;
        }

        .refreshBtn:hover {
          transform: translateY(-1px);
        }

        .refreshBtn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .filtersBox {
          display: grid;
          grid-template-columns: 1.5fr 280px;
          gap: 14px;
        }

        .inputSearch,
        .selectWrap {
          height: 50px;
          border-radius: 16px;
          background: #fff;
          border: 1px solid #e8eaf1;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
        }

        .inputSearch {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 14px;
        }

        .inputSearch input {
          flex: 1;
          border: 0;
          outline: none;
          background: transparent;
          font-size: 14px;
          color: #111827;
        }

        .selectWrap {
          overflow: hidden;
        }

        .selectWrap select {
          width: 100%;
          height: 100%;
          border: 0;
          outline: none;
          background: transparent;
          padding: 0 14px;
          font-size: 14px;
          color: #111827;
          cursor: pointer;
        }

        .infoBar {
          display: block;
        }

        .infoCard {
          background: linear-gradient(135deg, #ffffff 0%, #faf7ff 100%);
          border: 1px solid #ece7f5;
          border-radius: 20px;
          padding: 18px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .infoLabel {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          font-weight: 800;
        }

        .infoValue {
          font-size: 30px;
          font-weight: 900;
          line-height: 1;
          color: #111827;
        }

        .infoMeta {
          font-size: 13px;
          color: #6b7280;
        }

        .stateBox {
          min-height: 260px;
          background: #fff;
          border: 1px solid #ece7f5;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          gap: 12px;
          text-align: center;
          padding: 24px;
        }

        .stateBox h3 {
          margin: 0;
          font-size: 20px;
          color: #111827;
          font-weight: 900;
        }

        .stateBox p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .spinner {
          width: 26px;
          height: 26px;
          border: 3px solid #ddd6fe;
          border-top-color: #7c3aed;
          border-radius: 999px;
          animation: spin 0.8s linear infinite;
        }

        .emptyIcon {
          width: 66px;
          height: 66px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3ecff;
          color: #6d28d9;
        }

        .gridProdutos {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .cardProduto {
          background: linear-gradient(180deg, #ffffff 0%, #fcfcff 100%);
          border: 1px solid #ece7f5;
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: 0.22s ease;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.05);
        }

        .cardProduto:hover {
          transform: translateY(-4px);
          box-shadow: 0 18px 34px rgba(15, 23, 42, 0.09);
        }

        .imageLink {
          display: block;
          width: 100%;
          height: 170px;
          background: #f8fafc;
          overflow: hidden;
        }

        .produtoImagem {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.25s ease;
        }

        .cardProduto:hover .produtoImagem {
          transform: scale(1.03);
        }

        .produtoSemImagem {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #faf7ff 0%, #f3ecff 100%);
          color: #8b5cf6;
          font-size: 13px;
          font-weight: 700;
        }

        .cardBody {
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
        }

        .topInfo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }

        .categoriaTag {
          font-size: 10px;
          font-weight: 800;
          color: #6d28d9;
          background: #f3ecff;
          padding: 5px 9px;
          border-radius: 999px;
          width: fit-content;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .destaqueTag {
          font-size: 10px;
          font-weight: 800;
          color: #92400e;
          background: #fef3c7;
          padding: 5px 9px;
          border-radius: 999px;
          width: fit-content;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .produtoNome {
          margin: 0;
          font-size: 15px;
          font-weight: 900;
          color: #111827;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 42px;
        }

        .produtoDescricao {
          margin: 0;
          font-size: 12px;
          color: #64748b;
          line-height: 1.6;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 39px;
        }

        .precoArea {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .precoAntigo {
          font-size: 11px;
          text-decoration: line-through;
          color: #94a3b8;
          font-weight: 700;
        }

        .precoAtual {
          font-size: 20px;
          font-weight: 900;
          color: #111827;
          line-height: 1.1;
        }

        .precoAtual.promo {
          color: #7c3aed;
        }

        .infoRow {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .skuText,
        .estoqueText {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 700;
        }

        .cardActions {
          margin-top: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .actionBtn {
          min-height: 40px;
          border: 0;
          border-radius: 12px;
          font-weight: 800;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .actionBtn:hover {
          transform: translateY(-1px);
        }

        .actionBtn.edit {
          background: #eff6ff;
          color: #1d4ed8;
        }

        .actionBtn.delete {
          background: #fef2f2;
          color: #dc2626;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 4px;
        }

        .pageNumbers {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .pageBtn {
          border: 0;
          outline: 0;
          min-height: 42px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 800;
          transition: 0.2s ease;
        }

        .pageBtn.nav {
          padding: 0 14px;
          background: #ffffff;
          border: 1px solid #e8eaf1;
          color: #111827;
        }

        .pageBtn.number {
          width: 42px;
          background: #ffffff;
          border: 1px solid #e8eaf1;
          color: #111827;
        }

        .pageBtn.number.active {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 10px 18px rgba(124, 58, 237, 0.22);
        }

        .pageBtn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .pageBtn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.56);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 9999;
        }

        .modalBox {
          width: 100%;
          max-width: 920px;
          max-height: 92vh;
          overflow: auto;
          background: #fff;
          border-radius: 28px;
          border: 1px solid #ece7f5;
          box-shadow: 0 30px 80px rgba(15, 23, 42, 0.24);
        }

        .modalHeader {
          padding: 22px 22px 16px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid #f1edf7;
        }

        .modalHeader h2 {
          margin: 0;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 900;
          color: #111827;
        }

        .modalHeader p {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .closeBtn {
          width: 42px;
          height: 42px;
          border: 0;
          border-radius: 14px;
          background: #f8fafc;
          color: #475569;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }

        .tabsRow {
          display: flex;
          gap: 10px;
          padding: 18px 22px 0;
          flex-wrap: wrap;
        }

        .tabBtn {
          min-height: 42px;
          padding: 0 14px;
          border: 1px solid #e8eaf1;
          border-radius: 14px;
          background: #fff;
          color: #475569;
          font-size: 13px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .tabBtn.active {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff;
          border-color: transparent;
        }

        .modalBody {
          padding: 22px;
        }

        .formGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field.col2 {
          grid-column: span 2;
        }

        .field label {
          font-size: 13px;
          font-weight: 800;
          color: #334155;
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;
          border: 1px solid #dbe1ea;
          outline: none;
          border-radius: 14px;
          background: #fff;
          color: #111827;
          padding: 13px 14px;
          font-size: 14px;
          transition: 0.2s ease;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }

        .field textarea {
          resize: vertical;
          min-height: 110px;
        }

        .previewBox {
          min-height: 220px;
          border: 1px dashed #d7dcea;
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fafcff;
        }

        .previewImg {
          width: 100%;
          height: 220px;
          object-fit: cover;
          display: block;
        }

        .previewEmpty {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
        }

        .modalFooter {
          padding: 0 22px 22px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-wrap: wrap;
        }

        .footerBtn {
          min-height: 46px;
          padding: 0 18px;
          border: 0;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s ease;
        }

        .footerBtn.light {
          background: #f8fafc;
          color: #334155;
        }

        .footerBtn.primary {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: #fff;
        }

        .footerBtn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1024px) {
          .filtersBox {
            grid-template-columns: 1fr;
          }

          .gridProdutos {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 768px) {
          .produtosPage {
            gap: 16px;
          }

          .hero {
            padding: 18px;
            border-radius: 20px;
          }

          .heroTitle {
            font-size: 24px;
          }

          .heroText {
            font-size: 13px;
          }

          .heroActions {
            width: 100%;
          }

          .refreshBtn {
            flex: 1;
          }

          .gridProdutos {
            grid-template-columns: 1fr;
          }

          .imageLink {
            height: 190px;
          }

          .pagination {
            flex-direction: column;
            align-items: stretch;
          }

          .pageNumbers {
            order: 1;
          }

          .pageBtn.nav {
            width: 100%;
          }

          .modalOverlay {
            padding: 10px;
            align-items: flex-end;
          }

          .modalBox {
            max-width: 100%;
            max-height: 96vh;
            border-radius: 22px 22px 0 0;
          }

          .modalHeader,
          .modalBody,
          .modalFooter {
            padding-left: 16px;
            padding-right: 16px;
          }

          .tabsRow {
            padding-left: 16px;
            padding-right: 16px;
          }

          .formGrid {
            grid-template-columns: 1fr;
          }

          .field.col2 {
            grid-column: span 1;
          }

          .modalFooter {
            flex-direction: column-reverse;
          }

          .footerBtn {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
}