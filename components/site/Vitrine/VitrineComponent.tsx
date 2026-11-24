"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";
import ImagemService from "@/Services/Imagem/ImagemService";

// =====================================================
// TIPOS DA API
// =====================================================

type ValorAtivo = boolean | number | string | null | undefined;
type Objeto = Record<string, unknown>;

interface VitrineItemApi {
  id_vitrine_item: number;
  vitrine_id: number;
  produto_id: number;
  ordem?: number;
  ativo?: ValorAtivo;
}

interface VitrineApi {
  id_vitrine: number;
  status_id?: number;
  nome: string;
  codigo: string;
  titulo?: string | null;
  descricao?: string | null;
  tipo?: string | null;
  ordem?: number;
  ativo?: ValorAtivo;
  itens?: VitrineItemApi[];
  total_itens?: number;
}

interface Produto {
  id: number;
  nome: string;
  slug?: string;
  sku?: string;
  descricao?: string;
  descricaoCurta?: string;
  imagem?: string | null;
  preco: number | null;
  precoPromocional: number | null;
  destaque: boolean;
  marca?: string;
  categoria?: string;
}

interface Vitrine {
  id: number;
  nome: string;
  codigo: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  ordem: number;
  produtos: Produto[];
  totalItens: number;
}

interface RespostaApi {
  sucesso?: boolean;
  mensagem?: string;
  dados?: unknown;
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function ehObjeto(valor: unknown): valor is Objeto {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function interpretarPayload(valor: unknown): unknown {
  let payload = valor;

  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return null;
    }
  }

  if (ehObjeto(payload) && "data" in payload && !("dados" in payload)) {
    payload = payload.data;
  }

  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      return null;
    }
  }

  return payload;
}

function estaAtivo(valor: ValorAtivo): boolean {
  if (valor === undefined || valor === null) return true;
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;

  return ["1", "true", "sim", "ativo"].includes(
    String(valor).trim().toLowerCase(),
  );
}

function paraBooleano(valor: unknown): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;
  if (typeof valor === "string") {
    return ["1", "true", "sim", "ativo"].includes(valor.trim().toLowerCase());
  }
  return false;
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor.trim() : "";
}

function numero(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor !== "string" || !valor.trim()) return null;

  let limpo = valor.replace(/[^\d,.-]/g, "");
  if (limpo.includes(",")) limpo = limpo.replace(/\./g, "").replace(",", ".");

  const convertido = Number(limpo);
  return Number.isFinite(convertido) ? convertido : null;
}

function primeiroNumero(objeto: Objeto, chaves: string[]): number | null {
  for (const chave of chaves) {
    const valor = numero(objeto[chave]);
    if (valor !== null) return valor;
  }
  return null;
}

function resolverImagem(valor: unknown): string | null {
  let caminho = "";

  if (typeof valor === "string") {
    caminho = valor.trim();
  } else if (ehObjeto(valor)) {
    caminho =
      texto(valor.imagem_url) ||
      texto(valor.url) ||
      texto(valor.caminho) ||
      texto(valor.arquivo) ||
      texto(valor.path);
  }

  if (!caminho) return null;

  // URLs externas e imagens temporárias não precisam ser reconstruídas.
  if (/^(https?:\/\/|data:|blob:|\/\/)/i.test(caminho)) {
    return caminho;
  }

  // Esta vitrine exibe produtos: o contexto "produto" permite ao serviço
  // completar nomes simples com upload/produtos e montar a URL usando a API.
  // Caminhos já completos, como upload/produtos/... permanecem preservados.
  try {
    return ImagemService.produto(caminho);
  } catch (erro) {
    console.warn(
      "[VITRINES] Não foi possível resolver a imagem do produto:",
      erro,
    );
    return null;
  }
}

