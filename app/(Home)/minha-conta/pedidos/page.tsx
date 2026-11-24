"use client";

import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Package,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";

type FiltroPedido = "todos" | "em_andamento" | "concluidos" | "cancelados";

type StatusPedido =
  | "aguardando_pagamento"
  | "pago"
  | "em_preparacao"
  | "enviado"
  | "entregue"
  | "cancelado";

type Pedido = {
  id: number;
  codigo: string;
  data: string;
  total: number;
  status: StatusPedido;
  quantidadeItens: number;
};

type EstadoCarregamento = "carregando" | "sucesso" | "erro";

const filtros: { id: FiltroPedido; label: string }[] = [
  { id: "todos", label: "Todos os pedidos" },
  { id: "em_andamento", label: "Em andamento" },
  { id: "concluidos", label: "Concluídos" },
  { id: "cancelados", label: "Cancelados" },
];

const statusPedido: Record<StatusPedido, { label: string; classe: string }> = {
  aguardando_pagamento: {
    label: "Aguardando pagamento",
    classe: "aguardando",
  },
  pago: {
    label: "Pagamento aprovado",
    classe: "pago",
  },
  em_preparacao: {
    label: "Em preparação",
    classe: "preparacao",
  },
  enviado: {
    label: "Enviado",
    classe: "enviado",
  },
  entregue: {
    label: "Entregue",
    classe: "entregue",
  },
  cancelado: {
    label: "Cancelado",
    classe: "cancelado",
  },
};

