"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import api from "@/Api/conectar";

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

type Status = {
  id_status?: number;
  id?: number;
  nome?: string;
  titulo?: string;
  codigo?: string;
};

type ProdutoImagem = {
  id_imagem?: number;
  imagem: string;
  ordem?: number;
};

type ProdutoForm = {
  nome: string;
  slug: string;
  descricao: string;
  preco: string;
  preco_promocional: string;
  estoque: string;
  ilimitado: boolean;
  categoria_id: string;
  statusid: string;
  catalogo: boolean;
  sku: string;
  modelo: string;
  imagem: File | null;
};

type ProdutoTab = "geral" | "preco" | "midia";

function resolveApi<T>(payload: any): T {
  if (payload?.dados != null) return payload.dados as T;
  if (payload?.data != null) return payload.data as T;
  if (payload?.produtos != null) return payload.produtos as T;
  if (payload?.categorias != null) return payload.categorias as T;
  if (payload?.imagens != null) return payload.imagens as T;
  return payload as T;
}

function getImagemUrl(caminho?: string) {
  if (!caminho) return "";
  const base = api.defaults.baseURL || "";
  if (caminho.startsWith("http")) return caminho;
  return `${base.replace(/\/$/, "")}/${String(caminho).replace(/^\/+/, "")}`;
}

function formatMoney(value: number | string | undefined) {
  const n = Number(value || 0);
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\\s-]/g, "")
    .trim()
    .replace(/\\s+/g, "-")
    .replace(/-+/g, "-");
}

function emptyForm(): ProdutoForm {
  return {
    nome: "",
    slug: "",
    descricao: "",
    preco: "",
    preco_promocional: "",
    estoque: "0",
    ilimitado: false,
    categoria_id: "",
    statusid: "",
    catalogo: true,
    sku: "",
    modelo: "",
    imagem: null,
  };
}