function extrairImagem(objeto: Objeto): string | null {
  const camposDiretos = [
    objeto.imagem_principal,
    objeto.imagem_url,
    objeto.url_imagem,
    objeto.url,
    objeto.imagem,
    objeto.foto,
    objeto.capa,
  ];

  for (const campo of camposDiretos) {
    const imagem = resolverImagem(campo);
    if (imagem) return imagem;
  }

  const colecoes = [objeto.imagens, objeto.galeria, objeto.fotos];

  for (const colecao of colecoes) {
    if (!Array.isArray(colecao) || colecao.length === 0) continue;

    const imagemPrincipal =
      colecao.find(
        (item) =>
          ehObjeto(item) &&
          (paraBooleano(item.principal) ||
            paraBooleano(item.is_principal) ||
            paraBooleano(item.imagem_principal)),
      ) ?? colecao[0];

    const imagem = resolverImagem(imagemPrincipal);
    if (imagem) return imagem;
  }

  return null;
}

function extrairCategoria(objeto: Objeto): string | undefined {
  const direta =
    texto(objeto.categoria_nome) ||
    texto(objeto.nome_categoria) ||
    texto(objeto.categoria);
  if (direta) return direta;

  if (ehObjeto(objeto.categoria)) {
    const nome = texto(objeto.categoria.nome);
    if (nome) return nome;
  }

  if (Array.isArray(objeto.categorias)) {
    const primeira = objeto.categorias.find(ehObjeto);
    if (primeira) {
      const nome = texto(primeira.nome) || texto(primeira.categoria_nome);
      if (nome) return nome;
    }
  }

  return undefined;
}

function extrairMarca(objeto: Objeto): string | undefined {
  const direta = texto(objeto.marca_nome) || texto(objeto.nome_marca);
  if (direta) return direta;
  if (ehObjeto(objeto.marca)) return texto(objeto.marca.nome) || undefined;
  return typeof objeto.marca === "string"
    ? texto(objeto.marca) || undefined
    : undefined;
}

function extrairProduto(
  payloadBruto: unknown,
  idFallback: number,
): Produto | null {
  const payload = interpretarPayload(payloadBruto);
  if (!ehObjeto(payload)) return null;

  const dados = ehObjeto(payload.dados) ? payload.dados : null;
  const candidato =
    (dados && ehObjeto(dados.produto) ? dados.produto : null) ||
    (ehObjeto(payload.produto) ? payload.produto : null) ||
    (dados &&
    ("id_produto" in dados || "produto_id" in dados || "nome" in dados)
      ? dados
      : null) ||
    payload;

  const id =
    numero(candidato.id_produto ?? candidato.produto_id ?? candidato.id) ??
    idFallback;
  const nome =
    texto(candidato.nome) ||
    texto(candidato.nome_produto) ||
    texto(candidato.titulo) ||
    `Produto ${id}`;

  // Campos reais do ProdutoDao: preco, preco_promocional e descricao_curta.
  return {
    id,
    nome,
    slug: texto(candidato.slug) || undefined,
    sku: texto(candidato.sku) || undefined,
    descricao: texto(candidato.descricao) || undefined,
    descricaoCurta:
      texto(candidato.descricao_curta) ||
      texto(candidato.descricao_resumida) ||
      undefined,
    imagem: extrairImagem(candidato),
    preco: primeiroNumero(candidato, ["preco", "preco_venda", "valor"]),
    precoPromocional: primeiroNumero(candidato, [
      "preco_promocional",
      "preco_promo",
    ]),
    destaque: paraBooleano(candidato.destaque),
    marca: extrairMarca(candidato),
    categoria: extrairCategoria(candidato),
  };
}

function extrairListaProdutos(payloadBruto: unknown): Produto[] {
  const payload = interpretarPayload(payloadBruto);
  if (!ehObjeto(payload)) return [];

  const dados = payload.dados;
  let lista: unknown[] = [];

  if (Array.isArray(dados)) {
    lista = dados;
  } else if (ehObjeto(dados)) {
    if (Array.isArray(dados.produtos)) lista = dados.produtos;
    else if (Array.isArray(dados.itens)) lista = dados.itens;
    else if (Array.isArray(dados.resultados)) lista = dados.resultados;
  } else if (Array.isArray(payload.produtos)) {
    lista = payload.produtos;
  }

  return lista
    .map((item) => {
      if (!ehObjeto(item)) return null;
      const id = numero(item.id_produto ?? item.produto_id ?? item.id);
      return id === null ? null : extrairProduto(item, id);
    })
    .filter((item): item is Produto => item !== null);
}

