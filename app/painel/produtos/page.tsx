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
  if (!open) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalWrapper}>
        <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <div>
              <h2 style={styles.modalTitle}>{title}</h2>
              {subtitle ? <p style={styles.modalSubtitle}>{subtitle}</p> : null}
            </div>

            <button type="button" onClick={onClose} style={styles.closeButton}>
              ×
            </button>
          </div>

          <div style={styles.modalContent}>{children}</div>
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
      onClick={onClick}
      style={{
        ...styles.tabButton,
        ...(active ? styles.tabButtonActive : {}),
      }}
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
      alert(error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao salvar produto.");
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
      alert(error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao excluir produto.");
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
      alert(error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao enviar imagens.");
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
      alert(error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao remover imagem.");
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
      alert(error?.response?.data?.mensagem || error?.response?.data?.message || "Erro ao definir imagem principal.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.hero}>
        <div>
          <span style={styles.heroTag}>Painel • Catálogo</span>
          <h1 style={styles.heroTitle}>Produtos</h1>
          <p style={styles.heroText}>
            Cadastre, edite, organize imagens e mantenha seu catálogo profissional.
          </p>
        </div>

        <button type="button" onClick={abrirModalCriar} style={styles.primaryButton}>
          + Novo produto
        </button>
      </div>

      <div style={styles.filterBar}>
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, slug, SKU ou categoria..."
          style={styles.input}
        />

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          style={styles.input}
        >
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat.id_categoria} value={cat.nome}>
              {cat.nome}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={styles.label}>Página</label>
          <select
            value={paginaAtual}
            onChange={(e) => setPaginaAtual(Number(e.target.value))}
            style={styles.input}
          >
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
              <option key={pagina} value={pagina}>
                {pagina}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.counterBox}>
        Mostrando <strong>{produtosPaginados.length}</strong> de{" "}
        <strong>{produtosFiltrados.length}</strong> produtos
      </div>

      {loading ? (
        <div style={styles.emptyState}>Carregando produtos...</div>
      ) : produtosPaginados.length === 0 ? (
        <div style={styles.emptyState}>Nenhum produto encontrado.</div>
      ) : (
        <div style={styles.cardGrid}>
          {produtosPaginados.map((produto) => (
            <div key={produto.id_produto} style={styles.card}>
              <div style={styles.cardImageWrap}>
                {produto.imagem ? (
                  <img
                    src={getImagemUrl(produto.imagem)}
                    alt={produto.nome}
                    style={styles.cardImage}
                  />
                ) : (
                  <div style={styles.noImage}>Sem imagem</div>
                )}

                <div style={styles.cardBadges}>
                  {produto.destaque ? <span style={styles.badgeGold}>Destaque</span> : null}
                  {Number(produto.catalogo ?? 0) === 1 ? (
                    <span style={styles.badgeGreen}>Catálogo</span>
                  ) : null}
                </div>
              </div>

              <div style={styles.cardBody}>
                <span style={styles.categoryTag}>{produto.categoria_nome || "Sem categoria"}</span>

                <h3 style={styles.cardTitle}>{produto.nome}</h3>

                <p style={styles.cardText}>
                  {produto.descricao?.trim()
                    ? produto.descricao.length > 95
                      ? `${produto.descricao.slice(0, 95)}...`
                      : produto.descricao
                    : "Sem descrição cadastrada."}
                </p>

                <div style={styles.infoList}>
                  <div style={styles.infoItem}>
                    <span>Preço</span>
                    <strong>{formatMoney(produto.preco)}</strong>
                  </div>

                  <div style={styles.infoItem}>
                    <span>Estoque</span>
                    <strong>
                      {Number(produto.ilimitado ?? 0) === 1 ? "Ilimitado" : Number(produto.estoque ?? 0)}
                    </strong>
                  </div>

                  <div style={styles.infoItem}>
                    <span>Slug</span>
                    <strong>{produto.slug || "—"}</strong>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  <button type="button" onClick={() => abrirModalEditar(produto)} style={styles.secondaryButton}>
                    Editar
                  </button>

                  <button type="button" onClick={() => abrirModalImagens(produto)} style={styles.secondaryButton}>
                    Imagens
                  </button>

                  <button type="button" onClick={() => excluirProduto(produto)} style={styles.dangerButton}>
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ModalBase
        open={modalProdutoOpen}
        title={modoEdicao ? "Editar produto" : "Cadastrar produto"}
        subtitle={modoEdicao ? "Atualize os dados do produto com mais organização." : "Preencha as informações do novo produto."}
        onClose={fecharModalProduto}
      >
        <div style={styles.tabsBar}>
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
            <div style={styles.tabPanel}>
              <div style={styles.fieldFull}>
                <label style={styles.label}>Nome</label>
                <input style={styles.input} value={form.nome} onChange={handleNomeChange} />
              </div>

              <div>
                <label style={styles.label}>Slug</label>
                <input
                  style={styles.input}
                  value={form.slug}
                  onChange={(e) => handleChange("slug", slugify(e.target.value))}
                />
              </div>

              <div>
                <label style={styles.label}>SKU</label>
                <input
                  style={styles.input}
                  value={form.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Modelo</label>
                <input
                  style={styles.input}
                  value={form.modelo}
                  onChange={(e) => handleChange("modelo", e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Categoria</label>
                <select
                  style={styles.input}
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
                <label style={styles.label}>Status</label>
                <select
                  style={styles.input}
                  value={form.statusid}
                  onChange={(e) => handleChange("statusid", e.target.value)}
                >
                  <option value="">Selecione</option>
                  {statusList.map((status, index) => {
                    const value = status.id_status ?? status.id ?? index + 1;
                    const label = status.nome || status.titulo || status.codigo || `Status ${value}`;
                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div style={styles.fieldFull}>
                <label style={styles.label}>Descrição</label>
                <textarea
                  style={styles.textarea}
                  value={form.descricao}
                  onChange={(e) => handleChange("descricao", e.target.value)}
                />
              </div>
            </div>
          )}

          {produtoTab === "preco" && (
            <div style={styles.tabPanel}>
              <div>
                <label style={styles.label}>Preço</label>
                <input
                  style={styles.input}
                  value={form.preco}
                  onChange={(e) => handleChange("preco", e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Preço promocional</label>
                <input
                  style={styles.input}
                  value={form.preco_promocional}
                  onChange={(e) => handleChange("preco_promocional", e.target.value)}
                />
              </div>

              <div>
                <label style={styles.label}>Estoque</label>
                <input
                  style={styles.input}
                  type="number"
                  min="0"
                  value={form.estoque}
                  onChange={(e) => handleChange("estoque", e.target.value)}
                />
              </div>

              <div style={styles.switchBox}>
                <label style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.catalogo}
                    onChange={(e) => handleChange("catalogo", e.target.checked)}
                  />
                  Produto no catálogo
                </label>

                <label style={styles.checkboxRow}>
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
            <div style={styles.tabPanel}>
              <div>
                <label style={styles.label}>Imagem principal</label>
                <input
                  style={styles.input}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleChange("imagem", e.target.files?.[0] || null)}
                />
              </div>

              <div>
                <label style={styles.label}>Prévia</label>
                <div style={styles.previewBox}>
                  {previewImagem ? (
                    <img src={previewImagem} alt="Prévia" style={styles.previewImage} />
                  ) : (
                    <span style={{ color: "#6b7280" }}>Sem imagem</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div style={styles.modalFooter}>
            <button type="button" onClick={fecharModalProduto} style={styles.secondaryButton}>
              Cancelar
            </button>

            <button type="submit" disabled={salvandoProduto} style={styles.primaryButton}>
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
        <div style={styles.uploadSection}>
          <label style={styles.label}>Adicionar novas imagens</label>
          <input
            style={styles.input}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setNovasImagens(Array.from(e.target.files || []))}
          />
          <button type="button" onClick={enviarImagens} disabled={enviandoImagens} style={styles.primaryButton}>
            {enviandoImagens ? "Enviando..." : "Enviar imagens"}
          </button>
        </div>

        {erroImagem ? <div style={styles.emptyState}>{erroImagem}</div> : null}

        <div style={styles.imageGrid}>
          {galeria.length > 0 ? (
            galeria.map((img, index) => (
              <div key={`${img.imagem}-${index}`} style={styles.galleryCard}>
                <img src={getImagemUrl(img.imagem)} alt={`Imagem ${index + 1}`} style={styles.galleryImage} />

                <div style={styles.galleryActions}>
                  <button type="button" onClick={() => definirPrincipal(img.imagem)} style={styles.secondaryButton}>
                    Principal
                  </button>
                  <button type="button" onClick={() => removerImagem(img.id_imagem)} style={styles.dangerButton}>
                    Remover
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>Nenhuma imagem cadastrada.</div>
          )}
        </div>
      </ModalBase>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8f7ff 0%, #f3f4f8 100%)",
    padding: 24,
  },

  hero: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 22,
    flexWrap: "wrap",
    background: "linear-gradient(135deg, #ffffff 0%, #f6f1ff 100%)",
    border: "1px solid #ebe8ff",
    borderRadius: 28,
    padding: 24,
    boxShadow: "0 18px 50px rgba(91, 33, 182, 0.08)",
  },

  heroTag: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: 999,
    background: "#ede9fe",
    color: "#6d28d9",
    fontSize: 12,
    fontWeight: 800,
  },

  heroTitle: {
    margin: "10px 0 6px",
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: -0.5,
    color: "#111827",
  },

  heroText: {
    margin: 0,
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.6,
  },

  filterBar: {
    display: "grid",
    gridTemplateColumns: "1.5fr 1fr 180px",
    gap: 14,
    marginBottom: 16,
    background: "#fff",
    border: "1px solid #ececf2",
    borderRadius: 24,
    padding: 16,
    boxShadow: "0 10px 28px rgba(15, 23, 42, 0.04)",
  },

  counterBox: {
    marginBottom: 18,
    color: "#4b5563",
    fontWeight: 600,
    fontSize: 14,
  },

  input: {
    width: "100%",
    border: "1px solid #ddd6fe",
    background: "#fff",
    borderRadius: 16,
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
  },

  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 800,
    color: "#374151",
  },

  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 18,
  },

  card: {
    background: "#fff",
    border: "1px solid #ececf2",
    borderRadius: 26,
    overflow: "hidden",
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.05)",
    display: "flex",
    flexDirection: "column",
  },

  cardImageWrap: {
    position: "relative",
    height: 220,
    background: "linear-gradient(180deg, #f7f8ff 0%, #eef1ff 100%)",
  },

  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  noImage: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    color: "#6b7280",
    fontWeight: 700,
  },

  cardBadges: {
    position: "absolute",
    top: 12,
    left: 12,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  badgeGold: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#f59e0b",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
  },

  badgeGreen: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "#10b981",
    color: "#fff",
    fontSize: 11,
    fontWeight: 800,
  },

  cardBody: {
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    flex: 1,
  },

  categoryTag: {
    display: "inline-flex",
    width: "fit-content",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#f3f0ff",
    color: "#7c3aed",
    fontSize: 11,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },

  cardTitle: {
    margin: 0,
    fontSize: 18,
    color: "#111827",
    fontWeight: 900,
    lineHeight: 1.3,
  },

  cardText: {
    margin: 0,
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.6,
    minHeight: 44,
  },

  infoList: {
    display: "grid",
    gap: 10,
  },

  infoItem: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 14,
    background: "#f9fafb",
    border: "1px solid #ececf2",
    fontSize: 13,
  },

  cardActions: {
    marginTop: "auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
  },

  primaryButton: {
    border: "none",
    borderRadius: 14,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
    color: "#fff",
    boxShadow: "0 12px 24px rgba(124, 58, 237, 0.2)",
  },

  secondaryButton: {
    borderRadius: 14,
    padding: "11px 14px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #e5e7eb",
  },

  dangerButton: {
    borderRadius: 14,
    padding: "11px 14px",
    fontSize: 14,
    fontWeight: 800,
    cursor: "pointer",
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },

  emptyState: {
    background: "#fff",
    border: "1px solid #ececf2",
    borderRadius: 18,
    padding: 28,
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 700,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 99999,
  },

  modalWrapper: {
    width: "100%",
    maxWidth: 980,
  },

  modalCard: {
    width: "100%",
    maxHeight: "90vh",
    overflow: "auto",
    background: "#fff",
    borderRadius: 28,
    border: "1px solid #ececf2",
    boxShadow: "0 30px 80px rgba(0,0,0,0.22)",
  },

  modalHeader: {
    padding: 20,
    borderBottom: "1px solid #ececf2",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 2,
  },

  modalTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 900,
    color: "#111827",
  },

  modalSubtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "#6b7280",
    fontWeight: 600,
  },

  closeButton: {
    width: 42,
    height: 42,
    border: "none",
    borderRadius: 14,
    background: "#f3f4f6",
    fontSize: 24,
    cursor: "pointer",
  },

  modalContent: {
    padding: 20,
  },

  tabsBar: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 18,
  },

  tabButton: {
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#374151",
    padding: "10px 14px",
    borderRadius: 14,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 800,
  },

  tabButtonActive: {
    background: "#ede9fe",
    color: "#5b21b6",
    borderColor: "#c4b5fd",
    boxShadow: "0 0 0 4px rgba(124, 58, 237, 0.08)",
  },

  tabPanel: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 16,
  },

  fieldFull: {
    gridColumn: "1 / -1",
  },

  textarea: {
    width: "100%",
    border: "1px solid #ddd6fe",
    background: "#fff",
    borderRadius: 16,
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
    minHeight: 120,
    resize: "vertical",
  },

  switchBox: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    justifyContent: "center",
  },

  checkboxRow: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "#374151",
  },

  previewBox: {
    minHeight: 200,
    borderRadius: 18,
    border: "1px dashed #d1d5db",
    background: "#f9fafb",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
  },

  previewImage: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    display: "block",
  },

  modalFooter: {
    marginTop: 24,
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },

  uploadSection: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginBottom: 20,
  },

  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },

  galleryCard: {
    border: "1px solid #ececf2",
    borderRadius: 18,
    overflow: "hidden",
    background: "#fff",
  },

  galleryImage: {
    width: "100%",
    height: 220,
    objectFit: "cover",
    display: "block",
  },

  galleryActions: {
    padding: 12,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
};