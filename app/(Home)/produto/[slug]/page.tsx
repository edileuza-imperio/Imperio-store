"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import CarrinhoService from "@/Services/Carrinho/CarrinhoService";
import conexao from "@/Services/Conexao/Conexao";
import ImagemService from "@/Services/Imagem/ImagemService";
import ROTAS from "@/app/constants/rotas";
import { toast } from "react-toastify";

// =====================================================
// TIPOS FLEXÍVEIS PARA RESPOSTA DO CATÁLOGO
// =====================================================

type Registro = Record<string, unknown>;

interface AtributoProduto {
  id?: number | string;
  nome: string;
  valor: string;
}

interface ImagemProduto {
  id?: number | string;
  url: string;
  alt?: string;
  principal?: boolean;
}

interface Produto {
  id: number;
  nome: string;
  slug: string;
  descricao: string;
  descricaoCurta: string;
  sku: string;
  preco: number;
  precoPromocional: number | null;
  estoque: number | null;
  marca: string;
  marcaDescricao: string;
  categoria: string;
  imagens: ImagemProduto[];
  atributos: AtributoProduto[];
  ativo: boolean;
  controlarEstoque: boolean;
  permitirVendaSemEstoque: boolean;
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function registro(valor: unknown): Registro | null {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor)
    ? (valor as Registro)
    : null;
}

function texto(...valores: unknown[]): string {
  for (const valor of valores) {
    if (typeof valor === "string" && valor.trim()) return valor.trim();
    if (typeof valor === "number" && Number.isFinite(valor)) {
      return String(valor);
    }
  }
  return "";
}

function numero(...valores: unknown[]): number | null {
  for (const valor of valores) {
    if (typeof valor === "number" && Number.isFinite(valor)) return valor;

    if (typeof valor === "string" && valor.trim()) {
      const normalizado = valor.trim().replace(/\s/g, "").replace(",", ".");
      const convertido = Number(normalizado);
      if (Number.isFinite(convertido)) return convertido;
    }
  }
  return null;
}

function resolverImagem(caminho: string): string {
  if (!caminho) return "";

  // Preserva URLs completas e caminhos absolutos já prontos.
  if (
    /^(https?:\/\/|data:|blob:|\/\/)/i.test(caminho) ||
    caminho.startsWith("/")
  ) {
    return caminho;
  }

  try {
    // Os caminhos do banco chegam como upload/produtos/... . Primeiro usamos
    // o resolvedor específico de produtos e mantemos o genérico como fallback.
    return (
      ImagemService.produto(caminho) ||
      ImagemService.resolver(caminho) ||
      caminho
    );
  } catch {
    return caminho;
  }
}

function obterListaImagens(produto: Registro): ImagemProduto[] {
  const origem =
    produto.imagens ??
    produto.galeria ??
    produto.fotos ??
    produto.imagens_produto;

  const lista = Array.isArray(origem) ? origem : [];
  const imagens = lista
    .map((item, indice): ImagemProduto | null => {
      if (typeof item === "string") {
        const url = resolverImagem(item);
        return url ? { id: indice, url } : null;
      }

      const imagem = registro(item);
      if (!imagem) return null;

      const caminho = texto(
        imagem.imagem_url,
        imagem.url,
        imagem.caminho,
        imagem.arquivo,
        imagem.nome_arquivo,
        imagem.src,
        imagem.path,
      );

      if (!caminho) return null;

      return {
        id: numero(imagem.id, imagem.id_imagem) ?? indice,
        url: resolverImagem(caminho),
        alt: texto(
          imagem.texto_alternativo,
          imagem.alt,
          imagem.descricao,
          imagem.nome,
        ),
        principal:
          imagem.principal === true ||
          imagem.principal === 1 ||
          imagem.is_principal === true ||
          imagem.imagem_principal === true,
      };
    })
    .filter((item): item is ImagemProduto => item !== null);

  // O JSON de produtos que você enviou usa exatamente imagem_principal.
  const imagemPrincipal = texto(
    produto.imagem_principal,
    produto.imagem_url,
    produto.url_imagem,
    produto.imagem,
    produto.foto,
    produto.capa,
  );

  if (imagemPrincipal) {
    const url = resolverImagem(imagemPrincipal);
    if (!imagens.some((imagem) => imagem.url === url)) {
      imagens.unshift({ id: "principal", url, principal: true });
    } else {
      const existente = imagens.find((imagem) => imagem.url === url);
      if (existente) existente.principal = true;
    }
  }

  const unicas = new Map<string, ImagemProduto>();
  imagens.forEach((imagem) => {
    if (!unicas.has(imagem.url)) unicas.set(imagem.url, imagem);
  });

  return [...unicas.values()].sort(
    (a, b) => Number(Boolean(b.principal)) - Number(Boolean(a.principal)),
  );
}

