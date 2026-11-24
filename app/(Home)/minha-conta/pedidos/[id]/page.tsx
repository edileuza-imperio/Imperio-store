"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock3,
  MapPin,
  Package,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  Truck,
} from "lucide-react";

import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";

const estilosPedido = String.raw`
.pagina {
  --borda: color-mix(in srgb, var(--ui-vinho, #713c4c) 14%, transparent);
  --sombra: 0 16px 42px rgba(62, 35, 48, .065);
  min-height: 70vh;
  padding: clamp(24px, 4vw, 52px) 18px 64px;
  color: var(--ui-vinho-escuro, #542b3b);
  background:
    radial-gradient(circle at 8% 0%, var(--ui-blush, #fbf1ee) 0, transparent 34%),
    linear-gradient(180deg, var(--ui-marfin, #fffaf7) 0%, #fff 58%);
}

.container { width: min(1120px, 100%); margin: 0 auto; }
.breadcrumb { display:flex; flex-wrap:wrap; align-items:center; gap:9px; margin-bottom:30px; color:var(--ui-vinho-suave,#89576a); font-size:.82rem; }
.breadcrumb a { color:inherit; text-decoration:none; }
.breadcrumb a:hover { color:var(--ui-vinho,#713c4c); }
.breadcrumb [aria-current="page"] { color:var(--ui-vinho-escuro,#542b3b); font-weight:700; }
.cabecalho { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:25px; }
.eyebrow { display:inline-block; color:var(--ui-rosa-medio,#d69aa5); font-size:.67rem; font-weight:800; letter-spacing:.19em; }
.cabecalho h1 { margin:9px 0 8px; font-family:Georgia,"Times New Roman",serif; font-size:clamp(2rem,4vw,3rem); font-weight:500; letter-spacing:-.045em; line-height:1.08; }
.cabecalho p { margin:0; color:var(--ui-vinho-suave,#89576a); font-size:.93rem; line-height:1.65; }
.botaoContorno,.botaoPrimario { display:inline-flex; min-height:43px; align-items:center; justify-content:center; gap:8px; border:1px solid var(--borda); border-radius:11px; padding:0 15px; font:inherit; font-size:.82rem; font-weight:750; text-decoration:none; cursor:pointer; }
.botaoContorno { color:var(--ui-vinho,#713c4c); background:#fff; }
.botaoPrimario { color:#fff; border-color:var(--ui-vinho,#713c4c); background:var(--ui-vinho,#713c4c); }
.resumoPedido,.cartao,.estadoCentral { border:1px solid var(--borda); border-radius:18px; background:rgba(255,255,255,.91); box-shadow:var(--sombra); }
.resumoPedido { margin-bottom:22px; padding:23px 25px 20px; }
.resumoPedidoTopo { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; padding-bottom:19px; border-bottom:1px solid var(--borda); }
.rotulo,.resumoGrid span { display:block; margin-bottom:5px; color:var(--ui-vinho-suave,#89576a); font-size:.73rem; }
.resumoPedido h2 { margin:0 0 5px; font-family:Georgia,"Times New Roman",serif; font-size:1.6rem; font-weight:500; }
.resumoPedido p { margin:0; color:var(--ui-vinho-suave,#89576a); font-size:.82rem; }
.status { display:inline-flex; align-items:center; gap:7px; flex-shrink:0; border-radius:999px; padding:8px 12px; font-size:.73rem; font-weight:800; }
.status i { width:7px; height:7px; border-radius:50%; background:currentColor; }
.status_sucesso { color:#287b56; background:#eaf6ef; }
.status_aviso { color:#986b17; background:#fff5df; }
.status_info { color:#446d9c; background:#edf4fc; }
.status_erro { color:#a43b4b; background:#fff0f1; }
.status_neutro { color:#765568; background:#f5eef2; }
.resumoGrid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; padding-top:17px; }
.resumoGrid strong { display:block; color:var(--ui-vinho-escuro,#542b3b); font-size:.9rem; overflow-wrap:anywhere; }
.gradeConteudo { display:grid; grid-template-columns:minmax(0,1.55fr) minmax(280px,.85fr); gap:20px; align-items:start; }
.colunaPrincipal,.colunaLateral { display:grid; gap:20px; min-width:0; }
.cartao { overflow:hidden; padding:21px 23px; }
.tituloCartao { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:17px; }
.tituloCartao > div { display:flex; align-items:center; gap:10px; color:var(--ui-vinho,#713c4c); }
.tituloCartao h2 { margin:0; color:var(--ui-vinho-escuro,#542b3b); font-family:Georgia,"Times New Roman",serif; font-size:1.22rem; font-weight:500; }
.tituloCartao > span { color:var(--ui-vinho-suave,#89576a); font-size:.75rem; }
.listaItens { display:grid; }
.item { display:flex; align-items:center; gap:14px; padding:14px 0; border-top:1px solid var(--borda); }
.iconeItem { display:grid; width:48px; height:48px; flex:0 0 48px; place-items:center; border-radius:13px; color:var(--ui-vinho,#713c4c); background:var(--ui-rosa-claro,#f4e4e3); }
.itemDescricao { display:grid; min-width:0; gap:4px; }
.itemDescricao strong { color:var(--ui-vinho-escuro,#542b3b); font-size:.86rem; }
.itemDescricao span,.itemDescricao small { color:var(--ui-vinho-suave,#89576a); font-size:.73rem; }
.totalItem { margin-left:auto; white-space:nowrap; font-size:.88rem; }
.textoVazio { margin:0; color:var(--ui-vinho-suave,#89576a); font-size:.84rem; line-height:1.6; }
.progresso { display:grid; gap:0; }
.etapa { display:grid; grid-template-columns:30px 1fr; gap:11px; position:relative; min-height:62px; color:#a58a95; }
.etapa:not(:last-child)::after { position:absolute; top:25px; left:14px; width:1px; height:37px; background:var(--borda); content:""; }
.etapa > span { display:grid; width:29px; height:29px; place-items:center; border:1px solid var(--borda); border-radius:50%; background:#fff; }
.etapa strong,.etapa small { display:block; }
.etapa strong { padding-top:2px; font-size:.82rem; }
.etapa small { margin-top:4px; color:var(--ui-vinho-suave,#89576a); font-size:.73rem; line-height:1.45; }
.etapaConcluida { color:#4c906e; }
.historico { display:grid; gap:0; margin:0; padding:0; list-style:none; }
.historico li { display:grid; grid-template-columns:28px 1fr; gap:10px; padding:13px 0; border-top:1px solid var(--borda); }
.marcadorHistorico { display:grid; width:27px; height:27px; place-items:center; border-radius:50%; color:#3e8b63; background:#edf7f0; }
.historico strong { display:block; font-size:.83rem; }
.historico p { margin:4px 0; color:var(--ui-vinho-suave,#89576a); font-size:.78rem; }
.historico time { display:block; margin-top:5px; color:#9a7d89; font-size:.7rem; }
.dataPagamento { margin:10px 0 0; color:#357b57; font-size:.77rem; }
.alertaCancelado { border-radius:12px; padding:13px 15px; color:#9c3345; background:#fff0f1; font-size:.82rem; line-height:1.55; }
.financeiro { display:grid; gap:13px; }
.linhaFinanceira { display:flex; justify-content:space-between; gap:12px; color:var(--ui-vinho-suave,#89576a); font-size:.8rem; }
.linhaFinanceira strong { color:var(--ui-vinho-escuro,#542b3b); font-size:.82rem; }
.linhaFinanceiraDestaque { margin-top:3px; border-top:1px solid var(--borda); padding-top:14px; color:var(--ui-vinho-escuro,#542b3b); font-weight:800; }
.linhaFinanceiraDestaque strong { color:var(--ui-vinho,#713c4c); font-size:1.08rem; }
.moedaNota { margin:14px 0 0; color:#9a7d89; font-size:.7rem; }
.endereco { display:grid; gap:6px; color:var(--ui-vinho-suave,#89576a); font-size:.8rem; font-style:normal; line-height:1.5; }
.endereco strong { color:var(--ui-vinho-escuro,#542b3b); font-size:.87rem; }
.observacoes { margin:0; color:var(--ui-vinho-suave,#89576a); font-size:.82rem; line-height:1.6; white-space:pre-wrap; }
.rodapeAcoes { display:flex; justify-content:space-between; align-items:center; gap:14px; margin-top:20px; border:1px solid var(--borda); border-radius:13px; padding:16px 18px; color:var(--ui-vinho-suave,#89576a); background:rgba(255,255,255,.78); font-size:.8rem; }
.rodapeAcoes a { display:inline-flex; align-items:center; gap:7px; color:var(--ui-vinho,#713c4c); font-weight:800; text-decoration:none; }
.estadoCentral { display:grid; justify-items:center; gap:13px; max-width:720px; margin:35px auto; padding:55px 25px; text-align:center; }
.estadoCentral > svg { color:var(--ui-vinho,#713c4c); }
.estadoCentral h1 { margin:0; font-family:Georgia,"Times New Roman",serif; font-size:1.8rem; font-weight:500; }
.estadoCentral p { max-width:520px; margin:0; color:var(--ui-vinho-suave,#89576a); font-size:.86rem; line-height:1.6; }
.acoesEstado { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; margin-top:5px; }
.girando { animation:girar 1s linear infinite; }
@keyframes girar { to { transform:rotate(360deg); } }

@media (max-width: 850px) {
  .gradeConteudo { grid-template-columns:1fr; }
  .colunaLateral { grid-template-columns:repeat(2,minmax(0,1fr)); }
  .colunaLateral > :last-child:nth-child(odd) { grid-column:1 / -1; }
}
@media (max-width: 620px) {
  .pagina { padding:22px 13px 40px; }
  .cabecalho { align-items:flex-start; flex-direction:column; }
  .resumoPedido { padding:18px 16px; }
  .resumoPedidoTopo { flex-direction:column; }
  .resumoGrid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:15px 10px; }
  .colunaLateral { grid-template-columns:1fr; }
  .colunaLateral > :last-child:nth-child(odd) { grid-column:auto; }
  .cartao { padding:18px 16px; }
  .item { align-items:flex-start; }
  .totalItem { padding-top:3px; font-size:.8rem; }
  .rodapeAcoes { align-items:flex-start; flex-direction:column; }
}

`;

