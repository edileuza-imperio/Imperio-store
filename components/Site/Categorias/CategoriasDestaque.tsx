"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

// =====================================================
// TIPOS
// =====================================================

interface Categoria {
  id_categoria: number;
  status_id: number;
  categoria_pai_id: number | null;
  nome: string;
  slug: string;
  descricao?: string | null;
  imagem_url?: string | null;
  ordem: number;
  ativo: boolean | number | string;
}

interface RespostaCategorias {
  sucesso: boolean;
  mensagem: string;
  dados?: {
    categorias?: Categoria[];
    total?: number;
  };
}

export interface CategoriasDestaqueProps {
  categoriaId?: number;
  tituloPersonalizado?: string | null;
  descricaoPersonalizada?: string | null;
}

const QUANTIDADE_SKELETONS = 8;

// =====================================================
// UTILITÁRIOS
// =====================================================

function estaAtiva(valor: unknown): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;

  return ["1", "true", "sim", "ativo"].includes(
    String(valor ?? "")
      .trim()
      .toLowerCase(),
  );
}

function resolverImagem(caminho?: string | null): string | null {
  if (!caminho?.trim()) return null;

  const valor = caminho.trim();

  if (/^(https?:\/\/|data:image\/|blob:)/i.test(valor)) {
    return valor;
  }

  try {
    const api =
      process.env.NEXT_PUBLIC_API_URL || "http://api.universoimperio.test";

    const origem = new URL(api).origin;

    return new URL(valor.replace(/^\/+/, ""), `${origem}/`).toString();
  } catch {
    return null;
  }
}

// =====================================================
// COMPONENTE
// =====================================================

