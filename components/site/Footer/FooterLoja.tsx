"use client";

import {
  ArrowUpRight,
  ChevronRight,
  Clock3,
  CreditCard,
  Crown,
  Facebook,
  Instagram,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  Truck,
  Youtube,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";

// =====================================================
// TIPOS
// =====================================================

type ValorBooleano = boolean | number | string;

type RodapeItem = {
  id_rodape_item: number;
  rodape_id: number;
  titulo: string;
  url: string | null;
  icone: string | null;
  ordem: number;
  ativo: ValorBooleano;
};

type Rodape = {
  id_rodape: number;
  nome: string;
  codigo: string;
  ativo: ValorBooleano;
  itens: RodapeItem[];
};

export type FooterSocialLink = {
  nome: string;
  url: string;
  icone: "instagram" | "facebook" | "youtube" | "whatsapp" | "tiktok";
};

type ConfiguracaoRodape = {
  id_rodape_configuracao: number;
  nome: string;
  descricao: string;
  imagem_url: string | null;
  imagem_alt: string | null;
  ativo: ValorBooleano;
};

type RedeSocialApi = FooterSocialLink & {
  id_rodape_rede_social: number;
  ordem: number;
  ativo: ValorBooleano;
};

export type FooterLojaProps = {
  /** Caminho público da imagem da logo. Ex.: /images/logo-universo-imperio.png */
  logoSrc?: string;
  descricao?: string;
  /** Informe apenas redes sociais que realmente existem e possuem URL. */
  redesSociais?: FooterSocialLink[];
  /** Formas de pagamento realmente aceitas pela loja. */
  formasPagamento?: string[];
  /** Nome exibido nos direitos autorais. */
  nomeLoja?: string;
  /** Ano opcional. Por padrão, utiliza o ano atual. */
  ano?: number;
};

const ORDEM_COLUNAS: Record<string, number> = {
  INSTITUCIONAL: 1,
  CATEGORIAS: 2,
  ATENDIMENTO: 3,
};

// =====================================================
// NORMALIZAÇÃO DA RESPOSTA DA API
// O Controller retorna rodapes[] e cada rodapé contém itens[].
// O BaseController pode envolver esses dados em { status, mensagem, dados }.
// =====================================================

function interpretarJson(valor: unknown): any {
  if (typeof valor !== "string") return valor;

  const texto = valor.trim();
  if (!texto) return null;

  // Primeiro tenta interpretar a resposta normalmente.
  try {
    return JSON.parse(texto);
  } catch {
    // Algumas respostas da API estão chegando como JSON seguido de "null".
    // Extraímos apenas o primeiro objeto/array JSON completo para que os
    // dados válidos não sejam descartados por esse conteúdo extra.
  }

  const inicio = texto.search(/[\[{]/);
  if (inicio < 0) return valor;

  const pilha: string[] = [];
  let dentroDeString = false;
  let caractereEscape = false;

  for (let indice = inicio; indice < texto.length; indice += 1) {
    const caractere = texto[indice];

    if (dentroDeString) {
      if (caractereEscape) {
        caractereEscape = false;
      } else if (caractere === "\\") {
        caractereEscape = true;
      } else if (caractere === '"') {
        dentroDeString = false;
      }
      continue;
    }

    if (caractere === '"') {
      dentroDeString = true;
      continue;
    }

    if (caractere === "{" || caractere === "[") {
      pilha.push(caractere);
      continue;
    }

    if (caractere === "}" || caractere === "]") {
      const abertura = pilha.pop();
      const parValido =
        (abertura === "{" && caractere === "}") ||
        (abertura === "[" && caractere === "]");

      if (!parValido) return valor;

      if (pilha.length === 0) {
        const trechoJson = texto.slice(inicio, indice + 1);
        try {
          return JSON.parse(trechoJson);
        } catch {
          return valor;
        }
      }
    }
  }

  return valor;
}

function obterListaRodapes(resposta: unknown): any[] {
  const raiz = interpretarJson(resposta);
  const visitados = new Set<any>();
  const fila: any[] = [raiz];
  const envelopes = ["data", "dados", "resultado", "payload", "body"];

  while (fila.length > 0) {
    const atual = interpretarJson(fila.shift());
    if (atual == null) continue;
    if (Array.isArray(atual)) return atual;
    if (typeof atual !== "object" || visitados.has(atual)) continue;

    visitados.add(atual);
    if (Array.isArray(atual.rodapes)) return atual.rodapes;

    for (const chave of envelopes) {
      if (atual[chave] !== undefined && atual[chave] !== null) {
        fila.push(atual[chave]);
      }
    }
  }

  return [];
}

function obterObjetoConfiguracao(resposta: unknown): any | null {
  const raiz = interpretarJson(resposta);
  const fila: any[] = [raiz];
  const visitados = new Set<any>();
  const envelopes = ["data", "dados", "resultado", "payload", "body"];
  const chavesConfiguracao = [
    "configuracao",
    "configuracao_rodape",
    "rodape_configuracao",
    "configuracoes",
    "footer",
  ];

  while (fila.length > 0) {
    const atual = interpretarJson(fila.shift());
    if (atual == null) continue;

    if (Array.isArray(atual)) {
      const encontrado = atual.find(
        (item) =>
          item &&
          typeof item === "object" &&
          (item.id_rodape_configuracao !== undefined ||
            item.imagem_url !== undefined ||
            item.descricao !== undefined),
      );
      if (encontrado) return encontrado;
      continue;
    }

    if (typeof atual !== "object" || visitados.has(atual)) continue;
    visitados.add(atual);

    for (const chave of chavesConfiguracao) {
      const candidato = atual[chave];
      if (Array.isArray(candidato)) {
        const encontrado = candidato.find(
          (item: any) =>
            item &&
            typeof item === "object" &&
            (item.id_rodape_configuracao !== undefined ||
              item.imagem_url !== undefined ||
              item.descricao !== undefined),
        );
        if (encontrado) return encontrado;
      } else if (candidato && typeof candidato === "object") {
        return candidato;
      }
    }

    const pareceConfiguracao =
      atual.id_rodape_configuracao !== undefined ||
      (atual.nome !== undefined &&
        (atual.descricao !== undefined || atual.imagem_url !== undefined));

    if (pareceConfiguracao) return atual;

    for (const chave of envelopes) {
      if (atual[chave] !== undefined && atual[chave] !== null) {
        fila.push(atual[chave]);
      }
    }
  }

  return null;
}

function obterListaRedesSociais(resposta: unknown): any[] {
  const raiz = interpretarJson(resposta);
  const fila: any[] = [raiz];
  const visitados = new Set<any>();
  const envelopes = ["data", "dados", "resultado", "payload", "body"];
  const chavesLista = [
    "redes_sociais",
    "redesSociais",
    "lista_redes_sociais",
    "redes",
  ];

  while (fila.length > 0) {
    const atual = interpretarJson(fila.shift());
    if (atual == null) continue;
    if (Array.isArray(atual)) return atual;
    if (typeof atual !== "object" || visitados.has(atual)) continue;

    visitados.add(atual);

    for (const chave of chavesLista) {
      if (Array.isArray(atual[chave])) return atual[chave];
    }

    for (const chave of envelopes) {
      if (atual[chave] !== undefined && atual[chave] !== null) {
        fila.push(atual[chave]);
      }
    }
  }

  return [];
}

function normalizarIconeRede(
  icone: unknown,
  nome: unknown,
): FooterSocialLink["icone"] | null {
  const valor = `${String(icone ?? "")} ${String(nome ?? "")}`.toLowerCase();

  if (valor.includes("instagram")) return "instagram";
  if (valor.includes("facebook")) return "facebook";
  if (valor.includes("youtube")) return "youtube";
  if (valor.includes("whatsapp") || valor.includes("whats")) return "whatsapp";
  if (valor.includes("tiktok") || valor.includes("tik tok")) return "tiktok";

  return null;
}

function normalizarConfiguracao(resposta: unknown): ConfiguracaoRodape | null {
  const item = obterObjetoConfiguracao(resposta);
  if (!item || !estaAtivo(item.ativo ?? true)) return null;

  return {
    id_rodape_configuracao: Number(item.id_rodape_configuracao ?? item.id ?? 0),
    nome: String(item.nome ?? ""),
    descricao: String(item.descricao ?? ""),
    imagem_url: item.imagem_url == null ? null : String(item.imagem_url),
    imagem_alt: item.imagem_alt == null ? null : String(item.imagem_alt),
    ativo: item.ativo ?? true,
  };
}

function urlCompativelComRede(
  url: string,
  icone: FooterSocialLink["icone"],
): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    const pertenceAoDominio = (...dominios: string[]) =>
      dominios.some(
        (dominio) => host === dominio || host.endsWith(`.${dominio}`),
      );

    switch (icone) {
      case "instagram":
        return pertenceAoDominio("instagram.com");
      case "facebook":
        return pertenceAoDominio("facebook.com", "fb.com");
      case "youtube":
        return pertenceAoDominio("youtube.com", "youtu.be");
      case "whatsapp":
        return pertenceAoDominio("whatsapp.com", "wa.me");
      case "tiktok":
        return pertenceAoDominio("tiktok.com");
      default:
        return false;
    }
  } catch {
    return false;
  }
}

function normalizarRedeSocial(item: any): RedeSocialApi | null {
  const nome = String(item?.nome ?? "").trim();
  const url = String(item?.url ?? "").trim();
  const icone = normalizarIconeRede(item?.icone, nome);

  if (
    !nome ||
    !url ||
    !icone ||
    !urlCompativelComRede(url, icone) ||
    !estaAtivo(item?.ativo ?? true)
  ) {
    return null;
  }

  return {
    id_rodape_rede_social: Number(item?.id_rodape_rede_social ?? item?.id ?? 0),
    nome,
    url,
    icone,
    ordem: Number(item?.ordem ?? 0),
    ativo: item?.ativo ?? true,
  };
}

function estaAtivo(valor: ValorBooleano | undefined): boolean {
  if (valor === undefined || valor === null) return true;
  return (
    valor === true ||
    valor === 1 ||
    valor === "1" ||
    String(valor).toLowerCase() === "true"
  );
}

function normalizarItem(item: any): RodapeItem {
  return {
    id_rodape_item: Number(item?.id_rodape_item ?? item?.id ?? 0),
    rodape_id: Number(item?.rodape_id ?? 0),
    titulo: String(item?.titulo ?? ""),
    url: item?.url == null ? null : String(item.url),
    icone: item?.icone == null ? null : String(item.icone),
    ordem: Number(item?.ordem ?? 0),
    ativo: item?.ativo ?? true,
  };
}

function normalizarRodape(rodape: any): Rodape {
  const itens = Array.isArray(rodape?.itens)
    ? rodape.itens
        .map(normalizarItem)
        .filter((item: RodapeItem) => estaAtivo(item.ativo))
    : [];

  return {
    id_rodape: Number(rodape?.id_rodape ?? rodape?.id ?? 0),
    nome: String(rodape?.nome ?? ""),
    codigo: String(rodape?.codigo ?? "").toUpperCase(),
    ativo: rodape?.ativo ?? true,
    itens: itens.sort(
      (a: RodapeItem, b: RodapeItem) =>
        a.ordem - b.ordem || a.id_rodape_item - b.id_rodape_item,
    ),
  };
}

function urlExterna(url?: string | null): boolean {
  return Boolean(url && /^https?:\/\//i.test(url));
}

function IconeItem({ nome }: { nome?: string | null }) {
  const icone = String(nome ?? "").toLowerCase();
  const props = { size: 22, strokeWidth: 1.8 };

  if (icone.includes("whatsapp") || icone.includes("message")) {
    return <MessageCircle {...props} />;
  }
  if (icone.includes("mail") || icone.includes("email")) {
    return <Mail {...props} />;
  }
  if (
    icone.includes("clock") ||
    icone.includes("horario") ||
    icone.includes("hora")
  ) {
    return <Clock3 {...props} />;
  }
  return <ChevronRight size={17} strokeWidth={2.4} />;
}

function IconeRede({ icone }: { icone: FooterSocialLink["icone"] }) {
  switch (icone) {
    case "instagram":
      return <Instagram size={22} />;
    case "facebook":
      return <Facebook size={22} />;
    case "youtube":
      return <Youtube size={22} />;
    case "whatsapp":
      return <MessageCircle size={22} />;
    case "tiktok":
      return <span className="loja-footer__icone-tiktok">♪</span>;
    default:
      return null;
  }
}

// =====================================================
// COMPONENTE PÚBLICO
// =====================================================

export default function FooterLoja({
  logoSrc,
  descricao,
  redesSociais,
  formasPagamento = ["Pix", "Visa", "Mastercard", "Elo", "Boleto"],
  nomeLoja,
  ano = new Date().getFullYear(),
}: FooterLojaProps) {
  const [rodapes, setRodapes] = useState<Rodape[]>([]);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoRodape | null>(
    null,
  );
  const [redesSociaisApi, setRedesSociaisApi] = useState<RedeSocialApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  // O endpoint GET /rodapes já retorna, em uma única resposta,
  // rodapes[], configuracao e redes_sociais vindos do banco.
  const carregarDadosPublicos = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(false);

      const resposta = await conexao.get(ROTAS.RODAPES.LISTAR_PUBLICOS);
      const payload = resposta?.data ?? resposta;

      const lista = obterListaRodapes(payload)
        .map(normalizarRodape)
        .filter(
          (rodape: Rodape) => rodape.id_rodape > 0 && estaAtivo(rodape.ativo),
        );

      lista.sort((a: Rodape, b: Rodape) => {
        const ordemA = ORDEM_COLUNAS[a.codigo] ?? 99;
        const ordemB = ORDEM_COLUNAS[b.codigo] ?? 99;
        return ordemA - ordemB || a.id_rodape - b.id_rodape;
      });

      const configuracaoBanco = normalizarConfiguracao(payload);
      const redesBanco = obterListaRedesSociais(payload)
        .map(normalizarRedeSocial)
        .filter((rede: RedeSocialApi | null): rede is RedeSocialApi =>
          Boolean(rede),
        )
        .sort(
          (a, b) =>
            a.ordem - b.ordem ||
            a.id_rodape_rede_social - b.id_rodape_rede_social,
        );

      setRodapes(lista);
      setConfiguracao(configuracaoBanco);
      setRedesSociaisApi(redesBanco);

      // Ajuda a conferir no console do navegador se a API trouxe os dados.
      console.info("[FooterLoja] Dados recebidos da API /rodapes:", {
        totalColunas: lista.length,
        configuracaoEncontrada: Boolean(configuracaoBanco),
        totalRedesSociais: redesBanco.length,
      });

      if (!configuracaoBanco) {
        console.warn(
          "[FooterLoja] A API não retornou uma configuração ativa. Confira se existe um registro ativo em rodape_configuracoes.",
        );
      }
    } catch (error) {
      console.error(
        "[FooterLoja] Não foi possível carregar os dados do banco:",
        error,
      );
      setErro(true);
      setRodapes([]);
      setConfiguracao(null);
      setRedesSociaisApi([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarDadosPublicos();
  }, [carregarDadosPublicos]);

  const nomeLojaExibido = configuracao?.nome || nomeLoja || "Universo Império";
  const descricaoExibida = configuracao?.descricao || descricao || "";
  const logoExibida = configuracao?.imagem_url || logoSrc || undefined;
  const logoAlt = configuracao?.imagem_alt || nomeLojaExibido;
  const redesSociaisExibidas =
    redesSociais && redesSociais.length > 0 ? redesSociais : redesSociaisApi;

  // Mantém visíveis também as colunas ativas que ainda não possuem links.
  const colunas = useMemo(() => rodapes, [rodapes]);
  const colunaAtendimento = colunas.find(
    (rodape) => rodape.codigo === "ATENDIMENTO",
  );
  const outrasColunas = colunas.filter(
    (rodape) => rodape.codigo !== "ATENDIMENTO",
  );

  return (
    <footer className="loja-footer" aria-label={`Rodapé ${nomeLojaExibido}`}>
      <div
        className="loja-footer__ornamento loja-footer__ornamento--superior"
        aria-hidden="true"
      />
      <div className="loja-footer__container">
        <div className="loja-footer__principal">
          {/* MARCA */}
          <section
            className="loja-footer__marca"
            aria-label={`Sobre ${nomeLojaExibido}`}
          >
            <a
              className="loja-footer__logo"
              href="/"
              aria-label={`${nomeLojaExibido} — página inicial`}
            >
              {logoExibida ? (
                <img src={logoExibida} alt={logoAlt} loading="lazy" />
              ) : (
                <span className="loja-footer__logo-fallback">
                  <Crown size={31} strokeWidth={1.5} aria-hidden="true" />
                  <span>UNIVERSO</span>
                  <strong>IMPÉRIO</strong>
                </span>
              )}
            </a>

            {descricaoExibida && (
              <p className="loja-footer__descricao">{descricaoExibida}</p>
            )}

            {redesSociaisExibidas.length > 0 && (
              <nav className="loja-footer__redes" aria-label="Redes sociais">
                {redesSociaisExibidas.map((rede) => (
                  <a
                    key={`${rede.icone}-${rede.url}`}
                    href={rede.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={rede.nome}
                    title={rede.nome}
                  >
                    <IconeRede icone={rede.icone} />
                    <span className="loja-footer__sr-only">{rede.nome}</span>
                  </a>
                ))}
              </nav>
            )}
          </section>

          {/* COLUNAS INSTITUCIONAIS */}
          <div className="loja-footer__colunas" aria-live="polite">
            {carregando ? (
              <div className="loja-footer__estado-carregando" role="status">
                <span className="loja-footer__spinner" aria-hidden="true" />
                Carregando informações da loja...
              </div>
            ) : colunas.length > 0 ? (
              <>
                {outrasColunas.map((rodape) => (
                  <section
                    className="loja-footer__coluna"
                    key={rodape.id_rodape}
                  >
                    <h2>{rodape.nome}</h2>
                    <span
                      className="loja-footer__titulo-linha"
                      aria-hidden="true"
                    />
                    {rodape.itens.length > 0 ? (
                      <ul>
                        {rodape.itens.map((item) => (
                          <li key={item.id_rodape_item}>
                            {item.url ? (
                              <a
                                href={item.url}
                                target={
                                  urlExterna(item.url) ? "_blank" : undefined
                                }
                                rel={
                                  urlExterna(item.url)
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                              >
                                <ChevronRight size={15} aria-hidden="true" />
                                <span>{item.titulo}</span>
                                <ArrowUpRight
                                  className="loja-footer__link-externo"
                                  size={13}
                                  aria-hidden="true"
                                />
                              </a>
                            ) : (
                              <span className="loja-footer__link-sem-url">
                                <ChevronRight size={15} aria-hidden="true" />
                                <span>{item.titulo}</span>
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="loja-footer__vazio">
                        Nenhum link cadastrado.
                      </p>
                    )}
                  </section>
                ))}

                {colunaAtendimento && (
                  <section className="loja-footer__coluna loja-footer__atendimento">
                    <h2>{colunaAtendimento.nome}</h2>
                    <span
                      className="loja-footer__titulo-linha"
                      aria-hidden="true"
                    />
                    {colunaAtendimento.itens.length > 0 ? (
                      <ul>
                        {colunaAtendimento.itens.map((item) => (
                          <li key={item.id_rodape_item}>
                            {item.url ? (
                              <a
                                className="loja-footer__contato"
                                href={item.url}
                                target={
                                  urlExterna(item.url) ? "_blank" : undefined
                                }
                                rel={
                                  urlExterna(item.url)
                                    ? "noopener noreferrer"
                                    : undefined
                                }
                              >
                                <span className="loja-footer__contato-icone">
                                  <IconeItem nome={item.icone} />
                                </span>
                                <span>{item.titulo}</span>
                              </a>
                            ) : (
                              <span className="loja-footer__contato loja-footer__contato--texto">
                                <span className="loja-footer__contato-icone">
                                  <IconeItem nome={item.icone} />
                                </span>
                                <span>{item.titulo}</span>
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="loja-footer__vazio">
                        Nenhuma informação de atendimento cadastrada.
                      </p>
                    )}
                  </section>
                )}
              </>
            ) : (
              <div className="loja-footer__estado-vazio">
                {erro
                  ? "Não foi possível carregar as informações do rodapé."
                  : "As colunas e os links ainda não foram cadastrados."}
              </div>
            )}
          </div>
        </div>

        {/* BENEFÍCIOS E PAGAMENTOS */}
        <section
          className="loja-footer__beneficios"
          aria-label="Informações de compra"
        >
          <div className="loja-footer__pagamentos">
            <div className="loja-footer__beneficio-titulo">
              <span className="loja-footer__beneficio-icone">
                <CreditCard size={18} aria-hidden="true" />
              </span>
              <strong>Formas de pagamento</strong>
            </div>
            <div className="loja-footer__bandeiras">
              {formasPagamento.map((forma) => (
                <span key={forma}>{forma}</span>
              ))}
            </div>
          </div>

          <div className="loja-footer__selos">
            <span className="loja-footer__selo">
              <ShieldCheck size={22} aria-hidden="true" />
              <span>Compra segura</span>
            </span>
            <span className="loja-footer__selo">
              <LockKeyhole size={21} aria-hidden="true" />
              <span>Site protegido</span>
            </span>
            <span className="loja-footer__selo">
              <Truck size={23} aria-hidden="true" />
              <span>Envio para todo o Brasil</span>
            </span>
          </div>
        </section>
      </div>

      {/* DIREITOS AUTORAIS */}
      <div className="loja-footer__base">
        <p>
          © {ano} {nomeLojaExibido}. Todos os direitos reservados.
        </p>
        <span>Feito para tornar cada detalhe especial.</span>
      </div>
    </footer>
  );
}
