"use client";

import ROTAS from "@/app/constants/rotas";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  BarChart3,
  CircleDollarSign,
  Eye,
  EyeOff,
  Loader2,
  Package,
  RefreshCw,
  Star,
  Tag,
  TrendingUp,
} from "lucide-react";

/* ==========================================================
   TIPOS
========================================================== */

type Produto = {
  id_produto: number;
  sku: string;
  nome: string;
  preco: string | number;
  preco_promocional: string | number | null;
  ativo: boolean | number;
  destaque: boolean | number;
};

type RespostaAPI = {
  sucesso: boolean;
  mensagem: string;
  dados: {
    produtos: Produto[];
    total?: number;
  } | null;
};

/* ==========================================================
   CONFIGURAÇÕES
========================================================== */

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

/* ==========================================================
   FUNÇÕES AUXILIARES
========================================================== */

function ehVerdadeiro(
  valor: boolean | number | string | null | undefined,
): boolean {
  return valor === true || valor === 1 || valor === "1" || valor === "true";
}

function numero(valor: string | number | null | undefined): number {
  return Number.parseFloat(String(valor ?? 0).replace(",", ".")) || 0;
}

function formatarPreco(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

function precoAtual(produto: Produto): number {
  const promocional = numero(produto.preco_promocional);

  return promocional > 0 ? promocional : numero(produto.preco);
}

/* ==========================================================
   COMPONENTE PRINCIPAL
========================================================== */

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  /* ========================================================
     CARREGAR PRODUTOS
  ======================================================== */

  const carregarProdutos = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      if (!API_URL) {
        throw new Error("A variável NEXT_PUBLIC_API_URL não está configurada.");
      }

      const resposta = await fetch(
        `${API_URL}${ROTAS.PRODUTOS.PAINEL.LISTAR}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );

      const resultado: RespostaAPI = await resposta.json();

      if (!resposta.ok || resultado.sucesso === false) {
        throw new Error(
          resultado.mensagem ||
            `Erro ao consultar produtos (${resposta.status}).`,
        );
      }

      const lista = resultado.dados?.produtos;

      if (!Array.isArray(lista)) {
        throw new Error("A API não retornou uma lista válida de produtos.");
      }

      setProdutos(lista);
      setAtualizadoEm(new Date());
    } catch (error) {
      console.error("[DASHBOARD PRODUTOS]", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os indicadores.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  /* ========================================================
     INDICADORES
  ======================================================== */

  const indicadores = useMemo(() => {
    const total = produtos.length;

    const ativos = produtos.filter((produto) =>
      ehVerdadeiro(produto.ativo),
    ).length;

    const inativos = total - ativos;

    const destaques = produtos.filter((produto) =>
      ehVerdadeiro(produto.destaque),
    ).length;

    const promocionais = produtos.filter(
      (produto) => numero(produto.preco_promocional) > 0,
    ).length;

    const somaPrecos = produtos.reduce(
      (total, produto) => total + precoAtual(produto),
      0,
    );

    const precoMedio = total > 0 ? somaPrecos / total : 0;

    const percentualAtivos = total > 0 ? (ativos / total) * 100 : 0;

    const percentualInativos = total > 0 ? (inativos / total) * 100 : 0;

    return {
      total,
      ativos,
      inativos,
      destaques,
      promocionais,
      precoMedio,
      percentualAtivos,
      percentualInativos,
    };
  }, [produtos]);

  /* ========================================================
     PRODUTOS COM MAIOR PREÇO
  ======================================================== */

  const produtosMaisCaros = useMemo(() => {
    return [...produtos]
      .sort((a, b) => precoAtual(b) - precoAtual(a))
      .slice(0, 5);
  }, [produtos]);

  const maiorPreco = Math.max(
    ...produtosMaisCaros.map((produto) => precoAtual(produto)),
    0,
  );

  /* ========================================================
     INTERFACE
  ======================================================== */

  return (
    <main className="produtos-dashboard">
      {/* CABEÇALHO */}

      <header className="pd-header">
        <div className="pd-header-content">
          <div className="pd-eyebrow">
            <span className="pd-eyebrow-dot" />
            UNIVERSO IMPÉRIO / VISÃO GERAL
          </div>

          <h1>Dashboard de produtos</h1>

          <p>
            Acompanhe o desempenho e os indicadores do catálogo da sua loja.
          </p>
        </div>

        <button
          type="button"
          className="pd-refresh"
          onClick={carregarProdutos}
          disabled={carregando}
        >
          <RefreshCw size={17} className={carregando ? "pd-spin" : ""} />
          Atualizar dados
        </button>
      </header>

      {/* ERRO */}

      {erro && (
        <div className="pd-alert">
          <AlertCircle size={19} />
          <span>{erro}</span>

          <button type="button" onClick={carregarProdutos}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* INDICADORES PRINCIPAIS */}

      <section className="pd-section">
        <div className="pd-section-heading">
          <div>
            <span className="pd-label">INDICADORES</span>
            <h2>Visão geral do catálogo</h2>
            <p>Resumo da situação atual dos seus produtos.</p>
          </div>
        </div>

        <div className="pd-stats-grid">
          {/* TOTAL */}

          <article className="pd-stat-card pink">
            <div className="pd-stat-top">
              <span>Total de produtos</span>

              <div className="pd-stat-icon">
                <Package size={21} />
              </div>
            </div>

            <strong>
              {carregando ? "—" : formatarNumero(indicadores.total)}
            </strong>

            <small>Produtos cadastrados</small>

            <div className="pd-stat-bottom">
              <Package size={14} />
              <span>Catálogo completo</span>
            </div>
          </article>

          {/* ATIVOS */}

          <article className="pd-stat-card green">
            <div className="pd-stat-top">
              <span>Produtos ativos</span>

              <div className="pd-stat-icon">
                <Eye size={21} />
              </div>
            </div>

            <strong>
              {carregando ? "—" : formatarNumero(indicadores.ativos)}
            </strong>

            <small>Disponíveis na loja</small>

            <div className="pd-stat-bottom">
              <TrendingUp size={14} />
              <span>
                {indicadores.percentualAtivos.toFixed(1)}% do catálogo
              </span>
            </div>
          </article>

          {/* INATIVOS */}

          <article className="pd-stat-card orange">
            <div className="pd-stat-top">
              <span>Produtos inativos</span>

              <div className="pd-stat-icon">
                <EyeOff size={21} />
              </div>
            </div>

            <strong>
              {carregando ? "—" : formatarNumero(indicadores.inativos)}
            </strong>

            <small>Desativados no catálogo</small>

            <div className="pd-stat-bottom">
              <EyeOff size={14} />
              <span>Não disponíveis na loja</span>
            </div>
          </article>

          {/* DESTAQUES */}

          <article className="pd-stat-card purple">
            <div className="pd-stat-top">
              <span>Em destaque</span>

              <div className="pd-stat-icon">
                <Star size={21} />
              </div>
            </div>

            <strong>
              {carregando ? "—" : formatarNumero(indicadores.destaques)}
            </strong>

            <small>Produtos destacados</small>

            <div className="pd-stat-bottom">
              <Star size={14} />
              <span>Seleção especial</span>
            </div>
          </article>
        </div>
      </section>

      {/* INDICADORES SECUNDÁRIOS */}

      <section className="pd-secondary-grid">
        <article className="pd-secondary-card">
          <div className="pd-secondary-icon pink">
            <Tag size={20} />
          </div>

          <div>
            <span>Produtos promocionais</span>

            <strong>
              {carregando ? "—" : formatarNumero(indicadores.promocionais)}
            </strong>

            <small>Com preço promocional cadastrado</small>
          </div>
        </article>

        <article className="pd-secondary-card">
          <div className="pd-secondary-icon green">
            <CircleDollarSign size={20} />
          </div>

          <div>
            <span>Preço médio atual</span>

            <strong>
              {carregando ? "—" : formatarPreco(indicadores.precoMedio)}
            </strong>

            <small>Média dos preços atuais cadastrados</small>
          </div>
        </article>
      </section>

      {/* GRÁFICOS */}

      <section className="pd-section">
        <div className="pd-section-heading">
          <div>
            <span className="pd-label">ANÁLISE</span>
            <h2>Desempenho do catálogo</h2>
            <p>Visualize a distribuição e os preços dos produtos.</p>
          </div>

          <div className="pd-chart-caption">
            <BarChart3 size={16} />
            Dados atuais
          </div>
        </div>

        <div className="pd-charts-grid">
          {/* GRÁFICO DE DISTRIBUIÇÃO */}

          <article className="pd-chart-card">
            <div className="pd-chart-header">
              <div>
                <h3>Distribuição dos produtos</h3>
                <p>Proporção entre ativos e inativos.</p>
              </div>

              <div className="pd-chart-header-icon">
                <BarChart3 size={19} />
              </div>
            </div>

            <div className="pd-donut-area">
              <div
                className="pd-donut"
                style={{
                  background:
                    indicadores.total > 0
                      ? `conic-gradient(
                          #83c9a2 0% ${indicadores.percentualAtivos}%,
                          #e6a66c ${indicadores.percentualAtivos}% 100%
                        )`
                      : "#382c34",
                }}
              >
                <div className="pd-donut-center">
                  <strong>
                    {carregando
                      ? "—"
                      : `${indicadores.percentualAtivos.toFixed(0)}%`}
                  </strong>

                  <span>Ativos</span>
                </div>
              </div>

              <div className="pd-donut-legend">
                <div className="pd-legend-item">
                  <span className="pd-legend-dot green" />

                  <div>
                    <strong>Ativos</strong>
                    <small>{indicadores.ativos} produtos</small>
                  </div>

                  <b>{indicadores.percentualAtivos.toFixed(1)}%</b>
                </div>

                <div className="pd-legend-item">
                  <span className="pd-legend-dot orange" />

                  <div>
                    <strong>Inativos</strong>
                    <small>{indicadores.inativos} produtos</small>
                  </div>

                  <b>{indicadores.percentualInativos.toFixed(1)}%</b>
                </div>

                <div className="pd-legend-item">
                  <span className="pd-legend-dot purple" />

                  <div>
                    <strong>Destaques</strong>
                    <small>{indicadores.destaques} produtos</small>
                  </div>

                  <b>
                    {indicadores.total > 0
                      ? `${(
                          (indicadores.destaques / indicadores.total) *
                          100
                        ).toFixed(1)}%`
                      : "0%"}
                  </b>
                </div>
              </div>
            </div>
          </article>

          {/* GRÁFICO DE PREÇOS */}

          <article className="pd-chart-card">
            <div className="pd-chart-header">
              <div>
                <h3>Produtos com maior preço</h3>
                <p>Comparação dos cinco maiores preços atuais.</p>
              </div>

              <div className="pd-chart-header-icon">
                <TrendingUp size={19} />
              </div>
            </div>

            <div className="pd-price-chart">
              {carregando ? (
                <div className="pd-chart-feedback">
                  <Loader2 size={22} className="pd-spin" />
                  Carregando gráfico...
                </div>
              ) : produtosMaisCaros.length === 0 ? (
                <div className="pd-chart-feedback">
                  <Package size={25} />
                  Nenhum produto disponível.
                </div>
              ) : (
                produtosMaisCaros.map((produto, index) => {
                  const preco = precoAtual(produto);

                  const largura =
                    maiorPreco > 0 ? (preco / maiorPreco) * 100 : 0;

                  return (
                    <div className="pd-price-item" key={produto.id_produto}>
                      <div className="pd-price-item-heading">
                        <div className="pd-price-product">
                          <span>{index + 1}</span>

                          <strong title={produto.nome}>{produto.nome}</strong>
                        </div>

                        <b>{formatarPreco(preco)}</b>
                      </div>

                      <div className="pd-price-track">
                        <div
                          className="pd-price-fill"
                          style={{ width: `${largura}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>
        </div>
      </section>

      {/* RESUMO */}

      <section className="pd-summary-panel">
        <div className="pd-summary-icon">
          <CircleDollarSign size={23} />
        </div>

        <div className="pd-summary-content">
          <span>RESUMO DO CATÁLOGO</span>

          <h3>
            {carregando
              ? "Carregando informações..."
              : `${indicadores.total} produtos no catálogo`}
          </h3>

          <p>
            {carregando
              ? "Aguardando os dados da API."
              : indicadores.total === 0
                ? "Ainda não existem produtos cadastrados."
                : `${indicadores.ativos} produtos estão ativos, ${indicadores.inativos} estão inativos e ${indicadores.promocionais} possuem preço promocional.`}
          </p>
        </div>

        <div className="pd-summary-status">
          <span className="pd-status-indicator" />
          <span>{carregando ? "Atualizando" : "Dados carregados"}</span>
        </div>
      </section>

      {/* RODAPÉ */}

      <footer className="pd-footer">
        <span>Universo Império · Painel administrativo</span>

        <span>
          {atualizadoEm
            ? `Última atualização às ${atualizadoEm.toLocaleTimeString(
                "pt-BR",
                {
                  hour: "2-digit",
                  minute: "2-digit",
                },
              )}`
            : "Aguardando atualização"}
        </span>
      </footer>

      {/* ESTILOS DA PÁGINA — EMBUTIDOS NO COMPONENTE */}
      <style jsx>{`
        .produtos-dashboard {
          --pd-vinho: #713c4c;
          --pd-vinho-escuro: #542b39;
          --pd-rosa: #bd7182;
          --pd-rosa-claro: #f8ecee;
          --pd-fundo: #fffaf8;
          --pd-superficie: #ffffff;
          --pd-borda: #eadde0;
          --pd-texto: #49343a;
          --pd-secundario: #89767c;
          --pd-sombra: 0 12px 34px rgba(84, 43, 57, 0.065);
          width: min(100%, 1480px);
          min-width: 0;
          margin: 0 auto;
          padding: clamp(18px, 2.5vw, 34px);
          color: var(--pd-texto);
          box-sizing: border-box;
        }

        .produtos-dashboard *,
        .produtos-dashboard *::before,
        .produtos-dashboard *::after {
          box-sizing: border-box;
        }

        .pd-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 22px;
          margin-bottom: 28px;
          padding: 4px 0 22px;
          border-bottom: 1px solid var(--pd-borda);
        }

        .pd-header-content {
          min-width: 0;
        }

        .pd-eyebrow,
        .pd-label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--pd-rosa);
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.35px;
          text-transform: uppercase;
        }

        .pd-eyebrow-dot {
          width: 7px;
          height: 7px;
          flex: 0 0 7px;
          border-radius: 50%;
          background: var(--pd-rosa);
          box-shadow: 0 0 0 4px rgba(189, 113, 130, 0.12);
        }

        .pd-header h1 {
          margin: 10px 0 7px;
          color: var(--pd-vinho-escuro);
          font-family: var(--ui-fonte-titulo, Georgia, serif);
          font-size: clamp(25px, 3vw, 36px);
          font-weight: 800;
          letter-spacing: -0.7px;
          line-height: 1.12;
        }

        .pd-header p,
        .pd-section-heading p {
          margin: 0;
          color: var(--pd-secundario);
          font-size: 13px;
          line-height: 1.65;
        }

        .pd-refresh {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 43px;
          padding: 0 16px;
          color: #fff;
          background: linear-gradient(135deg, var(--pd-rosa), var(--pd-vinho));
          border: 1px solid transparent;
          border-radius: 11px;
          box-shadow: 0 7px 16px rgba(113, 60, 76, 0.16);
          font: inherit;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            opacity 0.18s ease;
        }

        .pd-refresh:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(113, 60, 76, 0.2);
        }

        .pd-refresh:disabled {
          cursor: wait;
          opacity: 0.72;
        }

        .pd-alert {
          display: flex;
          align-items: center;
          gap: 11px;
          margin: 0 0 22px;
          padding: 13px 15px;
          color: #873f49;
          background: #fff2f1;
          border: 1px solid #f0d4d5;
          border-radius: 12px;
          font-size: 12px;
          line-height: 1.5;
        }

        .pd-alert > svg {
          flex: 0 0 auto;
        }
        .pd-alert > span {
          flex: 1;
          min-width: 0;
        }
        .pd-alert button {
          flex: 0 0 auto;
          padding: 7px 10px;
          color: #873f49;
          background: #fff;
          border: 1px solid #edc9cc;
          border-radius: 8px;
          font: inherit;
          font-weight: 750;
          cursor: pointer;
        }

        .pd-section {
          margin: 0 0 25px;
        }

        .pd-section-heading {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 15px;
        }

        .pd-section-heading h2 {
          margin: 6px 0 4px;
          color: var(--pd-vinho-escuro);
          font-family: var(--ui-fonte-titulo, Georgia, serif);
          font-size: clamp(19px, 2vw, 23px);
          font-weight: 800;
          letter-spacing: -0.25px;
        }

        .pd-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }

        .pd-stat-card {
          position: relative;
          display: flex;
          min-width: 0;
          min-height: 174px;
          flex-direction: column;
          padding: 17px 18px 14px;
          overflow: hidden;
          background: var(--pd-superficie);
          border: 1px solid var(--pd-borda);
          border-radius: 15px;
          box-shadow: var(--pd-sombra);
          isolation: isolate;
        }

        .pd-stat-card::after {
          position: absolute;
          z-index: -1;
          top: -38px;
          right: -34px;
          width: 112px;
          height: 112px;
          content: "";
          background: currentColor;
          border-radius: 50%;
          opacity: 0.045;
        }

        .pd-stat-card.pink {
          color: #a95f78;
        }
        .pd-stat-card.green {
          color: #438568;
        }
        .pd-stat-card.orange {
          color: #b77942;
        }
        .pd-stat-card.purple {
          color: #80649b;
        }

        .pd-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          color: var(--pd-secundario);
          font-size: 11px;
          font-weight: 700;
        }

        .pd-stat-icon,
        .pd-secondary-icon,
        .pd-chart-header-icon {
          display: grid;
          flex: 0 0 39px;
          width: 39px;
          height: 39px;
          place-items: center;
          color: currentColor;
          background: currentColor;
          border-radius: 11px;
        }

        .pd-stat-icon svg,
        .pd-secondary-icon svg {
          color: #fff;
        }
        .pd-stat-icon {
          background: currentColor;
        }
        .pd-stat-card > strong {
          display: block;
          margin: 13px 0 3px;
          color: var(--pd-vinho-escuro);
          font-size: clamp(25px, 2.2vw, 31px);
          font-weight: 850;
          letter-spacing: -0.8px;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }

        .pd-stat-card > small {
          color: var(--pd-secundario);
          font-size: 10px;
        }

        .pd-stat-bottom {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: auto;
          padding-top: 12px;
          color: currentColor;
          font-size: 9px;
          font-weight: 750;
        }

        .pd-secondary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 28px;
        }

        .pd-secondary-card {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
          padding: 17px 19px;
          background: linear-gradient(120deg, #fff, #fff9f8);
          border: 1px solid var(--pd-borda);
          border-radius: 14px;
          box-shadow: var(--pd-sombra);
        }

        .pd-secondary-icon {
          flex-basis: 43px;
          width: 43px;
          height: 43px;
        }
        .pd-secondary-icon.pink {
          background: linear-gradient(145deg, #c8899a, #9e5d73);
        }
        .pd-secondary-icon.green {
          background: linear-gradient(145deg, #79b89a, #4c866c);
        }
        .pd-secondary-card > div:last-child {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 3px;
        }
        .pd-secondary-card span {
          color: var(--pd-secundario);
          font-size: 10px;
          font-weight: 750;
        }
        .pd-secondary-card strong {
          color: var(--pd-vinho-escuro);
          font-size: 21px;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
        }
        .pd-secondary-card small {
          color: var(--pd-secundario);
          font-size: 9px;
          line-height: 1.5;
        }

        .pd-chart-caption {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 8px 11px;
          color: var(--pd-vinho);
          background: var(--pd-rosa-claro);
          border: 1px solid var(--pd-borda);
          border-radius: 9px;
          font-size: 10px;
          font-weight: 750;
          white-space: nowrap;
        }

        .pd-charts-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .pd-chart-card {
          min-width: 0;
          padding: 19px;
          background: var(--pd-superficie);
          border: 1px solid var(--pd-borda);
          border-radius: 15px;
          box-shadow: var(--pd-sombra);
        }

        .pd-chart-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 15px;
          border-bottom: 1px solid #f1e8e9;
        }

        .pd-chart-header h3 {
          margin: 0 0 5px;
          color: var(--pd-vinho-escuro);
          font-size: 13px;
          font-weight: 800;
        }

        .pd-chart-header p {
          margin: 0;
          color: var(--pd-secundario);
          font-size: 10px;
          line-height: 1.5;
        }
        .pd-chart-header-icon {
          flex-basis: 36px;
          width: 36px;
          height: 36px;
          color: var(--pd-vinho);
          background: var(--pd-rosa-claro);
        }

        .pd-donut-area {
          display: flex;
          align-items: center;
          justify-content: space-evenly;
          gap: 22px;
          min-height: 230px;
          padding: 17px 5px 5px;
        }

        .pd-donut {
          display: grid;
          flex: 0 0 158px;
          width: 158px;
          height: 158px;
          place-items: center;
          border-radius: 50%;
          box-shadow:
            inset 0 0 0 1px rgba(84, 43, 57, 0.04),
            0 7px 18px rgba(84, 43, 57, 0.08);
        }

        .pd-donut-center {
          display: flex;
          width: 112px;
          height: 112px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          background: #fff;
          border: 1px solid #f1e6e8;
          border-radius: 50%;
        }

        .pd-donut-center strong {
          color: var(--pd-vinho-escuro);
          font-size: 25px;
          font-weight: 850;
          font-variant-numeric: tabular-nums;
        }
        .pd-donut-center span {
          color: var(--pd-secundario);
          font-size: 10px;
          font-weight: 700;
        }
        .pd-donut-legend {
          display: flex;
          flex: 1;
          min-width: 0;
          flex-direction: column;
          gap: 15px;
        }
        .pd-legend-item {
          display: grid;
          grid-template-columns: 8px minmax(0, 1fr) auto;
          align-items: center;
          gap: 9px;
        }
        .pd-legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .pd-legend-dot.green {
          background: #83c9a2;
        }
        .pd-legend-dot.orange {
          background: #e6a66c;
        }
        .pd-legend-dot.purple {
          background: #a98ac0;
        }
        .pd-legend-item > div {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 3px;
        }
        .pd-legend-item strong {
          color: var(--pd-texto);
          font-size: 10px;
        }
        .pd-legend-item small {
          color: var(--pd-secundario);
          font-size: 9px;
        }
        .pd-legend-item b {
          color: var(--pd-vinho);
          font-size: 10px;
          font-variant-numeric: tabular-nums;
        }

        .pd-price-chart {
          display: flex;
          min-height: 230px;
          flex-direction: column;
          justify-content: center;
          gap: 17px;
          padding: 19px 2px 5px;
        }
        .pd-price-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .pd-price-item-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .pd-price-product {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .pd-price-product > span {
          display: grid;
          flex: 0 0 23px;
          width: 23px;
          height: 23px;
          place-items: center;
          color: var(--pd-vinho);
          background: var(--pd-rosa-claro);
          border-radius: 7px;
          font-size: 9px;
          font-weight: 800;
        }
        .pd-price-product strong {
          overflow: hidden;
          color: var(--pd-texto);
          font-size: 10px;
          font-weight: 750;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pd-price-item-heading > b {
          flex: 0 0 auto;
          color: var(--pd-vinho);
          font-size: 10px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
        }
        .pd-price-track {
          width: 100%;
          height: 8px;
          overflow: hidden;
          background: #f4eaec;
          border-radius: 99px;
        }
        .pd-price-fill {
          height: 100%;
          min-width: 2px;
          background: linear-gradient(90deg, #d39aa7, #713c4c);
          border-radius: inherit;
          transition: width 0.35s ease;
        }
        .pd-chart-feedback {
          display: flex;
          min-height: 150px;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: var(--pd-secundario);
          font-size: 11px;
        }

        .pd-summary-panel {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-top: 24px;
          padding: 17px 19px;
          background: linear-gradient(110deg, #fff5f4, #fff 75%);
          border: 1px solid var(--pd-borda);
          border-radius: 14px;
          box-shadow: var(--pd-sombra);
        }

        .pd-summary-icon {
          display: grid;
          flex: 0 0 43px;
          width: 43px;
          height: 43px;
          place-items: center;
          color: #fff;
          background: linear-gradient(145deg, #bd8292, #713c4c);
          border-radius: 12px;
        }
        .pd-summary-content {
          flex: 1;
          min-width: 0;
        }
        .pd-summary-content > span {
          color: var(--pd-rosa);
          font-size: 8px;
          font-weight: 850;
          letter-spacing: 1.2px;
        }
        .pd-summary-content h3 {
          margin: 4px 0;
          color: var(--pd-vinho-escuro);
          font-size: 14px;
          font-weight: 850;
        }
        .pd-summary-content p {
          margin: 0;
          color: var(--pd-secundario);
          font-size: 10px;
          line-height: 1.55;
        }
        .pd-summary-status {
          display: inline-flex;
          flex: 0 0 auto;
          align-items: center;
          gap: 7px;
          padding: 8px 10px;
          color: #4b8064;
          background: #eff8f1;
          border: 1px solid #deeee2;
          border-radius: 8px;
          font-size: 9px;
          font-weight: 750;
          white-space: nowrap;
        }
        .pd-status-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #58a878;
          box-shadow: 0 0 0 3px rgba(88, 168, 120, 0.12);
        }

        .pd-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-top: 22px;
          padding: 14px 2px 2px;
          color: var(--pd-secundario);
          border-top: 1px solid var(--pd-borda);
          font-size: 9px;
        }
        .pd-spin {
          animation: pd-rotate 0.85s linear infinite;
        }
        @keyframes pd-rotate {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 1100px) {
          .pd-stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .pd-charts-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .produtos-dashboard {
            padding: 18px 14px 24px;
          }
          .pd-header {
            align-items: stretch;
            flex-direction: column;
            gap: 15px;
            margin-bottom: 22px;
            padding-bottom: 18px;
          }
          .pd-refresh {
            align-self: flex-start;
            min-height: 41px;
          }
          .pd-header p,
          .pd-section-heading p {
            font-size: 12px;
          }
          .pd-stats-grid {
            gap: 10px;
          }
          .pd-stat-card {
            min-height: 158px;
            padding: 14px;
            border-radius: 13px;
          }
          .pd-stat-top {
            font-size: 10px;
          }
          .pd-stat-icon {
            flex-basis: 34px;
            width: 34px;
            height: 34px;
          }
          .pd-stat-icon svg {
            width: 18px;
            height: 18px;
          }
          .pd-stat-card > strong {
            margin-top: 11px;
            font-size: 25px;
          }
          .pd-stat-bottom {
            font-size: 8px;
          }
          .pd-secondary-grid {
            gap: 10px;
          }
          .pd-secondary-card {
            align-items: flex-start;
            gap: 10px;
            padding: 13px;
          }
          .pd-secondary-icon {
            flex-basis: 36px;
            width: 36px;
            height: 36px;
          }
          .pd-secondary-icon svg {
            width: 17px;
            height: 17px;
          }
          .pd-secondary-card strong {
            font-size: 17px;
          }
          .pd-chart-card {
            padding: 15px;
          }
          .pd-donut-area {
            justify-content: center;
            gap: 17px;
          }
          .pd-donut {
            flex-basis: 132px;
            width: 132px;
            height: 132px;
          }
          .pd-donut-center {
            width: 94px;
            height: 94px;
          }
          .pd-donut-center strong {
            font-size: 22px;
          }
          .pd-summary-panel {
            align-items: flex-start;
            flex-wrap: wrap;
            padding: 14px;
          }
          .pd-summary-content {
            flex-basis: calc(100% - 60px);
          }
          .pd-summary-status {
            margin-left: 58px;
          }
        }

        @media (max-width: 440px) {
          .pd-stats-grid {
            grid-template-columns: 1fr 1fr;
          }
          .pd-stat-card {
            min-height: 150px;
            padding: 12px;
          }
          .pd-stat-top {
            align-items: flex-start;
            font-size: 9px;
          }
          .pd-stat-icon {
            flex-basis: 30px;
            width: 30px;
            height: 30px;
            border-radius: 9px;
          }
          .pd-stat-card > strong {
            font-size: 23px;
          }
          .pd-stat-card > small {
            font-size: 9px;
          }
          .pd-secondary-grid {
            grid-template-columns: 1fr;
          }
          .pd-secondary-card {
            align-items: center;
          }
          .pd-section-heading {
            align-items: flex-start;
            flex-direction: column;
          }
          .pd-chart-caption {
            align-self: flex-start;
          }
          .pd-donut-area {
            flex-direction: column;
            padding-top: 20px;
          }
          .pd-donut-legend {
            width: 100%;
          }
          .pd-footer {
            align-items: flex-start;
            flex-direction: column;
          }
          .pd-alert {
            align-items: flex-start;
            flex-wrap: wrap;
          }
          .pd-alert button {
            margin-left: 29px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .produtos-dashboard *,
          .produtos-dashboard *::before,
          .produtos-dashboard *::after {
            scroll-behavior: auto !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
}
