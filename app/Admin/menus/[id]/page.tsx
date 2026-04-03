"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type MenuItem = {
  id_item?: number;
  id?: number;
  nome?: string;
  titulo?: string;
  rota?: string;
  icone?: string;
  posicao?: number | string;
  status_id?: number | string;
};

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
  itens?: MenuItem[];
  items?: MenuItem[];
};

const api = axios.create({
  baseURL: "https://lightgrey-cattle-160990.hostingersite.com",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function getObjeto<T>(payload: any): T | null {
  if (!payload) return null;
  if (payload?.dados && !Array.isArray(payload.dados)) return payload.dados as T;
  if (payload?.data && !Array.isArray(payload.data)) return payload.data as T;
  if (payload?.dados?.dados && !Array.isArray(payload.dados.dados)) return payload.dados.dados as T;
  return payload as T;
}

function formatarData(data?: string) {
  if (!data) return "-";

  const d = new Date(String(data).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return data;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(d);
}

export default function VerMenuPage({ params }: PageProps) {
  const { id } = use(params);

  const [menu, setMenu] = useState<Menu | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarMenu = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await api.get(`/menu/${id}/completo`);
      const dados = getObjeto<Menu>(resposta.data);

      setMenu(dados);
    } catch (error: any) {
      console.error("Erro ao carregar menu:", error);

      if (error?.response?.status === 404) {
        setErro("Menu não encontrado.");
      } else if (error?.response?.status === 401) {
        setErro("Sessão inválida. Faça login novamente.");
      } else if (error?.response?.status === 403) {
        setErro("Você não tem permissão para acessar esta página.");
      } else {
        setErro("Não foi possível carregar o menu.");
      }

      setMenu(null);
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    carregarMenu();
  }, [carregarMenu]);

  const itens = useMemo(() => {
    if (!menu) return [];
    return Array.isArray(menu.itens)
      ? menu.itens
      : Array.isArray(menu.items)
      ? menu.items
      : [];
  }, [menu]);

  return (
    <div className="ver-menu-page">
      <div className="ver-menu-container">
        <section className="hero">
          <div className="hero-top">
            <Link href="/Admin/menus" className="voltar-link">
              ← Voltar para menus
            </Link>

            <span className="hero-tag">Visualizar menu</span>
          </div>

          <h1>Detalhes do menu</h1>
          <p>Visualize as informações do menu e seus itens cadastrados.</p>
        </section>

        {carregando ? (
          <div className="estado-box">Carregando menu...</div>
        ) : erro ? (
          <div className="estado-box estado-erro">{erro}</div>
        ) : !menu ? (
          <div className="estado-box">Menu não encontrado.</div>
        ) : (
          <>
            <section className="detalhe-card">
              <div className="perfil-topo">
                <div className="avatar">
                  {(menu.nome?.charAt(0) || menu.titulo?.charAt(0) || "M").toUpperCase()}
                </div>

                <div className="perfil-info">
                  <div className="titulo-linha">
                    <h2>{menu.nome || menu.titulo || "Sem nome"}</h2>
                    <span className="badge-soft">
                      ID #{menu.id_menu ?? menu.id ?? "-"}
                    </span>
                  </div>

                  <p>{menu.rota || "Sem rota principal"}</p>
                </div>
              </div>

              <div className="campos-grid">
                <div className="campo">
                  <span>Nome</span>
                  <strong>{menu.nome || menu.titulo || "-"}</strong>
                </div>

                <div className="campo">
                  <span>Ícone</span>
                  <strong>{menu.icone || "-"}</strong>
                </div>

                <div className="campo">
                  <span>Rota</span>
                  <strong>{menu.rota || "-"}</strong>
                </div>

                <div className="campo">
                  <span>Placeholder de pesquisa</span>
                  <strong>{menu.pesquisa_placeholder || "-"}</strong>
                </div>

                <div className="campo">
                  <span>Site Config</span>
                  <strong>{menu.site_config_id ?? "-"}</strong>
                </div>

                <div className="campo">
                  <span>Criado em</span>
                  <strong>{formatarData(menu.criado)}</strong>
                </div>

                <div className="campo">
                  <span>Atualizado em</span>
                  <strong>{formatarData(menu.atualizado)}</strong>
                </div>
              </div>

              <div className="acoes">
                <Link href={`/Admin/menus/${id}/editar`} className="action-btn btn-editar">
                  Editar menu
                </Link>

                <Link href="/Admin/menus" className="action-btn btn-voltar">
                  Voltar para lista
                </Link>
              </div>
            </section>

            <section className="tabela-card">
              <div className="tabela-topo">
                <h3>Itens do menu</h3>
                <p>{itens.length} item(ns) encontrado(s).</p>
              </div>

              {itens.length === 0 ? (
                <div className="estado-box sem-borda">Nenhum item cadastrado neste menu.</div>
              ) : (
                <div className="tabela-wrapper">
                  <table className="itens-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Rota</th>
                        <th>Ícone</th>
                        <th>Posição</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((item, index) => (
                        <tr key={item.id_item ?? item.id ?? index}>
                          <td>
                            <div className="item-main">
                              <strong>{item.nome || item.titulo || "Sem nome"}</strong>
                              <small>ID #{item.id_item ?? item.id ?? "-"}</small>
                            </div>
                          </td>
                          <td>
                            <code className="rota-code">{item.rota || "-"}</code>
                          </td>
                          <td>{item.icone || "-"}</td>
                          <td>{item.posicao ?? "-"}</td>
                          <td>{item.status_id ?? "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <style jsx>{`
        .ver-menu-page {
          min-height: 100vh;
          padding: 24px;
          background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
        }

        .ver-menu-container {
          max-width: 1240px;
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

        .sem-borda {
          border: 0;
          border-top: 1px solid #eef2f7;
          border-radius: 0;
          box-shadow: none;
        }

        .detalhe-card,
        .tabela-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 28px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.05);
          margin-bottom: 20px;
          overflow: hidden;
        }

        .detalhe-card {
          padding: 24px;
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
          margin: 0;
          color: #64748b;
          font-size: 15px;
          word-break: break-word;
        }

        .badge-soft {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 34px;
          padding: 6px 12px;
          border-radius: 999px;
          background: #f8fafc;
          color: #334155;
          border: 1px solid #e2e8f0;
          font-size: 12px;
          font-weight: 800;
        }

        .campos-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .campo {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 8px;
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

        .acoes {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .action-btn {
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

        .tabela-topo {
          padding: 22px 22px 0 22px;
        }

        .tabela-topo h3 {
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

        .itens-table {
          width: 100%;
          min-width: 780px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .itens-table thead th {
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

        .itens-table thead th:first-child {
          border-left: 1px solid #e2e8f0;
          border-top-left-radius: 16px;
        }

        .itens-table thead th:last-child {
          border-right: 1px solid #e2e8f0;
          border-top-right-radius: 16px;
        }

        .itens-table tbody td {
          padding: 16px 14px;
          border-bottom: 1px solid #eef2f7;
          color: #0f172a;
          font-size: 14px;
          vertical-align: middle;
          background: #ffffff;
        }

        .itens-table tbody tr:hover td {
          background: #fbfdff;
        }

        .item-main {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .item-main strong {
          color: #0f172a;
          font-size: 14px;
        }

        .item-main small {
          color: #94a3b8;
          font-size: 12px;
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

        @media (max-width: 900px) {
          .campos-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .ver-menu-page {
            padding: 16px;
          }

          .hero h1 {
            font-size: 28px;
          }

          .titulo-linha h2 {
            font-size: 24px;
          }

          .acoes {
            flex-direction: column;
          }

          .action-btn {
            width: 100%;
          }

          .tabela-topo {
            padding: 18px 18px 0 18px;
          }

          .tabela-wrapper {
            padding: 18px;
          }
        }
      `}</style>
    </div>
  );
}