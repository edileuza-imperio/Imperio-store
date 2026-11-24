"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from "react";

import ROTAS from "@/app/constants/rotas";
import CarrinhoService, {
  type ItemCarrinhoApi,
  type ResumoCarrinho,
} from "@/Services/Carrinho/CarrinhoService";
import conexao from "@/Services/Conexao/Conexao";
import ImagemService from "@/Services/Imagem/ImagemService";

import {
  ArrowLeft,
  ArrowRight,
  Gift,
  Info,
  Loader2,
  LockKeyhole,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";

// TIPOS
// =====================================================

type ItemCarrinho = {
  id: string;
  id_item: number;
  carrinho_id: number;
  produto_id: number | null;
  variacao_id: number | null;
  slug: string;
  nome: string;
  sku: string;
  imagem: string | null;
  preco: number | null;
  quantidade: number;
};

type Registro = Record<string, unknown>;

type CupomAplicado = {
  codigo: string;
  tipo: "percentual" | "fixo" | "frete_gratis";
  valor: number;
  desconto: number;
  subtotalBase: number;
};

const CHAVE_CUPOM_APLICADO = "universo-imperio:cupom-aplicado:v1";
const CHAVE_CARRINHO = "universo-imperio:carrinho:v1";
const EVENTO_CARRINHO = "universo-imperio:carrinho:atualizado";

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

function ehObjeto(valor: unknown): valor is Registro {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function paraNumero(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return valor;
  }

  if (typeof valor !== "string" || !valor.trim()) {
    return null;
  }

  let normalizado = valor.replace(/[^\d,.-]/g, "");

  if (normalizado.includes(",")) {
    normalizado = normalizado.replace(/\./g, "").replace(",", ".");
  }

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : null;
}

function primeiraString(...valores: unknown[]): string {
  for (const valor of valores) {
    if (typeof valor === "string" && valor.trim()) {
      return valor.trim();
    }

    if (typeof valor === "number" && Number.isFinite(valor)) {
      return String(valor);
    }
  }

  return "";
}

// =====================================================
// IMAGENS
// =====================================================

function resolverImagemProduto(produto: Registro | null): string | null {
  if (!produto) return null;

  const imagens = Array.isArray(produto.imagens)
    ? produto.imagens
    : Array.isArray(produto.galeria)
      ? produto.galeria
      : Array.isArray(produto.fotos)
        ? produto.fotos
        : [];

  const principal = imagens.find((imagem) => {
    if (!ehObjeto(imagem)) return false;

    return (
      imagem.principal === true ||
      imagem.is_principal === true ||
      imagem.imagem_principal === true ||
      imagem.principal === 1 ||
      imagem.is_principal === 1
    );
  });

  const candidatos: unknown[] = [
    principal,
    ...imagens,
    produto.imagem_principal,
    produto.imagem_url,
    produto.url_imagem,
    produto.imagem,
    produto.foto,
    produto.capa,
  ];

  for (const candidato of candidatos) {
    let caminho = "";

    if (typeof candidato === "string") {
      caminho = candidato.trim();
    } else if (ehObjeto(candidato)) {
      caminho = primeiraString(
        candidato.imagem_url,
        candidato.url,
        candidato.caminho,
        candidato.arquivo,
        candidato.path,
        candidato.nome_arquivo,
      );
    }

    if (!caminho) continue;

    const url =
      ImagemService.produto(caminho) || ImagemService.resolver(caminho);

    if (url) return url;
  }

  return null;
}

// =====================================================
// DETALHES DO PRODUTO
// =====================================================

function extrairRegistroProduto(payloadBruto: unknown): Registro | null {
  let payload = payloadBruto;

  if (ehObjeto(payload) && "data" in payload) {
    payload = payload.data;
  }

  if (typeof payload === "string") {
    const inicio = payload.indexOf("{");
    const fim = payload.lastIndexOf("}");

    if (inicio < 0 || fim <= inicio) {
      return null;
    }

    try {
      payload = JSON.parse(payload.slice(inicio, fim + 1));
    } catch {
      return null;
    }
  }

  if (!ehObjeto(payload)) return null;

  const fila: unknown[] = [payload];
  const visitados = new Set<object>();

  while (fila.length > 0) {
    const atual = fila.shift();

    if (!ehObjeto(atual) || visitados.has(atual)) {
      continue;
    }

    visitados.add(atual);

    const temIdentificador =
      "id_produto" in atual ||
      "produto_id" in atual ||
      ("id" in atual && ("nome" in atual || "nome_produto" in atual));

    const temNome =
      "nome" in atual || "nome_produto" in atual || "titulo" in atual;

    if (temIdentificador || temNome) {
      return atual;
    }

    for (const chave of ["dados", "data", "produto", "resultado", "item"]) {
      const filho = atual[chave];

      if (ehObjeto(filho)) {
        fila.push(filho);
      }
    }
  }

  return null;
}

async function buscarDetalheProduto(
  produtoId: number,
): Promise<Registro | null> {
  try {
    const resposta = await conexao.get<unknown>(
      ROTAS.PRODUTOS.BUSCAR_POR_ID(produtoId),
    );

    return extrairRegistroProduto(resposta.data);
  } catch (erro) {
    console.warn(
      `[CARRINHO] Não foi possível carregar o produto ${produtoId}:`,
      erro,
    );

    return null;
  }
}

// =====================================================
// METADADOS LOCAIS
// =====================================================

function lerMetadadosLocais(): ItemCarrinho[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const salvo = window.localStorage.getItem(CHAVE_CARRINHO);

    if (!salvo) return [];

    const dados: unknown = JSON.parse(salvo);

    if (!Array.isArray(dados)) {
      return [];
    }

    return dados.filter(ehObjeto).map((item, indice) => {
      const produtoId = paraNumero(item.produto_id);
      const idItem = paraNumero(item.id_item) ?? indice + 1;

      return {
        id: String(item.id ?? produtoId ?? `local-${indice}`),
        id_item: idItem,
        carrinho_id: paraNumero(item.carrinho_id) ?? 0,
        produto_id: produtoId,
        variacao_id: paraNumero(item.variacao_id),
        slug: primeiraString(item.slug),
        nome: primeiraString(item.nome, item.titulo),
        sku: primeiraString(item.sku),
        imagem: primeiraString(item.imagem) || null,
        preco: paraNumero(item.preco),
        quantidade: Math.max(1, Math.floor(paraNumero(item.quantidade) ?? 1)),
      } satisfies ItemCarrinho;
    });
  } catch (erro) {
    console.warn("[CARRINHO] Erro ao ler metadados locais:", erro);

    return [];
  }
}

