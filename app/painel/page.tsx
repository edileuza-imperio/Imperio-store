"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Icone } from "@/components/Icons/Icones";

import conexao from "@/Services/Conexao/Conexao";
import { ROTAS_API_PAINEL } from "./Components/config/menu.config";

// =====================================================
// TIPAGENS
// =====================================================

interface Pedido {
  id_pedido: number;
  codigo: string;
  status: string;
  total: number | string;
  criado_em: string;
}

interface RespostaApi<T> {
  sucesso: boolean;
  mensagem?: string;
  dados?: T;
}

interface RespostaCards {
  pedidos?: {
    total?: number | string;
  };
}

interface RespostaPedidos {
  pedidos: Pedido[];
  paginacao?: {
    pagina: number;
    limite: number;
    total: number;
    total_paginas: number;
  };
}

// =====================================================
// INDICADORES DO DASHBOARD
// =====================================================

const indicadores = [
  {
    titulo: "Faturamento",
    valor: "R$ 0,00",
    descricao: "Faturamento da loja",
    icone: "credit-card",
    cor: "pink",
    detalhe: "Visão geral das vendas",
  },
  {
    titulo: "Pedidos",
    valor: "0",
    descricao: "Pedidos recebidos",
    icone: "shopping-cart",
    cor: "blue",
    detalhe: "Acompanhe suas vendas",
  },
  {
    titulo: "Clientes",
    valor: "0",
    descricao: "Clientes cadastrados",
    icone: "users",
    cor: "purple",
    detalhe: "Relacionamento com clientes",
  },
  {
    titulo: "Produtos",
    valor: "0",
    descricao: "Produtos cadastrados",
    icone: "package",
    cor: "green",
    detalhe: "Itens disponíveis na loja",
  },
];

// =====================================================
// OPERAÇÕES
// =====================================================

const operacoes = [
  {
    titulo: "Tela inicial",
    descricao:
      "Organize banners, vitrines, campanhas e a ordem dos blocos exibidos na página inicial.",
    icone: "layout-dashboard",
    rota: "/painel/home-blocos",
    etiqueta: "VITRINE DA LOJA",
  },
  {
    titulo: "Produtos",
    descricao: "Cadastre, edite e organize os produtos da sua loja.",
    icone: "package",
    rota: "/painel/produtos",
    etiqueta: "CATÁLOGO",
  },
  {
    titulo: "Pedidos",
    descricao: "Acompanhe compras, pagamentos e entregas.",
    icone: "shopping-cart",
    rota: "/painel/pedidos",
    etiqueta: "VENDAS",
  },
  {
    titulo: "Clientes",
    descricao: "Consulte cadastros e gerencie seus clientes.",
    icone: "users",
    rota: "/painel/clientes",
    etiqueta: "RELACIONAMENTO",
  },
  {
    titulo: "Configurações",
    descricao: "Personalize o funcionamento da sua loja.",
    icone: "settings",
    rota: "/painel/configuracoes",
    etiqueta: "SISTEMA",
  },
];

// =====================================================
// RESUMO OPERACIONAL
// =====================================================

const resumo = [
  {
    titulo: "Pedidos pendentes",
    descricao: "Aguardando processamento",
    valor: "0",
    icone: "clock",
    cor: "warning",
  },
  {
    titulo: "Estoque baixo",
    descricao: "Produtos que precisam de atenção",
    valor: "0",
    icone: "alert-circle",
    cor: "danger",
  },
  {
    titulo: "Novos clientes",
    descricao: "Cadastros recentes",
    valor: "0",
    icone: "user-plus",
    cor: "success",
  },
  {
    titulo: "Produtos cadastrados",
    descricao: "Itens no catálogo",
    valor: "0",
    icone: "package",
    cor: "info",
  },
];

// =====================================================
// ACESSOS RÁPIDOS
// =====================================================

