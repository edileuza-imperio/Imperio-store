"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Braces,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Eye,
  FileText,
  Image as ImageIcon,
  Layers,
  LoaderCircle,
  Package,
  Plus,
  Ruler,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import ROTAS from "@/app/constants/rotas";
import { Icone } from "@/components/Icons/Icones";
import conexao from "@/Services/Conexao/Conexao";

type Categoria = {
  id_categoria: number;
  nome: string;
  slug?: string;
  ativo?: boolean | number;
};

type Marca = {
  id_marca: number;
  nome: string;
  slug?: string;
  ativo?: boolean | number;
};

type LocalEstoque = {
  id_estoque_local: number;
  nome: string | null;
  codigo: string | null;
  ativo?: boolean | number | string | null;
};

type StatusEstoque = {
  id_status: number;
  grupo?: string | null;
  codigo?: string | null;
  nome?: string | null;
  ativo?: boolean | number | string | null;
};

type ConfiguracaoEstoqueInicial = {
  cadastrar: boolean;
  localId: number;
  statusId: number;
  variacaoId: number | null;
  quantidade: string;
  itemChave?: string;
};

type ImagemProduto = {
  id: number;
  arquivo: File;
  previewUrl: string;
  textoAlternativo: string;
  principal: boolean;
};

type ProdutoResposta = {
  sucesso?: boolean;
  mensagem?: string;
  status?: number;
  dados?: {
    id_produto?: number;
    produto?: { id_produto?: number };
  };
};

type Etapa = 1 | 2 | 3;

const FORMATOS_IMAGEM = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

function gerarSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 220);
}

function gerarSku(): string {
  return `PRD-${Date.now().toString().slice(-8)}`;
}

function decimalOuNull(valor: string): string | null {
  if (!valor.trim()) return null;
  return valor.replace(",", ".");
}

function extrairListaCategorias(payload: any): Categoria[] {
  const possibilidades = [
    payload?.dados?.categorias,
    payload?.dados?.dados,
    payload?.dados,
    payload?.categorias,
    payload?.data?.categorias,
    payload?.data?.dados,
    payload?.data,
    payload,
  ];
  return possibilidades.find(Array.isArray) ?? [];
}

function extrairListaMarcas(payload: any): Marca[] {
  const possibilidades = [
    payload?.dados?.marcas,
    payload?.dados?.dados,
    payload?.dados,
    payload?.marcas,
    payload?.data?.marcas,
    payload?.data?.dados,
    payload?.data,
    payload,
  ];
  return possibilidades.find(Array.isArray) ?? [];
}

function extrairListaApi<T>(payload: any, chave: string): T[] {
  const possibilidades = [
    payload?.[chave],
    payload?.dados?.[chave],
    payload?.dados?.dados?.[chave],
    payload?.data?.[chave],
    payload?.data?.dados?.[chave],
    payload?.dados,
    payload?.data,
    payload,
  ];
  return possibilidades.find(Array.isArray) ?? [];
}

function registroAtivo(
  valor: boolean | number | string | null | undefined,
): boolean {
  if (valor === undefined || valor === null) return true;
  return (
    valor === true ||
    valor === 1 ||
    String(valor).trim().toLowerCase() === "1" ||
    String(valor).trim().toLowerCase() === "true" ||
    String(valor).trim().toLowerCase() === "ativo" ||
    String(valor).trim().toLowerCase() === "sim"
  );
}

function gerarItemChaveEstoque(
  localId: number,
  produtoId: number,
  variacaoId: number | null,
): string {
  return `ESTOQUE-${localId}-PRODUTO-${produtoId}-VARIACAO-${variacaoId ?? 0}`;
}

function normalizarQuantidadeEstoque(valor: unknown): string {
  const numero = Number(
    String(valor ?? "0")
      .trim()
      .replace(",", "."),
  );
  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error(
      "A quantidade inicial precisa ser numérica e não pode ser negativa.",
    );
  }
  return numero.toFixed(3);
}

function mensagemDoErro(error: any, padrao: string): string {
  return (
    error?.response?.data?.mensagem ||
    error?.response?.data?.erro ||
    error?.response?.data?.message ||
    error?.message ||
    padrao
  );
}

function registrarLog(etapa: string, detalhes?: unknown) {
  console.info(`[UNIVERSO IMPÉRIO | PRODUTO] ${etapa}`, detalhes ?? "");
}

function registrarErro(etapa: string, error: any) {
  console.groupCollapsed(
    `%c[UNIVERSO IMPÉRIO | ERRO] ${etapa}`,
    "color:#e8799c;font-weight:bold",
  );
  console.error("Erro original:", error);
  console.error("Mensagem:", mensagemDoErro(error, "Erro desconhecido."));
  console.error("HTTP status:", error?.response?.status ?? "Sem resposta HTTP");
  console.error(
    "URL:",
    error?.config?.url ?? error?.response?.config?.url ?? "Não identificada",
  );
  console.error(
    "Método:",
    error?.config?.method ??
      error?.response?.config?.method ??
      "Não identificado",
  );
  console.error(
    "Resposta da API:",
    error?.response?.data ?? "Sem response.data",
  );
  console.error("Código:", error?.code ?? "Não informado");
  console.groupEnd();
}

function validarResposta(payload: any) {
  if (
    payload?.sucesso === false ||
    (typeof payload?.status === "number" && payload.status >= 400)
  ) {
    throw new Error(
      payload?.mensagem ||
        payload?.erro ||
        "Não foi possível completar a operação.",
    );
  }
}

