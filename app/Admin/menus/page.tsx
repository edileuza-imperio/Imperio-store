"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";

type Menu = {
  id_menu?: number;
  id?: number;
  nome?: string;
  titulo?: string;
  icone?: string;
  rota?: string;
  pesquisa_placeholder?: string | null;
  site_config_id?: number | string | null;
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

function getMenusFromResponse(payload: any): Menu[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.dados)) return payload.dados;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.dados?.dados)) return payload.dados.dados;
  if (Array.isArray(payload?.data?.dados)) return payload.data.dados;
  return [];
}

function formatarData(data?: string) {
  if (!data) return "-";

  const d = new Date(String(data).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return data;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const normalizarMenuId = useCallback((menu: Menu) => {
    return Number(menu.id_menu ?? menu.id ?? 0);
  }, []);

  const carregarMenus = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await api.get("/menus");
      setMenus(getMenusFromResponse(resposta.data));
    } catch (error: any) {
      console.error("Erro ao carregar menus:", error);

      if (error?.response?.status === 401) {
        setErro("Sessão inválida. Faça login novamente.");
      } else if (error?.response?.status === 403) {
        setErro("Você não tem permissão para acessar esta página.");
      } else {
        setErro("Não foi possível carregar os menus.");
      }

      setMenus([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarMenus();
  }, [carregarMenus]);

  const menusFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return menus;

    return menus.filter((menu) => {
      const id = String(normalizarMenuId(menu));
      const nome = String(menu.nome ?? menu.titulo ?? "").toLowerCase();
      const icone = String(menu.icone ?? "").toLowerCase();
      const rota = String(menu.rota ?? "").toLowerCase();
      const placeholder = String(menu.pesquisa_placeholder ?? "").toLowerCase();
      const siteConfig = String(menu.site_config_id ?? "").toLowerCase();

      return (
        id.includes(termo) ||
        nome.includes(termo) ||
        icone.includes(termo) ||
        rota.includes(termo) ||
        placeholder.includes(termo) ||
        siteConfig.includes(termo)
      );
    });
  }, [busca, menus, normalizarMenuId]);

  const menusComRota = useMemo(
    () => menus.filter((menu) => String(menu.rota ?? "").trim() !== "").length,
    [menus]
  );

  const menusComIcone = useMemo(
    () => menus.filter((menu) => String(menu.icone ?? "").trim() !== "").length,
    [menus]
  );

  const excluirMenu = useCallback(
    async (id: number) => {
      const confirmar = window.confirm("Tem certeza que deseja excluir este menu?");
      if (!confirmar) return;

      try {
        setExcluindoId(id);
        await api.delete(`/menu/${id}`);

        setMenus((prev) => prev.filter((menu) => normalizarMenuId(menu) !== id));
      } catch (error: any) {
        console.error("Erro ao excluir menu:", error);
        alert(error?.response?.data?.mensagem || "Não foi possível excluir o menu.");
      } finally {
        setExcluindoId(null);
      }
    },
    [normalizarMenuId]
  );

  return (
    <div className="menus-page">
      <div className="menus-container">
        <section className="hero">
          <div className="hero-topo">
            <span className="hero-tag">Painel Administrativo</span>
            <h1>Menus do sistema</h1>
            <p>Gerencie os menus do site em uma tabela moderna, limpa e responsiva.</p>
          </div>

          <div className="hero-acoes">
            <button className="btn btn-secundario" onClick={carregarMenus}>
              Atualizar lista
            </button>

            <Link href="/Admin/menus/cadastrar" className="btn btn-primario">
              Novo menu
            </Link>
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span>Total</span>
            <strong>{menus.length}</strong>
            <small>Menus cadastrados</small>
          </div>

          <div className="stat-card">
            <span>Com rota</span>
            <strong>{menusComRota}</strong>
            <small>Menus configurados</small>
          </div>

          <div className="stat-card">
            <span>Com ícone</span>
            <strong>{menusComIcone}</strong>
            <small>Menus com ícone definido</small>
          </div>

          <div className="stat-card">
            <span>Resultados</span>
            <strong>{menusFiltrados.length}</strong>
            <small>Após busca</small>
          </div>
        </section>

        <section className="toolbar">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar por nome, rota, ícone, placeholder..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </section>

        {carregando ? (
          <div className="estado-box">Carregando menus...</div>
        ) : erro ? (
          <div className="estado-box estado-erro">{erro}</div>
        ) : menusFiltrados.length === 0 ? (
          <div className="estado-box">Nenhum menu encontrado.</div>
        ) : (
          <section className="tabela-card">
            <div className="tabela-topo">
              <div>
                <h2>Lista de menus</h2>
                <p>Visualize e gerencie os menus cadastrados no sistema.</p>
              </div>
            </div>

            <div className="tabela-wrapper">
              <table className="menus-table">
                <thead>
                  <tr>
                    <th>Menu</th>
                    <th>Ícone</th>
                    <th>Rota</th>
                    <th>Placeholder</th>
                    <th>Site Config</th>
                    <th>Criado em</th>
                    <th className="col-acoes">Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {menusFiltrados.map((menu) => {
                    const id = normalizarMenuId(menu);

                    return (
                      <tr key={id}>
                        <td>
                          <div className="menu-cell">
                            <div className="menu-avatar">
                              {(menu.nome?.charAt(0) || menu.titulo?.charAt(0) || "M").toUpperCase()}
                            </div>

                            <div className="menu-info">
                              <strong>{menu.nome || menu.titulo || "Sem nome"}</strong>
                              <span>ID #{id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="badge badge-soft">{menu.icone || "-"}</span>
                        </td>

                        <td>
                          <code className="rota-code">{menu.rota || "-"}</code>
                        </td>

                        <td>{menu.pesquisa_placeholder || "-"}</td>

                        <td>{menu.site_config_id ?? "-"}</td>

                        <td>{formatarData(menu.criado)}</td>

                        <td>
                          <div className="acoes-cell">
                            <Link
                              href={`/Admin/menus/${id}`}
                              className="acao-btn acao-ver"
                            >
                              Ver
                            </Link>

                            <Link
                              href={`/Admin/menus/${id}/editar`}
                              className="acao-btn acao-editar"
                            >
                              Editar
                            </Link>

                            <button
                              type="button"
                              className="acao-btn acao-excluir"
                              onClick={() => excluirMenu(id)}
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
          </section>
        )}
      </div>

      <style jsx>{`
        .menus-page {
          min-height: 100vh;
          padding: 24px;
          background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
        }

        .menus-container {
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

        .menus-table {
          width: 100%;
          min-width: 1080px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .menus-table thead th {
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

        .menus-table thead th:first-child {
          border-left: 1px solid #e2e8f0;
          border-top-left-radius: 16px;
        }

        .menus-table thead th:last-child {
          border-right: 1px solid #e2e8f0;
          border-top-right-radius: 16px;
        }

        .menus-table tbody td {
          padding: 16px 14px;
          border-bottom: 1px solid #eef2f7;
          color: #0f172a;
          font-size: 14px;
          vertical-align: middle;
          background: #ffffff;
        }

        .menus-table tbody tr:hover td {
          background: #fbfdff;
        }

        .menu-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 220px;
        }

        .menu-avatar {
          width: 46px;
          height: 46px;
          border-radius: 15px;
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

        .menu-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .menu-info strong {
          font-size: 14px;
          color: #0f172a;
        }

        .menu-info span {
          color: #94a3b8;
          font-size: 12px;
        }

        .badge {
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

        .badge-soft {
          background: #f8fafc;
          color: #334155;
          border-color: #e2e8f0;
        }

        .rota-code {
          display: inline-block;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 10px;
          border-radius: 10px;
          color: #334155;
          font-size: 12px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          word-break: break-all;
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
          .menus-page {
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