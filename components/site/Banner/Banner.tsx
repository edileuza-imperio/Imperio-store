"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";
import ImagemService from "@/Services/Imagem/ImagemService";
import { useEffect, useState } from "react";


interface Banner {
  id_banner: number;
  titulo: string;
  descricao?: string | null;
  imagem_url: string;
  link_url?: string | null;
  posicao?: string | null;
  ordem?: number;
  ativo?: unknown;
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/**
 * Interpreta a resposta do Axios.
 * Também trata respostas JSON com "null" acrescentado ao final.
 */
function interpretarResposta(resposta: unknown): unknown {
  let payload: unknown = resposta;

  // Axios padrão retorna { data: ... }.
  // Também suporta interceptors que entregam o próprio payload.
  if (ehObjeto(payload) && "data" in payload && !("dados" in payload)) {
    payload = payload.data;
  }

  if (typeof payload === "string") {
    const texto = payload.trim();

    try {
      payload = JSON.parse(texto);
    } catch {
      // Recupera o objeto JSON caso exista um "null" indevido no final.
      const inicio = texto.indexOf("{");
      const fim = texto.lastIndexOf("}");

      if (inicio >= 0 && fim > inicio) {
        try {
          payload = JSON.parse(texto.slice(inicio, fim + 1));
        } catch {
          console.error("[BANNER] JSON inválido:", texto);
          return null;
        }
      } else {
        console.error("[BANNER] Resposta sem JSON válido:", texto);
        return null;
      }
    }
  }

  return payload;
}

/**
 * Extrai os banners de:
 * resposta.dados.banners
 */
function extrairBanners(payload: unknown): Banner[] {
  if (!ehObjeto(payload)) return [];

  const dados = payload.dados;
  let lista: unknown[] = [];

  if (Array.isArray(dados)) {
    lista = dados;
  } else if (ehObjeto(dados) && Array.isArray(dados.banners)) {
    lista = dados.banners;
  } else if (Array.isArray(payload.banners)) {
    lista = payload.banners;
  }

  return lista.reduce<Banner[]>((resultado, item) => {
    if (!ehObjeto(item)) return resultado;

    const id = Number(item.id_banner);

    if (
      !Number.isFinite(id) ||
      typeof item.imagem_url !== "string" ||
      !item.imagem_url.trim()
    ) {
      return resultado;
    }

    resultado.push({
      id_banner: id,
      titulo:
        typeof item.titulo === "string" && item.titulo.trim()
          ? item.titulo.trim()
          : "Destaque do Universo Império",
      descricao:
        typeof item.descricao === "string" ? item.descricao.trim() : null,
      imagem_url: item.imagem_url.trim(),
      link_url: typeof item.link_url === "string" ? item.link_url.trim() : null,
      posicao: typeof item.posicao === "string" ? item.posicao : null,
      ordem: Number(item.ordem ?? 0),
      ativo: item.ativo,
    });

    return resultado;
  }, []);
}

/**
 * Verifica se o banner está publicado.
 */
function bannerEstaAtivo(banner: Banner): boolean {
  const ativo = banner.ativo;

  if (ativo === undefined || ativo === null) {
    return true;
  }

  if (typeof ativo === "boolean") {
    return ativo;
  }

  if (typeof ativo === "number") {
    return ativo === 1;
  }

  if (typeof ativo === "string") {
    return ["1", "true", "ativo", "sim"].includes(ativo.trim().toLowerCase());
  }

  return false;
}

/**
 * Não permite que a vitrine direcione visitantes
 * para páginas administrativas.
 */
function linkSeguro(link?: string | null): string | null {
  if (!link?.trim()) return null;

  const valor = link.trim();

  if (valor.startsWith("/") && !valor.startsWith("//")) {
    const caminho = valor.split("?")[0].toLowerCase();

    if (/^\/painel(?:\/|$)/.test(caminho)) {
      return null;
    }

    return valor;
  }

  try {
    const url = new URL(valor);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    if (/^\/painel(?:\/|$)/i.test(url.pathname)) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

export interface BannerPrincipalProps {
  /** ID do banner vinculado ao bloco. Sem ID, mantém o carrossel principal. */
  bannerId?: number;
}

export default function BannerPrincipal({
  bannerId,
}: BannerPrincipalProps = {}) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [pausado, setPausado] = useState(false);
  const [imagensComErro, setImagensComErro] = useState<number[]>([]);

  // =====================================================
  // CARREGAMENTO DOS BANNERS
  // =====================================================

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarBanners() {
      try {
        console.info("[BANNER] Consultando API:", ROTAS.BANNERS.PUBLICOS);

        const resposta = await conexao.get<unknown>(ROTAS.BANNERS.PUBLICOS);

        const payload = interpretarResposta(resposta);

        console.info("[BANNER] Resposta interpretada:", payload);

        const lista = extrairBanners(payload);

        const publicados = lista
          .filter((banner) => {
            const posicao = banner.posicao?.trim().toLowerCase();

            return (
              bannerEstaAtivo(banner) &&
              (!posicao || posicao === "principal") &&
              (bannerId === undefined ||
                Number(banner.id_banner) === Number(bannerId))
            );
          })
          .sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0));

        publicados.forEach((banner) => {
          const imagem = ImagemService.resolver(banner.imagem_url);

          if (!imagem) {
            console.warn("[BANNER] Imagem não resolvida:", banner.imagem_url);
          }
        });

        console.info("[BANNER] Banners publicados:", publicados.length);

        if (componenteAtivo) {
          setBanners(publicados);
          setIndiceAtual(0);
          setImagensComErro([]);
        }
      } catch (erro) {
        console.error("[BANNER] Erro ao consultar a API:", erro);

        if (componenteAtivo) {
          setBanners([]);
        }
      } finally {
        if (componenteAtivo) {
          setCarregando(false);
        }
      }
    }