function obterMarca(produto: Registro): { nome: string; descricao: string } {
  const marca = registro(produto.marca);

  return {
    nome: texto(
      marca?.nome,
      marca?.nome_marca,
      produto.marca_nome,
      produto.nome_marca,
      typeof produto.marca === "string" ? produto.marca : "",
    ),
    descricao: texto(marca?.descricao, produto.marca_descricao),
  };
}

function obterCategoria(produto: Registro): string {
  const categoria = registro(produto.categoria);
  const categorias = Array.isArray(produto.categorias)
    ? produto.categorias
    : [];

  return texto(
    categoria?.nome,
    categoria?.nome_categoria,
    produto.categoria_nome,
    typeof produto.categoria === "string" ? produto.categoria : "",
    categorias.length ? registro(categorias[0])?.nome : "",
  );
}

function valorAtributo(valor: unknown): string {
  if (typeof valor === "string") return valor.trim();
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  if (typeof valor === "boolean") return valor ? "Sim" : "Não";
  if (Array.isArray(valor)) {
    return valor.map(valorAtributo).filter(Boolean).join(" · ");
  }
  const objeto = registro(valor);
  if (objeto) {
    return texto(
      objeto.valor,
      objeto.nome,
      objeto.descricao,
      objeto.titulo,
      objeto.label,
    );
  }
  return "";
}