function ModalBase({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="painel-modal-overlay" onClick={onClose}>
      <div className="painel-modal-wrapper">
        <div className="painel-modal-card" onClick={(e) => e.stopPropagation()}>
          <div className="painel-modal-header">
            <div>
              <h2>{title}</h2>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>

            <button type="button" className="painel-modal-close" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="painel-modal-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`painel-tab-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function ProdutosPainelPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 5;

  const [modalProdutoOpen, setModalProdutoOpen] = useState(false);
  const [modalImagemOpen, setModalImagemOpen] = useState(false);

  const [salvandoProduto, setSalvandoProduto] = useState(false);
  const [enviandoImagens, setEnviandoImagens] = useState(false);

  const [modoEdicao, setModoEdicao] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [produtoImagemAtual, setProdutoImagemAtual] = useState<Produto | null>(null);

  const [form, setForm] = useState<ProdutoForm>(emptyForm());
  const [previewImagem, setPreviewImagem] = useState("");
  const [produtoTab, setProdutoTab] = useState<ProdutoTab>("geral");

  const [galeria, setGaleria] = useState<ProdutoImagem[]>([]);
  const [novasImagens, setNovasImagens] = useState<File[]>([]);
  const [erroImagem, setErroImagem] = useState("");

  async function carregarTudo() {
    try {
      setLoading(true);

      const [resProdutos, resCategorias, resStatus] = await Promise.all([
        api.get("/admin/produtos", { withCredentials: true }),
        api.get("/admin/categorias", { withCredentials: true }),
        api.get("/admin/produtos/status", { withCredentials: true }),
      ]);

      const listaProdutos = resolveApi<Produto[]>(resProdutos.data) || [];
      const listaCategorias = resolveApi<Categoria[]>(resCategorias.data) || [];
      const listaStatus = resolveApi<Status[]>(resStatus.data) || [];

      setProdutos(Array.isArray(listaProdutos) ? listaProdutos : []);
      setCategorias(Array.isArray(listaCategorias) ? listaCategorias : []);
      setStatusList(Array.isArray(listaStatus) ? listaStatus : []);
    } catch (error) {
      console.error(error);
      alert("Erro ao carregar produtos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarTudo();
  }, []);

  useEffect(() => {
    document.body.style.overflow = modalProdutoOpen || modalImagemOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalProdutoOpen, modalImagemOpen]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, categoriaFiltro]);

  useEffect(() => {
    if (!form.imagem) {
      setPreviewImagem(
        modoEdicao && produtoEditando?.imagem ? getImagemUrl(produtoEditando.imagem) : ""
      );
      return;
    }

    const url = URL.createObjectURL(form.imagem);
    setPreviewImagem(url);
    return () => URL.revokeObjectURL(url);
  }, [form.imagem, modoEdicao, produtoEditando]);

  const produtosFiltrados = useMemo(() => {
    return produtos.filter((produto) => {
      const termo = busca.trim().toLowerCase();

      const matchBusca =
        !termo ||
        String(produto.nome || "").toLowerCase().includes(termo) ||
        String(produto.slug || "").toLowerCase().includes(termo) ||
        String(produto.categoria_nome || "").toLowerCase().includes(termo) ||
        String(produto.sku || "").toLowerCase().includes(termo);

      const matchCategoria =
        !categoriaFiltro ||
        String(produto.categoria_nome || "") === categoriaFiltro ||
        String(produto.categoria_id || "") === categoriaFiltro;

      return matchBusca && matchCategoria;
    });
  }, [produtos, busca, categoriaFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(produtosFiltrados.length / itensPorPagina));

  const produtosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return produtosFiltrados.slice(inicio, fim);
  }, [produtosFiltrados, paginaAtual]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) setPaginaAtual(totalPaginas);
  }, [paginaAtual, totalPaginas]);

  function handleChange<K extends keyof ProdutoForm>(campo: K, valor: ProdutoForm[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function handleNomeChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      nome: value,
      slug: prev.slug ? prev.slug : slugify(value),
    }));
  }

  function abrirModalCriar() {
    setModoEdicao(false);
    setProdutoEditando(null);
    setForm(emptyForm());
    setPreviewImagem("");
    setProdutoTab("geral");
    setModalProdutoOpen(true);
  }

  function abrirModalEditar(produto: Produto) {
    setModoEdicao(true);
    setProdutoEditando(produto);
    setForm({
      nome: produto.nome || "",
      slug: produto.slug || "",
      descricao: produto.descricao || "",
      preco: String(produto.preco ?? ""),
      preco_promocional: String(produto.preco_promocional ?? ""),
      estoque: String(produto.estoque ?? 0),
      ilimitado: Number(produto.ilimitado ?? 0) === 1,
      categoria_id: produto.categoria_id ? String(produto.categoria_id) : "",
      statusid: produto.statusid ? String(produto.statusid) : "",
      catalogo: Number(produto.catalogo ?? 0) === 1,
      sku: produto.sku || "",
      modelo: produto.modelo || "",
      imagem: null,
    });
    setPreviewImagem(getImagemUrl(produto.imagem));
    setProdutoTab("geral");
    setModalProdutoOpen(true);
  }

  function fecharModalProduto() {
    setModalProdutoOpen(false);
    setModoEdicao(false);
    setProdutoEditando(null);
    setForm(emptyForm());
    setPreviewImagem("");
    setProdutoTab("geral");
  }

  async function abrirModalImagens(produto: Produto) {
    setProdutoImagemAtual(produto);
    setModalImagemOpen(true);
    setGaleria([]);
    setNovasImagens([]);
    setErroImagem("");

    try {
      const res = await api.get(`/admin/produto/${produto.id_produto}/imagens`, {
        withCredentials: true,
      });

      const payload = res.data;
      const imagens = resolveApi<any>(payload);
      const lista = Array.isArray(imagens?.imagens)
        ? imagens.imagens
        : Array.isArray(payload?.imagens)
        ? payload.imagens
        : [];

      setGaleria(lista);
    } catch (error) {
      console.error(error);
      setErroImagem("Não foi possível carregar as imagens do produto.");
    }
  }

  function fecharModalImagens() {
    setModalImagemOpen(false);
    setProdutoImagemAtual(null);
    setGaleria([]);
    setNovasImagens([]);
    setErroImagem("");
  }

  async function salvarProduto(e: FormEvent) {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome do produto.");
      return;
    }

    if (!form.preco.trim()) {
      alert("Informe o preço.");
      return;
    }

    try {
      setSalvandoProduto(true);

      const body = new FormData();
      body.append("nome", form.nome.trim());
      body.append("slug", form.slug.trim() || slugify(form.nome));
      body.append("descricao", form.descricao.trim());
      body.append("preco", String(form.preco).replace(",", "."));
      body.append("preco_promocional", String(form.preco_promocional || "").replace(",", "."));
      body.append("estoque", form.estoque || "0");
      body.append("ilimitado", form.ilimitado ? "1" : "0");
      body.append("catalogo", form.catalogo ? "1" : "0");
      body.append("sku", form.sku.trim());
      body.append("modelo", form.modelo.trim());

      if (form.categoria_id) body.append("categoria_id", form.categoria_id);
      if (form.statusid) body.append("statusid", form.statusid);
      if (form.imagem) body.append("imagem", form.imagem);

      if (modoEdicao && produtoEditando) {
        await api.post(`/admin/produto/${produtoEditando.id_produto}/atualizar`, body, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/admin/produto/criar", body, {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      fecharModalProduto();
      await carregarTudo();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Erro ao salvar produto."
      );
    } finally {
      setSalvandoProduto(false);
    }
  }

  async function excluirProduto(produto: Produto) {
    const ok = window.confirm(`Deseja excluir o produto "${produto.nome}"?`);
    if (!ok) return;

    try {
      await api.delete(`/admin/produto/${produto.id_produto}/remover`, {
        withCredentials: true,
      });
      await carregarTudo();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Erro ao excluir produto."
      );
    }
  }

  async function enviarImagens() {
    if (!produtoImagemAtual) return;
    if (!novasImagens.length) {
      alert("Selecione pelo menos uma imagem.");
      return;
    }

    try {
      setEnviandoImagens(true);

      const body = new FormData();
      novasImagens.forEach((file) => body.append("imagens[]", file));

      await api.post(`/admin/produto/${produtoImagemAtual.id_produto}/imagens`, body, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      await abrirModalImagens(produtoImagemAtual);
      await carregarTudo();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Erro ao enviar imagens."
      );
    } finally {
      setEnviandoImagens(false);
    }
  }

  async function removerImagem(idImagem?: number) {
    if (!idImagem) return;
    const ok = window.confirm("Deseja remover esta imagem?");
    if (!ok) return;

    try {
      await api.delete(`/admin/produto/imagem/${idImagem}/remover`, {
        withCredentials: true,
      });

      if (produtoImagemAtual) {
        await abrirModalImagens(produtoImagemAtual);
        await carregarTudo();
      }
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Erro ao remover imagem."
      );
    }
  }

  async function definirPrincipal(imagem: string) {
    if (!produtoImagemAtual) return;

    try {
      await api.put(
        `/admin/produto/${produtoImagemAtual.id_produto}/imagem/principal`,
        { imagem },
        { withCredentials: true }
      );

      await abrirModalImagens(produtoImagemAtual);
      await carregarTudo();
    } catch (error: any) {
      console.error(error);
      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Erro ao definir imagem principal."
      );
    }
  }

  return (
    <>
      <div className="painel-produtos-page">
        <section className="painel-produtos-hero">
          <div>
            <span className="painel-produtos-badge-top">Painel • Catálogo</span>
            <h1>Produtos</h1>
            <p>
              Cadastre, edite, organize imagens e mantenha seu catálogo com aparência profissional.
            </p>
          </div>

          <button type="button" className="btn-primary-ui" onClick={abrirModalCriar}>
            + Novo produto
          </button>
        </section>

        <section className="painel-produtos-filtros">
          <input
            className="painel-input"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, slug, SKU ou categoria..."
          />

          <select
            className="painel-input"
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categorias.map((cat) => (
              <option key={cat.id_categoria} value={cat.nome}>
                {cat.nome}
              </option>
            ))}
          </select>

          <div className="painel-select-group">
            <label>Página</label>
            <select
              className="painel-input"
              value={paginaAtual}
              onChange={(e) => setPaginaAtual(Number(e.target.value))}
            >
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                <option key={pagina} value={pagina}>
                  {pagina}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className="painel-counter-box">
          Mostrando <strong>{produtosPaginados.length}</strong> de{" "}
          <strong>{produtosFiltrados.length}</strong> produtos
        </div>

        {loading ? (
          <div className="painel-empty-box">Carregando produtos...</div>
        ) : produtosPaginados.length === 0 ? (
          <div className="painel-empty-box">Nenhum produto encontrado.</div>
        ) : (
          <section className="painel-card-grid">
            {produtosPaginados.map((produto) => (
              <article key={produto.id_produto} className="produto-card">
                <div className="produto-card-image-wrap">
                  {produto.imagem ? (
                    <img
                      src={getImagemUrl(produto.imagem)}
                      alt={produto.nome}
                      className="produto-card-image"
                    />
                  ) : (
                    <div className="produto-card-no-image">Sem imagem</div>
                  )}

                  <div className="produto-card-badges">
                    {produto.destaque ? <span className="badge-gold">Destaque</span> : null}
                    {Number(produto.catalogo ?? 0) === 1 ? (
                      <span className="badge-green">Catálogo</span>
                    ) : null}
                  </div>
                </div>

                <div className="produto-card-body">
                  <span className="produto-categoria-tag">
                    {produto.categoria_nome || "Sem categoria"}
                  </span>

                  <h3>{produto.nome}</h3>

                  <p>
                    {produto.descricao?.trim()
                      ? produto.descricao.length > 95
                        ? `${produto.descricao.slice(0, 95)}...`
                        : produto.descricao
                      : "Sem descrição cadastrada."}
                  </p>

                  <div className="produto-info-list">
                    <div className="produto-info-item">
                      <span>Preço</span>
                      <strong>{formatMoney(produto.preco)}</strong>
                    </div>

                    <div className="produto-info-item">
                      <span>Estoque</span>
                      <strong>
                        {Number(produto.ilimitado ?? 0) === 1
                          ? "Ilimitado"
                          : Number(produto.estoque ?? 0)}
                      </strong>
                    </div>

                    <div className="produto-info-item">
                      <span>Slug</span>
                      <strong>{produto.slug || "—"}</strong>
                    </div>
                  </div>

                  <div className="produto-card-actions">
                    <button
                      type="button"
                      className="btn-secondary-ui"
                      onClick={() => abrirModalEditar(produto)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className="btn-secondary-ui"
                      onClick={() => abrirModalImagens(produto)}
                    >
                      Imagens
                    </button>

                    <button
                      type="button"
                      className="btn-danger-ui"
                      onClick={() => excluirProduto(produto)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        <ModalBase
          open={modalProdutoOpen}
          title={modoEdicao ? "Editar produto" : "Cadastrar produto"}
          subtitle={
            modoEdicao
              ? "Atualize os dados do produto com mais organização."
              : "Preencha as informações do novo produto."
          }
          onClose={fecharModalProduto}
        >
          <div className="painel-tabs-bar">
            <TabButton active={produtoTab === "geral"} onClick={() => setProdutoTab("geral")}>
              Geral
            </TabButton>
            <TabButton active={produtoTab === "preco"} onClick={() => setProdutoTab("preco")}>
              Preço e estoque
            </TabButton>
            <TabButton active={produtoTab === "midia"} onClick={() => setProdutoTab("midia")}>
              Mídia
            </TabButton>
          </div>

          <form onSubmit={salvarProduto}>
            {produtoTab === "geral" && (
              <div className="painel-tab-grid">
                <div className="full">
                  <label className="painel-label">Nome</label>
                  <input className="painel-input" value={form.nome} onChange={handleNomeChange} />
                </div>

                <div>
                  <label className="painel-label">Slug</label>
                  <input
                    className="painel-input"
                    value={form.slug}
                    onChange={(e) => handleChange("slug", slugify(e.target.value))}
                  />
                </div>

                <div>
                  <label className="painel-label">SKU</label>
                  <input
                    className="painel-input"
                    value={form.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                  />
                </div>

                <div>
                  <label className="painel-label">Modelo</label>
                  <input
                    className="painel-input"
                    value={form.modelo}
                    onChange={(e) => handleChange("modelo", e.target.value)}
                  />
                </div>

                <div>
                  <label className="painel-label">Categoria</label>
                  <select
                    className="painel-input"
                    value={form.categoria_id}
                    onChange={(e) => handleChange("categoria_id", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {categorias.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="painel-label">Status</label>
                  <select
                    className="painel-input"
                    value={form.statusid}
                    onChange={(e) => handleChange("statusid", e.target.value)}
                  >
                    <option value="">Selecione</option>
                    {statusList.map((status, index) => {
                      const value = status.id_status ?? status.id ?? index + 1;
                      const label =
                        status.nome || status.titulo || status.codigo || `Status ${value}`;
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="full">
                  <label className="painel-label">Descrição</label>
                  <textarea
                    className="painel-textarea"
                    value={form.descricao}
                    onChange={(e) => handleChange("descricao", e.target.value)}
                  />
                </div>
              </div>
            )}

            {produtoTab === "preco" && (
              <div className="painel-tab-grid">
                <div>
                  <label className="painel-label">Preço</label>
                  <input
                    className="painel-input"
                    value={form.preco}
                    onChange={(e) => handleChange("preco", e.target.value)}
                  />
                </div>

                <div>
                  <label className="painel-label">Preço promocional</label>
                  <input
                    className="painel-input"
                    value={form.preco_promocional}
                    onChange={(e) => handleChange("preco_promocional", e.target.value)}
                  />
                </div>

                <div>
                  <label className="painel-label">Estoque</label>
                  <input
                    className="painel-input"
                    type="number"
                    min="0"
                    value={form.estoque}
                    onChange={(e) => handleChange("estoque", e.target.value)}
                  />
                </div>

                <div className="painel-checks-box">
                  <label className="painel-check-row">
                    <input
                      type="checkbox"
                      checked={form.catalogo}
                      onChange={(e) => handleChange("catalogo", e.target.checked)}
                    />
                    Produto no catálogo
                  </label>

                  <label className="painel-check-row">
                    <input
                      type="checkbox"
                      checked={form.ilimitado}
                      onChange={(e) => handleChange("ilimitado", e.target.checked)}
                    />
                    Estoque ilimitado
                  </label>
                </div>
              </div>
            )}

            {produtoTab === "midia" && (
              <div className="painel-tab-grid">
                <div>
                  <label className="painel-label">Imagem principal</label>
                  <input
                    className="painel-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleChange("imagem", e.target.files?.[0] || null)}
                  />
                </div>

                <div>
                  <label className="painel-label">Prévia</label>
                  <div className="painel-preview-box">
                    {previewImagem ? (
                      <img src={previewImagem} alt="Prévia" className="painel-preview-image" />
                    ) : (
                      <span>Sem imagem</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="painel-modal-footer">
              <button type="button" className="btn-secondary-ui" onClick={fecharModalProduto}>
                Cancelar
              </button>

              <button type="submit" className="btn-primary-ui" disabled={salvandoProduto}>
                {salvandoProduto
                  ? "Salvando..."
                  : modoEdicao
                  ? "Salvar alterações"
                  : "Cadastrar produto"}
              </button>
            </div>
          </form>
        </ModalBase>

        <ModalBase
          open={modalImagemOpen}
          title="Galeria de imagens"
          subtitle={produtoImagemAtual?.nome}
          onClose={fecharModalImagens}
        >
          <div className="painel-upload-section">
            <label className="painel-label">Adicionar novas imagens</label>
            <input
              className="painel-input"
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setNovasImagens(Array.from(e.target.files || []))}
            />
            <button
              type="button"
              className="btn-primary-ui"
              onClick={enviarImagens}
              disabled={enviandoImagens}
            >
              {enviandoImagens ? "Enviando..." : "Enviar imagens"}
            </button>
          </div>

          {erroImagem ? <div className="painel-empty-box">{erroImagem}</div> : null}

          <div className="painel-image-grid">
            {galeria.length > 0 ? (
              galeria.map((img, index) => (
                <div key={`${img.imagem}-${index}`} className="painel-gallery-card">
                  <img
                    src={getImagemUrl(img.imagem)}
                    alt={`Imagem ${index + 1}`}
                    className="painel-gallery-image"
                  />

                  <div className="painel-gallery-actions">
                    <button
                      type="button"
                      className="btn-secondary-ui"
                      onClick={() => definirPrincipal(img.imagem)}
                    >
                      Principal
                    </button>

                    <button
                      type="button"
                      className="btn-danger-ui"
                      onClick={() => removerImagem(img.id_imagem)}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="painel-empty-box">Nenhuma imagem cadastrada.</div>
            )}
          </div>
        </ModalBase>
      </div>

      <style jsx>{`
        .painel-produtos-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(124, 58, 237, 0.08), transparent 28%),
            radial-gradient(circle at top right, rgba(16, 185, 129, 0.06), transparent 22%),
            linear-gradient(180deg, #f8f7ff 0%, #f3f4f8 100%);
          padding: 24px;
          color: #111827;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .painel-produtos-hero {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
          flex-wrap: wrap;
          background: linear-gradient(135deg, #ffffff 0%, #f6f1ff 100%);
          border: 1px solid #ebe8ff;
          border-radius: 28px;
          padding: 26px;
          box-shadow:
            0 18px 50px rgba(91, 33, 182, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.65);
        }

        .painel-produtos-badge-top {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 999px;
          background: #ede9fe;
          color: #6d28d9;
          font-size: 12px;
          font-weight: 800;
        }

        .painel-produtos-hero h1 {
          margin: 10px 0 6px;
          font-size: 36px;
          font-weight: 900;
          letter-spacing: -0.6px;
        }

        .painel-produtos-hero p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.6;
          max-width: 680px;
        }

        .painel-produtos-filtros {
          display: grid;
          grid-template-columns: 1.5fr 1fr 180px;
          gap: 14px;
          margin-bottom: 16px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid #ececf2;
          border-radius: 24px;
          padding: 16px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.04);
          backdrop-filter: blur(10px);
        }

        .painel-select-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .painel-select-group label,
        .painel-label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .painel-counter-box {
          margin-bottom: 18px;
          color: #4b5563;
          font-weight: 600;
          font-size: 14px;
        }

        .painel-input,
        .painel-textarea {
          width: 100%;
          border: 1px solid #ddd6fe;
          background: #fff;
          border-radius: 16px;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
          transition: 0.2s ease;
          box-sizing: border-box;
        }

        .painel-input:focus,
        .painel-textarea:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.12);
        }

        .painel-textarea {
          min-height: 120px;
          resize: vertical;
        }

        .painel-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 18px;
        }

        .produto-card {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid #ececf2;
          border-radius: 26px;
          overflow: hidden;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .produto-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 36px rgba(15, 23, 42, 0.08);
          border-color: #ddd6fe;
        }

        .produto-card-image-wrap {
          position: relative;
          height: 220px;
          background: linear-gradient(180deg, #f7f8ff 0%, #eef1ff 100%);
        }

        .produto-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .produto-card-no-image {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #6b7280;
          font-weight: 700;
        }

        .produto-card-badges {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .badge-gold,
        .badge-green {
          padding: 6px 10px;
          border-radius: 999px;
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.16);
        }

        .badge-gold {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }

        .badge-green {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .produto-card-body {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .produto-categoria-tag {
          display: inline-flex;
          width: fit-content;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f3f0ff;
          color: #7c3aed;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .produto-card-body h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 900;
          line-height: 1.3;
        }

        .produto-card-body p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.6;
          min-height: 44px;
        }

        .produto-info-list {
          display: grid;
          gap: 10px;
        }

        .produto-info-item {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: #f9fafb;
          border: 1px solid #ececf2;
          font-size: 13px;
        }

        .produto-info-item span {
          color: #6b7280;
        }

        .produto-info-item strong {
          color: #111827;
          text-align: right;
          word-break: break-word;
        }

        .produto-card-actions {
          margin-top: auto;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }

        .btn-primary-ui,
        .btn-secondary-ui,
        .btn-danger-ui {
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.18s ease;
        }

        .btn-primary-ui:hover,
        .btn-secondary-ui:hover,
        .btn-danger-ui:hover {
          transform: translateY(-1px);
        }

        .btn-primary-ui {
          border: none;
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          color: #fff;
          box-shadow: 0 12px 24px rgba(124, 58, 237, 0.2);
        }

        .btn-secondary-ui {
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #e5e7eb;
        }

        .btn-danger-ui {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .painel-empty-box {
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid #ececf2;
          border-radius: 18px;
          padding: 28px;
          text-align: center;
          color: #6b7280;
          font-weight: 700;
        }

        .painel-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.42);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          z-index: 99999;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          overflow-y: auto;
        }

        .painel-modal-wrapper {
          width: 100%;
          max-width: 980px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: auto;
        }

        .painel-modal-card {
          width: 100%;
          max-width: 980px;
          max-height: calc(100vh - 48px);
          overflow: hidden;
          background: #fff;
          border-radius: 28px;
          border: 1px solid #ececf2;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.22);
          display: flex;
          flex-direction: column;
          animation: modalFadeUp 0.22s ease;
        }

        .painel-modal-header {
          padding: 20px;
          border-bottom: 1px solid #ececf2;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          flex-shrink: 0;
        }

        .painel-modal-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 900;
          color: #111827;
        }

        .painel-modal-header p {
          margin: 6px 0 0;
          font-size: 14px;
          color: #6b7280;
          font-weight: 600;
        }

        .painel-modal-close {
          width: 42px;
          height: 42px;
          border: none;
          border-radius: 14px;
          background: #f3f4f6;
          font-size: 24px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .painel-modal-content {
          padding: 20px;
          overflow-y: auto;
          flex: 1;
        }

        .painel-tabs-bar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 18px;
          padding: 6px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
        }

        .painel-tab-button {
          border: none;
          background: transparent;
          color: #475569;
          padding: 12px 16px;
          border-radius: 14px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
          transition: 0.18s ease;
        }

        .painel-tab-button.active {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          color: #fff;
          box-shadow: 0 10px 22px rgba(124, 58, 237, 0.22);
        }

        .painel-tab-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .painel-tab-grid .full {
          grid-column: 1 / -1;
        }

        .painel-checks-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
          justify-content: center;
          background: #f9fafb;
          border: 1px solid #ececf2;
          border-radius: 18px;
          padding: 16px;
        }

        .painel-check-row {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #374151;
        }

        .painel-preview-box {
          min-height: 200px;
          border-radius: 18px;
          border: 1px dashed #d1d5db;
          background: #f9fafb;
          display: grid;
          place-items: center;
          overflow: hidden;
          color: #6b7280;
        }

        .painel-preview-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
        }

        .painel-modal-footer {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 18px;
          border-top: 1px solid #ececf2;
        }

        .painel-upload-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .painel-image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .painel-gallery-card {
          border: 1px solid #ececf2;
          border-radius: 18px;
          overflow: hidden;
          background: #fff;
        }

        .painel-gallery-image {
          width: 100%;
          height: 220px;
          object-fit: cover;
          display: block;
        }

        .painel-gallery-actions {
          padding: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @keyframes modalFadeUp {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 980px) {
          .painel-produtos-filtros,
          .painel-tab-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .painel-produtos-page {
            padding: 16px;
          }

          .painel-produtos-hero {
            padding: 18px;
          }

          .painel-produtos-hero h1 {
            font-size: 28px;
          }

          .produto-card-actions,
          .painel-gallery-actions {
            grid-template-columns: 1fr;
          }

          .painel-modal-overlay {
            padding: 12px;
            align-items: center;
            justify-content: center;
          }

          .painel-modal-wrapper {
            max-width: 100%;
          }

          .painel-modal-card {
            max-width: 100%;
            max-height: calc(100vh - 24px);
            border-radius: 22px;
          }

          .painel-modal-header {
            padding: 16px;
          }

          .painel-modal-header h2 {
            font-size: 20px;
          }

          .painel-modal-content {
            padding: 16px;
          }

          .painel-modal-footer {
            flex-direction: column;
          }
        }
      `}</style>
    </>
  );
}