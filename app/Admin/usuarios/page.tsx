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
  nivel_id?: number;
  status_id?: number;
  telefone?: string | null;
  cpf?: string | null;
  criado?: string;
  atualizado?: string;
};

type Nivel = {
  id_nivel?: number;
  id?: number;
  nome?: string;
  descricao?: string;
};

type Status = {
  id_status?: number;
  id?: number;
  nome?: string;
  codigo?: string;
  descricao?: string;
};

const api = axios.create({
  baseURL: "https://lightgrey-cattle-160990.hostingersite.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const normalizarResposta = (res: any) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.dados)) return res.data.dados;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    return [];
  };

  const normalizarUsuarioId = useCallback((usuario: Usuario) => {
    return Number(usuario.id_usuario ?? usuario.id ?? 0);
  }, []);

  const normalizarNivelId = (nivel: Nivel) => {
    return Number(nivel.id_nivel ?? nivel.id ?? 0);
  };

  const normalizarStatusId = (status: Status) => {
    return Number(status.id_status ?? status.id ?? 0);
  };

  const obterNomeNivel = useCallback(
    (nivelId?: number) => {
      if (!nivelId) return "-";
      const nivel = niveis.find((item) => normalizarNivelId(item) === Number(nivelId));
      return nivel?.nome || `Nível ${nivelId}`;
    },
    [niveis]
  );

  const obterNomeStatus = useCallback(
    (statusId?: number) => {
      if (!statusId) return "-";
      const status = statusList.find((item) => normalizarStatusId(item) === Number(statusId));
      return status?.nome || `Status ${statusId}`;
    },
    [statusList]
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

      const listaUsuarios = normalizarResposta(resUsuarios);
      const listaNiveis = normalizarResposta(resNiveis);
      const listaStatus = normalizarResposta(resStatus);

      setUsuarios(listaUsuarios);
      setUsuariosFiltrados(listaUsuarios);
      setNiveis(listaNiveis);
      setStatusList(listaStatus);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);

      if (error?.response?.status === 401) {
        setErro("Sessão inválida. Faça login novamente.");
      } else if (error?.response?.status === 403) {
        setErro("Você não tem permissão para acessar essa página.");
      } else {
        setErro("Não foi possível carregar os usuários.");
      }

      setUsuarios([]);
      setUsuariosFiltrados([]);
      setNiveis([]);
      setStatusList([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      setUsuariosFiltrados(usuarios);
      return;
    }

    const filtrados = usuarios.filter((usuario) => {
      const id = String(normalizarUsuarioId(usuario));
      const nome = String(usuario.nome ?? "").toLowerCase();
      const email = String(usuario.email ?? "").toLowerCase();
      const telefone = String(usuario.telefone ?? "").toLowerCase();
      const cpf = String(usuario.cpf ?? "").toLowerCase();
      const pin = String(usuario.pin ?? "").toLowerCase();
      const nivelNome = obterNomeNivel(usuario.nivel_id).toLowerCase();
      const statusNome = obterNomeStatus(usuario.status_id).toLowerCase();

      return (
        id.includes(termo) ||
        nome.includes(termo) ||
        email.includes(termo) ||
        telefone.includes(termo) ||
        cpf.includes(termo) ||
        pin.includes(termo) ||
        nivelNome.includes(termo) ||
        statusNome.includes(termo)
      );
    });

    setUsuariosFiltrados(filtrados);
  }, [busca, usuarios, obterNomeNivel, obterNomeStatus, normalizarUsuarioId]);

  const totalUsuarios = useMemo(() => usuarios.length, [usuarios]);

  const excluirUsuario = useCallback(
    async (id: number) => {
      const confirmar = window.confirm("Tem certeza que deseja excluir este usuário?");
      if (!confirmar) return;

      try {
        setExcluindoId(id);
        await api.delete(`/painel/usuario/${id}`);

        setUsuarios((prev) => prev.filter((usuario) => normalizarUsuarioId(usuario) !== id));
        setUsuariosFiltrados((prev) =>
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

  return (
    <div className="usuarios-page">
      <div className="usuarios-container">
        <div className="topo">
          <div>
            <span className="badge">Painel Administrativo</span>
            <h1>Usuários</h1>
            <p>Gerencie os usuários cadastrados no sistema.</p>
          </div>

          <div className="acoes-topo">
            <button onClick={carregarDados} className="btn btn-secundario">
              Atualizar
            </button>

            <Link href="/Admin/usuarios/novo" className="btn btn-primario">
              Novo usuário
            </Link>
          </div>
        </div>

        <div className="resumo-grid">
          <div className="card-resumo">
            <span>Total de usuários</span>
            <strong>{totalUsuarios}</strong>
          </div>

          <div className="card-resumo">
            <span>Resultados filtrados</span>
            <strong>{usuariosFiltrados.length}</strong>
          </div>
        </div>

        <div className="filtros">
          <input
            type="text"
            placeholder="Buscar por nome, email, CPF, telefone, PIN, nível ou status..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {carregando ? (
          <div className="estado estado-loading">Carregando usuários...</div>
        ) : erro ? (
          <div className="estado estado-erro">{erro}</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="estado estado-vazio">Nenhum usuário encontrado.</div>
        ) : (
          <div className="tabela-wrapper">
            <table className="tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>PIN</th>
                  <th>Telefone</th>
                  <th>CPF</th>
                  <th>Nível</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados.map((usuario) => {
                  const id = normalizarUsuarioId(usuario);

                  return (
                    <tr key={id}>
                      <td>#{id}</td>
                      <td>{usuario.nome || "-"}</td>
                      <td>{usuario.email || "-"}</td>
                      <td>{usuario.pin || "-"}</td>
                      <td>{usuario.telefone || "-"}</td>
                      <td>{usuario.cpf || "-"}</td>
                      <td>{obterNomeNivel(usuario.nivel_id)}</td>
                      <td>{obterNomeStatus(usuario.status_id)}</td>
                      <td>
                        <div className="acoes-linha">
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
                            disabled={excluindoId === id}
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
        )}
      </div>

      <style jsx>{`
        .usuarios-page {
          min-height: 100vh;
          padding: 24px;
          background: #f5f5f5;
        }

        .usuarios-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          color: #1f2937;
        }

        .topo {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 999px;
          background: #f3f4f6;
          color: #374151;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 12px;
          border: 1px solid #e5e7eb;
        }

        h1 {
          margin: 0 0 8px;
          font-size: 32px;
          font-weight: 800;
          color: #111827;
        }

        p {
          margin: 0;
          color: #6b7280;
          font-size: 15px;
        }

        .acoes-topo {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 14px;
          padding: 12px 18px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .btn-primario {
          background: #111827;
          color: #ffffff;
        }

        .btn-primario:hover {
          opacity: 0.92;
        }

        .btn-secundario {
          background: #ffffff;
          color: #111827;
          border: 1px solid #d1d5db;
        }

        .resumo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .card-resumo {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.05);
        }

        .card-resumo span {
          display: block;
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .card-resumo strong {
          font-size: 28px;
          color: #111827;
        }

        .filtros {
          margin-bottom: 20px;
        }

        .filtros input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid #d1d5db;
          background: #ffffff;
          color: #111827;
          outline: none;
          font-size: 14px;
        }

        .filtros input::placeholder {
          color: #9ca3af;
        }

        .estado {
          border-radius: 18px;
          padding: 20px;
          text-align: center;
          font-weight: 600;
          border: 1px solid #e5e7eb;
          background: #ffffff;
        }

        .estado-loading {
          color: #374151;
        }

        .estado-erro {
          color: #b91c1c;
          background: #fef2f2;
          border-color: #fecaca;
        }

        .estado-vazio {
          color: #4b5563;
        }

        .tabela-wrapper {
          overflow-x: auto;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 22px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
        }

        .tabela {
          width: 100%;
          border-collapse: collapse;
          min-width: 1100px;
        }

        .tabela thead th {
          text-align: left;
          padding: 18px 16px;
          font-size: 13px;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .tabela tbody td {
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
          color: #111827;
          vertical-align: middle;
        }

        .tabela tbody tr:hover {
          background: #fafafa;
        }

        .acoes-linha {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .btn-acao {
          border: none;
          text-decoration: none;
          cursor: pointer;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 13px;
          font-weight: 700;
          transition: 0.2s ease;
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
          opacity: 0.7;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .usuarios-page {
            padding: 16px;
          }

          h1 {
            font-size: 26px;
          }

          .topo {
            flex-direction: column;
          }

          .acoes-topo {
            width: 100%;
          }

          .acoes-topo .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}