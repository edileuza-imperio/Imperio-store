"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity, AlertCircle, ArrowDownToLine, ArrowLeftRight, ArrowRight,
  ArrowUpFromLine, Boxes, Building2, ClipboardList, Clock3, Package,
  PackageCheck, RefreshCw, Warehouse,
} from "lucide-react";
import ROTAS from "@/app/constants/rotas";

type LocalEstoque = {
  id_estoque_local: number | null;
  nome: string | null;
  codigo: string | null;
  descricao: string | null;
  ativo: boolean | number | string | null;
};

type SaldoEstoque = {
  id_saldo: number | null;
  estoque_local_id: number | null;
  produto_id: number | null;
  variacao_id: number | null;
  quantidade: string | number | null;
  reservado: string | number | null;
  item_chave: string | null;
};

type ReservaEstoque = {
  id_reserva: number | null;
  pedido_id: number | null;
  estoque_local_id: number | null;
  produto_id: number | null;
  quantidade: string | number | null;
  status: string | null;
  expira_em: string | null;
  criado_em: string | null;
};

type MovimentoEstoque = {
  id_movimento: number | null;
  estoque_local_id: number | null;
  produto_id: number | null;
  tipo: string | null;
  quantidade: string | number | null;
  observacao: string | null;
  criado_em: string | null;
};

