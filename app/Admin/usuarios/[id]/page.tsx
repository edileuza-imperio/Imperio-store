"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

function getObjetoFromResponse<T>(payload: any): T | null {
  if (!payload) return null;
  if (payload?.dados && !Array.isArray(payload.dados)) return payload.dados as T;
  if (payload?.data && !Array.isArray(payload.data)) return payload.data as T;
  return payload as T;
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
    dateStyle: "full",
    timeStyle: "short",
  }).format(d);
}

export default function UsuarioDetalhePage({ params }: PageProps) {
  const { id } = use(params);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [statusList, setStatusList] = useState<StatusItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);

  const buscarNivelPorId = useCallback(
    (nivelId?: number | string) => {
      const nivelNumero = Number(nivelId ?? 0);
      return niveis.find((nivel) => Number(nivel.id_nivel ?? 0) === nivelNumero) ?? null;
    },
    [niveis]
  );

  const buscarStatusPorId = useCallback(
    (statusId?: number | string) => {
      const statusNumero = Number(statusId ?? 0);
      return (
        statusList.find((status) => Number(status.id_status ?? 0) === statusNumero) ?? null
      );
    },
    [statusList]
  );

  const nomeNivel = useMemo(() => {
    if (!usuario) return "-";
    return buscarNivelPorId(usuario.nivel_id)?.nome || "-";
  }, [usuario, buscarNivelPorId]);

  const codigoNivel = useMemo(() => {
    if (!usuario) return "";
    return buscarNivelPorId(usuario.nivel_id)?.codigo || "";
  }, [usuario, buscarNivelPorId]);

  const nomeStatus = useMemo(() => {
    if (!usuario) return "-";
    return buscarStatusPorId(usuario.status_id)?.nome || "-";
  }, [usuario, buscarStatusPorId]);

  const codigoStatus = useMemo(() => {
    if (!usuario) return "";
    return buscarStatusPorId(usuario.status_id)?.codigo || "";
  }, [usuario, buscarStatusPorId]);

  const protegido = useMemo(() => {
    if (!usuario) return false;

    const nivelId = Number(usuario.nivel_id ?? 0);
    const nome = nomeNivel.toLowerCase();
    const codigo = codigoNivel.toLowerCase();

    return nivelId === 1 || nome.includes("sistema") || codigo.includes("sistema");
  }, [usuario, nomeNivel, codigoNivel]);

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const [resUsuario, resNiveis, resStatus] = await Promise.all([
        api.get(`/painel/usuario/${id}`),
        api.get("/painel/niveis"),
        api.get("/painel/status"),
      ]);

      const usuarioData = getObjetoFromResponse<Usuario>(resUsuario.data);
      const niveisData = getNiveisFromResponse(resNiveis.data);
      const statusData = getStatusFromResponse(resStatus.data);

      setUsuario(usuarioData);
      setNiveis(niveisData);
      setStatusList(statusData);
    } catch (error: any) {
      console.error("Erro ao carregar usuário:", error);

      if (error?.response?.status === 404) {
        setErro("Usuário não encontrado.");
      } else if (error?.response?.status === 401) {
        setErro("Sessão inválida. Faça login novamente.");
      } else if (error?.response?.status === 403) {
        setErro("Você não tem permissão para acessar esta página.");
      } else {
        setErro("Não foi possível carregar os dados do usuário.");
      }

      setUsuario(null);
      setNiveis([]);
      setStatusList([]);
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const copiarPin = useCallback(async () => {
    if (!usuario?.pin) return;

    try {
      await navigator.clipboard.writeText(usuario.pin);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1600);
    } catch (error) {
      console.error("Erro ao copiar PIN:", error);
    }
  }, [usuario]);

  const statusClass = useMemo(() => {
    const codigo = codigoStatus.toUpperCase();

    if (codigo === "ATIVO") return "badge-status badge-status-ativo";
    if (codigo === "INATIVO") return "badge-status badge-status-inativo";
    if (codigo === "BLOQUEADO") return "badge-status badge-status-bloqueado";

    return "badge-status badge-status-padrao";
  }, [codigoStatus]);

  return (
    <div className="usuario-detalhe-page">
      <div className="usuario-detalhe-container">
        <section className="hero">
          <div className="hero-top">
            <Link href="/Admin/usuarios" className="voltar-link">
              ← Voltar para usuários
            </Link>

            <div className="hero-tag">Detalhes do usuário</div>
          </div>

          <h1>Perfil do usuário</h1>
          <p>Visualize as informações completas do usuário selecionado.</p>
        </section>

        {carregando ? (
          <div className="estado-box">Carregando usuário...</div>
        ) : erro ? (
          <div className="estado-box estado-erro">{erro}</div>
        ) : !usuario ? (
          <div className="estado-box">Usuário não encontrado.</div>
        ) : (
          <section className="detalhe-card">
            <div className="perfil-topo">
              <div className="avatar">
                {(usuario.nome?.charAt(0) || "U").toUpperCase()}
              </div>

              <div className="perfil-info">
                <div className="titulo-linha">
                  <h2>{usuario.nome || "Sem nome"}</h2>
                  {protegido && <span className="badge-protected">Protegido</span>}
                </div>

                <p>{usuario.email || "-"}</p>

                <div className="badges-wrap">
                  <span className="badge-soft">
                    ID #{usuario.id_usuario ?? usuario.id ?? "-"}
                  </span>
                  <span className="badge-level">{nomeNivel}</span>
                  <span className={statusClass}>{nomeStatus}</span>
                </div>
              </div>
            </div>

            <div className="conteudo-grid">
              <div className="bloco principal">
                <h3>Informações principais</h3>

                <div className="campos-grid">
                  <div className="campo">
                    <span>Nome</span>
                    <strong>{usuario.nome || "-"}</strong>
                  </div>

                  <div className="campo">
                    <span>Email</span>
                    <strong>{usuario.email || "-"}</strong>
                  </div>

                  <div className="campo destaque">
                    <span>PIN</span>
                    <div className="pin-linha">
                      <strong>{usuario.pin || "-"}</strong>

                      <button
                        type="button"
                        className="mini-btn"
                        onClick={copiarPin}
                        disabled={!usuario.pin}
                      >
                        {copiado ? "Copiado" : "Copiar PIN"}
                      </button>
                    </div>
                  </div>

                  <div className="campo">
                    <span>Telefone</span>
                    <strong>{usuario.telefone || "-"}</strong>
                  </div>

                  <div className="campo">
                    <span>CPF</span>
                    <strong>{usuario.cpf || "-"}</strong>
                  </div>

                  <div className="campo">
                    <span>Nível</span>
                    <strong>{nomeNivel}</strong>
                  </div>

                  <div className="campo">
                    <span>Status</span>
                    <strong>{nomeStatus}</strong>
                  </div>

                  <div className="campo">
                    <span>Criado em</span>
                    <strong>{formatarData(usuario.criado)}</strong>
                  </div>

                  <div className="campo">
                    <span>Atualizado em</span>
                    <strong>{formatarData(usuario.atualizado)}</strong>
                  </div>
                </div>
              </div>

              <div className="bloco lateral">
                <h3>Ações</h3>

                <div className="acoes">
                  <Link
                    href={`/Admin/usuarios/${id}/editar`}
                    className="action-btn btn-editar"
                  >
                    Editar usuário
                  </Link>

                  <Link href="/Admin/usuarios" className="action-btn btn-voltar">
                    Voltar para lista
                  </Link>
                </div>

                <div className="observacao">
                  <span>Observação</span>
                  <p>
                    Usuários com nível de sistema aparecem com badge de protegido
                    para evitar alterações indevidas.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      <style jsx>{`
        .usuario-detalhe-page {
          min-height: 100vh;
          padding: 24px;
          background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
        }

        .usuario-detalhe-container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .hero {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
          margin-bottom: 20px;
        }

        .hero-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .voltar-link {
          text-decoration: none;
          color: #334155;
          font-weight: 800;
          font-size: 14px;
        }

        .hero-tag {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: #eef2ff;
          color: #3730a3;
          font-size: 12px;
          font-weight: 800;
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

        .detalhe-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
        }

        .perfil-topo {
          display: flex;
          gap: 18px;
          align-items: flex-start;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .avatar {
          width: 76px;
          height: 76px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          font-weight: 900;
          color: #0f172a;
          background: linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%);
          border: 1px solid #bfdbfe;
        }

        .perfil-info {
          flex: 1;
          min-width: 260px;
        }

        .titulo-linha {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 6px;
        }

        .titulo-linha h2 {
          margin: 0;
          font-size: 28px;
          color: #0f172a;
          font-weight: 900;
        }

        .perfil-info p {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 15px;
          word-break: break-word;
        }

        .badges-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .badge-soft,
        .badge-level,
        .badge-protected,
        .badge-status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 6px 12px;
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

        .badge-protected {
          background: #0f172a;
          color: #ffffff;
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

        .conteudo-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 18px;
        }

        .bloco {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 18px;
        }

        .bloco h3 {
          margin: 0 0 16px;
          color: #0f172a;
          font-size: 18px;
          font-weight: 900;
        }

        .campos-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .campo {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .campo.destaque {
          background: linear-gradient(180deg, #eff6ff 0%, #ffffff 100%);
          border-color: #bfdbfe;
        }

        .campo span {
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .campo strong {
          color: #0f172a;
          font-size: 15px;
          line-height: 1.45;
          word-break: break-word;
        }

        .pin-linha {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .mini-btn {
          border: none;
          background: #0f172a;
          color: #ffffff;
          border-radius: 12px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .mini-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .acoes {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 18px;
        }

        .action-btn {
          width: 100%;
          min-height: 46px;
          padding: 12px 14px;
          border-radius: 16px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 900;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .action-btn:hover {
          transform: translateY(-2px);
        }

        .btn-editar {
          background: linear-gradient(135deg, #dcfce7 0%, #ecfdf5 100%);
          color: #166534;
          border: 1px solid #86efac;
        }

        .btn-voltar {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #dbe3ee;
        }

        .observacao {
          background: #ffffff;
          border: 1px dashed #cbd5e1;
          border-radius: 18px;
          padding: 14px;
        }

        .observacao span {
          display: block;
          margin-bottom: 8px;
          color: #334155;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .observacao p {
          margin: 0;
          color: #64748b;
          font-size: 14px;
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .conteudo-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .usuario-detalhe-page {
            padding: 16px;
          }

          .hero h1 {
            font-size: 28px;
          }

          .titulo-linha h2 {
            font-size: 24px;
          }

          .campos-grid {
            grid-template-columns: 1fr;
          }

          .pin-linha {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}