const acessos = [
  {
    nome: "Tela inicial",
    descricao: "Gerenciar banners, vitrines e campanhas",
    rota: "/painel/home-blocos",
    icone: "layout-dashboard",
  },
  {
    nome: "Produtos",
    descricao: "Gerenciar catálogo",
    rota: "/painel/produtos",
    icone: "package",
  },
  {
    nome: "Categorias",
    descricao: "Organizar produtos",
    rota: "/painel/categorias",
    icone: "layers",
  },
  {
    nome: "Pedidos",
    descricao: "Acompanhar vendas",
    rota: "/painel/pedidos",
    icone: "shopping-cart",
  },
  {
    nome: "Clientes",
    descricao: "Base de clientes",
    rota: "/painel/clientes",
    icone: "users",
  },
  {
    nome: "Marketing",
    descricao: "Campanhas e ofertas",
    rota: "/painel/marketing",
    icone: "megaphone",
  },
  {
    nome: "Relatórios",
    descricao: "Análises da loja",
    rota: "/painel/relatorios",
    icone: "bar-chart",
  },
];

// =====================================================
// CLASSES DOS INDICADORES
// =====================================================

const classesIndicadores: Record<string, string> = {
  pink: "pink",
  blue: "blue",
  purple: "purple",
  green: "green",
};

const classesResumo: Record<string, string> = {
  warning: "warning",
  danger: "danger",
  success: "success",
  info: "info",
};

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function formatarNumero(valor: number): string {
  return valor.toLocaleString("pt-BR");
}

