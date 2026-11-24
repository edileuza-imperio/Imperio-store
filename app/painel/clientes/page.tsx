"use client";

import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";

import { useAuth } from "@/components/contexts/AuthContext";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

interface Cliente {
  id_cliente: number;
  status_id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  documento: string | null;
  tipo_pessoa: "fisica" | "juridica";
  ativo: boolean;
  observacoes: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
}

interface FormularioCliente {
  status_id: number;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  tipo_pessoa: "fisica" | "juridica";
  ativo: boolean;
  observacoes: string;
}

type Filtro = "todos" | "ativos" | "inativos" | "fisica" | "juridica";

const FORM_INICIAL: FormularioCliente = {
  status_id: 1,
  nome: "",
  email: "",
  telefone: "",
  documento: "",
  tipo_pessoa: "fisica",
  ativo: true,
  observacoes: "",
};

function normalizarBooleano(valor: unknown): boolean {
  if (valor === true || valor === 1) return true;

  const texto = String(valor ?? "")
    .trim()
    .toLocaleUpperCase("pt-BR");

  return ["1", "TRUE", "ATIVO", "SIM", "YES"].includes(texto);
}

function pareceRegistroCliente(valor: unknown): boolean {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return false;
  }

  const item = valor as Record<string, unknown>;

  return (
    item.id_cliente !== undefined ||
    item.cliente_id !== undefined ||
    item.idCliente !== undefined ||
    (item.id !== undefined &&
      (item.nome !== undefined ||
        item.email !== undefined ||
        item.telefone !== undefined ||
        item.documento !== undefined))
  );
}

/**
 * Converte respostas JSON que eventualmente chegam como texto.
 * Algumas configurações de PHP/proxy podem devolver JSON serializado.
 */
function decodificarJsonSeNecessario(valor: unknown): unknown {
  let resultado = valor;

  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    if (typeof resultado !== "string") break;

    const texto = resultado.trim();
    if (!texto || (!texto.startsWith("{") && !texto.startsWith("["))) {
      break;
    }

    try {
      resultado = JSON.parse(texto);
    } catch {
      break;
    }
  }

  return resultado;
}

/**
 * Localiza clientes em respostas como:
 * { clientes: [...] }
 * { sucesso: true, dados: { clientes: [...] } }
 * { data: { clientes: [...] } }
 * Também aceita JSON serializado e objetos indexados.
 */
function localizarListaClientes(
  valor: unknown,
  chaveAtual = "",
  profundidade = 0,
  visitados = new WeakSet<object>(),
): unknown[] | null {
  if (profundidade > 9 || valor === null || valor === undefined) {
    return null;
  }

  const decodificado = decodificarJsonSeNecessario(valor);
  if (decodificado !== valor) {
    return localizarListaClientes(
      decodificado,
      chaveAtual,
      profundidade + 1,
      visitados,
    );
  }

  if (Array.isArray(valor)) {
    if (valor.length === 0) {
      return [
        "clientes",
        "lista_clientes",
        "listaClientes",
        "dados",
        "data",
        "resultado",
        "result",
        "registros",
        "itens",
        "items",
        "rows",
      ].includes(chaveAtual)
        ? valor
        : null;
    }

    return valor.some(pareceRegistroCliente) ? valor : null;
  }

  if (typeof valor !== "object") return null;

  const objeto = valor as Record<string, unknown>;
  if (visitados.has(objeto)) return null;
  visitados.add(objeto);

  const chavesPrioritarias = [
    "clientes",
    "lista_clientes",
    "listaClientes",
    "dados",
    "data",
    "resultado",
    "result",
    "registros",
    "itens",
    "items",
    "rows",
    "payload",
    "response",
    "body",
    "content",
  ];

  for (const chave of chavesPrioritarias) {
    if (!(chave in objeto)) continue;

    const encontrado = localizarListaClientes(
      objeto[chave],
      chave,
      profundidade + 1,
      visitados,
    );

    if (encontrado !== null) return encontrado;
  }

  for (const [chave, conteudo] of Object.entries(objeto)) {
    if (chavesPrioritarias.includes(chave)) continue;

    const encontrado = localizarListaClientes(
      conteudo,
      chave,
      profundidade + 1,
      visitados,
    );

    if (encontrado !== null) return encontrado;
  }

  // Algumas APIs devolvem uma lista indexada como objeto JSON.
  const valores = Object.values(objeto);
  if (valores.length > 0 && valores.every(pareceRegistroCliente)) {
    return valores;
  }

  // Compatibilidade com endpoint que devolva um único cliente.
  if (pareceRegistroCliente(objeto)) return [objeto];

  return null;
}

