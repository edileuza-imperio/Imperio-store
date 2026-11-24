"use client";

import { Icone } from "@/components/Icons/Icones";
import { useEffect, useState } from "react";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

type ClienteIndicadores = {
  total: number;
  ativos: number;
  inativos: number;
  novos_30_dias: number;
};

type IndicadoresResponse = {
  sucesso: boolean;
  mensagem: string;
  dados: {
    clientes: ClienteIndicadores;
  } | null;
};

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export default function Indicadores() {
  const [clientes, setClientes] = useState<ClienteIndicadores | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | BUSCAR INDICADORES NA API
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const controller = new AbortController();

    async function carregarIndicadores() {
      try {
        setCarregando(true);
        setErro(false);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;

        if (!apiUrl) {
          throw new Error(
            "A variável NEXT_PUBLIC_API_URL não foi configurada.",
          );
        }

        const resposta = await fetch(
          `${apiUrl.replace(/\/+$/, "")}/painel/clientes`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
            signal: controller.signal,
          },
        );

        if (!resposta.ok) {
          throw new Error(`Erro HTTP: ${resposta.status}`);
        }

        const resultado: IndicadoresResponse = await resposta.json();

        if (
          !resultado.sucesso ||
          !resultado.dados ||
          !resultado.dados.clientes
        ) {
          throw new Error(
            resultado.mensagem || "Não foi possível carregar os indicadores.",
          );
        }

        setClientes(resultado.dados.clientes);
      } catch (erro) {
        if (erro instanceof Error && erro.name === "AbortError") {
          return;
        }

        console.error("[INDICADORES DO PAINEL]", erro);

        setErro(true);
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    carregarIndicadores();

    return () => {
      controller.abort();
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CONFIGURAÇÃO DOS CARDS
  |--------------------------------------------------------------------------
  */

  const indicadores = [
    {
      titulo: "Faturamento",
      valor: "R$ 0,00",
      descricao: "Faturamento da loja",
      icone: "credit-card",
      cor: "pink",
    },
    {
      titulo: "Pedidos",
      valor: "0",
      descricao: "Pedidos recebidos",
      icone: "shopping-cart",
      cor: "blue",
    },
    {
      titulo: "Clientes",
      valor: carregando
        ? "..."
        : erro
          ? "—"
          : (clientes?.total ?? 0).toLocaleString("pt-BR"),
      descricao: carregando
        ? "Carregando clientes..."
        : erro
          ? "Falha ao consultar clientes"
          : `${clientes?.ativos ?? 0} ativos • ${clientes?.inativos ?? 0} inativos`,
      icone: "users",
      cor: "purple",
    },
    {
      titulo: "Produtos",
      valor: "0",
      descricao: "Produtos cadastrados",
      icone: "package",
      cor: "green",
    },
  ];

  /*
  |--------------------------------------------------------------------------
  | RENDERIZAÇÃO
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Visão geral</h2>
            <p>Indicadores principais da sua loja.</p>
          </div>
        </div>

        <div className="stats-grid">
          {indicadores.map((item) => (
            <article className={`stat-card ${item.cor}`} key={item.titulo}>
              <div className="stat-header">
                <span>{item.titulo}</span>

                <div className="stat-icon">
                  <Icone nome={item.icone} tamanho={22} />
                </div>
              </div>

              <strong className="stat-value">{item.valor}</strong>

              <small>{item.descricao}</small>

              <div className="stat-decoration" />
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        /* =========================================
           ESTRUTURA DA SEÇÃO
        ========================================= */

        .dashboard-section {
          display: flex;
          flex-direction: column;
          gap: 15px;
          width: 100%;
          min-width: 0;
        }

        .section-heading h2 {
          margin: 0 0 5px;
          color: #f5edf1;
          font-size: 17px;
          font-weight: 700;
        }

        .section-heading p {
          margin: 0;
          color: #92838c;
          font-size: 12px;
        }

        /* =========================================
           GRID DOS CARDS
        ========================================= */

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 17px;
        }

        /* =========================================
           CARD
        ========================================= */

        .stat-card {
          --accent: #dc88a5;

          min-width: 0;
          min-height: 165px;

          position: relative;
          overflow: hidden;

          padding: 22px;

          border: 1px solid #3a2a34;
          border-radius: 15px;

          background:
            radial-gradient(
              circle at 100% 0%,
              color-mix(in srgb, var(--accent) 12%, transparent),
              transparent 55%
            ),
            linear-gradient(145deg, #231b21, #191518);

          transition:
            transform 0.2s ease,
            border-color 0.2s ease;
        }

        .stat-card:hover {
          transform: translateY(-3px);
          border-color: var(--accent);
        }

        /* CORES */

        .stat-card.blue {
          --accent: #8bb7e8;
        }

        .stat-card.purple {
          --accent: #b79ae2;
        }

        .stat-card.green {
          --accent: #83c9a2;
        }

        /* DETALHE SUPERIOR */

        .stat-card::before {
          content: "";

          position: absolute;

          top: 0;
          left: 0;

          width: 48px;
          height: 2px;

          background: var(--accent);
        }

        /* =========================================
           CABEÇALHO DO CARD
        ========================================= */

        .stat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;

          color: #b8a9b1;
          font-size: 13px;
        }

        .stat-icon {
          width: 44px;
          height: 44px;

          display: flex;
          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);

          border-radius: 12px;

          background: color-mix(in srgb, var(--accent) 14%, #211a20);

          color: var(--accent);
        }

        /* =========================================
           VALORES
        ========================================= */

        .stat-value {
          display: block;

          margin: 17px 0 7px;

          color: #fff5f8;

          font-size: clamp(23px, 2.3vw, 30px);
          font-weight: 750;

          letter-spacing: -0.8px;

          font-variant-numeric: tabular-nums;
        }

        .stat-card > small {
          display: block;

          color: #8e7f88;

          font-size: 11px;
          line-height: 1.5;
        }

        /* =========================================
           DECORAÇÃO
        ========================================= */

        .stat-decoration {
          position: absolute;

          width: 90px;
          height: 90px;

          right: -48px;
          bottom: -58px;

          border: 1px solid color-mix(in srgb, var(--accent) 16%, transparent);

          border-radius: 50%;

          pointer-events: none;
        }

        /* =========================================
           RESPONSIVIDADE
        ========================================= */

        @media (max-width: 850px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .dashboard-section {
            gap: 13px;
          }
        }

        @media (max-width: 390px) {
          .stats-grid {
            gap: 9px;
          }

          .stat-card {
            min-height: 140px;
            padding: 14px;
          }

          .stat-header {
            font-size: 11px;
          }

          .stat-icon {
            width: 35px;
            height: 35px;
          }

          .stat-value {
            font-size: 21px;
          }
        }

        /* =========================================
           ACESSIBILIDADE
        ========================================= */

        @media (prefers-reduced-motion: reduce) {
          .stat-card {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}
