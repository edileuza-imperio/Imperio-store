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
        .usuarios-page {
          min-height: 100vh;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 28%),
            radial-gradient(circle at bottom right, rgba(17, 24, 39, 0.08), transparent 28%),
            linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .usuarios-container {
          max-width: 1460px;
          margin: 0 auto;
        }

        .hero {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          flex-wrap: wrap;
          background: linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
          border: 1px solid rgba(226, 232, 240, 0.95);
          border-radius: 30px;
          padding: 28px;
          box-shadow: 0 18px 45px rgba(15, 23, 42, 0.06);
          margin-bottom: 20px;
        }

        .hero-conteudo {
          flex: 1;
          min-width: 280px;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: #eef2ff;
          color: #3730a3;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .hero h1 {
          margin: 0 0 10px;
          font-size: 38px;
          line-height: 1.05;
          color: #0f172a;
          font-weight: 900;
        }

        .hero p {
          margin: 0;
          max-width: 760px;
          color: #475569;
          font-size: 15px;
          line-height: 1.7;
        }

        .hero-acoes {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          min-height: 48px;
          padding: 12px 18px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn-dark {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #ffffff;
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.18);
        }

        .btn-light {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #dbe3ee;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: linear-gradient(180deg, #ffffff 0%, #fcfdff 100%);
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
        }

        .stat-card span {
          display: block;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .stat-card strong {
          display: block;
          font-size: 30px;
          color: #0f172a;
          line-height: 1;
          margin-bottom: 6px;
        }

        .stat-card small {
          color: #94a3b8;
          font-size: 13px;
        }

        .toolbar {
          margin-bottom: 20px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid #dbe3ee;
          border-radius: 22px;
          padding: 0 16px 0 48px;
          min-height: 58px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
        }

        .search-icon {
          position: absolute;
          left: 16px;
          width: 20px;
          height: 20px;
          color: #64748b;
        }

        .search-box input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #0f172a;
          font-size: 14px;
          font-weight: 500;
        }

        .search-box input::placeholder {
          color: #94a3b8;
        }

        .estado-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: 24px;
          text-align: center;
          color: #334155;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
        }

        .estado-erro {
          background: #fff1f2;
          border-color: #fecdd3;
          color: #be123c;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
          gap: 18px;
        }

        .user-card {
          position: relative;
          overflow: hidden;
          background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 22px;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .user-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 42px rgba(15, 23, 42, 0.1);
        }

        .card-glow {
          position: absolute;
          top: -40px;
          right: -20px;
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.12), transparent 70%);
          pointer-events: none;
        }

        .card-top {
          display: flex;
          gap: 14px;
          align-items: center;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .avatar {
          width: 62px;
          height: 62px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
          border: 1px solid #bfdbfe;
          flex-shrink: 0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
        }

        .user-main {
          min-width: 0;
          flex: 1;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .title-row h2 {
          margin: 0;
          color: #0f172a;
          font-size: 21px;
          line-height: 1.2;
          font-weight: 900;
        }

        .email {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
          word-break: break-word;
        }

        .badge-protected {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: linear-gradient(135deg, #111827 0%, #1f2937 100%);
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        .badge-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .badge-soft,
        .badge-status {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid transparent;
        }

        .badge-soft {
          background: #f8fafc;
          color: #334155;
          border-color: #e2e8f0;
        }

        .badge-level {
          background: #eef2ff;
          color: #3730a3;
          border-color: #c7d2fe;
        }

        .badge-status-ativo {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }

        .badge-status-inativo {
          background: #fff7ed;
          color: #c2410c;
          border-color: #fdba74;
        }

        .badge-status-bloqueado {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        .badge-status-padrao {
          background: #f1f5f9;
          color: #334155;
          border-color: #cbd5e1;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
          position: relative;
          z-index: 1;
        }

        .info-card {
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 14px;
        }

        .info-card.destaque {
          background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
          border-color: #bfdbfe;
        }

        .info-card span {
          display: block;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }

        .info-card strong {
          color: #0f172a;
          font-size: 15px;
          line-height: 1.45;
          word-break: break-word;
        }

        .pin-row {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: space-between;
        }

        .pin-row strong {
          font-size: 16px;
          font-weight: 900;
        }

        .copy-btn {
          border: none;
          background: #0f172a;
          color: #ffffff;
          border-radius: 12px;
          min-height: 34px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: opacity 0.2s ease, transform 0.2s ease;
          white-space: nowrap;
        }

        .copy-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .copy-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .footer-line {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          margin-bottom: 16px;
        }

        .card-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }

        .action-btn {
          flex: 1;
          min-width: 100px;
          min-height: 46px;
          padding: 10px 14px;
          border-radius: 16px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
        }

        .action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .action-btn-view {
          background: #f8fafc;
          color: #0f172a;
          border: 1px solid #dbe3ee;
        }

        .action-btn-edit {
          background: linear-gradient(135deg, #dcfce7 0%, #ecfdf5 100%);
          color: #166534;
          border: 1px solid #86efac;
        }

        .action-btn-delete {
          background: linear-gradient(135deg, #ffe4e6 0%, #fff1f2 100%);
          color: #be123c;
          border: 1px solid #fda4af;
        }

        .action-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 900px) {
          .hero {
            padding: 22px;
          }

          .hero h1 {
            font-size: 32px;
          }
        }

        @media (max-width: 768px) {
          .usuarios-page {
            padding: 16px;
          }

          .hero {
            flex-direction: column;
          }

          .hero-acoes {
            width: 100%;
          }

          .hero-acoes .btn {
            width: 100%;
          }

          .cards-grid {
            grid-template-columns: 1fr;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .card-actions {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
          }

          .hero h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
}