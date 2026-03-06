"use client";

import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
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
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="painel-modal-overlay" onClick={onClose}>
      <div className="painel-modal-shell">
        <div
          className="painel-modal-card"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="painel-modal-header">
            <div className="painel-modal-header-text">
              <span className="painel-modal-mini-badge">Gerenciamento</span>
              <h2>{title}</h2>
              {subtitle ? <p>{subtitle}</p> : null}
            </div>

            <button
              type="button"
              className="painel-modal-close"
              onClick={onClose}
              aria-label="Fechar modal"
            >
              ×
            </button>
          </div>

          <div className="painel-modal-content">{children}</div>
        </div>
      </div>
    </div>,
    document.body
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
  const itensPorPagina = 6;

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
    document.body.style.overflow =
      modalProdutoOpen || modalImagemOpen ? "hidden" : "";
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
        modoEdicao && produtoEditando?.imagem
          ? getImagemUrl(produtoEditando.imagem)
          : ""
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

  function handleChange<K extends keyof ProdutoForm>(
    campo: K,
    valor: ProdutoForm[K]
  ) {
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
        : Array.isArray(imagens)
        ? imagens
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
      body.append(
        "preco_promocional",
        String(form.preco_promocional || "").replace(",", ".")
      );
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
      <div className="painel-page">
        <div className="painel-topbar">
          <div>
            <span className="painel-topbar-badge">Painel administrativo</span>
            <h1>Gerenciar produtos</h1>
            <p>
              Organize seu catálogo com uma aparência mais moderna, clara e profissional.
            </p>
          </div>

          <button type="button" className="btn-primary-ui" onClick={abrirModalCriar}>
            + Novo produto
          </button>
        </div>

        <section className="painel-filtros-card">
          <div className="painel-field painel-field-busca">
            <label>Buscar produto</label>
            <input
              className="painel-input"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite nome, slug, SKU ou categoria..."
            />
          </div>

          <div className="painel-field painel-field-categoria">
            <label>Categoria</label>
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
          </div>

          <div className="painel-field painel-field-pagina">
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

        {loading ? (
          <div className="painel-empty-box">Carregando produtos...</div>
        ) : produtosPaginados.length === 0 ? (
          <div className="painel-empty-box">Nenhum produto encontrado.</div>
        ) : (
          <section className="produto-grid">
            {produtosPaginados.map((produto) => (
              <article key={produto.id_produto} className="produto-card">
                <div className="produto-card-image-area">
                  {produto.imagem ? (
                    <img
                      src={getImagemUrl(produto.imagem)}
                      alt={produto.nome}
                      className="produto-card-image"
                    />
                  ) : (
                    <div className="produto-card-no-image">Sem imagem</div>
                  )}

                  <div className="produto-badges">
                    {produto.destaque ? (
                      <span className="badge badge-gold">Destaque</span>
                    ) : null}

                    {Number(produto.catalogo ?? 0) === 1 ? (
                      <span className="badge badge-green">No catálogo</span>
                    ) : (
                      <span className="badge badge-gray">Oculto</span>
                    )}
                  </div>
                </div>

                <div className="produto-card-content">
                  <div className="produto-top-line">
                    <span className="produto-categoria">
                      {produto.categoria_nome || "Sem categoria"}
                    </span>
                    <span className="produto-id">#{produto.id_produto}</span>
                  </div>

                  <h3>{produto.nome}</h3>

                  <p>
                    {produto.descricao?.trim()
                      ? produto.descricao.length > 110
                        ? `${produto.descricao.slice(0, 110)}...`
                        : produto.descricao
                      : "Sem descrição cadastrada."}
                  </p>

                  <div className="produto-meta-grid">
                    <div className="produto-meta-box">
                      <span>Preço</span>
                      <strong>{formatMoney(produto.preco)}</strong>
                    </div>

                    <div className="produto-meta-box">
                      <span>Estoque</span>
                      <strong>
                        {Number(produto.ilimitado ?? 0) === 1
                          ? "Ilimitado"
                          : Number(produto.estoque ?? 0)}
                      </strong>
                    </div>

                    <div className="produto-meta-box full">
                      <span>Slug</span>
                      <strong>{produto.slug || "—"}</strong>
                    </div>
                  </div>

                  <div className="produto-actions">
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
              ? "Atualize as informações do produto com mais organização."
              : "Preencha os dados do novo produto."
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
              <div className="painel-form-grid">
                <div className="full">
                  <label className="painel-label">Nome</label>
                  <input
                    className="painel-input"
                    value={form.nome}
                    onChange={handleNomeChange}
                    placeholder="Digite o nome do produto"
                  />
                </div>

                <div>
                  <label className="painel-label">Slug</label>
                  <input
                    className="painel-input"
                    value={form.slug}
                    onChange={(e) => handleChange("slug", slugify(e.target.value))}
                    placeholder="slug-do-produto"
                  />
                </div>

                <div>
                  <label className="painel-label">SKU</label>
                  <input
                    className="painel-input"
                    value={form.sku}
                    onChange={(e) => handleChange("sku", e.target.value)}
                    placeholder="SKU"
                  />
                </div>

                <div>
                  <label className="painel-label">Modelo</label>
                  <input
                    className="painel-input"
                    value={form.modelo}
                    onChange={(e) => handleChange("modelo", e.target.value)}
                    placeholder="Modelo"
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
                    placeholder="Descreva o produto..."
                  />
                </div>
              </div>
            )}

            {produtoTab === "preco" && (
              <div className="painel-form-grid">
                <div>
                  <label className="painel-label">Preço</label>
                  <input
                    className="painel-input"
                    value={form.preco}
                    onChange={(e) => handleChange("preco", e.target.value)}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="painel-label">Preço promocional</label>
                  <input
                    className="painel-input"
                    value={form.preco_promocional}
                    onChange={(e) => handleChange("preco_promocional", e.target.value)}
                    placeholder="0,00"
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
                    Produto visível no catálogo
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
              <div className="painel-form-grid">
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
                      <img
                        src={previewImagem}
                        alt="Prévia"
                        className="painel-preview-image"
                      />
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
          <div className="painel-upload-top">
            <div className="painel-field grow">
              <label className="painel-label">Adicionar novas imagens</label>
              <input
                className="painel-input"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setNovasImagens(Array.from(e.target.files || []))}
              />
            </div>

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

                  <div className="painel-gallery-footer">
                    <span>Imagem {index + 1}</span>
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
                </div>
              ))
            ) : (
              <div className="painel-empty-box">Nenhuma imagem cadastrada.</div>
            )}
          </div>
        </ModalBase>
      </div>

      <style jsx>{`
        .painel-page {
          min-height: 100vh;
          padding: 28px;
          background:
            radial-gradient(circle at top left, rgba(190, 24, 93, 0.05), transparent 28%),
            linear-gradient(180deg, #fff9fa 0%, #fffdfd 100%);
          color: #2f2430;
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .painel-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
          padding: 26px;
          margin-bottom: 22px;
          border-radius: 28px;
          background: linear-gradient(135deg, #fff8f9 0%, #ffffff 100%);
          border: 1px solid #f2d7e0;
          box-shadow: 0 12px 32px rgba(91, 33, 52, 0.05);
        }

        .painel-topbar-badge {
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          border-radius: 999px;
          background: #fff1f5;
          color: #d61f69;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid #f5c8d8;
        }

        .painel-topbar h1 {
          margin: 12px 0 8px;
          font-size: 36px;
          line-height: 1.1;
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #2d2230;
        }

        .painel-topbar p {
          margin: 0;
          max-width: 720px;
          color: #7e6372;
          font-size: 14px;
          line-height: 1.7;
          font-weight: 500;
        }

        .painel-filtros-card {
          display: grid;
          grid-template-columns: minmax(0, 1.8fr) minmax(220px, 0.9fr) 180px;
          gap: 16px;
          align-items: end;
          margin-bottom: 24px;
          padding: 18px;
          background: #ffffff;
          border: 1px solid #f2d7e0;
          border-radius: 24px;
          box-shadow: 0 10px 26px rgba(91, 33, 52, 0.04);
        }

        .painel-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 0;
        }

        .painel-field label,
        .painel-label {
          font-size: 13px;
          font-weight: 800;
          color: #714a5d;
        }

        .painel-input,
        .painel-textarea {
          width: 100%;
          box-sizing: border-box;
          height: 50px;
          border: 1px solid #efcfd8;
          background: #fff;
          color: #2f2430;
          border-radius: 16px;
          padding: 0 14px;
          font-size: 14px;
          font-weight: 500;
          outline: none;
          transition: 0.2s ease;
          box-shadow: none;
        }

        .painel-textarea {
          min-height: 130px;
          height: auto;
          padding: 14px;
          resize: vertical;
        }

        .painel-input::placeholder,
        .painel-textarea::placeholder {
          color: #b58a99;
        }

        .painel-input:focus,
        .painel-textarea:focus {
          border-color: #d61f69;
          box-shadow: 0 0 0 4px rgba(214, 31, 105, 0.11);
        }

        select.painel-input {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          padding-right: 42px;
          background-image: linear-gradient(45deg, transparent 50%, #6d4a59 50%),
            linear-gradient(135deg, #6d4a59 50%, transparent 50%);
          background-position: calc(100% - 18px) calc(50% - 3px),
            calc(100% - 12px) calc(50% - 3px);
          background-size: 6px 6px, 6px 6px;
          background-repeat: no-repeat;
        }

        .produto-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
          gap: 20px;
        }

        .produto-card {
          overflow: hidden;
          border-radius: 28px;
          border: 1px solid #f0d9e2;
          background: rgba(255, 255, 255, 0.98);
          box-shadow: 0 16px 36px rgba(62, 28, 43, 0.06);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .produto-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 42px rgba(62, 28, 43, 0.08);
          border-color: #ebb3c9;
        }

        .produto-card-image-area {
          position: relative;
          height: 240px;
          background: linear-gradient(180deg, #fff4f7 0%, #fffaf3 100%);
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
          color: #946b7d;
          font-weight: 800;
          font-size: 14px;
        }

        .produto-badges {
          position: absolute;
          top: 14px;
          left: 14px;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          z-index: 2;
        }

        .badge {
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 900;
          box-shadow: 0 8px 18px rgba(0, 0, 0, 0.12);
        }

        .badge-gold {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff;
        }

        .badge-green {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
        }

        .badge-gray {
          background: rgba(255, 255, 255, 0.94);
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .produto-card-content {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .produto-top-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .produto-categoria {
          display: inline-flex;
          width: fit-content;
          padding: 7px 12px;
          border-radius: 999px;
          background: #fff1f5;
          color: #c51d64;
          border: 1px solid #f7cade;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .produto-id {
          font-size: 12px;
          font-weight: 800;
          color: #9a6b80;
        }

        .produto-card-content h3 {
          margin: 0;
          font-size: 20px;
          line-height: 1.25;
          font-weight: 900;
          color: #2f2430;
        }

        .produto-card-content p {
          margin: 0;
          color: #7c6170;
          font-size: 14px;
          line-height: 1.7;
          min-height: 48px;
        }

        .produto-meta-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .produto-meta-box {
          padding: 12px 14px;
          border-radius: 18px;
          background: linear-gradient(180deg, #fffefe 0%, #fff7fa 100%);
          border: 1px solid #f3dce4;
        }

        .produto-meta-box.full {
          grid-column: 1 / -1;
        }

        .produto-meta-box span {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #9a6b80;
          margin-bottom: 6px;
        }

        .produto-meta-box strong {
          display: block;
          color: #2f2430;
          font-size: 14px;
          font-weight: 900;
          word-break: break-word;
        }

        .produto-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 4px;
        }

        .btn-primary-ui,
        .btn-secondary-ui,
        .btn-danger-ui {
          appearance: none;
          border-radius: 16px;
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

        .btn-primary-ui:disabled,
        .btn-secondary-ui:disabled,
        .btn-danger-ui:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-primary-ui {
          border: none;
          color: #fff;
          background: linear-gradient(135deg, #e11d74 0%, #c2185b 100%);
          box-shadow: 0 12px 24px rgba(194, 24, 91, 0.2);
        }

        .btn-secondary-ui {
          border: 1px solid #edd5dd;
          background: #fff8fb;
          color: #6a4356;
        }

        .btn-danger-ui {
          border: 1px solid #fecaca;
          background: #fff1f2;
          color: #be123c;
        }

        .painel-empty-box {
          padding: 30px;
          text-align: center;
          border-radius: 22px;
          border: 1px solid #f0d9e2;
          background: rgba(255, 255, 255, 0.98);
          color: #8a6475;
          font-weight: 800;
          box-shadow: 0 10px 24px rgba(62, 28, 43, 0.04);
        }

        .painel-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 999999;
          background: rgba(30, 20, 28, 0.52);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .painel-modal-shell {
          width: 100%;
          max-width: 1040px;
          max-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .painel-modal-card {
          width: 100%;
          max-width: 1040px;
          max-height: calc(100vh - 48px);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #ffffff 0%, #fffafb 100%);
          border: 1px solid #f0d9e2;
          border-radius: 30px;
          box-shadow: 0 35px 90px rgba(18, 10, 16, 0.28);
          animation: modalUp 0.2s ease;
        }

        .painel-modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 22px 22px 18px;
          border-bottom: 1px solid #f1dce4;
          background: rgba(255, 255, 255, 0.95);
          flex-shrink: 0;
        }

        .painel-modal-header-text h2 {
          margin: 8px 0 6px;
          font-size: 28px;
          line-height: 1.1;
          font-weight: 900;
          color: #2f2430;
        }

        .painel-modal-header-text p {
          margin: 0;
          color: #896877;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 600;
        }

        .painel-modal-mini-badge {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: #fff1f5;
          border: 1px solid #fbcfe8;
          color: #be185d;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .painel-modal-close {
          width: 46px;
          height: 46px;
          border: 1px solid #edd5dd;
          background: #fff7fa;
          color: #7a5c68;
          border-radius: 16px;
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          flex-shrink: 0;
        }

        .painel-modal-content {
          padding: 22px;
          overflow-y: auto;
          flex: 1;
        }

        .painel-tabs-bar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          padding: 8px;
          border-radius: 20px;
          background: #fff7fa;
          border: 1px solid #f0d9e2;
        }

        .painel-tab-button {
          border: none;
          background: transparent;
          color: #7a5c68;
          padding: 12px 16px;
          border-radius: 14px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 800;
          transition: 0.18s ease;
        }

        .painel-tab-button.active {
          color: #fff;
          background: linear-gradient(135deg, #db2777 0%, #be185d 100%);
          box-shadow: 0 10px 22px rgba(190, 24, 93, 0.2);
        }

        .painel-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .painel-form-grid .full {
          grid-column: 1 / -1;
        }

        .painel-checks-box {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 12px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid #f0d9e2;
          background: linear-gradient(180deg, #fffefe 0%, #fff7fa 100%);
        }

        .painel-check-row {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 700;
          color: #6a4356;
        }

        .painel-preview-box {
          min-height: 210px;
          border-radius: 18px;
          overflow: hidden;
          display: grid;
          place-items: center;
          border: 1px dashed #e8bfd0;
          background: linear-gradient(180deg, #fffdfd 0%, #fff7fa 100%);
          color: #9a6b80;
          font-weight: 700;
        }

        .painel-preview-image {
          width: 100%;
          height: 210px;
          object-fit: cover;
          display: block;
        }

        .painel-modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 24px;
          padding-top: 18px;
          border-top: 1px solid #f1dce4;
        }

        .painel-upload-top {
          display: flex;
          gap: 14px;
          align-items: end;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }

        .painel-image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
        }

        .painel-gallery-card {
          overflow: hidden;
          border-radius: 22px;
          border: 1px solid #f0d9e2;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(62, 28, 43, 0.05);
        }

        .painel-gallery-image {
          width: 100%;
          height: 240px;
          object-fit: cover;
          display: block;
        }

        .painel-gallery-footer {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .painel-gallery-footer span {
          font-size: 13px;
          font-weight: 800;
          color: #7a5c68;
        }

        .painel-gallery-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @keyframes modalUp {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 1024px) {
          .painel-filtros-card,
          .painel-form-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .painel-page {
            padding: 16px;
          }

          .painel-topbar {
            padding: 18px;
            border-radius: 22px;
          }

          .painel-topbar h1 {
            font-size: 28px;
          }

          .produto-actions,
          .painel-gallery-actions {
            grid-template-columns: 1fr;
          }

          .painel-modal-overlay {
            padding: 12px;
          }

          .painel-modal-card {
            max-height: calc(100vh - 24px);
            border-radius: 24px;
          }

          .painel-modal-header {
            padding: 18px 18px 16px;
          }

          .painel-modal-header-text h2 {
            font-size: 22px;
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