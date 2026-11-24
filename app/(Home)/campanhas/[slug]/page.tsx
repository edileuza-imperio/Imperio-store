"use client";

import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock3,
  ImageOff,
  Megaphone,
  Package,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import conexao from "@/Services/Conexao/Conexao";
import ImagemService from "@/Services/Imagem/ImagemService";
import ROTAS from "@/app/constants/rotas";

type Registro = Record<string, any>;

interface Campanha {
  id_campanha: number;
  nome: string;
  slug: string;
  descricao: string;
  imagem_url: string;
  inicio_em: string;
  termina_em: string;
  ativo: boolean | number | null;
}

interface ProdutoCampanha {
  id: string;
  produtoId: number | null;
  nome: string;
  slug: string;
  sku: string;
  descricao: string;
  imagem: string;
  preco: number | null;
  precoPromocional: number | null;
}

function ehRegistro(valor: unknown): valor is Registro {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function primeiraString(...valores: unknown[]): string {
  for (const valor of valores) {
    if (typeof valor === "string" && valor.trim()) return valor.trim();
    if (typeof valor === "number" && Number.isFinite(valor))
      return String(valor);
  }
  return "";
}

function numero(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;
  if (typeof valor !== "string" || !valor.trim()) return null;

  let limpo = valor.replace(/[^\d,.-]/g, "");
  if (limpo.includes(",")) limpo = limpo.replace(/\./g, "").replace(",", ".");
  const resultado = Number(limpo);
  return Number.isFinite(resultado) ? resultado : null;
}

function extrairRaiz(resposta: unknown): unknown {
  if (ehRegistro(resposta) && "data" in resposta) return resposta.data;
  return resposta;
}

function localizarRegistro(
  payload: unknown,
  chaves: string[],
): Registro | null {
  const raiz = extrairRaiz(payload);
  const candidatos: unknown[] = [];

  if (ehRegistro(raiz)) {
    candidatos.push(
      raiz.dados,
      raiz.data,
      raiz.campanha,
      raiz.resultado,
      raiz.retorno,
      raiz,
    );

    if (ehRegistro(raiz.dados)) {
      candidatos.push(
        raiz.dados.campanha,
        raiz.dados.data,
        raiz.dados.resultado,
      );
    }
  }

  return (
    candidatos.find(
      (item): item is Registro =>
        ehRegistro(item) && chaves.some((chave) => chave in item),
    ) ?? null
  );
}

function extrairArray(payload: unknown, chave: string): unknown[] {
  const raiz = extrairRaiz(payload);
  if (Array.isArray(raiz)) return raiz;
  if (!ehRegistro(raiz)) return [];

  // A API retorna, por exemplo, { produtos: [...] } ou
  // { dados: { produtos: [...] } }.
  const dados = ehRegistro(raiz.dados) ? raiz.dados : null;
  const candidatos = [
    raiz[chave],
    dados?.[chave],
    raiz.data,
    raiz.resultado,
    raiz.retorno,
    dados?.data,
    dados?.itens,
  ];

  for (const candidato of candidatos) {
    if (Array.isArray(candidato)) return candidato;
  }

  return [];
}

function resolverImagem(caminho: unknown): string {
  const valor = primeiraString(caminho);
  if (!valor) return "";

  try {
    const imagem =
      ImagemService.produto(valor) || ImagemService.resolver(valor);
    return imagem || valor;
  } catch {
    try {
      return ImagemService.resolver(valor) || valor;
    } catch {
      return valor;
    }
  }
}

function formatarMoeda(valor: number | null): string {
  if (valor === null) return "Consulte o preço";
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(valor: string): string {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function normalizarCampanha(registro: Registro): Campanha {
  return {
    id_campanha: Number(registro.id_campanha ?? registro.id ?? 0),
    nome: primeiraString(registro.nome, registro.titulo) || "Campanha especial",
    slug: primeiraString(registro.slug),
    descricao: primeiraString(registro.descricao, registro.descricao_curta),
    imagem_url: primeiraString(
      registro.imagem_url,
      registro.imagem,
      registro.capa,
    ),
    inicio_em: primeiraString(registro.inicio_em, registro.data_inicio),
    termina_em: primeiraString(registro.termina_em, registro.data_fim),
    ativo: registro.ativo ?? null,
  };
}

function normalizarProdutoCampanha(
  item: unknown,
  indice: number,
): ProdutoCampanha | null {
  if (!ehRegistro(item)) return null;

  const produto = ehRegistro(item.produto)
    ? item.produto
    : ehRegistro(item.dados_produto)
      ? item.dados_produto
      : item;

  const produtoId = numero(
    produto.id_produto ?? produto.produto_id ?? produto.id ?? item.produto_id,
  );

  const nome = primeiraString(produto.nome, produto.titulo, item.nome);
  if (!nome) return null;

  const precoPromocional = numero(
    item.preco_promocional ??
      item.precoPromocional ??
      produto.preco_promocional,
  );
  const preco = numero(
    produto.preco ??
      produto.valor ??
      produto.preco_venda ??
      produto.valor_venda,
  );

  const imagem = primeiraString(
    produto.imagem_principal,
    produto.imagem_url,
    produto.url_imagem,
    produto.imagem,
    produto.foto,
    produto.capa,
    Array.isArray(produto.imagens)
      ? typeof produto.imagens[0] === "string"
        ? produto.imagens[0]
        : (produto.imagens[0]?.url ?? produto.imagens[0]?.imagem_url)
      : "",
  );

  return {
    id: String(produtoId ?? item.id ?? indice),
    produtoId,
    nome,
    slug: primeiraString(produto.slug),
    sku: primeiraString(produto.sku, produto.codigo, produto.referencia),
    descricao: primeiraString(
      produto.descricao_curta,
      produto.descricao,
      produto.resumo,
    ),
    imagem: resolverImagem(imagem),
    preco,
    precoPromocional,
  };
}

export default function CampanhaDetalhePage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";

  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [produtos, setProdutos] = useState<ProdutoCampanha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    if (!slug) return;

    try {
      setCarregando(true);
      setErro("");

      const respostaCampanha = await conexao.get(
        ROTAS.CAMPANHAS.BUSCAR_PUBLICA_POR_SLUG(slug),
      );

      const registroCampanha = localizarRegistro(respostaCampanha, [
        "id_campanha",
        "slug",
        "nome",
      ]);

      if (!registroCampanha) {
        throw new Error("Não encontramos essa campanha.");
      }

      const campanhaNormalizada = normalizarCampanha(registroCampanha);
      setCampanha(campanhaNormalizada);

      if (!campanhaNormalizada.id_campanha) {
        setProdutos([]);
        return;
      }

      // A rota da campanha retorna apenas os vínculos (produto_id,
      // preco_promocional e ordem), não os dados completos dos produtos.
      const [respostaVinculos, respostaCatalogo] = await Promise.all([
        conexao.get(
          ROTAS.CAMPANHAS.LISTAR_PRODUTOS_PUBLICOS(
            campanhaNormalizada.id_campanha,
          ),
        ),
        // O catálogo público retorna os produtos em dados.produtos.
        conexao.get(ROTAS.PRODUTOS.LISTAR),
      ]);

      const vinculos = extrairArray(respostaVinculos, "produtos") as Registro[];

      const catalogo = extrairArray(respostaCatalogo, "produtos") as Registro[];

      const produtosPorId = new Map<number, Registro>();

      catalogo.forEach((produto) => {
        const id = numero(
          produto.id_produto ?? produto.produto_id ?? produto.id,
        );
        if (id !== null) produtosPorId.set(id, produto);
      });

      const produtosDaCampanha = vinculos
        .map((vinculo, indice) => {
          const produtoId = numero(
            vinculo.produto_id ??
              vinculo.id_produto ??
              vinculo.produto?.id_produto,
          );

          const dadosProduto =
            (produtoId !== null ? produtosPorId.get(produtoId) : undefined) ??
            (ehRegistro(vinculo.produto) ? vinculo.produto : null) ??
            (ehRegistro(vinculo.dados_produto) ? vinculo.dados_produto : null);

          if (!dadosProduto) return null;

          return normalizarProdutoCampanha(
            {
              ...dadosProduto,
              produto_id: produtoId,
              // O preço definido no vínculo da campanha prevalece.
              preco_promocional:
                vinculo.preco_promocional ??
                dadosProduto.preco_promocional ??
                null,
            },
            indice,
          );
        })
        .filter((item): item is ProdutoCampanha => item !== null);

      setProdutos(produtosDaCampanha);
    } catch (error: any) {
      console.error("Erro ao carregar campanha:", error);
      setErro(
        error?.response?.data?.mensagem ||
          error?.response?.data?.message ||
          error?.message ||
          "Não foi possível carregar esta campanha.",
      );
      setCampanha(null);
      setProdutos([]);
    } finally {
      setCarregando(false);
    }
  }, [slug]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const imagemCampanha = useMemo(
    () => resolverImagem(campanha?.imagem_url),
    [campanha?.imagem_url],
  );

  if (carregando) {
    return (
      <main className="campanha-detalhe">
        <div className="campanha-detalhe__estado">
          <span className="campanha-detalhe__spinner" />
          <p>Preparando sua campanha...</p>
        </div>
        <style jsx>{estilos}</style>
      </main>
    );
  }

  if (erro || !campanha) {
    return (
      <main className="campanha-detalhe">
        <div className="campanha-detalhe__erro">
          <span>
            <Megaphone size={30} />
          </span>
          <h1>Campanha não encontrada</h1>
          <p>
            {erro ||
              "Esta campanha pode ter sido encerrada ou não está disponível."}
          </p>
          <Link href="/" className="campanha-detalhe__botao">
            <ArrowLeft size={17} /> Voltar para a loja
          </Link>
        </div>
        <style jsx>{estilos}</style>
      </main>
    );
  }

  return (
    <main className="campanha-detalhe">
      <nav className="campanha-detalhe__breadcrumb" aria-label="Navegação">
        <Link href="/">Início</Link>
        <ChevronRight size={14} />
        <span>Campanhas</span>
        <ChevronRight size={14} />
        <strong>{campanha.nome}</strong>
      </nav>

      <section className="campanha-detalhe__hero">
        <div className="campanha-detalhe__hero-imagem">
          {imagemCampanha ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imagemCampanha} alt={campanha.nome} />
          ) : (
            <div className="campanha-detalhe__hero-fallback">
              <Megaphone size={48} />
              <span>Universo Império</span>
            </div>
          )}
          <span className="campanha-detalhe__selo">
            <Sparkles size={14} /> Campanha especial
          </span>
        </div>

        <div className="campanha-detalhe__hero-conteudo">
          <span className="campanha-detalhe__sobretitulo">
            Ofertas selecionadas para você
          </span>
          <h1>{campanha.nome}</h1>
          {campanha.descricao && <p>{campanha.descricao}</p>}

          {(campanha.inicio_em || campanha.termina_em) && (
            <div className="campanha-detalhe__datas">
              {campanha.inicio_em && (
                <span>
                  <CalendarDays size={15} />
                  Início: {formatarData(campanha.inicio_em)}
                </span>
              )}
              {campanha.termina_em && (
                <span>
                  <Clock3 size={15} />
                  Até: {formatarData(campanha.termina_em)}
                </span>
              )}
            </div>
          )}

          <a href="#produtos-da-campanha" className="campanha-detalhe__botao">
            Ver produtos da campanha <ChevronRight size={17} />
          </a>
        </div>
      </section>

      <section className="campanha-detalhe__produtos" id="produtos-da-campanha">
        <div className="campanha-detalhe__secao-topo">
          <div>
            <span className="campanha-detalhe__sobretitulo">
              Escolhas especiais
            </span>
            <h2>Produtos desta campanha</h2>
            <p>Confira os produtos selecionados para esta oferta.</p>
          </div>
          <span className="campanha-detalhe__contador">
            <Package size={16} />
            {produtos.length} {produtos.length === 1 ? "produto" : "produtos"}
          </span>
        </div>

        {produtos.length > 0 ? (
          <div className="campanha-detalhe__grade">
            {produtos.map((produto) => {
              const precoExibido = produto.precoPromocional ?? produto.preco;
              const temDesconto =
                produto.precoPromocional !== null &&
                produto.preco !== null &&
                produto.precoPromocional < produto.preco;

              return (
                <article className="campanha-produto" key={produto.id}>
                  <Link
                    href={
                      produto.slug
                        ? `/produtos/${encodeURIComponent(produto.slug)}`
                        : "/produtos"
                    }
                    className="campanha-produto__imagem"
                    aria-label={`Ver ${produto.nome}`}
                  >
                    {produto.imagem ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={produto.imagem} alt={produto.nome} />
                    ) : (
                      <span className="campanha-produto__sem-imagem">
                        <ImageOff size={30} />
                        Imagem indisponível
                      </span>
                    )}
                    {temDesconto && (
                      <span className="campanha-produto__desconto">Oferta</span>
                    )}
                  </Link>

                  <div className="campanha-produto__info">
                    <span className="campanha-produto__marca">
                      UNIVERSO IMPÉRIO
                    </span>
                    <h3>{produto.nome}</h3>
                    {produto.descricao && <p>{produto.descricao}</p>}
                    {produto.sku && <small>Ref. {produto.sku}</small>}

                    <div className="campanha-produto__rodape">
                      <div className="campanha-produto__precos">
                        {temDesconto && (
                          <del>{formatarMoeda(produto.preco)}</del>
                        )}
                        <strong>{formatarMoeda(precoExibido)}</strong>
                      </div>
                      <Link
                        href={
                          produto.slug
                            ? `/produtos/${encodeURIComponent(produto.slug)}`
                            : "/produtos"
                        }
                        className="campanha-produto__ver"
                      >
                        Ver produto <ChevronRight size={15} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="campanha-detalhe__vazio">
            <span>
              <ShoppingBag size={27} />
            </span>
            <h3>Estamos preparando esta seleção</h3>
            <p>Os produtos desta campanha ainda não estão disponíveis.</p>
            <Link href="/produtos">Explorar produtos</Link>
          </div>
        )}
      </section>

      <div className="campanha-detalhe__voltar">
        <Link href="/">
          <ArrowLeft size={16} /> Voltar para a página inicial
        </Link>
      </div>

      <style jsx>{estilos}</style>
    </main>
  );
}

const estilos = `
  .campanha-detalhe {
    width: min(1240px, calc(100% - 32px));
    margin: 28px auto 60px;
    color: #4b3039;
  }

  .campanha-detalhe__breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 20px;
    color: #a58a91;
    font-size: 11px;
  }

  .campanha-detalhe__breadcrumb a {
    color: #a65368;
    text-decoration: none;
  }

  .campanha-detalhe__breadcrumb strong {
    overflow: hidden;
    max-width: 260px;
    color: #64434c;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .campanha-detalhe__hero {
    display: grid;
    grid-template-columns: minmax(0, 1.08fr) minmax(320px, .92fr);
    min-height: 350px;
    overflow: hidden;
    border: 1px solid #efd9d9;
    border-radius: 17px;
    background: #fffdfc;
    box-shadow: 0 9px 26px rgba(103, 57, 68, .07);
  }

  .campanha-detalhe__hero-imagem {
    position: relative;
    min-height: 350px;
    overflow: hidden;
    background: #f2e1e3;
  }

  .campanha-detalhe__hero-imagem img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .campanha-detalhe__hero-fallback {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #a65368;
    background: linear-gradient(135deg, #f8eeee, #e8c8ce);
  }

  .campanha-detalhe__hero-fallback span {
    font-family: Georgia, serif;
    font-size: 13px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .campanha-detalhe__selo {
    position: absolute;
    top: 16px;
    left: 16px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border-radius: 30px;
    color: #fff;
    background: rgba(119, 57, 74, .9);
    font-size: 10px;
    font-weight: 800;
  }

  .campanha-detalhe__hero-conteudo {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    padding: clamp(26px, 4vw, 48px);
    background: linear-gradient(135deg, #fffdfc, #fff8f7);
  }

  .campanha-detalhe__sobretitulo {
    display: block;
    margin-bottom: 9px;
    color: #b76578;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.35px;
    text-transform: uppercase;
  }

  .campanha-detalhe__hero-conteudo h1 {
    margin: 0;
    color: #4b3039;
    font-size: clamp(28px, 3.4vw, 42px);
    line-height: 1.12;
    font-weight: 800;
    letter-spacing: -.8px;
  }

  .campanha-detalhe__hero-conteudo > p {
    margin: 14px 0 0;
    color: #826d74;
    font-size: 13px;
    line-height: 1.75;
    white-space: pre-line;
  }

  .campanha-detalhe__datas {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-top: 18px;
    color: #927780;
    font-size: 11px;
  }

  .campanha-detalhe__datas span {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .campanha-detalhe__datas :global(svg) {
    color: #b76578;
  }

  .campanha-detalhe__botao {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    padding: 12px 17px;
    border: 1px solid #b76578;
    border-radius: 8px;
    color: #fff;
    background: #b76578;
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
    transition: .2s ease;
  }

  .campanha-detalhe__botao:hover {
    border-color: #984d61;
    background: #984d61;
    transform: translateY(-2px);
  }

  .campanha-detalhe__produtos {
    margin-top: 43px;
  }

  .campanha-detalhe__secao-topo {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }

  .campanha-detalhe__secao-topo h2 {
    margin: 0;
    color: #4b3039;
    font-size: clamp(21px, 2.5vw, 27px);
    font-weight: 800;
    letter-spacing: -.4px;
  }

  .campanha-detalhe__secao-topo p {
    margin: 6px 0 0;
    color: #8a7279;
    font-size: 12px;
  }

  .campanha-detalhe__contador {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    flex: 0 0 auto;
    padding: 8px 11px;
    border: 1px solid #efd9d9;
    border-radius: 30px;
    color: #a65368;
    background: #fff8f7;
    font-size: 11px;
    font-weight: 700;
  }

  .campanha-detalhe__grade {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 20px;
  }

  .campanha-produto {
    min-width: 0;
    overflow: hidden;
    border: 1px solid #e9cecf;
    border-radius: 15px;
    background: #fffdfc;
    box-shadow: 0 5px 16px rgba(103, 57, 68, .045);
    transition: transform .2s ease, box-shadow .2s ease;
  }

  .campanha-produto:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 22px rgba(103, 57, 68, .1);
  }

  .campanha-produto__imagem {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    background: #f5e9e9;
    text-decoration: none;
  }

  .campanha-produto__imagem img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform .35s ease;
  }

  .campanha-produto:hover .campanha-produto__imagem img {
    transform: scale(1.035);
  }

  .campanha-produto__sem-imagem {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #b17c88;
    font-size: 10px;
  }

  .campanha-produto__desconto {
    position: absolute;
    top: 12px;
    left: 12px;
    padding: 6px 10px;
    border-radius: 20px;
    color: #fff;
    background: #b76578;
    font-size: 9px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .campanha-produto__info {
    display: flex;
    flex-direction: column;
    min-height: 190px;
    padding: 15px 14px 13px;
  }

  .campanha-produto__marca {
    color: #a96b78;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 1.1px;
  }

  .campanha-produto__info h3 {
    display: -webkit-box;
    overflow: hidden;
    margin: 9px 0 0;
    color: #5b3b44;
    font-size: 13px;
    font-weight: 750;
    line-height: 1.4;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .campanha-produto__info p {
    display: -webkit-box;
    overflow: hidden;
    margin: 8px 0 0;
    color: #927d83;
    font-size: 10px;
    line-height: 1.5;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .campanha-produto__info small {
    margin-top: 9px;
    color: #b09ba0;
    font-size: 9px;
  }

  .campanha-produto__rodape {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8px;
    margin-top: auto;
    padding-top: 15px;
  }

  .campanha-produto__precos {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .campanha-produto__precos del {
    color: #b49da3;
    font-size: 10px;
  }

  .campanha-produto__precos strong {
    color: #ad586b;
    font-size: 15px;
    font-weight: 800;
  }

  .campanha-produto__ver {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 8px 9px;
    border: 1px solid #edc9ce;
    border-radius: 7px;
    color: #a65368;
    background: #fffafa;
    font-size: 9px;
    font-weight: 800;
    text-decoration: none;
    white-space: nowrap;
    transition: .2s ease;
  }

  .campanha-produto__ver:hover {
    color: #fff;
    border-color: #b76578;
    background: #b76578;
  }

  .campanha-detalhe__vazio,
  .campanha-detalhe__erro,
  .campanha-detalhe__estado {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  }

  .campanha-detalhe__vazio {
    min-height: 260px;
    padding: 30px;
    border: 1px dashed #e6c7cc;
    border-radius: 15px;
    background: #fffafa;
  }

  .campanha-detalhe__vazio > span,
  .campanha-detalhe__erro > span {
    width: 58px;
    height: 58px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #a65368;
    background: #f7e8ea;
  }

  .campanha-detalhe__vazio h3,
  .campanha-detalhe__erro h1 {
    margin: 15px 0 0;
    color: #563943;
    font-size: 19px;
  }

  .campanha-detalhe__vazio p,
  .campanha-detalhe__erro p {
    margin: 8px 0 0;
    color: #8a7279;
    font-size: 12px;
  }

  .campanha-detalhe__vazio a {
    margin-top: 16px;
    color: #a65368;
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
  }

  .campanha-detalhe__erro {
    min-height: 55vh;
    padding: 30px;
  }

  .campanha-detalhe__botao {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
  }

  .campanha-detalhe__estado {
    min-height: 45vh;
    gap: 12px;
    color: #8a7279;
    font-size: 13px;
  }

  .campanha-detalhe__spinner {
    width: 25px;
    height: 25px;
    border: 2px solid #f0dadd;
    border-top-color: #b76578;
    border-radius: 50%;
    animation: campanha-girar .8s linear infinite;
  }

  .campanha-detalhe__voltar {
    margin-top: 28px;
  }

  .campanha-detalhe__voltar a {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #a65368;
    font-size: 11px;
    font-weight: 700;
    text-decoration: none;
  }

  @keyframes campanha-girar {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1000px) {
    .campanha-detalhe__grade {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .campanha-detalhe {
      width: min(100% - 24px, 600px);
      margin-top: 20px;
    }

    .campanha-detalhe__hero {
      grid-template-columns: 1fr;
    }

    .campanha-detalhe__hero-imagem {
      min-height: 240px;
    }

    .campanha-detalhe__hero-conteudo {
      padding: 25px;
    }

    .campanha-detalhe__grade {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .campanha-produto__info {
      min-height: 185px;
      padding: 12px 10px;
    }

    .campanha-produto__rodape {
      align-items: flex-start;
      flex-direction: column;
    }

    .campanha-produto__ver {
      justify-content: center;
      width: 100%;
    }
  }

  @media (max-width: 390px) {
    .campanha-detalhe__grade {
      grid-template-columns: 1fr;
    }

    .campanha-produto__rodape {
      align-items: center;
      flex-direction: row;
    }

    .campanha-produto__ver {
      width: auto;
    }

    .campanha-detalhe__secao-topo {
      align-items: flex-start;
      flex-direction: column;
    }
  }
`;
