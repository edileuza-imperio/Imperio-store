"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Megaphone,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type TouchEvent,
} from "react";

import conexao from "@/Services/Conexao/Conexao";
import ImagemService from "@/Services/Imagem/ImagemService";
import ROTAS from "@/app/constants/rotas";



// =====================================================
// TIPOS
// =====================================================

interface Campanha {
  id_campanha: number;
  nome: string;
  slug: string;
  descricao?: string | null;
  imagem_url?: string | null;
  inicio_em?: string | null;
  termina_em?: string | null;
  ativo?: boolean | number | string | null;
}

interface RespostaCampanhas {
  sucesso?: boolean;
  mensagem?: string;
  dados?:
    | {
        campanhas?: Campanha[];
        data?: Campanha[];
      }
    | Campanha[];
  data?:
    | Campanha[]
    | {
        campanhas?: Campanha[];
      };
  campanhas?: Campanha[];
}

const INTERVALO_AUTOMATICO = 6500;
const DISTANCIA_MINIMA_GESTO = 45;

// =====================================================
// NORMALIZAÇÃO DA RESPOSTA DA API
// =====================================================

function obterDados(resposta: unknown): unknown {
  if (typeof resposta === "object" && resposta !== null && "data" in resposta) {
    return (resposta as { data?: unknown }).data;
  }

  return resposta;
}

function extrairLista(resposta: unknown): Campanha[] {
  const corpo = obterDados(resposta);

  if (Array.isArray(corpo)) {
    return corpo as Campanha[];
  }

  if (typeof corpo !== "object" || corpo === null) {
    return [];
  }

  const objeto = corpo as Record<string, unknown>;
  const possiveisListas = [
    objeto.dados,
    objeto.data,
    objeto.campanhas,
    objeto.resultado,
    objeto.retorno,
  ];

  for (const item of possiveisListas) {
    if (Array.isArray(item)) {
      return item as Campanha[];
    }

    if (typeof item === "object" && item !== null) {
      const aninhado = item as Record<string, unknown>;

      if (Array.isArray(aninhado.campanhas)) {
        return aninhado.campanhas as Campanha[];
      }

      if (Array.isArray(aninhado.data)) {
        return aninhado.data as Campanha[];
      }

      if (Array.isArray(aninhado.dados)) {
        return aninhado.dados as Campanha[];
      }
    }
  }

  return [];
}

// =====================================================
// UTILITÁRIOS
// =====================================================

function estaAtiva(valor: Campanha["ativo"]): boolean {
  // Mantém compatibilidade com respostas antigas sem o campo ativo.
  if (valor === undefined || valor === null) return true;
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;

  return ["1", "true", "sim", "ativo"].includes(valor.trim().toLowerCase());
}

function resolverImagem(url?: string | null): string {
  if (!url?.trim()) return "";

  try {
    return ImagemService.resolver(url) ?? url;
  } catch {
    return url;
  }
}

