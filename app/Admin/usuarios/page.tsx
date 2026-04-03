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

function mascararCpf(cpf?: string | null) {
  if (!cpf) return "-";
  return cpf;
}

function mascararTelefone(telefone?: string | null) {
  if (!telefone) return "-";
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
      return (
        statusList.find((status) => Number(status.id_status ?? 0) === id) ?? null
      );
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
        (usuario) =>
          obterCodigoStatus(usuario.status_id).toUpperCase() === "ATIVO"
      ).length,
    [usuarios, obterCodigoStatus]
  );

  const copiarPin = useCallback(async (pin: string | null | undefined, id: number) => {
    if (!pin) return;

    try {
      await navigator.clipboard.writeText(pin);
      setCopiadoId(id);

      setTimeout(() => {
        setCopiadoId(null);
      }, 1800);
    } catch (error) {
      console.error("Erro ao copiar PIN:", error);
    }
  }, []);

  const excluirUsuario = useCallback(
    async (id: number) => {
      const confirmar = window.confirm(
        "Tem certeza que deseja excluir este usuário?"
      );
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
          error?.response?.data?.mensagem ||
            "Não foi possível excluir o usuário."
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

      if (codigo === "ATIVO") return "badge-status badge-status-ativo";
      if (codigo === "INATIVO") return "badge-status badge-status-inativo";
      if (codigo === "BLOQUEADO") return "badge-status badge-status-bloqueado";

      return "badge-status badge-status-padrao";
    },
    [obterCodigoStatus]
  );

  return (
    <div className="usuarios-page">
      <div className="usuarios-container">
        <section className="hero">
          <div className="hero-conteudo">
            <div className="hero-tag">Administração</div>
            <h1>Gestão de usuários</h1>
            <p>
              Visualize, pesquise e gerencie os usuários do sistema em um painel
              moderno, limpo e responsivo.
            </p>
          </div>

          <div className="hero-acoes">
            <button className="btn btn-light" onClick={carregarDados}>
              Atualizar lista
            </button>

            <Link href="/Admin/usuarios/novo" className="btn btn-dark">
              Novo usuário
            </Link>
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
            <small>Status ativo no sistema</small>
          </div>

          <div className="stat-card">
            <span>Protegidos</span>
            <strong>{totalProtegidos}</strong>
            <small>Nível de sistema</small>
          </div>

          <div className="stat-card">
            <span>Resultados</span>
            <strong>{usuariosFiltrados.length}</strong>
            <small>Após filtro da busca</small>
          </div>
        </section>

        <section className="toolbar">
          <div className="search-box">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="search-icon"
              aria-hidden="true"
            >
              <path
                d="M21 21L16.65 16.65M11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <input
              type="text"
              placeholder="Buscar por nome, email, PIN, CPF, nível, status..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </section>

        {carregando ? (
          <div className="estado-box">Carregando usuários...</div>
        ) : erro ? (
          <div className="estado-box estado-erro">{erro}</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="estado-box">Nenhum usuário encontrado.</div>
        ) : (
          <section className="cards-grid">
            {usuariosFiltrados.map((usuario) => {
              const id = normalizarUsuarioId(usuario);
              const nomeNivel = obterNomeNivel(usuario.nivel_id);
              const nomeStatus = obterNomeStatus(usuario.status_id);
              const protegido = ehProtegido(usuario);

              return (
                <article className="user-card" key={id}>
                  <div className="card-glow" />

                  <div className="card-top">
                    <div className="avatar">
                      {(usuario.nome?.charAt(0) || "U").toUpperCase()}
                    </div>

                    <div className="user-main">
                      <div className="title-row">
                        <h2>{usuario.nome || "Sem nome"}</h2>

                        {protegido && (
                          <span className="badge-protected">Protegido</span>
                        )}
                      </div>

                      <p className="email">{usuario.email || "-"}</p>
                    </div>
                  </div>

                  <div className="badge-row">
                    <span className="badge-soft">ID #{id}</span>
                    <span className="badge-soft badge-level">{nomeNivel}</span>
                    <span className={getStatusClass(usuario.status_id)}>
                      {nomeStatus}
                    </span>
                  </div>

                  <div className="info-grid">
                    <div className="info-card destaque">
                      <span>PIN</span>

                      <div className="pin-row">
                        <strong>{usuario.pin || "-"}</strong>

                        <button
                          type="button"
                          className="copy-btn"
                          onClick={() => copiarPin(usuario.pin, id)}
                          disabled={!usuario.pin}
                        >
                          {copiadoId === id ? "Copiado" : "Copiar"}
                        </button>
                      </div>
                    </div>

                    <div className="info-card">
                      <span>Telefone</span>
                      <strong>{mascararTelefone(usuario.telefone)}</strong>
                    </div>

                    <div className="info-card">
                      <span>CPF</span>
                      <strong>{mascararCpf(usuario.cpf)}</strong>
                    </div>

                    <div className="info-card">
                      <span>Criado em</span>
                      <strong>{formatarData(usuario.criado)}</strong>
                    </div>
                  </div>

                  <div className="footer-line" />

                  <div className="card-actions">
                    <Link
                      href={`/Admin/usuarios/${id}`}
                      className="action-btn action-btn-view"
                    >
                      Visualizar
                    </Link>

                    <Link
                      href={`/Admin/usuarios/${id}/editar`}
                      className="action-btn action-btn-edit"
                    >
                      Editar
                    </Link>

                    <button
                      type="button"
                      className="action-btn action-btn-delete"
                      onClick={() => excluirUsuario(id)}
                      disabled={excluindoId === id || protegido}
                      title={
                        protegido
                          ? "Usuário protegido não pode ser excluído."
                          : ""
                      }
                    >
                      {excluindoId === id ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      <style jsx>{`
        
      `}</style>
    </div>
  );
}