function normalizarStatus(valor: unknown): StatusPedido {
  const status = String(valor ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  const equivalencias: Record<string, StatusPedido> = {
    aguardando_pagamento: "aguardando_pagamento",
    pendente: "aguardando_pagamento",
    pending: "aguardando_pagamento",

    pago: "pago",
    aprovado: "pago",
    aprovado_pagamento: "pago",
    approved: "pago",

    em_preparacao: "em_preparacao",
    preparando: "em_preparacao",
    processamento: "em_preparacao",
    em_processamento: "em_preparacao",

    enviado: "enviado",
    enviado_transportadora: "enviado",
    shipped: "enviado",

    entregue: "entregue",
    delivered: "entregue",

    cancelado: "cancelado",
    cancelled: "cancelado",
    rejected: "cancelado",
    reembolsado: "cancelado",
  };

  return equivalencias[status] ?? "aguardando_pagamento";
}

function formatarMoeda(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarData(valor: string) {
  if (!valor) return "Data não informada";

  const data = new Date(valor.includes("T") ? valor : valor.replace(" ", "T"));

  if (Number.isNaN(data.getTime())) return valor;

  return new Intl.DateTimeFormat("pt-BR").format(data);
}

/** Estrutura retornada pelo endpoint GET /meus-pedidos. */
type RespostaMeusPedidos = {
  status?: number;
  mensagem?: string;
  dados?: {
    sucesso: boolean;
    mensagem?: string;
    dados?: {
      pedidos: unknown[];
      paginacao?: {
        pagina: number;
        limite: number;
        total: number;
        total_paginas: number;
      };
    };
  };
};

type ObjetoApi = Record<string, unknown>;

function ehObjetoApi(valor: unknown): valor is ObjetoApi {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/**
 * Algumas configurações do Axios retornam o AxiosResponse completo; outras
 * usam um interceptor que já devolve response.data. Também toleramos o sufixo
 * adicional exibido pela resposta atual do PHP: JSON seguido de null.
 */
function decodificarRespostaApi(payload: unknown): ObjetoApi {
  let conteudo: unknown = payload;

  // AxiosResponse completo: o corpo HTTP fica em .data.
  if (
    ehObjetoApi(conteudo) &&
    "data" in conteudo &&
    (typeof conteudo.data === "string" || ehObjetoApi(conteudo.data))
  ) {
    conteudo = conteudo.data;
  }

  if (typeof conteudo === "string") {
    const texto = conteudo.trim();

    try {
      conteudo = JSON.parse(texto) as unknown;
    } catch {
      // Remove apenas um null isolado depois do JSON, sem alterar os campos.
      const semNullFinal = texto.replace(/\s*null\s*$/, "").trimEnd();

      if (semNullFinal === texto) {
        throw new Error("A API retornou um conteúdo que não é um JSON válido.");
      }

      try {
        conteudo = JSON.parse(semNullFinal) as unknown;
      } catch {
        throw new Error("A API retornou um conteúdo que não é um JSON válido.");
      }
    }
  }

  if (!ehObjetoApi(conteudo)) {
    throw new Error("A API retornou uma resposta inválida.");
  }

  return conteudo;
}

function extrairListaPedidos(payload: unknown): unknown[] {
  const resposta = decodificarRespostaApi(payload) as RespostaMeusPedidos;

  if (Number(resposta.status ?? 200) >= 400) {
    throw new Error(
      resposta.mensagem || "Não foi possível consultar seus pedidos.",
    );
  }

  const resultado = resposta.dados;

  if (!resultado || resultado.sucesso !== true) {
    throw new Error(
      resultado?.mensagem || "A API não confirmou a consulta dos pedidos.",
    );
  }

  const pedidos = resultado.dados?.pedidos;

  if (!Array.isArray(pedidos)) {
    throw new Error(
      "A resposta da API não contém a lista de pedidos esperada.",
    );
  }

  return pedidos;
}

function normalizarPedido(valor: unknown): Pedido | null {
  if (!valor || typeof valor !== "object") return null;

  const item = valor as Record<string, unknown>;
  const id = Number(item.id_pedido ?? item.id ?? 0);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return {
    id,
    codigo: String(item.codigo ?? item.codigo_pedido ?? `#${id}`),
    data: String(item.criado_em ?? item.data ?? item.created_at ?? ""),
    total: Number(item.total ?? item.valor_total ?? 0),
    status: normalizarStatus(item.status),
    quantidadeItens: Number(
      item.quantidade_itens ??
        item.quantidadeItens ??
        item.total_itens ??
        item.itens_count ??
        0,
    ),
  };
}

function pertenceAoFiltro(pedido: Pedido, filtro: FiltroPedido) {
  if (filtro === "todos") return true;

  if (filtro === "cancelados") {
    return pedido.status === "cancelado";
  }

  if (filtro === "concluidos") {
    return pedido.status === "entregue";
  }

  return ["aguardando_pagamento", "pago", "em_preparacao", "enviado"].includes(
    pedido.status,
  );
}

function extrairMensagemErro(erro: unknown): string {
  if (!erro || typeof erro !== "object") {
    return "Não foi possível carregar seus pedidos. Tente novamente.";
  }

  const falha = erro as {
    message?: string;
    response?: {
      status?: number;
      data?: { mensagem?: string; message?: string };
    };
  };

  if (falha.response?.status === 401 || falha.response?.status === 403) {
    return "Sua sessão expirou ou você precisa entrar na sua conta novamente.";
  }

  return (
    falha.response?.data?.mensagem ??
    falha.response?.data?.message ??
    falha.message ??
    "Não foi possível carregar seus pedidos. Tente novamente."
  );
}

export default function MeusPedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtro, setFiltro] = useState<FiltroPedido>("todos");
  const [busca, setBusca] = useState("");

  const [estado, setEstado] = useState<EstadoCarregamento>("carregando");

  const [mensagemErro, setMensagemErro] = useState("");

  const carregarPedidos = useCallback(async () => {
    try {
      setEstado("carregando");
      setMensagemErro("");

      // Endpoint da API PHP. Não usar ROTAS.PAGINAS.LOJA.PEDIDOS aqui:
      // essa constante é apenas a URL da página Next.js (/minha-conta/pedidos).
      const resposta = await conexao.get(ROTAS.PEDIDOS.MEUS_PEDIDOS, {
        params: { pagina: 1, limite: 50 },
      });

      const lista = extrairListaPedidos(resposta);
      const normalizados = lista
        .map(normalizarPedido)
        .filter((pedido): pedido is Pedido => pedido !== null);

      setPedidos(normalizados);
      setEstado("sucesso");
    } catch (erro: unknown) {
      console.error("Erro ao carregar meus pedidos:", erro);
      setMensagemErro(extrairMensagemErro(erro));
      setEstado("erro");
    }
  }, []);

  useEffect(() => {
    void carregarPedidos();
  }, [carregarPedidos]);

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return pedidos.filter((pedido) => {
      const correspondeFiltro = pertenceAoFiltro(pedido, filtro);

      const correspondeBusca =
        !termo ||
        pedido.codigo.toLocaleLowerCase("pt-BR").includes(termo) ||
        String(pedido.id).includes(termo);

      return correspondeFiltro && correspondeBusca;
    });
  }, [pedidos, filtro, busca]);

  return (
    <main className="minha-conta-pedidos">
      <div className="pedidos-shell">
        <nav className="pedidos-breadcrumb" aria-label="Navegação estrutural">
          <Link href="/">Início</Link>
          <span aria-hidden="true">/</span>
          <Link href="/minha-conta">Minha conta</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Meus pedidos</span>
        </nav>

        <header className="pedidos-header">
          <div className="pedidos-header__texto">
            <span className="pedidos-eyebrow">
              UNIVERSO IMPÉRIO · SUA CONTA
            </span>

            <h1>Meus pedidos</h1>

            <p>
              Acompanhe suas compras, consulte os detalhes e veja cada etapa da
              entrega.
            </p>
          </div>

          <Link
            href="/produtos"
            className="pedidos-botao pedidos-botao--contorno"
          >
            <ShoppingBag size={17} />
            Continuar comprando
          </Link>
        </header>

        <section className="pedidos-resumo" aria-label="Resumo dos pedidos">
          <div className="pedidos-resumo__icone">
            <ClipboardList size={22} />
          </div>

          <div>
            <span className="pedidos-resumo__rotulo">Histórico de compras</span>

            <strong>
              {estado === "carregando"
                ? "Carregando..."
                : `${pedidos.length} ${
                    pedidos.length === 1 ? "pedido" : "pedidos"
                  }`}
            </strong>
          </div>

          <span className="pedidos-resumo__nota">
            Seus pedidos em um só lugar
          </span>
        </section>

        <section className="pedidos-painel" aria-label="Lista de pedidos">
          <div className="pedidos-painel__topo">
            <div>
              <span className="pedidos-eyebrow">ACOMPANHAMENTO</span>

              <h2>Histórico de pedidos</h2>
            </div>

            <span className="pedidos-contador">
              {pedidosFiltrados.length} encontrados
            </span>
          </div>

          <div className="pedidos-ferramentas">
            <div
              className="pedidos-filtros"
              role="group"
              aria-label="Filtrar pedidos"
            >
              {filtros.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`pedidos-filtro ${
                    filtro === item.id ? "is-ativo" : ""
                  }`}
                  onClick={() => setFiltro(item.id)}
                  aria-pressed={filtro === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="pedidos-busca">
              <Search size={17} aria-hidden="true" />

              <input
                type="search"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
                placeholder="Buscar número do pedido"
                aria-label="Buscar número do pedido"
              />
            </label>
          </div>

          {estado === "carregando" ? (
            <div className="pedidos-vazio">
              <div className="pedidos-vazio__icone">
                <Package size={34} strokeWidth={1.5} />
              </div>

              <h3>Carregando seus pedidos...</h3>

              <p>Estamos consultando seu histórico de compras.</p>
            </div>
          ) : estado === "erro" ? (
            <div className="pedidos-vazio">
              <div className="pedidos-vazio__icone">
                <ShoppingBag size={34} strokeWidth={1.5} />
              </div>

              <span className="pedidos-eyebrow">NÃO FOI POSSÍVEL CARREGAR</span>

              <h3>Ocorreu um problema</h3>

              <p>{mensagemErro}</p>

              <button
                type="button"
                className="pedidos-botao pedidos-botao--primario"
                onClick={carregarPedidos}
              >
                Tentar novamente
              </button>
            </div>
          ) : pedidosFiltrados.length > 0 ? (
            <div className="pedidos-lista">
              {pedidosFiltrados.map((pedido) => {
                const status = statusPedido[pedido.status];

                return (
                  <article className="pedido-card" key={pedido.id}>
                    <div className="pedido-card__icone">
                      <Package size={22} />
                    </div>

                    <div className="pedido-card__principal">
                      <span className="pedido-card__codigo">
                        Pedido {pedido.codigo}
                      </span>

                      <span className="pedido-card__data">
                        Realizado em {formatarData(pedido.data)}
                      </span>

                      <span
                        className={`pedido-status pedido-status--${status.classe}`}
                      >
                        <i aria-hidden="true" />
                        {status.label}
                      </span>
                    </div>

                    <div className="pedido-card__detalhe">
                      <span>Itens</span>
                      <strong>{pedido.quantidadeItens}</strong>
                    </div>

                    <div className="pedido-card__detalhe">
                      <span>Total</span>
                      <strong>{formatarMoeda(pedido.total)}</strong>
                    </div>

                    <Link
                      href={`${ROTAS.PAGINAS.LOJA.PEDIDOS}/${pedido.id}`}
                      className="pedido-card__acao"
                    >
                      Ver detalhes
                      <ArrowRight size={16} />
                    </Link>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="pedidos-vazio">
              <div className="pedidos-vazio__icone">
                <ShoppingBag size={34} strokeWidth={1.5} />
              </div>

              <span className="pedidos-eyebrow">SEU HISTÓRICO</span>

              <h3>
                {busca
                  ? "Nenhum pedido encontrado"
                  : filtro !== "todos"
                    ? "Nenhum pedido nesta categoria"
                    : "Você ainda não tem pedidos por aqui"}
              </h3>

              <p>
                {busca
                  ? "Confira o número informado ou limpe a busca para tentar novamente."
                  : "Assim que você fizer uma compra, poderá acompanhar o pagamento, a preparação e a entrega nesta página."}
              </p>

              {busca ? (
                <button
                  type="button"
                  className="pedidos-botao pedidos-botao--primario"
                  onClick={() => setBusca("")}
                >
                  Limpar busca
                </button>
              ) : filtro !== "todos" ? (
                <button
                  type="button"
                  className="pedidos-botao pedidos-botao--primario"
                  onClick={() => setFiltro("todos")}
                >
                  Ver todos os pedidos
                </button>
              ) : (
                <Link
                  href="/produtos"
                  className="pedidos-botao pedidos-botao--primario"
                >
                  Explorar produtos
                  <ArrowRight size={17} />
                </Link>
              )}
            </div>
          )}
        </section>

        <footer className="pedidos-ajuda">
          <div className="pedidos-ajuda__icone">
            <SlidersHorizontal size={18} />
          </div>

          <p>
            Precisa de ajuda com uma compra? Entre em contato com nossa equipe
            de atendimento.
          </p>

          <Link href="/contato">
            Falar com a loja
            <ArrowRight size={15} />
          </Link>
        </footer>

        <Link href="/minha-conta" className="pedidos-voltar">
          <ArrowLeft size={16} />
          Voltar para minha conta
        </Link>
      </div>
    </main>
  );
}