function normalizarCliente(item: any): Cliente | null {
  if (!item || typeof item !== "object") return null;

  const idCliente = Number(
    item.id_cliente ?? item.cliente_id ?? item.idCliente ?? item.id ?? 0,
  );

  if (!Number.isInteger(idCliente) || idCliente <= 0) return null;

  const statusId = Number(item.status_id ?? item.statusId ?? 1);
  const documento =
    item.documento ?? item.cpf_cnpj ?? item.cpf ?? item.cnpj ?? null;

  const statusCodigo =
    typeof item.status === "object"
      ? item.status?.codigo
      : (item.status_codigo ?? item.status);

  const ativo =
    item.ativo !== undefined && item.ativo !== null
      ? normalizarBooleano(item.ativo)
      : statusCodigo !== undefined && statusCodigo !== null
        ? normalizarBooleano(statusCodigo)
        : statusId === 1; // ID 1 foi confirmado como GERAL/ATIVO no banco.

  const tipoRecebido = String(
    item.tipo_pessoa ?? item.tipoPessoa ?? "",
  ).toLocaleLowerCase("pt-BR");

  const digitosDocumento = String(documento ?? "").replace(/\D/g, "");

  const tipoPessoa: Cliente["tipo_pessoa"] =
    ["juridica", "pj", "jurídica"].includes(tipoRecebido) ||
    (!tipoRecebido && digitosDocumento.length === 14)
      ? "juridica"
      : "fisica";

  return {
    id_cliente: idCliente,
    status_id: Number.isFinite(statusId) ? statusId : 1,
    nome: String(item.nome ?? item.razao_social ?? item.nome_cliente ?? ""),
    email: item.email == null ? null : String(item.email),
    telefone: item.telefone == null ? null : String(item.telefone),
    documento: documento == null ? null : String(documento),
    tipo_pessoa: tipoPessoa,
    ativo,
    observacoes: item.observacoes == null ? null : String(item.observacoes),
    criado_em: item.criado_em ?? item.created_at ?? null,
    atualizado_em: item.atualizado_em ?? item.updated_at ?? null,
  };
}

function extrairClientes(payload: unknown): Cliente[] {
  const payloadDecodificado = decodificarJsonSeNecessario(payload);
  const lista = localizarListaClientes(payloadDecodificado);

  if (lista === null) {
    const chaves =
      payloadDecodificado && typeof payloadDecodificado === "object"
        ? Object.keys(payloadDecodificado as Record<string, unknown>).join(", ")
        : typeof payloadDecodificado;

    throw new Error(
      `A API respondeu, mas não foi encontrada uma lista de clientes. Estrutura recebida: ${chaves || "vazia"}. Verifique a resposta de ClienteController@index.`,
    );
  }

  return lista
    .map((item) => normalizarCliente(item))
    .filter((cliente): cliente is Cliente => cliente !== null);
}

function obterMensagemErro(error: any): string {
  const status = error?.response?.status;
  const dados = error?.response?.data;
  const mensagem =
    dados?.mensagem ??
    dados?.message ??
    dados?.erro ??
    dados?.error ??
    (typeof dados === "string" ? dados : null);

  if (mensagem) return String(mensagem);
  if (status === 401) return "Sua sessão expirou. Entre novamente no painel.";
  if (status === 403)
    return "Sua conta não possui permissão para esta operação.";
  if (status === 404)
    return "A rota de gerenciamento de clientes não foi encontrada. Confira a rota /painel/clientes/gerenciamento/ no Site.php.";
  if (status >= 500) return `A API retornou erro interno (${status}).`;
  return error?.message
    ? `Falha na requisição: ${error.message}`
    : "Não foi possível concluir a operação. Verifique a conexão com a API.";
}

function mascararDocumento(documento?: string | null): string {
  const digitos = String(documento ?? "").replace(/\D/g, "");

  if (digitos.length === 11) return "***.***.***-**";
  if (digitos.length === 14) return "**.***.***/****-**";

  return documento ? "Documento protegido" : "Não informado";
}

function formatarData(data?: string | null): string {
  if (!data) return "—";
  const valor = new Date(data.includes("T") ? data : data.replace(" ", "T"));
  if (Number.isNaN(valor.getTime())) return "—";
  return valor.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function iniciais(nome: string): string {
  return (
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join("") || "C"
  );
}

function extrairPermissoesUsuario(usuario: any): string[] {
  const candidatos = [
    usuario?.permissoes,
    usuario?.usuario?.permissoes,
    usuario?.dados?.permissoes,
    usuario?.data?.permissoes,
  ];

  const lista = candidatos.find(Array.isArray) ?? [];

  return lista
    .map((item: unknown) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "codigo" in item) {
        return String((item as { codigo: unknown }).codigo ?? "");
      }
      return "";
    })
    .filter(Boolean);
}