export default function CategoriasDestaque({
  categoriaId,
  tituloPersonalizado,
  descricaoPersonalizada,
}: CategoriasDestaqueProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [imagensComErro, setImagensComErro] = useState<number[]>([]);
  const [tentativa, setTentativa] = useState(0);

  const titulo = tituloPersonalizado?.trim() ?? "";
  const descricao = descricaoPersonalizada?.trim() ?? "";

  // ===================================================
  // CARREGAR CATEGORIAS
  // ===================================================

  useEffect(() => {
    const controller = new AbortController();

    async function carregarCategorias() {
      setCarregando(true);
      setErro("");

      try {
        const resposta = await conexao.get<RespostaCategorias>(
          ROTAS.CATEGORIAS.LISTAR,
          {
            signal: controller.signal,
          },
        );

        const payload = resposta.data;

        if (!payload?.sucesso) {
          throw new Error(
            payload?.mensagem || "Não foi possível carregar as categorias.",
          );
        }

        const lista = Array.isArray(payload.dados?.categorias)
          ? payload.dados.categorias
          : [];

        const publicadas = lista
          .filter((categoria) => estaAtiva(categoria.ativo))
          .filter(
            (categoria) =>
              categoriaId === undefined ||
              Number(categoria.id_categoria) === categoriaId,
          )
          .sort(
            (a, b) =>
              Number(a.ordem || 0) - Number(b.ordem || 0) ||
              a.nome.localeCompare(b.nome, "pt-BR"),
          );

        setCategorias(publicadas);
        setImagensComErro([]);
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        console.error("[CATEGORIAS] Erro ao carregar:", error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as categorias.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    void carregarCategorias();

    return () => controller.abort();
  }, [categoriaId, tentativa]);

  // ===================================================
  // IMAGENS
  // ===================================================

  function registrarErroImagem(idCategoria: number) {
    setImagensComErro((atuais) =>
      atuais.includes(idCategoria) ? atuais : [...atuais, idCategoria],
    );
  }

  // ===================================================
  // RENDERIZAÇÃO
  // ===================================================

  return (
    <section
      className="categorias"
      id={`categorias-${categoriaId ?? "geral"}`}
      aria-label={titulo || "Categorias"}
      aria-busy={carregando}
    >
      <div className="categorias__container">
        {/* CABEÇALHO VINDO DO BANCO */}

        {(titulo || descricao) && (
          <header className="categorias__cabecalho">
            <div className="categorias__cabecalho-texto">
              {titulo && <h2 id="categorias-titulo">{titulo}</h2>}

              {descricao && <p>{descricao}</p>}
            </div>

            {!carregando && !erro && categorias.length > 0 && (
              <div className="categorias__contador">
                <strong>{String(categorias.length).padStart(2, "0")}</strong>

                <span>
                  {categorias.length === 1 ? "Categoria" : "Categorias"}
                </span>
              </div>
            )}
          </header>
        )}

        {/* CARREGAMENTO */}

        {carregando && (
          <div
            className="categorias__grid"
            role="status"
            aria-label="Carregando categorias"
          >
            {Array.from({ length: QUANTIDADE_SKELETONS }, (_, indice) => (
              <div className="categoria-skeleton" key={indice}>
                <span className="categoria-skeleton__imagem" />
                <span className="categoria-skeleton__linha categoria-skeleton__linha--titulo" />
                <span className="categoria-skeleton__linha" />
              </div>
            ))}

            <span className="sr-only">Carregando categorias...</span>
          </div>
        )}

        {/* ERRO */}

        {!carregando && erro && (
          <div
            className="categorias__estado categorias__estado--erro"
            role="alert"
          >
            <span className="categorias__estado-icone" aria-hidden="true">
              !
            </span>

            <strong>Não foi possível carregar as categorias.</strong>

            <p>{erro}</p>

            <button
              type="button"
              onClick={() => setTentativa((atual) => atual + 1)}
            >
              Tentar novamente
              <span aria-hidden="true">↻</span>
            </button>
          </div>
        )}

        {/* CARDS DAS CATEGORIAS */}

        {!carregando && !erro && categorias.length > 0 && (
          <div className="categorias__grid">
            {categorias.map((categoria, indice) => {
              const imagem = resolverImagem(categoria.imagem_url);

              const possuiImagem =
                Boolean(imagem) &&
                !imagensComErro.includes(categoria.id_categoria);

              const inicial = categoria.nome.trim().charAt(0).toUpperCase();

              return (
                <Link
                  key={categoria.id_categoria}
                  href={`/produto/categoria/${categoria.id_categoria}`}
                  className="categoria-item"
                  aria-label={`Ver produtos da categoria ${categoria.nome}`}
                  title={`Ver produtos de ${categoria.nome}`}
                  style={
                    {
                      "--item-indice": indice,
                    } as CSSProperties
                  }
                >
                  <span className="categoria-item__numero" aria-hidden="true">
                    {String(indice + 1).padStart(2, "0")}
                  </span>

                  <div className="categoria-item__imagem">
                    {possuiImagem ? (
                      <img
                        src={imagem!}
                        alt={categoria.nome}
                        loading="lazy"
                        decoding="async"
                        onError={() =>
                          registrarErroImagem(categoria.id_categoria)
                        }
                      />
                    ) : (
                      <div
                        className="categoria-item__fallback"
                        aria-hidden="true"
                      >
                        <span>{inicial || "U"}</span>
                      </div>
                    )}

                    <span className="categoria-item__selo" aria-hidden="true">
                      ↗
                    </span>
                  </div>

                  <div className="categoria-item__texto">
                    <h3>{categoria.nome}</h3>

                    {categoria.descricao?.trim() && (
                      <p>{categoria.descricao.trim()}</p>
                    )}

                    <span className="categoria-item__link">
                      Explorar categoria
                      <span aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* NENHUMA CATEGORIA */}

        {!carregando && !erro && categorias.length === 0 && (
          <div className="categorias__estado categorias__estado--vazio">
            <span className="categorias__estado-icone" aria-hidden="true">
              ✧
            </span>

            <strong>Nenhuma categoria disponível por enquanto.</strong>

            <p>Estamos preparando novidades para você. Volte em breve!</p>
          </div>
        )}
      </div>
    </section>
  );
}