function extrairVitrines(payloadBruto: unknown): VitrineApi[] {
  const payload = interpretarPayload(payloadBruto);
  if (!ehObjeto(payload)) return [];

  const dados = payload.dados;
  let lista: unknown[] = [];

  if (Array.isArray(dados)) lista = dados;
  else if (ehObjeto(dados) && Array.isArray(dados.vitrines))
    lista = dados.vitrines;
  else if (Array.isArray(payload.vitrines)) lista = payload.vitrines;

  return lista.filter(
    (item): item is VitrineApi =>
      ehObjeto(item) &&
      Number.isFinite(Number(item.id_vitrine)) &&
      typeof item.nome === "string",
  );
}

function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function obterPrecoAtual(produto: Produto): number | null {
  const promocional = produto.precoPromocional;
  if (
    promocional !== null &&
    promocional > 0 &&
    (produto.preco === null || promocional < produto.preco)
  ) {
    return promocional;
  }
  return produto.preco;
}

function calcularDesconto(produto: Produto): number | null {
  if (
    produto.preco === null ||
    produto.precoPromocional === null ||
    produto.preco <= 0 ||
    produto.precoPromocional <= 0 ||
    produto.precoPromocional >= produto.preco
  ) {
    return null;
  }
  return Math.round(
    ((produto.preco - produto.precoPromocional) / produto.preco) * 100,
  );
}

function tipoLegivel(tipo: string): string {
  const normalizado = tipo.replace(/[-_]/g, " ").trim();
  if (!normalizado) return "Seleção especial";
  return normalizado.charAt(0).toUpperCase() + normalizado.slice(1);
}

// =====================================================
// PREFERÊNCIAS LOCAIS
// =====================================================

// A API enviada não possui uma rota pública de lista de desejos.
// Por isso, as escolhas ficam persistidas neste navegador até a integração
// com um endpoint de favoritos do usuário.
const CHAVE_DESEJOS = "universo-imperio:lista-desejos:v1";