type Registro = Record<string, unknown>;
type Estado = "carregando" | "sucesso" | "erro";

type DadosDetalhe = {
  pedido: Registro;
  itens: Registro[];
  enderecos: Registro[];
  historico: Registro[];
};

function ehObjeto(valor: unknown): valor is Registro {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function decodificarResposta(payload: unknown): Registro {
  let valor: unknown = payload;

  // Compatível com AxiosResponse e com interceptors que retornam response.data.
  if (ehObjeto(valor) && "data" in valor) valor = valor.data;

  if (typeof valor === "string") {
    const texto = valor.trim();
    try {
      valor = JSON.parse(texto) as unknown;
    } catch {
      // Compatibilidade com o JSON seguido de "null" observado no endpoint atual.
      const limpo = texto.replace(/\s*null\s*$/, "").trimEnd();
      if (limpo === texto) throw new Error("A API retornou um JSON inválido.");
      try {
        valor = JSON.parse(limpo) as unknown;
      } catch {
        throw new Error("A API retornou um JSON inválido.");
      }
    }
  }

  if (!ehObjeto(valor)) throw new Error("A API retornou uma resposta inválida.");
  return valor;
}

function extrairDetalhe(payload: unknown): DadosDetalhe {
  const resposta = decodificarResposta(payload);
  if (Number(resposta.status ?? 200) >= 400) {
    throw new Error(String(resposta.mensagem ?? "Não foi possível consultar o pedido."));
  }

  // Formato padrão do projeto: { status, mensagem, dados: { sucesso, dados } }.
  const envelope = ehObjeto(resposta.dados) && "sucesso" in resposta.dados
    ? resposta.dados
    : resposta;

  if (envelope.sucesso !== true) {
    throw new Error(String(envelope.mensagem ?? "Não foi possível consultar este pedido."));
  }

  const dados = ehObjeto(envelope.dados) ? envelope.dados : {};
  const pedido = ehObjeto(dados.pedido) ? dados.pedido : null;

  if (!pedido) throw new Error("A resposta não contém os dados do pedido.");

  return {
    pedido,
    itens: Array.isArray(dados.itens) ? dados.itens.filter(ehObjeto) : [],
    enderecos: Array.isArray(dados.enderecos) ? dados.enderecos.filter(ehObjeto) : [],
    historico: Array.isArray(dados.historico) ? dados.historico.filter(ehObjeto) : [],
  };
}

function texto(valor: unknown, fallback = "Não informado"): string {
  if (valor === null || valor === undefined || String(valor).trim() === "") return fallback;
  return String(valor);
}

function numero(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  const convertido = Number(String(valor ?? "0").replace(",", "."));
  return Number.isFinite(convertido) ? convertido : 0;
}

function moeda(valor: unknown): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(numero(valor));
}

