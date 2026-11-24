"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

// =====================================================
// TIPOS
// =====================================================

type TipoCupom = "percentual" | "valor_fixo" | "frete_gratis";

interface Cupom {
  id_cupom: number;
  codigo: string;
  tipo: TipoCupom;
  valor: number | string;
  valor_minimo?: number | string;
  inicio_em?: string | null;
  termina_em?: string | null;
  ativo: boolean | number | string;
}

interface RespostaApi {
  sucesso?: boolean;
  mensagem?: string;
  dados?:
    | Cupom[]
    | {
        cupons?: Cupom[];
        data?: Cupom[];
      };
  cupons?: Cupom[];
  data?: Cupom[];
}

export interface CuponsPageProps {
  tituloPersonalizado?: string | null;
  descricaoPersonalizada?: string | null;
}

const INTERVALO_CARROSSEL = 5500;

// =====================================================
// DESCRIÇÕES DOS TIPOS
// =====================================================

const DESCRICOES_TIPO: Record<TipoCupom, string> = {
  percentual: "Desconto percentual na sua compra",
  valor_fixo: "Desconto direto no valor do pedido",
  frete_gratis: "Seu pedido com entrega grátis",
};

// =====================================================
// NORMALIZAR RESPOSTA
// =====================================================

function extrairCupons(resposta: RespostaApi | Cupom[]): Cupom[] {
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta.dados)) return resposta.dados;

  if (resposta.dados && Array.isArray(resposta.dados.cupons)) {
    return resposta.dados.cupons;
  }

  if (resposta.dados && Array.isArray(resposta.dados.data)) {
    return resposta.dados.data;
  }

  if (Array.isArray(resposta.cupons)) return resposta.cupons;
  if (Array.isArray(resposta.data)) return resposta.data;

  return [];
}

// =====================================================
// REGRAS DE EXIBIÇÃO
// =====================================================

function cupomEstaAtivo(cupom: Cupom): boolean {
  const ativo = String(cupom.ativo).trim().toLowerCase();

  return (
    cupom.ativo === true ||
    cupom.ativo === 1 ||
    ativo === "1" ||
    ativo === "true" ||
    ativo === "sim" ||
    ativo === "ativo"
  );
}

function converterData(
  data?: string | null,
  finalDoDia = false,
): number | null {
  if (!data?.trim()) return null;

  const valor = data.trim();
  const somenteData = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  let timestamp: number;

  if (somenteData) {
    const [, ano, mes, dia] = somenteData;

    timestamp = new Date(
      Number(ano),
      Number(mes) - 1,
      Number(dia),
      finalDoDia ? 23 : 0,
      finalDoDia ? 59 : 0,
      finalDoDia ? 59 : 0,
      finalDoDia ? 999 : 0,
    ).getTime();
  } else {
    timestamp = new Date(valor.replace(" ", "T")).getTime();
  }

  return Number.isNaN(timestamp) ? null : timestamp;
}

function cupomEstaNoPrazo(cupom: Cupom): boolean {
  const agora = Date.now();
  const inicio = converterData(cupom.inicio_em);
  const fim = converterData(cupom.termina_em, true);

  return (inicio === null || inicio <= agora) && (fim === null || fim >= agora);
}

function formatarData(data?: string | null): string | null {
  const timestamp = converterData(data, true);

  if (timestamp === null) return null;

  return new Date(timestamp).toLocaleDateString("pt-BR");
}

function formatarMoeda(valor: number | string): string {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) return "R$ 0,00";

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function descricaoDesconto(cupom: Cupom): string {
  const valor = Number(cupom.valor);

  if (cupom.tipo === "frete_gratis") {
    return "Frete grátis";
  }

  if (!Number.isFinite(valor)) {
    return "Oferta especial";
  }

  if (cupom.tipo === "percentual") {
    return `${valor.toLocaleString("pt-BR", {
      maximumFractionDigits: 2,
    })}% OFF`;
  }

  return `${formatarMoeda(valor)} OFF`;
}