type ApiResposta = {
  sucesso?: boolean;
  mensagem?: string;
  dados?: Record<string, unknown>;
  [chave: string]: unknown;
};
type ResultadoLista<T> = { dados: T[] } | { erro: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

async function buscarLista<T>(rota: string, chave: string): Promise<T[]> {
  if (!API_URL) throw new Error("A variável NEXT_PUBLIC_API_URL não está configurada.");

  const resposta = await fetch(`${API_URL}${rota}`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  let resultado: ApiResposta;
  try {
    resultado = (await resposta.json()) as ApiResposta;
  } catch {
    throw new Error("A API retornou uma resposta inválida.");
  }

  if (!resposta.ok || resultado.sucesso === false) {
    throw new Error(
      typeof resultado.mensagem === "string"
        ? resultado.mensagem
        : `Não foi possível consultar ${chave} (${resposta.status}).`,
    );
  }

  // O backend do estoque retorna as listas na raiz. O fallback contempla
  // também respostas envelopadas em "dados", padrão usado por outros módulos.
  const payload = resultado.dados ?? resultado;
  const lista = payload[chave];
  if (!Array.isArray(lista)) throw new Error(`A API não retornou uma lista válida de ${chave}.`);
  return lista as T[];
}

function numero(valor: string | number | null | undefined): number {
  const convertido = Number(valor ?? 0);
  return Number.isFinite(convertido) ? convertido : 0;
}

function formatarQuantidade(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

function formatarData(valor: string | null | undefined): string {
  if (!valor) return "—";
  const data = new Date(valor.replace(" ", "T"));
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function localAtivo(valor: LocalEstoque["ativo"]): boolean {
  return valor === true || valor === 1 || valor === "1" || valor === "true";
}

function nomeTipoMovimento(tipo: string | null | undefined): string {
  if (!tipo) return "Movimentação";
  return tipo.replace(/[_-]+/g, " ").toLocaleLowerCase("pt-BR")
    .replace(/\b\p{L}/gu, (letra) => letra.toLocaleUpperCase("pt-BR"));
}

export default function EstoquePage() {
  const [locais, setLocais] = useState<LocalEstoque[]>([]);
  const [saldos, setSaldos] = useState<SaldoEstoque[]>([]);
  const [reservas, setReservas] = useState<ReservaEstoque[]>([]);
  const [movimentos, setMovimentos] = useState<MovimentoEstoque[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);
  const [avisos, setAvisos] = useState<string[]>([]);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setAvisos([]);

    const consultas = await Promise.all([
      buscarLista<LocalEstoque>(ROTAS.ESTOQUE.PAINEL.LOCAIS.LISTAR, "locais")
        .then((dados): ResultadoLista<LocalEstoque> => ({ dados }))
        .catch((erro: unknown): ResultadoLista<LocalEstoque> => ({ erro: erro instanceof Error ? erro.message : "Falha ao consultar locais." })),
      buscarLista<SaldoEstoque>(ROTAS.ESTOQUE.PAINEL.SALDOS.LISTAR, "saldos")
        .then((dados): ResultadoLista<SaldoEstoque> => ({ dados }))
        .catch((erro: unknown): ResultadoLista<SaldoEstoque> => ({ erro: erro instanceof Error ? erro.message : "Falha ao consultar saldos." })),
      buscarLista<ReservaEstoque>(ROTAS.ESTOQUE.PAINEL.RESERVAS.LISTAR, "reservas")
        .then((dados): ResultadoLista<ReservaEstoque> => ({ dados }))
        .catch((erro: unknown): ResultadoLista<ReservaEstoque> => ({ erro: erro instanceof Error ? erro.message : "Falha ao consultar reservas." })),
      buscarLista<MovimentoEstoque>(ROTAS.ESTOQUE.PAINEL.MOVIMENTOS.LISTAR, "movimentos")
        .then((dados): ResultadoLista<MovimentoEstoque> => ({ dados }))
        .catch((erro: unknown): ResultadoLista<MovimentoEstoque> => ({ erro: erro instanceof Error ? erro.message : "Falha ao consultar movimentações." })),
    ]);

    const aplicar = <T,>(resultado: ResultadoLista<T>, atualizar: (dados: T[]) => void) => {
      if ("dados" in resultado) atualizar(resultado.dados);
    };
    aplicar(consultas[0], setLocais);
    aplicar(consultas[1], setSaldos);
    aplicar(consultas[2], setReservas);
    aplicar(consultas[3], setMovimentos);
    setAvisos(Array.from(new Set(consultas.filter((r): r is { erro: string } => "erro" in r).map((r) => r.erro))));
    setAtualizadoEm(new Date());
    setCarregando(false);
  }, []);

  useEffect(() => { void carregarDados(); }, [carregarDados]);

  const indicadores = useMemo(() => {
    const quantidadeTotal = saldos.reduce((soma, item) => soma + numero(item.quantidade), 0);
    const quantidadeReservada = saldos.reduce((soma, item) => soma + numero(item.reservado), 0);
    return {
      locaisAtivos: locais.filter((local) => localAtivo(local.ativo)).length,
      quantidadeTotal,
      quantidadeReservada,
      quantidadeDisponivel: quantidadeTotal - quantidadeReservada,
      itensSemDisponibilidade: saldos.filter((item) => numero(item.quantidade) - numero(item.reservado) <= 0).length,
    };
  }, [locais, saldos]);

  const movimentosRecentes = useMemo(() => [...movimentos]
    .sort((a, b) => {
      const dataA = a.criado_em ? new Date(a.criado_em.replace(" ", "T")).getTime() : 0;
      const dataB = b.criado_em ? new Date(b.criado_em.replace(" ", "T")).getTime() : 0;
      return dataB - dataA;
    }).slice(0, 6), [movimentos]);

  return (
    <main className="estoque-home">
      <div className="estoque-home__container">
        <nav className="estoque-home__breadcrumb" aria-label="Caminho de navegação">
          <Link href={ROTAS.PAINEL.INICIO}>Painel</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Estoque</span>
        </nav>

        <header className="estoque-home__cabecalho">
          <div className="estoque-home__cabecalho-texto">
            <span className="estoque-home__sobretitulo"><span className="estoque-home__ponto" /> CONTROLE E OPERAÇÃO</span>
            <h1>Estoque</h1>
            <p>Acompanhe os locais, os saldos disponíveis, as reservas e o histórico de movimentações da operação.</p>
          </div>
          <button className="estoque-home__botao-atualizar" type="button" onClick={() => void carregarDados()} disabled={carregando}>
            <RefreshCw size={17} className={carregando ? "estoque-home__girando" : ""} />
            {carregando ? "Atualizando..." : "Atualizar dados"}
          </button>
        </header>

        <section className="estoque-home__destaque" aria-label="Resumo do módulo de estoque">
          <div className="estoque-home__destaque-icone"><Warehouse size={27} strokeWidth={1.8} /></div>
          <div className="estoque-home__destaque-texto">
            <span>VISÃO OPERACIONAL</span>
            <h2>Seu estoque em um só lugar</h2>
            <p>Consulte os saldos por local, acompanhe reservas e mantenha o histórico de entradas e saídas organizado.</p>
          </div>
          <div className="estoque-home__destaque-status">
            <span className="estoque-home__status-ponto" />
            {carregando ? "Sincronizando" : avisos.length ? "Dados parciais" : "Painel atualizado"}
          </div>
        </section>

        {avisos.length > 0 && (
          <div className="estoque-home__aviso" role="status">
            <AlertCircle size={19} />
            <div><strong>Algumas informações não puderam ser carregadas.</strong><p>{avisos.join(" ")}</p></div>
          </div>
        )}

        <section className="estoque-home__secao" aria-labelledby="estoque-indicadores-titulo">
          <div className="estoque-home__secao-cabecalho">
            <div><span className="estoque-home__rotulo">ACOMPANHAMENTO</span><h2 id="estoque-indicadores-titulo">Indicadores do estoque</h2></div>
            {atualizadoEm && <span className="estoque-home__ultima-atualizacao"><Clock3 size={14} /> Atualizado às {atualizadoEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>}
          </div>

          <div className="estoque-home__indicadores">
            <article className="estoque-home__indicador">
              <div className="estoque-home__indicador-topo"><span className="estoque-home__indicador-icone estoque-home__indicador-icone--vinho"><Building2 size={19} /></span><span className="estoque-home__indicador-legenda">ESTRUTURA</span></div>
              <strong>{carregando ? "—" : locais.length}</strong>
              <span className="estoque-home__indicador-titulo">Locais cadastrados</span>
              <small>{carregando ? "Consultando locais" : `${indicadores.locaisAtivos} locais ativos`}</small>
            </article>

            <article className="estoque-home__indicador">
              <div className="estoque-home__indicador-topo"><span className="estoque-home__indicador-icone estoque-home__indicador-icone--rosa"><Boxes size={19} /></span><span className="estoque-home__indicador-legenda">CATÁLOGO</span></div>
              <strong>{carregando ? "—" : saldos.length}</strong>
              <span className="estoque-home__indicador-titulo">Registros de saldo</span>
              <small>{carregando ? "Consultando saldos" : `${indicadores.itensSemDisponibilidade} sem disponibilidade`}</small>
            </article>

            <article className="estoque-home__indicador estoque-home__indicador--destaque">
              <div className="estoque-home__indicador-topo"><span className="estoque-home__indicador-icone estoque-home__indicador-icone--verde"><PackageCheck size={19} /></span><span className="estoque-home__indicador-legenda">DISPONIBILIDADE</span></div>
              <strong>{carregando ? "—" : formatarQuantidade(indicadores.quantidadeDisponivel)}</strong>
              <span className="estoque-home__indicador-titulo">Quantidade disponível</span>
              <small>Quantidade total menos o reservado</small>
            </article>

            <article className="estoque-home__indicador">
              <div className="estoque-home__indicador-topo"><span className="estoque-home__indicador-icone estoque-home__indicador-icone--azul"><ClipboardList size={19} /></span><span className="estoque-home__indicador-legenda">RESERVAS</span></div>
              <strong>{carregando ? "—" : reservas.length}</strong>
              <span className="estoque-home__indicador-titulo">Reservas registradas</span>
              <small>{carregando ? "Consultando reservas" : `${formatarQuantidade(indicadores.quantidadeReservada)} unidades reservadas`}</small>
            </article>
          </div>
        </section>

        <section className="estoque-home__secao" aria-labelledby="estoque-acessos-titulo">
          <div className="estoque-home__secao-cabecalho">
            <div><span className="estoque-home__rotulo">ÁREAS DO MÓDULO</span><h2 id="estoque-acessos-titulo">Acessos rápidos</h2><p>Entre diretamente na área que deseja administrar.</p></div>
          </div>

          <div className="estoque-home__atalhos">
            <Link className="estoque-home__atalho" href={ROTAS.PAGINAS.PAINEL.ESTOQUE.LOCAIS}>
              <span className="estoque-home__atalho-icone"><Building2 size={21} /></span>
              <span className="estoque-home__atalho-conteudo"><strong>Locais de estoque</strong><small>Cadastre e organize depósitos e locais.</small></span><ArrowRight size={18} />
            </Link>
            <Link className="estoque-home__atalho" href={ROTAS.PAGINAS.PAINEL.ESTOQUE.SALDOS}>
              <span className="estoque-home__atalho-icone"><Package size={21} /></span>
              <span className="estoque-home__atalho-conteudo"><strong>Saldos</strong><small>Consulte quantidades e disponibilidade.</small></span><ArrowRight size={18} />
            </Link>
            <Link className="estoque-home__atalho" href={ROTAS.PAGINAS.PAINEL.ESTOQUE.RESERVAS}>
              <span className="estoque-home__atalho-icone"><ClipboardList size={21} /></span>
              <span className="estoque-home__atalho-conteudo"><strong>Reservas</strong><small>Acompanhe itens reservados para pedidos.</small></span><ArrowRight size={18} />
            </Link>
            <Link className="estoque-home__atalho" href={ROTAS.PAGINAS.PAINEL.ESTOQUE.MOVIMENTOS}>
              <span className="estoque-home__atalho-icone"><ArrowLeftRight size={21} /></span>
              <span className="estoque-home__atalho-conteudo"><strong>Movimentações</strong><small>Consulte o histórico de entradas e saídas.</small></span><ArrowRight size={18} />
            </Link>
          </div>
        </section>

        <section className="estoque-home__secao" aria-labelledby="estoque-movimentos-titulo">
          <div className="estoque-home__secao-cabecalho">
            <div><span className="estoque-home__rotulo">HISTÓRICO</span><h2 id="estoque-movimentos-titulo">Movimentações recentes</h2><p>Últimos registros retornados pelo controle de estoque.</p></div>
            <Link className="estoque-home__link-ver-todos" href={ROTAS.PAGINAS.PAINEL.ESTOQUE.MOVIMENTOS}>Ver todas <ArrowRight size={16} /></Link>
          </div>

          <div className="estoque-home__tabela-wrap">
            <table className="estoque-home__tabela">
              <thead><tr><th>Movimentação</th><th>Produto</th><th>Local</th><th>Quantidade</th><th>Data</th></tr></thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={5} className="estoque-home__estado-tabela"><RefreshCw size={17} className="estoque-home__girando" /> Carregando movimentações...</td></tr>
                ) : movimentosRecentes.length === 0 ? (
                  <tr><td colSpan={5} className="estoque-home__estado-tabela"><Activity size={20} /><span>Nenhuma movimentação encontrada.</span></td></tr>
                ) : movimentosRecentes.map((movimento, indice) => {
                  const tipo = String(movimento.tipo ?? "").toLocaleLowerCase("pt-BR");
                  const ehEntrada = tipo.includes("entrada") || tipo === "in";
                  const IconeMovimento = ehEntrada ? ArrowDownToLine : ArrowUpFromLine;
                  return (
                    <tr key={movimento.id_movimento ?? `${movimento.produto_id}-${indice}`}>
                      <td><span className={`estoque-home__tipo ${ehEntrada ? "estoque-home__tipo--entrada" : "estoque-home__tipo--saida"}`}><IconeMovimento size={15} />{nomeTipoMovimento(movimento.tipo)}</span></td>
                      <td>#{movimento.produto_id ?? "—"}</td>
                      <td>#{movimento.estoque_local_id ?? "—"}</td>
                      <td className="estoque-home__quantidade-tabela">{formatarQuantidade(numero(movimento.quantidade))}</td>
                      <td>{formatarData(movimento.criado_em)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="estoque-home__rodape">
          <span><PackageCheck size={16} /> Controle integrado de estoque</span>
          <span>UNIVERSO IMPÉRIO V3</span>
        </footer>
      </div>

      <style jsx>{`
        .estoque-home, .estoque-home * { box-sizing: border-box; }
        .estoque-home {
          width: 100%; min-width: 0; min-height: 75vh;
          padding: clamp(22px, 3vw, 42px) var(--ui-espaco-lateral, 24px) 64px;
          color: var(--ui-texto); font-family: var(--ui-fonte-base);
          background: radial-gradient(circle at 92% 0%, var(--ui-borda-suave), transparent 27rem), var(--ui-fundo);
        }
        .estoque-home__container { width: min(100%, var(--ui-largura-maxima, 1440px)); margin-inline: auto; }
        .estoque-home__breadcrumb { display: flex; align-items: center; gap: 10px; margin-bottom: 25px; color: var(--ui-texto-claro); font-size: var(--ui-texto-xs, .75rem); }
        .estoque-home__breadcrumb a { color: var(--ui-vinho); text-decoration: none; transition: color var(--ui-transicao-rapida, 150ms ease); }
        .estoque-home__breadcrumb a:hover { color: var(--ui-vinho-escuro); }
        .estoque-home__cabecalho { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 27px; }
        .estoque-home__cabecalho-texto { max-width: 760px; min-width: 0; }
        .estoque-home__sobretitulo, .estoque-home__rotulo { color: var(--ui-rosa); font-size: .68rem; font-weight: 800; letter-spacing: .17em; }
        .estoque-home__sobretitulo { display: inline-flex; align-items: center; gap: 9px; }
        .estoque-home__ponto, .estoque-home__status-ponto { width: 7px; height: 7px; flex: 0 0 7px; border-radius: 50%; background: var(--ui-rosa); }
        .estoque-home__cabecalho h1 { margin: 8px 0 7px; color: var(--ui-vinho-escuro); font-family: var(--ui-fonte-titulo, inherit); font-size: clamp(2.15rem, 4vw, 3.2rem); font-weight: 800; letter-spacing: -.055em; line-height: 1.06; }
        .estoque-home__cabecalho p { max-width: 680px; margin: 0; color: var(--ui-texto-secundario); font-size: .94rem; line-height: 1.7; }
        .estoque-home__botao-atualizar { display: inline-flex; min-height: 44px; flex: 0 0 auto; align-items: center; justify-content: center; gap: 9px; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-md, 12px); padding: 0 16px; color: var(--ui-vinho); background: var(--ui-superficie); box-shadow: var(--ui-sombra-suave); font: inherit; font-size: .8rem; font-weight: 750; cursor: pointer; transition: transform var(--ui-transicao-padrao, 220ms ease), border-color var(--ui-transicao-padrao, 220ms ease), box-shadow var(--ui-transicao-padrao, 220ms ease); }
        .estoque-home__botao-atualizar:hover:not(:disabled) { transform: translateY(-2px); border-color: var(--ui-rosa-medio); box-shadow: var(--ui-sombra-card); }
        .estoque-home__botao-atualizar:disabled { opacity: .7; cursor: wait; }
        .estoque-home__destaque { position: relative; display: flex; align-items: center; gap: 19px; overflow: hidden; margin-bottom: 38px; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-xl, 24px); padding: clamp(20px, 2.5vw, 29px); background: linear-gradient(112deg, var(--ui-superficie), var(--ui-superficie-suave)); box-shadow: var(--ui-sombra-suave); }
        .estoque-home__destaque::after { position: absolute; top: -75px; right: 13%; width: 230px; height: 230px; border: 1px solid var(--ui-borda-suave); border-radius: 50%; content: ""; pointer-events: none; }
        .estoque-home__destaque-icone { z-index: 1; display: grid; width: 58px; height: 58px; flex: 0 0 58px; place-items: center; border-radius: var(--ui-raio-lg, 18px); color: var(--ui-branco); background: var(--ui-vinho); box-shadow: 0 9px 21px color-mix(in srgb, var(--ui-vinho) 20%, transparent); }
        .estoque-home__destaque-texto { z-index: 1; min-width: 0; flex: 1; }
        .estoque-home__destaque-texto > span { color: var(--ui-rosa); font-size: .62rem; font-weight: 850; letter-spacing: .15em; }
        .estoque-home__destaque-texto h2 { margin: 4px 0 5px; color: var(--ui-vinho-escuro); font-size: clamp(1.15rem, 2vw, 1.4rem); font-weight: 800; letter-spacing: -.03em; }
        .estoque-home__destaque-texto p { max-width: 750px; margin: 0; color: var(--ui-texto-secundario); font-size: .82rem; line-height: 1.55; }
        .estoque-home__destaque-status { z-index: 1; display: inline-flex; flex: 0 0 auto; align-items: center; gap: 8px; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-pilula, 999px); padding: 8px 12px; color: var(--ui-vinho-suave); background: var(--ui-branco); font-size: .68rem; font-weight: 750; }
        .estoque-home__status-ponto { background: var(--ui-sucesso); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ui-sucesso) 12%, transparent); }
        .estoque-home__aviso { display: flex; align-items: flex-start; gap: 12px; margin: -14px 0 30px; border: 1px solid color-mix(in srgb, var(--ui-alerta) 28%, var(--ui-borda)); border-radius: var(--ui-raio-md, 12px); padding: 14px 16px; color: var(--ui-alerta); background: color-mix(in srgb, var(--ui-alerta) 6%, var(--ui-branco)); }
        .estoque-home__aviso svg { flex: 0 0 auto; margin-top: 1px; }
        .estoque-home__aviso strong { display: block; margin-bottom: 3px; font-size: .8rem; }
        .estoque-home__aviso p { margin: 0; font-size: .75rem; line-height: 1.55; }
        .estoque-home__secao { margin-top: 38px; }
        .estoque-home__secao-cabecalho { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 17px; }
        .estoque-home__secao-cabecalho h2 { margin: 5px 0 0; color: var(--ui-vinho-escuro); font-size: clamp(1.28rem, 2vw, 1.55rem); font-weight: 800; letter-spacing: -.04em; }
        .estoque-home__secao-cabecalho p { margin: 5px 0 0; color: var(--ui-texto-secundario); font-size: .8rem; line-height: 1.55; }
        .estoque-home__ultima-atualizacao { display: inline-flex; align-items: center; gap: 6px; color: var(--ui-texto-claro); font-size: .72rem; white-space: nowrap; }
        .estoque-home__indicadores { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 15px; }
        .estoque-home__indicador { min-width: 0; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-lg, 18px); padding: 19px 19px 17px; background: var(--ui-superficie); box-shadow: var(--ui-sombra-suave); transition: transform var(--ui-transicao-padrao, 220ms ease), box-shadow var(--ui-transicao-padrao, 220ms ease); }
        .estoque-home__indicador:hover { transform: translateY(-3px); box-shadow: var(--ui-sombra-card); }
        .estoque-home__indicador--destaque { border-color: color-mix(in srgb, var(--ui-sucesso) 25%, var(--ui-borda)); background: linear-gradient(145deg, var(--ui-superficie), color-mix(in srgb, var(--ui-sucesso) 5%, var(--ui-branco))); }
        .estoque-home__indicador-topo { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 18px; }
        .estoque-home__indicador-icone { display: grid; width: 39px; height: 39px; flex: 0 0 39px; place-items: center; border-radius: var(--ui-raio-md, 12px); }
        .estoque-home__indicador-icone--vinho { color: var(--ui-vinho); background: var(--ui-blush); }
        .estoque-home__indicador-icone--rosa { color: var(--ui-rosa); background: var(--ui-rosa-claro); }
        .estoque-home__indicador-icone--verde { color: var(--ui-sucesso); background: color-mix(in srgb, var(--ui-sucesso) 11%, var(--ui-branco)); }
        .estoque-home__indicador-icone--azul { color: var(--ui-info); background: color-mix(in srgb, var(--ui-info) 10%, var(--ui-branco)); }
        .estoque-home__indicador-legenda { color: var(--ui-texto-claro); font-size: .58rem; font-weight: 850; letter-spacing: .12em; text-align: right; }
        .estoque-home__indicador > strong { display: block; overflow: hidden; color: var(--ui-vinho-escuro); font-size: clamp(1.65rem, 2.4vw, 2.15rem); font-weight: 850; letter-spacing: -.055em; line-height: 1.1; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .estoque-home__indicador-titulo { display: block; margin-top: 6px; color: var(--ui-texto); font-size: .78rem; font-weight: 750; }
        .estoque-home__indicador small { display: block; margin-top: 5px; color: var(--ui-texto-secundario); font-size: .68rem; line-height: 1.45; }
        .estoque-home__atalhos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
        .estoque-home__atalho { display: flex; min-width: 0; align-items: center; gap: 14px; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-lg, 18px); padding: 17px 18px; color: inherit; background: var(--ui-superficie); box-shadow: var(--ui-sombra-suave); text-decoration: none; transition: transform var(--ui-transicao-padrao, 220ms ease), border-color var(--ui-transicao-padrao, 220ms ease), box-shadow var(--ui-transicao-padrao, 220ms ease); }
        .estoque-home__atalho:hover { transform: translateY(-2px); border-color: var(--ui-rosa-medio); box-shadow: var(--ui-sombra-card); }
        .estoque-home__atalho-icone { display: grid; width: 44px; height: 44px; flex: 0 0 44px; place-items: center; border-radius: var(--ui-raio-md, 12px); color: var(--ui-vinho); background: var(--ui-blush); }
        .estoque-home__atalho-conteudo { min-width: 0; flex: 1; }
        .estoque-home__atalho-conteudo strong, .estoque-home__atalho-conteudo small { display: block; }
        .estoque-home__atalho-conteudo strong { color: var(--ui-vinho-escuro); font-size: .83rem; font-weight: 800; }
        .estoque-home__atalho-conteudo small { margin-top: 4px; color: var(--ui-texto-secundario); font-size: .7rem; line-height: 1.45; }
        .estoque-home__atalho > svg { flex: 0 0 auto; color: var(--ui-rosa); transition: transform var(--ui-transicao-rapida, 150ms ease); }
        .estoque-home__atalho:hover > svg { transform: translateX(3px); }
        .estoque-home__link-ver-todos { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 6px; padding-bottom: 3px; color: var(--ui-vinho); font-size: .76rem; font-weight: 800; text-decoration: none; }
        .estoque-home__link-ver-todos:hover { color: var(--ui-rosa); }
        .estoque-home__tabela-wrap { overflow-x: auto; border: 1px solid var(--ui-borda); border-radius: var(--ui-raio-lg, 18px); background: var(--ui-superficie); box-shadow: var(--ui-sombra-suave); }
        .estoque-home__tabela { width: 100%; min-width: 680px; border-collapse: collapse; text-align: left; }
        .estoque-home__tabela th { padding: 14px 17px; color: var(--ui-texto-claro); background: var(--ui-superficie-suave); font-size: .61rem; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; white-space: nowrap; }
        .estoque-home__tabela td { border-top: 1px solid var(--ui-borda-suave); padding: 14px 17px; color: var(--ui-texto-secundario); font-size: .74rem; white-space: nowrap; }
        .estoque-home__tabela tbody tr:hover { background: var(--ui-superficie-suave); }
        .estoque-home__tipo { display: inline-flex; align-items: center; gap: 7px; border-radius: var(--ui-raio-pilula, 999px); padding: 6px 9px; font-size: .67rem; font-weight: 800; }
        .estoque-home__tipo--entrada { color: var(--ui-sucesso); background: color-mix(in srgb, var(--ui-sucesso) 10%, var(--ui-branco)); }
        .estoque-home__tipo--saida { color: var(--ui-alerta); background: color-mix(in srgb, var(--ui-alerta) 10%, var(--ui-branco)); }
        .estoque-home__quantidade-tabela { color: var(--ui-vinho-escuro) !important; font-weight: 800; font-variant-numeric: tabular-nums; }
        .estoque-home__estado-tabela { height: 100px; text-align: center !important; color: var(--ui-texto-claro) !important; }
        .estoque-home__estado-tabela svg { display: inline-block; margin-right: 7px; vertical-align: middle; }
        .estoque-home__rodape { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 36px; border-top: 1px solid var(--ui-borda); padding-top: 17px; color: var(--ui-texto-claro); font-size: .64rem; font-weight: 750; letter-spacing: .08em; }
        .estoque-home__rodape span:first-child { display: inline-flex; align-items: center; gap: 7px; color: var(--ui-vinho-suave); letter-spacing: 0; }
        .estoque-home__girando { animation: estoque-girar 1s linear infinite; }
        @keyframes estoque-girar { to { transform: rotate(360deg); } }
        @media (max-width: 1100px) { .estoque-home__indicadores { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 760px) {
          .estoque-home { padding-inline: max(15px, env(safe-area-inset-left, 0px)); }
          .estoque-home__cabecalho { align-items: flex-start; flex-direction: column; gap: 16px; }
          .estoque-home__botao-atualizar { width: 100%; }
          .estoque-home__destaque { align-items: flex-start; flex-wrap: wrap; }
          .estoque-home__destaque-status { margin-left: 77px; }
          .estoque-home__atalhos { grid-template-columns: minmax(0, 1fr); }
          .estoque-home__secao-cabecalho { align-items: flex-start; flex-direction: column; }
          .estoque-home__ultima-atualizacao { white-space: normal; }
        }
        @media (max-width: 480px) {
          .estoque-home__indicadores { grid-template-columns: minmax(0, 1fr); }
          .estoque-home__indicador { padding: 17px; }
          .estoque-home__destaque-status { margin-left: 0; }
          .estoque-home__rodape { align-items: flex-start; flex-direction: column; }
        }
        @media (prefers-reduced-motion: reduce) {
          .estoque-home *, .estoque-home *::before, .estoque-home *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; }
        }
      `}</style>
    </main>
  );
}