function dataHora(valor: unknown): string {
  if (!valor) return "Não informado";
  const bruto = String(valor);
  const data = new Date(bruto.includes("T") ? bruto : bruto.replace(" ", "T"));
  if (Number.isNaN(data.getTime())) return bruto;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(data);
}

function normalizarStatus(valor: unknown): string {
  return String(valor ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR")
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function apresentarStatus(valor: unknown): { titulo: string; descricao: string; variante: string; etapa: number } {
  const status = normalizarStatus(valor);
  const mapa: Record<string, { titulo: string; descricao: string; variante: string; etapa: number }> = {
    pendente: { titulo: "Aguardando pagamento", descricao: "Estamos aguardando a confirmação do pagamento.", variante: "aviso", etapa: 0 },
    aguardando_pagamento: { titulo: "Aguardando pagamento", descricao: "Estamos aguardando a confirmação do pagamento.", variante: "aviso", etapa: 0 },
    pago: { titulo: "Pagamento aprovado", descricao: "Seu pagamento foi confirmado.", variante: "sucesso", etapa: 1 },
    aprovado: { titulo: "Pagamento aprovado", descricao: "Seu pagamento foi confirmado.", variante: "sucesso", etapa: 1 },
    em_preparacao: { titulo: "Em preparação", descricao: "Seu pedido está sendo preparado.", variante: "info", etapa: 2 },
    preparando: { titulo: "Em preparação", descricao: "Seu pedido está sendo preparado.", variante: "info", etapa: 2 },
    separando: { titulo: "Em preparação", descricao: "Seu pedido está sendo separado.", variante: "info", etapa: 2 },
    enviado: { titulo: "Enviado", descricao: "Seu pedido foi enviado.", variante: "info", etapa: 3 },
    enviado_transportadora: { titulo: "Enviado", descricao: "Seu pedido foi enviado.", variante: "info", etapa: 3 },
    entregue: { titulo: "Entregue", descricao: "O pedido consta como entregue.", variante: "sucesso", etapa: 4 },
    cancelado: { titulo: "Cancelado", descricao: "Este pedido foi cancelado.", variante: "erro", etapa: -1 },
    cancelled: { titulo: "Cancelado", descricao: "Este pedido foi cancelado.", variante: "erro", etapa: -1 },
    reembolsado: { titulo: "Reembolsado", descricao: "Este pedido foi reembolsado.", variante: "erro", etapa: -1 },
  };
  return mapa[status] ?? {
    titulo: texto(valor, "Status não informado"),
    descricao: "Consulte esta página para acompanhar novas atualizações.",
    variante: "neutro",
    etapa: 0,
  };
}

function mensagemErro(erro: unknown): string {
  if (ehObjeto(erro)) {
    const resposta = ehObjeto(erro.response) ? erro.response : {};
    const dados = ehObjeto(resposta.data) ? resposta.data : {};
    const status = Number(resposta.status ?? 0);
    if (status === 401 || status === 403) return "Sua sessão expirou. Entre novamente na sua conta para consultar este pedido.";
    return texto(dados.mensagem ?? dados.message ?? erro.message, "Não foi possível carregar os detalhes do pedido.");
  }
  return "Não foi possível carregar os detalhes do pedido. Tente novamente.";
}

function LinhaFinanceira({ titulo, valor, destaque = false }: { titulo: string; valor: unknown; destaque?: boolean }) {
  return (
    <div className={`${"linhaFinanceira"} ${destaque ? "linhaFinanceiraDestaque" : ""}`}>
      <span>{titulo}</span>
      <strong>{moeda(valor)}</strong>
    </div>
  );
}

export default function DetalhePedidoPage() {
  const params = useParams<{ id: string }>();
  const idPedido = Number(params?.id);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [erro, setErro] = useState("");
  const [detalhe, setDetalhe] = useState<DadosDetalhe | null>(null);

  const carregar = useCallback(async () => {
    if (!Number.isInteger(idPedido) || idPedido <= 0) {
      setErro("O número do pedido informado é inválido.");
      setEstado("erro");
      return;
    }

    try {
      setEstado("carregando");
      setErro("");
      const resposta = await conexao.get(ROTAS.PEDIDOS.BUSCAR_MEU_PEDIDO(idPedido));
      setDetalhe(extrairDetalhe(resposta));
      setEstado("sucesso");
    } catch (falha: unknown) {
      console.error("Erro ao carregar detalhes do pedido:", falha);
      setErro(mensagemErro(falha));
      setEstado("erro");
    }
  }, [idPedido]);

  useEffect(() => { void carregar(); }, [carregar]);

  const pedido = detalhe?.pedido;
  const status = useMemo(() => apresentarStatus(pedido?.status), [pedido?.status]);
  const enderecoEntrega = detalhe?.enderecos.find((item) => normalizarStatus(item.tipo) === "entrega")
    ?? detalhe?.enderecos[0];

  const linhasEtapas = [
    { titulo: "Pedido realizado", descricao: "Recebemos seu pedido.", icone: ShoppingBag },
    { titulo: "Pagamento", descricao: "Confirmação do pagamento.", icone: CheckCircle2 },
    { titulo: "Preparação", descricao: "Separação e preparação dos itens.", icone: Package },
    { titulo: "Enviado", descricao: "Pedido encaminhado para entrega.", icone: Truck },
    { titulo: "Entregue", descricao: "Pedido finalizado.", icone: CheckCircle2 },
  ];

  if (estado === "carregando") {
    return (
      <main className={"pagina"}>
        <style>{estilosPedido}</style>
        <div className={"container"}>
          <div className={"estadoCentral"}>
            <RefreshCw className={"girando"} size={28} />
            <h1>Carregando pedido</h1>
            <p>Estamos buscando os detalhes da sua compra.</p>
          </div>
        </div>
      </main>
    );
  }

  if (estado === "erro" || !detalhe || !pedido) {
    return (
      <main className={"pagina"}>
        <style>{estilosPedido}</style>
        <div className={"container"}>
          <nav className={"breadcrumb"}>
            <Link href="/">Início</Link><span>/</span>
            <Link href="/minha-conta">Minha conta</Link><span>/</span>
            <Link href={ROTAS.PAGINAS.LOJA.PEDIDOS}>Meus pedidos</Link><span>/</span>
            <span>Detalhes</span>
          </nav>
          <section className={"estadoCentral"}>
            <Package size={34} />
            <span className={"eyebrow"}>NÃO FOI POSSÍVEL CARREGAR</span>
            <h1>Pedido indisponível</h1>
            <p>{erro || "Não foi possível localizar este pedido na sua conta."}</p>
            <div className={"acoesEstado"}>
              <button type="button" className={"botaoPrimario"} onClick={() => void carregar()}>
                <RefreshCw size={16} /> Tentar novamente
              </button>
              <Link href={ROTAS.PAGINAS.LOJA.PEDIDOS} className={"botaoContorno"}>
                <ArrowLeft size={16} /> Voltar aos pedidos
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const endereco = enderecoEntrega;
  const codigo = texto(pedido.codigo, `#${idPedido}`);
  const tituloStatus = status.titulo;
  const classeStatus = status.variante === "sucesso"
    ? "status_sucesso"
    : status.variante === "aviso"
      ? "status_aviso"
      : status.variante === "info"
        ? "status_info"
        : status.variante === "erro"
          ? "status_erro"
          : "status_neutro";

  return (
    <main className={"pagina"}>
        <style>{estilosPedido}</style>
      <div className={"container"}>
        <nav className={"breadcrumb"} aria-label="Navegação estrutural">
          <Link href="/">Início</Link><span>/</span>
          <Link href="/minha-conta">Minha conta</Link><span>/</span>
          <Link href={ROTAS.PAGINAS.LOJA.PEDIDOS}>Meus pedidos</Link><span>/</span>
          <span aria-current="page">{codigo}</span>
        </nav>

        <header className={"cabecalho"}>
          <div>
            <span className={"eyebrow"}>UNIVERSO IMPÉRIO · SUA CONTA</span>
            <h1>Detalhes do pedido</h1>
            <p>Confira os itens, valores e atualizações da sua compra.</p>
          </div>
          <Link href={ROTAS.PAGINAS.LOJA.PEDIDOS} className={"botaoContorno"}>
            <ArrowLeft size={16} /> Voltar aos pedidos
          </Link>
        </header>

        <section className={"resumoPedido"}>
          <div className={"resumoPedidoTopo"}>
            <div>
              <span className={"rotulo"}>Pedido</span>
              <h2>{codigo}</h2>
              <p>Realizado em {dataHora(pedido.criado_em)}</p>
            </div>
            <span className={`${"status"} ${classeStatus}`}>
              <i /> {tituloStatus}
            </span>
          </div>
          <div className={"resumoGrid"}>
            <div><span>Número do pedido</span><strong>#{texto(pedido.id_pedido, String(idPedido))}</strong></div>
            <div><span>Quantidade de itens</span><strong>{detalhe.itens.reduce((soma, item) => soma + numero(item.quantidade), 0)}</strong></div>
            <div><span>Pagamento</span><strong>{pedido.pago_em ? "Confirmado" : status.etapa === 0 ? "Aguardando" : "Não informado"}</strong></div>
            <div><span>Total da compra</span><strong>{moeda(pedido.total)}</strong></div>
          </div>
        </section>

        <div className={"gradeConteudo"}>
          <div className={"colunaPrincipal"}>
            <section className={"cartao"}>
              <div className={"tituloCartao"}>
                <div><Package size={19} /><h2>Itens do pedido</h2></div>
                <span>{detalhe.itens.length} {detalhe.itens.length === 1 ? "item" : "itens"}</span>
              </div>
              {detalhe.itens.length ? (
                <div className={"listaItens"}>
                  {detalhe.itens.map((item, indice) => {
                    const quantidade = numero(item.quantidade);
                    const preco = numero(item.preco_unitario);
                    const totalItem = item.total !== undefined
                      ? numero(item.total)
                      : Math.max(0, quantidade * preco - numero(item.desconto));
                    return (
                      <article className={"item"} key={String(item.id_pedido_item ?? `${item.produto_id ?? "produto"}-${indice}`)}>
                        <div className={"iconeItem"}><Package size={22} /></div>
                        <div className={"itemDescricao"}>
                          <strong>{texto(item.nome_produto, "Produto")}</strong>
                          {item.sku ? <span>SKU: {String(item.sku)}</span> : null}
                          <small>{quantidade} × {moeda(preco)}</small>
                        </div>
                        <strong className={"totalItem"}>{moeda(totalItem)}</strong>
                      </article>
                    );
                  })}
                </div>
              ) : <p className={"textoVazio"}>Nenhum item foi informado para este pedido.</p>}
            </section>

            <section className={"cartao"}>
              <div className={"tituloCartao"}>
                <div><Clock3 size={19} /><h2>Acompanhamento</h2></div>
              </div>
              {normalizarStatus(pedido.status) === "cancelado" ? (
                <div className={"alertaCancelado"}>Este pedido foi cancelado{pedido.cancelado_em ? ` em ${dataHora(pedido.cancelado_em)}` : ""}.</div>
              ) : detalhe.historico.length > 0 ? (
                <ol className={"historico"}>
                  {detalhe.historico.map((evento, indice) => (
                    <li key={String(evento.id ?? evento.id_historico ?? indice)}>
                      <span className={"marcadorHistorico"}><CheckCircle2 size={16} /></span>
                      <div>
                        <strong>{texto(evento.status ?? evento.titulo ?? evento.descricao, "Atualização do pedido")}</strong>
                        {evento.observacao ? <p>{String(evento.observacao)}</p> : null}
                        <time>{dataHora(evento.criado_em ?? evento.data ?? evento.data_hora)}</time>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className={"progresso"}>
                  {linhasEtapas.map((etapa, indice) => {
                    const concluida = status.etapa >= indice;
                    const Icone = concluida ? CheckCircle2 : indice === status.etapa + 1 ? Clock3 : Circle;
                    return (
                      <div className={`${"etapa"} ${concluida ? "etapaConcluida" : ""}`} key={etapa.titulo}>
                        <span><Icone size={19} /></span>
                        <div><strong>{etapa.titulo}</strong><small>{etapa.descricao}</small></div>
                      </div>
                    );
                  })}
                </div>
              )}
              {pedido.pago_em ? <p className={"dataPagamento"}>Pagamento confirmado em {dataHora(pedido.pago_em)}.</p> : null}
            </section>
          </div>

          <aside className={"colunaLateral"}>
            <section className={"cartao"}>
              <div className={"tituloCartao"}><div><ReceiptText size={19} /><h2>Resumo financeiro</h2></div></div>
              <div className={"financeiro"}>
                <LinhaFinanceira titulo="Subtotal" valor={pedido.subtotal} />
                <LinhaFinanceira titulo="Desconto" valor={-Math.abs(numero(pedido.desconto))} />
                <LinhaFinanceira titulo="Frete" valor={pedido.frete} />
                <LinhaFinanceira titulo="Total" valor={pedido.total} destaque />
              </div>
              <p className={"moedaNota"}>Valores em {texto(pedido.moeda, "BRL")}.</p>
            </section>

            <section className={"cartao"}>
              <div className={"tituloCartao"}><div><MapPin size={19} /><h2>Endereço de entrega</h2></div></div>
              {endereco ? (
                <address className={"endereco"}>
                  <strong>{texto(endereco.destinatario)}</strong>
                  {endereco.documento ? <span>{String(endereco.documento)}</span> : null}
                  <span>{texto(endereco.logradouro)}{endereco.numero ? `, ${String(endereco.numero)}` : ""}</span>
                  {endereco.complemento ? <span>{String(endereco.complemento)}</span> : null}
                  <span>{texto(endereco.bairro)}</span>
                  <span>{texto(endereco.cidade)}{endereco.estado ? ` - ${String(endereco.estado)}` : ""}</span>
                  <span>CEP: {texto(endereco.cep)}</span>
                  {endereco.telefone ? <span>Telefone: {String(endereco.telefone)}</span> : null}
                </address>
              ) : <p className={"textoVazio"}>Não há endereço de entrega registrado neste pedido.</p>}
            </section>

            {pedido.observacoes ? (
              <section className={"cartao"}>
                <div className={"tituloCartao"}><div><ReceiptText size={19} /><h2>Observações</h2></div></div>
                <p className={"observacoes"}>{String(pedido.observacoes)}</p>
              </section>
            ) : null}
          </aside>
        </div>

        <footer className={"rodapeAcoes"}>
          <span>Precisa de ajuda com esta compra?</span>
          <Link href="/contato">Falar com a loja <Truck size={15} /></Link>
        </footer>
      </div>
    </main>
  );
}
