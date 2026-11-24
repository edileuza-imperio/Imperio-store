"use client";

import { useEffect, useState, type ReactNode } from "react";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";

import BannerPrincipal from "@/components/Site/Banner/Banner";
import Campanhas from "@/components/Site/Campanhas/Campanhas";
import CategoriasDestaque from "@/components/Site/Categorias/CategoriasDestaque";
import CuponsPage from "@/components/Site/Cupons/CuponsPage";
import VitrineComponent from "@/components/Site/Vitrine/VitrineComponent";

// =====================================================
// TIPOS
// =====================================================

type Objeto = Record<string, unknown>;

type HomeBloco = {
  id_bloco: number;
  pagina: string;
  codigo: string;
  tipo: string;
  referencia_id: number | null;
  titulo_customizado: string | null;
  descricao_customizada: string | null;
  ordem: number;
  configuracao_json: Objeto | null;
};

type RespostaHome = {
  sucesso?: boolean;
  mensagem?: string;
  dados?: {
    blocos?: unknown[];
  };
  blocos?: unknown[];
};

// =====================================================
// VALIDAÇÃO DOS DADOS
// =====================================================

function ehObjeto(valor: unknown): valor is Objeto {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function normalizarBloco(valor: unknown): HomeBloco | null {
  if (!ehObjeto(valor)) return null;

  const id = Number(valor.id_bloco);
  const ordem = Number(valor.ordem ?? 0);

  const tipo = String(valor.tipo ?? "")
    .trim()
    .toUpperCase();

  const referencia =
    valor.referencia_id === null ||
    valor.referencia_id === undefined ||
    valor.referencia_id === ""
      ? null
      : Number(valor.referencia_id);

  if (!Number.isInteger(id) || id <= 0) return null;
  if (!tipo) return null;
  if (!Number.isFinite(ordem) || ordem < 0) return null;

  if (
    referencia !== null &&
    (!Number.isInteger(referencia) || referencia <= 0)
  ) {
    return null;
  }

  return {
    id_bloco: id,
    pagina: String(valor.pagina ?? "HOME"),
    codigo: String(valor.codigo ?? ""),
    tipo,
    referencia_id: referencia,

    titulo_customizado:
      typeof valor.titulo_customizado === "string"
        ? valor.titulo_customizado
        : null,

    descricao_customizada:
      typeof valor.descricao_customizada === "string"
        ? valor.descricao_customizada
        : null,

    ordem,

    configuracao_json: ehObjeto(valor.configuracao_json)
      ? valor.configuracao_json
      : null,
  };
}

function extrairBlocos(payload: unknown): HomeBloco[] {
  let raiz = payload;

  if (ehObjeto(raiz) && ehObjeto(raiz.data) && !("dados" in raiz)) {
    raiz = raiz.data;
  }

  if (!ehObjeto(raiz)) {
    throw new Error("Resposta inválida da API.");
  }

  if (raiz.sucesso === false) {
    throw new Error(
      typeof raiz.mensagem === "string"
        ? raiz.mensagem
        : "Não foi possível carregar os blocos.",
    );
  }

  const dados = ehObjeto(raiz.dados) ? raiz.dados : null;

  const lista = Array.isArray(dados?.blocos)
    ? dados.blocos
    : Array.isArray(raiz.blocos)
      ? raiz.blocos
      : [];

  return lista
    .map(normalizarBloco)
    .filter((bloco): bloco is HomeBloco => bloco !== null)
    .sort((a, b) => a.ordem - b.ordem || a.id_bloco - b.id_bloco);
}

// =====================================================
// BLOCO DE TEXTO
// =====================================================

function BlocoTexto({ bloco }: { bloco: HomeBloco }) {
  const titulo = bloco.titulo_customizado?.trim();
  const descricao = bloco.descricao_customizada?.trim();

  if (!titulo && !descricao) return null;

  return (
    <section className="home-layout-texto" aria-label={titulo || "Informações"}>
      <div className="home-layout-texto__conteudo">
        {titulo && <h2>{titulo}</h2>}
        {descricao && <p>{descricao}</p>}
      </div>
    </section>
  );
}

// =====================================================
// REGISTRO DE COMPONENTES
// =====================================================

type RenderizadorBloco = (bloco: HomeBloco) => ReactNode;

const RENDERIZADORES: Record<string, RenderizadorBloco> = {
  BANNER: ({ referencia_id }) =>
    referencia_id ? <BannerPrincipal bannerId={referencia_id} /> : null,

  CATEGORIAS: (bloco) => (
    <CategoriasDestaque
      categoriaId={bloco.referencia_id ?? undefined}
      tituloPersonalizado={bloco.titulo_customizado}
      descricaoPersonalizada={bloco.descricao_customizada}
    />
  ),

  CAMPANHA: (bloco) =>
    bloco.referencia_id ? (
      <Campanhas
        campanhaId={bloco.referencia_id}
        tituloPersonalizado={bloco.titulo_customizado}
        descricaoPersonalizada={bloco.descricao_customizada}
      />
    ) : null,

  CUPONS: (bloco) => (
    <CuponsPage
      tituloPersonalizado={bloco.titulo_customizado}
      descricaoPersonalizada={bloco.descricao_customizada}
    />
  ),

  VITRINE: (bloco) =>
    bloco.referencia_id ? (
      <VitrineComponent
        vitrineId={bloco.referencia_id}
        tituloPersonalizado={bloco.titulo_customizado}
        descricaoPersonalizada={bloco.descricao_customizada}
      />
    ) : null,

  TEXTO: (bloco) => <BlocoTexto bloco={bloco} />,
};

// =====================================================
// RENDERIZAÇÃO DINÂMICA
// =====================================================

function renderizarBloco(bloco: HomeBloco): ReactNode {
  const renderizador = RENDERIZADORES[bloco.tipo];

  return renderizador?.(bloco) ?? null;
}

// =====================================================
// PÁGINA INICIAL
// =====================================================

export default function HomePage() {
  const [blocos, setBlocos] = useState<HomeBloco[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function carregarHome() {
      try {
        const resposta = await conexao.get<unknown>(
          ROTAS.HOME_BLOCOS.LISTAR_PUBLICADOS,
          {
            params: {
              pagina: "HOME",
            },
            signal: controller.signal,
          },
        );

        const publicados = extrairBlocos(resposta.data);

        setBlocos(publicados);
        setErro("");
      } catch (error: unknown) {
        if (controller.signal.aborted) return;

        console.error("[HOME] Erro ao carregar composição:", error);

        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a página inicial.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setCarregando(false);
        }
      }
    }

    void carregarHome();

    return () => controller.abort();
  }, []);

  // Carregamento
  if (carregando) {
    return (
      <main
        className="home-layout-loading"
        aria-busy="true"
        aria-label="Carregando página inicial"
      >
        <span />
        <span />
        <span />
      </main>
    );
  }

  // Erro
  if (erro) {
    return (
      <main className="home-layout-erro" role="alert">
        <p>{erro}</p>
      </main>
    );
  }

  // Nenhum bloco publicado
  if (blocos.length === 0) return null;

  // Composição dinâmica
  return (
    <main
      className="home-layout"
      aria-label="Página inicial do Universo Império"
    >
      {blocos.map((bloco) => {
        const conteudo = renderizarBloco(bloco);

        if (conteudo === null) return null;

        return (
          <div
            className="home-layout__bloco"
            key={bloco.id_bloco}
            data-bloco-id={bloco.id_bloco}
            data-bloco-tipo={bloco.tipo}
          >
            {conteudo}
          </div>
        );
      })}
    </main>
  );
}