// =====================================================
// MAPEAR ITENS DA API
// =====================================================

function mapearItensDaApi(
  resumo: ResumoCarrinho,
  detalhes: Map<number, Registro>,
  anteriores: ItemCarrinho[] = [],
): ItemCarrinho[] {
  const cacheLocal = lerMetadadosLocais();

  return resumo.itens.map((item: ItemCarrinhoApi, indice) => {
    const produtoId = paraNumero(item.produto_id);
    const idItem = paraNumero(item.id_item) ?? indice + 1;

    const detalhe =
      produtoId !== null ? (detalhes.get(produtoId) ?? null) : null;

    const anterior = anteriores.find(
      (atual) =>
        atual.id_item === idItem ||
        (produtoId !== null && atual.produto_id === produtoId),
    );

    const local = cacheLocal.find(
      (atual) => produtoId !== null && atual.produto_id === produtoId,
    );

    const quantidade = Math.max(
      1,
      Math.floor(paraNumero(item.quantidade) ?? 1),
    );

    const nome =
      primeiraString(
        item.nome,
        item.titulo,
        detalhe?.nome,
        detalhe?.nome_produto,
        detalhe?.titulo,
        anterior?.nome,
        local?.nome,
      ) || `Produto #${produtoId ?? idItem}`;

    const caminhoImagem = primeiraString(
      item.imagem,
      item.imagem_url,
      detalhe?.imagem_principal,
      detalhe?.imagem_url,
      detalhe?.url_imagem,
      detalhe?.imagem,
      detalhe?.foto,
      detalhe?.capa,
    );

    const imagem =
      (caminhoImagem
        ? ImagemService.produto(caminhoImagem) ||
          ImagemService.resolver(caminhoImagem)
        : null) ||
      resolverImagemProduto(detalhe) ||
      anterior?.imagem ||
      local?.imagem ||
      null;

    return {
      id: String(idItem),
      id_item: idItem,
      carrinho_id: paraNumero(item.carrinho_id) ?? resumo.carrinho.id_carrinho,
      produto_id: produtoId,
      variacao_id: paraNumero(item.variacao_id),
      slug: primeiraString(
        item.slug,
        detalhe?.slug,
        anterior?.slug,
        local?.slug,
      ),
      nome,
      sku: primeiraString(
        item.sku,
        detalhe?.sku,
        detalhe?.referencia,
        detalhe?.codigo,
        anterior?.sku,
        local?.sku,
      ),
      imagem,
      preco:
        paraNumero(item.preco_unitario) ??
        paraNumero(item.preco) ??
        anterior?.preco ??
        local?.preco ??
        null,
      quantidade,
    };
  });
}