function obterAtributos(produto: Registro): AtributoProduto[] {
  const itens: AtributoProduto[] = [];

  const adicionar = (
    nomeBruto: string,
    valorBruto: string,
    id?: number | string,
  ) => {
    const nome = nomeBruto.trim().replace(/[_-]+/g, " ");
    const valor = valorBruto.trim();
    if (!nome || !valor) return;

    const existente = itens.find(
      (item) =>
        item.nome.toLocaleLowerCase("pt-BR") ===
        nome.toLocaleLowerCase("pt-BR"),
    );

    if (existente) {
      const valores = existente.valor.split(" · ").map((parte) => parte.trim());
      if (!valores.includes(valor))
        existente.valor = [...valores, valor].join(" · ");
      return;
    }

    itens.push({ id, nome, valor });
  };

  // Campos técnicos que já existem no registro de produtos do banco.
  const camposTecnicos: Array<[string, string[]]> = [
    ["Modelo", ["modelo", "nome_modelo", "modelo_nome", "referencia_modelo"]],
    ["Cor", ["cor", "cor_nome", "cor_principal", "nome_cor"]],
    [
      "Material",
      ["material", "material_nome", "material_principal", "composicao"],
    ],
    ["Tamanho", ["tamanho", "tamanho_nome", "medida", "grade"]],
    ["Acabamento", ["acabamento", "tipo_acabamento"]],
    ["Fabricante", ["fabricante", "fabricante_nome"]],
    ["Origem", ["origem", "pais_origem", "fabricado_em"]],
    ["Garantia", ["garantia", "garantia_descricao", "prazo_garantia"]],
    ["Voltagem", ["voltagem", "tensao"]],
    ["Potência", ["potencia", "potencia_watts"]],
    ["Capacidade", ["capacidade", "volume"]],
    [
      "Conteúdo da embalagem",
      ["conteudo_embalagem", "itens_inclusos", "conteudo"],
    ],
    ["Coleção", ["colecao", "colecao_nome"]],
    ["Estilo", ["estilo", "estilo_nome"]],
    ["Formato", ["formato", "formato_nome"]],
  ];

  for (const [nome, chaves] of camposTecnicos) {
    for (const chave of chaves) {
      const valor = valorAtributo(produto[chave]);
      if (valor) {
        adicionar(nome, valor);
        break;
      }
    }
  }

  // Estes quatro campos estão presentes no JSON real que você enviou.
  const largura = valorAtributo(produto.largura);
  const altura = valorAtributo(produto.altura);
  const comprimento = valorAtributo(
    produto.comprimento ?? produto.profundidade,
  );
  const dimensoesDiretas = valorAtributo(
    produto.dimensoes ?? produto.dimensao ?? produto.medidas,
  );

  if (dimensoesDiretas) {
    adicionar("Dimensões", dimensoesDiretas);
  } else {
    if (largura) adicionar("Largura", largura);
    if (altura) adicionar("Altura", altura);
    if (comprimento) adicionar("Comprimento", comprimento);
  }

  const peso = valorAtributo(
    produto.peso ?? produto.peso_liquido ?? produto.peso_kg,
  );
  if (peso) adicionar("Peso", peso);

  // Relações de atributos já vinculadas ao produto, se a API pública as enviar.
  // Não usamos /painel/atributos aqui: essa rota retorna o catálogo de definições,
  // não os valores efetivamente selecionados para este produto.
  const fontes = [
    produto.atributos,
    produto.atributos_produto,
    produto.produto_atributos,
    produto.caracteristicas,
    produto.caracteristicas_tecnicas,
    produto.especificacoes,
    produto.especificacoes_tecnicas,
    produto.dados_tecnicos,
    produto.ficha_tecnica,
    produto.detalhes_tecnicos,
  ];

  for (const fonte of fontes) {
    if (Array.isArray(fonte)) {
      fonte.forEach((item, indice) => {
        const atributo = registro(item);
        if (!atributo) return;

        const relacionado =
          registro(atributo.atributo) ?? registro(atributo.dado);
        const nome = texto(
          atributo.nome_atributo,
          atributo.atributo_nome,
          atributo.nome,
          atributo.titulo,
          relacionado?.nome,
          relacionado?.titulo,
          relacionado?.label,
          atributo.codigo,
        );
        const valor = valorAtributo(
          atributo.valor_atributo ??
            atributo.valor ??
            atributo.valor_nome ??
            atributo.conteudo ??
            atributo.descricao ??
            atributo.opcao,
        );

        if (nome && valor) {
          adicionar(
            nome,
            valor,
            numero(atributo.id, atributo.id_atributo) ?? indice,
          );
        }
      });
      continue;
    }

    const objeto = registro(fonte);
    if (objeto) {
      Object.entries(objeto).forEach(([chave, valor]) => {
        const ignorar = [
          "id",
          "id_produto",
          "produto_id",
          "status_id",
          "marca_id",
          "categoria_id",
          "criado_em",
          "atualizado_em",
          "seo_titulo",
          "seo_descricao",
          "ativo",
          "destaque",
          "controlar_estoque",
          "permitir_venda_sem_estoque",
          "custo",
        ];
        if (ignorar.includes(chave.toLowerCase())) return;
        const exibivel = valorAtributo(valor);
        if (exibivel) {
          const nome = chave
            .replace(/[_-]+/g, " ")
            .replace(/\b\w/g, (letra) => letra.toLocaleUpperCase("pt-BR"));
          adicionar(nome, exibivel);
        }
      });
    }
  }

  // Algumas APIs públicas incluem os atributos dentro das variações.
  const variacoes = Array.isArray(produto.variacoes) ? produto.variacoes : [];
  variacoes.forEach((itemVariacao) => {
    const variacaoBruta = registro(itemVariacao);
    if (!variacaoBruta) return;
    const variacao = registro(variacaoBruta.variacao) ?? variacaoBruta;
    const atributos = Array.isArray(variacaoBruta.atributos)
      ? variacaoBruta.atributos
      : Array.isArray(variacao.atributos)
        ? variacao.atributos
        : [];

    atributos.forEach((itemAtributo, indice) => {
      const atributo = registro(itemAtributo);
      if (!atributo) return;
      const relacionado = registro(atributo.atributo);
      const nome = texto(
        atributo.nome_atributo,
        atributo.atributo_nome,
        relacionado?.nome,
        relacionado?.titulo,
        relacionado?.codigo,
      );
      const valor = valorAtributo(
        atributo.valor_atributo ?? atributo.valor ?? atributo.valor_nome,
      );
      if (nome && valor) {
        adicionar(
          nome,
          valor,
          numero(atributo.id, atributo.id_atributo) ?? indice,
        );
      }
    });
  });

  return itens;
}