function extrairIdProduto(payload: ProdutoResposta): number | null {
  const id = payload?.dados?.id_produto ?? payload?.dados?.produto?.id_produto;
  const numero = Number(id);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function gerarModeloProdutoJson(): string {
  return JSON.stringify(
    {
      status_id: 1,
      marca_id: null,
      sku: gerarSku(),
      nome: "Produto de exemplo",
      slug: "produto-de-exemplo",
      descricao: null,
      descricao_curta: null,
      preco: "49.90",
      preco_promocional: null,
      custo: null,
      peso: null,
      largura: null,
      altura: null,
      comprimento: null,
      controlar_estoque: true,
      permitir_venda_sem_estoque: false,
      estoque_inicial: {
        cadastrar: false,
        local_id: null,
        status_id: null,
        variacao_id: null,
        quantidade: "0.000",
      },
      destaque: false,
      ativo: true,
      seo_titulo: null,
      seo_descricao: null,
      categorias_ids: [],
    },
    null,
    2,
  );
}

export default function CadastrarProdutoPage() {
  const inputImagemRef = useRef<HTMLInputElement>(null);
  const proximoIdImagem = useRef(1);
  const urlsTemporarias = useRef<Set<string>>(new Set());

  const [modoCadastro, setModoCadastro] = useState<"formulario" | "json">(
    "formulario",
  );
  const [jsonCadastro, setJsonCadastro] = useState<string>(() =>
    gerarModeloProdutoJson(),
  );
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [nome, setNome] = useState("");
  const [sku, setSku] = useState(() => gerarSku());
  const [slug, setSlug] = useState("");
  const [descricaoCurta, setDescricaoCurta] = useState("");
  const [descricao, setDescricao] = useState("");

  const [preco, setPreco] = useState("");
  const [precoPromocional, setPrecoPromocional] = useState("");
  const [respostaPromocional, setRespostaPromocional] = useState<
    "sim" | "nao" | null
  >(null);
  const [custo, setCusto] = useState("");

  const [controlarEstoque, setControlarEstoque] = useState(true);
  const [permitirVendaSemEstoque, setPermitirVendaSemEstoque] = useState(false);
  const [cadastrarSaldoInicial, setCadastrarSaldoInicial] = useState(true);
  const [locaisEstoque, setLocaisEstoque] = useState<LocalEstoque[]>([]);
  const [statusEstoque, setStatusEstoque] = useState<StatusEstoque[]>([]);
  const [localEstoqueSelecionado, setLocalEstoqueSelecionado] = useState("");
  const [statusSaldoSelecionado, setStatusSaldoSelecionado] = useState("");
  const [quantidadeEstoqueInicial, setQuantidadeEstoqueInicial] =
    useState("0.000");
  const [carregandoEstoqueAuxiliar, setCarregandoEstoqueAuxiliar] =
    useState(true);
  const [erroEstoqueAuxiliar, setErroEstoqueAuxiliar] = useState("");
  const [peso, setPeso] = useState("");
  const [largura, setLargura] = useState("");
  const [altura, setAltura] = useState("");
  const [comprimento, setComprimento] = useState("");

  const [ativo, setAtivo] = useState(true);
  const [destaque, setDestaque] = useState(false);

  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [marcaSelecionada, setMarcaSelecionada] = useState("");
  const [carregandoMarcas, setCarregandoMarcas] = useState(true);
  const [erroMarcas, setErroMarcas] = useState("");

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<
    number[]
  >([]);
  const [carregandoCategorias, setCarregandoCategorias] = useState(true);
  const [erroCategorias, setErroCategorias] = useState("");

  const [imagens, setImagens] = useState<ImagemProduto[]>([]);
  const [seoTitulo, setSeoTitulo] = useState("");
  const [seoDescricao, setSeoDescricao] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [aviso, setAviso] = useState("");
  const [idProdutoCriado, setIdProdutoCriado] = useState<number | null>(null);

  useEffect(() => {
    let ativoEffect = true;

    async function carregarMarcas() {
      try {
        setCarregandoMarcas(true);
        setErroMarcas("");
        registrarLog("Iniciando carregamento de marcas", {
          rota: ROTAS.MARCAS.PAINEL.LISTAR,
        });

        const resposta = await conexao.get(ROTAS.MARCAS.PAINEL.LISTAR, {
          withCredentials: true,
        });
        validarResposta(resposta.data);

        const lista = extrairListaMarcas(resposta.data);
        const marcasAtivas = lista.filter(
          (marca: Marca) =>
            marca.ativo === undefined ||
            (String(marca.ativo) !== "0" &&
              String(marca.ativo).toLowerCase() !== "false"),
        );

        registrarLog("Marcas carregadas", {
          totalRecebido: lista.length,
          totalAtivo: marcasAtivas.length,
          resposta: resposta.data,
        });

        if (ativoEffect) setMarcas(marcasAtivas);
      } catch (error: any) {
        registrarErro("Carregar marcas", error);
        if (ativoEffect) {
          setErroMarcas(
            mensagemDoErro(error, "Não foi possível carregar as marcas."),
          );
        }
      } finally {
        if (ativoEffect) setCarregandoMarcas(false);
      }
    }

    async function carregarDadosEstoque() {
      setCarregandoEstoqueAuxiliar(true);
      setErroEstoqueAuxiliar("");

      const [resultadoLocais, resultadoStatus] = await Promise.allSettled([
        conexao.get(ROTAS.ESTOQUE.PAINEL.LOCAIS.LISTAR, {
          withCredentials: true,
        }),
        conexao.get(ROTAS.PERMISSOES.STATUS.LISTAR, {
          withCredentials: true,
        }),
      ]);

      const avisos: string[] = [];

      if (resultadoLocais.status === "fulfilled") {
        try {
          validarResposta(resultadoLocais.value.data);
          const lista = extrairListaApi<LocalEstoque>(
            resultadoLocais.value.data,
            "locais",
          );
          const ativos = lista.filter((local) => registroAtivo(local.ativo));
          if (ativoEffect) {
            setLocaisEstoque(ativos);
            setLocalEstoqueSelecionado(
              (atual) =>
                atual ||
                (ativos[0]?.id_estoque_local
                  ? String(ativos[0].id_estoque_local)
                  : ""),
            );
          }
        } catch (error: any) {
          avisos.push(
            mensagemDoErro(
              error,
              "Não foi possível interpretar os locais de estoque.",
            ),
          );
        }
      } else {
        avisos.push(
          mensagemDoErro(
            resultadoLocais.reason,
            "Não foi possível consultar os locais de estoque.",
          ),
        );
      }

      if (resultadoStatus.status === "fulfilled") {
        try {
          validarResposta(resultadoStatus.value.data);
          const lista = extrairListaApi<StatusEstoque>(
            resultadoStatus.value.data,
            "status",
          );
          const ativos = lista.filter((status) => registroAtivo(status.ativo));
          if (ativoEffect) {
            setStatusEstoque(ativos);
            const statusPadrao =
              ativos.find(
                (status) =>
                  String(status.codigo ?? "").toUpperCase() === "ATIVO",
              ) ?? ativos[0];
            setStatusSaldoSelecionado(
              (atual) =>
                atual ||
                (statusPadrao?.id_status ? String(statusPadrao.id_status) : ""),
            );
          }
        } catch (error: any) {
          avisos.push(
            mensagemDoErro(
              error,
              "Não foi possível interpretar o catálogo de status do estoque.",
            ),
          );
        }
      } else {
        avisos.push(
          mensagemDoErro(
            resultadoStatus.reason,
            "Não foi possível consultar o catálogo de status.",
          ),
        );
      }

      if (ativoEffect && avisos.length > 0) {
        setErroEstoqueAuxiliar(avisos.join(" "));
      }
      if (ativoEffect) setCarregandoEstoqueAuxiliar(false);
    }

    async function carregarCategorias() {
      try {
        setCarregandoCategorias(true);
        setErroCategorias("");
        registrarLog("Iniciando carregamento de categorias", {
          rota: ROTAS.CATEGORIAS.PAINEL.LISTAR,
        });

        const resposta = await conexao.get(ROTAS.CATEGORIAS.PAINEL.LISTAR, {
          withCredentials: true,
        });
        validarResposta(resposta.data);

        const lista = extrairListaCategorias(resposta.data);
        const categoriasAtivas = lista.filter(
          (categoria: Categoria) =>
            categoria.ativo === undefined ||
            (String(categoria.ativo) !== "0" &&
              String(categoria.ativo).toLowerCase() !== "false"),
        );

        registrarLog("Categorias carregadas", {
          totalRecebido: lista.length,
          totalAtivo: categoriasAtivas.length,
          resposta: resposta.data,
        });

        if (ativoEffect) setCategorias(categoriasAtivas);
      } catch (error: any) {
        registrarErro("Carregar categorias", error);
        if (ativoEffect) {
          setErroCategorias(
            mensagemDoErro(error, "Não foi possível carregar as categorias."),
          );
        }
      } finally {
        if (ativoEffect) setCarregandoCategorias(false);
      }
    }

    void carregarMarcas();
    void carregarCategorias();
    void carregarDadosEstoque();

    return () => {
      ativoEffect = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      urlsTemporarias.current.forEach((url) => URL.revokeObjectURL(url));
      urlsTemporarias.current.clear();
    };
  }, []);

  function alterarNome(valor: string) {
    setNome(valor);
    setSlug(gerarSlug(valor));
    if (!seoTitulo) setSeoTitulo(valor);
  }

  function alternarCategoria(id: number) {
    setCategoriasSelecionadas((atuais) =>
      atuais.includes(id)
        ? atuais.filter((item) => item !== id)
        : [...atuais, id],
    );
  }

  function selecionarImagens(evento: ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(evento.target.files ?? []);
    evento.target.value = "";

    if (!arquivos.length) return;

    const arquivosValidos: File[] = [];
    const problemas: string[] = [];

    arquivos.forEach((arquivo) => {
      if (!FORMATOS_IMAGEM.includes(arquivo.type)) {
        problemas.push(`${arquivo.name}: formato não permitido.`);
      } else if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
        problemas.push(`${arquivo.name}: ultrapassa o limite de 5 MB.`);
      } else {
        arquivosValidos.push(arquivo);
      }
    });

    const vagasDisponiveis = Math.max(0, 10 - imagens.length);
    const arquivosPermitidos = arquivosValidos.slice(0, vagasDisponiveis);

    if (arquivosValidos.length > vagasDisponiveis) {
      problemas.push("O limite é de 10 imagens por produto.");
    }

    if (problemas.length) setErro(problemas.join(" "));
    else setErro("");

    if (arquivosPermitidos.length) {
      setImagens((atuais) => {
        const novas = arquivosPermitidos.map((arquivo) => {
          const previewUrl = URL.createObjectURL(arquivo);
          urlsTemporarias.current.add(previewUrl);
          return {
            id: proximoIdImagem.current++,
            arquivo,
            previewUrl,
            textoAlternativo: "",
            principal: atuais.length === 0 && arquivosPermitidos[0] === arquivo,
          };
        });
        return [...atuais, ...novas];
      });
    }
  }

  function definirImagemPrincipal(id: number) {
    setImagens((atuais) =>
      atuais.map((imagem) => ({ ...imagem, principal: imagem.id === id })),
    );
  }

  function atualizarTextoAlternativo(id: number, valor: string) {
    setImagens((atuais) =>
      atuais.map((imagem) =>
        imagem.id === id ? { ...imagem, textoAlternativo: valor } : imagem,
      ),
    );
  }

  function removerImagem(id: number) {
    setImagens((atuais) => {
      const removida = atuais.find((imagem) => imagem.id === id);
      if (removida) {
        URL.revokeObjectURL(removida.previewUrl);
        urlsTemporarias.current.delete(removida.previewUrl);
      }

      const restantes = atuais.filter((imagem) => imagem.id !== id);
      if (restantes.length && !restantes.some((imagem) => imagem.principal)) {
        restantes[0] = { ...restantes[0], principal: true };
      }
      return restantes;
    });
  }

  function validarEtapa(numero: Etapa): boolean {
    setErro("");

    if (numero === 1) {
      if (!nome.trim()) {
        setErro("Informe o nome do produto.");
        return false;
      }
      if (!sku.trim()) {
        setErro("Informe o SKU do produto.");
        return false;
      }
      if (!slug.trim()) {
        setErro(
          "O endereço amigável não foi gerado. Informe o nome novamente.",
        );
        return false;
      }
      if (sku.trim().length > 80 || nome.trim().length > 180) {
        setErro("Confira os limites: SKU até 80 caracteres e nome até 180.");
        return false;
      }
      if (imagens.length === 0) {
        setErro("Adicione pelo menos uma imagem para o produto.");
        return false;
      }
    }

    if (numero === 3) {
      const valorPreco = Number(preco.replace(",", "."));
      if (!Number.isFinite(valorPreco) || valorPreco <= 0) {
        setErro("Informe um preço de venda maior que zero.");
        return false;
      }
      if (respostaPromocional === null) {
        setErro("Informe se o produto terá preço promocional.");
        return false;
      }
      if (respostaPromocional === "sim") {
        const valorPromocional = Number(precoPromocional.replace(",", "."));
        if (!Number.isFinite(valorPromocional) || valorPromocional <= 0) {
          setErro("Informe um preço promocional válido.");
          return false;
        }
        if (valorPromocional > valorPreco) {
          setErro("O preço promocional não pode ser maior que o preço normal.");
          return false;
        }
      }
      if (seoTitulo.length > 180 || seoDescricao.length > 320) {
        setErro(
          "Confira os limites dos campos SEO: título 180 e descrição 320 caracteres.",
        );
        return false;
      }

      if (controlarEstoque && cadastrarSaldoInicial) {
        const localId = Number(localEstoqueSelecionado);
        const statusId = Number(statusSaldoSelecionado);
        const quantidadeInicial = Number(
          quantidadeEstoqueInicial.replace(",", "."),
        );

        if (
          !locaisEstoque.some(
            (local) => Number(local.id_estoque_local) === localId,
          )
        ) {
          setErro(
            "Selecione um local de estoque ativo para cadastrar o saldo inicial.",
          );
          return false;
        }
        if (
          !statusEstoque.some((status) => Number(status.id_status) === statusId)
        ) {
          setErro("Selecione um status válido para o saldo inicial.");
          return false;
        }
        if (!Number.isFinite(quantidadeInicial) || quantidadeInicial < 0) {
          setErro(
            "Informe uma quantidade inicial válida, maior ou igual a zero.",
          );
          return false;
        }
      }
    }

    return true;
  }

  function avancarEtapa() {
    if (!validarEtapa(etapa)) return;
    setEtapa((atual) => Math.min(3, atual + 1) as Etapa);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function voltarEtapa() {
    setErro("");
    setEtapa((atual) => Math.max(1, atual - 1) as Etapa);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function registrarSaldoInicialProduto(
    produtoId: number,
    configuracao: {
      localId: number;
      statusId: number;
      quantidade: unknown;
      variacaoId?: number | null;
      itemChave?: string | null;
    },
  ) {
    const variacaoId = configuracao.variacaoId ?? null;
    const payload = {
      statusId: configuracao.statusId,
      localId: configuracao.localId,
      produtoId,
      variacaoId,
      quantidade: normalizarQuantidadeEstoque(configuracao.quantidade),
      reservado: "0.000",
      itemChave:
        String(configuracao.itemChave ?? "").trim() ||
        gerarItemChaveEstoque(configuracao.localId, produtoId, variacaoId),
    };

    registrarLog("Cadastrando saldo inicial separado do produto", {
      rota: ROTAS.ESTOQUE.PAINEL.SALDOS.CADASTRAR,
      payload,
    });

    const resposta = await conexao.post(
      ROTAS.ESTOQUE.PAINEL.SALDOS.CADASTRAR,
      payload,
      { withCredentials: true },
    );
    validarResposta(resposta.data);
    registrarLog("Saldo inicial cadastrado", resposta.data);
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (salvando || idProdutoCriado) return;

    if (!validarEtapa(1) || !validarEtapa(2) || !validarEtapa(3)) {
      if (!nome.trim() || !sku.trim() || !slug.trim()) setEtapa(1);
      else if (!imagens.length) setEtapa(2);
      else setEtapa(3);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");
      setAviso("");

      const dadosProduto = {
        marca_id: marcaSelecionada ? Number(marcaSelecionada) : null,
        sku: sku.trim(),
        nome: nome.trim(),
        slug: slug.trim(),
        descricao: descricao.trim() || null,
        descricao_curta: descricaoCurta.trim() || null,
        preco: decimalOuNull(preco) || "0.00",
        preco_promocional:
          respostaPromocional === "sim"
            ? decimalOuNull(precoPromocional)
            : null,
        custo: decimalOuNull(custo),
        peso: decimalOuNull(peso),
        largura: decimalOuNull(largura),
        altura: decimalOuNull(altura),
        comprimento: decimalOuNull(comprimento),
        controlar_estoque: controlarEstoque,
        permitir_venda_sem_estoque: permitirVendaSemEstoque,
        destaque,
        ativo,
        seo_titulo: seoTitulo.trim() || null,
        seo_descricao: seoDescricao.trim() || null,
      };

      registrarLog("Enviando cadastro do produto", {
        rota: ROTAS.PRODUTOS.PAINEL.CADASTRAR,
        dados: dadosProduto,
        categoriasSelecionadas,
        quantidadeImagens: imagens.length,
      });

      const respostaProduto = await conexao.post(
        ROTAS.PRODUTOS.PAINEL.CADASTRAR,
        dadosProduto,
        { withCredentials: true },
      );
      registrarLog("Resposta do cadastro do produto", respostaProduto.data);
      validarResposta(respostaProduto.data);

      const novoId = extrairIdProduto(respostaProduto.data);
      if (!novoId) {
        throw new Error(
          "O produto foi enviado, mas a API não retornou o ID. Verifique o cadastro antes de tentar novamente.",
        );
      }
      setIdProdutoCriado(novoId);

      const pendencias: string[] = [];

      if (categoriasSelecionadas.length > 0) {
        try {
          const rotaCategorias =
            ROTAS.PRODUTOS.PAINEL.CATEGORIAS.SINCRONIZAR(novoId);
          registrarLog("Associando categorias ao produto", {
            rota: rotaCategorias,
            produtoId: novoId,
            categoriasIds: categoriasSelecionadas,
          });

          const respostaCategorias = await conexao.put(
            rotaCategorias,
            { categorias_ids: categoriasSelecionadas },
            { withCredentials: true },
          );
          registrarLog(
            "Resposta da associação de categorias",
            respostaCategorias.data,
          );
          validarResposta(respostaCategorias.data);
        } catch (error: any) {
          registrarErro("Associar categorias ao produto", error);
          pendencias.push(
            `As categorias não foram associadas: ${mensagemDoErro(error, "erro não informado")}`,
          );
        }
      }

      for (let indice = 0; indice < imagens.length; indice++) {
        const imagem = imagens[indice];
        try {
          const formularioImagem = new FormData();
          formularioImagem.append("imagem", imagem.arquivo);
          formularioImagem.append(
            "texto_alternativo",
            imagem.textoAlternativo.trim(),
          );
          formularioImagem.append("principal", String(imagem.principal));
          formularioImagem.append("ordem", String(indice));

          // Não definir Content-Type manualmente: o navegador adiciona o boundary.
          const rotaImagem = ROTAS.PRODUTOS.PAINEL.IMAGENS.CADASTRAR(novoId);
          registrarLog(`Enviando imagem ${indice + 1}/${imagens.length}`, {
            rota: rotaImagem,
            nome: imagem.arquivo.name,
            tipo: imagem.arquivo.type,
            tamanhoBytes: imagem.arquivo.size,
            principal: imagem.principal,
            ordem: indice,
          });

          const respostaImagem = await conexao.post(
            rotaImagem,
            formularioImagem,
            {
              withCredentials: true,
              // Sobrescreve o Content-Type application/json padrão do Axios.
              // O Axios/navegador acrescenta o boundary do multipart.
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
          registrarLog(`Imagem ${indice + 1} enviada`, respostaImagem.data);
          validarResposta(respostaImagem.data);
        } catch (error: any) {
          registrarErro(
            `Enviar imagem ${indice + 1} (${imagem.arquivo.name})`,
            error,
          );
          pendencias.push(
            `Imagem ${indice + 1} (${imagem.arquivo.name}): ${mensagemDoErro(error, "falha no upload")}`,
          );
        }
      }

      if (controlarEstoque && cadastrarSaldoInicial) {
        try {
          await registrarSaldoInicialProduto(novoId, {
            localId: Number(localEstoqueSelecionado),
            statusId: Number(statusSaldoSelecionado),
            quantidade: quantidadeEstoqueInicial,
          });
        } catch (error: any) {
          registrarErro("Cadastrar saldo inicial do produto", error);
          pendencias.push(
            `O produto foi criado, mas o saldo inicial não foi registrado: ${mensagemDoErro(error, "falha ao cadastrar saldo")}`,
          );
        }
      }

      if (pendencias.length > 0) {
        setAviso(
          `O produto #${novoId} foi cadastrado, mas existem pendências: ${pendencias.join(" ")}`,
        );
        return;
      }

      setSucesso(
        controlarEstoque && cadastrarSaldoInicial
          ? `Produto #${novoId} cadastrado e saldo inicial registrado com sucesso.`
          : `Produto cadastrado com sucesso! Código: #${novoId}.`,
      );
    } catch (error: any) {
      registrarErro("Fluxo de cadastro do produto", error);
      setErro(mensagemDoErro(error, "Não foi possível cadastrar o produto."));
    } finally {
      setSalvando(false);
    }
  }

  function preencherJsonComFormulario() {
    const dados = {
      status_id: 1,
      marca_id: marcaSelecionada ? Number(marcaSelecionada) : null,
      sku: sku.trim(),
      nome: nome.trim(),
      slug: slug.trim(),
      descricao: descricao.trim() || null,
      descricao_curta: descricaoCurta.trim() || null,
      preco: decimalOuNull(preco) || "0.00",
      preco_promocional:
        respostaPromocional === "sim" ? decimalOuNull(precoPromocional) : null,
      custo: decimalOuNull(custo),
      peso: decimalOuNull(peso),
      largura: decimalOuNull(largura),
      altura: decimalOuNull(altura),
      comprimento: decimalOuNull(comprimento),
      controlar_estoque: controlarEstoque,
      permitir_venda_sem_estoque: permitirVendaSemEstoque,
      estoque_inicial: {
        cadastrar: controlarEstoque && cadastrarSaldoInicial,
        local_id: localEstoqueSelecionado
          ? Number(localEstoqueSelecionado)
          : null,
        status_id: statusSaldoSelecionado
          ? Number(statusSaldoSelecionado)
          : null,
        variacao_id: null,
        quantidade:
          quantidadeEstoqueInicial.trim().replace(",", ".") || "0.000",
      },
      destaque,
      ativo,
      seo_titulo: seoTitulo.trim() || null,
      seo_descricao: seoDescricao.trim() || null,
      categorias_ids: categoriasSelecionadas,
    };

    setJsonCadastro(JSON.stringify(dados, null, 2));
    setErro("");
  }

  function formatarJsonCadastro() {
    try {
      const dados = JSON.parse(jsonCadastro);
      setJsonCadastro(JSON.stringify(dados, null, 2));
      setErro("");
    } catch (error) {
      setErro(
        error instanceof Error
          ? `JSON inválido: ${error.message}`
          : "O conteúdo informado não é um JSON válido.",
      );
    }
  }

  async function cadastrarViaJson() {
    if (salvando || idProdutoCriado) return;

    let dadosRecebidos: Record<string, unknown>;

    try {
      const interpretado: unknown = JSON.parse(jsonCadastro);
      if (
        !interpretado ||
        typeof interpretado !== "object" ||
        Array.isArray(interpretado)
      ) {
        throw new Error("O JSON precisa conter um objeto de produto.");
      }

      dadosRecebidos = interpretado as Record<string, unknown>;
    } catch (error) {
      setErro(
        error instanceof Error
          ? `Não foi possível interpretar o JSON: ${error.message}`
          : "O JSON informado é inválido.",
      );
      return;
    }

    const nomeJson = String(dadosRecebidos.nome ?? "").trim();
    const skuJson = String(dadosRecebidos.sku ?? "").trim();
    const slugJson = String(dadosRecebidos.slug ?? "").trim();
    const precoJson = Number(
      String(dadosRecebidos.preco ?? "").replace(",", "."),
    );

    if (!nomeJson || !skuJson || !slugJson) {
      setErro("O JSON precisa informar nome, sku e slug.");
      return;
    }

    if (!Number.isFinite(precoJson) || precoJson <= 0) {
      setErro("O campo preco precisa ser um número maior que zero.");
      return;
    }

    const categoriasBrutas = dadosRecebidos.categorias_ids ?? [];
    if (
      !Array.isArray(categoriasBrutas) ||
      categoriasBrutas.some(
        (id) => !Number.isInteger(Number(id)) || Number(id) <= 0,
      )
    ) {
      setErro(
        "categorias_ids precisa ser uma lista de IDs inteiros positivos.",
      );
      return;
    }

    const categoriasIds = [...new Set(categoriasBrutas.map(Number))];
    const estoqueBruto = dadosRecebidos.estoque_inicial;
    let estoqueInicialJson: ConfiguracaoEstoqueInicial | null = null;

    if (estoqueBruto !== undefined && estoqueBruto !== null) {
      if (typeof estoqueBruto !== "object" || Array.isArray(estoqueBruto)) {
        setErro("estoque_inicial precisa ser um objeto JSON.");
        return;
      }

      const estoqueJson = estoqueBruto as Record<string, unknown>;
      const cadastrar =
        estoqueJson.cadastrar === true ||
        estoqueJson.cadastrar === 1 ||
        String(estoqueJson.cadastrar).toLowerCase() === "true" ||
        String(estoqueJson.cadastrar) === "1";

      if (cadastrar) {
        const controlar = !(
          dadosRecebidos.controlar_estoque === false ||
          dadosRecebidos.controlar_estoque === 0 ||
          String(dadosRecebidos.controlar_estoque).toLowerCase() === "false" ||
          String(dadosRecebidos.controlar_estoque) === "0"
        );
        if (!controlar) {
          setErro(
            "Não é possível cadastrar saldo inicial quando controlar_estoque estiver desativado.",
          );
          return;
        }

        const localId = Number(
          estoqueJson.local_id ??
            estoqueJson.localId ??
            estoqueJson.estoque_local_id,
        );
        const statusId = Number(estoqueJson.status_id ?? estoqueJson.statusId);
        const variacaoRaw =
          estoqueJson.variacao_id ?? estoqueJson.variacaoId ?? null;
        const variacaoId =
          variacaoRaw === null || variacaoRaw === ""
            ? null
            : Number(variacaoRaw);
        const quantidade = String(estoqueJson.quantidade ?? "0")
          .trim()
          .replace(",", ".");
        const quantidadeNumero = Number(quantidade);

        if (!Number.isInteger(localId) || localId <= 0) {
          setErro(
            "estoque_inicial.local_id precisa informar um ID de local válido.",
          );
          return;
        }
        if (!Number.isInteger(statusId) || statusId <= 0) {
          setErro(
            "estoque_inicial.status_id precisa informar um status válido.",
          );
          return;
        }
        if (
          variacaoId !== null &&
          (!Number.isInteger(variacaoId) || variacaoId <= 0)
        ) {
          setErro(
            "estoque_inicial.variacao_id precisa ser um ID positivo ou null.",
          );
          return;
        }
        if (!Number.isFinite(quantidadeNumero) || quantidadeNumero < 0) {
          setErro(
            "estoque_inicial.quantidade precisa ser numérica e não negativa.",
          );
          return;
        }

        estoqueInicialJson = {
          cadastrar: true,
          localId,
          statusId,
          variacaoId,
          quantidade: quantidadeNumero.toFixed(3),
          itemChave:
            String(
              estoqueJson.item_chave ?? estoqueJson.itemChave ?? "",
            ).trim() || undefined,
        };
      }
    }

    const dadosProduto = { ...dadosRecebidos };
    delete dadosProduto.categorias_ids;
    delete dadosProduto.estoque_inicial;

    try {
      setSalvando(true);
      setErro("");
      setSucesso("");
      setAviso("");

      registrarLog("Enviando cadastro de produto por JSON", {
        rota: ROTAS.PRODUTOS.PAINEL.CADASTRAR,
        dados: dadosProduto,
        categoriasIds,
      });

      const resposta = await conexao.post(
        ROTAS.PRODUTOS.PAINEL.CADASTRAR,
        dadosProduto,
        { withCredentials: true },
      );
      registrarLog("Resposta do cadastro por JSON", resposta.data);
      validarResposta(resposta.data);

      const novoId = extrairIdProduto(resposta.data);
      if (!novoId) {
        throw new Error(
          "A API recebeu o cadastro, mas não retornou o ID do produto. Confira a listagem antes de tentar novamente.",
        );
      }

      setIdProdutoCriado(novoId);
      const pendenciasJson: string[] = [];

      if (categoriasIds.length > 0) {
        try {
          const rotaCategorias =
            ROTAS.PRODUTOS.PAINEL.CATEGORIAS.SINCRONIZAR(novoId);
          const respostaCategorias = await conexao.put(
            rotaCategorias,
            {
              categorias_ids: categoriasIds,
              status_id: Number(dadosRecebidos.status_id ?? 1),
            },
            { withCredentials: true },
          );
          validarResposta(respostaCategorias.data);
          registrarLog("Categorias associadas no cadastro por JSON", {
            rota: rotaCategorias,
            categoriasIds,
            resposta: respostaCategorias.data,
          });
        } catch (error: any) {
          registrarErro("Associar categorias no cadastro por JSON", error);
          pendenciasJson.push(
            `As categorias não foram associadas: ${mensagemDoErro(error, "erro não informado")}`,
          );
        }
      }

      if (estoqueInicialJson?.cadastrar) {
        try {
          await registrarSaldoInicialProduto(novoId, {
            localId: estoqueInicialJson.localId,
            statusId: estoqueInicialJson.statusId,
            variacaoId: estoqueInicialJson.variacaoId,
            quantidade: estoqueInicialJson.quantidade,
            itemChave: estoqueInicialJson.itemChave,
          });
        } catch (error: any) {
          registrarErro("Cadastrar saldo inicial via JSON", error);
          pendenciasJson.push(
            `O produto foi criado, mas o saldo inicial não foi registrado: ${mensagemDoErro(error, "falha ao cadastrar saldo")}`,
          );
        }
      }

      if (pendenciasJson.length > 0) {
        setAviso(
          `O produto #${novoId} foi cadastrado, mas existem pendências: ${pendenciasJson.join(" ")}`,
        );
        return;
      }

      setSucesso(
        estoqueInicialJson?.cadastrar
          ? `Produto #${novoId} cadastrado via JSON e saldo inicial registrado com sucesso.`
          : `Produto cadastrado via JSON com sucesso! Código: #${novoId}.`,
      );
    } catch (error: any) {
      registrarErro("Cadastro de produto via JSON", error);
      setErro(
        mensagemDoErro(error, "Não foi possível cadastrar o produto via JSON."),
      );
    } finally {
      setSalvando(false);
    }
  }

  const imagemPrincipal =
    imagens.find((imagem) => imagem.principal) ?? imagens[0] ?? null;

  if (sucesso) {
    return (
      <main className="produto-cadastro-page">
        <div className="resultado-cadastro">
          <div className="resultado-icone">
            <CheckCircle2 size={38} />
          </div>
          <span className="resultado-label">CADASTRO CONCLUÍDO</span>
          <h1>Produto cadastrado!</h1>
          <p>{sucesso}</p>
          <Link href={ROTAS.PRODUTOS.PAINEL.LISTAR} className="botao-primario">
            <Package size={17} /> Ver produtos
          </Link>
        </div>
      </main>
    );
  }

  const etapas = [
    {
      numero: 1,
      titulo: "Produto e imagem",
      descricao: "Identificação e foto principal",
    },
    {
      numero: 2,
      titulo: "Organização e medidas",
      descricao: "Categorias e dimensões",
    },
    {
      numero: 3,
      titulo: "Venda e publicação",
      descricao: "Preço, estoque e SEO",
    },
  ] as const;

  return (
    <main className="produto-cadastro-page">
      <header className="pagina-topo">
        <div>
          <div className="breadcrumb">
            <Link href="/painel">Painel</Link>
            <Icone nome="chevron-right" tamanho={13} />
            <Link href={ROTAS.PRODUTOS.PAINEL.LISTAR}>Produtos</Link>
            <Icone nome="chevron-right" tamanho={13} />
            <span>Cadastrar</span>
          </div>
          <div className="titulo-principal">
            <div className="titulo-icone">
              <Package size={23} />
            </div>
            <div>
              <h1>Cadastrar produto</h1>
              <p>Cadastre, organize e publique um produto na sua loja.</p>
            </div>
          </div>
        </div>
        <Link href={ROTAS.PRODUTOS.PAINEL.LISTAR} className="botao-voltar">
          <ArrowLeft size={16} /> Voltar aos produtos
        </Link>
      </header>

      <div
        className="modo-cadastro"
        role="group"
        aria-label="Forma de cadastro"
      >
        <button
          type="button"
          className={`modo-cadastro-opcao ${modoCadastro === "formulario" ? "ativo" : ""}`}
          onClick={() => {
            setModoCadastro("formulario");
            setErro("");
            setAviso("");
          }}
          aria-pressed={modoCadastro === "formulario"}
        >
          <FileText size={17} />
          <span>
            <strong>Formulário</strong>
            <small>Cadastro guiado com imagens</small>
          </span>
        </button>
        <button
          type="button"
          className={`modo-cadastro-opcao ${modoCadastro === "json" ? "ativo" : ""}`}
          onClick={() => {
            setModoCadastro("json");
            setErro("");
            setAviso("");
          }}
          aria-pressed={modoCadastro === "json"}
        >
          <Braces size={18} />
          <span>
            <strong>JSON</strong>
            <small>Envie os dados em formato JSON</small>
          </span>
        </button>
      </div>

      {modoCadastro === "formulario" && (
        <nav className="etapas" aria-label="Etapas do cadastro">
          {etapas.map((item, indice) => (
            <div
              className={`etapa-item ${etapa === item.numero ? "atual" : ""} ${
                etapa > item.numero ? "concluida" : ""
              }`}
              key={item.numero}
              aria-current={etapa === item.numero ? "step" : undefined}
            >
              <span className="etapa-numero">
                {etapa > item.numero ? <Check size={16} /> : item.numero}
              </span>
              <span className="etapa-textos">
                <strong>{item.titulo}</strong>
                <small>{item.descricao}</small>
              </span>
              {indice < 2 && <span className="etapa-linha" />}
            </div>
          ))}
        </nav>
      )}

      {erro && (
        <div className="mensagem mensagem-erro" role="alert">
          <AlertCircle size={18} />
          <span>{erro}</span>
          <button type="button" onClick={() => setErro("")} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
      )}

      {aviso && (
        <div className="mensagem mensagem-aviso" role="status">
          <AlertTriangle size={18} />
          <span>{aviso}</span>
          <div className="mensagem-aviso-acoes">
            <Link href={ROTAS.PAGINAS.PAINEL.ESTOQUE.SALDOS}>Abrir saldos</Link>
            <Link href={ROTAS.PRODUTOS.PAINEL.LISTAR}>Ver produtos</Link>
          </div>
        </div>
      )}

      {modoCadastro === "json" && (
        <section className="json-cadastro-card">
          <div className="json-cadastro-cabecalho">
            <div className="json-cadastro-titulo">
              <div className="json-cadastro-icone">
                <Braces size={21} />
              </div>
              <div>
                <h2>Cadastro por JSON</h2>
                <p>Edite o objeto e envie os dados diretamente para a API.</p>
              </div>
            </div>
            <span className="json-metodo">POST · application/json</span>
          </div>

          <div className="json-ajuda">
            <AlertCircle size={17} />
            <p>
              Informe <code>nome</code>, <code>sku</code>, <code>slug</code> e{" "}
              <code>preco</code>. O campo opcional <code>categorias_ids</code>{" "}
              aceita uma lista de IDs, por exemplo <code>[1, 2]</code>. Para
              criar saldo inicial no módulo Estoque, use o objeto
              <code> estoque_inicial</code> com <code>cadastrar: true</code>,
              <code>local_id</code>, <code>status_id</code> e
              <code>quantidade</code>.
            </p>
          </div>

          <label className="json-editor-label" htmlFor="json-produto">
            Corpo JSON do produto
          </label>
          <textarea
            id="json-produto"
            className="json-editor"
            value={jsonCadastro}
            onChange={(evento) => setJsonCadastro(evento.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-describedby="json-nota-imagens"
          />

          <div className="json-editor-acoes">
            <button
              type="button"
              className="botao-secundario"
              onClick={formatarJsonCadastro}
            >
              <Braces size={16} /> Formatar JSON
            </button>
            <button
              type="button"
              className="botao-secundario"
              onClick={preencherJsonComFormulario}
            >
              <FileText size={16} /> Usar dados do formulário
            </button>
            <button
              type="button"
              className="botao-salvar"
              onClick={cadastrarViaJson}
              disabled={salvando || !!idProdutoCriado}
            >
              {salvando ? (
                <>
                  <LoaderCircle className="girando" size={17} /> Enviando
                  JSON...
                </>
              ) : (
                <>
                  <Save size={17} /> Cadastrar via JSON
                </>
              )}
            </button>
          </div>

          <p className="json-nota-imagens" id="json-nota-imagens">
            <ImageIcon size={16} />
            As imagens não são enviadas dentro deste JSON. Para anexar fotos,
            use a opção Formulário. O objeto estoque_inicial é retirado do JSON
            antes do POST de produtos e enviado separadamente para a API de
            saldos.
          </p>
        </section>
      )}

      {modoCadastro === "formulario" && (
        <form onSubmit={handleSubmit} className="produto-form">
          {etapa === 1 && (
            <div className="produto-cadastro-grade produto-cadastro-grade--principal">
              <section className="form-card produto-informacoes-card">
                <div className="card-cabecalho">
                  <div className="card-icone">
                    <FileText size={19} />
                  </div>
                  <div>
                    <h2>Informações do produto</h2>
                    <p>Nome, identificação e descrição.</p>
                  </div>
                  <span className="card-numero">01 / 03</span>
                </div>

                <div className="campo">
                  <label htmlFor="nome">
                    Nome do produto <span>*</span>
                  </label>
                  <input
                    id="nome"
                    value={nome}
                    maxLength={180}
                    onChange={(e) => alterarNome(e.target.value)}
                    placeholder="Ex.: Vaso decorativo de cerâmica"
                    required
                  />
                </div>

                <div className="campo">
                  <label htmlFor="marca">Marca</label>
                  {carregandoMarcas ? (
                    <div className="estado-categorias">
                      <LoaderCircle className="girando" size={17} /> Carregando
                      marcas...
                    </div>
                  ) : (
                    <select
                      id="marca"
                      value={marcaSelecionada}
                      onChange={(e) => setMarcaSelecionada(e.target.value)}
                    >
                      <option value="">Sem marca</option>
                      {marcas.map((marca) => (
                        <option key={marca.id_marca} value={marca.id_marca}>
                          {marca.nome}
                        </option>
                      ))}
                    </select>
                  )}
                  {erroMarcas ? (
                    <small className="campo-erro">
                      {erroMarcas} Confira o Console do navegador (F12) para o
                      diagnóstico.
                    </small>
                  ) : (
                    <small>
                      Selecione uma marca cadastrada. Este campo é opcional.
                    </small>
                  )}
                  <Link
                    href={ROTAS.MARCAS.PAINEL.LISTAR}
                    className="link-gerenciar"
                  >
                    Gerenciar marcas <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="campos-duplos">
                  <div className="campo">
                    <label htmlFor="sku">
                      SKU <span>*</span>
                    </label>
                    <input
                      id="sku"
                      value={sku}
                      maxLength={80}
                      onChange={(e) => setSku(e.target.value.toUpperCase())}
                      required
                    />
                    <small>
                      Código único do produto. Gerado automaticamente.
                    </small>
                  </div>
                  <div className="campo">
                    <label htmlFor="slug">Slug</label>
                    <input
                      id="slug"
                      value={slug}
                      readOnly
                      placeholder="Gerado pelo nome"
                    />
                    <small>Endereço amigável gerado automaticamente.</small>
                  </div>
                </div>

                <div className="campo campo-descricao-curta">
                  <label htmlFor="descricao-curta">Descrição curta</label>
                  <textarea
                    id="descricao-curta"
                    rows={2}
                    maxLength={500}
                    value={descricaoCurta}
                    onChange={(e) => setDescricaoCurta(e.target.value)}
                    placeholder="Uma apresentação rápida do produto..."
                  />
                  <small>{descricaoCurta.length}/500 caracteres.</small>
                </div>

                <div className="campo campo-descricao-completa sem-margem">
                  <label htmlFor="descricao">Descrição completa</label>
                  <textarea
                    id="descricao"
                    rows={3}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva características, materiais e benefícios..."
                  />
                </div>
              </section>

              <section className="form-card produto-imagem-card">
                <div className="card-cabecalho compacto">
                  <div className="card-icone">
                    <ImageIcon size={19} />
                  </div>
                  <div>
                    <h2>Imagem do produto</h2>
                    <p>Adicione a foto principal e outras imagens.</p>
                  </div>
                  <span className="produto-imagem-contador">
                    {imagens.length}/10
                  </span>
                </div>

                <input
                  ref={inputImagemRef}
                  className="input-arquivo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={selecionarImagens}
                />

                <button
                  type="button"
                  className={`produto-imagem-quadrado ${imagemPrincipal ? "tem-imagem" : ""}`}
                  onClick={() => inputImagemRef.current?.click()}
                  aria-label={
                    imagemPrincipal
                      ? "Trocar imagem principal"
                      : "Selecionar imagem principal"
                  }
                >
                  {imagemPrincipal ? (
                    <img
                      src={imagemPrincipal.previewUrl}
                      alt={
                        imagemPrincipal.textoAlternativo ||
                        nome ||
                        "Prévia do produto"
                      }
                    />
                  ) : (
                    <span className="produto-imagem-vazia">
                      <span className="produto-imagem-vazia-icone">
                        <Upload size={25} />
                      </span>
                      <strong>Adicionar foto</strong>
                      <small>JPG, PNG, WEBP ou GIF</small>
                      <small>Até 5 MB por imagem</small>
                    </span>
                  )}
                  {imagemPrincipal && (
                    <span className="produto-imagem-trocar">
                      <Upload size={15} /> Trocar foto
                    </span>
                  )}
                </button>

                {imagemPrincipal && (
                  <div className="campo produto-imagem-alt">
                    <label htmlFor="imagem-texto-alternativo">
                      Texto alternativo
                    </label>
                    <input
                      id="imagem-texto-alternativo"
                      value={imagemPrincipal.textoAlternativo}
                      maxLength={255}
                      onChange={(evento) =>
                        atualizarTextoAlternativo(
                          imagemPrincipal.id,
                          evento.target.value,
                        )
                      }
                      placeholder="Descreva brevemente a imagem"
                    />
                  </div>
                )}

                {imagens.length > 0 && (
                  <div
                    className="produto-imagem-miniaturas"
                    aria-label="Imagens adicionadas"
                  >
                    {imagens.map((imagem) => (
                      <div
                        className={`produto-imagem-miniatura ${imagem.principal ? "ativa" : ""}`}
                        key={imagem.id}
                      >
                        <button
                          type="button"
                          className="produto-imagem-miniatura-selecionar"
                          onClick={() => definirImagemPrincipal(imagem.id)}
                          title={
                            imagem.principal
                              ? "Imagem principal"
                              : "Definir como principal"
                          }
                          aria-label={
                            imagem.principal
                              ? "Imagem principal selecionada"
                              : "Definir imagem como principal"
                          }
                        >
                          <img
                            src={imagem.previewUrl}
                            alt={imagem.textoAlternativo || imagem.arquivo.name}
                          />
                        </button>
                        <button
                          type="button"
                          className="produto-imagem-miniatura-remover"
                          onClick={() => removerImagem(imagem.id)}
                          aria-label={`Remover ${imagem.arquivo.name}`}
                          title="Remover imagem"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                    {imagens.length < 10 && (
                      <button
                        type="button"
                        className="produto-imagem-adicionar"
                        onClick={() => inputImagemRef.current?.click()}
                        aria-label="Adicionar mais imagens"
                        title="Adicionar mais imagens"
                      >
                        <Plus size={21} />
                      </button>
                    )}
                  </div>
                )}

                <p className="produto-imagem-ajuda">
                  {imagens.length === 0
                    ? "A primeira imagem será definida automaticamente como principal."
                    : `${imagens.length} imagem(ns) adicionada(s). Clique em uma miniatura para defini-la como principal.`}
                </p>
              </section>
            </div>
          )}

          {etapa === 2 && (
            <div className="etapa-conteudo produto-cadastro-grade produto-cadastro-grade--detalhes">
              <section className="form-card">
                <div className="card-cabecalho compacto">
                  <div className="card-icone">
                    <Layers size={19} />
                  </div>
                  <div>
                    <h2>Categorias</h2>
                    <p>Selecione onde o produto será organizado.</p>
                  </div>
                </div>

                <div className="categorias-contador">
                  {categoriasSelecionadas.length} categoria(s) selecionada(s)
                </div>
                {carregandoCategorias ? (
                  <div className="estado-categorias">
                    <LoaderCircle className="girando" size={17} /> Carregando
                    categorias...
                  </div>
                ) : erroCategorias ? (
                  <div className="erro-categorias">
                    <AlertCircle size={16} /> {erroCategorias}
                  </div>
                ) : categorias.length === 0 ? (
                  <div className="estado-categorias">
                    Nenhuma categoria disponível.
                  </div>
                ) : (
                  <div className="categorias-lista">
                    {categorias.map((categoria) => (
                      <label
                        className="categoria-opcao"
                        key={categoria.id_categoria}
                      >
                        <input
                          type="checkbox"
                          checked={categoriasSelecionadas.includes(
                            Number(categoria.id_categoria),
                          )}
                          onChange={() =>
                            alternarCategoria(Number(categoria.id_categoria))
                          }
                        />
                        <span>{categoria.nome}</span>
                      </label>
                    ))}
                  </div>
                )}
                <Link
                  href={ROTAS.CATEGORIAS.PAINEL.LISTAR}
                  className="link-gerenciar"
                >
                  Gerenciar categorias <ArrowRight size={14} />
                </Link>
              </section>

              <section className="form-card">
                <div className="card-cabecalho compacto">
                  <div className="card-icone">
                    <Ruler size={19} />
                  </div>
                  <div>
                    <h2>Dimensões e peso</h2>
                    <p>Dados opcionais para cálculo de entrega.</p>
                  </div>
                </div>
                <div className="campos-quatro">
                  <div className="campo">
                    <label htmlFor="peso">Peso (kg)</label>
                    <input
                      id="peso"
                      type="number"
                      min="0"
                      step="0.001"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      placeholder="0,000"
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="largura">Largura (cm)</label>
                    <input
                      id="largura"
                      type="number"
                      min="0"
                      step="0.01"
                      value={largura}
                      onChange={(e) => setLargura(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="altura">Altura (cm)</label>
                    <input
                      id="altura"
                      type="number"
                      min="0"
                      step="0.01"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="campo sem-margem">
                    <label htmlFor="comprimento">Comprimento (cm)</label>
                    <input
                      id="comprimento"
                      type="number"
                      min="0"
                      step="0.01"
                      value={comprimento}
                      onChange={(e) => setComprimento(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {etapa === 3 && (
            <div className="etapa-conteudo produto-cadastro-grade produto-cadastro-grade--venda">
              <section className="form-card">
                <div className="card-cabecalho">
                  <div className="card-icone">
                    <CircleDollarSign size={19} />
                  </div>
                  <div>
                    <h2>Preços e condições</h2>
                    <p>Defina os valores de venda e promoção.</p>
                  </div>
                  <span className="card-numero">03 / 03</span>
                </div>

                <div className="campos-duplos">
                  <div className="campo">
                    <label htmlFor="preco">
                      Preço de venda (R$) <span>*</span>
                    </label>
                    <input
                      id="preco"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={preco}
                      onChange={(e) => setPreco(e.target.value)}
                      placeholder="0,00"
                      required
                    />
                  </div>
                  <div className="campo">
                    <label htmlFor="custo">Custo do produto (R$)</label>
                    <input
                      id="custo"
                      type="number"
                      min="0"
                      step="0.01"
                      value={custo}
                      onChange={(e) => setCusto(e.target.value)}
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="promotion-question">
                  <div className="promotion-heading">
                    <CircleDollarSign size={21} />
                    <div>
                      <strong>Este produto terá preço promocional?</strong>
                      <small>Escolha uma opção para continuar.</small>
                    </div>
                  </div>
                  {respostaPromocional === null ? (
                    <div className="promotion-options">
                      <button
                        type="button"
                        className="promotion-choice yes"
                        onClick={() => setRespostaPromocional("sim")}
                      >
                        <Check size={16} /> Sim, terá promoção
                      </button>
                      <button
                        type="button"
                        className="promotion-choice no"
                        onClick={() => {
                          setRespostaPromocional("nao");
                          setPrecoPromocional("");
                        }}
                      >
                        <X size={16} /> Não terá promoção
                      </button>
                    </div>
                  ) : (
                    <div className="promocao-escolhida">
                      <strong>
                        {respostaPromocional === "sim"
                          ? "Produto em promoção"
                          : "Sem preço promocional"}
                      </strong>
                      <button
                        type="button"
                        className="link-simples"
                        onClick={() => {
                          setRespostaPromocional(null);
                          setPrecoPromocional("");
                        }}
                      >
                        Alterar resposta
                      </button>
                    </div>
                  )}
                  {respostaPromocional === "sim" && (
                    <div className="campo sem-margem">
                      <label htmlFor="preco-promocional">
                        Preço promocional (R$) <span>*</span>
                      </label>
                      <input
                        id="preco-promocional"
                        type="number"
                        min="0.01"
                        max={preco || undefined}
                        step="0.01"
                        value={precoPromocional}
                        onChange={(e) => setPrecoPromocional(e.target.value)}
                        placeholder="Informe o preço promocional"
                        required
                      />
                    </div>
                  )}
                </div>
              </section>

              <section className="form-card">
                <div className="card-cabecalho compacto">
                  <div className="card-icone">
                    <Eye size={19} />
                  </div>
                  <div>
                    <h2>Publicação e estoque</h2>
                    <p>Controle como o produto ficará disponível.</p>
                  </div>
                </div>
                <div className="opcoes-grid">
                  <label className="opcao-linha">
                    <span>
                      <strong>Produto ativo</strong>
                      <small>Disponibilizar na loja.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={ativo}
                      onChange={(e) => setAtivo(e.target.checked)}
                    />
                  </label>
                  <label className="opcao-linha">
                    <span>
                      <strong>Produto em destaque</strong>
                      <small>Dar maior visibilidade.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={destaque}
                      onChange={(e) => setDestaque(e.target.checked)}
                    />
                  </label>
                  <label className="opcao-linha">
                    <span>
                      <strong>Controlar estoque</strong>
                      <small>Ativar controle de estoque.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={controlarEstoque}
                      onChange={(e) => setControlarEstoque(e.target.checked)}
                    />
                  </label>
                  <label className="opcao-linha">
                    <span>
                      <strong>Vender sem estoque</strong>
                      <small>Permitir compras sem saldo.</small>
                    </span>
                    <input
                      type="checkbox"
                      checked={permitirVendaSemEstoque}
                      onChange={(e) =>
                        setPermitirVendaSemEstoque(e.target.checked)
                      }
                    />
                  </label>
                </div>

                <div className="produto-estoque-inicial">
                  <div className="produto-estoque-inicial__cabecalho">
                    <div>
                      <strong>Cadastrar saldo inicial</strong>
                      <small>
                        O saldo será registrado no módulo Estoque depois que o
                        produto receber um ID.
                      </small>
                    </div>
                    <label className="produto-estoque-inicial__alternador">
                      <input
                        type="checkbox"
                        checked={cadastrarSaldoInicial}
                        disabled={
                          !controlarEstoque || carregandoEstoqueAuxiliar
                        }
                        onChange={(evento) =>
                          setCadastrarSaldoInicial(evento.target.checked)
                        }
                      />
                      <span>{cadastrarSaldoInicial ? "Sim" : "Depois"}</span>
                    </label>
                  </div>

                  {!controlarEstoque ? (
                    <p className="produto-estoque-inicial__nota">
                      Ative “Controlar estoque” para registrar um saldo inicial.
                    </p>
                  ) : carregandoEstoqueAuxiliar ? (
                    <p className="produto-estoque-inicial__estado">
                      <LoaderCircle className="girando" size={16} /> Carregando
                      locais e status do banco...
                    </p>
                  ) : cadastrarSaldoInicial ? (
                    <>
                      {erroEstoqueAuxiliar && (
                        <div
                          className="produto-estoque-inicial__erro"
                          role="status"
                        >
                          <AlertCircle size={16} />
                          <span>
                            {erroEstoqueAuxiliar} Você pode concluir o produto
                            sem o saldo inicial e cadastrá-lo depois.
                          </span>
                        </div>
                      )}
                      <div className="produto-estoque-inicial__grade">
                        <div className="campo">
                          <label htmlFor="estoque-local-inicial">
                            Local de estoque <span>*</span>
                          </label>
                          <select
                            id="estoque-local-inicial"
                            value={localEstoqueSelecionado}
                            onChange={(evento) =>
                              setLocalEstoqueSelecionado(evento.target.value)
                            }
                            disabled={locaisEstoque.length === 0}
                          >
                            <option value="">Selecione um local</option>
                            {locaisEstoque.map((local) => (
                              <option
                                key={local.id_estoque_local}
                                value={local.id_estoque_local}
                              >
                                {local.nome ||
                                  `Local #${local.id_estoque_local}`}{" "}
                                {local.codigo ? `· ${local.codigo}` : ""}
                              </option>
                            ))}
                          </select>
                          <small>
                            {locaisEstoque.length > 0
                              ? `${locaisEstoque.length} local(is) ativo(s) carregado(s).`
                              : "Nenhum local ativo disponível. Cadastre ou ative um local no módulo Estoque."}
                          </small>
                        </div>

                        <div className="campo">
                          <label htmlFor="estoque-status-inicial">
                            Status do saldo <span>*</span>
                          </label>
                          <select
                            id="estoque-status-inicial"
                            value={statusSaldoSelecionado}
                            onChange={(evento) =>
                              setStatusSaldoSelecionado(evento.target.value)
                            }
                            disabled={statusEstoque.length === 0}
                          >
                            <option value="">Selecione um status</option>
                            {statusEstoque.map((status) => (
                              <option
                                key={status.id_status}
                                value={status.id_status}
                              >
                                {status.nome ||
                                  status.codigo ||
                                  `Status #${status.id_status}`}{" "}
                                · ID {status.id_status}
                              </option>
                            ))}
                          </select>
                          <small>
                            Opções consultadas no catálogo central de status.
                          </small>
                        </div>

                        <div className="campo produto-estoque-inicial__quantidade">
                          <label htmlFor="estoque-quantidade-inicial">
                            Quantidade inicial <span>*</span>
                          </label>
                          <input
                            id="estoque-quantidade-inicial"
                            type="number"
                            min="0"
                            step="0.001"
                            value={quantidadeEstoqueInicial}
                            onChange={(evento) =>
                              setQuantidadeEstoqueInicial(evento.target.value)
                            }
                            placeholder="0.000"
                          />
                          <small>
                            Unidades que estarão disponíveis no local escolhido.
                            O reservado começa em 0.
                          </small>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="produto-estoque-inicial__nota">
                      O produto será criado com controle de estoque, mas sem
                      saldo inicial. Você poderá cadastrar o saldo depois em
                      Estoque → Saldos.
                    </p>
                  )}
                </div>
              </section>

              <section className="form-card produto-seo-card">
                <div className="card-cabecalho compacto produto-seo-card__cabecalho">
                  <div className="card-icone">
                    <Search size={19} />
                  </div>
                  <div>
                    <h2>Otimização SEO</h2>
                    <p>
                      Personalize como o produto aparece nos resultados de
                      busca. Esta etapa é opcional.
                    </p>
                  </div>
                  <span className="card-numero">SEO</span>
                </div>
                <div className="campo produto-seo-card__titulo">
                  <label htmlFor="seo-titulo">Título SEO</label>
                  <input
                    id="seo-titulo"
                    maxLength={180}
                    value={seoTitulo}
                    onChange={(e) => setSeoTitulo(e.target.value)}
                    placeholder="Ex.: Vaso decorativo de cerâmica | Universo Império"
                  />
                  <small>
                    {seoTitulo.length}/180 caracteres. Recomendado: título claro
                    e objetivo.
                  </small>
                </div>
                <div className="campo sem-margem produto-seo-card__descricao">
                  <label htmlFor="seo-descricao">Descrição SEO</label>
                  <textarea
                    id="seo-descricao"
                    rows={3}
                    maxLength={320}
                    value={seoDescricao}
                    onChange={(e) => setSeoDescricao(e.target.value)}
                    placeholder="Resuma os principais benefícios e características do produto para os mecanismos de busca..."
                  />
                  <small>{seoDescricao.length}/320 caracteres.</small>
                </div>
              </section>

              <section className="resumo-final produto-resumo-grade-completo">
                {imagemPrincipal ? (
                  <img
                    src={imagemPrincipal.previewUrl}
                    alt={imagemPrincipal.textoAlternativo || nome}
                  />
                ) : (
                  <div className="resumo-imagem-vazia">
                    <ImageIcon size={22} />
                  </div>
                )}
                <div>
                  <small>RESUMO DO PRODUTO</small>
                  <strong>{nome || "Nome do produto"}</strong>
                  <span>{sku}</span>
                </div>
                <b>
                  {Number(preco || 0).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </b>
              </section>
            </div>
          )}

          <footer className="formulario-rodape">
            <div className="rodape-informacao">
              <ShieldCheck size={17} />
              <span>Etapa {etapa} de 3 · Cadastro guiado do produto.</span>
            </div>
            <div className="rodape-acoes">
              {etapa > 1 ? (
                <button
                  type="button"
                  className="botao-secundario"
                  onClick={voltarEtapa}
                  disabled={salvando}
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
              ) : (
                <Link
                  href={ROTAS.PRODUTOS.PAINEL.LISTAR}
                  className="botao-secundario"
                >
                  Cancelar
                </Link>
              )}
              {etapa < 3 ? (
                <button
                  type="button"
                  className="botao-salvar"
                  onClick={avancarEtapa}
                >
                  Continuar <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="botao-salvar"
                  disabled={salvando || !!idProdutoCriado}
                >
                  {salvando ? (
                    <>
                      <LoaderCircle className="girando" size={17} /> Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={17} /> Cadastrar produto
                    </>
                  )}
                </button>
              )}
            </div>
          </footer>
        </form>
      )}
    </main>
  );
}
