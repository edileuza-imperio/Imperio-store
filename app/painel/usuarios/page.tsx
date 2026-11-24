"use client";

import conexao from "@/Services/Conexao/Conexao";

import { useAuth } from "@/components/contexts/AuthContext";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  telefone: string | null;
  ativo: boolean;
  email_verificado_em: string | null;
  ultimo_acesso_em: string | null;
  criado_em: string | null;
  papel_id?: number | string | null;
  papel?: string | null;
  papeis?: Array<
    | string
    | {
        nome?: string;
        codigo?: string;
        papel_id?: number | string;
      }
  >;
  roles?: Array<
    | string
    | {
        name?: string;
        code?: string;
        id?: number | string;
      }
  >;
  is_admin?: boolean;
  administrador?: boolean;
}

interface Formulario {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
}

type Filtro = "todos" | "ativos" | "inativos" | "verificados" | "pendentes";

const FORM_INICIAL: Formulario = {
  nome: "",
  email: "",
  telefone: "",
  senha: "",
};

// =====================================================
// NORMALIZAÇÃO
// =====================================================

function normalizarBooleano(valor: unknown): boolean {
  return (
    valor === true ||
    valor === 1 ||
    valor === "1" ||
    valor === "true" ||
    valor === "ativo" ||
    valor === "ATIVO"
  );
}

// =====================================================
// IDENTIFICAR ADMINISTRADOR
// =====================================================

function ehAdministrador(item: Usuario, usuarioLogado?: any): boolean {
  const idAtual = Number(
    usuarioLogado?.id_usuario ?? usuarioLogado?.usuario?.id_usuario ?? 0,
  );

  // Protege a própria conta autenticada.
  // Isso funciona mesmo se a listagem ainda não retornar os papéis.
  if (idAtual > 0 && idAtual === item.id_usuario) {
    const papeisAtuais = Array.isArray(usuarioLogado?.papeis)
      ? usuarioLogado.papeis
      : Array.isArray(usuarioLogado?.usuario?.papeis)
        ? usuarioLogado.usuario.papeis
        : [];

    if (
      papeisAtuais.some((papel: unknown) => {
        const nome = String(papel ?? "")
          .trim()
          .toLocaleUpperCase("pt-BR");

        return ["ADMIN", "ADMINISTRADOR", "ADMINISTRATOR", "1"].includes(nome);
      })
    ) {
      return true;
    }
  }

  if (item.is_admin === true || item.administrador === true) {
    return true;
  }

  if (Number(item.papel_id) === 1) {
    return true;
  }

  const nomes = [
    item.papel,

    ...(Array.isArray(item.papeis)
      ? item.papeis.map((papel) =>
          typeof papel === "string"
            ? papel
            : (papel?.nome ?? papel?.codigo ?? papel?.papel_id),
        )
      : []),

    ...(Array.isArray(item.roles)
      ? item.roles.map((role) =>
          typeof role === "string"
            ? role
            : (role?.name ?? role?.code ?? role?.id),
        )
      : []),
  ];

  return nomes.some((nome) => {
    const valor = String(nome ?? "")
      .trim()
      .toLocaleUpperCase("pt-BR");

    return ["ADMIN", "ADMINISTRADOR", "ADMINISTRATOR", "1"].includes(valor);
  });
}

// =====================================================
// EXTRAIR USUÁRIOS DA API
// =====================================================

function extrairUsuarios(payload: any): Usuario[] {
  const candidatos = [
    payload?.usuarios,
    payload?.dados?.usuarios,
    payload?.data?.usuarios,
    payload?.resultado?.usuarios,
    payload?.dados,
    payload?.data,
    payload?.resultado,
    payload,
  ];

  const lista = candidatos.find(Array.isArray) ?? [];

  return lista
    .map((item: any) => ({
      id_usuario: Number(
        item?.id_usuario ??
          item?.usuario_id ??
          item?.id ??
          item?.usuario?.id_usuario ??
          0,
      ),

      nome: String(item?.nome ?? item?.name ?? ""),

      email: String(item?.email ?? ""),

      telefone: item?.telefone ?? item?.phone ?? null,

      ativo: normalizarBooleano(item?.ativo ?? item?.status),

      email_verificado_em:
        item?.email_verificado_em ??
        item?.emailVerificadoEm ??
        item?.email_verificado ??
        null,

      ultimo_acesso_em:
        item?.ultimo_acesso_em ??
        item?.ultimoAcessoEm ??
        item?.ultimo_acesso ??
        null,

      criado_em: item?.criado_em ?? item?.created_at ?? null,

      papel_id: item?.papel_id ?? item?.papel?.id_papel ?? null,

      papel:
        typeof item?.papel === "string"
          ? item.papel
          : (item?.papel?.nome ?? item?.papel?.codigo ?? null),

      papeis: Array.isArray(item?.papeis)
        ? item.papeis
        : Array.isArray(item?.usuario_papeis)
          ? item.usuario_papeis.map((v: any) => ({
              nome: v?.nome ?? v?.papel?.nome,
              codigo: v?.codigo ?? v?.papel?.codigo,
              papel_id: v?.papel_id ?? v?.papel?.id_papel,
            }))
          : [],

      roles: Array.isArray(item?.roles) ? item.roles : [],

      is_admin: item?.is_admin ?? item?.administrador ?? false,
    }))
    .filter(
      (item: Usuario) =>
        Number.isInteger(item.id_usuario) && item.id_usuario > 0,
    );
}