// =====================================================
// ENRIQUECER ITENS
// =====================================================

async function enriquecerItensDoCarrinho(
  resumo: ResumoCarrinho,
  anteriores: ItemCarrinho[] = [],
): Promise<ItemCarrinho[]> {
  const ids = Array.from(
    new Set(
      resumo.itens
        .map((item) => paraNumero(item.produto_id))
        .filter((id): id is number => id !== null && id > 0),
    ),
  );

  const detalhes = new Map<number, Registro>();

  await Promise.all(
    ids.map(async (id) => {
      const detalhe = await buscarDetalheProduto(id);

      if (detalhe) {
        detalhes.set(id, detalhe);
      }
    }),
  );

  return mapearItensDaApi(resumo, detalhes, anteriores);
}

// =====================================================
// SALVAR METADADOS LOCAIS
// =====================================================

function persistirMetadados(itens: ItemCarrinho[]): void {
  if (typeof window === "undefined") return;

  try {
    const metadados = itens.map((item) => ({
      id: String(item.produto_id ?? item.id),
      produto_id: item.produto_id,
      slug: item.slug,
      nome: item.nome,
      sku: item.sku,
      imagem: item.imagem,
      preco: item.preco,
      quantidade: item.quantidade,
    }));

    window.localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(metadados));

    window.dispatchEvent(
      new CustomEvent(EVENTO_CARRINHO, {
        detail: { itens },
      }),
    );
  } catch (erro) {
    console.warn("[CARRINHO] Não foi possível salvar metadados:", erro);
  }
}

// =====================================================
// FORMATAÇÃO
// =====================================================