function booleano(valor: unknown, padrao = false): boolean {
  if (valor === undefined || valor === null || valor === "") return padrao;
  if (valor === true || valor === 1) return true;
  if (valor === false || valor === 0) return false;
  return ["1", "true", "sim", "ativo", "yes"].includes(
    String(valor).trim().toLowerCase(),
  );
}

function normalizarProduto(candidato: Registro): Produto {
  const preco = numero(
    candidato.preco,
    candidato.preco_venda,
    candidato.valor,
    candidato.valor_venda,
  );

  const promocional = numero(
    candidato.preco_promocional,
    candidato.preco_oferta,
    candidato.valor_promocional,
    candidato.preco_desconto,
  );

  const estoque = numero(
    candidato.estoque,
    candidato.quantidade_estoque,
    candidato.saldo_estoque,
    candidato.quantidade_disponivel,
  );

  const marca = obterMarca(candidato);

  return {
    id: numero(candidato.id_produto, candidato.produto_id, candidato.id) ?? 0,
    nome:
      texto(candidato.nome, candidato.nome_produto, candidato.titulo) ||
      "Produto sem nome",
    slug: texto(candidato.slug),
    descricao: texto(
      candidato.descricao,
      candidato.descricao_completa,
      candidato.detalhes,
    ),
    descricaoCurta: texto(
      candidato.descricao_curta,
      candidato.resumo,
      candidato.subtitulo,
    ),
    sku: texto(candidato.sku, candidato.referencia, candidato.codigo),
    preco: preco ?? 0,
    precoPromocional:
      promocional !== null && promocional > 0 && promocional < (preco ?? 0)
        ? promocional
        : null,
    estoque,
    marca: marca.nome,
    marcaDescricao: marca.descricao,
    categoria: obterCategoria(candidato),
    imagens: obterListaImagens(candidato),
    atributos: obterAtributos(candidato),
    ativo: booleano(candidato.ativo, true),
    controlarEstoque: booleano(candidato.controlar_estoque, false),
    permitirVendaSemEstoque: booleano(
      candidato.permitir_venda_sem_estoque,
      false,
    ),
  };
}