function formatarData(data?: string | null): string {
  if (!data?.trim()) return "";

  // Datas sem horário são interpretadas no fuso local.
  const somenteData = data.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

  const valor = somenteData
    ? new Date(
        Number(somenteData[1]),
        Number(somenteData[2]) - 1,
        Number(somenteData[3]),
      )
    : new Date(data);

  if (Number.isNaN(valor.getTime())) return "";

  return valor.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function descreverPeriodo(campanha: Campanha): string {
  const inicio = formatarData(campanha.inicio_em);
  const termino = formatarData(campanha.termina_em);

  if (inicio && termino) return `De ${inicio} até ${termino}`;
  if (termino) return `Válida até ${termino}`;
  if (inicio) return `Início em ${inicio}`;

  return "Consulte as condições da campanha";
}

// =====================================================
// COMPONENTE
// =====================================================

export interface CampanhasProps {
  /** Quando informado, exibe somente a campanha vinculada ao bloco da Home. */
  campanhaId?: number;
  tituloPersonalizado?: string | null;
  descricaoPersonalizada?: string | null;
}

export default function Campanhas({
  campanhaId,
  tituloPersonalizado,
  descricaoPersonalizada,
}: CampanhasProps = {}) {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [interacao, setInteracao] = useState(false);
  const [imagemComErro, setImagemComErro] = useState<number[]>([]);

  const inicioToque = useRef<number | null>(null);

  // ===================================================
  // CARREGAR CAMPANHAS
  // ===================================================

  const carregarCampanhas = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await conexao.get<RespostaCampanhas>(
        ROTAS.CAMPANHAS.LISTAR_PUBLICAS,
      );

      const payload = obterDados(resposta);

      if (
        typeof payload === "object" &&
        payload !== null &&
        "sucesso" in payload &&
        (payload as { sucesso?: boolean }).sucesso === false
      ) {
        throw new Error(
          (payload as { mensagem?: string }).mensagem ||
            "Não foi possível carregar as campanhas.",
        );
      }

      const lista = extrairLista(resposta);
      const ativas = lista
        .filter((campanha) => estaAtiva(campanha.ativo))
        .filter(
          (campanha) =>
            campanhaId === undefined ||
            Number(campanha.id_campanha) === Number(campanhaId),
        );

      setCampanhas(ativas);
      setIndiceAtual(0);
      setImagemComErro([]);
      setPausado(false);
    } catch (error: unknown) {
      console.error("[CAMPANHAS] Erro ao carregar:", error);

      const erroApi = error as {
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
          "Não foi possível carregar as campanhas.",
      );
    } finally {
      setCarregando(false);
    }
  }, [campanhaId]);

  useEffect(() => {
    void carregarCampanhas();
  }, [carregarCampanhas]);

  // ===================================================
  // CONTROLES DO CARROSSEL
  // ===================================================

  const irPara = useCallback(
    (novoIndice: number, pausar = true) => {
      if (campanhas.length < 2) return;

      setIndiceAtual((novoIndice + campanhas.length) % campanhas.length);

      if (pausar) {
        setPausado(true);
      }
    },
    [campanhas.length],
  );

  const anterior = useCallback(() => {
    irPara(indiceAtual - 1);
  }, [indiceAtual, irPara]);

  const proxima = useCallback(() => {
    irPara(indiceAtual + 1);
  }, [indiceAtual, irPara]);

  const tratarTeclado = useCallback(
    (evento: KeyboardEvent<HTMLDivElement>) => {
      if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        anterior();
      }

      if (evento.key === "ArrowRight") {
        evento.preventDefault();
        proxima();
      }
    },
    [anterior, proxima],
  );

  const iniciarToque = (evento: TouchEvent<HTMLDivElement>) => {
    inicioToque.current = evento.touches[0]?.clientX ?? null;
  };

  const finalizarToque = (evento: TouchEvent<HTMLDivElement>) => {
    if (inicioToque.current === null) return;

    const fim = evento.changedTouches[0]?.clientX ?? inicioToque.current;
    const deslocamento = fim - inicioToque.current;

    if (Math.abs(deslocamento) >= DISTANCIA_MINIMA_GESTO) {
      deslocamento < 0 ? proxima() : anterior();
    }

    inicioToque.current = null;
  };

  // ===================================================
  // REPRODUÇÃO AUTOMÁTICA
  // ===================================================

  useEffect(() => {
    if (
      campanhas.length < 2 ||
      pausado ||
      interacao ||
      typeof window === "undefined"
    ) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const temporizador = window.setInterval(() => {
      setIndiceAtual((atual) => (atual + 1) % campanhas.length);
    }, INTERVALO_AUTOMATICO);

    return () => window.clearInterval(temporizador);
  }, [campanhas.length, pausado, interacao]);

  // ===================================================
  // CABEÇALHO
  // ===================================================

  const cabecalho = (
    <header className="campanhas-home__cabecalho">
      <div className="campanhas-home__cabecalho-texto">
        <span className="campanhas-home__sobretitulo">
          <Sparkles size={13} aria-hidden="true" />
          Universo Império
        </span>

        <h2 id="campanhas-titulo">
          {tituloPersonalizado?.trim() || (
            <>
              Campanhas <span>especiais</span>
            </>
          )}
        </h2>

        <p>
          {descricaoPersonalizada?.trim() ||
            "Ofertas e novidades selecionadas para você aproveitar momentos especiais."}
        </p>
      </div>

      {!carregando && !erro && campanhas.length > 0 && (
        <span className="campanhas-home__contador">
          <strong>{String(campanhas.length).padStart(2, "0")}</strong>
          <span>{campanhas.length === 1 ? "campanha" : "campanhas"}</span>
        </span>
      )}
    </header>
  );

  // ===================================================
  // RENDERIZAÇÃO
  // ===================================================

  return (
    <section
      className="campanhas-home"
      aria-labelledby="campanhas-titulo"
      aria-busy={carregando}
    >
      <div className="campanhas-home__container">
        {cabecalho}

        {/* CARREGAMENTO */}

        {carregando && (
          <div className="campanhas-home__loading" role="status">
            <div className="campanhas-home__loading-imagem" />
            <div className="campanhas-home__loading-conteudo">
              <span />
              <span />
              <span />
              <span />
            </div>
            <span className="campanhas-home__sr-only">
              Carregando campanhas...
            </span>
          </div>
        )}

        {/* ERRO */}

        {!carregando && erro && (
          <div className="campanhas-home__estado" role="alert">
            <span className="campanhas-home__estado-icone" aria-hidden="true">
              !
            </span>

            <strong>Não foi possível carregar as campanhas.</strong>
            <p>{erro}</p>

            <button
              type="button"
              className="campanhas-home__tentar"
              onClick={() => void carregarCampanhas()}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* LISTA VAZIA */}

        {!carregando && !erro && campanhas.length === 0 && (
          <div className="campanhas-home__estado">
            <span className="campanhas-home__estado-icone" aria-hidden="true">
              ✧
            </span>

            <strong>Novas campanhas estão a caminho!</strong>
            <p>
              No momento não há campanhas disponíveis. Volte em breve para
              conferir as próximas ofertas.
            </p>
          </div>
        )}

        {/* CARROSSEL DE BANNERS */}

        {!carregando && !erro && campanhas.length > 0 && (
          <div
            className="campanhas-home__carrossel"
            role="region"
            aria-roledescription="carrossel"
            aria-label="Campanhas especiais"
            tabIndex={0}
            onKeyDown={tratarTeclado}
            onMouseEnter={() => setInteracao(true)}
            onMouseLeave={() => setInteracao(false)}
            onFocus={() => setInteracao(true)}
            onBlur={(evento) => {
              const proximoElemento = evento.relatedTarget;

              if (
                !(proximoElemento instanceof Node) ||
                !evento.currentTarget.contains(proximoElemento)
              ) {
                setInteracao(false);
              }
            }}
            onTouchStart={iniciarToque}
            onTouchEnd={finalizarToque}
          >
            <div
              className="campanhas-home__trilho"
              style={
                {
                  transform: `translate3d(-${indiceAtual * 100}%, 0, 0)`,
                } as CSSProperties
              }
            >
              {campanhas.map((campanha, indice) => {
                const imagem = resolverImagem(campanha.imagem_url);
                const imagemFalhou = imagemComErro.includes(
                  campanha.id_campanha,
                );
                const ativa = indice === indiceAtual;

                return (
                  <article
                    className="campanha-destaque"
                    key={campanha.id_campanha}
                    aria-hidden={!ativa}
                    aria-label={`Campanha ${indice + 1} de ${campanhas.length}`}
                  >
                    <div className="campanha-destaque__visual">
                      {imagem && !imagemFalhou ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagem}
                          alt=""
                          loading={indice === 0 ? "eager" : "lazy"}
                          decoding="async"
                          onError={() =>
                            setImagemComErro((atuais) =>
                              atuais.includes(campanha.id_campanha)
                                ? atuais
                                : [...atuais, campanha.id_campanha],
                            )
                          }
                        />
                      ) : (
                        <div className="campanha-destaque__fallback">
                          <span>
                            <Megaphone size={54} />
                          </span>
                          <strong>Universo Império</strong>
                        </div>
                      )}

                      <span className="campanha-destaque__selo">
                        <Sparkles size={14} aria-hidden="true" />
                        Campanha especial
                      </span>
                    </div>

                    <div className="campanha-destaque__conteudo">
                      <span className="campanha-destaque__tag">
                        Destaque da loja
                      </span>

                      <h3>{campanha.nome}</h3>

                      {campanha.descricao?.trim() && (
                        <p className="campanha-destaque__descricao">
                          {campanha.descricao.trim()}
                        </p>
                      )}

                      <div className="campanha-destaque__periodo">
                        <CalendarDays size={17} aria-hidden="true" />
                        <span>{descreverPeriodo(campanha)}</span>
                      </div>

                      <Link
                        href={`/campanhas/${encodeURIComponent(campanha.slug)}`}
                        className="campanha-destaque__botao"
                        tabIndex={ativa ? 0 : -1}
                      >
                        Conferir campanha
                        <ArrowUpRight size={18} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* SETAS */}

            {campanhas.length > 1 && (
              <>
                <button
                  type="button"
                  className="campanhas-home__seta campanhas-home__seta--anterior"
                  onClick={anterior}
                  aria-label="Ver campanha anterior"
                >
                  <ArrowLeft size={20} />
                </button>

                <button
                  type="button"
                  className="campanhas-home__seta campanhas-home__seta--proxima"
                  onClick={proxima}
                  aria-label="Ver próxima campanha"
                >
                  <ArrowRight size={20} />
                </button>
              </>
            )}
          </div>
        )}

        {/* NAVEGAÇÃO E INDICADORES */}

        {!carregando && !erro && campanhas.length > 1 && (
          <div className="campanhas-home__navegacao">
            <div className="campanhas-home__indicadores">
              {campanhas.map((campanha, indice) => (
                <button
                  key={campanha.id_campanha}
                  type="button"
                  className={`campanhas-home__indicador ${
                    indice === indiceAtual ? "ativo" : ""
                  }`}
                  onClick={() => irPara(indice)}
                  aria-label={`Ir para campanha ${indice + 1}: ${campanha.nome}`}
                  aria-current={indice === indiceAtual ? "true" : undefined}
                />
              ))}
            </div>

            <span className="campanhas-home__progresso" aria-live="polite">
              {String(indiceAtual + 1).padStart(2, "0")}
              <span>/</span>
              {String(campanhas.length).padStart(2, "0")}
            </span>

            <button
              type="button"
              className="campanhas-home__play"
              onClick={() => setPausado((atual) => !atual)}
              aria-label={
                pausado
                  ? "Retomar reprodução automática"
                  : "Pausar reprodução automática"
              }
              title={pausado ? "Reproduzir" : "Pausar"}
            >
              {pausado ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        )}

        <p className="campanhas-home__dica">
          {campanhas.length > 1
            ? "Explore nossas campanhas pelas setas ou deslize para o lado."
            : "Confira os detalhes desta campanha especial."}
        </p>
      </div>
    </section>
  );
}