function moeda(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

// =====================================================

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function CarrinhoPage() {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarrinho, setErroCarrinho] = useState("");
  const [processandoItemId, setProcessandoItemId] = useState<string | null>(
    null,
  );

  // Evita operações simultâneas antes da atualização do estado React.
  const operacaoEmAndamento = useRef(false);

  const [cupom, setCupom] = useState("");
  const [mensagemCupom, setMensagemCupom] = useState("");
  const [cupomAplicado, setCupomAplicado] = useState<CupomAplicado | null>(
    null,
  );
  const [validandoCupom, setValidandoCupom] = useState(false);

  const carregarCarrinho = useCallback(async () => {
    setCarregando(true);
    setErroCarrinho("");

    try {
      const resumo = await CarrinhoService.buscar();

      if (!resumo) {
        // Ausência de carrinho é normal para visitante novo ou após uma compra.
        // Não exibir "não encontrado": a interface deve mostrar a sacola vazia.
        console.info(
          "[CARRINHO] Nenhum carrinho aberto encontrado; exibindo estado vazio.",
        );
        setItens([]);
        persistirMetadados([]);
        setErroCarrinho("");
        return;
      }

      const carregados = await enriquecerItensDoCarrinho(resumo);
      setItens(carregados);
      persistirMetadados(carregados);
    } catch (erro) {
      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível carregar seu carrinho.";
      const mensagemNormalizada = mensagem.toLocaleLowerCase("pt-BR");

      // Proteção adicional para respostas PHP que sinalizam ausência no corpo
      // da resposta em vez de utilizar HTTP 404.
      const carrinhoAusente =
        mensagemNormalizada.includes("nenhum carrinho encontrado") ||
        mensagemNormalizada.includes("carrinho não encontrado") ||
        mensagemNormalizada.includes("carrinho nao encontrado") ||
        mensagemNormalizada.includes("não existe carrinho aberto") ||
        mensagemNormalizada.includes("nao existe carrinho aberto");

      if (carrinhoAusente) {
        console.info(
          "[CARRINHO] A API informou que não há carrinho aberto. Sacola vazia.",
        );
        setItens([]);
        persistirMetadados([]);
        setErroCarrinho("");
      } else {
        console.error("[CARRINHO] Falha ao carregar carrinho:", erro);
        setErroCarrinho(mensagem);
      }
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarCarrinho();
  }, [carregarCarrinho]);

  // Recupera o cupom ao voltar do checkout ou atualizar a página.
  useEffect(() => {
    try {
      const salvo = window.sessionStorage.getItem(CHAVE_CUPOM_APLICADO);
      if (!salvo) return;

      const dados: unknown = JSON.parse(salvo);
      if (!ehObjeto(dados)) return;

      const codigo = primeiraString(dados.codigo);
      const tipo = primeiraString(dados.tipo).toLowerCase();
      const valor = paraNumero(dados.valor);
      const subtotalBase = paraNumero(dados.subtotalBase);
      const desconto = paraNumero(dados.desconto) ?? 0;

      if (
        !codigo ||
        !["percentual", "fixo", "frete_gratis"].includes(tipo) ||
        valor === null ||
        subtotalBase === null
      ) {
        window.sessionStorage.removeItem(CHAVE_CUPOM_APLICADO);
        return;
      }

      setCupom(codigo);
      setCupomAplicado({
        codigo,
        tipo: tipo as CupomAplicado["tipo"],
        valor,
        desconto,
        subtotalBase,
      });
      setMensagemCupom(
        tipo === "frete_gratis"
          ? "Cupom de frete grátis mantido nesta compra."
          : `Cupom mantido. Desconto de ${moeda(desconto)}.`,
      );
    } catch (erro) {
      console.warn("[CARRINHO] Não foi possível recuperar o cupom:", erro);
      window.sessionStorage.removeItem(CHAVE_CUPOM_APLICADO);
    }
  }, []);

  useEffect(() => {
    const ouvirStorage = (evento: StorageEvent) => {
      if (evento.key === CHAVE_CARRINHO || evento.key === null) {
        void carregarCarrinho();
      }
    };

    window.addEventListener("storage", ouvirStorage);
    return () => window.removeEventListener("storage", ouvirStorage);
  }, [carregarCarrinho]);

  const alterarQuantidade = async (id: string, delta: number) => {
    const item = itens.find((atual) => atual.id === id);
    if (!item || operacaoEmAndamento.current) return;

    const quantidadeAtual = Number(item.quantidade);
    const novaQuantidade = Math.max(1, Math.min(9999, quantidadeAtual + delta));
    if (novaQuantidade === quantidadeAtual) return;

    operacaoEmAndamento.current = true;
    const itensAnteriores = itens;
    const itensOtimistas = itens.map((atual) =>
      atual.id_item === item.id_item
        ? { ...atual, quantidade: novaQuantidade }
        : atual,
    );

    setProcessandoItemId(id);
    setErroCarrinho("");
    setItens(itensOtimistas);
    persistirMetadados(itensOtimistas);

    try {
      await CarrinhoService.alterarQuantidade(item.id_item, novaQuantidade);

      const resumoAtualizado = await CarrinhoService.buscar();
      if (!resumoAtualizado) {
        throw new Error("A API não retornou o carrinho após a atualização.");
      }

      const atualizados = await enriquecerItensDoCarrinho(
        resumoAtualizado,
        itensOtimistas,
      );
      setItens(atualizados);
      persistirMetadados(atualizados);
    } catch (erro) {
      setItens(itensAnteriores);
      persistirMetadados(itensAnteriores);
      console.error("[CARRINHO] Falha ao alterar quantidade:", erro);

      const mensagem =
        erro instanceof Error
          ? erro.message
          : "Não foi possível alterar a quantidade.";

      setErroCarrinho(
        mensagem.toLowerCase().includes("network error")
          ? "Não foi possível atualizar a quantidade. Confira a rota PUT e o CORS da API."
          : mensagem,
      );
    } finally {
      operacaoEmAndamento.current = false;
      setProcessandoItemId(null);
    }
  };

  const removerItem = async (id: string) => {
    const item = itens.find((atual) => atual.id === id);
    if (!item || operacaoEmAndamento.current) return;

    operacaoEmAndamento.current = true;
    setProcessandoItemId(id);
    setErroCarrinho("");

    try {
      const resumo = await CarrinhoService.remover(item.id_item);
      const atualizados = await enriquecerItensDoCarrinho(resumo, itens);
      setItens(atualizados);
      persistirMetadados(atualizados);
    } catch (erro) {
      console.error("[CARRINHO] Falha ao remover produto:", erro);
      setErroCarrinho(
        erro instanceof Error
          ? erro.message
          : "Não foi possível remover o produto.",
      );
    } finally {
      operacaoEmAndamento.current = false;
      setProcessandoItemId(null);
    }
  };

  const subtotal = useMemo(
    () =>
      itens.reduce(
        (total, item) => total + (item.preco ?? 0) * item.quantidade,
        0,
      ),
    [itens],
  );

  const quantidadeTotal = useMemo(
    () => itens.reduce((total, item) => total + item.quantidade, 0),
    [itens],
  );

  const possuiPrecoIndisponivel = itens.some((item) => item.preco === null);

  function removerCupom() {
    setCupomAplicado(null);
    setCupom("");
    setMensagemCupom("Cupom removido da compra.");
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(CHAVE_CUPOM_APLICADO);
    }
  }

  async function aplicarCupom(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    const codigo = cupom.trim().toUpperCase();

    if (!codigo) {
      setMensagemCupom("Digite o código do cupom.");
      return;
    }

    if (itens.length === 0) {
      setMensagemCupom(
        "Adicione um produto ao carrinho antes de aplicar um cupom.",
      );
      return;
    }

    if (possuiPrecoIndisponivel) {
      setMensagemCupom(
        "Não foi possível validar o cupom porque há produto sem preço.",
      );
      return;
    }

    setValidandoCupom(true);
    setMensagemCupom("");

    try {
      const resposta = await conexao.post<unknown>(ROTAS.CUPONS.VALIDAR, {
        codigo,
        valor_compra: Number(subtotal.toFixed(2)),
      });

      let payload: unknown = resposta.data;

      // Algumas configurações de API podem encapsular a resposta em "data".
      if (ehObjeto(payload) && ehObjeto(payload.data)) {
        payload = payload.data;
      }

      if (!ehObjeto(payload)) {
        throw new Error(
          "A API retornou uma resposta inválida ao validar o cupom.",
        );
      }

      if (payload.sucesso === false) {
        throw new Error(
          primeiraString(payload.mensagem) ||
            "Este cupom não pôde ser aplicado.",
        );
      }

      const dadosCupom = ehObjeto(payload.dados) ? payload.dados : null;

      if (!dadosCupom) {
        throw new Error(
          primeiraString(payload.mensagem) ||
            "A API não retornou os dados do cupom validado.",
        );
      }

      const tipo = primeiraString(dadosCupom.tipo).toLowerCase();
      const valor = paraNumero(dadosCupom.valor);
      const codigoConfirmado = primeiraString(dadosCupom.codigo) || codigo;

      if (
        !["percentual", "fixo", "frete_gratis"].includes(tipo) ||
        valor === null
      ) {
        throw new Error(
          "O cupom foi recebido, mas a API não retornou um tipo e valor de desconto reconhecidos.",
        );
      }

      let desconto = 0;

      if (tipo === "percentual") {
        desconto = (subtotal * valor) / 100;
      } else if (tipo === "fixo") {
        desconto = Math.min(subtotal, valor);
      }

      desconto = Number(Math.max(0, desconto).toFixed(2));

      const aplicado: CupomAplicado = {
        codigo: codigoConfirmado,
        tipo: tipo as CupomAplicado["tipo"],
        valor,
        desconto,
        subtotalBase: Number(subtotal.toFixed(2)),
      };

      setCupomAplicado(aplicado);
      setCupom(codigoConfirmado);
      setMensagemCupom(
        tipo === "frete_gratis"
          ? "Cupom validado! O benefício de frete grátis será considerado na etapa de entrega."
          : `Cupom aplicado com sucesso. Você economiza ${moeda(desconto)}.`,
      );

      // Mantém o código no fluxo da mesma aba para a próxima etapa.
      // O checkout deve validar novamente antes de fechar o pedido.
      window.sessionStorage.setItem(
        CHAVE_CUPOM_APLICADO,
        JSON.stringify({
          codigo: aplicado.codigo,
          tipo: aplicado.tipo,
          valor: aplicado.valor,
          desconto: aplicado.desconto,
          subtotalBase: aplicado.subtotalBase,
        }),
      );
    } catch (erro) {
      console.error("[CARRINHO] Falha ao validar cupom:", erro);

      const erroApi = erro as {
        response?: { data?: unknown };
        message?: string;
      };
      const corpoErro = erroApi.response?.data;
      const mensagemApi = ehObjeto(corpoErro)
        ? primeiraString(corpoErro.mensagem)
        : "";

      setCupomAplicado(null);
      window.sessionStorage.removeItem(CHAVE_CUPOM_APLICADO);
      setMensagemCupom(
        mensagemApi ||
          (erro instanceof Error
            ? erro.message
            : "Não foi possível validar o cupom. Tente novamente."),
      );
    } finally {
      setValidandoCupom(false);
    }
  }

  // Se a quantidade ou os produtos mudarem, o valor validado deixa de
  // corresponder ao carrinho. Exigimos uma nova validação do cupom.
  useEffect(() => {
    if (
      !carregando &&
      cupomAplicado &&
      Math.abs(cupomAplicado.subtotalBase - Number(subtotal.toFixed(2))) > 0.009
    ) {
      setCupomAplicado(null);
      setMensagemCupom("O carrinho foi alterado. Aplique o cupom novamente.");
      window.sessionStorage.removeItem(CHAVE_CUPOM_APLICADO);
    }
  }, [subtotal, cupomAplicado, carregando]);

  return (
    <main className="carrinho-page">
      <div className="carrinho-container">
        <nav className="carrinho-breadcrumb" aria-label="Navegação estrutural">
          <Link href="/">Início</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Meu carrinho</span>
        </nav>

        <header className="carrinho-header">
          <div className="carrinho-header__copy">
            <span className="carrinho-eyebrow">SUA COMPRA</span>
            <h1>Seu carrinho</h1>
            <p>
              Confira seus produtos e revise os detalhes antes de continuar.
            </p>
          </div>

          <ol className="carrinho-etapas" aria-label="Etapas da compra">
            <li className="is-active" aria-current="step">
              <span>01</span>
              <strong>Carrinho</strong>
            </li>
            <li>
              <span>02</span>
              <strong>Identificação</strong>
            </li>
            <li>
              <span>03</span>
              <strong>Pagamento</strong>
            </li>
          </ol>
        </header>

        {erroCarrinho && (
          <div className="carrinho-alerta" role="alert">
            <Info size={18} aria-hidden="true" />
            <p>{erroCarrinho}</p>
            <button type="button" onClick={() => void carregarCarrinho()}>
              Tentar novamente
            </button>
          </div>
        )}

        {carregando ? (
          <section
            className="carrinho-estado carrinho-estado--loading"
            aria-live="polite"
          >
            <span className="carrinho-spinner" aria-hidden="true" />
            <strong>Carregando seu carrinho</strong>
            <p>Estamos sincronizando seus produtos.</p>
          </section>
        ) : itens.length === 0 ? (
          <section className="carrinho-estado carrinho-estado--vazio">
            <div className="carrinho-estado__icone">
              <ShoppingBag size={34} strokeWidth={1.5} />
            </div>
            <span className="carrinho-eyebrow">SUA SACOLA ESTÁ VAZIA</span>
            <h2>Seu próximo favorito está esperando.</h2>
            <p>
              Explore a loja e descubra presentes, decoração e produtos
              especiais para você.
            </p>
            <Link
              href="/produtos"
              className="carrinho-botao carrinho-botao--primario"
            >
              Explorar produtos
              <ArrowRight size={17} />
            </Link>
            <Link href="/" className="carrinho-link-secundario">
              Voltar para o início
            </Link>
          </section>
        ) : (
          <div className="carrinho-layout">
            <section
              className="carrinho-conteudo"
              aria-label="Produtos no carrinho"
            >
              <div className="carrinho-section-heading">
                <div>
                  <span className="carrinho-section-heading__eyebrow">
                    REVISE SUA SELEÇÃO
                  </span>
                  <h2>Itens da sacola</h2>
                </div>
                <span className="carrinho-quantidade-total">
                  {quantidadeTotal} {quantidadeTotal === 1 ? "item" : "itens"}
                </span>
              </div>

              <div className="carrinho-lista">
                {itens.map((item) => {
                  const processando = processandoItemId === item.id;
                  const hrefProduto = item.slug
                    ? `/produto/${encodeURIComponent(item.slug)}`
                    : "/produtos";

                  return (
                    <article className="carrinho-item" key={item.id_item}>
                      <Link
                        href={hrefProduto}
                        className="carrinho-item__imagem"
                        aria-label={`Ver ${item.nome}`}
                      >
                        {item.imagem ? (
                          <img
                            src={item.imagem}
                            alt={item.nome}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <span className="carrinho-item__placeholder">
                            <Gift size={30} strokeWidth={1.4} />
                          </span>
                        )}
                      </Link>

                      <div className="carrinho-item__informacoes">
                        <span className="carrinho-item__marca">
                          UNIVERSO IMPÉRIO
                        </span>
                        <Link
                          href={hrefProduto}
                          className="carrinho-item__nome"
                        >
                          {item.nome}
                        </Link>
                        {item.sku && (
                          <span className="carrinho-item__sku">
                            Código: {item.sku}
                          </span>
                        )}
                      </div>

                      <div className="carrinho-item__controles">
                        <div className="carrinho-item__quantidade">
                          <span className="carrinho-campo-label">
                            Quantidade
                          </span>
                          <div
                            className="carrinho-seletor"
                            aria-busy={processando}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                void alterarQuantidade(item.id, -1)
                              }
                              disabled={
                                item.quantidade <= 1 ||
                                processandoItemId !== null
                              }
                              aria-label={`Diminuir quantidade de ${item.nome}`}
                              title="Diminuir quantidade"
                            >
                              <Minus size={14} />
                            </button>
                            <span
                              className="carrinho-seletor__valor"
                              aria-live="polite"
                            >
                              {processando ? (
                                <Loader2
                                  size={15}
                                  className="carrinho-girando"
                                />
                              ) : (
                                item.quantidade
                              )}
                            </span>
                            <button
                              type="button"
                              onClick={() => void alterarQuantidade(item.id, 1)}
                              disabled={
                                item.quantidade >= 9999 ||
                                processandoItemId !== null
                              }
                              aria-label={`Aumentar quantidade de ${item.nome}`}
                              title="Aumentar quantidade"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="carrinho-item__preco">
                          <span className="carrinho-campo-label">Subtotal</span>
                          <strong>
                            {item.preco === null
                              ? "Preço indisponível"
                              : moeda(item.preco * item.quantidade)}
                          </strong>
                          {item.preco !== null && item.quantidade > 1 && (
                            <small>{moeda(item.preco)} por unidade</small>
                          )}
                        </div>

                        <button
                          type="button"
                          className="carrinho-item__remover"
                          onClick={() => void removerItem(item.id)}
                          disabled={processandoItemId !== null}
                          aria-label={`Remover ${item.nome} do carrinho`}
                          title="Remover produto"
                        >
                          <Trash2 size={16} />
                          <span>Remover</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="carrinho-continuar">
                <Link href="/produtos">
                  <ArrowLeft size={16} />
                  Continuar comprando
                </Link>
                <span>
                  <LockKeyhole size={14} />
                  Seu carrinho é sincronizado com o servidor
                </span>
              </div>

              <form className="carrinho-cupom" onSubmit={aplicarCupom}>
                <div className="carrinho-cupom__icone">
                  <Tag size={20} />
                </div>
                <div className="carrinho-cupom__texto">
                  <strong>
                    {cupomAplicado ? "Cupom aplicado" : "Tem um cupom?"}
                  </strong>
                  <span>
                    {cupomAplicado
                      ? `Código ${cupomAplicado.codigo}`
                      : "Informe o código para consultar as condições."}
                  </span>
                  {mensagemCupom && (
                    <small
                      role="status"
                      aria-live="polite"
                      className={cupomAplicado ? "is-sucesso" : ""}
                    >
                      {mensagemCupom}
                    </small>
                  )}
                </div>
                <div className="carrinho-cupom__campo">
                  <input
                    value={cupom}
                    onChange={(evento: ChangeEvent<HTMLInputElement>) => {
                      setCupom(evento.target.value.toUpperCase());
                      setMensagemCupom("");
                      if (cupomAplicado) {
                        setCupomAplicado(null);
                        window.sessionStorage.removeItem(CHAVE_CUPOM_APLICADO);
                      }
                    }}
                    placeholder="Código do cupom"
                    aria-label="Código do cupom"
                    autoComplete="off"
                    disabled={validandoCupom || !!cupomAplicado}
                    maxLength={80}
                  />
                  {cupomAplicado ? (
                    <button type="button" onClick={removerCupom}>
                      Remover
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={validandoCupom || possuiPrecoIndisponivel}
                    >
                      {validandoCupom ? (
                        <>
                          <Loader2
                            size={15}
                            className="carrinho-cupom__spinner"
                          />
                          Validando
                        </>
                      ) : (
                        "Aplicar"
                      )}
                    </button>
                  )}
                </div>
              </form>
            </section>

            <aside className="carrinho-resumo" aria-label="Resumo do pedido">
              <div className="carrinho-resumo__topo">
                <span className="carrinho-eyebrow">SUA COMPRA</span>
                <h2>Resumo do pedido</h2>
                <span className="carrinho-resumo__itens">
                  {quantidadeTotal} {quantidadeTotal === 1 ? "item" : "itens"}{" "}
                  na sacola
                </span>
              </div>

              <div className="carrinho-resumo__linha">
                <span>Subtotal dos produtos</span>
                <strong>{moeda(subtotal)}</strong>
              </div>
              {cupomAplicado && cupomAplicado.desconto > 0 && (
                <div className="carrinho-resumo__linha carrinho-resumo__desconto">
                  <span>Desconto ({cupomAplicado.codigo})</span>
                  <strong>- {moeda(cupomAplicado.desconto)}</strong>
                </div>
              )}
              {cupomAplicado?.tipo === "frete_gratis" && (
                <div className="carrinho-resumo__linha carrinho-resumo__desconto">
                  <span>Benefício do cupom</span>
                  <strong>Frete grátis</strong>
                </div>
              )}
              {cupomAplicado && (
                <div className="carrinho-resumo__linha carrinho-resumo__desconto">
                  <span>Cupom aplicado</span>
                  <strong>{cupomAplicado.codigo}</strong>
                </div>
              )}
              <div className="carrinho-resumo__linha">
                <span>Frete</span>
                <strong className="is-pendente">
                  {cupomAplicado?.tipo === "frete_gratis"
                    ? "Grátis*"
                    : "A calcular"}
                </strong>
              </div>

              <div className="carrinho-resumo__aviso">
                <Info size={16} />
                <span>
                  O prazo e o valor da entrega serão calculados na próxima
                  etapa.
                </span>
              </div>

              <div className="carrinho-resumo__total">
                <span>Total parcial</span>
                <strong>
                  {moeda(
                    Math.max(0, subtotal - (cupomAplicado?.desconto ?? 0)),
                  )}
                </strong>
              </div>
              <p className="carrinho-resumo__nota">
                {possuiPrecoIndisponivel
                  ? "Há produto sem preço disponível. Confira o cadastro antes de finalizar."
                  : cupomAplicado?.tipo === "frete_gratis"
                    ? "Cupom de frete grátis aplicado. O benefício será revalidado e refletido no valor do frete na próxima etapa."
                    : cupomAplicado
                      ? "Desconto validado pela API. O checkout deverá confirmar novamente o cupom antes do pagamento."
                      : "Frete e eventuais descontos serão considerados na finalização."}
              </p>

              <Link
                href="/identificacao"
                className={`carrinho-botao carrinho-botao--checkout ${
                  possuiPrecoIndisponivel ? "is-disabled" : ""
                }`}
                aria-disabled={possuiPrecoIndisponivel}
                onClick={(evento: MouseEvent<HTMLAnchorElement>) => {
                  if (possuiPrecoIndisponivel) evento.preventDefault();
                }}
              >
                Continuar para identificação
                <ArrowRight size={17} />
              </Link>

              <div className="carrinho-resumo__seguranca">
                <div>
                  <ShieldCheck size={17} />
                  <span>Compra segura</span>
                </div>
                <div>
                  <LockKeyhole size={17} />
                  <span>Dados protegidos</span>
                </div>
              </div>

              <div className="carrinho-resumo__entrega">
                <Truck size={20} />
                <div>
                  <strong>Entrega para todo o Brasil</strong>
                  <span>Consulte prazo e valor na próxima etapa.</span>
                </div>
              </div>

              <p className="carrinho-resumo__ajuda">
                Precisa de ajuda? <Link href="/contato">Fale com a equipe</Link>
                .
              </p>
            </aside>
          </div>
        )}

        <section
          className="carrinho-confiança"
          aria-label="Informações da loja"
        >
          <div>
            <span>
              <ShieldCheck size={19} />
            </span>
            <div>
              <strong>Compra segura</strong>
              <small>Ambiente protegido</small>
            </div>
          </div>
          <div>
            <span>
              <PackageCheck size={19} />
            </span>
            <div>
              <strong>Produtos especiais</strong>
              <small>Escolhidos com cuidado</small>
            </div>
          </div>
          <div>
            <span>
              <Truck size={20} />
            </span>
            <div>
              <strong>Envio nacional</strong>
              <small>Entrega a calcular no checkout</small>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