function extrairProduto(resposta: unknown, slugEsperado: string): Produto {
  const raiz = registro(resposta);
  if (!raiz) {
    throw new Error("Não foi possível interpretar a resposta da API.");
  }

  if (raiz.sucesso === false) {
    throw new Error(
      texto(raiz.mensagem, raiz.message) || "Produto não encontrado.",
    );
  }

  const dados = registro(raiz.dados);
  const data = registro(raiz.data);
  const dadosInternos = registro(dados?.dados);
  const dataInterna = registro(data?.data);
  const dadosDaData = registro(data?.dados);

  // A listagem pública retorna exatamente dados.produtos: [...]. A rota de
  // detalhe pode retornar dados.produto ou o próprio registro em dados.
  const listas = [
    dados?.produtos,
    data?.produtos,
    dadosInternos?.produtos,
    dataInterna?.produtos,
    dadosDaData?.produtos,
    raiz.produtos,
  ].filter(Array.isArray) as unknown[][];

  for (const lista of listas) {
    const produtos = lista
      .map(registro)
      .filter((item): item is Registro => item !== null);
    const encontrado = produtos.find(
      (item) =>
        texto(item.slug).toLocaleLowerCase("pt-BR") ===
        slugEsperado.toLocaleLowerCase("pt-BR"),
    );
    if (encontrado) return normalizarProduto(encontrado);
  }

  const candidatos = [
    dados?.produto,
    raiz.produto,
    data?.produto,
    dadosInternos?.produto,
    dataInterna?.produto,
    dadosDaData?.produto,
    dados,
    data,
    raiz,
  ];

  const produto = candidatos.map(registro).find((item): item is Registro => {
    if (!item) return false;
    const possuiIdentificador =
      item.id_produto !== undefined || item.produto_id !== undefined;
    const possuiNomeESlug =
      Boolean(texto(item.nome, item.nome_produto)) && Boolean(texto(item.slug));
    return possuiIdentificador || possuiNomeESlug;
  });

  if (produto) {
    const slugRetornado = texto(produto.slug);
    if (slugRetornado && slugEsperado && slugRetornado !== slugEsperado) {
      throw new Error("A API retornou outro produto, diferente do solicitado.");
    }
    return normalizarProduto(produto);
  }

  throw new Error("O produto solicitado não foi encontrado no retorno da API.");
}

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// =====================================================
// PÁGINA DE DETALHES DO PRODUTO
// =====================================================

