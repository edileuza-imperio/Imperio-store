"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
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

type ModalBaseProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
};

function ModalBase({ open, title, subtitle, onClose, children }: ModalBaseProps) {
  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 99999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 980,
          maxHeight: "90vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 24,
          boxShadow: "0 30px 80px rgba(0,0,0,0.22)",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            padding: 20,
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 2,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 900,
                color: "#111827",
              }}
            >
              {title}
            </h2>
            {subtitle ? (
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 14,
                  color: "#6b7280",
                  fontWeight: 600,
                }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 42,
              height: 42,
              border: "none",
              borderRadius: 14,
              background: "#f3f4f6",
              fontSize: 24,
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
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
    setModalProdutoOpen(true);
  }

  function fecharModalProduto() {
    setModalProdutoOpen(false);
    setModoEdicao(false);
    setProdutoEditando(null);
    setForm(emptyForm());
    setPreviewImagem("");
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
    <div style={{ padding: 24, background: "#f7f7fb", minHeight: "100vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              padding: "6px 12px",
              borderRadius: 999,
              background: "#ede9fe",
              color: "#6d28d9",
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            Catálogo
          </span>
          <h1 style={{ margin: "8px 0 6px", fontSize: 34, fontWeight: 900 }}>Produtos</h1>
          <p style={{ margin: 0, color: "#6b7280" }}>
            Gerencie seus produtos com cadastro, edição, imagens e paginação.
          </p>
        </div>

        <button
          onClick={abrirModalCriar}
          style={{
            border: "none",
            borderRadius: 14,
            padding: "12px 18px",
            background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          + Novo produto
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 0.9fr 180px",
          gap: 14,
          marginBottom: 16,
        }}
      >
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, slug, SKU ou categoria..."
          style={{
            width: "100%",
            border: "1px solid #ddd6fe",
            background: "#fff",
            borderRadius: 16,
            padding: "12px 14px",
            fontSize: 14,
          }}
        />

        <select
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
          style={{
            width: "100%",
            border: "1px solid #ddd6fe",
            background: "#fff",
            borderRadius: 16,
            padding: "12px 14px",
            fontSize: 14,
          }}
        >
          <option value="">Todas as categorias</option>
          {categorias.map((cat) => (
            <option key={cat.id_categoria} value={cat.nome}>
              {cat.nome}
            </option>
          ))}
        </select>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 700 }}>Página</label>
          <select
            value={paginaAtual}
            onChange={(e) => setPaginaAtual(Number(e.target.value))}
            style={{
              width: "100%",
              border: "1px solid #ddd6fe",
              background: "#fff",
              borderRadius: 16,
              padding: "12px 14px",
              fontSize: 14,
            }}
          >
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
              <option key={pagina} value={pagina}>
                {pagina}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 18, color: "#4b5563", fontWeight: 600 }}>
        Mostrando <strong>{produtosPaginados.length}</strong> de{" "}
        <strong>{produtosFiltrados.length}</strong> produtos
      </div>

      {loading ? (
        <div style={estadoStyle}>Carregando produtos...</div>
      ) : produtosPaginados.length === 0 ? (
        <div style={estadoStyle}>Nenhum produto encontrado.</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 18,
          }}
        >
          {produtosPaginados.map((produto) => (
            <div
              key={produto.id_produto}
              style={{
                background: "#fff",
                border: "1px solid #ececf2",
                borderRadius: 24,
                overflow: "hidden",
                boxShadow: "0 12px 28px rgba(15, 23, 42, 0.05)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  position: "relative",
                  height: 210,
                  background: "linear-gradient(180deg, #f8f9ff 0%, #eef2ff 100%)",
                }}
              >
                {produto.imagem ? (
                  <img
                    src={getImagemUrl(produto.imagem)}
                    alt={produto.nome}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "grid",
                      placeItems: "center",
                      color: "#6b7280",
                      fontWeight: 700,
                    }}
                  >
                    Sem imagem
                  </div>
                )}
              </div>

              <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#8b5cf6", textTransform: "uppercase" }}>
                  {produto.categoria_nome || "Sem categoria"}
                </div>

                <h3 style={{ margin: 0, fontSize: 18, color: "#111827" }}>{produto.nome}</h3>

                <p style={{ margin: 0, color: "#6b7280", fontSize: 14, lineHeight: 1.55 }}>
                  {produto.descricao?.trim()
                    ? produto.descricao.length > 90
                      ? `${produto.descricao.slice(0, 90)}...`
                      : produto.descricao
                    : "Sem descrição cadastrada."}
                </p>

                <div style={{ display: "grid", gap: 10 }}>
                  <div style={linhaInfoStyle}>
                    <span>Preço</span>
                    <strong>{formatMoney(produto.preco)}</strong>
                  </div>
                  <div style={linhaInfoStyle}>
                    <span>Estoque</span>
                    <strong>
                      {Number(produto.ilimitado ?? 0) === 1 ? "Ilimitado" : Number(produto.estoque ?? 0)}
                    </strong>
                  </div>
                  <div style={linhaInfoStyle}>
                    <span>Slug</span>
                    <strong>{produto.slug || "—"}</strong>
                  </div>
                </div>

                <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                  <button onClick={() => abrirModalEditar(produto)} style={btnSoftStyle}>
                    Editar
                  </button>
                  <button onClick={() => abrirModalImagens(produto)} style={btnSoftStyle}>
                    Imagens
                  </button>
                  <button onClick={() => excluirProduto(produto)} style={btnDangerStyle}>
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
        onClose={fecharModalProduto}
      >
        <form onSubmit={salvarProduto}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Nome</label>
              <input style={inputStyle} value={form.nome} onChange={handleNomeChange} />
            </div>

            <div>
              <label style={labelStyle}>Slug</label>
              <input
                style={inputStyle}
                value={form.slug}
                onChange={(e) => handleChange("slug", slugify(e.target.value))}
              />
            </div>

            <div>
              <label style={labelStyle}>SKU</label>
              <input style={inputStyle} value={form.sku} onChange={(e) => handleChange("sku", e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Modelo</label>
              <input style={inputStyle} value={form.modelo} onChange={(e) => handleChange("modelo", e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Preço</label>
              <input style={inputStyle} value={form.preco} onChange={(e) => handleChange("preco", e.target.value)} />
            </div>

            <div>
              <label style={labelStyle}>Preço promocional</label>
              <input
                style={inputStyle}
                value={form.preco_promocional}
                onChange={(e) => handleChange("preco_promocional", e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Estoque</label>
              <input
                style={inputStyle}
                type="number"
                min="0"
                value={form.estoque}
                onChange={(e) => handleChange("estoque", e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Categoria</label>
              <select
                style={inputStyle}
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
              <label style={labelStyle}>Status</label>
              <select
                style={inputStyle}
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

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Descrição</label>
              <textarea
                style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                value={form.descricao}
                onChange={(e) => handleChange("descricao", e.target.value)}
              />
            </div>

            <div>
              <label style={labelStyle}>Imagem principal</label>
              <input
                style={inputStyle}
                type="file"
                accept="image/*"
                onChange={(e) => handleChange("imagem", e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label style={labelStyle}>Prévia</label>
              <div
                style={{
                  minHeight: 180,
                  borderRadius: 18,
                  border: "1px dashed #d1d5db",
                  background: "#f9fafb",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                }}
              >
                {previewImagem ? (
                  <img
                    src={previewImagem}
                    alt="Prévia"
                    style={{ width: "100%", height: 180, objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "#6b7280" }}>Sem imagem</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 16 }}>
            <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.catalogo}
                onChange={(e) => handleChange("catalogo", e.target.checked)}
              />
              No catálogo
            </label>

            <label style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={form.ilimitado}
                onChange={(e) => handleChange("ilimitado", e.target.checked)}
              />
              Estoque ilimitado
            </label>
          </div>

          <div style={{ marginTop: 22, display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <button type="button" onClick={fecharModalProduto} style={btnSoftStyle}>
              Cancelar
            </button>
            <button type="submit" disabled={salvandoProduto} style={btnPrimaryStyle}>
              {salvandoProduto ? "Salvando..." : modoEdicao ? "Salvar alterações" : "Cadastrar produto"}
            </button>
          </div>
        </form>
      </ModalBase>

      <ModalBase
        open={modalImagemOpen}
        title="Imagens do produto"
        subtitle={produtoImagemAtual?.nome}
        onClose={fecharModalImagens}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          <label style={labelStyle}>Adicionar imagens</label>
          <input
            style={inputStyle}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setNovasImagens(Array.from(e.target.files || []))}
          />
          <button type="button" onClick={enviarImagens} disabled={enviandoImagens} style={btnPrimaryStyle}>
            {enviandoImagens ? "Enviando..." : "Enviar imagens"}
          </button>
        </div>

        {erroImagem ? <div style={estadoStyle}>{erroImagem}</div> : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {galeria.length > 0 ? (
            galeria.map((img, index) => (
              <div
                key={`${img.imagem}-${index}`}
                style={{
                  border: "1px solid #ececf2",
                  borderRadius: 18,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                <img
                  src={getImagemUrl(img.imagem)}
                  alt={`Imagem ${index + 1}`}
                  style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
                />
                <div style={{ padding: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button type="button" onClick={() => definirPrincipal(img.imagem)} style={btnSoftStyle}>
                    Principal
                  </button>
                  <button type="button" onClick={() => removerImagem(img.id_imagem)} style={btnDangerStyle}>
                    Remover
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={estadoStyle}>Nenhuma imagem cadastrada.</div>
          )}
        </div>
      </ModalBase>
    </div>
  );
}

const estadoStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ececf2",
  borderRadius: 18,
  padding: 28,
  textAlign: "center",
  color: "#6b7280",
  fontWeight: 700,
};

const linhaInfoStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 14,
  background: "#f9fafb",
  border: "1px solid #ececf2",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: 8,
  fontSize: 13,
  fontWeight: 800,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #ddd6fe",
  background: "#fff",
  borderRadius: 16,
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
};

const btnPrimaryStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 14,
  padding: "11px 14px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
  color: "#fff",
};

const btnSoftStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: "11px 14px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  background: "#f3f4f6",
  color: "#111827",
  border: "1px solid #e5e7eb",
};

const btnDangerStyle: React.CSSProperties = {
  borderRadius: 14,
  padding: "11px 14px",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  background: "#fee2e2",
  color: "#b91c1c",
  border: "1px solid #fecaca",
};