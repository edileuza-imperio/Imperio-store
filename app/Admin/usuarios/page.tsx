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

  return (
    <div className="usuarios-page">
      <div className="usuarios-container">
        <section className="hero">
          <div className="hero-topo">
            <span className="hero-tag">Painel Administrativo</span>
            <h1>Usuários do sistema</h1>
            <p>Gerencie os usuários em uma tabela moderna, limpa e responsiva.</p>
          </div>

          <div className="hero-acoes">
            <button className="btn btn-secundario" onClick={carregarDados}>
              Atualizar lista
            </button>

            <Link href="/Admin/usuarios/novo" className="btn btn-primario">
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
            <small>Status ativo</small>
          </div>

          <div className="stat-card">
            <span>Protegidos</span>
            <strong>{totalProtegidos}</strong>
            <small>Nível sistema</small>
          </div>

          <div className="stat-card">
            <span>Resultados</span>
            <strong>{usuariosFiltrados.length}</strong>
            <small>Após busca</small>
          </div>
        </section>

        <section className="toolbar">
          <div className="search-box">
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
          <section className="tabela-card">
            <div className="tabela-topo">
              <div>
                <h2>Lista de usuários</h2>
                <p>Visualize, copie PIN e gerencie os registros do sistema.</p>
              </div>
            </div>

            <div className="tabela-wrapper">
              <table className="usuarios-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Nível</th>
                    <th>Status</th>
                    <th>PIN</th>
                    <th>Telefone</th>
                    <th>CPF</th>
                    <th>Criado em</th>
                    <th className="col-acoes">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.map((usuario) => {
                    const id = normalizarUsuarioId(usuario);
                    const nomeNivel = obterNomeNivel(usuario.nivel_id);
                    const nomeStatus = obterNomeStatus(usuario.status_id);
                    const protegido = ehProtegido(usuario);

                    return (
                      <tr key={id}>
                        <td>
                          <div className="usuario-cell">
                            <div className="avatar">
                              {(usuario.nome?.charAt(0) || "U").toUpperCase()}
                            </div>

                            <div className="usuario-info">
                              <div className="usuario-nome-linha">
                                <strong>{usuario.nome || "Sem nome"}</strong>
                                {protegido && (
                                  <span className="protect-badge">Protegido</span>
                                )}
                              </div>
                              <span>{usuario.email || "-"}</span>
                              <small>ID #{id}</small>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="nivel-badge">{nomeNivel}</span>
                        </td>

                        <td>
                          <span className={getStatusClass(usuario.status_id)}>
                            {nomeStatus}
                          </span>
                        </td>

                        <td>
                          <div className="pin-cell">
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
                        </td>

                        <td>{usuario.telefone || "-"}</td>
                        <td>{usuario.cpf || "-"}</td>
                        <td>{formatarData(usuario.criado)}</td>

                        <td>
                          <div className="acoes-cell">
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

                            <button
                              type="button"
                              className="acao-btn acao-excluir"
                              onClick={() => excluirUsuario(id)}
                              disabled={excluindoId === id || protegido}
                            >
                              {excluindoId === id ? "Excluindo..." : "Excluir"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        .usuarios-page {
          min-height: 100vh;
          padding: 24px;
          background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
        }

        .usuarios-container {
          max-width: 1440px;
          margin: 0 auto;
        }

        .hero {
          display: flex;
          flex-direction: column;
          gap: 18px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
          margin-bottom: 20px;
        }

        .hero-topo {
          width: 100%;
        }

        .hero-tag {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: #eef2ff;
          color: #3730a3;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .hero h1 {
          margin: 0 0 8px;
          font-size: 36px;
          color: #0f172a;
          font-weight: 900;
        }

        .hero p {
          margin: 0;
          color: #64748b;
          font-size: 15px;
          line-height: 1.7;
          max-width: 760px;
        }

        .hero-acoes {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          width: 100%;
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
          transition: 0.2s ease;
        }

        .btn:hover {
          transform: translateY(-2px);
        }

        .btn-primario {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
        }

        .btn-secundario {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #dbe3ee;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 20px;
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.04);
        }

        .stat-card span {
          display: block;
          color: #64748b;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .stat-card strong {
          display: block;
          font-size: 30px;
          color: #0f172a;
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
          background: #ffffff;
          border: 1px solid #dbe3ee;
          border-radius: 20px;
          padding: 14px 16px;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
        }

        .search-box input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          color: #0f172a;
          font-size: 14px;
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
        }

        .estado-erro {
          background: #fff1f2;
          border-color: #fecdd3;
          color: #be123c;
        }

        .tabela-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 26px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
          overflow: hidden;
        }

        .tabela-topo {
          padding: 22px 22px 0 22px;
        }

        .tabela-topo h2 {
          margin: 0 0 6px;
          font-size: 22px;
          color: #0f172a;
          font-weight: 900;
        }

        .tabela-topo p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
        }

        .tabela-wrapper {
          width: 100%;
          overflow-x: auto;
          padding: 22px;
        }

        .usuarios-table {
          width: 100%;
          min-width: 1150px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .usuarios-table thead th {
          background: #f8fafc;
          color: #334155;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 16px 14px;
          text-align: left;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }

        .usuarios-table thead th:first-child {
          border-left: 1px solid #e2e8f0;
          border-top-left-radius: 16px;
        }

        .usuarios-table thead th:last-child {
          border-right: 1px solid #e2e8f0;
          border-top-right-radius: 16px;
        }

        .usuarios-table tbody td {
          padding: 16px 14px;
          border-bottom: 1px solid #eef2f7;
          color: #0f172a;
          font-size: 14px;
          vertical-align: middle;
          background: #ffffff;
        }

        .usuarios-table tbody tr:hover td {
          background: #fbfdff;
        }

        .usuario-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 250px;
        }

        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
          border: 1px solid #bfdbfe;
          flex-shrink: 0;
        }

        .usuario-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .usuario-nome-linha {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .usuario-info strong {
          font-size: 14px;
          color: #0f172a;
        }

        .usuario-info span {
          color: #64748b;
          font-size: 13px;
          word-break: break-word;
        }

        .usuario-info small {
          color: #94a3b8;
          font-size: 12px;
        }

        .protect-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 26px;
          padding: 4px 8px;
          border-radius: 999px;
          background: #0f172a;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
        }

        .nivel-badge,
        .status-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 32px;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          border: 1px solid transparent;
          white-space: nowrap;
        }

        .nivel-badge {
          background: #eef2ff;
          color: #3730a3;
          border-color: #c7d2fe;
        }

        .status-ativo {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }

        .status-inativo {
          background: #fff7ed;
          color: #c2410c;
          border-color: #fdba74;
        }

        .status-bloqueado {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        .status-padrao {
          background: #f1f5f9;
          color: #334155;
          border-color: #cbd5e1;
        }

        .pin-cell {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 90px;
        }

        .pin-cell strong {
          color: #0f172a;
          font-size: 14px;
        }

        .mini-btn {
          align-self: flex-start;
          border: none;
          background: #0f172a;
          color: #ffffff;
          border-radius: 10px;
          padding: 7px 10px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .mini-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .mini-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .col-acoes {
          min-width: 210px;
        }

        .acoes-cell {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .acao-btn {
          min-height: 36px;
          padding: 8px 12px;
          border-radius: 12px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s ease;
          white-space: nowrap;
        }

        .acao-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .acao-ver {
          background: #f8fafc;
          color: #0f172a;
          border: 1px solid #dbe3ee;
        }

        .acao-editar {
          background: linear-gradient(135deg, #dcfce7 0%, #ecfdf5 100%);
          color: #166534;
          border: 1px solid #86efac;
        }

        .acao-excluir {
          background: linear-gradient(135deg, #ffe4e6 0%, #fff1f2 100%);
          color: #be123c;
          border: 1px solid #fda4af;
        }

        .acao-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .usuarios-page {
            padding: 16px;
          }

          .hero h1 {
            font-size: 28px;
          }

          .hero-acoes {
            flex-direction: column;
          }

          .hero-acoes .btn {
            width: 100%;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .tabela-topo {
            padding: 18px 18px 0 18px;
          }

          .tabela-wrapper {
            padding: 18px;
          }
        }

        @media (max-width: 560px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}