export default function ProdutoDetalhePage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  const [produto, setProduto] = useState<Produto | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [imagemSelecionada, setImagemSelecionada] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [adicionando, setAdicionando] = useState(false);
  const [adicionadoAoCarrinho, setAdicionadoAoCarrinho] = useState(false);
  const [favorito, setFavorito] = useState(false);

  const carregarProduto = useCallback(async () => {
    if (!slug) {
      setErro("Não foi possível identificar o produto.");
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro("");

    try {
      let produtoCarregado: Produto;

      try {
        const respostaDetalhe = await conexao.get(
          ROTAS.PRODUTOS.BUSCAR_POR_SLUG(slug),
        );
        produtoCarregado = extrairProduto(respostaDetalhe.data, slug);
      } catch (erroDetalhe) {
        // Se o endpoint individual ainda retornar um envelope diferente, a
        // listagem pública /produtos permite localizar o mesmo slug com segurança.
        console.warn(
          "[PRODUTO] A busca por slug não trouxe um registro reconhecível; tentando a listagem pública.",
          erroDetalhe,
        );
        const respostaLista = await conexao.get(ROTAS.PRODUTOS.LISTAR);
        produtoCarregado = extrairProduto(respostaLista.data, slug);
      }

      if (!produtoCarregado.ativo) {
        throw new Error("Este produto não está disponível no momento.");
      }

      setProduto(produtoCarregado);
      setImagemSelecionada(0);
      setQuantidade(1);
      setAdicionadoAoCarrinho(false);
    } catch (falha: unknown) {
      console.error("[PRODUTO] Erro ao carregar:", falha);

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
          "Não foi possível carregar este produto.",
      );
    } finally {
      setCarregando(false);
    }
  }, [slug]);

  useEffect(() => {
    void carregarProduto();
  }, [carregarProduto]);

  const imagemAtual = useMemo(
    () => produto?.imagens[imagemSelecionada]?.url ?? "",
    [produto, imagemSelecionada],
  );

  const possuiEstoque =
    produto !== null &&
    (produto.estoque === null ||
      produto.estoque === undefined ||
      produto.estoque > 0 ||
      produto.permitirVendaSemEstoque);

  const adicionarAoCarrinho = async () => {
    if (!produto || adicionando || !possuiEstoque) return;

    if (!Number.isInteger(produto.id) || produto.id <= 0) {
      const mensagem =
        "Não foi possível identificar este produto para o carrinho.";
      setAdicionadoAoCarrinho(false);
      toast.error(mensagem);
      return;
    }

    const precoUnitario = produto.precoPromocional ?? produto.preco;
    if (!Number.isFinite(precoUnitario) || precoUnitario < 0) {
      const mensagem = "O preço deste produto não está disponível para compra.";
      setAdicionadoAoCarrinho(false);
      toast.error(mensagem);
      return;
    }

    setAdicionando(true);
    setAdicionadoAoCarrinho(false);

    try {
      // Usa o serviço oficial: ele envia identificador_sessao, produto_id,
      // variacao_id, quantidade e preco_unitario no formato esperado pelo PHP.
      const resumo = await CarrinhoService.adicionar({
        produto_id: produto.id,
        variacao_id: null,
        quantidade,
        preco_unitario: precoUnitario,
      });

      const totalItens = Number(resumo?.total_itens);
      setAdicionadoAoCarrinho(true);

      const quantidadeTexto = `${quantidade} ${quantidade === 1 ? "unidade" : "unidades"}`;
      const totalTexto =
        Number.isFinite(totalItens) && totalItens > 0
          ? ` Carrinho: ${totalItens} ${totalItens === 1 ? "item" : "itens"}.`
          : "";

      toast.success(
        `${quantidadeTexto} de ${produto.nome} adicionada${quantidade === 1 ? "" : "s"} ao carrinho!${totalTexto}`,
      );
    } catch (falha: unknown) {
      console.error("[CARRINHO] Erro ao adicionar produto:", falha);

      const erro = registro(falha);
      const resposta = registro(erro?.response);
      const dadosErro = registro(resposta?.data);
      const dadosInternos = registro(dadosErro?.dados);
      const mensagem = texto(
        dadosErro?.mensagem,
        dadosErro?.message,
        dadosErro?.erro,
        dadosInternos?.mensagem,
        dadosInternos?.message,
        erro?.message,
      );

      const mensagemErro =
        mensagem ||
        "Não foi possível adicionar o produto ao carrinho. Tente novamente.";

      setAdicionadoAoCarrinho(false);
      toast.error(mensagemErro);
    } finally {
      setAdicionando(false);
    }
  };

  const alterarQuantidade = (delta: number) => {
    setAdicionadoAoCarrinho(false);

    setQuantidade((atual) => {
      const limite =
        produto?.estoque !== null &&
        produto?.estoque !== undefined &&
        produto.estoque > 0
          ? produto.estoque
          : 99;

      return Math.min(limite, Math.max(1, atual + delta));
    });
  };

  // ===================================================
  // CARREGAMENTO
  // ===================================================

  if (carregando) {
    return (
      <main className="produto-detalhe" aria-busy="true">
        <div className="produto-detalhe__container">
          <div className="produto-detalhe__esqueleto">
            <div className="produto-detalhe__esqueleto-imagem" />
            <div className="produto-detalhe__esqueleto-info">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ===================================================
  // ERRO / PRODUTO NÃO ENCONTRADO
  // ===================================================

  if (erro || !produto) {
    return (
      <main className="produto-detalhe">
        <div className="produto-detalhe__container">
          <div className="produto-detalhe__estado" role="alert">
            <span className="produto-detalhe__estado-codigo">404</span>
            <h1>Não encontramos este produto</h1>
            <p>
              {erro ||
                "O produto pode ter sido removido ou não está disponível."}
            </p>

            <div className="produto-detalhe__estado-acoes">
              <button type="button" onClick={() => void carregarProduto()}>
                Tentar novamente
              </button>
              <Link href="/">Voltar para a loja</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ===================================================
  // PRODUTO
  // ===================================================

  const percentualDesconto =
    produto.precoPromocional && produto.preco > 0
      ? Math.round(
          ((produto.preco - produto.precoPromocional) / produto.preco) * 100,
        )
      : 0;
  const precoUnitario = produto.precoPromocional ?? produto.preco;
  const totalSelecionado = precoUnitario * quantidade;

  return (
    <main className="produto-detalhe">
      <div className="produto-detalhe__container">
        {/* CAMINHO DE NAVEGAÇÃO */}

        <nav
          className="produto-detalhe__breadcrumb"
          aria-label="Navegação estrutural"
        >
          <Link href="/">Início</Link>
          {produto.categoria && (
            <>
              <span>/</span>
              <span>{produto.categoria}</span>
            </>
          )}
          <span>/</span>
          <strong>{produto.nome}</strong>
        </nav>

        {/* CONTEÚDO PRINCIPAL */}

        <div className="produto-detalhe__principal">
          {/* GALERIA */}

          <section
            className="produto-detalhe__galeria"
            aria-label="Imagens do produto"
          >
            <div className="produto-detalhe__imagem-principal">
              {imagemAtual ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagemAtual} alt={produto.nome} />
              ) : (
                <div className="produto-detalhe__imagem-vazia">
                  <ShoppingBag size={58} strokeWidth={1.2} />
                  <span>Imagem não disponível</span>
                </div>
              )}

              {percentualDesconto > 0 && (
                <span className="produto-detalhe__desconto">
                  -{percentualDesconto}%
                </span>
              )}

              <button
                type="button"
                className={`produto-detalhe__favorito ${favorito ? "ativo" : ""}`}
                onClick={() => setFavorito((atual) => !atual)}
                aria-label={
                  favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"
                }
                aria-pressed={favorito}
              >
                <Heart size={20} fill={favorito ? "currentColor" : "none"} />
              </button>
            </div>

            {produto.imagens.length > 1 && (
              <div
                className="produto-detalhe__miniaturas"
                aria-label="Escolher imagem"
              >
                {produto.imagens.map((imagem, indice) => (
                  <button
                    type="button"
                    key={imagem.id ?? imagem.url}
                    className={
                      indice === imagemSelecionada
                        ? "produto-detalhe__miniatura ativa"
                        : "produto-detalhe__miniatura"
                    }
                    onClick={() => setImagemSelecionada(indice)}
                    aria-label={`Ver imagem ${indice + 1}`}
                    aria-pressed={indice === imagemSelecionada}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagem.url}
                      alt={imagem.alt || `${produto.nome} ${indice + 1}`}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* INFORMAÇÕES */}

          <section className="produto-detalhe__informacoes">
            {(produto.marca || produto.categoria) && (
              <div className="produto-detalhe__marcas">
                {produto.marca && (
                  <span className="produto-detalhe__marca">
                    {produto.marca}
                  </span>
                )}
                {produto.marca && produto.categoria && (
                  <span
                    className="produto-detalhe__separador"
                    aria-hidden="true"
                  >
                    •
                  </span>
                )}
                {produto.categoria && (
                  <span className="produto-detalhe__categoria">
                    {produto.categoria}
                  </span>
                )}
              </div>
            )}

            <h1>{produto.nome}</h1>

            {produto.descricaoCurta && (
              <p className="produto-detalhe__resumo">
                {produto.descricaoCurta}
              </p>
            )}

            {produto.sku && (
              <p className="produto-detalhe__referencia">
                Referência: <strong>{produto.sku}</strong>
              </p>
            )}

            <div className="produto-detalhe__precos">
              {produto.precoPromocional ? (
                <>
                  <span className="produto-detalhe__preco-antigo">
                    {moeda(produto.preco)}
                  </span>
                  <strong className="produto-detalhe__preco-atual">
                    {moeda(produto.precoPromocional)}
                  </strong>
                  <span className="produto-detalhe__economia">
                    Você economiza{" "}
                    {moeda(produto.preco - produto.precoPromocional)}
                  </span>
                </>
              ) : (
                <strong className="produto-detalhe__preco-atual">
                  {moeda(produto.preco)}
                </strong>
              )}
            </div>

            <div className="produto-detalhe__disponibilidade">
              <span className={possuiEstoque ? "disponivel" : "indisponivel"}>
                <span />
                {produto.estoque === null && produto.controlarEstoque
                  ? "Disponibilidade sob consulta"
                  : produto.estoque === 0 && produto.permitirVendaSemEstoque
                    ? "Venda disponível sob encomenda"
                    : possuiEstoque
                      ? "Disponível para compra"
                      : "Produto indisponível"}
              </span>

              {produto.estoque !== null && produto.estoque > 0 && (
                <small>{produto.estoque} unidade(s) em estoque</small>
              )}
            </div>

            <div className="produto-detalhe__resumo-compra">
              <span>
                {quantidade} {quantidade === 1 ? "unidade" : "unidades"}
              </span>
              <strong>{moeda(totalSelecionado)}</strong>
            </div>

            <div className="produto-detalhe__compra">
              <div
                className="produto-detalhe__quantidade"
                aria-label="Quantidade"
              >
                <button
                  type="button"
                  onClick={() => alterarQuantidade(-1)}
                  disabled={quantidade <= 1 || adicionando}
                  aria-label="Diminuir quantidade"
                >
                  <Minus size={16} />
                </button>

                <output aria-live="polite">{quantidade}</output>

                <button
                  type="button"
                  onClick={() => alterarQuantidade(1)}
                  disabled={
                    adicionando ||
                    quantidade >=
                      (produto.estoque !== null && produto.estoque > 0
                        ? produto.estoque
                        : 99)
                  }
                  aria-label="Aumentar quantidade"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                type="button"
                className="produto-detalhe__adicionar"
                onClick={() => void adicionarAoCarrinho()}
                disabled={!possuiEstoque || adicionando || produto.id <= 0}
                aria-busy={adicionando}
              >
                {adicionadoAoCarrinho ? (
                  <Check size={18} />
                ) : (
                  <ShoppingBag size={18} />
                )}
                {adicionando
                  ? "Adicionando..."
                  : adicionadoAoCarrinho
                    ? "Adicionar novamente"
                    : "Adicionar ao carrinho"}
              </button>
            </div>

            <div className="produto-detalhe__garantias">
              <div>
                <Truck size={19} />
                <span>Consulte as opções de entrega no carrinho</span>
              </div>
              <div>
                <ShieldCheck size={19} />
                <span>Compra processada em ambiente seguro</span>
              </div>
              <div>
                <Check size={19} />
                <span>Informações do produto fornecidas pela loja</span>
              </div>
            </div>
          </section>
        </div>

        {/* DESCRIÇÃO E ATRIBUTOS */}

        <section className="produto-detalhe__complementos">
          <div className="produto-detalhe__bloco">
            <div className="produto-detalhe__bloco-cabecalho">
              <span>Conheça melhor</span>
              <h2>Sobre o produto</h2>
            </div>

            {produto.descricao ? (
              <p className="produto-detalhe__descricao">{produto.descricao}</p>
            ) : (
              <p className="produto-detalhe__descricao produto-detalhe__texto-vazio">
                Ainda não há uma descrição adicional cadastrada para este
                produto.
              </p>
            )}

            {produto.marcaDescricao && (
              <div className="produto-detalhe__sobre-marca">
                <span>Sobre a marca</span>
                <strong>{produto.marca}</strong>
                <p>{produto.marcaDescricao}</p>
              </div>
            )}
          </div>

          <div className="produto-detalhe__bloco produto-detalhe__bloco-atributos">
            <div className="produto-detalhe__bloco-cabecalho">
              <span>Detalhes</span>
              <h2>Características do produto</h2>
            </div>

            {produto.atributos.length > 0 ? (
              <dl className="produto-detalhe__atributos">
                {produto.atributos.map((atributo, indice) => (
                  <div key={atributo.id ?? `${atributo.nome}-${indice}`}>
                    <dt>{atributo.nome}</dt>
                    <dd>{atributo.valor}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="produto-detalhe__texto-vazio">
                As características deste produto ainda não foram cadastradas.
              </p>
            )}
          </div>
        </section>

        <div className="produto-detalhe__voltar">
          <Link href="/">
            <ArrowLeft size={16} />
            Continuar explorando a loja
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}