    carregarBanners();

    return () => {
      componenteAtivo = false;
    };
  }, [bannerId]);

  // =====================================================
  // CARROSSEL AUTOMÁTICO
  // =====================================================

  useEffect(() => {
    if (banners.length <= 1 || pausado) return;

    const intervalo = window.setInterval(() => {
      setIndiceAtual((atual) => (atual + 1) % banners.length);
    }, 6000);

    return () => window.clearInterval(intervalo);
  }, [banners.length, pausado]);

  function anterior() {
    setIndiceAtual((atual) => (atual === 0 ? banners.length - 1 : atual - 1));
  }

  function proximo() {
    setIndiceAtual((atual) => (atual + 1) % banners.length);
  }

  // =====================================================
  // DADOS DO BANNER ATUAL
  // =====================================================

  const banner = banners[indiceAtual] ?? null;

  const titulo = banner?.titulo || "Bem-vindo ao Universo Império";

  const descricao =
    banner?.descricao ||
    "Descubra nossos produtos, encontre novidades e aproveite ofertas especiais.";

  const imagem = banner ? ImagemService.resolver(banner.imagem_url) : null;

  const imagemFalhou = banner
    ? imagensComErro.includes(banner.id_banner)
    : false;

  const link = linkSeguro(banner?.link_url);
  const destino = link || "#produtos";

  const linkExterno = Boolean(link) && /^https?:\/\//i.test(link!);

  return (
    <>
      <section
        className="banner"
        aria-label="Destaques do Universo Império"
        aria-busy={carregando}
      >
        <div
          className="banner__container"
          onMouseEnter={() => setPausado(true)}
          onMouseLeave={() => setPausado(false)}
          onFocus={() => setPausado(true)}
          onBlur={(evento) => {
            if (!evento.currentTarget.contains(evento.relatedTarget as Node)) {
              setPausado(false);
            }
          }}
        >
          {/* =========================================
              CONTEÚDO DO BANNER
          ========================================= */}

          <div className="banner__conteudo" key={banner?.id_banner ?? "padrao"}>
            <div className="banner__etiqueta">
              <span className="banner__etiqueta-ponto" />
              UNIVERSO IMPÉRIO
            </div>

            <h1 className="banner__titulo">{titulo}</h1>

            <p className="banner__descricao">{descricao}</p>

            <a
              href={destino}
              className="banner__botao"
              target={linkExterno ? "_blank" : undefined}
              rel={linkExterno ? "noopener noreferrer" : undefined}
            >
              Explorar agora
              <span aria-hidden="true">→</span>
            </a>

            <div className="banner__assinatura">
              <span className="banner__assinatura-linha" />
              <span>Seu universo, suas escolhas.</span>
            </div>
          </div>

          {/* =========================================
              IMAGEM VINDO DA API
          ========================================= */}

          <div className="banner__visual">
            {imagem && !imagemFalhou ? (
              <img
                key={`${banner?.id_banner}-${imagem}`}
                className="banner__imagem"
                src={imagem}
                alt={titulo}
                loading={indiceAtual === 0 ? "eager" : "lazy"}
                decoding="async"
                onLoad={() => {
                  console.info("[BANNER] Imagem carregada:", imagem);
                }}
                onError={() => {
                  console.error("[BANNER] Falha ao carregar imagem:", imagem);

                  if (banner) {
                    setImagensComErro((atuais) =>
                      atuais.includes(banner.id_banner)
                        ? atuais
                        : [...atuais, banner.id_banner],
                    );
                  }
                }}
              />
            ) : (
              <div className="banner__fallback">
                <div className="banner__circulo-externo" />
                <div className="banner__circulo-interno" />

                <div className="banner__brasao">
                  <span className="banner__letra">U</span>
                  <span className="banner__brasao-linha" />
                  <strong>IMPÉRIO</strong>
                  <small>UNIVERSO DE POSSIBILIDADES</small>
                </div>
              </div>
            )}

            <div className="banner__imagem-overlay" />

            <div className="banner__selo">
              <span>✦</span>
              <div>
                <strong>Universo Império</strong>
                <small>Descubra novidades</small>
              </div>
            </div>
          </div>

          {/* =========================================
              CONTROLES DO CARROSSEL
          ========================================= */}

          {banners.length > 1 && (
            <>
              <button
                type="button"
                className="banner__seta banner__seta--esquerda"
                onClick={anterior}
                aria-label="Banner anterior"
              >
                ‹
              </button>

              <button
                type="button"
                className="banner__seta banner__seta--direita"
                onClick={proximo}
                aria-label="Próximo banner"
              >
                ›
              </button>

              <div className="banner__navegacao">
                <span className="banner__contador">
                  <strong>{String(indiceAtual + 1).padStart(2, "0")}</strong>
                  {" / "}
                  {String(banners.length).padStart(2, "0")}
                </span>

                <div className="banner__pontos">
                  {banners.map((item, indice) => (
                    <button
                      key={item.id_banner}
                      type="button"
                      className={`banner__ponto ${
                        indice === indiceAtual ? "ativo" : ""
                      }`}
                      onClick={() => setIndiceAtual(indice)}
                      aria-label={`Exibir banner ${indice + 1}`}
                      aria-current={indice === indiceAtual ? "true" : undefined}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* DECORAÇÃO DO FUNDO */}

        <div className="banner__brilho banner__brilho--um" />
        <div className="banner__brilho banner__brilho--dois" />
      </section>
    </>
  );
}