function formatarMoeda(valor: number | string): string {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "R$ 0,00";
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string): string {
  if (!data) {
    return "Data não informada";
  }

  const dataConvertida = new Date(data.replace(" ", "T"));

  if (Number.isNaN(dataConvertida.getTime())) {
    return data;
  }

  return dataConvertida.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarStatus(status: string): string {
  if (!status) {
    return "Não informado";
  }

  return status
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function classeStatus(status: string): string {
  const valor = status
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (["pago", "aprovado", "concluido", "entregue"].includes(valor)) {
    return "status-success";
  }

  if (["pendente", "aguardando", "processando", "separando"].includes(valor)) {
    return "status-warning";
  }

  if (["cancelado", "cancelada", "recusado", "estornado"].includes(valor)) {
    return "status-danger";
  }

  return "status-neutral";
}

// =====================================================
// EXTRAIR TOTAL DOS INDICADORES
// =====================================================

/**
 * Procura um campo de total nos indicadores retornados
 * pela API.
 *
 * Não considera números encontrados em qualquer campo:
 * procura somente nomes relacionados à contagem da entidade.
 *
 * Se não encontrar um total reconhecido, retorna null.
 */
function extrairTotalIndicador(
  dados: unknown,
  entidade: "clientes" | "produtos",
): number | null {
  const chavesEspecificas =
    entidade === "clientes"
      ? [
          "total_clientes",
          "quantidade_clientes",
          "clientes_total",
          "total_cadastrados",
        ]
      : [
          "total_produtos",
          "quantidade_produtos",
          "produtos_total",
          "total_cadastrados",
        ];

  const chavesGenericas = ["total", "quantidade", "count"];

  const propriedadesAninhadas = [
    entidade,
    "indicadores",
    "dados",
    "resumo",
    "estatisticas",
  ];

  function converterNumero(valor: unknown): number | null {
    if (typeof valor === "number" && Number.isFinite(valor)) {
      return valor;
    }

    if (typeof valor === "string" && valor.trim() !== "") {
      const numero = Number(valor);

      if (Number.isFinite(numero)) {
        return numero;
      }
    }

    return null;
  }

  function procurar(valor: unknown, profundidade = 0): number | null {
    if (profundidade > 5 || !valor) {
      return null;
    }

    if (typeof valor !== "object") {
      return converterNumero(valor);
    }

    if (Array.isArray(valor)) {
      for (const item of valor) {
        const resultado = procurar(item, profundidade + 1);

        if (resultado !== null) {
          return resultado;
        }
      }

      return null;
    }

    const objeto = valor as Record<string, unknown>;

    // Primeiro, tenta os nomes específicos.
    for (const chave of chavesEspecificas) {
      const numero = converterNumero(objeto[chave]);

      if (numero !== null) {
        return numero;
      }
    }

    // Depois, tenta os nomes genéricos.
    for (const chave of chavesGenericas) {
      const numero = converterNumero(objeto[chave]);

      if (numero !== null) {
        return numero;
      }
    }

    // Procura somente em propriedades relacionadas
    // aos indicadores, evitando campos aleatórios.
    for (const propriedade of propriedadesAninhadas) {
      const interno = objeto[propriedade];

      if (interno === undefined) {
        continue;
      }

      const resultado = procurar(interno, profundidade + 1);

      if (resultado !== null) {
        return resultado;
      }
    }

    return null;
  }

  return procurar(dados);
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function HomePage() {
  // ---------------------------------------------------
  // ESTADOS DOS INDICADORES
  // ---------------------------------------------------

  const [totalPedidos, setTotalPedidos] = useState<number | null>(null);

  const [totalClientes, setTotalClientes] = useState<number | null>(null);

  const [totalProdutos, setTotalProdutos] = useState<number | null>(null);

  // ---------------------------------------------------
  // ESTADOS DOS PEDIDOS RECENTES
  // ---------------------------------------------------

  const [pedidosRecentes, setPedidosRecentes] = useState<Pedido[]>([]);

  // ---------------------------------------------------
  // CARREGAMENTO
  // ---------------------------------------------------

  const [carregandoCards, setCarregandoCards] = useState(true);

  const [carregandoClientes, setCarregandoClientes] = useState(true);

  const [carregandoProdutos, setCarregandoProdutos] = useState(true);

  const [carregandoPedidos, setCarregandoPedidos] = useState(true);

  // ---------------------------------------------------
  // ERROS
  // ---------------------------------------------------

  const [erroCards, setErroCards] = useState(false);

  const [erroClientes, setErroClientes] = useState(false);

  const [erroProdutos, setErroProdutos] = useState(false);

  const [erroPedidos, setErroPedidos] = useState(false);

  // =====================================================
  // CARREGAR DADOS DA API
  // =====================================================

  useEffect(() => {
    let ativo = true;

    // -------------------------------------------------
    // PEDIDOS - INDICADOR TOTAL
    // GET /painel/dados/cards
    // -------------------------------------------------

    async function carregarIndicadoresPedidos() {
      try {
        setCarregandoCards(true);
        setErroCards(false);

        const resposta = await conexao.get<RespostaApi<RespostaCards>>(
          ROTAS_API_PAINEL.CARDS,
        );

        if (!ativo) return;

        if (!resposta.data.sucesso) {
          throw new Error(
            resposta.data.mensagem ||
              "Não foi possível carregar os indicadores de pedidos.",
          );
        }

        const total = Number(resposta.data.dados?.pedidos?.total);

        if (!Number.isFinite(total)) {
          throw new Error("A API não retornou um total válido de pedidos.");
        }

        setTotalPedidos(total);
      } catch (erro) {
        console.error("Erro ao carregar total de pedidos:", erro);

        if (ativo) {
          setErroCards(true);
        }
      } finally {
        if (ativo) {
          setCarregandoCards(false);
        }
      }
    }

    // -------------------------------------------------
    // CLIENTES - INDICADORES
    // GET /painel/clientes
    // -------------------------------------------------

    async function carregarClientes() {
      try {
        setCarregandoClientes(true);
        setErroClientes(false);

        const resposta = await conexao.get<
          RespostaApi<{
            clientes?: unknown;
          }>
        >(ROTAS_API_PAINEL.CLIENTES);

        if (!ativo) return;

        if (!resposta.data.sucesso) {
          throw new Error(
            resposta.data.mensagem ||
              "Não foi possível carregar os indicadores de clientes.",
          );
        }

        const total = extrairTotalIndicador(
          resposta.data.dados?.clientes,
          "clientes",
        );

        if (total === null) {
          console.warn(
            "Indicadores de clientes recebidos sem um campo de total reconhecido:",
            resposta.data.dados?.clientes,
          );
        }

        setTotalClientes(total);
      } catch (erro) {
        console.error("Erro ao carregar indicadores de clientes:", erro);

        if (ativo) {
          setErroClientes(true);
        }
      } finally {
        if (ativo) {
          setCarregandoClientes(false);
        }
      }
    }

    // -------------------------------------------------
    // PRODUTOS - INDICADORES
    // GET /painel/produtos/indicadores
    // -------------------------------------------------

    async function carregarProdutos() {
      try {
        setCarregandoProdutos(true);
        setErroProdutos(false);

        const resposta = await conexao.get<RespostaApi<unknown>>(
          ROTAS_API_PAINEL.PRODUTOS,
        );

        if (!ativo) return;

        if (!resposta.data.sucesso) {
          throw new Error(
            resposta.data.mensagem ||
              "Não foi possível carregar os indicadores de produtos.",
          );
        }

        const total = extrairTotalIndicador(resposta.data.dados, "produtos");

        if (total === null) {
          console.warn(
            "Indicadores de produtos recebidos sem um campo de total reconhecido:",
            resposta.data.dados,
          );
        }

        setTotalProdutos(total);
      } catch (erro) {
        console.error("Erro ao carregar indicadores de produtos:", erro);

        if (ativo) {
          setErroProdutos(true);
        }
      } finally {
        if (ativo) {
          setCarregandoProdutos(false);
        }
      }
    }

    // -------------------------------------------------
    // PEDIDOS - LISTAGEM RECENTE
    // GET /painel/pedidos
    // -------------------------------------------------

    async function carregarPedidosRecentes() {
      try {
        setCarregandoPedidos(true);
        setErroPedidos(false);

        const resposta = await conexao.get<RespostaApi<RespostaPedidos>>(
          ROTAS_API_PAINEL.PEDIDOS,
          {
            params: {
              pagina: 1,
              limite: 5,
            },
          },
        );

        if (!ativo) return;

        if (!resposta.data.sucesso) {
          throw new Error(
            resposta.data.mensagem ||
              "Não foi possível carregar os pedidos recentes.",
          );
        }

        const pedidos = resposta.data.dados?.pedidos;

        if (!Array.isArray(pedidos)) {
          throw new Error("A API retornou uma lista de pedidos inválida.");
        }

        setPedidosRecentes(pedidos);
      } catch (erro) {
        console.error("Erro ao carregar pedidos recentes:", erro);

        if (ativo) {
          setErroPedidos(true);
        }
      } finally {
        if (ativo) {
          setCarregandoPedidos(false);
        }
      }
    }

    // Todas as consultas são independentes.
    // Uma falha não impede as demais de carregar.
    void Promise.all([
      carregarIndicadoresPedidos(),
      carregarClientes(),
      carregarProdutos(),
      carregarPedidosRecentes(),
    ]);

    return () => {
      ativo = false;
    };
  }, []);

  // =====================================================
  // VALORES DOS CARDS
  // =====================================================

  function obterValorIndicador(titulo: string, valorPadrao: string): string {
    switch (titulo) {
      case "Pedidos":
        if (carregandoCards) return "...";
        if (erroCards || totalPedidos === null) return "—";

        return formatarNumero(totalPedidos);

      case "Clientes":
        if (carregandoClientes) return "...";
        if (erroClientes || totalClientes === null) return "—";

        return formatarNumero(totalClientes);

      case "Produtos":
        if (carregandoProdutos) return "...";
        if (erroProdutos || totalProdutos === null) return "—";

        return formatarNumero(totalProdutos);

      default:
        return valorPadrao;
    }
  }

  // =====================================================
  // RENDERIZAÇÃO
  // =====================================================

  return (
    <main className={"dashboard"}>
      <div className={"dashboard-glow dashboard-glow-one"} aria-hidden="true" />

      <div className={"dashboard-glow dashboard-glow-two"} aria-hidden="true" />

      {/* =================================================
          CABEÇALHO
      ================================================= */}

      <header className={"dashboard-topbar"}>
        <div className={"breadcrumb"}>
          <span className={"breadcrumb-mark"}>
            <Icone nome="layout-dashboard" tamanho={16} />
          </span>

          <span>PAINEL</span>

          <span className={"breadcrumb-separator"}>/</span>

          <strong>VISÃO GERAL</strong>
        </div>

        <div className={"topbar-meta"}>
          <span className={"environment-pill"}>
            <span className={"environment-dot"} />
            AMBIENTE ADMINISTRATIVO
          </span>

          <span className={"version-label"}>
            UNIVERSO IMPÉRIO <b>V3</b>
          </span>
        </div>
      </header>

      {/* =================================================
          HERO
      ================================================= */}

      <section className={"hero"}>
        <div className={"hero-copy"}>
          <div className={"eyebrow"}>
            <span className={"eyebrow-line"} />
            CENTRAL DE GESTÃO
          </div>

          <h1>
            Sua loja, <span>em um só lugar.</span>
          </h1>

          <p>
            Bem-vindo ao painel do Universo Império. Gerencie sua operação,
            acompanhe os indicadores e mantenha tudo organizado.
          </p>

          <div className={"hero-actions"}>
            <Link
              href="/painel/pedidos"
              className={"hero-button hero-button-primary"}
            >
              <Icone nome="shopping-bag" tamanho={17} />
              Acompanhar pedidos
              <Icone nome="arrow-right" tamanho={15} />
            </Link>

            <Link
              href="/painel/produtos"
              className={"hero-button hero-button-secondary"}
            >
              <Icone nome="package" tamanho={17} />
              Gerenciar produtos
            </Link>
          </div>
        </div>

        <div
          className={"hero-visual"}
          aria-label="Painel administrativo Universo Império"
        >
          <div className={"visual-orbit orbit-one"} />

          <div className={"visual-orbit orbit-two"} />

          <div className={"visual-glass-card"}>
            <div className={"visual-card-top"}>
              <span className={"visual-card-icon"}>
                <Icone nome="layout-dashboard" tamanho={19} />
              </span>

              <span className={"visual-live"}>
                <i /> PAINEL ATIVO
              </span>
            </div>

            <div className={"visual-emblem"}>
              <span className={"emblem-ring emblem-ring-one"} />

              <span className={"emblem-ring emblem-ring-two"} />

              <span className={"emblem-core"}>
                <Icone nome="layers" tamanho={31} />
              </span>
            </div>

            <div className={"visual-card-caption"}>
              <span>UNIVERSO IMPÉRIO</span>

              <strong>Gestão inteligente</strong>

              <small>Organização para sua operação crescer.</small>
            </div>

            <div className={"visual-card-footer"}>
              <span>
                <i /> Estrutura administrativa
              </span>

              <Icone nome="shield-check" tamanho={16} />
            </div>
          </div>

          <div className={"floating-chip chip-top"}>
            <span className={"chip-icon"}>
              <Icone nome="package" tamanho={15} />
            </span>

            <span>
              <b>Catálogo</b>

              <small>Produtos e categorias</small>
            </span>
          </div>

          <div className={"floating-chip chip-bottom"}>
            <span className={"chip-icon chip-icon-light"}>
              <Icone nome="users" tamanho={15} />
            </span>

            <span>
              <b>Clientes</b>

              <small>Relacionamento</small>
            </span>
          </div>
        </div>
      </section>

      {/* =================================================
          INDICADORES
      ================================================= */}

      <section className={"dashboard-section"} aria-labelledby="overview-title">
        <div className={"section-heading"}>
          <div>
            <span className={"section-kicker"}>ACOMPANHAMENTO</span>

            <h2 id="overview-title">Visão geral</h2>

            <p>Os principais números da sua operação em um só painel.</p>
          </div>

          <span className={"section-note"}>
            <Icone nome="activity" tamanho={15} />
            Indicadores da loja
          </span>
        </div>

        <div className={"stats-grid"}>
          {indicadores.map((item, index) => (
            <article
              className={`stat-card ${classesIndicadores[item.cor] ?? ""}`}
              key={item.titulo}
            >
              <div className={"stat-card-top"}>
                <span className={"stat-icon"}>
                  <Icone nome={item.icone} tamanho={21} />
                </span>

                <span className={"stat-index"}>0{index + 1}</span>
              </div>

              <span className={"stat-title"}>{item.titulo}</span>

              <strong className={"stat-value"}>
                {obterValorIndicador(item.titulo, item.valor)}
              </strong>

              <div className={"stat-bottom"}>
                <span>{item.descricao}</span>

                <span className={"stat-detail"}>{item.detalhe}</span>
              </div>

              <span className={"stat-decoration"} aria-hidden="true" />
            </article>
          ))}
        </div>
      </section>

      {/* =================================================
          OPERAÇÕES E RESUMO OPERACIONAL
      ================================================= */}

      <section className={"main-grid"}>
        <article className={"panel operations-panel"}>
          <div className={"panel-heading"}>
            <div>
              <span className={"section-kicker"}>GERENCIAMENTO</span>

              <h2>Central de operações</h2>

              <p>Acesse as áreas mais importantes da sua loja.</p>
            </div>

            <span className={"panel-heading-icon"}>
              <Icone nome="layers" tamanho={20} />
            </span>
          </div>

          <div className={"operations-grid"}>
            {operacoes.map((item, index) => (
              <Link
                key={item.rota}
                href={item.rota}
                className={"operation-card"}
              >
                <div className={"operation-card-head"}>
                  <span className={"operation-icon"}>
                    <Icone nome={item.icone} tamanho={21} />
                  </span>

                  <span className={"operation-index"}>0{index + 1}</span>

                  <span className={"operation-arrow"}>
                    <Icone nome="arrow-up-right" tamanho={17} />
                  </span>
                </div>

                <span className={"operation-label"}>{item.etiqueta}</span>

                <strong>{item.titulo}</strong>

                <p>{item.descricao}</p>

                <span className={"operation-link"}>
                  Acessar área
                  <Icone nome="arrow-right" tamanho={14} />
                </span>
              </Link>
            ))}
          </div>
        </article>

        {/* RESUMO OPERACIONAL */}

        <article className={"panel summary-panel"}>
          <div className={"panel-heading"}>
            <div>
              <span className={"section-kicker"}>MONITORAMENTO</span>

              <h2>Resumo operacional</h2>

              <p>Pontos que merecem sua atenção.</p>
            </div>

            <span className={"panel-heading-icon"}>
              <Icone nome="activity" tamanho={20} />
            </span>
          </div>

          <div className={"summary-list"}>
            {resumo.map((item) => {
              const valor =
                item.titulo === "Produtos cadastrados"
                  ? carregandoProdutos
                    ? "..."
                    : erroProdutos || totalProdutos === null
                      ? "—"
                      : formatarNumero(totalProdutos)
                  : item.valor;

              return (
                <div className={"summary-item"} key={item.titulo}>
                  <span
                    className={`summary-icon ${classesResumo[item.cor] ?? ""}`}
                  >
                    <Icone nome={item.icone} tamanho={18} />
                  </span>

                  <span className={"summary-info"}>
                    <strong>{item.titulo}</strong>

                    <small>{item.descricao}</small>
                  </span>

                  <strong className={"summary-value"}>{valor}</strong>
                </div>
              );
            })}
          </div>

          <div className={"integration-note"}>
            <span className={"integration-icon"}>
              <Icone nome="shield-check" tamanho={16} />
            </span>

            <span>
              <strong>Integração com a API</strong>

              <small>
                Pedidos, clientes e produtos são consultados no backend. Os
                demais indicadores ainda aguardam integração.
              </small>
            </span>
          </div>
        </article>
      </section>

      {/* =================================================
          PEDIDOS RECENTES
      ================================================= */}

      <section className={"panel orders-panel"}>
        <div className={"panel-heading orders-heading"}>
          <div>
            <span className={"section-kicker"}>MOVIMENTAÇÕES</span>

            <h2>Pedidos recentes</h2>

            <p>Acompanhe as últimas compras realizadas na loja.</p>
          </div>

          <Link href="/painel/pedidos" className={"text-link"}>
            Ver todos os pedidos
            <Icone nome="arrow-up-right" tamanho={16} />
          </Link>
        </div>

        {/* CARREGANDO */}

        {carregandoPedidos ? (
          <div className={"orders-feedback"}>
            <Icone nome="loader-circle" tamanho={22} />

            <span>Carregando pedidos recentes...</span>
          </div>
        ) : erroPedidos ? (
          /* ERRO */

          <div className={"orders-feedback orders-error"}>
            <Icone nome="alert-circle" tamanho={22} />

            <span>
              Não foi possível carregar os pedidos. Verifique sua conexão e
              tente novamente.
            </span>
          </div>
        ) : pedidosRecentes.length === 0 ? (
          /* LISTA VAZIA */

          <div className={"orders-empty"}>
            <div className={"empty-art"}>
              <span className={"empty-art-circle circle-one"} />

              <span className={"empty-art-circle circle-two"} />

              <span className={"empty-art-icon"}>
                <Icone nome="shopping-bag" tamanho={28} />
              </span>

              <span className={"empty-art-spark spark-one"}>✦</span>

              <span className={"empty-art-spark spark-two"}>✧</span>
            </div>

            <div className={"empty-copy"}>
              <span className={"empty-overline"}>TUDO TRANQUILO POR AQUI</span>

              <h3>Nenhum pedido por enquanto</h3>

              <p>
                Quando sua loja receber novas compras, os pedidos aparecerão
                nesta área para você acompanhar cada etapa.
              </p>

              <Link href="/painel/pedidos" className={"empty-button"}>
                Acessar gerenciamento de pedidos
                <Icone nome="arrow-right" tamanho={15} />
              </Link>
            </div>
          </div>
        ) : (
          /* PEDIDOS CARREGADOS */

          <div className={"orders-list"}>
            {pedidosRecentes.map((pedido) => (
              <article className={"order-row"} key={pedido.id_pedido}>
                <span className={"order-icon"}>
                  <Icone nome="shopping-bag" tamanho={19} />
                </span>

                <div className={"order-identification"}>
                  <strong>
                    {pedido.codigo || `Pedido #${pedido.id_pedido}`}
                  </strong>

                  <small>{formatarData(pedido.criado_em)}</small>
                </div>

                <span
                  className={`order-status-badge ${classeStatus(pedido.status)}`}
                >
                  {formatarStatus(pedido.status)}
                </span>

                <strong className={"order-total"}>
                  {formatarMoeda(pedido.total)}
                </strong>
              </article>
            ))}

            <div className={"orders-list-footer"}>
              <span>
                Exibindo {pedidosRecentes.length} pedido(s) recente(s).
              </span>

              <Link href="/painel/pedidos">
                Consultar todos
                <Icone nome="arrow-right" tamanho={14} />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* =================================================
          ACESSOS RÁPIDOS
      ================================================= */}

      <section className={"panel shortcuts-panel"}>
        <div className={"panel-heading"}>
          <div>
            <span className={"section-kicker"}>NAVEGAÇÃO</span>

            <h2>Acessos rápidos</h2>

            <p>Atalhos para as ferramentas do painel administrativo.</p>
          </div>
        </div>

        <div className={"shortcuts-grid"}>
          {acessos.map((item) => (
            <Link key={item.rota} href={item.rota} className={"shortcut-card"}>
              <span className={"shortcut-icon"}>
                <Icone nome={item.icone} tamanho={19} />
              </span>

              <span className={"shortcut-copy"}>
                <strong>{item.nome}</strong>

                <small>{item.descricao}</small>
              </span>

              <span className={"shortcut-arrow"}>
                <Icone nome="arrow-up-right" tamanho={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* =================================================
          RODAPÉ
      ================================================= */}

      <footer className={"dashboard-footer"}>
        <span>© Universo Império</span>

        <span className={"footer-center"}>
          Feito para organizar e impulsionar sua loja.
        </span>

        <span className={"footer-version"}>
          PAINEL ADMINISTRATIVO <b>V3</b>
        </span>
      </footer>
    </main>
  );
}