function lerDesejosSalvos(): number[] {
  try {
    const salvo = window.localStorage.getItem(CHAVE_DESEJOS);
    if (!salvo) return [];

    const dados: unknown = JSON.parse(salvo);
    if (!Array.isArray(dados)) return [];

    return Array.from(
      new Set(
        dados
          .map((item) => Number(item))
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    );
  } catch (erro) {
    console.warn("[VITRINES] Não foi possível ler a lista de desejos:", erro);
    return [];
  }
}

// =====================================================
// COMPONENTE
// =====================================================

export interface VitrineComponentProps {
  /** ID da vitrine associada ao bloco publicado na Home. */
  vitrineId?: number;
  tituloPersonalizado?: string | null;
  descricaoPersonalizada?: string | null;
}

export default function VitrineComponent({
  vitrineId,
  tituloPersonalizado,
  descricaoPersonalizada,
}: VitrineComponentProps = {}) {
  const [vitrines, setVitrines] = useState<Vitrine[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [imagensComErro, setImagensComErro] = useState<number[]>([]);
  const [desejos, setDesejos] = useState<number[]>([]);
  const [feedbackDesejo, setFeedbackDesejo] = useState("");
  const trilhosRef = useRef<Record<number, HTMLDivElement | null>>({});

  const carregarVitrines = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const respostaVitrines = await conexao.get<RespostaApi>(
        ROTAS.VITRINES.LISTAR,
      );
      const payloadVitrines = interpretarPayload(respostaVitrines.data);
      const objetoResposta = ehObjeto(payloadVitrines) ? payloadVitrines : null;

      if (!objetoResposta || objetoResposta.sucesso === false) {
        throw new Error(
          texto(objetoResposta?.mensagem) ||
            "Não foi possível carregar as vitrines.",
        );
      }

      const vitrinesApi = extrairVitrines(payloadVitrines)
        .filter((vitrine) => estaAtivo(vitrine.ativo))
        .filter(
          (vitrine) =>
            vitrineId === undefined ||
            Number(vitrine.id_vitrine) === Number(vitrineId),
        )
        .sort(
          (a, b) =>
            Number(a.ordem ?? 0) - Number(b.ordem ?? 0) ||
            a.nome.localeCompare(b.nome, "pt-BR"),
        );

      const idsProdutos = Array.from(
        new Set(
          vitrinesApi.flatMap((vitrine) =>
            (vitrine.itens ?? [])
              .filter((item) => estaAtivo(item.ativo))
              .map((item) => Number(item.produto_id))
              .filter((id) => Number.isFinite(id) && id > 0),
          ),
        ),
      );

      const produtosPorId = new Map<number, Produto>();

      if (idsProdutos.length > 0) {
        try {
          const respostaProdutos = await conexao.get<RespostaApi>(
            ROTAS.PRODUTOS.LISTAR,
          );
          extrairListaProdutos(respostaProdutos.data).forEach((produto) => {
            produtosPorId.set(produto.id, produto);
          });
        } catch (erroProdutos) {
          console.warn(
            "[VITRINES] Falha ao carregar catálogo geral:",
            erroProdutos,
          );
        }
      }

      // A listagem geral pode trazer nome e preço sem incluir imagens.
      // Nesse caso, também buscamos o detalhe do produto para obter
      // imagem_principal ou a coleção imagens do cadastro.
      const idsPendentes = idsProdutos.filter((id) => {
        const produto = produtosPorId.get(id);
        return !produto || !produto.imagem;
      });

      if (idsPendentes.length > 0) {
        console.info(
          `[VITRINES] Buscando detalhes de ${idsPendentes.length} produto(s) sem imagem na listagem.`,
          idsPendentes,
        );
      }

      await Promise.all(
        idsPendentes.map(async (id) => {
          try {
            const resposta = await conexao.get<unknown>(
              ROTAS.PRODUTOS.BUSCAR_POR_ID(id),
            );
            const produtoDetalhado = extrairProduto(resposta.data, id);

            if (produtoDetalhado) {
              const produtoAtual = produtosPorId.get(id);

              // Mescla os dados: o detalhe fornece a imagem, sem apagar
              // nome, preço ou outros campos já recebidos na listagem.
              produtosPorId.set(id, {
                ...produtoAtual,
                ...produtoDetalhado,
                nome:
                  produtoDetalhado.nome !== `Produto ${id}`
                    ? produtoDetalhado.nome
                    : produtoAtual?.nome || produtoDetalhado.nome,
                slug: produtoDetalhado.slug || produtoAtual?.slug,
                sku: produtoDetalhado.sku || produtoAtual?.sku,
                descricao:
                  produtoDetalhado.descricao || produtoAtual?.descricao,
                descricaoCurta:
                  produtoDetalhado.descricaoCurta ||
                  produtoAtual?.descricaoCurta,
                imagem: produtoDetalhado.imagem || produtoAtual?.imagem || null,
                preco: produtoDetalhado.preco ?? produtoAtual?.preco ?? null,
                precoPromocional:
                  produtoDetalhado.precoPromocional ??
                  produtoAtual?.precoPromocional ??
                  null,
                destaque:
                  produtoDetalhado.destaque || produtoAtual?.destaque || false,
                marca: produtoDetalhado.marca || produtoAtual?.marca,
                categoria:
                  produtoDetalhado.categoria || produtoAtual?.categoria,
              });
            } else {
              console.warn(
                `[VITRINES] A API não retornou dados válidos para o produto ${id}.`,
                resposta.data,
              );
            }
          } catch (erroProduto) {
            console.warn(
              `[VITRINES] Não foi possível buscar os detalhes do produto ${id}:`,
              erroProduto,
            );
          }
        }),
      );

      const produtosSemImagem = idsProdutos.filter(
        (id) => !produtosPorId.get(id)?.imagem,
      );

      if (produtosSemImagem.length > 0) {
        console.warn(
          "[VITRINES] A API não forneceu imagem para estes produtos. Confira imagem_principal/imagens em GET /produtos/{id}:",
          produtosSemImagem,
        );
      }

      const vitrinesFormatadas: Vitrine[] = vitrinesApi
        .map((vitrine) => {
          const itens = [...(vitrine.itens ?? [])]
            .filter((item) => estaAtivo(item.ativo))
            .sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0));

          const produtos = itens
            .map((item) => produtosPorId.get(Number(item.produto_id)))
            .filter((produto): produto is Produto => Boolean(produto));

          return {
            id: Number(vitrine.id_vitrine),
            nome: vitrine.nome,
            codigo: vitrine.codigo,
            titulo: texto(vitrine.titulo) || vitrine.nome,
            descricao: texto(vitrine.descricao) || undefined,
            tipo: texto(vitrine.tipo) || "produtos",
            ordem: Number(vitrine.ordem ?? 0),
            produtos,
            totalItens: itens.length,
          };
        })
        .filter((vitrine) => vitrine.produtos.length > 0);

      setVitrines(vitrinesFormatadas);
      setImagensComErro([]);
    } catch (erroCarregamento) {
      console.error("[VITRINES] Erro ao carregar:", erroCarregamento);
      setErro(
        erroCarregamento instanceof Error
          ? erroCarregamento.message
          : "Não foi possível carregar as vitrines.",
      );
    } finally {
      setCarregando(false);
    }
  }, [vitrineId]);

  useEffect(() => {
    setDesejos(lerDesejosSalvos());

    function sincronizarOutraAba(evento: StorageEvent) {
      if (evento.key === CHAVE_DESEJOS) {
        setDesejos(lerDesejosSalvos());
      }
    }

    window.addEventListener("storage", sincronizarOutraAba);
    return () => window.removeEventListener("storage", sincronizarOutraAba);
  }, []);

  useEffect(() => {
    void carregarVitrines();
  }, [carregarVitrines]);

  const alternarDesejo = useCallback(
    (produto: Produto) => {
      const jaAdicionado = desejos.includes(produto.id);
      const atualizados = jaAdicionado
        ? desejos.filter((id) => id !== produto.id)
        : [...desejos, produto.id];

      setDesejos(atualizados);

      try {
        window.localStorage.setItem(CHAVE_DESEJOS, JSON.stringify(atualizados));
      } catch (erro) {
        console.warn(
          "[VITRINES] Não foi possível salvar a lista de desejos:",
          erro,
        );
      }

      setFeedbackDesejo(
        jaAdicionado
          ? `${produto.nome} foi removido da sua lista de desejos.`
          : `${produto.nome} foi adicionado à sua lista de desejos.`,
      );
    },
    [desejos],
  );

  const moverCarrossel = useCallback((vitrineId: number, direcao: -1 | 1) => {
    const trilho = trilhosRef.current[vitrineId];
    if (!trilho) return;

    const primeiroCard = trilho.querySelector<HTMLElement>(".produto-card");
    if (!primeiroCard) return;

    const larguraCard = primeiroCard.getBoundingClientRect().width;
    const estilos = window.getComputedStyle(trilho);
    const gap = Number.parseFloat(estilos.columnGap || estilos.gap || "0") || 0;
    const distancia = larguraCard + gap;
    const movimentoReduzido = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    trilho.scrollBy({
      left: distancia * direcao,
      behavior: movimentoReduzido ? "auto" : "smooth",
    });
  }, []);

  const marcarImagemComErro = useCallback((idProduto: number) => {
    setImagensComErro((atuais) =>
      atuais.includes(idProduto) ? atuais : [...atuais, idProduto],
    );
  }, []);

  return (
    <section
      className="vitrines"
      aria-label="Vitrines de produtos"
      id="vitrines"
    >
      <div
        className="vitrines__ornamento vitrines__ornamento--um"
        aria-hidden="true"
      />
      <div
        className="vitrines__ornamento vitrines__ornamento--dois"
        aria-hidden="true"
      />
      <span className="vitrines__anuncio" role="status" aria-live="polite">
        {feedbackDesejo}
      </span>

      <div className="vitrines__container">
        {!vitrineId && (
          <header className="vitrines__cabecalho">
            <div className="vitrines__cabecalho-texto">
              <span className="vitrines__eyebrow">
                <span className="vitrines__eyebrow-ponto" />
                CURADORIA UNIVERSO IMPÉRIO
              </span>
              <h2>
                Escolhas que <em>encantam</em>
              </h2>
              <p>
                Descubra produtos selecionados com carinho para transformar
                pequenos momentos em grandes presentes.
              </p>
            </div>
          </header>
        )}

        {carregando && (
          <div
            className="vitrines__lista vitrines__lista--skeleton"
            aria-label="Carregando vitrines"
          >
            {[0, 1].map((grupo) => (
              <section className="vitrine vitrine--skeleton" key={grupo}>
                <div className="vitrine__skeleton-titulo" />
                <div className="vitrine__skeleton-trilho">
                  {[0, 1, 2, 3].map((item) => (
                    <div
                      className="produto-card produto-card--skeleton"
                      key={item}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {!carregando && erro && (
          <div className="vitrines__estado vitrines__estado--erro" role="alert">
            <span className="vitrines__estado-icone">!</span>
            <strong>Não foi possível carregar as vitrines.</strong>
            <p>{erro}</p>
            <button type="button" onClick={() => void carregarVitrines()}>
              Tentar novamente
            </button>
          </div>
        )}

        {!carregando && !erro && vitrines.length > 0 && (
          <div className="vitrines__lista">
            {vitrines.map((vitrine) => {
              const trilhoId = `vitrine-produtos-${vitrine.id}`;
              const possuiCarrossel = vitrine.produtos.length > 1;

              return (
                <section
                  className="vitrine"
                  key={vitrine.id}
                  aria-labelledby={`vitrine-titulo-${vitrine.id}`}
                >
                  <div className="vitrine__cabecalho">
                    <div className="vitrine__cabecalho-principal">
                      <div className="vitrine__identidade">
                        <span className="vitrine__tipo">
                          {tipoLegivel(vitrine.tipo)}
                        </span>
                      </div>
                      <div className="vitrine__titulo-linha">
                        <h3 id={`vitrine-titulo-${vitrine.id}`}>
                          {tituloPersonalizado?.trim() || vitrine.titulo}
                        </h3>
                        <span className="vitrine__quantidade">
                          {vitrine.produtos.length}{" "}
                          {vitrine.produtos.length === 1
                            ? "produto"
                            : "produtos"}
                        </span>
                      </div>
                      {(descricaoPersonalizada?.trim() ||
                        vitrine.descricao) && (
                        <p className="vitrine__descricao">
                          {descricaoPersonalizada?.trim() || vitrine.descricao}
                        </p>
                      )}
                    </div>

                    <div className="vitrine__acoes">
                      <Link className="vitrine__ver-todos" href="/produtos">
                        Ver todos <span aria-hidden="true">↗</span>
                      </Link>
                      {possuiCarrossel && (
                        <div
                          className="vitrine__controles"
                          aria-label={`Navegar pelos produtos de ${vitrine.titulo}`}
                        >
                          <button
                            type="button"
                            onClick={() => moverCarrossel(vitrine.id, -1)}
                            aria-label="Produtos anteriores"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            onClick={() => moverCarrossel(vitrine.id, 1)}
                            aria-label="Próximos produtos"
                          >
                            ›
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    id={trilhoId}
                    ref={(elemento) => {
                      trilhosRef.current[vitrine.id] = elemento;
                    }}
                    className={`vitrine__produtos ${possuiCarrossel ? "vitrine__produtos--carrossel" : "vitrine__produtos--grade"}`}
                    aria-label={`Produtos da vitrine ${vitrine.titulo}`}
                  >
                    {vitrine.produtos.map((produto, indiceProduto) => {
                      const imagemFalhou = imagensComErro.includes(produto.id);
                      const hrefProduto = produto.slug
                        ? `/produto/${encodeURIComponent(produto.slug)}`
                        : `/produto/${produto.id}`;
                      const precoAtual = obterPrecoAtual(produto);
                      const desconto = calcularDesconto(produto);
                      const descricao =
                        produto.descricaoCurta || produto.descricao;

                      const estaNosDesejos = desejos.includes(produto.id);

                      return (
                        <article
                          className={`produto-card ${estaNosDesejos ? "produto-card--desejado" : ""}`}
                          key={`${vitrine.id}-${produto.id}`}
                          style={{ animationDelay: `${indiceProduto * 45}ms` }}
                        >
                          <Link
                            href={hrefProduto}
                            className="produto-card__link"
                            aria-label={`Abrir detalhes de ${produto.nome}`}
                          >
                            <div className="produto-card__imagem">
                              {produto.imagem && !imagemFalhou ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={produto.imagem}
                                  alt={produto.nome}
                                  loading="lazy"
                                  decoding="async"
                                  onError={(evento) => {
                                    console.error(
                                      `[VITRINES] Falha ao carregar a imagem do produto ${produto.id}. URL solicitada:`,
                                      evento.currentTarget.src,
                                    );
                                    marcarImagemComErro(produto.id);
                                  }}
                                />
                              ) : (
                                <div className="produto-card__sem-imagem">
                                  <span>
                                    {produto.nome.charAt(0).toUpperCase()}
                                  </span>
                                  <small>UNIVERSO IMPÉRIO</small>
                                </div>
                              )}

                              {desconto !== null ? (
                                <span className="produto-card__selo-imagem produto-card__selo-imagem--desconto">
                                  {desconto}% OFF
                                </span>
                              ) : produto.destaque ? (
                                <span className="produto-card__selo-imagem">
                                  Destaque
                                </span>
                              ) : null}

                              <span
                                className="produto-card__ver-imagem"
                                aria-hidden="true"
                              >
                                ↗
                              </span>
                            </div>

                            <div className="produto-card__conteudo">
                              <div className="produto-card__metadados">
                                {produto.categoria && (
                                  <span className="produto-card__categoria">
                                    {produto.categoria}
                                  </span>
                                )}
                                {produto.marca && (
                                  <span className="produto-card__marca">
                                    {produto.marca}
                                  </span>
                                )}
                                {!produto.categoria && !produto.marca && (
                                  <span className="produto-card__marca">
                                    UNIVERSO IMPÉRIO
                                  </span>
                                )}
                              </div>

                              <h4 className="produto-card__nome">
                                {produto.nome}
                              </h4>
                              {descricao && (
                                <p className="produto-card__descricao">
                                  {descricao}
                                </p>
                              )}
                              {produto.sku && (
                                <span className="produto-card__sku">
                                  Ref. {produto.sku}
                                </span>
                              )}

                              <div className="produto-card__rodape">
                                <div className="produto-card__precos">
                                  {desconto !== null &&
                                    produto.preco !== null && (
                                      <del>{formatarMoeda(produto.preco)}</del>
                                    )}
                                  {precoAtual !== null ? (
                                    <strong>{formatarMoeda(precoAtual)}</strong>
                                  ) : (
                                    <span className="produto-card__preco-consultar">
                                      Consulte o preço
                                    </span>
                                  )}
                                  {desconto !== null &&
                                    produto.preco !== null &&
                                    produto.precoPromocional !== null && (
                                      <small>
                                        Economize{" "}
                                        {formatarMoeda(
                                          produto.preco -
                                            produto.precoPromocional,
                                        )}
                                      </small>
                                    )}
                                </div>
                                <span className="produto-card__botao">
                                  Ver produto <span aria-hidden="true">→</span>
                                </span>
                              </div>
                            </div>
                          </Link>

                          <button
                            type="button"
                            className={`produto-card__desejo ${estaNosDesejos ? "is-active" : ""}`}
                            aria-label={
                              estaNosDesejos
                                ? `Remover ${produto.nome} da lista de desejos`
                                : `Adicionar ${produto.nome} à lista de desejos`
                            }
                            aria-pressed={estaNosDesejos}
                            title={
                              estaNosDesejos
                                ? "Remover dos desejos"
                                : "Adicionar aos desejos"
                            }
                            onClick={() => alternarDesejo(produto)}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              focusable="false"
                            >
                              <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
                            </svg>
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  {possuiCarrossel && (
                    <p className="vitrine__dica-carrossel">
                      Deslize para explorar mais produtos{" "}
                      <span aria-hidden="true">→</span>
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {!carregando && !erro && vitrines.length === 0 && (
          <div className="vitrines__estado">
            <span className="vitrines__estado-icone">✦</span>
            <strong>Estamos preparando novidades para você.</strong>
            <p>
              Em breve, novas seleções especiais estarão disponíveis por aqui.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
