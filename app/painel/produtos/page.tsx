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

  useEffect(() => {
    document.body.style.overflow = modalProdutoOpen || modalImagemOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalProdutoOpen, modalImagemOpen]);

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
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

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

  function fecharModalProduto() {
    setModalProdutoOpen(false);
    setModoEdicao(false);
    setProdutoEditando(null);
    setForm(emptyForm());
    setPreviewImagem("");
  }

  function fecharModalImagens() {
    setModalImagemOpen(false);
    setProdutoImagemAtual(null);
    setGaleria([]);
    setNovasImagens([]);
    setErroImagem("");
  }

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
      novasImagens.forEach((file) => {
        body.append("imagens[]", file);
      });

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
      <div className="painel-produtos">
        <div className="topo">
          <div>
            <span className="tag-topo">Catálogo</span>
            <h1>Produtos</h1>
            <p>Gerencie seus produtos com cadastro, edição, imagens e paginação.</p>
          </div>

          <button className="btn btn-primary" onClick={abrirModalCriar}>
            + Novo produto
          </button>
        </div>

        <div className="filtros">
          <input
            className="input"
            placeholder="Buscar por nome, slug, SKU ou categoria..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="select"
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

          <div className="paginacao-select">
            <label>Página</label>
            <select
              className="select"
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
        </div>

        <div className="resumo">
          <span>
            Mostrando <strong>{produtosPaginados.length}</strong> de{" "}
            <strong>{produtosFiltrados.length}</strong> produtos
          </span>
        </div>

        {loading ? (
          <div className="estado">Carregando produtos...</div>
        ) : produtosPaginados.length === 0 ? (
          <div className="estado">Nenhum produto encontrado.</div>
        ) : (
          <div className="grid-cards">
            {produtosPaginados.map((produto) => (
              <div className="card-produto" key={produto.id_produto}>
                <div className="imagem-box">
                  {produto.imagem ? (
                    <img
                      src={getImagemUrl(produto.imagem)}
                      alt={produto.nome}
                      className="imagem-produto"
                    />
                  ) : (
                    <div className="sem-imagem">Sem imagem</div>
                  )}

                  <div className="badges">
                    {produto.destaque ? <span className="badge destaque">Destaque</span> : null}
                    {Number(produto.catalogo ?? 0) === 1 ? (
                      <span className="badge catalogo">Catálogo</span>
                    ) : null}
                  </div>
                </div>

                <div className="conteudo-card">
                  <div className="categoria">{produto.categoria_nome || "Sem categoria"}</div>
                  <h3>{produto.nome}</h3>

                  <p className="descricao">
                    {produto.descricao?.trim()
                      ? produto.descricao.length > 90
                        ? `${produto.descricao.slice(0, 90)}...`
                        : produto.descricao
                      : "Sem descrição cadastrada."}
                  </p>

                  <div className="linhas-info">
                    <div>
                      <span>Preço</span>
                      <strong>{formatMoney(produto.preco)}</strong>
                    </div>

                    <div>
                      <span>Estoque</span>
                      <strong>
                        {Number(produto.ilimitado ?? 0) === 1
                          ? "Ilimitado"
                          : Number(produto.estoque ?? 0)}
                      </strong>
                    </div>

                    <div>
                      <span>Slug</span>
                      <strong>{produto.slug || "—"}</strong>
                    </div>
                  </div>

                  <div className="acoes-card">
                    <button className="btn btn-soft" onClick={() => abrirModalEditar(produto)}>
                      Editar
                    </button>

                    <button className="btn btn-soft" onClick={() => abrirModalImagens(produto)}>
                      Imagens
                    </button>

                    <button className="btn btn-danger" onClick={() => excluirProduto(produto)}>
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalProdutoOpen && (
        <>
          <div className="overlay-fundo" onClick={fecharModalProduto} />
          <div className="modal-wrapper">
            <div className="modal modal-lg">
              <div className="modal-header">
                <h2>{modoEdicao ? "Editar produto" : "Cadastrar produto"}</h2>
                <button className="btn-fechar" onClick={fecharModalProduto} type="button">
                  ×
                </button>
              </div>

              <form onSubmit={salvarProduto} className="modal-body">
                <div className="form-grid">
                  <div className="campo campo-full">
                    <label>Nome</label>
                    <input
                      className="input"
                      value={form.nome}
                      onChange={handleNomeChange}
                      placeholder="Nome do produto"
                    />
                  </div>

                  <div className="campo">
                    <label>Slug</label>
                    <input
                      className="input"
                      value={form.slug}
                      onChange={(e) => handleChange("slug", slugify(e.target.value))}
                      placeholder="slug-do-produto"
                    />
                  </div>

                  <div className="campo">
                    <label>SKU</label>
                    <input
                      className="input"
                      value={form.sku}
                      onChange={(e) => handleChange("sku", e.target.value)}
                      placeholder="SKU"
                    />
                  </div>

                  <div className="campo">
                    <label>Modelo</label>
                    <input
                      className="input"
                      value={form.modelo}
                      onChange={(e) => handleChange("modelo", e.target.value)}
                      placeholder="Modelo"
                    />
                  </div>

                  <div className="campo">
                    <label>Preço</label>
                    <input
                      className="input"
                      value={form.preco}
                      onChange={(e) => handleChange("preco", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="campo">
                    <label>Preço promocional</label>
                    <input
                      className="input"
                      value={form.preco_promocional}
                      onChange={(e) => handleChange("preco_promocional", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="campo">
                    <label>Estoque</label>
                    <input
                      className="input"
                      type="number"
                      min="0"
                      value={form.estoque}
                      onChange={(e) => handleChange("estoque", e.target.value)}
                    />
                  </div>

                  <div className="campo">
                    <label>Categoria</label>
                    <select
                      className="select"
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

                  <div className="campo">
                    <label>Status</label>
                    <select
                      className="select"
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

                  <div className="campo campo-full">
                    <label>Descrição</label>
                    <textarea
                      className="textarea"
                      rows={4}
                      value={form.descricao}
                      onChange={(e) => handleChange("descricao", e.target.value)}
                      placeholder="Descrição do produto"
                    />
                  </div>

                  <div className="campo">
                    <label>Imagem principal</label>
                    <input
                      className="input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleChange("imagem", e.target.files?.[0] || null)}
                    />
                  </div>

                  <div className="campo">
                    <label>Prévia</label>
                    <div className="preview">
                      {previewImagem ? (
                        <img src={previewImagem} alt="Prévia" className="preview-img" />
                      ) : (
                        <span>Sem imagem</span>
                      )}
                    </div>
                  </div>

                  <div className="campo checks">
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={form.catalogo}
                        onChange={(e) => handleChange("catalogo", e.target.checked)}
                      />
                      No catálogo
                    </label>

                    <label className="check">
                      <input
                        type="checkbox"
                        checked={form.ilimitado}
                        onChange={(e) => handleChange("ilimitado", e.target.checked)}
                      />
                      Estoque ilimitado
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-soft" onClick={fecharModalProduto}>
                    Cancelar
                  </button>

                  <button type="submit" className="btn btn-primary" disabled={salvandoProduto}>
                    {salvandoProduto
                      ? "Salvando..."
                      : modoEdicao
                      ? "Salvar alterações"
                      : "Cadastrar produto"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {modalImagemOpen && (
        <>
          <div className="overlay-fundo" onClick={fecharModalImagens} />
          <div className="modal-wrapper">
            <div className="modal modal-lg">
              <div className="modal-header">
                <div>
                  <h2>Imagens do produto</h2>
                  <p className="submodal">{produtoImagemAtual?.nome}</p>
                </div>

                <button className="btn-fechar" onClick={fecharModalImagens} type="button">
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="upload-box">
                  <label>Adicionar imagens</label>
                  <input
                    className="input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setNovasImagens(Array.from(e.target.files || []))}
                  />

                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={enviarImagens}
                    disabled={enviandoImagens}
                  >
                    {enviandoImagens ? "Enviando..." : "Enviar imagens"}
                  </button>
                </div>

                {erroImagem ? <div className="estado">{erroImagem}</div> : null}

                <div className="grid-imagens">
                  {galeria.length > 0 ? (
                    galeria.map((img, index) => (
                      <div className="card-imagem" key={`${img.imagem}-${index}`}>
                        <img
                          src={getImagemUrl(img.imagem)}
                          alt={`Imagem ${index + 1}`}
                          className="img-galeria"
                        />

                        <div className="acoes-imagem">
                          <button
                            className="btn btn-soft"
                            type="button"
                            onClick={() => definirPrincipal(img.imagem)}
                          >
                            Principal
                          </button>

                          <button
                            className="btn btn-danger"
                            type="button"
                            onClick={() => removerImagem(img.id_imagem)}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="estado">Nenhuma imagem cadastrada.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .painel-produtos {
          padding: 24px;
          background: linear-gradient(180deg, #faf7ff 0%, #f4f4f8 100%);
          min-height: 100vh;
        }

        .topo {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 20px;
        }

        .topo h1 {
          margin: 8px 0 6px;
          font-size: 34px;
          font-weight: 900;
          color: #1f2937;
          letter-spacing: -0.4px;
        }

        .topo p {
          margin: 0;
          color: #6b7280;
          font-weight: 500;
        }

        .tag-topo {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 999px;
          background: #ede9fe;
          color: #6d28d9;
          font-size: 12px;
          font-weight: 800;
        }

        .filtros {
          display: grid;
          grid-template-columns: 1.4fr 0.9fr 180px;
          gap: 14px;
          margin-bottom: 16px;
        }

        .paginacao-select {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .paginacao-select label {
          font-size: 13px;
          font-weight: 700;
          color: #374151;
        }

        .resumo {
          margin-bottom: 18px;
          color: #4b5563;
          font-weight: 600;
        }

        .input,
        .select,
        .textarea {
          width: 100%;
          border: 1px solid #ddd6fe;
          background: #fff;
          border-radius: 16px;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
        }

        .input:focus,
        .select:focus,
        .textarea:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.12);
        }

        .grid-cards {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 18px;
        }

        .card-produto {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid #ececf2;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
        }

        .imagem-box {
          position: relative;
          height: 210px;
          background: linear-gradient(180deg, #f8f9ff 0%, #eef2ff 100%);
        }

        .imagem-produto {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .sem-imagem {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #6b7280;
          font-weight: 700;
        }

        .badges {
          position: absolute;
          top: 10px;
          left: 10px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .badge {
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          color: #fff;
        }

        .badge.destaque {
          background: #f59e0b;
        }

        .badge.catalogo {
          background: #10b981;
        }

        .conteudo-card {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .categoria {
          font-size: 11px;
          font-weight: 800;
          color: #8b5cf6;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .conteudo-card h3 {
          margin: 0;
          font-size: 18px;
          line-height: 1.3;
          color: #111827;
        }

        .descricao {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.55;
          min-height: 44px;
        }

        .linhas-info {
          display: grid;
          gap: 10px;
        }

        .linhas-info div {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 14px;
          background: #f9fafb;
          border: 1px solid #ececf2;
        }

        .linhas-info span {
          color: #6b7280;
          font-size: 13px;
          font-weight: 700;
        }

        .linhas-info strong {
          color: #111827;
          font-size: 13px;
          font-weight: 900;
          text-align: right;
          word-break: break-word;
        }

        .acoes-card {
          margin-top: auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .btn {
          border: none;
          border-radius: 14px;
          padding: 11px 14px;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.18s ease;
          text-align: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
          color: #fff;
        }

        .btn-soft {
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #e5e7eb;
        }

        .btn-danger {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .estado {
          background: #fff;
          border: 1px solid #ececf2;
          border-radius: 18px;
          padding: 28px;
          text-align: center;
          color: #6b7280;
          font-weight: 700;
        }

        .overlay-fundo {
          position: fixed;
          inset: 0;
          background: rgba(17, 24, 39, 0.28);
          z-index: 9998;
        }

        .modal-wrapper {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          pointer-events: none;
        }

        .modal {
          width: 100%;
          background: #ffffff;
          border-radius: 26px;
          overflow: hidden;
          border: 1px solid #ececf2;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
          pointer-events: auto;
        }

        .modal-lg {
          max-width: 980px;
        }

        .modal-header {
          padding: 20px 22px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          border-bottom: 1px solid #ececf2;
          background: linear-gradient(180deg, #fcfbff 0%, #ffffff 100%);
        }

        .modal-header h2 {
          margin: 0;
          color: #111827;
          font-size: 24px;
          font-weight: 900;
        }

        .submodal {
          margin: 6px 0 0;
          color: #6b7280;
          font-size: 14px;
          font-weight: 600;
        }

        .btn-fechar {
          width: 42px;
          height: 42px;
          border: none;
          border-radius: 14px;
          background: #f3f4f6;
          color: #111827;
          font-size: 24px;
          cursor: pointer;
        }

        .modal-body {
          padding: 22px;
          max-height: 78vh;
          overflow: auto;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .campo-full {
          grid-column: 1 / -1;
        }

        .campo label {
          font-size: 13px;
          font-weight: 800;
          color: #374151;
        }

        .checks {
          grid-column: 1 / -1;
          flex-direction: row;
          align-items: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .check {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: #374151;
        }

        .preview {
          min-height: 180px;
          border-radius: 18px;
          border: 1px dashed #d1d5db;
          background: #f9fafb;
          display: grid;
          place-items: center;
          color: #6b7280;
          overflow: hidden;
        }

        .preview-img {
          width: 100%;
          height: 180px;
          object-fit: cover;
          display: block;
        }

        .modal-footer {
          margin-top: 22px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .upload-box {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }

        .upload-box label {
          font-size: 14px;
          font-weight: 800;
          color: #374151;
        }

        .grid-imagens {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .card-imagem {
          border: 1px solid #ececf2;
          border-radius: 18px;
          overflow: hidden;
          background: #fff;
        }

        .img-galeria {
          width: 100%;
          height: 220px;
          object-fit: cover;
          display: block;
          background: #f9fafb;
        }

        .acoes-imagem {
          padding: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 1400px) {
          .grid-cards {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 1200px) {
          .grid-cards {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .filtros {
            grid-template-columns: 1fr;
          }

          .grid-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .form-grid,
          .grid-imagens {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .painel-produtos {
            padding: 16px;
          }

          .topo {
            flex-direction: column;
          }

          .grid-cards {
            grid-template-columns: 1fr;
          }

          .acoes-card {
            grid-template-columns: 1fr;
          }

          .modal-footer {
            flex-direction: column;
          }

          .modal-wrapper {
            padding: 12px;
            align-items: flex-end;
          }

          .modal {
            border-radius: 24px 24px 0 0;
          }
        }
      `}</style>
    </>
  );
}