export default function ClientesPage() {
  const { usuario, carregando: carregandoAuth } = useAuth();

  const permissoes = extrairPermissoesUsuario(usuario);

  // A interface respeita as mesmas permissões explícitas aplicadas no Site.php.
  // Ter um papel com nome "ADMINISTRADOR" não libera acesso automaticamente.
  const podeListar =
    permissoes.includes("clientes.listar") ||
    permissoes.includes("clientes.gerenciar");
  const podeGerenciar = permissoes.includes("clientes.gerenciar");

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [form, setForm] = useState<FormularioCliente>(FORM_INICIAL);

  const carregarClientes = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    else setAtualizando(true);
    setErro("");

    try {
      const resposta = await conexao.get(ROTAS.CLIENTES.LISTAR, {
        withCredentials: true,
        headers: {
          Accept: "application/json",
        },
      });

      try {
        const lista = extrairClientes(resposta.data);
        setClientes(lista);
      } catch (erroFormato) {
        const dadosRecebidos = resposta.data;
        const tipoRecebido = Array.isArray(dadosRecebidos)
          ? "array"
          : dadosRecebidos === null
            ? "null"
            : typeof dadosRecebidos;
        const chavesRecebidas =
          dadosRecebidos && typeof dadosRecebidos === "object"
            ? Object.keys(dadosRecebidos as Record<string, unknown>)
            : [];

        console.error("[CLIENTES] Formato de resposta não reconhecido:", {
          tipo: tipoRecebido,
          chaves: chavesRecebidas,
          statusHttp: resposta.status,
        });

        throw erroFormato;
      }
    } catch (error: any) {
      setErro(obterMensagemErro(error));
      setClientes([]);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    if (carregandoAuth) return;
    if (podeListar) {
      carregarClientes();
    } else {
      setClientes([]);
      setCarregando(false);
    }
  }, [carregandoAuth, podeListar, carregarClientes]);

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return clientes.filter((cliente) => {
      const termoNumerico = termo.replace(/\D/g, "");
      const documentoNumerico = String(cliente.documento ?? "").replace(
        /\D/g,
        "",
      );

      const correspondeBusca =
        cliente.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        String(cliente.email ?? "")
          .toLocaleLowerCase("pt-BR")
          .includes(termo) ||
        String(cliente.telefone ?? "").includes(termo) ||
        String(cliente.id_cliente).includes(termo) ||
        (termoNumerico.length > 0 && documentoNumerico.includes(termoNumerico));

      const correspondeFiltro =
        filtro === "todos" ||
        (filtro === "ativos" && cliente.ativo) ||
        (filtro === "inativos" && !cliente.ativo) ||
        (filtro === "fisica" && cliente.tipo_pessoa === "fisica") ||
        (filtro === "juridica" && cliente.tipo_pessoa === "juridica");

      return correspondeBusca && correspondeFiltro;
    });
  }, [clientes, busca, filtro]);

  const totalAtivos = clientes.filter((cliente) => cliente.ativo).length;
  const totalInativos = clientes.length - totalAtivos;
  const totalFisica = clientes.filter(
    (cliente) => cliente.tipo_pessoa === "fisica",
  ).length;
  const totalJuridica = clientes.length - totalFisica;

  function abrirCadastro() {
    if (!podeGerenciar) return;
    setEditando(null);
    setForm(FORM_INICIAL);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function abrirEdicao(cliente: Cliente) {
    if (!podeGerenciar) return;
    setEditando(cliente.id_cliente);
    setForm({
      status_id: cliente.status_id || 1,
      nome: cliente.nome,
      email: cliente.email ?? "",
      telefone: cliente.telefone ?? "",
      documento: cliente.documento ?? "",
      tipo_pessoa: cliente.tipo_pessoa,
      ativo: cliente.ativo,
      observacoes: cliente.observacoes ?? "",
    });
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  function atualizarCampo<K extends keyof FormularioCliente>(
    campo: K,
    valor: FormularioCliente[K],
  ) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!podeGerenciar) {
      setErro("Sua conta não possui permissão para gerenciar clientes.");
      return;
    }

    const nome = form.nome.trim();
    const email = form.email.trim().toLowerCase() || null;
    const telefone = form.telefone.trim() || null;
    const documento = form.documento.trim() || null;
    const observacoes = form.observacoes.trim() || null;

    if (!nome) {
      setErro("Informe o nome do cliente.");
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErro("Informe um e-mail válido ou deixe o campo vazio.");
      return;
    }

    setSalvando(true);
    setErro("");
    setSucesso("");

    const dados = {
      status_id: Number(form.status_id || 1),
      nome,
      email,
      telefone,
      documento,
      tipo_pessoa: form.tipo_pessoa,
      ativo: form.ativo,
      observacoes,
    };

    try {
      if (editando !== null) {
        await conexao.put(ROTAS.CLIENTES.ATUALIZAR(editando), dados, {
          withCredentials: true,
        });
        setSucesso("Cliente atualizado com sucesso.");
      } else {
        await conexao.post(ROTAS.CLIENTES.CADASTRAR, dados, {
          withCredentials: true,
        });
        setSucesso("Cliente cadastrado com sucesso.");
      }

      setModalAberto(false);
      setForm(FORM_INICIAL);
      await carregarClientes(true);
    } catch (error: any) {
      setErro(obterMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(cliente: Cliente) {
    if (!podeGerenciar) return;
    const novoStatus = !cliente.ativo;
    const acao = novoStatus ? "ativar" : "desativar";

    if (!window.confirm(`Deseja ${acao} o cliente "${cliente.nome}"?`)) return;

    setErro("");
    setSucesso("");

    try {
      await conexao.put(
        ROTAS.CLIENTES.ALTERAR_STATUS(cliente.id_cliente),
        { ativo: novoStatus },
        { withCredentials: true },
      );
      setSucesso(
        `Cliente ${novoStatus ? "ativado" : "desativado"} com sucesso.`,
      );
      await carregarClientes(true);
    } catch (error: any) {
      setErro(obterMensagemErro(error));
    }
  }

  if (carregandoAuth) {
    return (
      <main className="clientes-page">
        <div className="loading-screen">
          <span className="spinner" />
          <strong>Verificando permissões...</strong>
        </div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  if (!podeListar) {
    return (
      <main className="clientes-page">
        <div className="page-shell">
          <section className="access-card">
            <div className="access-icon">♙</div>
            <span className="eyebrow">ADMINISTRAÇÃO / PESSOAS</span>
            <h1>Acesso restrito</h1>
            <p>
              Sua conta não possui a permissão <code>clientes.listar</code>.
              Solicite acesso ao administrador.
            </p>
          </section>
        </div>
        <style jsx>{styles}</style>
      </main>
    );
  }

  return (
    <main className="clientes-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <div className="page-shell">
        <header className="page-header">
          <div className="header-copy">
            <div className="eyebrow">
              <i /> ADMINISTRAÇÃO <span>/</span> PESSOAS
            </div>
            <h1>Clientes</h1>
            <p>Cadastre, consulte e acompanhe os clientes da loja.</p>
          </div>

          {podeGerenciar && (
            <button className="primary-button" onClick={abrirCadastro}>
              <span className="button-plus">＋</span>
              Novo cliente
            </button>
          )}
        </header>

        {!podeGerenciar && (
          <div className="readonly-banner">
            <span className="readonly-symbol">◉</span>
            <div>
              <strong>Modo de consulta</strong>
              <span>Você pode visualizar os clientes, mas não alterá-los.</span>
            </div>
          </div>
        )}

        {erro && (
          <div className="alert alert-error">
            <span className="alert-icon">!</span>
            <div>
              <strong>Não foi possível concluir a operação</strong>
              <p>{erro}</p>
            </div>
            <button onClick={() => setErro("")} aria-label="Fechar aviso">
              ×
            </button>
          </div>
        )}

        {sucesso && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            <p>{sucesso}</p>
            <button onClick={() => setSucesso("")} aria-label="Fechar aviso">
              ×
            </button>
          </div>
        )}

        <section className="stats-grid">
          <article className="stat-card stat-total">
            <div className="stat-topline">
              <span className="stat-label">Total de clientes</span>
              <span className="stat-icon">♙</span>
            </div>
            <strong className="stat-number">
              {carregando ? "—" : clientes.length}
            </strong>
            <span className="stat-foot">Cadastros no sistema</span>
          </article>

          <article className="stat-card">
            <div className="stat-topline">
              <span className="stat-label">Ativos</span>
              <span className="stat-icon icon-green">✓</span>
            </div>
            <strong className="stat-number">
              {carregando ? "—" : totalAtivos}
            </strong>
            <span className="stat-foot">Clientes habilitados</span>
          </article>

          <article className="stat-card">
            <div className="stat-topline">
              <span className="stat-label">Inativos</span>
              <span className="stat-icon icon-red">⊘</span>
            </div>
            <strong className="stat-number">
              {carregando ? "—" : totalInativos}
            </strong>
            <span className="stat-foot">Clientes desativados</span>
          </article>

          <article className="stat-card">
            <div className="stat-topline">
              <span className="stat-label">Pessoa jurídica</span>
              <span className="stat-icon icon-amber">▣</span>
            </div>
            <strong className="stat-number">
              {carregando ? "—" : totalJuridica}
            </strong>
            <span className="stat-foot">{totalFisica} pessoas físicas</span>
          </article>
        </section>

        <section className="users-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">BASE DE CLIENTES</span>
              <h2>Clientes cadastrados</h2>
              <p>
                Pesquise por nome, e-mail, telefone ou ID. Documentos são
                protegidos na listagem.
              </p>
            </div>

            <button
              className="refresh-button"
              onClick={() => carregarClientes(true)}
              disabled={atualizando || carregando}
            >
              <span className={atualizando ? "refresh spinning" : "refresh"}>
                ↻
              </span>
              {atualizando ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          <div className="list-controls">
            <label className="search-box">
              <span>⌕</span>
              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar cliente por nome, e-mail, documento ou telefone..."
              />
              {busca && (
                <button onClick={() => setBusca("")} aria-label="Limpar busca">
                  ×
                </button>
              )}
            </label>

            <div className="filter-tabs">
              {(
                [
                  ["todos", "Todos", clientes.length],
                  ["ativos", "Ativos", totalAtivos],
                  ["inativos", "Inativos", totalInativos],
                  ["fisica", "Pessoa física", totalFisica],
                  ["juridica", "Pessoa jurídica", totalJuridica],
                ] as [Filtro, string, number][]
              ).map(([valor, label, total]) => (
                <button
                  key={valor}
                  className={filtro === valor ? "selected" : ""}
                  onClick={() => setFiltro(valor)}
                >
                  {label}
                  <span>{total}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>CLIENTE</th>
                  <th>DOCUMENTO</th>
                  <th>CONTATO</th>
                  <th>TIPO</th>
                  <th>CADASTRO</th>
                  <th>STATUS</th>
                  {podeGerenciar && <th className="actions-head">AÇÕES</th>}
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={podeGerenciar ? 7 : 6} className="empty-state">
                      <span className="spinner" />
                      <strong>Carregando clientes</strong>
                      <small>Consultando os dados da API...</small>
                    </td>
                  </tr>
                ) : clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={podeGerenciar ? 7 : 6} className="empty-state">
                      <span className="empty-symbol">♙</span>
                      <strong>
                        {clientes.length === 0
                          ? "Nenhum cliente cadastrado"
                          : "Nenhum resultado encontrado"}
                      </strong>
                      <small>
                        {clientes.length === 0
                          ? "Cadastre o primeiro cliente para começar."
                          : "Altere a pesquisa ou selecione outro filtro."}
                      </small>
                    </td>
                  </tr>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id_cliente}>
                      <td>
                        <div className="user-cell">
                          <span className="avatar">
                            {iniciais(cliente.nome)}
                          </span>
                          <span className="user-meta">
                            <strong>
                              {cliente.nome || "Cliente sem nome"}
                            </strong>
                            <small>CLI #{cliente.id_cliente}</small>
                          </span>
                        </div>
                      </td>

                      <td className="document-cell">
                        {mascararDocumento(cliente.documento)}
                      </td>

                      <td>
                        <span className="contact-email">
                          {cliente.email || "E-mail não informado"}
                        </span>
                        <small className="contact-phone">
                          {cliente.telefone || "Telefone não informado"}
                        </small>
                      </td>

                      <td>
                        <span className="type-pill">
                          {cliente.tipo_pessoa === "juridica"
                            ? "Pessoa jurídica"
                            : "Pessoa física"}
                        </span>
                      </td>

                      <td className="date-cell">
                        {formatarData(cliente.criado_em)}
                      </td>

                      <td>
                        <span
                          className={`badge-state ${cliente.ativo ? "badge-active" : "badge-inactive"}`}
                        >
                          <i />
                          {cliente.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>

                      {podeGerenciar && (
                        <td>
                          <div className="row-actions">
                            <button
                              title="Editar cliente"
                              onClick={() => abrirEdicao(cliente)}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              title={
                                cliente.ativo
                                  ? "Desativar cliente"
                                  : "Ativar cliente"
                              }
                              className={
                                cliente.ativo
                                  ? "action-disable"
                                  : "action-enable"
                              }
                              onClick={() => alternarStatus(cliente)}
                            >
                              {cliente.ativo ? "⊘" : "✓"}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="table-footer">
            <span>
              Mostrando <strong>{clientesFiltrados.length}</strong> de{" "}
              <strong>{clientes.length}</strong> clientes
            </span>
            <span className="table-footer-note">
              {podeGerenciar
                ? "Gerenciamento habilitado"
                : "Consulta somente leitura"}
            </span>
          </footer>
        </section>

        <div className="security-note">
          <span className="security-icon">◇</span>
          <div>
            <strong>Dados dos clientes</strong>
            <p>
              O CPF/CNPJ aparece mascarado na listagem e o campo de edição é
              protegido visualmente. O acesso ao documento completo deve ser
              limitado pela API a usuários autorizados e a uma finalidade
              legítima.
            </p>
          </div>
        </div>
      </div>

      {modalAberto && podeGerenciar && (
        <div
          className="modal-backdrop"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !salvando) {
              setModalAberto(false);
            }
          }}
        >
          <section className="modal">
            <header className="modal-header">
              <div>
                <span className="section-kicker">ADMINISTRAÇÃO / CLIENTES</span>
                <h2>{editando !== null ? "Editar cliente" : "Novo cliente"}</h2>
                <p>
                  {editando !== null
                    ? "Atualize as informações cadastrais."
                    : "Preencha os dados para cadastrar um cliente."}
                </p>
              </div>
              <button
                className="close-button"
                onClick={() => setModalAberto(false)}
                disabled={salvando}
              >
                ×
              </button>
            </header>

            <form onSubmit={salvar}>
              {erro && (
                <div className="alert alert-error">
                  <p>{erro}</p>
                </div>
              )}

              <div className="form-grid">
                <label className="field full">
                  <span>
                    Nome completo / Razão social <b>*</b>
                  </span>
                  <input
                    value={form.nome}
                    onChange={(evento) =>
                      atualizarCampo("nome", evento.target.value)
                    }
                    placeholder="Nome do cliente"
                    required
                  />
                </label>

                <label className="field">
                  <span>Tipo de pessoa</span>
                  <select
                    value={form.tipo_pessoa}
                    onChange={(evento) =>
                      atualizarCampo(
                        "tipo_pessoa",
                        evento.target.value as "fisica" | "juridica",
                      )
                    }
                  >
                    <option value="fisica">Pessoa física</option>
                    <option value="juridica">Pessoa jurídica</option>
                  </select>
                </label>

                <label className="field">
                  <span>
                    {form.tipo_pessoa === "juridica" ? "CNPJ" : "CPF"}
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    inputMode="numeric"
                    value={form.documento}
                    onChange={(evento) =>
                      atualizarCampo("documento", evento.target.value)
                    }
                    placeholder={
                      form.tipo_pessoa === "juridica"
                        ? "Informe o CNPJ (campo protegido)"
                        : "Informe o CPF (campo protegido)"
                    }
                  />
                  <small>
                    O documento não é exibido em texto aberto no painel.
                  </small>
                </label>

                <label className="field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(evento) =>
                      atualizarCampo("email", evento.target.value)
                    }
                    placeholder="cliente@exemplo.com"
                  />
                </label>

                <label className="field">
                  <span>Telefone</span>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(evento) =>
                      atualizarCampo("telefone", evento.target.value)
                    }
                    placeholder="(11) 99999-9999"
                  />
                </label>

                <label className="field">
                  <span>Situação</span>
                  <select
                    value={form.ativo ? "1" : "0"}
                    onChange={(evento) =>
                      atualizarCampo("ativo", evento.target.value === "1")
                    }
                  >
                    <option value="1">Ativo</option>
                    <option value="0">Inativo</option>
                  </select>
                </label>

                <label className="field full">
                  <span>Observações</span>
                  <textarea
                    rows={3}
                    value={form.observacoes}
                    onChange={(evento) =>
                      atualizarCampo("observacoes", evento.target.value)
                    }
                    placeholder="Informações adicionais sobre o cliente..."
                  />
                </label>
              </div>

              <footer className="modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setModalAberto(false)}
                  disabled={salvando}
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
                      : "Cadastrar cliente"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      <style jsx>{styles}</style>
    </main>
  );
}

const styles = `
  .clientes-page {
    min-height: 100vh;
    position: relative;
    overflow: hidden;
    padding: 38px 34px 58px;
    background: #100d13;
    color: #f6edf4;
  }
  .ambient {
    position: absolute;
    width: 420px;
    height: 420px;
    border-radius: 50%;
    filter: blur(105px);
    opacity: .12;
    pointer-events: none;
  }
  .ambient-one { top: -220px; right: 4%; background: #b54f8b; }
  .ambient-two { bottom: 0; left: -300px; background: #68418d; }
  .page-shell { max-width: 1540px; margin: 0 auto; position: relative; z-index: 1; }
  .page-header { display: flex; align-items: center; justify-content: space-between; gap: 26px; margin-bottom: 30px; }
  .eyebrow { display: inline-flex; align-items: center; gap: 8px; color: #c18bad; font-size: 10px; font-weight: 800; letter-spacing: 1.65px; }
  .eyebrow i { width: 7px; height: 7px; border-radius: 50%; background: #e283b8; box-shadow: 0 0 12px #e283b8; }
  .eyebrow span { color: #766a78; }
  h1 { margin: 10px 0 7px; color: #fff7fd; font-size: clamp(28px, 3vw, 36px); font-weight: 760; letter-spacing: -1.35px; }
  .header-copy p { margin: 0; color: #a99baa; font-size: 13px; }
  button { font: inherit; cursor: pointer; }
  button:disabled { opacity: .55; cursor: wait; }
  .primary-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 43px; padding: 0 18px; border: 1px solid #bd679a; border-radius: 9px; color: #fff; background: linear-gradient(135deg, #ad5288, #77365f); box-shadow: 0 8px 24px #8d35652e; font-size: 12px; font-weight: 750; transition: transform .18s ease, filter .18s ease; }
  .primary-button:hover { transform: translateY(-1px); filter: brightness(1.1); }
  .button-plus { font-size: 18px; line-height: 1; }
  .readonly-banner { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; padding: 13px 16px; border: 1px solid #51404f; border-radius: 10px; background: #211922; }
  .readonly-symbol { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; color: #d2a1c4; background: #76466a40; }
  .readonly-banner strong, .readonly-banner span { display: block; }
  .readonly-banner strong { color: #ead8e6; font-size: 11px; }
  .readonly-banner div span { margin-top: 3px; color: #988998; font-size: 10px; }
  .alert { display: flex; align-items: center; gap: 11px; margin-bottom: 17px; padding: 13px 15px; border: 1px solid; border-radius: 9px; }
  .alert-error { border-color: #9d4b5a; color: #f3b2bc; background: #6f29352b; }
  .alert-success { border-color: #397c56; color: #9ce6b7; background: #23563b2b; }
  .alert-icon { display: grid; place-items: center; flex: 0 0 25px; width: 25px; height: 25px; border-radius: 50%; background: #ffffff12; font-size: 12px; font-weight: 800; }
  .alert strong { display: block; font-size: 11px; }
  .alert p { margin: 3px 0 0; font-size: 10px; line-height: 1.5; overflow-wrap: anywhere; }
  .alert > button { margin-left: auto; border: 0; background: transparent; color: inherit; font-size: 18px; opacity: .75; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 15px; margin-bottom: 22px; }
  .stat-card { min-height: 120px; padding: 18px 19px; border: 1px solid #392b3b; border-radius: 12px; background: linear-gradient(145deg, #211923, #17131a 72%); box-shadow: 0 7px 22px #00000016; }
  .stat-total { border-color: #68425e; background: linear-gradient(145deg, #2a1c29, #19131b 76%); }
  .stat-topline { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .stat-label { color: #b7a8b8; font-size: 11px; font-weight: 550; }
  .stat-icon { display: grid; place-items: center; width: 37px; height: 37px; border-radius: 10px; color: #e2a9ce; background: #8d4d7838; font-size: 18px; }
  .icon-green { color: #83dfad; background: #277d5638; }
  .icon-red { color: #e998a7; background: #9d3d5238; }
  .icon-amber { color: #edc57e; background: #a4772d38; }
  .stat-number { display: block; margin-top: 7px; color: #fff8fd; font-size: 29px; font-weight: 750; letter-spacing: -.7px; }
  .stat-foot { display: block; margin-top: 3px; color: #847987; font-size: 10px; }
  .users-card { overflow: hidden; border: 1px solid #3a2b3c; border-radius: 13px; background: #17131b; box-shadow: 0 16px 44px #00000020; }
  .card-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 22px 23px; border-bottom: 1px solid #352838; }
  .section-kicker { color: #c58bad; font-size: 9px; font-weight: 800; letter-spacing: 1.5px; }
  .card-heading h2 { margin: 5px 0 4px; color: #f8eff6; font-size: 16px; letter-spacing: -.25px; }
  .card-heading p { margin: 0; color: #968a99; font-size: 11px; }
  .refresh-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 38px; padding: 0 13px; border: 1px solid #4b394c; border-radius: 8px; color: #d9c7d7; background: #241b27; font-size: 10px; font-weight: 650; }
  .refresh-button:hover { border-color: #8f5a7c; background: #302231; }
  .refresh { font-size: 18px; line-height: 1; }
  .spinning { display: inline-block; animation: spin .8s linear infinite; font-size: 18px; }
  .list-controls { display: flex; flex-direction: column; gap: 13px; padding: 16px 21px 14px; border-bottom: 1px solid #352838; background: #1b1620; }
  .search-box { display: flex; align-items: center; gap: 10px; width: min(100%, 520px); height: 41px; padding: 0 12px; border: 1px solid #47364a; border-radius: 8px; color: #cc8fb5; background: #100d13; box-sizing: border-box; }
  .search-box > span { font-size: 22px; line-height: 1; }
  .search-box input { flex: 1; min-width: 0; border: 0; outline: 0; color: #f4eaf2; background: transparent; font-size: 11px; }
  .search-box input::placeholder { color: #7c7180; }
  .search-box button { border: 0; color: #b69caf; background: transparent; font-size: 18px; }
  .filter-tabs { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
  .filter-tabs button { display: inline-flex; align-items: center; gap: 7px; min-height: 31px; padding: 0 10px; border: 1px solid transparent; border-radius: 7px; color: #9b8d9d; background: transparent; font-size: 10px; transition: .16s ease; }
  .filter-tabs button:hover { color: #ead5e5; background: #302331; }
  .filter-tabs button.selected { border-color: #86506f; color: #ffe3f3; background: #653a55; }
  .filter-tabs button span { min-width: 17px; padding: 2px 5px; border-radius: 20px; color: #c4b1c3; background: #ffffff10; font-size: 9px; text-align: center; }
  .filter-tabs button.selected span { color: #fff; background: #ffffff20; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; min-width: 1050px; border-collapse: collapse; }
  th { padding: 14px 17px; color: #98889b; background: #1d1721; font-size: 9px; font-weight: 800; letter-spacing: 1.05px; text-align: left; white-space: nowrap; }
  td { padding: 14px 17px; border-top: 1px solid #302431; color: #d9ceda; font-size: 11px; vertical-align: middle; }
  tbody tr { transition: background .14s ease; }
  tbody tr:hover { background: #211923; }
  .user-cell { display: flex; align-items: center; gap: 11px; min-width: 205px; }
  .avatar { display: grid; flex: 0 0 38px; place-items: center; width: 38px; height: 38px; border: 1px solid #784866; border-radius: 10px; color: #f0b9d7; background: linear-gradient(145deg, #754365, #3e293d); font-size: 11px; font-weight: 800; }
  .user-meta { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .user-meta strong { max-width: 185px; overflow: hidden; color: #f5eaf3; font-size: 11px; text-overflow: ellipsis; }
  .user-meta small { color: #87798a; font-size: 9px; }
  .document-cell { color: #c7b6c8; white-space: nowrap; }
  .contact-email { display: block; color: #e0d2df; font-size: 10px; }
  .contact-phone { display: block; margin-top: 4px; color: #857889; font-size: 9px; }
  .date-cell { color: #a99baa; font-size: 10px; white-space: nowrap; }
  .type-pill { display: inline-flex; padding: 6px 9px; border: 1px solid #49364c; border-radius: 20px; color: #d5b0cd; background: #38263a; font-size: 9px; white-space: nowrap; }
  .badge-state { display: inline-flex; align-items: center; gap: 7px; padding: 6px 9px; border: 1px solid transparent; border-radius: 30px; font-size: 9px; font-weight: 650; white-space: nowrap; }
  .badge-state i { width: 6px; height: 6px; border-radius: 50%; }
  .badge-active { border-color: #28674755; color: #8fe1b1; background: #1c50362c; }
  .badge-active i { background: #65d498; box-shadow: 0 0 8px #65d49855; }
  .badge-inactive { border-color: #873f5055; color: #e79ba8; background: #7c35422b; }
  .badge-inactive i { background: #d9798b; }
  .actions-head { text-align: right; }
  .row-actions { display: flex; justify-content: flex-end; gap: 6px; }
  .row-actions button { display: grid; place-items: center; width: 31px; height: 31px; border: 1px solid #49384b; border-radius: 7px; color: #d5b4cc; background: #241b27; font-size: 14px; transition: .15s ease; }
  .row-actions button:hover { color: white; border-color: #9a5e82; background: #633b56; }
  .row-actions .action-disable { color: #e69aaa; }
  .row-actions .action-enable { color: #82dca8; }
  .empty-state { height: 190px; padding: 34px 15px !important; color: #9b8c9d !important; text-align: center !important; }
  .empty-state strong, .empty-state small { display: block; }
  .empty-state strong { margin-top: 11px; color: #e2d4e1; font-size: 12px; }
  .empty-state small { margin-top: 5px; color: #827587; font-size: 10px; }
  .empty-symbol { display: block; color: #c681ae; font-size: 29px; }
  .table-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 20px; border-top: 1px solid #352838; color: #948798; font-size: 10px; }
  .table-footer strong { color: #e8d9e6; }
  .table-footer-note { color: #7f7182; }
  .security-note { display: flex; align-items: flex-start; gap: 12px; margin-top: 17px; padding: 16px 18px; border: 1px solid #483345; border-radius: 10px; background: #211923; }
  .security-icon { display: grid; flex: 0 0 31px; place-items: center; width: 31px; height: 31px; border-radius: 8px; color: #e3a9ca; background: #77406440; font-size: 17px; }
  .security-note strong { color: #ead9e8; font-size: 11px; }
  .security-note p { margin: 4px 0 0; color: #a395a4; font-size: 10px; line-height: 1.6; }
  .modal-backdrop { position: fixed; z-index: 300; inset: 0; display: grid; place-items: center; overflow-y: auto; padding: 20px; background: #08060bbd; backdrop-filter: blur(6px); }
  .modal { width: min(650px, 100%); max-height: calc(100vh - 40px); overflow-y: auto; padding: 24px; border: 1px solid #594052; border-radius: 14px; background: #1b1620; box-shadow: 0 25px 90px #000a; }
  .modal-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 22px; }
  .modal-header h2 { margin: 7px 0 4px; color: #f7edf5; font-size: 22px; }
  .modal-header p { margin: 0; color: #9c8c9e; font-size: 11px; }
  .close-button { display: grid; place-items: center; width: 32px; height: 32px; border: 1px solid #49384b; border-radius: 8px; color: #d9c2d4; background: #2a202c; font-size: 21px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field { display: flex; flex-direction: column; gap: 7px; }
  .field.full { grid-column: 1 / -1; }
  .field > span { color: #e1d2df; font-size: 11px; font-weight: 650; }
  .field > span b { color: #e38db7; }
  .field input, .field select, .field textarea { width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid #49384b; border-radius: 8px; outline: 0; color: #f5eaf3; background: #100d13; font: inherit; font-size: 11px; }
  .field input:focus, .field select:focus, .field textarea:focus { border-color: #b56a98; box-shadow: 0 0 0 3px #b56a9820; }
  .field input::placeholder, .field textarea::placeholder { color: #776b7b; }
  .field small { color: #928394; font-size: 9px; line-height: 1.5; }
  .field select option { background: #17131b; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 9px; margin-top: 24px; padding-top: 17px; border-top: 1px solid #3b2c3e; }
  .secondary-button { min-height: 40px; padding: 0 15px; border: 1px solid #554158; border-radius: 8px; color: #d6c5d4; background: #2a202d; font-size: 11px; }
  .loading-screen { display: flex; min-height: 65vh; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: #d9cbd8; font-size: 12px; }
  .spinner { display: inline-block; width: 18px; height: 18px; border: 2px solid #60485e; border-top-color: #e18aba; border-radius: 50%; animation: spin .8s linear infinite; }
  .loading-screen .spinner { width: 28px; height: 28px; border-width: 3px; }
  .access-card { max-width: 540px; margin: 9vh auto; padding: 36px; border: 1px solid #493447; border-radius: 16px; background: #1b1620; text-align: center; box-shadow: 0 20px 65px #0004; }
  .access-icon { display: grid; place-items: center; width: 54px; height: 54px; margin: 0 auto 18px; border-radius: 14px; color: #e2a8c9; background: #79436640; font-size: 26px; }
  .access-card h1 { font-size: 25px; }
  .access-card p { color: #a99baa; font-size: 12px; line-height: 1.7; }
  .access-card code { color: #e2a8c9; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 720px) {
    .clientes-page { padding: 25px 15px 38px; }
    .page-header { align-items: flex-start; flex-direction: column; }
    .page-header .primary-button { width: 100%; }
    .card-heading { align-items: flex-start; }
    .list-controls { padding: 13px; }
    .filter-tabs { gap: 4px; }
    .filter-tabs button { padding: 0 8px; }
    .table-footer { align-items: flex-start; flex-direction: column; }
  }
  @media (max-width: 520px) {
    .stats-grid { gap: 9px; }
    .stat-card { min-height: 105px; padding: 13px; }
    .stat-label { font-size: 10px; }
    .stat-number { font-size: 24px; }
    .stat-icon { width: 32px; height: 32px; }
    .card-heading { flex-direction: column; }
    .refresh-button, .search-box { width: 100%; }
    .modal { padding: 18px; }
    .form-grid { grid-template-columns: 1fr; }
    .field.full { grid-column: auto; }
    .modal-footer { flex-direction: column-reverse; }
    .modal-footer button { width: 100%; }
  }
`;
