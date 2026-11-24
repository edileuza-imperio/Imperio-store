"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";

import { useCallback, useEffect, useMemo, useState } from "react";

interface Produto {
  id_produto: number;
  nome: string;
  sku?: string;
  preco?: number | string;
  status_id?: number;
  ativo?: boolean | number;
}

interface Variacao {
  id_variacao: number;
  produto_id: number;
  sku: string;
  nome: string;
  preco: number | string;
  custo?: number | string;
  controlar_estoque: boolean | number;
  ativo: boolean | number;
  status_id?: number;
  criado_em?: string;
  atributos?: {
    id_atributo?: number;
    atributo_id?: number;
    nome?: string;
    valor: string;
  }[];
}

interface Formulario {
  nome: string;
  sku: string;
  preco: string;
  custo: string;
  controlar_estoque: boolean;
  ativo: boolean;
}

const FORM_INICIAL: Formulario = {
  nome: "",
  sku: "",
  preco: "",
  custo: "",
  controlar_estoque: true,
  ativo: true,
};

function gerarSkuAleatorio(
  skusExistentes: Array<string | null | undefined> = [],
) {
  // Alguns produtos/variações podem vir sem SKU da API. Ignore valores nulos,
  // undefined ou que não sejam strings para evitar erro ao chamar trim().
  const existentes = new Set(
    skusExistentes
      .filter(
        (sku): sku is string =>
          typeof sku === "string" && sku.trim().length > 0,
      )
      .map((sku) => sku.trim().toUpperCase()),
  );
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  for (let tentativa = 0; tentativa < 20; tentativa++) {
    let codigo = "VAR-";
    for (let i = 0; i < 8; i++) {
      codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    if (!existentes.has(codigo)) return codigo;
  }

  return `VAR-${Date.now().toString(36).toUpperCase()}`;
}

function extrairLista<T>(payload: any, chaves: string[]): T[] {
  const candidatos: any[] = [];
  for (const chave of chaves) {
    candidatos.push(
      payload?.dados?.[chave],
      payload?.data?.[chave],
      payload?.[chave],
    );
  }
  candidatos.push(payload?.dados, payload?.data, payload);
  return (candidatos.find(Array.isArray) || []) as T[];
}

function ativo(valor: any) {
  return valor === true || valor === 1 || valor === "1" || valor === "ativo";
}

function moeda(valor: number | string | undefined) {
  const numero = Number(valor ?? 0);
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function VariacoesPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoId, setProdutoId] = useState("");
  const [variacoes, setVariacoes] = useState<Variacao[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [carregandoVariacoes, setCarregandoVariacoes] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [buscaProduto, setBuscaProduto] = useState("");
  const [buscaVariacao, setBuscaVariacao] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "ativos" | "inativos">(
    "todos",
  );
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<Formulario>(FORM_INICIAL);

  const produtoSelecionado = produtos.find(
    (produto) => String(produto.id_produto) === produtoId,
  );

  const carregarProdutos = useCallback(async () => {
    setCarregandoProdutos(true);
    try {
      const resposta = await conexao.get(ROTAS.PRODUTOS.PAINEL.LISTAR, {
        withCredentials: true,
      });
      const lista = extrairLista<Produto>(resposta.data, ["produtos"]);
      setProdutos(lista);
      setProdutoId(
        (atual) => atual || (lista.length ? String(lista[0].id_produto) : ""),
      );
    } catch (error: any) {
      setErro(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Não foi possível carregar os produtos.",
      );
    } finally {
      setCarregandoProdutos(false);
    }
  }, []);

  const carregarVariacoes = useCallback(async (id: string) => {
    if (!id) {
      setVariacoes([]);
      return;
    }
    setCarregandoVariacoes(true);
    setErro("");
    try {
      const url = ROTAS.PRODUTOS.PAINEL.VARIACOES.LISTAR(Number(id));
      const resposta = await conexao.get(url, { withCredentials: true });

      // A API pode devolver o identificador como id_variacao ou simplesmente id.
      // Normalizamos para id_variacao, usado nas rotas de edição e exclusão.
      const lista = extrairLista<any>(resposta.data, ["variacoes"])
        .map((item) => ({
          ...item,
          id_variacao: Number(
            item?.id_variacao ??
              item?.variacao_id ??
              item?.id_variacao_produto ??
              item?.id,
          ),
          sku: typeof item?.sku === "string" ? item.sku : "",
          nome: String(item?.nome ?? item?.nome_variacao ?? ""),
        }))
        .filter(
          (item) => Number.isInteger(item.id_variacao) && item.id_variacao > 0,
        );

      setVariacoes(lista);
    } catch (error: any) {
      setVariacoes([]);
      setErro(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Não foi possível carregar as variações deste produto.",
      );
    } finally {
      setCarregandoVariacoes(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  useEffect(() => {
    if (produtoId) carregarVariacoes(produtoId);
    else setVariacoes([]);
  }, [produtoId, carregarVariacoes]);

  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.trim().toLowerCase();
    return produtos.filter((produto) =>
      `${produto.nome} ${produto.sku ?? ""} ${produto.id_produto}`
        .toLowerCase()
        .includes(termo),
    );
  }, [produtos, buscaProduto]);

  const variacoesFiltradas = useMemo(() => {
    const termo = buscaVariacao.trim().toLowerCase();
    return variacoes.filter((variacao) => {
      const buscaOk = `${variacao.nome} ${variacao.sku}`
        .toLowerCase()
        .includes(termo);
      const statusOk =
        filtro === "todos" ||
        (filtro === "ativos" && ativo(variacao.ativo)) ||
        (filtro === "inativos" && !ativo(variacao.ativo));
      return buscaOk && statusOk;
    });
  }, [variacoes, buscaVariacao, filtro]);

  const ativos = variacoes.filter((item) => ativo(item.ativo)).length;
  const inativos = variacoes.length - ativos;

  function abrirNovo() {
    setEditando(null);
    setForm({
      ...FORM_INICIAL,
      sku: gerarSkuAleatorio(variacoes.map((item) => item?.sku)),
    });
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function gerarNovoSku() {
    campo("sku", gerarSkuAleatorio(variacoes.map((item) => item?.sku)));
  }

  function abrirEdicao(variacao: Variacao) {
    if (!Number.isInteger(variacao.id_variacao) || variacao.id_variacao <= 0) {
      setErro(
        "Esta variação não possui um ID válido retornado pela API. Confira o campo id_variacao no JSON.",
      );
      return;
    }
    setEditando(variacao.id_variacao);
    setForm({
      nome: variacao.nome ?? "",
      sku: variacao.sku ?? "",
      preco: String(variacao.preco ?? ""),
      custo: String(variacao.custo ?? ""),
      controlar_estoque: ativo(variacao.controlar_estoque),
      ativo: ativo(variacao.ativo),
    });
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function campo<K extends keyof Formulario>(chave: K, valor: Formulario[K]) {
    setForm((atual) => ({ ...atual, [chave]: valor }));
  }

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!produtoId) {
      setErro("Selecione um produto antes de cadastrar uma variação.");
      return;
    }
    if (editando !== null && (!Number.isInteger(editando) || editando <= 0)) {
      setErro(
        "Não foi possível atualizar: o ID da variação é inválido. Recarregue a lista.",
      );
      return;
    }
    if (!form.nome.trim() || !form.sku?.trim() || !form.preco.trim()) {
      setErro("Preencha o nome, SKU e preço da variação.");
      return;
    }
    const preco = Number(form.preco.replace(",", "."));
    const custo = form.custo.trim()
      ? Number(form.custo.replace(",", "."))
      : null;
    if (
      !Number.isFinite(preco) ||
      preco < 0 ||
      (custo !== null && (!Number.isFinite(custo) || custo < 0))
    ) {
      setErro("Informe valores válidos para preço e custo.");
      return;
    }

    const payload = {
      nome: form.nome.trim(),
      sku: form.sku.trim(),
      preco,
      custo,
      controlar_estoque: form.controlar_estoque,
      ativo: form.ativo,
      status_id: form.ativo ? 1 : 0,
    };

    setSalvando(true);
    setErro("");
    setSucesso("");
    try {
      if (editando !== null) {
        await conexao.put(
          ROTAS.PRODUTOS.PAINEL.VARIACOES.ATUALIZAR(
            Number(produtoId),
            editando,
          ),
          payload,
          { withCredentials: true },
        );
        setSucesso("Variação atualizada com sucesso.");
      } else {
        await conexao.post(
          ROTAS.PRODUTOS.PAINEL.VARIACOES.CADASTRAR(Number(produtoId)),
          payload,
          { withCredentials: true },
        );
        setSucesso("Variação cadastrada com sucesso.");
      }
      setModalAberto(false);
      await carregarVariacoes(produtoId);
    } catch (error: any) {
      setErro(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Não foi possível salvar a variação.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(variacao: Variacao) {
    if (!produtoId) return;

    if (!Number.isInteger(variacao.id_variacao) || variacao.id_variacao <= 0) {
      setErro(
        "Não foi possível excluir: a API não retornou um ID válido para esta variação.",
      );
      return;
    }

    if (!window.confirm(`Deseja excluir a variação "${variacao.nome}"?`))
      return;
    setErro("");
    setSucesso("");
    try {
      await conexao.delete(
        ROTAS.PRODUTOS.PAINEL.VARIACOES.EXCLUIR(
          Number(produtoId),
          variacao.id_variacao,
        ),
        { withCredentials: true },
      );
      setSucesso("Variação excluída com sucesso.");
      await carregarVariacoes(produtoId);
    } catch (error: any) {
      setErro(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          "Não foi possível excluir a variação.",
      );
    }
  }

  return (
    <main className="variacoes-page">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="page-content">
        <header className="page-header">
          <div>
            <span className="eyebrow">
              <i /> CATÁLOGO / ORGANIZAÇÃO
            </span>
            <h1>Variações de produtos</h1>
            <p>
              Selecione um produto para cadastrar e gerenciar suas variações,
              SKUs e preços.
            </p>
          </div>
          <button
            className="primary-button"
            onClick={abrirNovo}
            disabled={!produtoId || carregandoProdutos}
          >
            <span className="plus">＋</span> Nova variação
          </button>
        </header>

        {erro && !modalAberto && <div className="alert error">{erro}</div>}
        {sucesso && <div className="alert success">{sucesso}</div>}

        <section className="product-selector">
          <div className="selector-heading">
            <div className="selector-icon">
              <span>▣</span>
            </div>
            <div>
              <strong>Produto selecionado</strong>
              <small>Escolha o produto que receberá as variações.</small>
            </div>
          </div>
          <div className="selector-fields">
            <div className="product-search">
              <span>⌕</span>
              <input
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
                placeholder="Filtrar produtos por nome ou SKU..."
              />
            </div>
            <select
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              disabled={carregandoProdutos || produtos.length === 0}
            >
              {carregandoProdutos ? (
                <option value="">Carregando produtos...</option>
              ) : produtos.length === 0 ? (
                <option value="">Nenhum produto cadastrado</option>
              ) : produtosFiltrados.length === 0 ? (
                <option value="">Nenhum resultado para a busca</option>
              ) : (
                produtosFiltrados.map((produto) => (
                  <option key={produto.id_produto} value={produto.id_produto}>
                    {produto.nome}{" "}
                    {produto.sku
                      ? `— ${produto.sku}`
                      : `— #${produto.id_produto}`}
                  </option>
                ))
              )}
            </select>
          </div>
          {produtoSelecionado && (
            <div className="selected-product">
              <span className="selected-dot" />
              <span>Gerenciando variações de:</span>
              <strong>{produtoSelecionado.nome}</strong>
              {produtoSelecionado.sku && <code>{produtoSelecionado.sku}</code>}
            </div>
          )}
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon purple">◇</div>
            <div>
              <span>Variações cadastradas</span>
              <strong>{variacoes.length}</strong>
              <small>Para o produto selecionado</small>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-icon green">✓</div>
            <div>
              <span>Variações ativas</span>
              <strong>{ativos}</strong>
              <small>Disponíveis para utilização</small>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-icon red">⊘</div>
            <div>
              <span>Variações inativas</span>
              <strong>{inativos}</strong>
              <small>Desativadas</small>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-icon amber">▤</div>
            <div>
              <span>Preço do produto</span>
              <strong className="price-stat">
                {produtoSelecionado ? moeda(produtoSelecionado.preco) : "—"}
              </strong>
              <small>Preço base cadastrado</small>
            </div>
          </article>
        </section>

        <section className="content-card">
          <div className="toolbar">
            <div>
              <h2>Variações cadastradas</h2>
              <p>As variações pertencem ao produto selecionado acima.</p>
            </div>
            <div className="toolbar-controls">
              <div className="search-box">
                <span>⌕</span>
                <input
                  value={buscaVariacao}
                  onChange={(e) => setBuscaVariacao(e.target.value)}
                  placeholder="Buscar por nome ou SKU..."
                />
              </div>
              <div className="filter-tabs">
                <button
                  className={filtro === "todos" ? "selected" : ""}
                  onClick={() => setFiltro("todos")}
                >
                  Todas
                </button>
                <button
                  className={filtro === "ativos" ? "selected" : ""}
                  onClick={() => setFiltro("ativos")}
                >
                  Ativas
                </button>
                <button
                  className={filtro === "inativos" ? "selected" : ""}
                  onClick={() => setFiltro("inativos")}
                >
                  Inativas
                </button>
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>VARIAÇÃO</th>
                  <th>SKU</th>
                  <th>PREÇO</th>
                  <th>CUSTO</th>
                  <th>ESTOQUE</th>
                  <th>STATUS</th>
                  <th className="right">AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {carregandoVariacoes ? (
                  <tr>
                    <td colSpan={7} className="empty">
                      <span className="loader" />
                      Carregando variações...
                    </td>
                  </tr>
                ) : !produtoId ? (
                  <tr>
                    <td colSpan={7} className="empty">
                      Cadastre um produto para começar.
                    </td>
                  </tr>
                ) : variacoesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty">
                      <strong>Nenhuma variação encontrada</strong>
                      <span>
                        Selecione outro produto ou cadastre a primeira variação.
                      </span>
                    </td>
                  </tr>
                ) : (
                  variacoesFiltradas.map((variacao) => (
                    <tr key={variacao.id_variacao}>
                      <td>
                        <div className="variation-name">
                          <span className="variation-icon">◇</span>
                          <div>
                            <strong>{variacao.nome}</strong>
                            <small>ID #{variacao.id_variacao}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code>{variacao.sku || "—"}</code>
                      </td>
                      <td className="money">{moeda(variacao.preco)}</td>
                      <td>
                        {variacao.custo !== null &&
                        variacao.custo !== undefined ? (
                          moeda(variacao.custo)
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`stock-pill ${ativo(variacao.controlar_estoque) ? "stock-on" : "stock-off"}`}
                        >
                          {ativo(variacao.controlar_estoque)
                            ? "Controlado"
                            : "Não controlado"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status ${ativo(variacao.ativo) ? "is-active" : "is-inactive"}`}
                        >
                          <i />
                          {ativo(variacao.ativo) ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            title="Editar"
                            onClick={() => abrirEdicao(variacao)}
                          >
                            ✎
                          </button>
                          <button
                            title="Excluir"
                            className="delete"
                            onClick={() => excluir(variacao)}
                          >
                            ⌫
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <footer className="table-footer">
            <span>
              Exibindo <b>{variacoesFiltradas.length}</b> de{" "}
              <b>{variacoes.length}</b> variações
            </span>
            <button
              onClick={() => produtoId && carregarVariacoes(produtoId)}
              disabled={!produtoId || carregandoVariacoes}
            >
              ↻ Atualizar lista
            </button>
          </footer>
        </section>

        <section className="info-card">
          <span className="info-icon">✦</span>
          <div>
            <strong>Como cadastrar uma variação?</strong>
            <p>
              Primeiro selecione o produto. Depois clique em{" "}
              <b>Nova variação</b> e informe o nome (por exemplo, “Preto / M”),
              um SKU próprio, preço e custo. Os atributos e valores específicos
              podem ser associados à variação conforme as rotas de atributos da
              API.
            </p>
          </div>
        </section>
      </div>

      {modalAberto && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setModalAberto(false);
          }}
        >
          <section className="modal">
            <header className="modal-header">
              <div>
                <span className="eyebrow">PRODUTO / VARIAÇÕES</span>
                <h2>
                  {editando !== null ? "Editar variação" : "Cadastrar variação"}
                </h2>
                <p>{produtoSelecionado?.nome || "Produto selecionado"}</p>
              </div>
              <button className="close" onClick={() => setModalAberto(false)}>
                ×
              </button>
            </header>
            <form onSubmit={salvar}>
              {erro && <div className="alert error">{erro}</div>}
              <div className="form-grid">
                <label className="field full">
                  <span>
                    Nome da variação <b>*</b>
                  </span>
                  <input
                    value={form.nome}
                    onChange={(e) => campo("nome", e.target.value)}
                    placeholder="Ex.: Preto / M, 500 ml, Kit com 3 unidades"
                    required
                  />
                </label>
                <div className="field">
                  <span>SKU automático</span>
                  <div className="sku-control">
                    <input value={form.sku} readOnly aria-readonly="true" />
                    {editando === null && (
                      <button
                        type="button"
                        className="regenerate-sku"
                        onClick={gerarNovoSku}
                        title="Gerar outro SKU"
                      >
                        ↻
                      </button>
                    )}
                  </div>
                  <small>
                    Gerado aleatoriamente pelo sistema. Não é necessário
                    preencher manualmente.
                  </small>
                </div>
                <label className="field">
                  <span>
                    Preço de venda (R$) <b>*</b>
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.preco}
                    onChange={(e) => campo("preco", e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </label>
                <label className="field">
                  <span>Custo (R$)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.custo}
                    onChange={(e) => campo("custo", e.target.value)}
                    placeholder="0,00"
                  />
                </label>
                <div className="field">
                  <span>Controle de estoque</span>
                  <button
                    type="button"
                    className={`toggle-line ${form.controlar_estoque ? "enabled" : ""}`}
                    onClick={() =>
                      campo("controlar_estoque", !form.controlar_estoque)
                    }
                  >
                    <i />
                    {form.controlar_estoque ? "Ativado" : "Desativado"}
                  </button>
                </div>
                <div className="field">
                  <span>Status</span>
                  <button
                    type="button"
                    className={`toggle-line ${form.ativo ? "enabled" : ""}`}
                    onClick={() => campo("ativo", !form.ativo)}
                  >
                    <i />
                    {form.ativo ? "Ativa" : "Inativa"}
                  </button>
                </div>
              </div>
              <footer className="modal-footer">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setModalAberto(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : editando !== null
                      ? "Salvar alterações"
                      : "Cadastrar variação"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <style jsx>{`
        .variacoes-page {
          min-height: 100vh;
          background: #100d13;
          color: #f5edf4;
          padding: 34px 30px 55px;
          position: relative;
          overflow: hidden;
        }
        .glow {
          position: absolute;
          pointer-events: none;
          filter: blur(90px);
          opacity: 0.13;
          border-radius: 50%;
          width: 360px;
          height: 360px;
        }
        .glow-one {
          background: #a13d79;
          top: -170px;
          right: 8%;
        }
        .glow-two {
          background: #592c78;
          bottom: 8%;
          left: -230px;
        }
        .page-content {
          max-width: 1500px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 25px;
        }
        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #c18bad;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }
        .eyebrow i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d477ad;
          box-shadow: 0 0 12px #d477ad;
        }
        h1 {
          font-size: 32px;
          letter-spacing: -1px;
          margin: 9px 0 5px;
          font-weight: 750;
        }
        .page-header p {
          margin: 0;
          color: #948895;
          font-size: 13px;
        }
        button {
          font: inherit;
          cursor: pointer;
        }
        .primary-button {
          border: 1px solid #b45c91;
          background: linear-gradient(135deg, #a94d83, #77345f);
          color: white;
          border-radius: 9px;
          padding: 12px 17px;
          font-size: 12px;
          font-weight: 700;
          box-shadow: 0 7px 22px #8d35652b;
          transition: 0.2s;
        }
        .primary-button:hover {
          filter: brightness(1.13);
          transform: translateY(-1px);
        }
        .primary-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .plus {
          font-size: 17px;
          vertical-align: -1px;
          margin-right: 5px;
        }
        .product-selector {
          padding: 19px 21px;
          background: linear-gradient(145deg, #211923, #19141c);
          border: 1px solid #503247;
          border-radius: 12px;
          margin-bottom: 17px;
          box-shadow: 0 10px 30px #0002;
        }
        .selector-heading {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 15px;
        }
        .selector-icon {
          width: 37px;
          height: 37px;
          border-radius: 9px;
          background: #713d6238;
          color: #dc9cbe;
          display: grid;
          place-items: center;
          font-size: 19px;
        }
        .selector-heading strong,
        .selector-heading small {
          display: block;
        }
        .selector-heading strong {
          font-size: 12px;
        }
        .selector-heading small {
          font-size: 10px;
          color: #958795;
          margin-top: 4px;
        }
        .selector-fields {
          display: grid;
          grid-template-columns: minmax(220px, 0.8fr) minmax(280px, 1.2fr);
          gap: 11px;
        }
        .product-search,
        .selector-fields select {
          height: 42px;
          border: 1px solid #443447;
          background: #100d13;
          border-radius: 7px;
          display: flex;
          align-items: center;
          padding: 0 12px;
          color: #f2e7f0;
        }
        .product-search {
          gap: 9px;
        }
        .product-search span {
          color: #c18bad;
          font-size: 20px;
        }
        .product-search input {
          background: transparent;
          border: 0;
          outline: 0;
          color: #f2e7f0;
          width: 100%;
          font-size: 11px;
        }
        .product-search input::placeholder {
          color: #766b7a;
        }
        .selector-fields select {
          width: 100%;
          font-size: 11px;
          outline: 0;
        }
        .selected-product {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 13px;
          color: #8f8291;
          font-size: 10px;
          flex-wrap: wrap;
        }
        .selected-product strong {
          color: #e8d7e5;
        }
        .selected-product code {
          background: #392538;
          color: #d7a3c4;
          padding: 4px 6px;
          border-radius: 4px;
        }
        .selected-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6ed59a;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 20px;
        }
        .stat-card {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 17px;
          background: linear-gradient(145deg, #1c1720, #17131a);
          border: 1px solid #302431;
          border-radius: 11px;
          min-height: 98px;
        }
        .stat-icon {
          width: 39px;
          height: 39px;
          border-radius: 10px;
          display: grid;
          place-items: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .purple {
          background: #693b7040;
          color: #d39bd7;
        }
        .green {
          background: #277d5630;
          color: #70d7a1;
        }
        .red {
          background: #9d3d5230;
          color: #e88b9b;
        }
        .amber {
          background: #a4772d30;
          color: #e9bd70;
        }
        .stat-card span,
        .stat-card small {
          display: block;
          color: #a99daa;
          font-size: 10px;
        }
        .stat-card strong {
          display: block;
          font-size: 23px;
          margin: 3px 0;
          letter-spacing: -0.5px;
        }
        .stat-card small {
          font-size: 9px;
          color: #746b78;
        }
        .stat-card .price-stat {
          font-size: 18px;
        }
        .content-card {
          background: #17131b;
          border: 1px solid #302431;
          border-radius: 13px;
          overflow: hidden;
        }
        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          padding: 21px 22px;
          border-bottom: 1px solid #302431;
        }
        .toolbar h2 {
          font-size: 15px;
          margin: 0 0 5px;
        }
        .toolbar p {
          margin: 0;
          color: #948895;
          font-size: 11px;
        }
        .toolbar-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .search-box {
          height: 36px;
          width: 215px;
          border: 1px solid #3b3040;
          background: #100d13;
          border-radius: 7px;
          display: flex;
          align-items: center;
          padding: 0 10px;
          gap: 8px;
          color: #b878a2;
        }
        .search-box span {
          font-size: 21px;
        }
        .search-box input {
          background: transparent;
          border: 0;
          outline: 0;
          color: #f4eaf2;
          width: 100%;
          font-size: 10px;
        }
        .search-box input::placeholder {
          color: #706675;
        }
        .filter-tabs {
          display: flex;
          padding: 3px;
          background: #100d13;
          border: 1px solid #302431;
          border-radius: 7px;
        }
        .filter-tabs button {
          border: 0;
          background: transparent;
          color: #928694;
          padding: 7px 9px;
          font-size: 10px;
          border-radius: 5px;
        }
        .filter-tabs button.selected {
          background: #633451;
          color: #fff;
        }
        .table-wrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }
        th {
          text-align: left;
          color: #817483;
          font-size: 9px;
          letter-spacing: 1px;
          font-weight: 800;
          padding: 14px 17px;
          background: #1b1620;
        }
        td {
          padding: 13px 17px;
          border-top: 1px solid #2b222f;
          font-size: 11px;
          color: #d8cbd7;
        }
        tbody tr:hover {
          background: #211923;
        }
        .variation-name {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .variation-icon {
          width: 31px;
          height: 31px;
          border-radius: 8px;
          background: #713d6238;
          color: #d58db7;
          display: grid;
          place-items: center;
          font-size: 17px;
        }
        .variation-name strong {
          display: block;
          color: #f3eaf1;
          font-size: 11px;
        }
        .variation-name small {
          display: block;
          color: #766b7a;
          font-size: 9px;
          margin-top: 4px;
        }
        td code {
          font-size: 10px;
          color: #d7a3c4;
          background: #392538;
          padding: 5px 7px;
          border-radius: 5px;
        }
        .money {
          color: #e5b4d1;
          font-weight: 700;
        }
        .muted {
          color: #716875;
        }
        .stock-pill {
          display: inline-block;
          padding: 5px 7px;
          border-radius: 5px;
          font-size: 9px;
        }
        .stock-on {
          color: #8bd5aa;
          background: #23563b30;
        }
        .stock-off {
          color: #c1b5c3;
          background: #37303a;
        }
        .status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 10px;
        }
        .status i {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .is-active {
          color: #7cdaa8;
          background: #1c50362c;
        }
        .is-active i {
          background: #61d493;
        }
        .is-inactive {
          color: #d78c9b;
          background: #7c35422b;
        }
        .is-inactive i {
          background: #d9798b;
        }
        .right {
          text-align: right;
        }
        .actions {
          display: flex;
          justify-content: flex-end;
          gap: 6px;
        }
        .actions button {
          width: 29px;
          height: 29px;
          border: 1px solid #403143;
          background: #211a25;
          color: #cba8c0;
          border-radius: 6px;
        }
        .actions button:hover {
          background: #58314c;
          color: #fff;
        }
        .actions .delete {
          color: #d88796;
        }
        .empty {
          text-align: center !important;
          padding: 38px 15px !important;
          color: #928694 !important;
        }
        .empty strong,
        .empty span {
          display: block;
        }
        .empty strong {
          color: #d9cbd8;
          margin-bottom: 5px;
        }
        .empty span {
          font-size: 10px;
        }
        .loader {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid #5b4357;
          border-top-color: #d17eae;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .table-footer {
          padding: 13px 19px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #302431;
          color: #827786;
          font-size: 10px;
        }
        .table-footer b {
          color: #d8cbd7;
        }
        .table-footer button {
          background: transparent;
          border: 0;
          color: #c78db0;
          font-size: 10px;
        }
        .table-footer button:disabled {
          opacity: 0.5;
        }
        .info-card {
          display: flex;
          gap: 12px;
          margin-top: 16px;
          padding: 16px 18px;
          border: 1px solid #493044;
          background: #241a25;
          border-radius: 10px;
        }
        .info-icon {
          width: 31px;
          height: 31px;
          border-radius: 8px;
          background: #773d623d;
          color: #e1a2c7;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }
        .info-card strong {
          font-size: 12px;
        }
        .info-card p {
          font-size: 10px;
          line-height: 1.7;
          color: #a99baa;
          margin: 5px 0 0;
        }
        .info-card b {
          color: #e3c0d6;
        }
        .alert {
          padding: 10px 13px;
          border-radius: 7px;
          font-size: 11px;
          margin-bottom: 14px;
        }
        .error {
          background: #6f29352d;
          border: 1px solid #9d4b5a;
          color: #f0a4b0;
        }
        .success {
          background: #23563b30;
          border: 1px solid #397c56;
          color: #8ce0ae;
        }
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: #08060bbd;
          backdrop-filter: blur(5px);
          z-index: 50;
          display: grid;
          place-items: center;
          padding: 20px;
          overflow-y: auto;
        }
        .modal {
          width: min(600px, 100%);
          background: #1b1620;
          border: 1px solid #493447;
          border-radius: 14px;
          box-shadow: 0 25px 90px #0009;
          padding: 23px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 21px;
        }
        .modal-header h2 {
          font-size: 21px;
          margin: 7px 0 4px;
        }
        .modal-header p {
          font-size: 11px;
          color: #c18bad;
          margin: 0;
        }
        .close {
          width: 30px;
          height: 30px;
          border: 1px solid #443344;
          border-radius: 7px;
          background: #251c29;
          color: #cdb9ca;
          font-size: 21px;
          line-height: 1;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .field.full {
          grid-column: 1/-1;
        }
        .field > span {
          font-size: 11px;
          color: #d9cbd8;
          font-weight: 650;
        }
        .field > span b {
          color: #e38db7;
        }
        .field input {
          width: 100%;
          background: #100d13;
          border: 1px solid #403343;
          border-radius: 7px;
          padding: 11px;
          color: #f3eaf1;
          outline: 0;
          font: inherit;
          font-size: 11px;
        }
        .field input:focus {
          border-color: #b56a98;
          box-shadow: 0 0 0 2px #b56a9820;
        }
        .field input::placeholder {
          color: #6f6572;
        }
        .sku-control {
          display: flex;
          gap: 7px;
        }
        .sku-control input {
          flex: 1;
          color: #d7a3c4;
          background: #251b29;
          border-color: #594054;
          font-weight: 700;
          letter-spacing: 1px;
        }
        .regenerate-sku {
          width: 42px;
          flex-shrink: 0;
          border: 1px solid #65435b;
          background: #3a2637;
          color: #e2a6c8;
          border-radius: 7px;
          font-size: 19px;
        }
        .regenerate-sku:hover {
          background: #633451;
          color: #fff;
        }
        .field > small {
          color: #827786;
          font-size: 9px;
          line-height: 1.5;
        }
        .toggle-line {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #151018;
          border: 1px solid #403343;
          color: #a99baa;
          border-radius: 7px;
          padding: 10px;
          font-size: 10px;
          text-align: left;
        }
        .toggle-line i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #766b7a;
        }
        .toggle-line.enabled {
          color: #8bd5aa;
          border-color: #397c56;
        }
        .toggle-line.enabled i {
          background: #61d493;
        }
        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          margin-top: 23px;
          padding-top: 17px;
          border-top: 1px solid #352a39;
        }
        .secondary {
          background: #29212e;
          border: 1px solid #49384b;
          color: #cbbdca;
          border-radius: 8px;
          padding: 11px 15px;
          font-size: 11px;
        }
        @media (max-width: 1050px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .toolbar {
            align-items: flex-start;
            flex-direction: column;
          }
          .toolbar-controls {
            width: 100%;
            justify-content: space-between;
          }
        }
        @media (max-width: 680px) {
          .variacoes-page {
            padding: 23px 14px 40px;
          }
          .page-header {
            align-items: flex-start;
            flex-direction: column;
          }
          .page-header .primary-button {
            width: 100%;
          }
          .selector-fields {
            grid-template-columns: 1fr;
          }
          .stats-grid {
            gap: 9px;
          }
          .stat-card {
            padding: 12px;
            gap: 8px;
            min-height: 87px;
          }
          .stat-icon {
            width: 33px;
            height: 33px;
          }
          .stat-card strong {
            font-size: 20px;
          }
          .stat-card span {
            font-size: 9px;
          }
          .toolbar-controls {
            align-items: stretch;
            flex-direction: column;
          }
          .search-box {
            width: 100%;
          }
          .filter-tabs {
            width: 100%;
          }
          .filter-tabs button {
            flex: 1;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
          .field.full {
            grid-column: auto;
          }
          .modal {
            padding: 18px;
          }
          .modal-footer {
            flex-direction: column-reverse;
          }
          .modal-footer button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
