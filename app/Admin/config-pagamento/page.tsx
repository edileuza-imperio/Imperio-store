"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import api from "@/services/api";

type ConfigPagamento = {
  id_config_pagamento: number;
  pix_ativo: number;
  pix_tipo_chave: string | null;
  pix_chave: string | null;
  pix_nome_recebedor: string | null;
  pix_cidade: string | null;
  pix_mensagem: string | null;
  mercado_pago_ativo?: number;
  boleto_ativo?: number;
  cartao_ativo?: number;
  site_config_id: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function ConfigPagamentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<ConfigPagamento[]>([]);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  async function carregarConfigs() {
    try {
      setLoading(true);

      const response = await api.get("/painel/config-pagamentos");
      const dados = response?.data?.dados ?? [];

      setConfigs(Array.isArray(dados) ? dados : []);
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
      toast.error("Erro ao carregar configurações de pagamento.");
    } finally {
      setLoading(false);
    }
  }

  async function excluirConfig(id: number) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta configuração de pagamento?"
    );

    if (!confirmar) return;

    try {
      setExcluindoId(id);

      await api.delete(`/painel/config-pagamento/${id}`);

      toast.success("Configuração excluída com sucesso!");
      await carregarConfigs();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast.error(
        error?.response?.data?.dados?.mensagem ||
          "Erro ao excluir configuração."
      );
    } finally {
      setExcluindoId(null);
    }
  }

  useEffect(() => {
    carregarConfigs();
  }, []);

  return (
    <div className="pagina-config">
      <div className="topo">
        <div>
          <span className="badge">Painel administrativo</span>
          <h1>Configurações de Pagamento</h1>
          <p>
            Gerencie as chaves PIX cadastradas e visualize rapidamente os dados
            principais de pagamento.
          </p>
        </div>

        <div className="topo-acoes">
          <button
            className="botao-primario"
            onClick={() => router.push("/Admin/config-pagamento/cadastrar")}
          >
            Nova configuração
          </button>
        </div>
      </div>

      <div className="resumo-grid">
        <div className="resumo-card">
          <span>Total de configurações</span>
          <strong>{configs.length}</strong>
        </div>

        <div className="resumo-card">
          <span>PIX ativos</span>
          <strong>{configs.filter((item) => item.pix_ativo === 1).length}</strong>
        </div>

        <div className="resumo-card">
          <span>Última atualização</span>
          <strong>
            {configs[0]?.updated_at
              ? new Date(configs[0].updated_at).toLocaleDateString("pt-BR")
              : "--"}
          </strong>
        </div>
      </div>

      <div className="conteudo">
        {loading ? (
          <div className="estado vazio">
            <div className="loader" />
            <p>Carregando configurações...</p>
          </div>
        ) : configs.length === 0 ? (
          <div className="estado vazio">
            <h2>Nenhuma configuração cadastrada</h2>
            <p>
              Você ainda não cadastrou nenhuma configuração de pagamento.
            </p>
            <button
              className="botao-primario"
              onClick={() => router.push("/Admin/config-pagamento/cadastrar")}
            >
              Cadastrar agora
            </button>
          </div>
        ) : (
          <div className="lista-cards">
            {configs.map((config) => (
              <div className="config-card" key={config.id_config_pagamento}>
                <div className="config-card-topo">
                  <div>
                    <span className="chip">
                      {config.pix_ativo === 1 ? "PIX ativo" : "PIX inativo"}
                    </span>
                    <h2>Configuração #{config.id_config_pagamento}</h2>
                    <p>
                      Site Config ID:{" "}
                      <strong>{config.site_config_id ?? "--"}</strong>
                    </p>
                  </div>

                  <div className="acoes-topo">
                    <button
                      className="botao-icon"
                      title="Editar"
                      onClick={() =>
                        router.push(
                          `/Admin/config-pagamento/${config.id_config_pagamento}`
                        )
                      }
                    >
                      ✏️
                    </button>

                    <button
                      className="botao-icon botao-danger"
                      title="Excluir"
                      onClick={() => excluirConfig(config.id_config_pagamento)}
                      disabled={excluindoId === config.id_config_pagamento}
                    >
                      {excluindoId === config.id_config_pagamento ? "..." : "🗑️"}
                    </button>
                  </div>
                </div>

                <div className="info-grid">
                  <div className="info-item">
                    <span>Tipo da chave</span>
                    <strong>{config.pix_tipo_chave || "--"}</strong>
                  </div>

                  <div className="info-item">
                    <span>Chave PIX</span>
                    <strong>{config.pix_chave || "--"}</strong>
                  </div>

                  <div className="info-item">
                    <span>Recebedor</span>
                    <strong>{config.pix_nome_recebedor || "--"}</strong>
                  </div>

                  <div className="info-item">
                    <span>Cidade</span>
                    <strong>{config.pix_cidade || "--"}</strong>
                  </div>
                </div>

                {config.pix_mensagem && (
                  <div className="mensagem-box">
                    <span>Mensagem</span>
                    <p>{config.pix_mensagem}</p>
                  </div>
                )}

                <div className="rodape-card">
                  <small>
                    Criado em:{" "}
                    {config.created_at
                      ? new Date(config.created_at).toLocaleString("pt-BR")
                      : "--"}
                  </small>

                  <small>
                    Atualizado em:{" "}
                    {config.updated_at
                      ? new Date(config.updated_at).toLocaleString("pt-BR")
                      : "--"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .pagina-config {
          min-height: 100vh;
          padding: 24px;
          background:
            radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 25%),
            radial-gradient(circle at top right, rgba(124, 58, 237, 0.1), transparent 20%),
            linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
        }

        .topo {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 24px;
          padding: 28px;
          border-radius: 24px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%);
          color: #fff;
          box-shadow: 0 20px 50px rgba(15, 23, 42, 0.18);
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        .topo h1 {
          margin: 0 0 10px;
          font-size: 2rem;
          line-height: 1.15;
        }

        .topo p {
          margin: 0;
          max-width: 760px;
          color: rgba(255, 255, 255, 0.82);
        }

        .topo-acoes {
          display: flex;
          gap: 12px;
          flex-shrink: 0;
        }

        .resumo-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }

        .resumo-card {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 20px;
          padding: 22px;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.06);
        }

        .resumo-card span {
          display: block;
          font-size: 0.88rem;
          color: #64748b;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .resumo-card strong {
          font-size: 1.7rem;
          color: #0f172a;
        }

        .conteudo {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .estado {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 24px;
          padding: 42px 24px;
          text-align: center;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.06);
        }

        .vazio h2 {
          margin: 0 0 10px;
          color: #0f172a;
        }

        .vazio p {
          margin: 0 0 18px;
          color: #64748b;
        }

        .loader {
          width: 42px;
          height: 42px;
          border: 4px solid #dbeafe;
          border-top: 4px solid #2563eb;
          border-radius: 50%;
          margin: 0 auto 14px;
          animation: girar 0.8s linear infinite;
        }

        @keyframes girar {
          to {
            transform: rotate(360deg);
          }
        }

        .lista-cards {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .config-card {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 14px 34px rgba(15, 23, 42, 0.06);
        }

        .config-card-topo {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 18px;
        }

        .config-card-topo h2 {
          margin: 10px 0 6px;
          font-size: 1.2rem;
          color: #0f172a;
        }

        .config-card-topo p {
          margin: 0;
          color: #64748b;
          font-size: 0.95rem;
        }

        .chip {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 999px;
          background: #dcfce7;
          color: #166534;
          font-weight: 700;
          font-size: 0.78rem;
        }

        .acoes-topo {
          display: flex;
          gap: 10px;
        }

        .botao-icon {
          width: 42px;
          height: 42px;
          border: none;
          border-radius: 14px;
          background: #f8fafc;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s ease;
          border: 1px solid #e2e8f0;
        }

        .botao-icon:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #eff6ff;
        }

        .botao-danger:hover:not(:disabled) {
          background: #fef2f2;
        }

        .botao-icon:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .info-item {
          padding: 16px;
          border-radius: 18px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .info-item span {
          display: block;
          font-size: 0.82rem;
          color: #64748b;
          margin-bottom: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .info-item strong {
          color: #0f172a;
          font-size: 0.98rem;
          word-break: break-word;
        }

        .mensagem-box {
          padding: 18px;
          border-radius: 18px;
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          margin-bottom: 18px;
        }

        .mensagem-box span {
          display: block;
          font-size: 0.82rem;
          color: #64748b;
          margin-bottom: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .mensagem-box p {
          margin: 0;
          color: #0f172a;
          line-height: 1.6;
        }

        .rodape-card {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 14px;
          border-top: 1px solid #e2e8f0;
        }

        .rodape-card small {
          color: #64748b;
          font-size: 0.82rem;
        }

        .botao-primario {
          border: none;
          border-radius: 14px;
          padding: 14px 20px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          color: #fff;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          box-shadow: 0 12px 30px rgba(79, 70, 229, 0.24);
          transition: all 0.2s ease;
        }

        .botao-primario:hover {
          transform: translateY(-1px);
          filter: brightness(1.03);
        }

        @media (max-width: 1100px) {
          .lista-cards,
          .resumo-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .pagina-config {
            padding: 14px;
          }

          .topo {
            flex-direction: column;
            padding: 22px;
          }

          .topo h1 {
            font-size: 1.55rem;
          }

          .config-card-topo,
          .rodape-card {
            flex-direction: column;
            align-items: flex-start;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .topo-acoes,
          .botao-primario {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}