// =====================================================
// FORMATAÇÃO
// =====================================================

function formatarData(data?: string | null): string {
  if (!data) return "Ainda não acessou";

  const dataNormalizada = data.includes("T") ? data : data.replace(" ", "T");

  const valor = new Date(dataNormalizada);

  if (Number.isNaN(valor.getTime())) {
    return "—";
  }

  return valor.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function iniciais(nome: string): string {
  return (
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((parte) => parte.charAt(0).toUpperCase())
      .join("") || "U"
  );
}

// =====================================================
// MENSAGENS DE ERRO
// =====================================================

function obterMensagemErro(error: any): string {
  const status = error?.response?.status;
  const dados = error?.response?.data;

  const mensagem =
    dados?.mensagem ??
    dados?.message ??
    dados?.erro ??
    dados?.error ??
    (typeof dados === "string" ? dados : null);

  if (mensagem) {
    return String(mensagem);
  }

  if (status === 401) {
    return "Sua sessão não foi reconhecida pela API. Entre novamente no painel.";
  }

  if (status === 403) {
    return "Sua conta não tem permissão para consultar ou executar esta operação.";
  }

  if (status === 404) {
    return `A rota ${error?.config?.url ?? "/painel/usuarios"} não foi encontrada na API.`;
  }

  if (status >= 500) {
    return `A API retornou erro interno (${status}). Confira o log do PHP para identificar a falha no controller ou DAO.`;
  }

  if (error?.message) {
    return `Falha na requisição: ${error.message}`;
  }

  return "Não foi possível concluir a operação. Verifique a conexão com a API.";
}

// =====================================================
// PÁGINA
// =====================================================

export default function UsuariosPage() {
  const { usuario, carregando: carregandoAuth } = useAuth();

  const permissoes: string[] = Array.isArray(usuario?.permissoes)
    ? usuario.permissoes
    : [];

  const podeListar =
    permissoes.includes("usuarios.listar") ||
    permissoes.includes("usuarios.gerenciar");

  const podeGerenciar = permissoes.includes("usuarios.gerenciar");

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);

  const [form, setForm] = useState<Formulario>(FORM_INICIAL);

  // =====================================================
  // CARREGAR USUÁRIOS
  // =====================================================

  const carregarUsuarios = useCallback(async (silencioso = false) => {
    if (!silencioso) {
      setCarregando(true);
    } else {
      setAtualizando(true);
    }

    setErro("");

    try {
      const resposta = await conexao.get("/painel/usuarios", {
        withCredentials: true,
        headers: {
          Accept: "application/json",
        },
      });

      setUsuarios(extrairUsuarios(resposta.data));
    } catch (error: any) {
      setErro(obterMensagemErro(error));
      setUsuarios([]);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  // =====================================================
  // INICIALIZAÇÃO
  // =====================================================

  useEffect(() => {
    if (carregandoAuth) return;

    if (podeListar) {
      carregarUsuarios();
    } else {
      setUsuarios([]);
      setCarregando(false);
    }
  }, [carregandoAuth, podeListar, carregarUsuarios]);

  // =====================================================
  // FILTROS
  // =====================================================

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return usuarios.filter((item) => {
      const correspondeBusca =
        item.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        item.email.toLocaleLowerCase("pt-BR").includes(termo) ||
        String(item.id_usuario).includes(termo) ||
        String(item.telefone ?? "").includes(termo);

      const emailVerificado = Boolean(item.email_verificado_em);

      const correspondeFiltro =
        filtro === "todos" ||
        (filtro === "ativos" && item.ativo) ||
        (filtro === "inativos" && !item.ativo) ||
        (filtro === "verificados" && emailVerificado) ||
        (filtro === "pendentes" && !emailVerificado);

      return correspondeBusca && correspondeFiltro;
    });
  }, [usuarios, busca, filtro]);

  const totalAtivos = usuarios.filter((item) => item.ativo).length;

  const totalInativos = usuarios.length - totalAtivos;

  const totalVerificados = usuarios.filter((item) =>
    Boolean(item.email_verificado_em),
  ).length;

  const totalPendentes = usuarios.length - totalVerificados;

  // =====================================================
  // CADASTRO
  // =====================================================

  function abrirCadastro() {
    if (!podeGerenciar) return;

    setEditando(null);
    setForm(FORM_INICIAL);
    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  // =====================================================
  // EDIÇÃO
  // =====================================================

  function abrirEdicao(item: Usuario) {
    if (!podeGerenciar) return;

    setEditando(item.id_usuario);

    setForm({
      nome: item.nome,
      email: item.email,
      telefone: item.telefone ?? "",
      senha: "",
    });

    setErro("");
    setSucesso("");
    setModalAberto(true);
  }

  // =====================================================
  // ATUALIZAR CAMPO
  // =====================================================

  function atualizarCampo<K extends keyof Formulario>(
    campo: K,
    valor: Formulario[K],
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  // =====================================================
  // SALVAR USUÁRIO
  // =====================================================

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!podeGerenciar) {
      setErro("Sua conta não possui a permissão usuarios.gerenciar.");
      return;
    }

    const nome = form.nome.trim();

    const email = form.email.trim().toLowerCase();

    const telefone = form.telefone.trim() || null;

    if (!nome) {
      setErro("Informe o nome completo do usuário.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErro("Informe um endereço de e-mail válido.");
      return;
    }

    if (editando === null && form.senha.length < 8) {
      setErro("A senha inicial deve possuir pelo menos 8 caracteres.");
      return;
    }

    setSalvando(true);
    setErro("");
    setSucesso("");

    try {
      if (editando !== null) {
        await conexao.put(
          "/painel/usuarios/" + editando,
          {
            nome,
            email,
            telefone,
          },
          {
            withCredentials: true,
          },
        );

        setSucesso("Dados do usuário atualizados com sucesso.");
      } else {
        await conexao.post(
          "/painel/usuarios",
          {
            nome,
            email,
            senha: form.senha,
            telefone,
            iniciarSessao: false,
          },
          {
            withCredentials: true,
          },
        );

        setSucesso("Usuário cadastrado com sucesso.");
      }

      setModalAberto(false);
      setForm(FORM_INICIAL);

      await carregarUsuarios(true);
    } catch (error: any) {
      setErro(obterMensagemErro(error));
    } finally {
      setSalvando(false);
    }
  }

  // =====================================================
  // ALTERAR STATUS
  // =====================================================

  async function alternarStatus(item: Usuario) {
    if (!podeGerenciar) return;

    // Proteção adicional: mesmo que a função seja chamada,
    // administradores não podem ser ativados/desativados aqui.
    if (ehAdministrador(item, usuario)) {
      setErro(
        "Esta conta possui o papel de Administrador e não pode ter seu status alterado por esta tela.",
      );
      return;
    }

    const novoStatus = !item.ativo;

    const acao = novoStatus ? "ativar" : "desativar";

    if (!window.confirm(`Deseja ${acao} o usuário "${item.nome}"?`)) {
      return;
    }

    setErro("");
    setSucesso("");

    try {
      await conexao.put(
        `/painel/usuarios/${item.id_usuario}/status`,
        {
          ativo: novoStatus,
        },
        {
          withCredentials: true,
        },
      );

      setSucesso(
        `Usuário ${novoStatus ? "ativado" : "desativado"} com sucesso.`,
      );

      await carregarUsuarios(true);
    } catch (error: any) {
      setErro(obterMensagemErro(error));
    }
  }

  // =====================================================
  // VERIFICAR E-MAIL
  // =====================================================

  async function verificarEmail(item: Usuario) {
    if (!podeGerenciar || item.email_verificado_em) {
      return;
    }

    if (!window.confirm(`Marcar o e-mail de ${item.nome} como verificado?`)) {
      return;
    }

    setErro("");
    setSucesso("");

    try {
      await conexao.put(
        `/painel/usuarios/${item.id_usuario}/verificar-email`,
        {},
        {
          withCredentials: true,
        },
      );

      setSucesso("E-mail marcado como verificado.");

      await carregarUsuarios(true);
    } catch (error: any) {
      setErro(obterMensagemErro(error));
    }
  }

  // =====================================================
  // CARREGAMENTO DA AUTENTICAÇÃO
  // =====================================================

  if (carregandoAuth) {
    return (
      <main className="usuarios-page">
        <div className="loading-screen">
          <span className="spinner" />
          <strong>Verificando permissões...</strong>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  // =====================================================
  // ACESSO RESTRITO
  // =====================================================

  if (!podeListar) {
    return (
      <main className="usuarios-page">
        <div className="page-shell">
          <section className="access-card">
            <div className="access-icon">⌑</div>

            <span className="eyebrow">ADMINISTRAÇÃO / PESSOAS</span>

            <h1>Acesso restrito</h1>

            <p>
              Sua conta não possui a permissão <code>usuarios.listar</code>.
              Solicite ao administrador acesso à consulta de usuários.
            </p>
          </section>
        </div>

        <style jsx>{styles}</style>
      </main>
    );
  }

  // =====================================================
  // RENDERIZAÇÃO
  // =====================================================

  return (
    <main className="usuarios-page">
      <div className="page-shell">
        {/* CABEÇALHO */}

        <header className="page-header">
          <div className="header-copy">
            <div className="eyebrow">
              <i /> ADMINISTRAÇÃO <span>/</span> PESSOAS
            </div>

            <h1>Usuários</h1>

            <p>
              Visualize as contas de acesso e acompanhe a atividade da equipe.
            </p>
          </div>

          {podeGerenciar && (
            <button className="primary-button" onClick={abrirCadastro}>
              <span className="button-plus">＋</span>
              Novo usuário
            </button>
          )}
        </header>

        {/* MODO DE CONSULTA */}

        {!podeGerenciar && (
          <div className="readonly-banner">
            <span className="readonly-symbol">◉</span>

            <div>
              <strong>Modo de consulta</strong>

              <span>
                Você pode visualizar os usuários, mas não possui permissão para
                alterá-los.
              </span>
            </div>
          </div>
        )}

        {/* ERRO */}

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

        {/* SUCESSO */}

        {sucesso && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>

            <p>{sucesso}</p>

            <button onClick={() => setSucesso("")} aria-label="Fechar aviso">
              ×
            </button>
          </div>
        )}

        {/* INDICADORES */}

        <section className="stats-grid">
          <article className="stat-card stat-total">
            <div className="stat-topline">
              <span className="stat-label">Total de usuários</span>

              <span className="stat-icon">♙</span>
            </div>

            <strong className="stat-number">
              {carregando ? "—" : usuarios.length}
            </strong>

            <span className="stat-foot">Contas cadastradas no sistema</span>
          </article>

          <article className="stat-card">
            <div className="stat-topline">
              <span className="stat-label">Ativos</span>

              <span className="stat-icon icon-green">✓</span>
            </div>

            <strong className="stat-number">
              {carregando ? "—" : totalAtivos}
            </strong>

            <span className="stat-foot">Acesso habilitado</span>
          </article>

          <article className="stat-card">
            <div className="stat-topline">
              <span className="stat-label">Inativos</span>

              <span className="stat-icon icon-red">⊘</span>
            </div>

            <strong className="stat-number">
              {carregando ? "—" : totalInativos}
            </strong>

            <span className="stat-foot">Acesso desabilitado</span>
          </article>

          <article className="stat-card">
            <div className="stat-topline">
              <span className="stat-label">E-mails verificados</span>

              <span className="stat-icon icon-amber">✉</span>
            </div>

            <strong className="stat-number">
              {carregando ? "—" : totalVerificados}
            </strong>

            <span className="stat-foot">
              {totalPendentes} aguardando verificação
            </span>
          </article>
        </section>

        {/* LISTAGEM */}

        <section className="users-card">
          <div className="card-heading">
            <div>
              <span className="section-kicker">EQUIPE E ACESSOS</span>

              <h2>Contas cadastradas</h2>

              <p>Pesquise, consulte e acompanhe a situação de cada conta.</p>
            </div>

            <button
              className="refresh-button"
              onClick={() => carregarUsuarios(true)}
              disabled={atualizando || carregando}
            >
              <span className={atualizando ? "refresh spinning" : "refresh"}>
                ↻
              </span>

              {atualizando ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {/* PESQUISA E FILTROS */}

          <div className="list-controls">
            <label className="search-box">
              <span>⌕</span>

              <input
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar por nome, e-mail, telefone ou ID..."
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
                  ["todos", "Todos", usuarios.length],
                  ["ativos", "Ativos", totalAtivos],
                  ["inativos", "Inativos", totalInativos],
                  ["verificados", "Verificados", totalVerificados],
                  ["pendentes", "Pendentes", totalPendentes],
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

          {/* TABELA */}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>USUÁRIO</th>
                  <th>CONTATO</th>
                  <th>CADASTRO</th>
                  <th>ÚLTIMO ACESSO</th>
                  <th>VERIFICAÇÃO</th>
                  <th>STATUS</th>

                  {podeGerenciar && <th className="actions-head">AÇÕES</th>}
                </tr>
              </thead>

              <tbody>
                {carregando ? (
                  <tr>
                    <td colSpan={podeGerenciar ? 7 : 6} className="empty-state">
                      <span className="spinner" />

                      <strong>Carregando usuários</strong>

                      <small>Consultando os dados da API...</small>
                    </td>
                  </tr>
                ) : usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={podeGerenciar ? 7 : 6} className="empty-state">
                      <span className="empty-symbol">♙</span>

                      <strong>
                        {usuarios.length === 0
                          ? "Nenhum usuário cadastrado"
                          : "Nenhum resultado encontrado"}
                      </strong>

                      <small>
                        {usuarios.length === 0
                          ? "Quando houver contas cadastradas, elas aparecerão nesta lista."
                          : "Altere a pesquisa ou selecione outro filtro."}
                      </small>
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((item) => {
                    const verificado = Boolean(item.email_verificado_em);

                    const administrador = ehAdministrador(item, usuario);

                    return (
                      <tr key={item.id_usuario}>
                        {/* USUÁRIO */}

                        <td>
                          <div className="user-cell">
                            <span className="avatar">
                              {iniciais(item.nome)}
                            </span>

                            <span className="user-meta">
                              <strong>{item.nome || "Usuário sem nome"}</strong>

                              <small>
                                UID #{item.id_usuario}
                                {administrador && (
                                  <span className="admin-tag">
                                    {" "}
                                    · Administrador
                                  </span>
                                )}
                              </small>
                            </span>
                          </div>
                        </td>

                        {/* CONTATO */}

                        <td>
                          <span className="contact-email">
                            {item.email || "E-mail não informado"}
                          </span>

                          <small className="contact-phone">
                            {item.telefone || "Telefone não informado"}
                          </small>
                        </td>

                        {/* CADASTRO */}

                        <td className="date-cell">
                          {formatarData(item.criado_em)}
                        </td>

                        {/* ÚLTIMO ACESSO */}

                        <td className="date-cell">
                          {formatarData(item.ultimo_acesso_em)}
                        </td>

                        {/* VERIFICAÇÃO */}

                        <td>
                          <span
                            className={`badge-state ${
                              verificado ? "badge-verified" : "badge-pending"
                            }`}
                          >
                            <i />

                            {verificado ? "Verificado" : "Pendente"}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`badge-state ${
                              item.ativo ? "badge-active" : "badge-inactive"
                            }`}
                          >
                            <i />

                            {item.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>

                        {/* AÇÕES */}

                        {podeGerenciar && (
                          <td>
                            <div className="row-actions">
                              {!verificado && (
                                <button
                                  title="Marcar e-mail como verificado"
                                  onClick={() => verificarEmail(item)}
                                  className="action-verify"
                                >
                                  ✉
                                </button>
                              )}

                              <button
                                title="Editar usuário"
                                onClick={() => abrirEdicao(item)}
                              >
                                ✎
                              </button>

                              {/* ADMINISTRADOR NÃO TEM BOTÃO DE STATUS */}

                              {!administrador && (
                                <button
                                  type="button"
                                  title={
                                    item.ativo
                                      ? "Desativar usuário"
                                      : "Ativar usuário"
                                  }
                                  className={
                                    item.ativo
                                      ? "action-disable"
                                      : "action-enable"
                                  }
                                  onClick={() => alternarStatus(item)}
                                >
                                  {item.ativo ? "⊘" : "✓"}
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* RODAPÉ DA TABELA */}

          <footer className="table-footer">
            <span>
              Mostrando <strong>{usuariosFiltrados.length}</strong> de{" "}
              <strong>{usuarios.length}</strong> usuários
            </span>

            <span className="table-footer-note">
              {podeGerenciar
                ? "Permissão de gerenciamento habilitada"
                : "Consulta somente leitura"}
            </span>
          </footer>
        </section>

        {/* SEGURANÇA */}

        <div className="security-note">
          <span className="security-icon">◇</span>

          <div>
            <strong>Segurança das contas</strong>

            <p>
              As senhas não são exibidas nesta tela. Os dados são carregados
              pela API e as ações administrativas dependem da permissão{" "}
              <code>usuarios.gerenciar</code>.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL DE CADASTRO E EDIÇÃO */}

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
                <span className="section-kicker">ADMINISTRAÇÃO / USUÁRIOS</span>

                <h2>{editando !== null ? "Editar usuário" : "Novo usuário"}</h2>

                <p>
                  {editando !== null
                    ? "Atualize os dados da conta."
                    : "Crie uma conta de acesso para a equipe."}
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
                {/* NOME */}

                <label className="field full">
                  <span>
                    Nome completo <b>*</b>
                  </span>

                  <input
                    value={form.nome}
                    onChange={(evento) =>
                      atualizarCampo("nome", evento.target.value)
                    }
                    placeholder="Ex.: Maria da Silva"
                    autoComplete="name"
                    required
                  />
                </label>

                {/* E-MAIL */}

                <label className="field full">
                  <span>
                    E-mail <b>*</b>
                  </span>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(evento) =>
                      atualizarCampo("email", evento.target.value)
                    }
                    placeholder="usuario@exemplo.com"
                    autoComplete="email"
                    required
                  />
                </label>

                {/* TELEFONE */}

                <label className="field full">
                  <span>Telefone</span>

                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(evento) =>
                      atualizarCampo("telefone", evento.target.value)
                    }
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                  />
                </label>

                {/* SENHA */}

                {editando === null && (
                  <label className="field full">
                    <span>
                      Senha inicial <b>*</b>
                    </span>

                    <input
                      type="password"
                      value={form.senha}
                      onChange={(evento) =>
                        atualizarCampo("senha", evento.target.value)
                      }
                      placeholder="Mínimo de 8 caracteres"
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />

                    <small>A senha será transformada em hash no backend.</small>
                  </label>
                )}
              </div>

              {/* BOTÕES DO MODAL */}

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
                      : "Cadastrar usuário"}
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

// =====================================================
// ESTILOS
// =====================================================

const styles = `
  .usuarios-page {
    min-height: 100vh;
    position: relative;
    overflow: visible;
    padding: 38px 34px 58px;
    background: transparent;
    color: #f6edf4;
  }

  .page-shell {
    max-width: 1540px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 26px;
    margin-bottom: 30px;
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #c18bad;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.65px;
  }

  .eyebrow i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #e283b8;
    box-shadow: 0 0 12px #e283b8;
  }

  .eyebrow span {
    color: #766a78;
  }

  h1 {
    margin: 10px 0 7px;
    color: #fff7fd;
    font-size: clamp(28px, 3vw, 36px);
    font-weight: 760;
    letter-spacing: -1.35px;
  }

  .header-copy p {
    margin: 0;
    color: #a99baa;
    font-size: 13px;
  }

  button {
    font: inherit;
    cursor: pointer;
  }

  button:disabled {
    opacity: .55;
    cursor: wait;
  }

  .primary-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    min-height: 43px;
    padding: 0 18px;
    border: 1px solid #bd679a;
    border-radius: 9px;
    color: #fff;
    background: linear-gradient(135deg, #ad5288, #77365f);
    box-shadow: 0 8px 24px #8d35652e;
    font-size: 12px;
    font-weight: 750;
    transition: transform .18s ease, filter .18s ease;
  }

  .primary-button:hover {
    transform: translateY(-1px);
    filter: brightness(1.1);
  }

  .button-plus {
    font-size: 18px;
    line-height: 1;
  }

  .readonly-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
    padding: 13px 16px;
    border: 1px solid #51404f;
    border-radius: 10px;
    background: #211922;
  }

  .readonly-symbol {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 9px;
    color: #d2a1c4;
    background: #76466a40;
  }

  .readonly-banner strong,
  .readonly-banner span {
    display: block;
  }

  .readonly-banner strong {
    color: #ead8e6;
    font-size: 11px;
  }

  .readonly-banner div span {
    margin-top: 3px;
    color: #988998;
    font-size: 10px;
  }

  .alert {
    display: flex;
    align-items: center;
    gap: 11px;
    margin-bottom: 17px;
    padding: 13px 15px;
    border: 1px solid;
    border-radius: 9px;
  }

  .alert-error {
    border-color: #9d4b5a;
    color: #f3b2bc;
    background: #6f29352b;
  }

  .alert-success {
    border-color: #397c56;
    color: #9ce6b7;
    background: #23563b2b;
  }

  .alert-icon {
    display: grid;
    place-items: center;
    flex: 0 0 25px;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background: #ffffff12;
    font-size: 12px;
    font-weight: 800;
  }

  .alert strong {
    display: block;
    font-size: 11px;
  }

  .alert p {
    margin: 3px 0 0;
    font-size: 10px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .alert > button {
    margin-left: auto;
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 18px;
    opacity: .75;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 15px;
    margin-bottom: 22px;
  }

  .stat-card {
    min-height: 120px;
    padding: 18px 19px;
    border: 1px solid #392b3b;
    border-radius: 12px;
    background: linear-gradient(145deg, #211923, #17131a 72%);
    box-shadow: 0 7px 22px #00000016;
  }

  .stat-total {
    border-color: #68425e;
    background: linear-gradient(145deg, #2a1c29, #19131b 76%);
  }

  .stat-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .stat-label {
    color: #b7a8b8;
    font-size: 11px;
    font-weight: 550;
  }

  .stat-icon {
    display: grid;
    place-items: center;
    width: 37px;
    height: 37px;
    border-radius: 10px;
    color: #e2a9ce;
    background: #8d4d7838;
    font-size: 18px;
  }

  .icon-green {
    color: #83dfad;
    background: #277d5638;
  }

  .icon-red {
    color: #e998a7;
    background: #9d3d5238;
  }

  .icon-amber {
    color: #edc57e;
    background: #a4772d38;
  }

  .stat-number {
    display: block;
    margin-top: 7px;
    color: #fff8fd;
    font-size: 29px;
    font-weight: 750;
    letter-spacing: -.7px;
  }

  .stat-foot {
    display: block;
    margin-top: 3px;
    color: #847987;
    font-size: 10px;
  }

  .users-card {
    overflow: hidden;
    border: 1px solid #3a2b3c;
    border-radius: 13px;
    background: #17131b;
    box-shadow: 0 16px 44px #00000020;
  }

  .card-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 22px 23px;
    border-bottom: 1px solid #352838;
  }

  .section-kicker {
    color: #c58bad;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.5px;
  }

  .card-heading h2 {
    margin: 5px 0 4px;
    color: #f8eff6;
    font-size: 16px;
    letter-spacing: -.25px;
  }

  .card-heading p {
    margin: 0;
    color: #968a99;
    font-size: 11px;
  }

  .refresh-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 38px;
    padding: 0 13px;
    border: 1px solid #4b394c;
    border-radius: 8px;
    color: #d9c7d7;
    background: #241b27;
    font-size: 10px;
    font-weight: 650;
  }

  .refresh-button:hover {
    border-color: #8f5a7c;
    background: #302231;
  }

  .refresh {
    font-size: 18px;
    line-height: 1;
  }

  .spinning {
    display: inline-block;
    animation: spin .8s linear infinite;
    font-size: 18px;
  }

  .list-controls {
    display: flex;
    flex-direction: column;
    gap: 13px;
    padding: 16px 21px 14px;
    border-bottom: 1px solid #352838;
    background: #1b1620;
  }

  .search-box {
    display: flex;
    align-items: center;
    gap: 10px;
    width: min(100%, 430px);
    height: 41px;
    padding: 0 12px;
    border: 1px solid #47364a;
    border-radius: 8px;
    color: #cc8fb5;
    background: #100d13;
    box-sizing: border-box;
  }

  .search-box > span {
    font-size: 22px;
    line-height: 1;
  }

  .search-box input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    color: #f4eaf2;
    background: transparent;
    font-size: 11px;
  }

  .search-box input::placeholder {
    color: #7c7180;
  }

  .search-box button {
    border: 0;
    color: #b69caf;
    background: transparent;
    font-size: 18px;
  }

  .filter-tabs {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .filter-tabs button {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    min-height: 31px;
    padding: 0 10px;
    border: 1px solid transparent;
    border-radius: 7px;
    color: #9b8d9d;
    background: transparent;
    font-size: 10px;
    transition: .16s ease;
  }

  .filter-tabs button:hover {
    color: #ead5e5;
    background: #302331;
  }

  .filter-tabs button.selected {
    border-color: #86506f;
    color: #ffe3f3;
    background: #653a55;
  }

  .filter-tabs button span {
    min-width: 17px;
    padding: 2px 5px;
    border-radius: 20px;
    color: #c4b1c3;
    background: #ffffff10;
    font-size: 9px;
    text-align: center;
  }

  .filter-tabs button.selected span {
    color: #fff;
    background: #ffffff20;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    min-width: 1060px;
    border-collapse: collapse;
  }

  th {
    padding: 14px 17px;
    color: #98889b;
    background: #1d1721;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.05px;
    text-align: left;
    white-space: nowrap;
  }

  td {
    padding: 14px 17px;
    border-top: 1px solid #302431;
    color: #d9ceda;
    font-size: 11px;
    vertical-align: middle;
  }

  tbody tr {
    transition: background .14s ease;
  }

  tbody tr:hover {
    background: #211923;
  }

  .user-cell {
    display: flex;
    align-items: center;
    gap: 11px;
    min-width: 205px;
  }

  .avatar {
    display: grid;
    flex: 0 0 38px;
    place-items: center;
    width: 38px;
    height: 38px;
    border: 1px solid #784866;
    border-radius: 10px;
    color: #f0b9d7;
    background: linear-gradient(145deg, #754365, #3e293d);
    font-size: 11px;
    font-weight: 800;
  }

  .user-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .user-meta strong {
    max-width: 185px;
    overflow: hidden;
    color: #f5eaf3;
    font-size: 11px;
    text-overflow: ellipsis;
  }

  .user-meta small {
    color: #87798a;
    font-size: 9px;
  }

  .admin-tag {
    color: #e6b2d2;
    font-weight: 800;
  }

  .contact-email {
    display: block;
    color: #e0d2df;
    font-size: 10px;
  }

  .contact-phone {
    display: block;
    margin-top: 4px;
    color: #857889;
    font-size: 9px;
  }

  .date-cell {
    color: #a99baa;
    font-size: 10px;
    white-space: nowrap;
  }

  .badge-state {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 9px;
    border: 1px solid transparent;
    border-radius: 30px;
    font-size: 9px;
    font-weight: 650;
    white-space: nowrap;
  }

  .badge-state i {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .badge-active,
  .badge-verified {
    border-color: #28674755;
    color: #8fe1b1;
    background: #1c50362c;
  }

  .badge-active i,
  .badge-verified i {
    background: #65d498;
    box-shadow: 0 0 8px #65d49855;
  }

  .badge-inactive {
    border-color: #873f5055;
    color: #e79ba8;
    background: #7c35422b;
  }

  .badge-inactive i {
    background: #d9798b;
  }

  .badge-pending {
    border-color: #87622e55;
    color: #e6c27f;
    background: #80602b2b;
  }

  .badge-pending i {
    background: #e0ad55;
  }

  .actions-head {
    text-align: right;
  }

  .row-actions {
    display: flex;
    justify-content: flex-end;
    gap: 6px;
  }

  .row-actions button {
    display: grid;
    place-items: center;
    width: 31px;
    height: 31px;
    border: 1px solid #49384b;
    border-radius: 7px;
    color: #d5b4cc;
    background: #241b27;
    font-size: 14px;
    transition: .15s ease;
  }

  .row-actions button:hover {
    color: white;
    border-color: #9a5e82;
    background: #633b56;
  }

  .row-actions .action-verify {
    color: #e6c27f;
  }

  .row-actions .action-disable {
    color: #e69aaa;
  }

  .row-actions .action-enable {
    color: #82dca8;
  }

  .empty-state {
    height: 190px;
    padding: 34px 15px !important;
    color: #9b8c9d !important;
    text-align: center !important;
  }

  .empty-state strong,
  .empty-state small {
    display: block;
  }

  .empty-state strong {
    margin-top: 11px;
    color: #e2d4e1;
    font-size: 12px;
  }

  .empty-state small {
    margin-top: 5px;
    color: #827587;
    font-size: 10px;
  }

  .empty-symbol {
    display: block;
    color: #c681ae;
    font-size: 29px;
  }

  .table-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 20px;
    border-top: 1px solid #352838;
    color: #948798;
    font-size: 10px;
  }

  .table-footer strong {
    color: #e8d9e6;
  }

  .table-footer-note {
    color: #7f7182;
  }

  .security-note {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-top: 17px;
    padding: 16px 18px;
    border: 1px solid #483345;
    border-radius: 10px;
    background: #211923;
  }

  .security-icon {
    display: grid;
    flex: 0 0 31px;
    place-items: center;
    width: 31px;
    height: 31px;
    border-radius: 8px;
    color: #e3a9ca;
    background: #77406440;
    font-size: 17px;
  }

  .security-note strong {
    color: #ead9e8;
    font-size: 11px;
  }

  .security-note p {
    margin: 4px 0 0;
    color: #a395a4;
    font-size: 10px;
    line-height: 1.6;
  }

  .security-note code {
    color: #e2a9ca;
  }

  .modal-backdrop {
    position: fixed;
    z-index: 300;
    inset: 0;
    display: grid;
    place-items: center;
    overflow-y: auto;
    padding: 20px;
    background: #08060bbd;
    backdrop-filter: blur(6px);
  }

  .modal {
    width: min(540px, 100%);
    padding: 24px;
    border: 1px solid #594052;
    border-radius: 14px;
    background: #1b1620;
    box-shadow: 0 25px 90px #000a;
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 22px;
  }

  .modal-header h2 {
    margin: 7px 0 4px;
    color: #f7edf5;
    font-size: 22px;
  }

  .modal-header p {
    margin: 0;
    color: #9c8c9e;
    font-size: 11px;
  }

  .close-button {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 1px solid #49384b;
    border-radius: 8px;
    color: #d9c2d4;
    background: #2a202c;
    font-size: 21px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .field.full {
    grid-column: 1 / -1;
  }

  .field > span {
    color: #e1d2df;
    font-size: 11px;
    font-weight: 650;
  }

  .field > span b {
    color: #e38db7;
  }

  .field input {
    width: 100%;
    box-sizing: border-box;
    padding: 12px;
    border: 1px solid #49384b;
    border-radius: 8px;
    outline: 0;
    color: #f5eaf3;
    background: #100d13;
    font: inherit;
    font-size: 11px;
  }

  .field input:focus {
    border-color: #b56a98;
    box-shadow: 0 0 0 3px #b56a9820;
  }

  .field input::placeholder {
    color: #776b7b;
  }

  .field small {
    color: #928394;
    font-size: 9px;
    line-height: 1.5;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 9px;
    margin-top: 24px;
    padding-top: 17px;
    border-top: 1px solid #3b2c3e;
  }

  .secondary-button {
    min-height: 40px;
    padding: 0 15px;
    border: 1px solid #554158;
    border-radius: 8px;
    color: #d6c5d4;
    background: #2a202d;
    font-size: 11px;
  }

  .loading-screen {
    display: flex;
    min-height: 65vh;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    color: #d9cbd8;
    font-size: 12px;
  }

  .spinner {
    display: inline-block;
    width: 18px;
    height: 18px;
    border: 2px solid #60485e;
    border-top-color: #e18aba;
    border-radius: 50%;
    animation: spin .8s linear infinite;
  }

  .loading-screen .spinner {
    width: 28px;
    height: 28px;
    border-width: 3px;
  }

  .access-card {
    max-width: 540px;
    margin: 9vh auto;
    padding: 36px;
    border: 1px solid #493447;
    border-radius: 16px;
    background: #1b1620;
    text-align: center;
    box-shadow: 0 20px 65px #0004;
  }

  .access-icon {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    margin: 0 auto 18px;
    border-radius: 14px;
    color: #e2a8c9;
    background: #79436640;
    font-size: 26px;
  }

  .access-card h1 {
    font-size: 25px;
  }

  .access-card p {
    color: #a99baa;
    font-size: 12px;
    line-height: 1.7;
  }

  .access-card code {
    color: #e2a8c9;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 1100px) {
    .stats-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .usuarios-page {
      padding: 25px 15px 38px;
    }

    .page-header {
      align-items: flex-start;
      flex-direction: column;
    }

    .page-header .primary-button {
      width: 100%;
    }

    .card-heading {
      align-items: flex-start;
    }

    .list-controls {
      padding: 13px;
    }

    .filter-tabs {
      gap: 4px;
    }

    .filter-tabs button {
      padding: 0 8px;
    }

    .table-footer {
      align-items: flex-start;
      flex-direction: column;
    }
  }

  @media (max-width: 520px) {
    .stats-grid {
      gap: 9px;
    }

    .stat-card {
      min-height: 105px;
      padding: 13px;
    }

    .stat-label {
      font-size: 10px;
    }

    .stat-number {
      font-size: 24px;
    }

    .stat-icon {
      width: 32px;
      height: 32px;
    }

    .card-heading {
      flex-direction: column;
    }

    .refresh-button {
      width: 100%;
    }

    .search-box {
      width: 100%;
    }

    .modal {
      padding: 18px;
    }

    .form-grid {
      grid-template-columns: 1fr;
    }

    .field.full {
      grid-column: auto;
    }

    .modal-footer {
      flex-direction: column-reverse;
    }

    .modal-footer button {
      width: 100%;
    }
  }
`;
