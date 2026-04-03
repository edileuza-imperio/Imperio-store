"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";

type Usuario = {
  id_usuario?: number;
  id?: number;
  nome: string;
  email: string;
  nivel_id?: number;
  status_id?: number;
  telefone?: string | null;
  cpf?: string | null;
  criado?: string;
  atualizado?: string;
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
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const normalizarId = useCallback((usuario: Usuario) => {
    return usuario.id_usuario ?? usuario.id ?? 0;
  }, []);

  const carregarUsuarios = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await api.get("/painel/usuarios");

      const dados = Array.isArray(resposta.data)
        ? resposta.data
        : Array.isArray(resposta.data?.dados)
        ? resposta.data.dados
        : [];

      setUsuarios(dados);
      setUsuariosFiltrados(dados);
    } catch (error: any) {
      console.error("Erro ao carregar usuários:", error);

      if (error?.response?.status === 401) {
        setErro("Sessão inválida. Faça login novamente.");
      } else if (error?.response?.status === 403) {
        setErro("Você não tem permissão para acessar os usuários.");
      } else {
        setErro("Não foi possível carregar os usuários.");
      }

      setUsuarios([]);
      setUsuariosFiltrados([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  useEffect(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      setUsuariosFiltrados(usuarios);
      return;
    }

    const filtrados = usuarios.filter((usuario) => {
      const id = String(normalizarId(usuario));
      const nome = String(usuario.nome || "").toLowerCase();
      const email = String(usuario.email || "").toLowerCase();
      const telefone = String(usuario.telefone || "").toLowerCase();
      const cpf = String(usuario.cpf || "").toLowerCase();
      const nivel = String(usuario.nivel_id || "");
      const status = String(usuario.status_id || "");

      return (
        id.includes(termo) ||
        nome.includes(termo) ||
        email.includes(termo) ||
        telefone.includes(termo) ||
        cpf.includes(termo) ||
        nivel.includes(termo) ||
        status.includes(termo)
      );
    });

    setUsuariosFiltrados(filtrados);
  }, [busca, usuarios, normalizarId]);

  const totalUsuarios = useMemo(() => usuarios.length, [usuarios]);

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
          prev.filter((usuario) => normalizarId(usuario) !== id)
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
    [normalizarId]
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
            <button onClick={carregarUsuarios} className="btn btn-secundario">
              Atualizar
            </button>

            <Link href="/Admin/usuarios/novo" className="btn btn-primario">
              Novo usuário
            </Link>
          </div>
        </div>

        <div className="resumo-grid">
          <div className="card-resumo">
            <span>Total</span>
            <strong>{totalUsuarios}</strong>
          </div>

          <div className="card-resumo">
            <span>Resultados</span>
            <strong>{usuariosFiltrados.length}</strong>
          </div>
        </div>

        <div className="filtros">
          <input
            type="text"
            placeholder="Buscar por nome, email, CPF, telefone, nível, status..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {carregando ? (
          <div className="estado estado-loading">Carregando usuários...</div>
        ) : erro ? (
          <div className="estado estado-erro">{erro}</div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="estado estado-vazio">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="tabela-wrapper">
            <table className="tabela">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Telefone</th>
                  <th>CPF</th>
                  <th>Nível</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {usuariosFiltrados.map((usuario) => {
                  const id = normalizarId(usuario);

                  return (
                    <tr key={id}>
                      <td>#{id}</td>
                      <td>{usuario.nome || "-"}</td>
                      <td>{usuario.email || "-"}</td>
                      <td>{usuario.telefone || "-"}</td>
                      <td>{usuario.cpf || "-"}</td>
                      <td>{usuario.nivel_id ?? "-"}</td>
                      <td>{usuario.status_id ?? "-"}</td>
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
          background:
            radial-gradient(circle at top, rgba(37, 99, 235, 0.16), transparent 30%),
            linear-gradient(135deg, #0f172a 0%, #111827 45%, #1e293b 100%);
        }

        .usuarios-container {
          width: 100%;
          max-width: 1400px;
          margin: 0 auto;
          color: #e5e7eb;
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
          background: rgba(59, 130, 246, 0.16);
          color: #93c5fd;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        h1 {
          margin: 0 0 8px;
          font-size: 32px;
          font-weight: 800;
          color: #ffffff;
        }

        p {
          margin: 0;
          color: #cbd5e1;
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
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          box-shadow: 0 10px 30px rgba(37, 99, 235, 0.24);
        }

        .btn-primario:hover {
          transform: translateY(-1px);
        }

        .btn-secundario {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .resumo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .card-resumo {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
        }

        .card-resumo span {
          display: block;
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 8px;
        }

        .card-resumo strong {
          font-size: 28px;
          color: #ffffff;
        }

        .filtros {
          margin-bottom: 20px;
        }

        .filtros input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(15, 23, 42, 0.75);
          color: #fff;
          outline: none;
          font-size: 14px;
        }

        .filtros input::placeholder {
          color: #94a3b8;
        }

        .estado {
          border-radius: 18px;
          padding: 20px;
          text-align: center;
          font-weight: 600;
        }

        .estado-loading {
          background: rgba(59, 130, 246, 0.08);
          color: #bfdbfe;
        }

        .estado-erro {
          background: rgba(239, 68, 68, 0.12);
          color: #fecaca;
        }

        .estado-vazio {
          background: rgba(255, 255, 255, 0.06);
          color: #cbd5e1;
        }

        .tabela-wrapper {
          overflow-x: auto;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 22px;
          backdrop-filter: blur(14px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }

        .tabela {
          width: 100%;
          border-collapse: collapse;
          min-width: 980px;
        }

        .tabela thead th {
          text-align: left;
          padding: 18px 16px;
          font-size: 13px;
          color: #93c5fd;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(15, 23, 42, 0.55);
        }

        .tabela tbody td {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          color: #e5e7eb;
          vertical-align: middle;
        }

        .tabela tbody tr:hover {
          background: rgba(255, 255, 255, 0.04);
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
          background: rgba(59, 130, 246, 0.14);
          color: #bfdbfe;
        }

        .btn-editar {
          background: rgba(16, 185, 129, 0.14);
          color: #a7f3d0;
        }

        .btn-excluir {
          background: rgba(239, 68, 68, 0.14);
          color: #fecaca;
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