function descricaoTipo(cupom: Cupom): string {
  return DESCRICOES_TIPO[cupom.tipo] ?? "Benefício especial para sua compra";
}

// =====================================================
// COMPONENTE
// =====================================================

export default function CuponsPage({
  tituloPersonalizado,
  descricaoPersonalizada,
}: CuponsPageProps) {
  const [cupons, setCupons] = useState<Cupom[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState("");
  const [mensagemCopia, setMensagemCopia] = useState("");
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [reproducaoAtiva, setReproducaoAtiva] = useState(true);
  const [interacaoAtiva, setInteracaoAtiva] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const trilhoRef = useRef<HTMLDivElement>(null);
  const indiceRef = useRef(0);
  const timeoutCopiaRef = useRef<number | null>(null);

  const titulo = tituloPersonalizado?.trim() ?? "";
  const descricao = descricaoPersonalizada?.trim() ?? "";

  // ===================================================
  // BUSCAR CUPONS
  // ===================================================

  useEffect(() => {
    const controller = new AbortController();

    async function carregarCupons() {
      setCarregando(true);
      setErro("");

      try {
        const resposta = await conexao.get<RespostaApi | Cupom[]>(
          ROTAS.CUPONS.LISTAR_PUBLICOS,
          {
            signal: controller.signal,
          },
        );

        if (controller.signal.aborted) return;

        const payload = resposta.data;

        if (
          !Array.isArray(payload) &&
          payload &&
          "sucesso" in payload &&
          payload.sucesso === false
        ) {
          throw new Error(
            payload.mensagem || "Não foi possível carregar os cupons.",
          );
        }

        const lista = extrairCupons(payload);

        const disponiveis = lista.filter(
          (cupom) => cupomEstaAtivo(cupom) && cupomEstaNoPrazo(cupom),
        );

        setCupons(disponiveis);
        setIndiceAtual(0);
        indiceRef.current = 0;
        setReproducaoAtiva(true);
      } catch (falha: unknown) {
        if (controller.signal.aborted) return;

        console.error("[CUPONS] Erro ao carregar:", falha);

        const erroApi = falha as {
          response?: {
            data?: {
              mensagem?: string;
              message?: string;
            };
          };
          message?: string;
        };

        setErro(
          erroApi.response?.data?.mensagem ||
            erroApi.response?.data?.message ||
            erroApi.message ||
            "Não foi possível carregar os cupons agora.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    void carregarCupons();

    return () => {
      controller.abort();

      if (timeoutCopiaRef.current !== null) {
        window.clearTimeout(timeoutCopiaRef.current);
      }
    };
  }, [tentativa]);

  // ===================================================
  // COPIAR CÓDIGO
  // ===================================================

  async function copiarCodigo(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);

      setCopiado(codigo);
      setMensagemCopia(`Código ${codigo} copiado com sucesso.`);

      if (timeoutCopiaRef.current !== null) {
        window.clearTimeout(timeoutCopiaRef.current);
      }

      timeoutCopiaRef.current = window.setTimeout(() => {
        setCopiado((atual) => (atual === codigo ? "" : atual));
        setMensagemCopia("");
        timeoutCopiaRef.current = null;
      }, 2200);
    } catch (falha) {
      console.error("[CUPONS] Erro ao copiar:", falha);

      setMensagemCopia(
        "Não foi possível copiar. Selecione o código e copie manualmente.",
      );
    }
  }

  // ===================================================
  // NAVEGAÇÃO DO CARROSSEL
  // ===================================================

  const irParaIndice = useCallback(
    (novoIndice: number) => {
      if (cupons.length === 0) return;

      const indiceSeguro = (novoIndice + cupons.length) % cupons.length;

      const viewport = viewportRef.current;
      const trilho = trilhoRef.current;

      const slide = trilho?.children.item(indiceSeguro) as HTMLElement | null;

      indiceRef.current = indiceSeguro;
      setIndiceAtual(indiceSeguro);

      if (viewport && slide) {
        const distancia =
          slide.getBoundingClientRect().left -
          viewport.getBoundingClientRect().left +
          viewport.scrollLeft;

        const movimentoReduzido = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        viewport.scrollTo({
          left: distancia,
          behavior: movimentoReduzido ? "auto" : "smooth",
        });
      }
    },
    [cupons.length],
  );

  const irAnterior = useCallback(() => {
    setReproducaoAtiva(false);
    irParaIndice(indiceRef.current - 1);
  }, [irParaIndice]);

  const irProximo = useCallback(() => {
    setReproducaoAtiva(false);
    irParaIndice(indiceRef.current + 1);
  }, [irParaIndice]);

  // ===================================================
  // SINCRONIZAR ÍNDICE COM SCROLL
  // ===================================================

  const atualizarIndicePeloScroll = useCallback(() => {
    const viewport = viewportRef.current;
    const trilho = trilhoRef.current;

    if (!viewport || !trilho || trilho.children.length === 0) return;

    const viewportEsquerda = viewport.getBoundingClientRect().left;

    let indiceMaisProximo = 0;
    let menorDistancia = Number.POSITIVE_INFINITY;

    Array.from(trilho.children).forEach((elemento, indice) => {
      const slide = elemento as HTMLElement;

      const distancia = Math.abs(
        slide.getBoundingClientRect().left - viewportEsquerda,
      );

      if (distancia < menorDistancia) {
        menorDistancia = distancia;
        indiceMaisProximo = indice;
      }
    });

    indiceRef.current = indiceMaisProximo;

    setIndiceAtual((atual) =>
      atual === indiceMaisProximo ? atual : indiceMaisProximo,
    );
  }, []);

  // ===================================================
  // NAVEGAÇÃO PELO TECLADO
  // ===================================================

  const tratarTeclado = useCallback(
    (evento: KeyboardEvent<HTMLDivElement>) => {
      if (evento.key === "ArrowRight") {
        evento.preventDefault();
        irProximo();
      }

      if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        irAnterior();
      }
    },
    [irAnterior, irProximo],
  );

  // ===================================================
  // AUTOPLAY
  // ===================================================

  useEffect(() => {
    if (cupons.length < 2 || !reproducaoAtiva || interacaoAtiva) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const intervalo = window.setInterval(() => {
      irParaIndice(indiceRef.current + 1);
    }, INTERVALO_CARROSSEL);

    return () => window.clearInterval(intervalo);
  }, [cupons.length, reproducaoAtiva, interacaoAtiva, irParaIndice]);

  // ===================================================
  // RENDERIZAÇÃO
  // ===================================================

  return (
    <section
      className="ui-cupons"
      aria-label={titulo || "Cupons disponíveis"}
      aria-busy={carregando}
    >
      <div className="ui-cupons__container">
        {/* CABEÇALHO PERSONALIZADO DO BANCO */}

        {(titulo || descricao) && (
          <header className="ui-cupons__intro">
            <div className="ui-cupons__intro-texto">
              {titulo && <h2 id="ui-cupons-titulo">{titulo}</h2>}

              {descricao && <p>{descricao}</p>}
            </div>
          </header>
        )}

        {(titulo || descricao) && (
          <div className="ui-cupons__divisor" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        )}

        {/* CARREGAMENTO */}

        {carregando && (
          <div
            className="ui-cupons__viewport ui-cupons__viewport--carregando"
            role="status"
          >
            <article className="ui-cupom-card ui-cupom-card--skeleton">
              <div className="ui-cupom-card__faixa" aria-hidden="true" />

              <div className="ui-cupom-card__corpo">
                <span className="ui-cupom-skeleton__linha ui-cupom-skeleton__linha--curta" />
                <span className="ui-cupom-skeleton__valor" />
                <span className="ui-cupom-skeleton__linha" />
                <span className="ui-cupom-skeleton__rodape" />
              </div>
            </article>

            <span className="ui-cupons__sr-only">
              Carregando cupons disponíveis...
            </span>
          </div>
        )}

        {/* ERRO */}

        {!carregando && erro && (
          <div
            className="ui-cupons__estado ui-cupons__estado--erro"
            role="alert"
          >
            <span className="ui-cupons__estado-icone" aria-hidden="true">
              !
            </span>

            <strong>Não foi possível carregar as ofertas</strong>

            <p>{erro}</p>

            <button
              type="button"
              className="ui-cupons__botao-tentar"
              onClick={() => setTentativa((atual) => atual + 1)}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* LISTA VAZIA */}

        {!carregando && !erro && cupons.length === 0 && (
          <div className="ui-cupons__estado ui-cupons__estado--vazio">
            <span className="ui-cupons__estado-icone" aria-hidden="true">
              ✦
            </span>

            <strong>Novas vantagens estão a caminho!</strong>

            <p>
              No momento não temos cupons disponíveis. Volte em breve para
              conferir as próximas ofertas.
            </p>
          </div>
        )}

        {/* CARROSSEL DE CUPONS */}

        {!carregando && !erro && cupons.length > 0 && (
          <>
            <div className="ui-cupons__resumo">
              <span>
                {cupons.length === 1
                  ? "1 benefício disponível"
                  : `${cupons.length} benefícios disponíveis`}
              </span>

              <span className="ui-cupons__resumo-detalhe">
                {cupons.length > 1
                  ? "Deslize para conhecer os benefícios"
                  : "Copie seu código e aproveite"}
              </span>
            </div>

            <div
              className="ui-cupons__carrossel"
              onMouseEnter={() => setInteracaoAtiva(true)}
              onMouseLeave={() => setInteracaoAtiva(false)}
              onFocus={() => setInteracaoAtiva(true)}
              onBlur={(evento) => {
                const proximo = evento.relatedTarget;

                if (
                  !(proximo instanceof Node) ||
                  !evento.currentTarget.contains(proximo)
                ) {
                  setInteracaoAtiva(false);
                }
              }}
            >
              <div
                className="ui-cupons__viewport"
                ref={viewportRef}
                onScroll={atualizarIndicePeloScroll}
                onKeyDown={tratarTeclado}
                role="region"
                aria-label="Carrossel de cupons disponíveis"
                aria-roledescription="carrossel"
                tabIndex={0}
              >
                <div className="ui-cupons__trilho" ref={trilhoRef}>
                  {cupons.map((cupom, indice) => {
                    const validade = formatarData(cupom.termina_em);
                    const valorMinimo = Number(cupom.valor_minimo || 0);
                    const freteGratis = cupom.tipo === "frete_gratis";

                    return (
                      <div
                        className="ui-cupons__slide"
                        key={cupom.id_cupom}
                        aria-label={`Cupom ${indice + 1} de ${cupons.length}`}
                        style={
                          {
                            "--cupom-indice": indice,
                          } as CSSProperties
                        }
                      >
                        <article className="ui-cupom-card">
                          <div
                            className="ui-cupom-card__faixa"
                            aria-hidden="true"
                          />

                          <div className="ui-cupom-card__corpo">
                            <div className="ui-cupom-card__topo">
                              <span className="ui-cupom-card__categoria">
                                {freteGratis
                                  ? "Benefício de entrega"
                                  : "Oferta especial"}
                              </span>

                              <span
                                className="ui-cupom-card__icone"
                                aria-hidden="true"
                              >
                                {freteGratis ? "↗" : "%"}
                              </span>
                            </div>

                            <div className="ui-cupom-card__desconto">
                              {descricaoDesconto(cupom)}
                            </div>

                            <p className="ui-cupom-card__descricao">
                              {descricaoTipo(cupom)}
                            </p>

                            <div className="ui-cupom-card__regras">
                              {valorMinimo > 0 && (
                                <span>
                                  Pedido mínimo de {formatarMoeda(valorMinimo)}
                                </span>
                              )}

                              {validade && <span>Válido até {validade}</span>}

                              {valorMinimo <= 0 && !validade && (
                                <span>Consulte as condições no carrinho</span>
                              )}
                            </div>

                            <div className="ui-cupom-card__rodape">
                              <div className="ui-cupom-card__codigo">
                                <small>Seu código</small>
                                <strong>{cupom.codigo}</strong>
                              </div>

                              <button
                                type="button"
                                className={`ui-cupom-card__copiar ${
                                  copiado === cupom.codigo
                                    ? "ui-cupom-card__copiar--copiado"
                                    : ""
                                }`}
                                onClick={() => void copiarCodigo(cupom.codigo)}
                                aria-label={`Copiar código ${cupom.codigo}`}
                              >
                                {copiado === cupom.codigo
                                  ? "Copiado ✓"
                                  : "Copiar código"}
                              </button>
                            </div>
                          </div>

                          <span
                            className="ui-cupom-card__recorte"
                            aria-hidden="true"
                          />
                        </article>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CONTROLES */}

              {cupons.length > 1 && (
                <div className="ui-cupons__controles">
                  <button
                    type="button"
                    className="ui-cupons__seta"
                    onClick={irAnterior}
                    aria-label="Ver cupom anterior"
                  >
                    <span aria-hidden="true">←</span>
                  </button>

                  <div className="ui-cupons__indicadores">
                    {cupons.map((cupom, indice) => (
                      <button
                        key={cupom.id_cupom}
                        type="button"
                        className={`ui-cupons__indicador ${
                          indice === indiceAtual ? "ativo" : ""
                        }`}
                        onClick={() => {
                          setReproducaoAtiva(false);
                          irParaIndice(indice);
                        }}
                        aria-label={`Ir para cupom ${indice + 1}`}
                        aria-current={
                          indice === indiceAtual ? "true" : undefined
                        }
                      />
                    ))}
                  </div>

                  <span className="ui-cupons__progresso" aria-live="polite">
                    {String(indiceAtual + 1).padStart(2, "0")}
                    <span>/</span>
                    {String(cupons.length).padStart(2, "0")}
                  </span>

                  <button
                    type="button"
                    className="ui-cupons__seta"
                    onClick={irProximo}
                    aria-label="Ver próximo cupom"
                  >
                    <span aria-hidden="true">→</span>
                  </button>

                  <button
                    type="button"
                    className="ui-cupons__play"
                    onClick={() => setReproducaoAtiva((atual) => !atual)}
                    aria-label={
                      reproducaoAtiva
                        ? "Pausar passagem automática"
                        : "Retomar passagem automática"
                    }
                    title={reproducaoAtiva ? "Pausar" : "Reproduzir"}
                  >
                    {reproducaoAtiva ? "Ⅱ" : "▶"}
                  </button>
                </div>
              )}

              {cupons.length > 1 && (
                <p className="ui-cupons__dica">
                  Deslize para o lado ou use as setas para ver outros cupons.
                </p>
              )}
            </div>
          </>
        )}

        {/* FEEDBACK DE CÓPIA */}

        {mensagemCopia && (
          <p className="ui-cupons__feedback" role="status">
            {mensagemCopia}
          </p>
        )}

        {/* RODAPÉ INFORMATIVO */}

        <div className="ui-cupons__nota">
          <span className="ui-cupons__nota-icone" aria-hidden="true">
            i
          </span>

          <p>
            Os cupons estão sujeitos às condições de uso, validade e valor
            mínimo informados. A aplicação do benefício é confirmada no
            carrinho.
          </p>
        </div>
      </div>
    </section>
  );
}
