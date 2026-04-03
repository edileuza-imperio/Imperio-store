"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";

type Usuario = {
  id_usuario?: number;
  id?: number;
  nome?: string;
  email?: string;
  senha?: string;
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

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [statusList, setStatusList] = useState<StatusItem[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

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
    (nivelId?: number | string) => {
      const nivel = buscarNivelPorId(nivelId);
      return nivel?.nome || "-";
    },
    [buscarNivelPorId]
  );

  const obterCodigoNivel = useCallback(
    (nivelId?: number | string) => {
      const nivel = buscarNivelPorId(nivelId);
      return nivel?.codigo || "";
    },
    [buscarNivelPorId]
  );

  const obterNomeStatus = useCallback(
    (statusId?: number | string) => {
      const status = buscarStatusPorId(statusId);
      return status?.nome || "-";
    },
    [buscarStatusPorId]
  );

  const obterCodigoStatus = useCallback(
    (statusId?: number | string) => {
      const status = buscarStatusPorId(statusId);
      return status?.codigo || "";
    },
    [buscarStatusPorId]
  );

  const ehProtegido = useCallback(
    (usuario: Usuario) => {
      const nivelId = Number(usuario.nivel_id ?? 0);
      const nomeNivel = obterNomeNivel(usuario.nivel_id).toLowerCase();
      const codigoNivel = obterCodigoNivel(usuario.nivel_id).toLowerCase();

      return (
        nivelId === 1 ||
        nomeNivel === "sistema" ||
        codigoNivel === "sistema" ||
        codigoNivel === "sistema".toUpperCase().toLowerCase()
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

      const listaUsuarios = getUsuariosFromResponse(resUsuarios.data);
      const listaNiveis = getNiveisFromResponse(resNiveis.data);
      const listaStatus = getStatusFromResponse(resStatus.data);

      setUsuarios(listaUsuarios);
      setNiveis(listaNiveis);
      setStatusList(listaStatus);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);

      if (error?.response?.status === 401) {
        setErro("Sessão inválida. Faça login novamente.");
      } else if (error?.response?.status === 403) {
        setErro("Você não tem permissão para acessar esta página.");
      } else {
        setErro("Não foi possível carregar os dados dos usuários.");
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
      const codigoNivel = obterCodigoNivel(usuario.nivel_id).toLowerCase();
      const nomeStatus = obterNomeStatus(usuario.status_id).toLowerCase();
      const codigoStatus = obterCodigoStatus(usuario.status_id).toLowerCase();

      return (
        id.includes(termo) ||
        nome.includes(termo) ||
        email.includes(termo) ||
        telefone.includes(termo) ||
        cpf.includes(termo) ||
        pin.includes(termo) ||
        nomeNivel.includes(termo) ||
        codigoNivel.includes(termo) ||
        nomeStatus.includes(termo) ||
        codigoStatus.includes(termo)
      );
    });
  }, [
    busca,
    usuarios,
    normalizarUsuarioId,
    obterNomeNivel,
    obterCodigoNivel,
    obterNomeStatus,
    obterCodigoStatus,
  ]);

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

  return (
    <div className="usuarios-page">
      <div className="usuarios-container">
        <div className="topo">
          <div className="topo-esquerda">
            <span className="topo-badge">Painel Administrativo</span>
            <h1>Usuários</h1>
            <p>Gerencie usuários com um layout moderno em cards.</p>
          </div>

          <div className="topo-acoes">
            <button className="btn btn-secundario" onClick={carregarDados}>
              Atualizar
            </button>

            <Link href="/Admin/usuarios/novo" className="btn btn-primario">
              Novo usuário
            </Link>
          </div>
        </div>

        <div className="resumo-grid">
          <div className="resumo-card">
            <span>Total de usuários</span>
            <strong>{usuarios.length}</strong>
          </div>

          <div className="resumo-card">
            <span>Resultados</span>
            <strong>{usuariosFiltrados.length}</strong>
          </div>

          <div className="resumo-card">
            <span>Protegidos</span>
            <strong>{usuarios.filter((u) => ehProtegido(u)).length}</strong>
          </div>
        </div>

        <div className="filtro-box">
          <input
            type="text"
            placeholder="Buscar por nome, email, PIN, nível, status, telefone ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {carregando ? (
          <div className="estado">Carregando usuários...</div>
        ) : erro ? (
          <div className="estado erro">{erro}</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="estado">Nenhum usuário encontrado.</div>
        ) : (
          <div className="cards-grid">
            {usuariosFiltrados.map((usuario) => {
              const id = normalizarUsuarioId(usuario);
              const nomeNivel = obterNomeNivel(usuario.nivel_id);
              const nomeStatus = obterNomeStatus(usuario.status_id);
              const protegido = ehProtegido(usuario);

              return (
                <div className="usuario-card" key={id}>
                  <div className="card-topo">
                    <div className="avatar">
                      {(usuario.nome?.charAt(0) || "U").toUpperCase()}
                    </div>

                    <div className="usuario-info">
                      <div className="titulo-linha">
                        <h2>{usuario.nome || "Sem nome"}</h2>
                        {protegido && (
                          <span className="badge-protegido">Protegido</span>
                        )}
                      </div>

                      <p>{usuario.email || "-"}</p>
                    </div>
                  </div>

                  <div className="badges-linha">
                    <span className="badge-item">ID #{id}</span>
                    <span className="badge-item badge-nivel">{nomeNivel}</span>
                    <span className="badge-item badge-status">{nomeStatus}</span>
                  </div>

                  <div className="dados-grid">
                    <div className="dado">
                      <span>PIN</span>
                      <strong>{usuario.pin || "-"}</strong>
                    </div>

                    <div className="dado">
                      <span>Telefone</span>
                      <strong>{usuario.telefone || "-"}</strong>
                    </div>

                    <div className="dado">
                      <span>CPF</span>
                      <strong>{usuario.cpf || "-"}</strong>
                    </div>

                    <div className="dado">
                      <span>Status</span>
                      <strong>{nomeStatus}</strong>
                    </div>
                  </div>

                  <div className="acoes">
                    <Link
                      href={`/Admin/usuarios/${id}`}
                      className="btn-acao btn-visualizar"
                    >
                      Visualizar
                    </Link>

                    <Link
                      href={`/Admin/usuarios/${id}/editar`}
                      className="btn-acao btn-editar"
                    >
                      Editar
                    </Link>

                    <button
                      type="button"
                      className="btn-acao btn-excluir"
                      onClick={() => excluirUsuario(id)}
                      disabled={excluindoId === id || protegido}
                    >
                      {excluindoId === id ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .usuarios-page {
          min-height: 100vh;
          padding: 24px;
          background: #f6f7fb;
        }

        .usuarios-container {
          max-width: 1440px;
          margin: 0 auto;
        }

        .topo {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .topo-badge {
          display: inline-flex;
          padding: 7px 12px;
          border-radius: 999px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          color: #374151;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .topo-esquerda h1 {
          margin: 0 0 8px;
          font-size: 34px;
          color: #111827;
          font-weight: 800;
        }

        .topo-esquerda p {
          margin: 0;
          color: #6b7280;
          font-size: 15px;
        }

        .topo-acoes {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          border: none;
          border-radius: 14px;
          padding: 12px 18px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primario {
          background: linear-gradient(135deg, #111827, #1f2937);
          color: #fff;
        }

        .btn-secundario {
          background: #fff;
          color: #111827;
          border: 1px solid #d1d5db;
        }

        .resumo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .resumo-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
        }

        .resumo-card span {
          display: block;
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .resumo-card strong {
          font-size: 28px;
          color: #111827;
        }

        .filtro-box {
          margin-bottom: 22px;
        }

        .filtro-box input {
          width: 100%;
          padding: 15px 18px;
          background: #fff;
          border: 1px solid #d8dee8;
          border-radius: 18px;
          font-size: 14px;
          color: #111827;
          outline: none;
        }

        .estado {
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          text-align: center;
          border: 1px solid #e5e7eb;
          font-weight: 700;
          color: #374151;
        }

        .estado.erro {
          color: #b91c1c;
          background: #fef2f2;
          border-color: #fecaca;
        }

        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 18px;
        }

        .usuario-card {
          background: linear-gradient(180deg, #ffffff 0%, #fbfcff 100%);
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 20px;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
        }

        .card-topo {
          display: flex;
          gap: 14px;
          align-items: center;
          margin-bottom: 14px;
        }

        .avatar {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 800;
          color: #111827;
          background: linear-gradient(135deg, #e5e7eb, #f9fafb);
          border: 1px solid #d1d5db;
          flex-shrink: 0;
        }

        .usuario-info {
          min-width: 0;
          flex: 1;
        }

        .titulo-linha {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }

        .titulo-linha h2 {
          margin: 0;
          font-size: 20px;
          color: #111827;
          font-weight: 800;
        }

        .usuario-info p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          word-break: break-word;
        }

        .badge-protegido {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          background: #111827;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
        }

        .badges-linha {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .badge-item {
          display: inline-flex;
          align-items: center;
          padding: 7px 10px;
          border-radius: 999px;
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #e5e7eb;
          font-size: 12px;
          font-weight: 700;
        }

        .badge-nivel {
          background: #eef2ff;
          color: #3730a3;
          border-color: #c7d2fe;
        }

        .badge-status {
          background: #ecfdf5;
          color: #065f46;
          border-color: #a7f3d0;
        }

        .dados-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .dado {
          background: #f9fafb;
          border: 1px solid #eef2f7;
          border-radius: 18px;
          padding: 14px;
        }

        .dado span {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-weight: 700;
        }

        .dado strong {
          display: block;
          color: #111827;
          font-size: 15px;
          line-height: 1.4;
          word-break: break-word;
        }

        .acoes {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-acao {
          flex: 1;
          min-width: 100px;
          text-align: center;
          border-radius: 14px;
          padding: 12px 14px;
          text-decoration: none;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          border: none;
        }

        .btn-visualizar {
          background: #f3f4f6;
          color: #111827;
          border: 1px solid #e5e7eb;
        }

        .btn-editar {
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .btn-excluir {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .btn-acao:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .usuarios-page {
            padding: 16px;
          }

          .topo {
            flex-direction: column;
          }

          .topo-acoes {
            width: 100%;
          }

          .topo-acoes .btn {
            width: 100%;
          }

          .cards-grid {
            grid-template-columns: 1fr;
          }

          .dados-grid {
            grid-template-columns: 1fr;
          }

          .acoes {
            flex-direction: column;
          }

          .btn-acao {
            width: 100%;
          }

          .topo-esquerda h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
}