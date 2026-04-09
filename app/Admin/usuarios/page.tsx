"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";

type Usuario = {
  id_usuario?: number;
  id?: number;
  nome?: string;
  email?: string;
  pin?: string | null;
  nivel_id?: number | string;
  status_id?: number | string;
  telefone?: string | null;
  cpf?: string | null;
  criado?: string;
  atualizado?: string;
};

type Nivel = {
  id_nivel?: number;
  nome?: string;
  codigo?: string;
  prioridade?: number;
  descricao?: string;
  criado?: string;
};

type StatusItem = {
  id_status?: number;
  nome?: string;
  codigo?: string;
  descricao?: string;
  criado?: string;
};

const api = axios.create({
  baseURL: "https://lightgrey-cattle-160990.hostingersite.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function getUsuariosFromResponse(payload: any): Usuario[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.data?.dados)) return payload.data.dados;
  return [];
}

function getNiveisFromResponse(payload: any): Nivel[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  return [];
}

function getStatusFromResponse(payload: any): StatusItem[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  return [];
}

function formatarData(data?: string) {
  if (!data) return "-";

  const d = new Date(data.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return data;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

function formatarCpf(cpf?: string | null) {
  if (!cpf) return "-";
  const numeros = cpf.replace(/\D/g, "");
  if (numeros.length !== 11) return cpf;
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarTelefone(telefone?: string | null) {
  if (!telefone) return "-";
  const numeros = telefone.replace(/\D/g, "");

  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }

  return telefone;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [statusList, setStatusList] = useState<StatusItem[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);
  const [copiadoId, setCopiadoId] = useState<number | null>(null);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(6);

  const normalizarUsuarioId = useCallback((usuario: Usuario) => {
    return Number(usuario.id_usuario ?? usuario.id ?? 0);
  }, []);

  const buscarNivelPorId = useCallback(
    (nivelId?: number | string) => {
      const id = Number(nivelId ?? 0);
      return niveis.find((nivel) => Number(nivel.id_nivel ?? 0) === id) ?? null;
    },
    [niveis]
  );

  const buscarStatusPorId = useCallback(
    (statusId?: number | string) => {
      const id = Number(statusId ?? 0);
      return statusList.find((status) => Number(status.id_status ?? 0) === id) ?? null;
    },
    [statusList]
  );

  const obterNomeNivel = useCallback(
    (nivelId?: number | string) => buscarNivelPorId(nivelId)?.nome || "-",
    [buscarNivelPorId]
  );

  const obterCodigoNivel = useCallback(
    (nivelId?: number | string) => buscarNivelPorId(nivelId)?.codigo || "",
    [buscarNivelPorId]
  );

  const obterNomeStatus = useCallback(
    (statusId?: number | string) => buscarStatusPorId(statusId)?.nome || "-",
    [buscarStatusPorId]
  );

  const obterCodigoStatus = useCallback(
    (statusId?: number | string) => buscarStatusPorId(statusId)?.codigo || "",
    [buscarStatusPorId]
  );

  const ehProtegido = useCallback(
    (usuario: Usuario) => {
      const nivelId = Number(usuario.nivel_id ?? 0);
      const nomeNivel = obterNomeNivel(usuario.nivel_id).toLowerCase();
      const codigoNivel = obterCodigoNivel(usuario.nivel_id).toLowerCase();

      return (
        nivelId === 1 ||
        nomeNivel.includes("sistema") ||
        codigoNivel.includes("sistema")
      );
    },
    [obterCodigoNivel, obterNomeNivel]
  );

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const [resUsuarios, resNiveis, resStatus] = await Promise.all([
        api.get("/painel/usuarios"),
        api.get("/painel/niveis"),
        api.get("/painel/status"),
      ]);

      setUsuarios(getUsuariosFromResponse(resUsuarios.data));
      setNiveis(getNiveisFromResponse(resNiveis.data));
      setStatusList(getStatusFromResponse(resStatus.data));
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);

      if (error?.response?.status === 401) {
        setErro("Sessão inválida. Faça login novamente.");
      } else if (error?.response?.status === 403) {
        setErro("Você não tem permissão para acessar esta página.");
      } else {
        setErro("Não foi possível carregar os usuários.");
      }

      setUsuarios([]);
      setNiveis([]);
      setStatusList([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return usuarios;

    return usuarios.filter((usuario) => {
      const id = String(normalizarUsuarioId(usuario));
      const nome = String(usuario.nome ?? "").toLowerCase();
      const email = String(usuario.email ?? "").toLowerCase();
      const telefone = String(usuario.telefone ?? "").toLowerCase();
      const cpf = String(usuario.cpf ?? "").toLowerCase();
      const pin = String(usuario.pin ?? "").toLowerCase();
      const nomeNivel = obterNomeNivel(usuario.nivel_id).toLowerCase();
      const nomeStatus = obterNomeStatus(usuario.status_id).toLowerCase();
      const codigoNivel = obterCodigoNivel(usuario.nivel_id).toLowerCase();
      const codigoStatus = obterCodigoStatus(usuario.status_id).toLowerCase();

      return (
        id.includes(termo) ||
        nome.includes(termo) ||
        email.includes(termo) ||
        telefone.includes(termo) ||
        cpf.includes(termo) ||
        pin.includes(termo) ||
        nomeNivel.includes(termo) ||
        nomeStatus.includes(termo) ||
        codigoNivel.includes(termo) ||
        codigoStatus.includes(termo)
      );
    });
  }, [
    busca,
    usuarios,
    normalizarUsuarioId,
    obterNomeNivel,
    obterNomeStatus,
    obterCodigoNivel,
    obterCodigoStatus,
  ]);

  const totalProtegidos = useMemo(
    () => usuarios.filter((usuario) => ehProtegido(usuario)).length,
    [usuarios, ehProtegido]
  );

  const totalAtivos = useMemo(
    () =>
      usuarios.filter(
        (usuario) => obterCodigoStatus(usuario.status_id).toUpperCase() === "ATIVO"
      ).length,
    [usuarios, obterCodigoStatus]
  );

  const totalInativos = useMemo(
    () =>
      usuarios.filter(
        (usuario) => obterCodigoStatus(usuario.status_id).toUpperCase() === "INATIVO"
      ).length,
    [usuarios, obterCodigoStatus]
  );

  const copiarPin = useCallback(async (pin: string | null | undefined, id: number) => {
    if (!pin) return;

    try {
      await navigator.clipboard.writeText(pin);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 1500);
    } catch (error) {
      console.error("Erro ao copiar PIN:", error);
    }
  }, []);

  const excluirUsuario = useCallback(
    async (id: number) => {
      const confirmar = window.confirm("Tem certeza que deseja excluir este usuário?");
      if (!confirmar) return;

      try {
        setExcluindoId(id);
        await api.delete(`/painel/usuario/${id}`);

        setUsuarios((prev) =>
          prev.filter((usuario) => normalizarUsuarioId(usuario) !== id)
        );
      } catch (error: any) {
        console.error("Erro ao excluir usuário:", error);
        alert(
          error?.response?.data?.mensagem || "Não foi possível excluir o usuário."
        );
      } finally {
        setExcluindoId(null);
      }
    },
    [normalizarUsuarioId]
  );

  const getStatusClass = useCallback(
    (statusId?: number | string) => {
      const codigo = obterCodigoStatus(statusId).toUpperCase();

      if (codigo === "ATIVO") return "status-badge status-ativo";
      if (codigo === "INATIVO") return "status-badge status-inativo";
      if (codigo === "BLOQUEADO") return "status-badge status-bloqueado";

      return "status-badge status-padrao";
    },
    [obterCodigoStatus]
  );

  useEffect(() => {
    setPaginaAtual(1);
  }, [busca, itensPorPagina]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / itensPorPagina)
  );

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return usuariosFiltrados.slice(inicio, fim);
  }, [usuariosFiltrados, paginaAtual, itensPorPagina]);

  return (
    <div className="usuarios-page">
      <div className="usuarios-container">
        <section className="hero">
          <div className="hero-bg" />

          <div className="hero-conteudo">
            <div className="hero-topo">
              <span className="hero-tag">Painel Administrativo</span>
              <h1>Usuários do sistema</h1>
              <p>
                Gerencie usuários com uma visualização moderna em cards, paginação,
                busca rápida e ações diretas.
              </p>
            </div>

            <div className="hero-acoes">
              <button className="btn btn-secundario" onClick={carregarDados}>
                Atualizar lista
              </button>

              <Link href="/Admin/usuarios/cadastrar" className="btn btn-primario">
                Novo usuário
              </Link>
            </div>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total</span>
            <strong>{usuarios.length}</strong>
            <small>Usuários cadastrados</small>
          </div>

          <div className="stat-card">
            <span>Ativos</span>
            <strong>{totalAtivos}</strong>
            <small>Usuários ativos</small>
          </div>

          <div className="stat-card">
            <span>Inativos</span>
            <strong>{totalInativos}</strong>
            <small>Status inativo</small>
          </div>

          <div className="stat-card">
            <span>Protegidos</span>
            <strong>{totalProtegidos}</strong>
            <small>Nível sistema</small>
          </div>
        </section>

        <section className="toolbar">
          <div className="toolbar-esquerda">
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar por nome, email, PIN, CPF, nível, status..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          <div className="toolbar-direita">
            <div className="select-box">
              <label htmlFor="itensPorPagina">Por página</label>
              <select
                id="itensPorPagina"
                value={itensPorPagina}
                onChange={(e) => setItensPorPagina(Number(e.target.value))}
              >
                <option value={3}>3</option>
                <option value={6}>6</option>
                <option value={9}>9</option>
                <option value={12}>12</option>
              </select>
            </div>
          </div>
        </section>

        {carregando ? (
          <div className="estado-box">Carregando usuários...</div>
        ) : erro ? (
          <div className="estado-box estado-erro">{erro}</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="estado-box">Nenhum usuário encontrado.</div>
        ) : (
          <>
            <section className="lista-topo">
              <div>
                <h2>Lista de usuários</h2>
                <p>
                  Exibindo {usuariosPaginados.length} de {usuariosFiltrados.length} resultado(s).
                </p>
              </div>

              <div className="contador-pagina">
                Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
              </div>
            </section>

            <section className="cards-grid">
              {usuariosPaginados.map((usuario) => {
                const id = normalizarUsuarioId(usuario);
                const nomeNivel = obterNomeNivel(usuario.nivel_id);
                const nomeStatus = obterNomeStatus(usuario.status_id);
                const protegido = ehProtegido(usuario);

                return (
                  <article className="usuario-card" key={id}>
                    <div className="card-topo">
                      <div className="usuario-head">
                        <div className="avatar">
                          {(usuario.nome?.charAt(0) || "U").toUpperCase()}
                        </div>

                        <div className="usuario-info">
                          <div className="usuario-nome-linha">
                            <h3>{usuario.nome || "Sem nome"}</h3>
                            {protegido && (
                              <span className="protect-badge">Protegido</span>
                            )}
                          </div>

                          <p>{usuario.email || "-"}</p>
                          <small>ID #{id}</small>
                        </div>
                      </div>

                      <span className={getStatusClass(usuario.status_id)}>
                        {nomeStatus}
                      </span>
                    </div>

                    <div className="card-badges">
                      <span className="nivel-badge">{nomeNivel}</span>
                    </div>

                    <div className="card-conteudo">
                      <div className="info-item">
                        <span className="label">PIN</span>
                        <div className="pin-linha">
                          <strong>{usuario.pin || "-"}</strong>
                          <button
                            type="button"
                            className="mini-btn"
                            onClick={() => copiarPin(usuario.pin, id)}
                            disabled={!usuario.pin}
                          >
                            {copiadoId === id ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                      </div>

                      <div className="info-item">
                        <span className="label">Telefone</span>
                        <strong>{formatarTelefone(usuario.telefone)}</strong>
                      </div>

                      <div className="info-item">
                        <span className="label">CPF</span>
                        <strong>{formatarCpf(usuario.cpf)}</strong>
                      </div>

                      <div className="info-item">
                        <span className="label">Criado em</span>
                        <strong>{formatarData(usuario.criado)}</strong>
                      </div>
                    </div>

                    <div className="card-acoes">
                      <Link
                        href={`/Admin/usuarios/${id}`}
                        className="acao-btn acao-ver"
                      >
                        Ver
                      </Link>

                      <Link
                        href={`/Admin/usuarios/${id}/editar`}
                        className="acao-btn acao-editar"
                      >
                        Editar
                      </Link>

                      <a
                        href={`mailto:${usuario.email || ""}?subject=${encodeURIComponent(
                          "Contato do sistema"
                        )}`}
                        className={`acao-btn acao-email ${!usuario.email ? "desabilitado" : ""}`}
                        onClick={(e) => {
                          if (!usuario.email) e.preventDefault();
                        }}
                      >
                        Enviar email
                      </a>

                      <button
                        type="button"
                        className="acao-btn acao-excluir"
                        onClick={() => excluirUsuario(id)}
                        disabled={excluindoId === id || protegido}
                      >
                        {excluindoId === id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="paginacao">
              <button
                type="button"
                className="page-btn"
                onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
              >
                ← Anterior
              </button>

              <div className="page-numeros">
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                  <button
                    key={pagina}
                    type="button"
                    className={`page-number ${paginaAtual === pagina ? "ativo" : ""}`}
                    onClick={() => setPaginaAtual(pagina)}
                  >
                    {pagina}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="page-btn"
                onClick={() =>
                  setPaginaAtual((prev) => Math.min(prev + 1, totalPaginas))
                }
                disabled={paginaAtual === totalPaginas}
              >
                Próxima →
              </button>
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        
      `}</style>
    </div>
  );
}