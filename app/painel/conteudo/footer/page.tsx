"use client";

import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronRight,
  Edit3,
  Eye,
  EyeOff,
  FileJson,
  FileText,
  FolderOpen,
  GripVertical,
  Hash,
  Layers,
  Link2,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";

// =====================================================
// TIPOS
// =====================================================

type ValorBooleano = boolean | number | string;

type Rodape = {
  id_rodape: number;
  status_id: number;
  nome: string;
  codigo: string;
  ativo: ValorBooleano;
  criado_em?: string | null;
};

type RodapeItem = {
  id_rodape_item: number;
  status_id: number;
  rodape_id: number;
  titulo: string;
  url: string | null;
  icone: string | null;
  ordem: number;
  ativo: ValorBooleano;
};

type FormularioRodape = {
  status_id: number;
  nome: string;
  codigo: string;
  ativo: boolean;
};

type FormularioItem = {
  status_id: number;
  titulo: string;
  url: string;
  icone: string;
  ordem: number;
  ativo: boolean;
};

type ConfiguracaoRodape = {
  id_rodape_configuracao: number;
  status_id: number;
  nome: string;
  descricao: string;
  imagem_url: string;
  imagem_alt: string;
  ativo: ValorBooleano;
  criado_em?: string | null;
};

type RedeSocialRodape = {
  id_rodape_rede_social: number;
  rodape_configuracao_id: number;
  status_id: number;
  nome: string;
  url: string;
  icone: string;
  ordem: number;
  ativo: ValorBooleano;
};

type FormularioConfiguracaoRodape = {
  status_id: number;
  nome: string;
  descricao: string;
  imagem_url: string;
  imagem_alt: string;
  ativo: boolean;
};

type FormularioRedeSocial = {
  status_id: number;
  nome: string;
  url: string;
  icone: string;
  ordem: number;
  ativo: boolean;
};

// Estrutura aceita na importação em lote por JSON.
type ItemImportacaoJson = {
  status_id?: number;
  titulo: string;
  url?: string | null;
  icone?: string | null;
  ordem?: number;
  ativo?: boolean | number | string;
};

type RodapeImportacaoJson = {
  status_id?: number;
  nome: string;
  codigo: string;
  ativo?: boolean | number | string;
  itens?: ItemImportacaoJson[];
};

const FORM_RODAPE_INICIAL: FormularioRodape = {
  status_id: 1,
  nome: "",
  codigo: "",
  ativo: true,
};

const FORM_ITEM_INICIAL: FormularioItem = {
  status_id: 1,
  titulo: "",
  url: "",
  icone: "",
  ordem: 1,
  ativo: true,
};

const FORM_CONFIGURACAO_INICIAL: FormularioConfiguracaoRodape = {
  status_id: 1,
  nome: "Universo Império",
  descricao: "Presentes, Decoração e Personalizados para todos os momentos.",
  imagem_url: "",
  imagem_alt: "Logo Universo Império",
  ativo: true,
};

const FORM_REDE_SOCIAL_INICIAL: FormularioRedeSocial = {
  status_id: 1,
  nome: "",
  url: "",
  icone: "instagram",
  ordem: 1,
  ativo: true,
};

// =====================================================
// NORMALIZAÇÃO DE RESPOSTAS DA API
// =====================================================

function interpretarJson(texto: string): any {
  const inicio = texto.search(/[\[{]/);
  if (inicio < 0) return texto;

  const pilha: string[] = [];
  let emString = false;
  let escape = false;

  for (let i = inicio; i < texto.length; i += 1) {
    const caractere = texto[i];

    if (emString) {
      if (escape) escape = false;
      else if (caractere === "\\") escape = true;
      else if (caractere === '"') emString = false;
      continue;
    }

    if (caractere === '"') {
      emString = true;
      continue;
    }

    if (caractere === "{" || caractere === "[") {
      pilha.push(caractere);
      continue;
    }

    if (caractere === "}" || caractere === "]") {
      pilha.pop();
      if (pilha.length === 0) {
        try {
          return JSON.parse(texto.slice(inicio, i + 1));
        } catch {
          return texto;
        }
      }
    }
  }

  return texto;
}

function obterCorpoResposta(resposta: any): any {
  let corpo = resposta;

  if (
    corpo &&
    typeof corpo === "object" &&
    Object.prototype.hasOwnProperty.call(corpo, "data")
  ) {
    corpo = corpo.data ?? corpo;
  }

  if (typeof corpo === "string") {
    corpo = interpretarJson(corpo.trim());
  }

  return corpo;
}

function validarResposta(resposta: any): void {
  const payload = obterCorpoResposta(resposta);

  if (
    payload?.sucesso === false ||
    payload?.dados?.sucesso === false ||
    (typeof payload?.status === "number" && payload.status >= 400)
  ) {
    throw new Error(
      payload?.mensagem ||
        payload?.dados?.mensagem ||
        payload?.erro ||
        payload?.dados?.erro ||
        "A operação não foi concluída.",
    );
  }
}

function extrairArray<T>(resposta: any, chaveLista: string): T[] {
  const raiz = obterCorpoResposta(resposta);
  const visitados = new Set<any>();
  const fila: any[] = [raiz];
  const envelopes = ["dados", "data", "resultado", "payload", "body"];

  while (fila.length > 0) {
    const atual = fila.shift();
    if (atual === null || atual === undefined) continue;
    if (Array.isArray(atual)) return atual as T[];
    if (typeof atual !== "object" || visitados.has(atual)) continue;

    visitados.add(atual);

    if (Array.isArray(atual[chaveLista])) {
      return atual[chaveLista] as T[];
    }

    for (const chave of envelopes) {
      const filho = atual[chave];
      if (filho !== undefined && filho !== null) fila.push(filho);
    }
  }

  return [];
}

function extrairObjeto<T>(resposta: any, chaves: string[]): T | null {
  const raiz = obterCorpoResposta(resposta);
  const visitados = new Set<any>();
  const fila: any[] = [raiz];
  const envelopes = ["dados", "data", "resultado", "payload", "body"];

  while (fila.length > 0) {
    const atual = fila.shift();
    if (atual === null || atual === undefined) continue;
    if (
      typeof atual !== "object" ||
      Array.isArray(atual) ||
      visitados.has(atual)
    )
      continue;

    visitados.add(atual);

    for (const chave of chaves) {
      const candidato = atual[chave];
      if (
        candidato &&
        typeof candidato === "object" &&
        !Array.isArray(candidato)
      ) {
        return candidato as T;
      }
    }

    for (const chave of envelopes) {
      const filho = atual[chave];
      if (filho !== undefined && filho !== null) fila.push(filho);
    }
  }

  return null;
}

function erroApi(error: any, padrao: string): string {
  const resposta = error?.response?.data;
  const dados = resposta?.dados;

  return (
    dados?.detalhe ||
    dados?.erro ||
    dados?.mensagem ||
    resposta?.detalhe ||
    resposta?.erro ||
    resposta?.mensagem ||
    resposta?.message ||
    error?.message ||
    padrao
  );
}

function estaAtivo(valor: ValorBooleano): boolean {
  return (
    valor === true ||
    valor === 1 ||
    valor === "1" ||
    String(valor).toLowerCase() === "true"
  );
}

function formatarData(valor?: string | null): string {
  if (!valor) return "—";
  const data = new Date(valor.replace(" ", "T"));
  return Number.isNaN(data.getTime())
    ? valor
    : data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function normalizarRodape(item: any): Rodape {
  return {
    id_rodape: Number(item?.id_rodape ?? item?.id ?? 0),
    status_id: Number(item?.status_id ?? 1),
    nome: String(item?.nome ?? ""),
    codigo: String(item?.codigo ?? ""),
    ativo: item?.ativo ?? false,
    criado_em: item?.criado_em ?? null,
  };
}

function normalizarItem(item: any): RodapeItem {
  return {
    id_rodape_item: Number(item?.id_rodape_item ?? item?.id ?? 0),
    status_id: Number(item?.status_id ?? 1),
    rodape_id: Number(item?.rodape_id ?? 0),
    titulo: String(item?.titulo ?? ""),
    url: item?.url == null ? null : String(item.url),
    icone: item?.icone == null ? null : String(item.icone),
    ordem: Number(item?.ordem ?? 0),
    ativo: item?.ativo ?? false,
  };
}

function normalizarConfiguracaoRodape(item: any): ConfiguracaoRodape {
  return {
    id_rodape_configuracao: Number(
      item?.id_rodape_configuracao ?? item?.id ?? 0,
    ),
    status_id: Number(item?.status_id ?? 1),
    nome: String(item?.nome ?? item?.titulo ?? "Universo Império"),
    descricao: String(item?.descricao ?? ""),
    imagem_url: String(item?.imagem_url ?? ""),
    imagem_alt: String(item?.imagem_alt ?? ""),
    ativo: item?.ativo ?? true,
    criado_em: item?.criado_em ?? null,
  };
}

function normalizarRedeSocial(item: any): RedeSocialRodape {
  return {
    id_rodape_rede_social: Number(item?.id_rodape_rede_social ?? item?.id ?? 0),
    rodape_configuracao_id: Number(item?.rodape_configuracao_id ?? 0),
    status_id: Number(item?.status_id ?? 1),
    nome: String(item?.nome ?? ""),
    url: String(item?.url ?? ""),
    icone: String(item?.icone ?? "instagram"),
    ordem: Number(item?.ordem ?? 0),
    ativo: item?.ativo ?? true,
  };
}

function localizarConfiguracaoRodape(resposta: any): any | null {
  const configuracaoPorChave = extrairObjeto<any>(resposta, [
    "configuracao",
    "rodape_configuracao",
  ]);
  if (configuracaoPorChave) return configuracaoPorChave;

  const raiz = obterCorpoResposta(resposta);
  const fila: any[] = [raiz];
  const visitados = new Set<any>();
  const envelopes = [
    "dados",
    "data",
    "resultado",
    "payload",
    "body",
    "configuracao",
    "rodape_configuracao",
  ];

  while (fila.length > 0) {
    const atual = fila.shift();
    if (!atual || typeof atual !== "object" || Array.isArray(atual)) continue;
    if (visitados.has(atual)) continue;
    visitados.add(atual);

    if (
      atual.id_rodape_configuracao !== undefined ||
      (atual.id !== undefined &&
        (atual.nome !== undefined || atual.titulo !== undefined) &&
        (atual.descricao !== undefined || atual.imagem_url !== undefined))
    ) {
      return atual;
    }

    for (const chave of envelopes) {
      const filho = atual[chave];
      if (filho !== undefined && filho !== null) {
        if (Array.isArray(filho)) fila.push(...filho);
        else fila.push(filho);
      }
    }
  }

  return null;
}

function extrairIdCriado(resposta: any, chavesId: string[]): number | null {
  const raiz = obterCorpoResposta(resposta);
  const fila: any[] = [raiz];
  const visitados = new Set<any>();
  const envelopes = ["dados", "data", "resultado", "payload", "body", "rodape"];

  while (fila.length > 0) {
    const atual = fila.shift();
    if (!atual || typeof atual !== "object" || visitados.has(atual)) continue;
    visitados.add(atual);

    for (const chave of chavesId) {
      const id = Number(atual[chave]);
      if (Number.isInteger(id) && id > 0) return id;
    }

    for (const chave of envelopes) {
      const filho = atual[chave];
      if (filho !== undefined && filho !== null) fila.push(filho);
    }
  }

  return null;
}

function normalizarCodigo(codigo: string): string {
  return codigo.trim().toUpperCase().replace(/\s+/g, "_");
}

// =====================================================
// COMPONENTE
// =====================================================

export default function FooterAdminPage() {
  const [rodapes, setRodapes] = useState<Rodape[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<
    "todos" | "ativos" | "inativos"
  >("todos");

  const [modalRodapeAberto, setModalRodapeAberto] = useState(false);
  const [rodapeEditando, setRodapeEditando] = useState<Rodape | null>(null);
  const [formRodape, setFormRodape] =
    useState<FormularioRodape>(FORM_RODAPE_INICIAL);
  const [salvandoRodape, setSalvandoRodape] = useState(false);
  const [excluindoRodape, setExcluindoRodape] = useState<number | null>(null);
  const [alterandoAtivoRodape, setAlterandoAtivoRodape] = useState<
    number | null
  >(null);

  const [modalItensAberto, setModalItensAberto] = useState(false);
  const [rodapeSelecionado, setRodapeSelecionado] = useState<Rodape | null>(
    null,
  );
  const [itens, setItens] = useState<RodapeItem[]>([]);
  const [carregandoItens, setCarregandoItens] = useState(false);
  const [erroItens, setErroItens] = useState("");
  const [atualizandoItem, setAtualizandoItem] = useState<number | null>(null);
  const [excluindoItem, setExcluindoItem] = useState<number | null>(null);

  const [modalItemAberto, setModalItemAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState<RodapeItem | null>(null);
  const [formItem, setFormItem] = useState<FormularioItem>(FORM_ITEM_INICIAL);
  const [salvandoItem, setSalvandoItem] = useState(false);

  const [modalImportacaoAberto, setModalImportacaoAberto] = useState(false);
  const [jsonImportacao, setJsonImportacao] = useState("");
  const [importandoJson, setImportandoJson] = useState(false);
  const [erroItensImportacao, setErroItensImportacao] = useState("");

  // Configuração visual do rodapé e redes sociais ficam em uma área separada
  // do cadastro das colunas e de seus links.
  const [modalConfiguracaoAberto, setModalConfiguracaoAberto] = useState(false);
  const [configuracaoRodape, setConfiguracaoRodape] =
    useState<ConfiguracaoRodape | null>(null);
  const [formConfiguracao, setFormConfiguracao] =
    useState<FormularioConfiguracaoRodape>(FORM_CONFIGURACAO_INICIAL);
  const [carregandoConfiguracao, setCarregandoConfiguracao] = useState(false);
  const [salvandoConfiguracao, setSalvandoConfiguracao] = useState(false);
  const [erroConfiguracao, setErroConfiguracao] = useState("");
  const [configuracoesRodape, setConfiguracoesRodape] = useState<
    ConfiguracaoRodape[]
  >([]);
  const [carregandoConfiguracoes, setCarregandoConfiguracoes] = useState(false);
  const [erroConfiguracoes, setErroConfiguracoes] = useState("");
  const [redesSociaisPorConfiguracao, setRedesSociaisPorConfiguracao] =
    useState<Record<number, RedeSocialRodape[]>>({});
  const [redesSociais, setRedesSociais] = useState<RedeSocialRodape[]>([]);
  const [carregandoRedesSociais, setCarregandoRedesSociais] = useState(false);
  const [formRedeSocialAberto, setFormRedeSocialAberto] = useState(false);
  const [redeSocialEditando, setRedeSocialEditando] =
    useState<RedeSocialRodape | null>(null);
  const [formRedeSocial, setFormRedeSocial] = useState<FormularioRedeSocial>(
    FORM_REDE_SOCIAL_INICIAL,
  );
  const [salvandoRedeSocial, setSalvandoRedeSocial] = useState(false);
  const [erroRedeSocial, setErroRedeSocial] = useState("");
  const [excluindoRedeSocial, setExcluindoRedeSocial] = useState<number | null>(
    null,
  );
  const [alterandoAtivoRedeSocial, setAlterandoAtivoRedeSocial] = useState<
    number | null
  >(null);

  const carregarRodapes = useCallback(async (silencioso = false) => {
    try {
      if (silencioso) setAtualizando(true);
      else setCarregando(true);

      setErro("");

      const resposta = await conexao.get(ROTAS.RODAPES.PAINEL.LISTAR, {
        withCredentials: true,
      });

      validarResposta(resposta);

      const registros = extrairArray<any>(resposta, "rodapes")
        .map(normalizarRodape)
        .filter((item) => item.id_rodape > 0);

      setRodapes(registros);
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível carregar os rodapés."));
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  // Busca todas as configurações visuais pelo endpoint administrativo e, em
  // seguida, carrega suas redes sociais para exibir o resumo na tabela.
  const carregarConfiguracoesRodape = useCallback(
    async (silencioso = false) => {
      try {
        setCarregandoConfiguracoes(!silencioso);
        setErroConfiguracoes("");

        const resposta = await conexao.get(
          ROTAS.RODAPES.PAINEL.CONFIGURACAO.LISTAR,
          { withCredentials: true },
        );
        validarResposta(resposta);

        const registros = extrairArray<any>(resposta, "configuracoes")
          .map(normalizarConfiguracaoRodape)
          .filter((item) => item.id_rodape_configuracao > 0);

        setConfiguracoesRodape(registros);

        const paresRedes = await Promise.all(
          registros.map(async (configuracao) => {
            try {
              const respostaRedes = await conexao.get(
                ROTAS.RODAPES.PAINEL.REDES_SOCIAIS.LISTAR(
                  configuracao.id_rodape_configuracao,
                ),
                { withCredentials: true },
              );
              validarResposta(respostaRedes);
              const lista = extrairArray<any>(respostaRedes, "redes_sociais")
                .map(normalizarRedeSocial)
                .filter(
                  (rede: RedeSocialRodape) => rede.id_rodape_rede_social > 0,
                )
                .sort(
                  (a: RedeSocialRodape, b: RedeSocialRodape) =>
                    a.ordem - b.ordem,
                );
              return [configuracao.id_rodape_configuracao, lista] as const;
            } catch {
              // A configuração continua visível mesmo se a consulta de redes falhar.
              return [configuracao.id_rodape_configuracao, []] as const;
            }
          }),
        );

        setRedesSociaisPorConfiguracao(
          Object.fromEntries(paresRedes) as Record<number, RedeSocialRodape[]>,
        );
      } catch (error: any) {
        setErroConfiguracoes(
          erroApi(
            error,
            "Não foi possível carregar as configurações do rodapé.",
          ),
        );
        setConfiguracoesRodape([]);
        setRedesSociaisPorConfiguracao({});
      } finally {
        setCarregandoConfiguracoes(false);
      }
    },
    [],
  );

  useEffect(() => {
    void carregarRodapes();
    void carregarConfiguracoesRodape();
  }, [carregarRodapes, carregarConfiguracoesRodape]);

  useEffect(() => {
    if (!sucesso) return;
    const temporizador = window.setTimeout(() => setSucesso(""), 4000);
    return () => window.clearTimeout(temporizador);
  }, [sucesso]);

  const rodapesFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return rodapes.filter((rodape) => {
      const correspondeBusca =
        !termo ||
        rodape.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        rodape.codigo.toLocaleLowerCase("pt-BR").includes(termo);

      const ativo = estaAtivo(rodape.ativo);
      const correspondeStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativos" && ativo) ||
        (filtroStatus === "inativos" && !ativo);

      return correspondeBusca && correspondeStatus;
    });
  }, [rodapes, busca, filtroStatus]);

  const totalAtivos = rodapes.filter((item) => estaAtivo(item.ativo)).length;
  const totalInativos = rodapes.length - totalAtivos;

  function abrirNovoRodape() {
    setRodapeEditando(null);
    setFormRodape(FORM_RODAPE_INICIAL);
    setModalRodapeAberto(true);
    setErro("");
  }

  function abrirEdicaoRodape(rodape: Rodape) {
    setRodapeEditando(rodape);
    setFormRodape({
      status_id: rodape.status_id || 1,
      nome: rodape.nome,
      codigo: rodape.codigo,
      ativo: estaAtivo(rodape.ativo),
    });
    setModalRodapeAberto(true);
    setErro("");
  }

  async function salvarRodape(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!formRodape.nome.trim() || !formRodape.codigo.trim()) {
      setErro("Informe o nome e o código do rodapé.");
      return;
    }

    try {
      setSalvandoRodape(true);
      setErro("");

      const payload = {
        status_id: Number(formRodape.status_id) || 1,
        nome: formRodape.nome.trim(),
        codigo: formRodape.codigo.trim().toUpperCase().replace(/\s+/g, "_"),
        ativo: formRodape.ativo,
      };

      const resposta = rodapeEditando
        ? await conexao.put(
            ROTAS.RODAPES.PAINEL.ATUALIZAR(rodapeEditando.id_rodape),
            payload,
            { withCredentials: true },
          )
        : await conexao.post(ROTAS.RODAPES.PAINEL.CADASTRAR, payload, {
            withCredentials: true,
          });

      validarResposta(resposta);

      setModalRodapeAberto(false);
      setSucesso(
        rodapeEditando
          ? "Rodapé atualizado com sucesso."
          : "Rodapé cadastrado com sucesso.",
      );
      await carregarRodapes(true);
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível salvar o rodapé."));
    } finally {
      setSalvandoRodape(false);
    }
  }

  function abrirImportacaoJson() {
    setErro("");
    setErroItensImportacao("");
    setJsonImportacao("");
    setModalImportacaoAberto(true);
  }

  async function importarArquivoJson(evento: any) {
    const arquivo = evento.target.files?.[0] as File | undefined;
    if (!arquivo) return;

    try {
      const conteudo = await arquivo.text();
      setJsonImportacao(conteudo);
      setErro("");
    } catch {
      setErro("Não foi possível ler o arquivo selecionado.");
    } finally {
      // Permite selecionar novamente o mesmo arquivo caso seja necessário.
      evento.target.value = "";
    }
  }

  async function localizarRodapePorCodigo(
    codigo: string,
  ): Promise<number | null> {
    const resposta = await conexao.get(ROTAS.RODAPES.PAINEL.LISTAR, {
      withCredentials: true,
    });
    validarResposta(resposta);

    const registros = extrairArray<any>(resposta, "rodapes");
    const encontrado = registros
      .map(normalizarRodape)
      .find(
        (item) => normalizarCodigo(item.codigo) === normalizarCodigo(codigo),
      );

    return encontrado?.id_rodape || null;
  }

  async function salvarImportacaoJson(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    let estrutura: any;
    try {
      estrutura = JSON.parse(jsonImportacao);
    } catch (error: any) {
      setErroItensImportacao(
        `JSON inválido: ${error?.message || "verifique vírgulas, aspas e chaves."}`,
      );
      return;
    }

    const lista: any[] = Array.isArray(estrutura)
      ? estrutura
      : estrutura?.rodapes;

    if (!Array.isArray(lista) || lista.length === 0) {
      setErroItensImportacao(
        'O JSON precisa conter uma lista "rodapes" com pelo menos uma coluna.',
      );
      return;
    }

    const codigosArquivo = new Set<string>();
    const rodapesValidados: RodapeImportacaoJson[] = [];

    try {
      lista.forEach((rodape, indice) => {
        if (!rodape || typeof rodape !== "object" || Array.isArray(rodape)) {
          throw new Error(
            `O rodapé na posição ${indice + 1} não é um objeto válido.`,
          );
        }

        const nome = String(rodape.nome ?? "").trim();
        const codigo = normalizarCodigo(String(rodape.codigo ?? ""));
        const itensJson = rodape.itens ?? [];

        if (!nome || !codigo) {
          throw new Error(
            `O rodapé na posição ${indice + 1} precisa de "nome" e "codigo".`,
          );
        }
        if (!Array.isArray(itensJson)) {
          throw new Error(
            `A propriedade "itens" de "${nome}" precisa ser uma lista.`,
          );
        }
        if (codigosArquivo.has(codigo)) {
          throw new Error(`O código "${codigo}" está repetido no JSON.`);
        }
        codigosArquivo.add(codigo);

        const itensNormalizados: ItemImportacaoJson[] = itensJson.map(
          (item: any, indiceItem: number) => {
            const titulo = String(item?.titulo ?? "").trim();
            if (!titulo) {
              throw new Error(
                `O item ${indiceItem + 1} da coluna "${nome}" precisa de "titulo".`,
              );
            }

            return {
              status_id: Number(item?.status_id) || 1,
              titulo,
              url: item?.url == null ? null : String(item.url).trim() || null,
              icone:
                item?.icone == null ? null : String(item.icone).trim() || null,
              ordem: Math.max(0, Number(item?.ordem) || indiceItem + 1),
              ativo: item?.ativo ?? true,
            };
          },
        );

        rodapesValidados.push({
          status_id: Number(rodape.status_id) || 1,
          nome,
          codigo,
          ativo: rodape.ativo ?? true,
          itens: itensNormalizados,
        });
      });
    } catch (error: any) {
      setErroItensImportacao(error?.message || "Há dados inválidos no JSON.");
      return;
    }

    const codigosExistentes = new Set(
      rodapes.map((item) => normalizarCodigo(item.codigo)),
    );
    const codigoExistente = rodapesValidados.find((item) =>
      codigosExistentes.has(normalizarCodigo(item.codigo)),
    );

    if (codigoExistente) {
      setErroItensImportacao(
        `A coluna "${codigoExistente.nome}" (${codigoExistente.codigo}) já existe. Remova-a do JSON ou use outro código para evitar duplicidade.`,
      );
      return;
    }

    let totalRodapesCriados = 0;
    let totalItensCriados = 0;
    let colunaAtual = "";

    try {
      setImportandoJson(true);
      setErroItensImportacao("");
      setErro("");

      for (const rodape of rodapesValidados) {
        colunaAtual = rodape.nome;
        const payloadRodape = {
          status_id: rodape.status_id || 1,
          nome: rodape.nome,
          codigo: normalizarCodigo(rodape.codigo),
          ativo: rodape.ativo,
        };

        const respostaRodape = await conexao.post(
          ROTAS.RODAPES.PAINEL.CADASTRAR,
          payloadRodape,
          { withCredentials: true },
        );
        validarResposta(respostaRodape);
        totalRodapesCriados += 1;

        let rodapeId = extrairIdCriado(respostaRodape, [
          "id_rodape",
          "id",
          "insert_id",
          "insertId",
          "lastInsertId",
        ]);

        // Algumas respostas da API não retornam o ID. Nesse caso, consulta-se
        // a listagem pelo código recém-cadastrado antes de inserir os itens.
        if (!rodapeId) {
          rodapeId = await localizarRodapePorCodigo(rodape.codigo);
        }

        if (!rodapeId) {
          throw new Error(
            `A coluna "${rodape.nome}" foi cadastrada, mas a API não retornou nem permitiu localizar seu ID. Os itens desta coluna não foram inseridos.`,
          );
        }

        for (const item of rodape.itens || []) {
          const payloadItem = {
            status_id: item.status_id || 1,
            rodape_id: rodapeId,
            titulo: item.titulo,
            url: item.url ?? null,
            icone: item.icone ?? null,
            ordem: item.ordem ?? 1,
            ativo: item.ativo ?? true,
          };

          const respostaItem = await conexao.post(
            ROTAS.RODAPES.PAINEL.ITENS.CADASTRAR(rodapeId),
            payloadItem,
            { withCredentials: true },
          );
          validarResposta(respostaItem);
          totalItensCriados += 1;
        }
      }

      setModalImportacaoAberto(false);
      setJsonImportacao("");
      setSucesso(
        `Importação concluída: ${totalRodapesCriados} rodapés e ${totalItensCriados} links cadastrados.`,
      );
      await carregarRodapes(true);
    } catch (error: any) {
      setErroItensImportacao(
        `A importação foi interrompida durante a coluna "${colunaAtual}". ${error?.message || "Verifique a API."} Já foram cadastrados ${totalRodapesCriados} rodapés e ${totalItensCriados} links. Confira a listagem antes de tentar novamente para evitar duplicidades.`,
      );
      await carregarRodapes(true);
    } finally {
      setImportandoJson(false);
    }
  }

  async function alterarAtivoRodape(rodape: Rodape) {
    const novoAtivo = !estaAtivo(rodape.ativo);

    try {
      setAlterandoAtivoRodape(rodape.id_rodape);
      setErro("");

      const resposta = await conexao.put(
        ROTAS.RODAPES.PAINEL.ALTERAR_ATIVO(rodape.id_rodape),
        { ativo: novoAtivo },
        { withCredentials: true },
      );

      validarResposta(resposta);
      setSucesso(novoAtivo ? "Rodapé ativado." : "Rodapé desativado.");
      await carregarRodapes(true);
    } catch (error: any) {
      setErro(
        erroApi(error, "Não foi possível alterar a disponibilidade do rodapé."),
      );
    } finally {
      setAlterandoAtivoRodape(null);
    }
  }

  async function excluirRodape(rodape: Rodape) {
    const confirmar = window.confirm(
      `Deseja excluir o rodapé "${rodape.nome}"? Se houver links vinculados, remova-os primeiro.`,
    );
    if (!confirmar) return;

    try {
      setExcluindoRodape(rodape.id_rodape);
      setErro("");

      const resposta = await conexao.delete(
        ROTAS.RODAPES.PAINEL.EXCLUIR(rodape.id_rodape),
        { withCredentials: true },
      );

      validarResposta(resposta);
      setSucesso("Rodapé excluído com sucesso.");
      await carregarRodapes(true);
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível excluir o rodapé."));
    } finally {
      setExcluindoRodape(null);
    }
  }

  const carregarItens = useCallback(async (rodapeId: number) => {
    try {
      setCarregandoItens(true);
      setErroItens("");

      const resposta = await conexao.get(
        ROTAS.RODAPES.PAINEL.ITENS.LISTAR(rodapeId),
        { withCredentials: true },
      );

      validarResposta(resposta);

      const registros = extrairArray<any>(resposta, "itens")
        .map(normalizarItem)
        .filter((item) => item.id_rodape_item > 0);

      setItens(registros);
    } catch (error: any) {
      setErroItens(
        erroApi(error, "Não foi possível carregar os links deste rodapé."),
      );
      setItens([]);
    } finally {
      setCarregandoItens(false);
    }
  }, []);

  async function abrirGerenciamentoItens(rodape: Rodape) {
    setRodapeSelecionado(rodape);
    setItens([]);
    setModalItensAberto(true);
    setErroItens("");
    await carregarItens(rodape.id_rodape);
  }

  function abrirNovoItem() {
    setErroItens("");
    setItemEditando(null);
    setFormItem({
      ...FORM_ITEM_INICIAL,
      ordem: Math.max(0, ...itens.map((item) => item.ordem)) + 1,
    });
    setModalItemAberto(true);
  }

  function abrirEdicaoItem(item: RodapeItem) {
    setErroItens("");
    setItemEditando(item);
    setFormItem({
      status_id: item.status_id || 1,
      titulo: item.titulo,
      url: item.url ?? "",
      icone: item.icone ?? "",
      ordem: item.ordem,
      ativo: estaAtivo(item.ativo),
    });
    setModalItemAberto(true);
  }

  async function salvarItem(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!rodapeSelecionado) return;

    if (!formItem.titulo.trim()) {
      setErroItens("Informe o título do link.");
      return;
    }

    try {
      setSalvandoItem(true);
      setErroItens("");

      const payload = {
        status_id: Number(formItem.status_id) || 1,
        rodape_id: rodapeSelecionado.id_rodape,
        titulo: formItem.titulo.trim(),
        url: formItem.url.trim() || null,
        icone: formItem.icone.trim() || null,
        ordem: Math.max(0, Number(formItem.ordem) || 0),
        ativo: formItem.ativo,
      };

      const resposta = itemEditando
        ? await conexao.put(
            ROTAS.RODAPES.PAINEL.ITENS.ATUALIZAR(itemEditando.id_rodape_item),
            payload,
            { withCredentials: true },
          )
        : await conexao.post(
            ROTAS.RODAPES.PAINEL.ITENS.CADASTRAR(rodapeSelecionado.id_rodape),
            payload,
            { withCredentials: true },
          );

      validarResposta(resposta);

      setModalItemAberto(false);
      setSucesso(
        itemEditando
          ? "Link atualizado com sucesso."
          : "Link adicionado ao rodapé.",
      );
      await carregarItens(rodapeSelecionado.id_rodape);
    } catch (error: any) {
      setErroItens(erroApi(error, "Não foi possível salvar o link."));
    } finally {
      setSalvandoItem(false);
    }
  }

  async function alterarAtivoItem(item: RodapeItem) {
    const novoAtivo = !estaAtivo(item.ativo);

    try {
      setAtualizandoItem(item.id_rodape_item);
      setErroItens("");

      const resposta = await conexao.put(
        ROTAS.RODAPES.PAINEL.ITENS.ALTERAR_ATIVO(item.id_rodape_item),
        { ativo: novoAtivo },
        { withCredentials: true },
      );

      validarResposta(resposta);
      await carregarItens(item.rodape_id);
      setSucesso(novoAtivo ? "Link ativado." : "Link desativado.");
    } catch (error: any) {
      setErroItens(erroApi(error, "Não foi possível alterar o link."));
    } finally {
      setAtualizandoItem(null);
    }
  }

  async function alterarOrdemItem(item: RodapeItem, delta: number) {
    const ordenados = [...itens].sort(
      (a, b) => a.ordem - b.ordem || a.id_rodape_item - b.id_rodape_item,
    );
    const indiceAtual = ordenados.findIndex(
      (registro) => registro.id_rodape_item === item.id_rodape_item,
    );
    const indiceDestino = indiceAtual + (delta < 0 ? -1 : 1);

    if (
      indiceAtual < 0 ||
      indiceDestino < 0 ||
      indiceDestino >= ordenados.length
    ) {
      return;
    }

    const [movido] = ordenados.splice(indiceAtual, 1);
    ordenados.splice(indiceDestino, 0, movido);

    try {
      setAtualizandoItem(item.id_rodape_item);
      setErroItens("");

      // Reindexa a lista inteira para evitar ordens duplicadas após a troca.
      await Promise.all(
        ordenados.map((registro, indice) =>
          conexao.put(
            ROTAS.RODAPES.PAINEL.ITENS.ALTERAR_ORDEM(registro.id_rodape_item),
            { ordem: indice + 1 },
            { withCredentials: true },
          ),
        ),
      );

      await carregarItens(item.rodape_id);
      setSucesso("Ordem dos links atualizada.");
    } catch (error: any) {
      setErroItens(
        erroApi(error, "Não foi possível alterar a ordem dos links."),
      );
    } finally {
      setAtualizandoItem(null);
    }
  }

  async function excluirItem(item: RodapeItem) {
    const confirmar = window.confirm(
      `Deseja remover o link "${item.titulo}" deste rodapé?`,
    );
    if (!confirmar) return;

    try {
      setExcluindoItem(item.id_rodape_item);
      setErroItens("");

      const resposta = await conexao.delete(
        ROTAS.RODAPES.PAINEL.ITENS.EXCLUIR(item.id_rodape_item),
        { withCredentials: true },
      );

      validarResposta(resposta);
      setSucesso("Link removido com sucesso.");

      if (rodapeSelecionado) {
        await carregarItens(rodapeSelecionado.id_rodape);
      }
    } catch (error: any) {
      setErroItens(erroApi(error, "Não foi possível excluir o link."));
    } finally {
      setExcluindoItem(null);
    }
  }

  function fecharModalItens() {
    if (modalItemAberto && salvandoItem) return;
    setModalItemAberto(false);
    setModalItensAberto(false);
    setRodapeSelecionado(null);
    setItens([]);
  }

  async function carregarRedesSociais(configuracaoId: number) {
    try {
      setCarregandoRedesSociais(true);
      setErroRedeSocial("");

      const resposta = await conexao.get(
        ROTAS.RODAPES.PAINEL.REDES_SOCIAIS.LISTAR(configuracaoId),
        { withCredentials: true },
      );
      validarResposta(resposta);

      const registros = extrairArray<any>(resposta, "redes_sociais")
        .map(normalizarRedeSocial)
        .filter((rede: RedeSocialRodape) => rede.id_rodape_rede_social > 0)
        .sort(
          (a: RedeSocialRodape, b: RedeSocialRodape) =>
            a.ordem - b.ordem ||
            a.id_rodape_rede_social - b.id_rodape_rede_social,
        );

      setRedesSociais(registros);
      setRedesSociaisPorConfiguracao((anterior) => ({
        ...anterior,
        [configuracaoId]: registros,
      }));
    } catch (error: any) {
      setErroRedeSocial(
        erroApi(error, "Não foi possível carregar as redes sociais."),
      );
      setRedesSociais([]);
    } finally {
      setCarregandoRedesSociais(false);
    }
  }

  async function abrirConfiguracaoRodape(
    configuracaoSelecionada: ConfiguracaoRodape | null = null,
  ) {
    setModalConfiguracaoAberto(true);
    setCarregandoConfiguracao(Boolean(configuracaoSelecionada));
    setErroConfiguracao("");
    setErroRedeSocial("");
    setFormRedeSocialAberto(false);
    setRedeSocialEditando(null);
    setRedesSociais([]);

    if (!configuracaoSelecionada) {
      setConfiguracaoRodape(null);
      setFormConfiguracao(FORM_CONFIGURACAO_INICIAL);
      setCarregandoConfiguracao(false);
      return;
    }

    setConfiguracaoRodape(configuracaoSelecionada);
    setFormConfiguracao({
      status_id: configuracaoSelecionada.status_id || 1,
      nome: configuracaoSelecionada.nome,
      descricao: configuracaoSelecionada.descricao,
      imagem_url: configuracaoSelecionada.imagem_url,
      imagem_alt: configuracaoSelecionada.imagem_alt,
      ativo: estaAtivo(configuracaoSelecionada.ativo),
    });

    try {
      await carregarRedesSociais(
        configuracaoSelecionada.id_rodape_configuracao,
      );
    } finally {
      setCarregandoConfiguracao(false);
    }
  }

  async function salvarConfiguracaoRodape(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!formConfiguracao.nome.trim()) {
      setErroConfiguracao("Informe o título/nome que será exibido no rodapé.");
      return;
    }

    const payload = {
      status_id: Number(formConfiguracao.status_id) || 1,
      nome: formConfiguracao.nome.trim(),
      descricao: formConfiguracao.descricao.trim(),
      imagem_url: formConfiguracao.imagem_url.trim() || null,
      imagem_alt: formConfiguracao.imagem_alt.trim() || null,
      ativo: formConfiguracao.ativo,
    };

    try {
      setSalvandoConfiguracao(true);
      setErroConfiguracao("");

      if (configuracaoRodape?.id_rodape_configuracao) {
        const resposta = await conexao.put(
          ROTAS.RODAPES.PAINEL.CONFIGURACAO.ATUALIZAR(
            configuracaoRodape.id_rodape_configuracao,
          ),
          payload,
          { withCredentials: true },
        );
        validarResposta(resposta);

        setConfiguracaoRodape({
          ...configuracaoRodape,
          ...payload,
          imagem_url: payload.imagem_url ?? "",
          imagem_alt: payload.imagem_alt ?? "",
        });
        setConfiguracoesRodape((anteriores) =>
          anteriores.map((item) =>
            item.id_rodape_configuracao ===
            configuracaoRodape.id_rodape_configuracao
              ? {
                  ...item,
                  ...payload,
                  imagem_url: payload.imagem_url ?? "",
                  imagem_alt: payload.imagem_alt ?? "",
                }
              : item,
          ),
        );
        setSucesso("Informações do rodapé atualizadas com sucesso.");
        await carregarConfiguracoesRodape(true);
      } else {
        const resposta = await conexao.post(
          ROTAS.RODAPES.PAINEL.CONFIGURACAO.CADASTRAR,
          payload,
          { withCredentials: true },
        );
        validarResposta(resposta);

        let idConfiguracao = extrairIdCriado(resposta, [
          "id_rodape_configuracao",
          "id",
          "insert_id",
          "insertId",
          "lastInsertId",
        ]);

        // Algumas APIs retornam apenas uma mensagem. Nesse caso, consulta a
        // configuração pública recém-criada para recuperar o identificador.
        if (!idConfiguracao) {
          try {
            const consulta = await conexao.get(
              ROTAS.RODAPES.PAINEL.CONFIGURACAO.LISTAR,
              { withCredentials: true },
            );
            const encontradas = extrairArray<any>(consulta, "configuracoes")
              .map(normalizarConfiguracaoRodape)
              .filter((item) => item.nome === payload.nome)
              .sort(
                (a, b) => b.id_rodape_configuracao - a.id_rodape_configuracao,
              );
            idConfiguracao = encontradas[0]?.id_rodape_configuracao || null;
          } catch {
            idConfiguracao = null;
          }
        }

        if (!idConfiguracao) {
          setSucesso(
            "Configuração cadastrada. Reabra esta área para carregar o registro e cadastrar as redes sociais.",
          );
          setConfiguracaoRodape(null);
          return;
        }

        const novaConfiguracao: ConfiguracaoRodape = {
          id_rodape_configuracao: idConfiguracao,
          status_id: payload.status_id,
          nome: payload.nome,
          descricao: payload.descricao,
          imagem_url: payload.imagem_url ?? "",
          imagem_alt: payload.imagem_alt ?? "",
          ativo: payload.ativo,
        };
        setConfiguracaoRodape(novaConfiguracao);
        setSucesso("Configuração do rodapé cadastrada com sucesso.");
        await carregarConfiguracoesRodape(true);
        await carregarRedesSociais(idConfiguracao);
      }
    } catch (error: any) {
      setErroConfiguracao(
        erroApi(error, "Não foi possível salvar a configuração do rodapé."),
      );
    } finally {
      setSalvandoConfiguracao(false);
    }
  }

  function abrirNovaRedeSocial() {
    setRedeSocialEditando(null);
    setFormRedeSocial({
      ...FORM_REDE_SOCIAL_INICIAL,
      ordem: Math.max(0, ...redesSociais.map((rede) => rede.ordem)) + 1,
    });
    setErroRedeSocial("");
    setFormRedeSocialAberto(true);
  }

  function abrirEdicaoRedeSocial(rede: RedeSocialRodape) {
    setRedeSocialEditando(rede);
    setFormRedeSocial({
      status_id: rede.status_id || 1,
      nome: rede.nome,
      url: rede.url,
      icone: rede.icone,
      ordem: rede.ordem,
      ativo: estaAtivo(rede.ativo),
    });
    setErroRedeSocial("");
    setFormRedeSocialAberto(true);
  }

  async function salvarRedeSocial(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const configuracaoId = configuracaoRodape?.id_rodape_configuracao;

    if (!configuracaoId) {
      setErroRedeSocial("Salve primeiro as informações do rodapé.");
      return;
    }
    if (!formRedeSocial.nome.trim() || !formRedeSocial.url.trim()) {
      setErroRedeSocial("Informe o nome e a URL da rede social.");
      return;
    }

    const payload = {
      rodape_configuracao_id: configuracaoId,
      status_id: Number(formRedeSocial.status_id) || 1,
      nome: formRedeSocial.nome.trim(),
      url: formRedeSocial.url.trim(),
      icone: formRedeSocial.icone.trim().toLowerCase(),
      ordem: Math.max(0, Number(formRedeSocial.ordem) || 0),
      ativo: formRedeSocial.ativo,
    };

    try {
      setSalvandoRedeSocial(true);
      setErroRedeSocial("");

      const resposta = redeSocialEditando
        ? await conexao.put(
            ROTAS.RODAPES.PAINEL.REDES_SOCIAIS.ATUALIZAR(
              redeSocialEditando.id_rodape_rede_social,
            ),
            payload,
            { withCredentials: true },
          )
        : await conexao.post(
            ROTAS.RODAPES.PAINEL.REDES_SOCIAIS.CADASTRAR(configuracaoId),
            payload,
            { withCredentials: true },
          );

      validarResposta(resposta);
      setFormRedeSocialAberto(false);
      setRedeSocialEditando(null);
      setSucesso(
        redeSocialEditando
          ? "Rede social atualizada com sucesso."
          : "Rede social cadastrada com sucesso.",
      );
      await carregarRedesSociais(configuracaoId);
    } catch (error: any) {
      setErroRedeSocial(
        erroApi(error, "Não foi possível salvar a rede social."),
      );
    } finally {
      setSalvandoRedeSocial(false);
    }
  }

  async function alterarAtivoRedeSocial(rede: RedeSocialRodape) {
    const novoAtivo = !estaAtivo(rede.ativo);

    try {
      setAlterandoAtivoRedeSocial(rede.id_rodape_rede_social);
      setErroRedeSocial("");
      const resposta = await conexao.put(
        ROTAS.RODAPES.PAINEL.REDES_SOCIAIS.ALTERAR_ATIVO(
          rede.id_rodape_rede_social,
        ),
        { ativo: novoAtivo },
        { withCredentials: true },
      );
      validarResposta(resposta);
      if (configuracaoRodape) {
        await carregarRedesSociais(configuracaoRodape.id_rodape_configuracao);
      }
    } catch (error: any) {
      setErroRedeSocial(
        erroApi(error, "Não foi possível alterar o status da rede social."),
      );
    } finally {
      setAlterandoAtivoRedeSocial(null);
    }
  }

  async function excluirRedeSocial(rede: RedeSocialRodape) {
    const confirmar = window.confirm(
      `Deseja remover a rede social "${rede.nome}"?`,
    );
    if (!confirmar) return;

    try {
      setExcluindoRedeSocial(rede.id_rodape_rede_social);
      setErroRedeSocial("");
      const resposta = await conexao.delete(
        ROTAS.RODAPES.PAINEL.REDES_SOCIAIS.EXCLUIR(rede.id_rodape_rede_social),
        { withCredentials: true },
      );
      validarResposta(resposta);
      setSucesso("Rede social removida com sucesso.");
      if (configuracaoRodape) {
        await carregarRedesSociais(configuracaoRodape.id_rodape_configuracao);
      }
    } catch (error: any) {
      setErroRedeSocial(
        erroApi(error, "Não foi possível excluir a rede social."),
      );
    } finally {
      setExcluindoRedeSocial(null);
    }
  }

  function fecharConfiguracaoRodape() {
    if (salvandoConfiguracao || salvandoRedeSocial) return;
    setModalConfiguracaoAberto(false);
    setFormRedeSocialAberto(false);
    setRedeSocialEditando(null);
    setErroConfiguracao("");
    setErroRedeSocial("");
  }

  const totalItensCarregados = itens.length;

  return (
    <main className="footer-admin">
      <header className="pagina-topo">
        <div>
          <div className="breadcrumb">
            <a href="/painel">Painel</a>
            <ChevronRight size={13} />
            <span>Conteúdo</span>
            <ChevronRight size={13} />
            <span>Footer</span>
          </div>

          <div className="titulo-principal">
            <div className="titulo-icone">
              <FileText size={23} />
            </div>
            <div>
              <span className="sobrelinha">ESTRUTURA DA LOJA</span>
              <h1>Gerenciamento do Footer</h1>
              <p>
                Organize as colunas, informações e links exibidos no rodapé da
                loja.
              </p>
            </div>
          </div>
        </div>

        <div className="acoes-topo">
          <button
            type="button"
            className="botao-json"
            onClick={abrirImportacaoJson}
          >
            <FileJson size={16} /> Importar JSON
          </button>
          <button
            type="button"
            className="botao-configuracao"
            onClick={() => void abrirConfiguracaoRodape(null)}
          >
            <Plus size={16} /> Nova configuração
          </button>
          <button
            type="button"
            className="botao-primario"
            onClick={abrirNovoRodape}
          >
            <Plus size={17} /> Novo rodapé
          </button>
        </div>
      </header>

      {erro && (
        <div className="mensagem mensagem-erro" role="alert">
          <AlertCircle size={17} />
          <span>{erro}</span>
          <button type="button" onClick={() => setErro("")} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
      )}

      {sucesso && (
        <div className="mensagem mensagem-sucesso" role="status">
          <Check size={17} />
          <span>{sucesso}</span>
          <button
            type="button"
            onClick={() => setSucesso("")}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="indicadores">
        <article className="indicador">
          <span className="indicador-icone">
            <Layers size={19} />
          </span>
          <div>
            <small>COLUNAS DO FOOTER</small>
            <strong>{rodapes.length}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone verde">
            <Check size={19} />
          </span>
          <div>
            <small>COLUNAS ATIVAS</small>
            <strong>{totalAtivos}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone azul">
            <Link2 size={19} />
          </span>
          <div>
            <small>COLUNAS INATIVAS</small>
            <strong>{totalInativos}</strong>
          </div>
        </article>
        <article className="indicador">
          <span className="indicador-icone amarelo">
            <Settings2 size={19} />
          </span>
          <div>
            <small>LINKS CARREGADOS</small>
            <strong>{totalItensCarregados}</strong>
          </div>
        </article>
      </section>

      <section className="painel-listagem">
        <div className="listagem-topo">
          <div>
            <span className="sobrelinha">GERENCIADOR DE CONTEÚDO</span>
            <h2>Rodapés cadastrados</h2>
            <p>
              Crie grupos de links e organize o que será apresentado no final
              das páginas.
            </p>
          </div>

          <button
            type="button"
            className="botao-atualizar"
            onClick={() => {
              void carregarRodapes(true);
              void carregarConfiguracoesRodape(true);
            }}
            disabled={atualizando || carregando || carregandoConfiguracoes}
          >
            <RefreshCw size={15} className={atualizando ? "girando" : ""} />
            Atualizar
          </button>
        </div>

        <div className="configuracoes-listagem">
          <div className="configuracoes-listagem-topo">
            <div>
              <span className="sobrelinha">IDENTIDADE VISUAL DA LOJA</span>
              <h3>Configurações e redes sociais</h3>
              <p>
                Consulte as informações cadastradas e abra os detalhes de cada
                configuração.
              </p>
            </div>
            <span className="configuracoes-total">
              {configuracoesRodape.length}{" "}
              {configuracoesRodape.length === 1
                ? "configuração"
                : "configurações"}
            </span>
          </div>

          {erroConfiguracoes && (
            <div className="mensagem mensagem-erro compacta" role="alert">
              <AlertCircle size={15} />
              <span>{erroConfiguracoes}</span>
              <button
                type="button"
                onClick={() => setErroConfiguracoes("")}
                aria-label="Fechar"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {carregandoConfiguracoes ? (
            <div className="estado-vazio compacto">
              <LoaderCircle className="girando" size={23} />
              <strong>Carregando configurações...</strong>
            </div>
          ) : configuracoesRodape.length === 0 ? (
            <div className="configuracao-vazia">
              <Settings2 size={23} />
              <div>
                <strong>Nenhuma configuração visual cadastrada</strong>
                <span>
                  Cadastre o título, a descrição, a logo e as redes sociais da
                  loja.
                </span>
              </div>
              <button
                type="button"
                className="botao-primario"
                onClick={() => void abrirConfiguracaoRodape(null)}
              >
                <Plus size={15} /> Cadastrar configuração
              </button>
            </div>
          ) : (
            <div className="tabela-scroll">
              <table className="tabela-configuracoes">
                <thead>
                  <tr>
                    <th>Título / identidade</th>
                    <th>Descrição</th>
                    <th>Logo</th>
                    <th>Redes sociais</th>
                    <th>Status</th>
                    <th className="acoes-coluna">Informações</th>
                  </tr>
                </thead>
                <tbody>
                  {configuracoesRodape.map((configuracao) => {
                    const ativo = estaAtivo(configuracao.ativo);
                    const redes =
                      redesSociaisPorConfiguracao[
                        configuracao.id_rodape_configuracao
                      ] ?? [];
                    const redesAtivas = redes.filter((rede) =>
                      estaAtivo(rede.ativo),
                    ).length;
                    return (
                      <tr key={configuracao.id_rodape_configuracao}>
                        <td>
                          <div className="configuracao-identidade">
                            <strong>{configuracao.nome}</strong>
                            <small>
                              Configuração #
                              {configuracao.id_rodape_configuracao}
                            </small>
                          </div>
                        </td>
                        <td>
                          <span className="configuracao-descricao-tabela">
                            {configuracao.descricao ||
                              "Sem descrição cadastrada"}
                          </span>
                        </td>
                        <td>
                          {configuracao.imagem_url ? (
                            <span className="configuracao-logo-status">
                              <Check size={13} /> Cadastrada
                            </span>
                          ) : (
                            <span className="configuracao-logo-status sem-logo">
                              Sem logo
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="configuracao-redes-contagem">
                            <Link2 size={13} /> {redesAtivas} ativa(s) /{" "}
                            {redes.length} total
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status ${ativo ? "ativo" : "inativo"}`}
                          >
                            <i />
                            {ativo ? "Ativa" : "Inativa"}
                          </span>
                        </td>
                        <td>
                          <div className="acoes">
                            <button
                              type="button"
                              className="acao-mais-informacoes"
                              onClick={() =>
                                void abrirConfiguracaoRodape(configuracao)
                              }
                              title={`Mais informações sobre ${configuracao.nome}`}
                            >
                              <Eye size={14} /> <span>Mais informações</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="separador-listagens">
          <span>COLUNAS E LINKS DO FOOTER</span>
        </div>

        <div className="filtros">
          <div className="busca">
            <Search size={17} />
            <input
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Buscar por nome ou código..."
              aria-label="Buscar rodapés"
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar busca"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="filtro-status">
            <button
              type="button"
              className={filtroStatus === "todos" ? "selecionado" : ""}
              onClick={() => setFiltroStatus("todos")}
            >
              Todos
            </button>
            <button
              type="button"
              className={filtroStatus === "ativos" ? "selecionado" : ""}
              onClick={() => setFiltroStatus("ativos")}
            >
              Ativos
            </button>
            <button
              type="button"
              className={filtroStatus === "inativos" ? "selecionado" : ""}
              onClick={() => setFiltroStatus("inativos")}
            >
              Inativos
            </button>
          </div>
        </div>

        {carregando ? (
          <div className="estado-vazio">
            <LoaderCircle className="girando" size={27} />
            <strong>Carregando estrutura do Footer...</strong>
            <span>Consultando os rodapés cadastrados na API.</span>
          </div>
        ) : rodapesFiltrados.length === 0 ? (
          <div className="estado-vazio">
            <FolderOpen size={34} />
            <strong>
              {busca || filtroStatus !== "todos"
                ? "Nenhum rodapé encontrado"
                : "Nenhum rodapé cadastrado"}
            </strong>
            <span>
              {rodapes.length === 0
                ? "Crie a primeira coluna para começar a montar o rodapé da sua loja."
                : "Altere os filtros ou tente outra pesquisa."}
            </span>
            {rodapes.length === 0 && (
              <button
                type="button"
                className="botao-primario"
                onClick={abrirNovoRodape}
              >
                <Plus size={16} /> Criar primeiro rodapé
              </button>
            )}
          </div>
        ) : (
          <div className="tabela-scroll">
            <table className="tabela-rodapes">
              <thead>
                <tr>
                  <th>Coluna / Grupo</th>
                  <th>Código</th>
                  <th>Criado em</th>
                  <th>Status</th>
                  <th className="acoes-coluna">Gerenciar</th>
                </tr>
              </thead>
              <tbody>
                {rodapesFiltrados.map((rodape) => {
                  const ativo = estaAtivo(rodape.ativo);

                  return (
                    <tr key={rodape.id_rodape}>
                      <td>
                        <div className="rodape-identidade">
                          <span className="rodape-thumb">
                            <FileText size={19} />
                          </span>
                          <div>
                            <strong>{rodape.nome}</strong>
                            <small>Rodapé #{rodape.id_rodape}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="codigo">
                          <Hash size={12} />
                          {rodape.codigo}
                        </span>
                      </td>
                      <td>
                        <span className="data">
                          {formatarData(rodape.criado_em)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status ${ativo ? "ativo" : "inativo"}`}
                        >
                          <i />
                          {ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td>
                        <div className="acoes">
                          <button
                            type="button"
                            className="acao-itens"
                            onClick={() => void abrirGerenciamentoItens(rodape)}
                            title="Gerenciar links"
                            aria-label={`Gerenciar links de ${rodape.nome}`}
                          >
                            <Link2 size={15} />
                            <span>Links</span>
                          </button>
                          <button
                            type="button"
                            className="acao-editar"
                            onClick={() => abrirEdicaoRodape(rodape)}
                            title="Editar rodapé"
                            aria-label={`Editar ${rodape.nome}`}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className={ativo ? "acao-ocultar" : "acao-ativar"}
                            onClick={() => void alterarAtivoRodape(rodape)}
                            disabled={alterandoAtivoRodape === rodape.id_rodape}
                            title={ativo ? "Desativar rodapé" : "Ativar rodapé"}
                            aria-label={
                              ativo
                                ? `Desativar ${rodape.nome}`
                                : `Ativar ${rodape.nome}`
                            }
                          >
                            {alterandoAtivoRodape === rodape.id_rodape ? (
                              <LoaderCircle size={15} className="girando" />
                            ) : ativo ? (
                              <EyeOff size={15} />
                            ) : (
                              <Eye size={15} />
                            )}
                          </button>
                          <button
                            type="button"
                            className="acao-excluir"
                            onClick={() => void excluirRodape(rodape)}
                            disabled={excluindoRodape === rodape.id_rodape}
                            title="Excluir rodapé"
                            aria-label={`Excluir ${rodape.nome}`}
                          >
                            {excluindoRodape === rodape.id_rodape ? (
                              <LoaderCircle size={15} className="girando" />
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="rodape-tabela">
          Exibindo <strong>{rodapesFiltrados.length}</strong> de{" "}
          <strong>{rodapes.length}</strong> colunas do Footer
        </div>
      </section>

      {/* =====================================================
          MODAL - IMPORTAÇÃO EM LOTE POR JSON
      ===================================================== */}
      {modalImportacaoAberto && (
        <div
          className="modal-fundo"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !importandoJson) {
              setModalImportacaoAberto(false);
              setErroItensImportacao("");
            }
          }}
        >
          <section
            className="modal-cartao modal-importacao-json"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-json"
          >
            <div className="modal-topo">
              <div className="modal-icone">
                <FileJson size={20} />
              </div>
              <div>
                <h2 id="titulo-modal-json">Cadastrar rodapés por JSON</h2>
                <p>
                  Importe várias colunas e seus links em uma única operação.
                </p>
              </div>
              <button
                type="button"
                className="fechar-modal"
                onClick={() => {
                  if (!importandoJson) {
                    setModalImportacaoAberto(false);
                    setErroItensImportacao("");
                  }
                }}
                aria-label="Fechar"
                disabled={importandoJson}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={salvarImportacaoJson}>
              {erroItensImportacao && (
                <div className="mensagem mensagem-erro" role="alert">
                  <AlertCircle size={16} />
                  <span>{erroItensImportacao}</span>
                </div>
              )}

              <div className="json-ajuda">
                <strong>Formato esperado</strong>
                <span>
                  O objeto principal deve conter <code>rodapes</code>. Cada
                  rodapé precisa de <code>nome</code> e <code>codigo</code>; os
                  links ficam dentro de <code>itens</code>.
                </span>
              </div>

              <label
                className="botao-arquivo-json"
                htmlFor="arquivo-importacao-json"
              >
                <Upload size={15} /> Selecionar arquivo .json
              </label>
              <input
                id="arquivo-importacao-json"
                className="input-arquivo-json"
                type="file"
                accept=".json,application/json"
                onChange={importarArquivoJson}
                disabled={importandoJson}
              />

              <div className="campo campo-json">
                <label htmlFor="texto-importacao-json">Conteúdo JSON</label>
                <textarea
                  id="texto-importacao-json"
                  value={jsonImportacao}
                  onChange={(evento) => setJsonImportacao(evento.target.value)}
                  placeholder={
                    '{\n  "rodapes": [\n    {\n      "status_id": 1,\n      "nome": "Institucional",\n      "codigo": "INSTITUCIONAL",\n      "ativo": true,\n      "itens": [\n        { "titulo": "Sobre nós", "url": "/sobre", "icone": "info", "ordem": 1, "ativo": true }\n      ]\n    }\n  ]\n}'
                  }
                  spellCheck={false}
                  required
                  disabled={importandoJson}
                />
              </div>

              <div className="aviso-importacao">
                <AlertCircle size={15} />
                <span>
                  A importação cria os registros em sequência pela API. Ela não
                  altera colunas existentes. Se ocorrer um erro no meio, os
                  dados já enviados permanecem cadastrados; confira a listagem
                  antes de repetir a importação.
                </span>
              </div>

              <div className="modal-acoes">
                <button
                  type="button"
                  className="botao-cancelar"
                  onClick={() => {
                    setModalImportacaoAberto(false);
                    setErroItensImportacao("");
                  }}
                  disabled={importandoJson}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="botao-primario"
                  disabled={importandoJson || !jsonImportacao.trim()}
                >
                  {importandoJson ? (
                    <LoaderCircle size={16} className="girando" />
                  ) : (
                    <FileJson size={16} />
                  )}
                  {importandoJson ? "Importando..." : "Cadastrar JSON"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* =====================================================
          MODAL - CADASTRO / EDIÇÃO DO RODAPÉ
      ===================================================== */}

      {modalRodapeAberto && (
        <div
          className="modal-fundo"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !salvandoRodape)
              setModalRodapeAberto(false);
          }}
        >
          <section
            className="modal-cartao"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-rodape"
          >
            <div className="modal-topo">
              <div className="modal-icone">
                <FileText size={20} />
              </div>
              <div>
                <h2 id="titulo-modal-rodape">
                  {rodapeEditando
                    ? "Editar coluna do Footer"
                    : "Nova coluna do Footer"}
                </h2>
                <p>Defina a identificação e a disponibilidade deste grupo.</p>
              </div>
              <button
                type="button"
                className="fechar-modal"
                onClick={() => setModalRodapeAberto(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={salvarRodape}>
              {erro && (
                <div className="mensagem mensagem-erro" role="alert">
                  <AlertCircle size={16} />
                  <span>{erro}</span>
                </div>
              )}
              <div className="campo">
                <label htmlFor="rodape-nome">Nome da coluna</label>
                <input
                  id="rodape-nome"
                  value={formRodape.nome}
                  onChange={(evento) =>
                    setFormRodape((anterior) => ({
                      ...anterior,
                      nome: evento.target.value,
                    }))
                  }
                  placeholder="Ex.: Atendimento"
                  maxLength={120}
                  required
                />
              </div>

              <div className="campo">
                <label htmlFor="rodape-codigo">Código identificador</label>
                <input
                  id="rodape-codigo"
                  value={formRodape.codigo}
                  onChange={(evento) =>
                    setFormRodape((anterior) => ({
                      ...anterior,
                      codigo: evento.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9_-]/g, "_"),
                    }))
                  }
                  placeholder="Ex.: ATENDIMENTO"
                  maxLength={80}
                  required
                />
                <small>
                  Use um código único, sem espaços ou acentos. Ex.:
                  INSTITUCIONAL.
                </small>
              </div>

              <div className="campos-duplos">
                <div className="campo">
                  <label htmlFor="rodape-status-id">ID do status</label>
                  <input
                    id="rodape-status-id"
                    type="number"
                    min={1}
                    value={formRodape.status_id}
                    onChange={(evento) =>
                      setFormRodape((anterior) => ({
                        ...anterior,
                        status_id: Number(evento.target.value),
                      }))
                    }
                    required
                  />
                </div>
                <label className="campo-checkbox">
                  <input
                    type="checkbox"
                    checked={formRodape.ativo}
                    onChange={(evento) =>
                      setFormRodape((anterior) => ({
                        ...anterior,
                        ativo: evento.target.checked,
                      }))
                    }
                  />
                  <span>
                    <strong>Rodapé ativo</strong>
                    <small>Disponibilizar este grupo na loja.</small>
                  </span>
                </label>
              </div>

              <div className="modal-acoes">
                <button
                  type="button"
                  className="botao-cancelar"
                  onClick={() => setModalRodapeAberto(false)}
                  disabled={salvandoRodape}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="botao-primario"
                  disabled={salvandoRodape}
                >
                  {salvandoRodape ? (
                    <LoaderCircle size={16} className="girando" />
                  ) : (
                    <Check size={16} />
                  )}
                  {salvandoRodape
                    ? "Salvando..."
                    : rodapeEditando
                      ? "Salvar alterações"
                      : "Criar rodapé"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* =====================================================
          MODAL - LINKS DO RODAPÉ
      ===================================================== */}

      {modalItensAberto && rodapeSelecionado && (
        <div
          className="modal-fundo modal-fundo-itens"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !modalItemAberto)
              fecharModalItens();
          }}
        >
          <section
            className="modal-cartao modal-itens"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-itens"
          >
            <div className="modal-topo">
              <div className="modal-icone">
                <Link2 size={20} />
              </div>
              <div>
                <h2 id="titulo-modal-itens">
                  Links de {rodapeSelecionado.nome}
                </h2>
                <p>
                  Cadastre e organize os links exibidos nesta coluna do Footer.
                </p>
              </div>
              <button
                type="button"
                className="fechar-modal"
                onClick={fecharModalItens}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="itens-toolbar">
              <div>
                <strong>
                  {itens.length}{" "}
                  {itens.length === 1 ? "link cadastrado" : "links cadastrados"}
                </strong>
                <small>Os links são exibidos pela ordem definida abaixo.</small>
              </div>
              <button
                type="button"
                className="botao-primario"
                onClick={abrirNovoItem}
              >
                <Plus size={16} /> Adicionar link
              </button>
            </div>

            {erroItens && (
              <div className="mensagem mensagem-erro compacta" role="alert">
                <AlertCircle size={16} />
                <span>{erroItens}</span>
                <button
                  type="button"
                  onClick={() => setErroItens("")}
                  aria-label="Fechar"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {carregandoItens ? (
              <div className="estado-vazio compacto">
                <LoaderCircle className="girando" size={25} />
                <strong>Carregando links...</strong>
              </div>
            ) : itens.length === 0 ? (
              <div className="estado-vazio compacto">
                <Link2 size={30} />
                <strong>Nenhum link nesta coluna</strong>
                <span>
                  Adicione o primeiro link para preencher este grupo do Footer.
                </span>
                <button
                  type="button"
                  className="botao-primario"
                  onClick={abrirNovoItem}
                >
                  <Plus size={16} /> Adicionar primeiro link
                </button>
              </div>
            ) : (
              <div className="lista-itens">
                {itens.map((item) => {
                  const ativo = estaAtivo(item.ativo);

                  return (
                    <article
                      className={`item-card ${ativo ? "" : "item-inativo"}`}
                      key={item.id_rodape_item}
                    >
                      <div className="item-arraste" aria-hidden="true">
                        <GripVertical size={18} />
                      </div>
                      <div className="item-ordem">
                        <span>{item.ordem}</span>
                        <div>
                          <button
                            type="button"
                            onClick={() => void alterarOrdemItem(item, -1)}
                            disabled={
                              item.ordem <= 0 ||
                              atualizandoItem === item.id_rodape_item
                            }
                            title="Diminuir ordem"
                            aria-label={`Diminuir ordem de ${item.titulo}`}
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void alterarOrdemItem(item, 1)}
                            disabled={atualizandoItem === item.id_rodape_item}
                            title="Aumentar ordem"
                            aria-label={`Aumentar ordem de ${item.titulo}`}
                          >
                            <ArrowDown size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="item-principal">
                        <strong>{item.titulo}</strong>
                        <span>{item.url || "Sem URL configurada"}</span>
                        {item.icone && <small>Ícone: {item.icone}</small>}
                      </div>
                      <span className={`status ${ativo ? "ativo" : "inativo"}`}>
                        <i />
                        {ativo ? "Ativo" : "Inativo"}
                      </span>
                      <div className="acoes">
                        <button
                          type="button"
                          className="acao-editar"
                          onClick={() => abrirEdicaoItem(item)}
                          title="Editar link"
                          aria-label={`Editar ${item.titulo}`}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          className={ativo ? "acao-ocultar" : "acao-ativar"}
                          onClick={() => void alterarAtivoItem(item)}
                          disabled={atualizandoItem === item.id_rodape_item}
                          title={ativo ? "Desativar link" : "Ativar link"}
                          aria-label={
                            ativo
                              ? `Desativar ${item.titulo}`
                              : `Ativar ${item.titulo}`
                          }
                        >
                          {atualizandoItem === item.id_rodape_item ? (
                            <LoaderCircle size={14} className="girando" />
                          ) : ativo ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="acao-excluir"
                          onClick={() => void excluirItem(item)}
                          disabled={excluindoItem === item.id_rodape_item}
                          title="Excluir link"
                          aria-label={`Excluir ${item.titulo}`}
                        >
                          {excluindoItem === item.id_rodape_item ? (
                            <LoaderCircle size={14} className="girando" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <div className="modal-acoes rodape-modal-itens">
              <button
                type="button"
                className="botao-cancelar"
                onClick={fecharModalItens}
              >
                Fechar
              </button>
            </div>
          </section>
        </div>
      )}

      {/* =====================================================
          MODAL - CADASTRO / EDIÇÃO DO LINK
      ===================================================== */}

      {modalItemAberto && rodapeSelecionado && (
        <div
          className="modal-fundo modal-item-fundo"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget && !salvandoItem)
              setModalItemAberto(false);
          }}
        >
          <section
            className="modal-cartao modal-item-form"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-item"
          >
            <div className="modal-topo">
              <div className="modal-icone">
                <Link2 size={20} />
              </div>
              <div>
                <h2 id="titulo-modal-item">
                  {itemEditando ? "Editar link" : "Novo link"}
                </h2>
                <p>Coluna: {rodapeSelecionado.nome}</p>
              </div>
              <button
                type="button"
                className="fechar-modal"
                onClick={() => setModalItemAberto(false)}
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={salvarItem}>
              {erroItens && (
                <div className="mensagem mensagem-erro" role="alert">
                  <AlertCircle size={16} />
                  <span>{erroItens}</span>
                  <button
                    type="button"
                    onClick={() => setErroItens("")}
                    aria-label="Fechar"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
              <div className="campo">
                <label htmlFor="item-titulo">Título do link</label>
                <input
                  id="item-titulo"
                  value={formItem.titulo}
                  onChange={(evento) =>
                    setFormItem((anterior) => ({
                      ...anterior,
                      titulo: evento.target.value,
                    }))
                  }
                  placeholder="Ex.: Política de privacidade"
                  maxLength={160}
                  required
                />
              </div>

              <div className="campo">
                <label htmlFor="item-url">URL ou caminho interno</label>
                <input
                  id="item-url"
                  value={formItem.url}
                  onChange={(evento) =>
                    setFormItem((anterior) => ({
                      ...anterior,
                      url: evento.target.value,
                    }))
                  }
                  placeholder="Ex.: /politica-de-privacidade"
                  maxLength={2048}
                />
                <small>
                  Use um caminho como /contato ou uma URL completa https://...
                </small>
              </div>

              <div className="campos-duplos">
                <div className="campo">
                  <label htmlFor="item-icone">Ícone (opcional)</label>
                  <input
                    id="item-icone"
                    value={formItem.icone}
                    onChange={(evento) =>
                      setFormItem((anterior) => ({
                        ...anterior,
                        icone: evento.target.value,
                      }))
                    }
                    placeholder="Ex.: phone, mail, instagram"
                    maxLength={80}
                  />
                </div>
                <div className="campo">
                  <label htmlFor="item-ordem">Ordem de exibição</label>
                  <input
                    id="item-ordem"
                    type="number"
                    min={0}
                    value={formItem.ordem}
                    onChange={(evento) =>
                      setFormItem((anterior) => ({
                        ...anterior,
                        ordem: Number(evento.target.value),
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="campos-duplos">
                <div className="campo">
                  <label htmlFor="item-status-id">ID do status</label>
                  <input
                    id="item-status-id"
                    type="number"
                    min={1}
                    value={formItem.status_id}
                    onChange={(evento) =>
                      setFormItem((anterior) => ({
                        ...anterior,
                        status_id: Number(evento.target.value),
                      }))
                    }
                    required
                  />
                </div>
                <label className="campo-checkbox">
                  <input
                    type="checkbox"
                    checked={formItem.ativo}
                    onChange={(evento) =>
                      setFormItem((anterior) => ({
                        ...anterior,
                        ativo: evento.target.checked,
                      }))
                    }
                  />
                  <span>
                    <strong>Link ativo</strong>
                    <small>Exibir este link na loja.</small>
                  </span>
                </label>
              </div>

              <div className="modal-acoes">
                <button
                  type="button"
                  className="botao-cancelar"
                  onClick={() => setModalItemAberto(false)}
                  disabled={salvandoItem}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="botao-primario"
                  disabled={salvandoItem}
                >
                  {salvandoItem ? (
                    <LoaderCircle size={16} className="girando" />
                  ) : (
                    <Check size={16} />
                  )}
                  {salvandoItem
                    ? "Salvando..."
                    : itemEditando
                      ? "Salvar link"
                      : "Adicionar link"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* =====================================================
          MODAL - CONFIGURAÇÃO VISUAL E REDES SOCIAIS
          Separado do cadastro das colunas e dos links.
      ===================================================== */}
      {modalConfiguracaoAberto && (
        <div
          className="modal-fundo modal-configuracao-fundo"
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              fecharConfiguracaoRodape();
            }
          }}
        >
          <section
            className="modal-cartao modal-configuracao"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-configuracao"
          >
            <div className="modal-topo">
              <div className="modal-icone">
                <Settings2 size={20} />
              </div>
              <div>
                <h2 id="titulo-modal-configuracao">
                  Informações e redes sociais
                </h2>
                <p>
                  Configure o título, a descrição, a logo e os perfis sociais do
                  rodapé da loja.
                </p>
              </div>
              <button
                type="button"
                className="fechar-modal"
                onClick={fecharConfiguracaoRodape}
                aria-label="Fechar"
                disabled={salvandoConfiguracao || salvandoRedeSocial}
              >
                <X size={18} />
              </button>
            </div>

            {carregandoConfiguracao ? (
              <div className="estado-vazio">
                <LoaderCircle className="girando" size={27} />
                <strong>Carregando configuração...</strong>
                <span>Consultando as informações atuais do rodapé.</span>
              </div>
            ) : (
              <div className="configuracao-conteudo">
                {erroConfiguracao && (
                  <div className="mensagem mensagem-erro" role="alert">
                    <AlertCircle size={16} />
                    <span>{erroConfiguracao}</span>
                    <button
                      type="button"
                      onClick={() => setErroConfiguracao("")}
                      aria-label="Fechar"
                    >
                      <X size={15} />
                    </button>
                  </div>
                )}

                <form onSubmit={salvarConfiguracaoRodape}>
                  <div className="configuracao-secao-titulo">
                    <div>
                      <span className="sobrelinha">IDENTIDADE DA LOJA</span>
                      <h3>Informações principais</h3>
                    </div>
                    <span className="configuracao-status">
                      {configuracaoRodape
                        ? "Configuração cadastrada"
                        : "Primeira configuração"}
                    </span>
                  </div>

                  <div className="campo">
                    <label htmlFor="configuracao-nome">
                      Título / nome exibido
                    </label>
                    <input
                      id="configuracao-nome"
                      value={formConfiguracao.nome}
                      onChange={(evento) =>
                        setFormConfiguracao((anterior) => ({
                          ...anterior,
                          nome: evento.target.value,
                        }))
                      }
                      placeholder="Ex.: Universo Império"
                      maxLength={150}
                      required
                    />
                  </div>

                  <div className="campo">
                    <label htmlFor="configuracao-descricao">
                      Descrição do rodapé
                    </label>
                    <textarea
                      id="configuracao-descricao"
                      value={formConfiguracao.descricao}
                      onChange={(evento) =>
                        setFormConfiguracao((anterior) => ({
                          ...anterior,
                          descricao: evento.target.value,
                        }))
                      }
                      placeholder="Escreva uma breve apresentação da loja..."
                      rows={3}
                      maxLength={2000}
                    />
                  </div>

                  <div className="campos-duplos">
                    <div className="campo">
                      <label htmlFor="configuracao-imagem">
                        URL ou caminho da logo
                      </label>
                      <input
                        id="configuracao-imagem"
                        value={formConfiguracao.imagem_url}
                        onChange={(evento) =>
                          setFormConfiguracao((anterior) => ({
                            ...anterior,
                            imagem_url: evento.target.value,
                          }))
                        }
                        placeholder="/uploads/logo-universo-imperio.png"
                        maxLength={500}
                      />
                    </div>
                    <div className="campo">
                      <label htmlFor="configuracao-imagem-alt">
                        Texto alternativo da logo
                      </label>
                      <input
                        id="configuracao-imagem-alt"
                        value={formConfiguracao.imagem_alt}
                        onChange={(evento) =>
                          setFormConfiguracao((anterior) => ({
                            ...anterior,
                            imagem_alt: evento.target.value,
                          }))
                        }
                        placeholder="Logo Universo Império"
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div className="campos-duplos">
                    <div className="campo">
                      <label htmlFor="configuracao-status-id">
                        ID do status
                      </label>
                      <input
                        id="configuracao-status-id"
                        type="number"
                        min={1}
                        value={formConfiguracao.status_id}
                        onChange={(evento) =>
                          setFormConfiguracao((anterior) => ({
                            ...anterior,
                            status_id: Number(evento.target.value),
                          }))
                        }
                        required
                      />
                    </div>
                    <label className="campo-checkbox">
                      <input
                        type="checkbox"
                        checked={formConfiguracao.ativo}
                        onChange={(evento) =>
                          setFormConfiguracao((anterior) => ({
                            ...anterior,
                            ativo: evento.target.checked,
                          }))
                        }
                      />
                      <span>
                        <strong>Configuração ativa</strong>
                        <small>Exibir estas informações na loja.</small>
                      </span>
                    </label>
                  </div>

                  {formConfiguracao.imagem_url.trim() && (
                    <div className="configuracao-preview-logo">
                      <span>Pré-visualização da logo</span>
                      <img
                        src={formConfiguracao.imagem_url}
                        alt={
                          formConfiguracao.imagem_alt || formConfiguracao.nome
                        }
                        onError={(evento) => {
                          evento.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="modal-acoes">
                    <button
                      type="button"
                      className="botao-cancelar"
                      onClick={fecharConfiguracaoRodape}
                      disabled={salvandoConfiguracao}
                    >
                      Fechar
                    </button>
                    <button
                      type="submit"
                      className="botao-primario"
                      disabled={salvandoConfiguracao}
                    >
                      {salvandoConfiguracao ? (
                        <LoaderCircle size={16} className="girando" />
                      ) : (
                        <Check size={16} />
                      )}
                      {salvandoConfiguracao
                        ? "Salvando..."
                        : configuracaoRodape
                          ? "Salvar informações"
                          : "Cadastrar configuração"}
                    </button>
                  </div>
                </form>

                <section className="redes-sociais-admin">
                  <div className="configuracao-secao-titulo redes-titulo">
                    <div>
                      <span className="sobrelinha">
                        CANAIS DE ATENDIMENTO E CONTEÚDO
                      </span>
                      <h3>Redes sociais</h3>
                      <p>
                        Cadastre os perfis que serão exibidos no rodapé público.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="botao-primario"
                      onClick={abrirNovaRedeSocial}
                      disabled={!configuracaoRodape?.id_rodape_configuracao}
                    >
                      <Plus size={15} /> Adicionar rede
                    </button>
                  </div>

                  {!configuracaoRodape?.id_rodape_configuracao ? (
                    <div className="redes-aviso">
                      <AlertCircle size={16} />
                      <span>
                        Cadastre e salve primeiro as informações principais para
                        liberar o cadastro das redes sociais.
                      </span>
                    </div>
                  ) : erroRedeSocial ? (
                    <div
                      className="mensagem mensagem-erro compacta"
                      role="alert"
                    >
                      <AlertCircle size={16} />
                      <span>{erroRedeSocial}</span>
                      <button
                        type="button"
                        onClick={() => setErroRedeSocial("")}
                        aria-label="Fechar"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ) : carregandoRedesSociais ? (
                    <div className="estado-vazio compacto">
                      <LoaderCircle className="girando" size={23} />
                      <strong>Carregando redes sociais...</strong>
                    </div>
                  ) : redesSociais.length === 0 ? (
                    <div className="estado-vazio compacto">
                      <Link2 size={27} />
                      <strong>Nenhuma rede social cadastrada</strong>
                      <span>
                        Use “Adicionar rede” para incluir Instagram, Facebook,
                        WhatsApp e outros perfis.
                      </span>
                    </div>
                  ) : (
                    <div className="redes-lista">
                      {redesSociais.map((rede) => {
                        const ativo = estaAtivo(rede.ativo);
                        return (
                          <article
                            className={`rede-card ${!ativo ? "rede-inativa" : ""}`}
                            key={rede.id_rodape_rede_social}
                          >
                            <div className="rede-icone">
                              <Link2 size={17} />
                            </div>
                            <div className="rede-dados">
                              <strong>{rede.nome}</strong>
                              <a
                                href={rede.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {rede.url}
                              </a>
                              <small>
                                {rede.icone} · ordem {rede.ordem}
                              </small>
                            </div>
                            <span
                              className={`status ${ativo ? "ativo" : "inativo"}`}
                            >
                              <i />
                              {ativo ? "Ativa" : "Inativa"}
                            </span>
                            <div className="acoes">
                              <button
                                type="button"
                                className="acao-editar"
                                onClick={() => abrirEdicaoRedeSocial(rede)}
                                title="Editar rede social"
                                aria-label={`Editar ${rede.nome}`}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                className={
                                  ativo ? "acao-ocultar" : "acao-ativar"
                                }
                                onClick={() =>
                                  void alterarAtivoRedeSocial(rede)
                                }
                                disabled={
                                  alterandoAtivoRedeSocial ===
                                  rede.id_rodape_rede_social
                                }
                                title={
                                  ativo
                                    ? "Desativar rede social"
                                    : "Ativar rede social"
                                }
                                aria-label={
                                  ativo
                                    ? `Desativar ${rede.nome}`
                                    : `Ativar ${rede.nome}`
                                }
                              >
                                {alterandoAtivoRedeSocial ===
                                rede.id_rodape_rede_social ? (
                                  <LoaderCircle size={14} className="girando" />
                                ) : ativo ? (
                                  <EyeOff size={14} />
                                ) : (
                                  <Eye size={14} />
                                )}
                              </button>
                              <button
                                type="button"
                                className="acao-excluir"
                                onClick={() => void excluirRedeSocial(rede)}
                                disabled={
                                  excluindoRedeSocial ===
                                  rede.id_rodape_rede_social
                                }
                                title="Excluir rede social"
                                aria-label={`Excluir ${rede.nome}`}
                              >
                                {excluindoRedeSocial ===
                                rede.id_rodape_rede_social ? (
                                  <LoaderCircle size={14} className="girando" />
                                ) : (
                                  <Trash2 size={14} />
                                )}
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}

                  {formRedeSocialAberto && (
                    <form
                      className="rede-formulario"
                      onSubmit={salvarRedeSocial}
                    >
                      <div className="configuracao-secao-titulo">
                        <div>
                          <span className="sobrelinha">REDE SOCIAL</span>
                          <h3>
                            {redeSocialEditando
                              ? "Editar perfil"
                              : "Novo perfil"}
                          </h3>
                        </div>
                        <button
                          type="button"
                          className="fechar-modal"
                          onClick={() => {
                            setFormRedeSocialAberto(false);
                            setRedeSocialEditando(null);
                            setErroRedeSocial("");
                          }}
                          aria-label="Fechar formulário da rede social"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      {erroRedeSocial && (
                        <div className="mensagem mensagem-erro" role="alert">
                          <AlertCircle size={15} />
                          <span>{erroRedeSocial}</span>
                        </div>
                      )}

                      <div className="campos-duplos">
                        <div className="campo">
                          <label htmlFor="rede-social-nome">Nome da rede</label>
                          <input
                            id="rede-social-nome"
                            value={formRedeSocial.nome}
                            onChange={(evento) =>
                              setFormRedeSocial((anterior) => ({
                                ...anterior,
                                nome: evento.target.value,
                              }))
                            }
                            placeholder="Ex.: Instagram"
                            maxLength={100}
                            required
                          />
                        </div>
                        <div className="campo">
                          <label htmlFor="rede-social-icone">Ícone</label>
                          <select
                            id="rede-social-icone"
                            value={formRedeSocial.icone}
                            onChange={(evento) =>
                              setFormRedeSocial((anterior) => ({
                                ...anterior,
                                icone: evento.target.value,
                              }))
                            }
                          >
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="youtube">YouTube</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="tiktok">TikTok</option>
                          </select>
                        </div>
                      </div>

                      <div className="campo">
                        <label htmlFor="rede-social-url">URL do perfil</label>
                        <input
                          id="rede-social-url"
                          type="url"
                          value={formRedeSocial.url}
                          onChange={(evento) =>
                            setFormRedeSocial((anterior) => ({
                              ...anterior,
                              url: evento.target.value,
                            }))
                          }
                          placeholder="https://www.instagram.com/seuperfil"
                          maxLength={500}
                          required
                        />
                      </div>

                      <div className="campos-duplos">
                        <div className="campo">
                          <label htmlFor="rede-social-ordem">
                            Ordem de exibição
                          </label>
                          <input
                            id="rede-social-ordem"
                            type="number"
                            min={0}
                            value={formRedeSocial.ordem}
                            onChange={(evento) =>
                              setFormRedeSocial((anterior) => ({
                                ...anterior,
                                ordem: Number(evento.target.value),
                              }))
                            }
                            required
                          />
                        </div>
                        <label className="campo-checkbox">
                          <input
                            type="checkbox"
                            checked={formRedeSocial.ativo}
                            onChange={(evento) =>
                              setFormRedeSocial((anterior) => ({
                                ...anterior,
                                ativo: evento.target.checked,
                              }))
                            }
                          />
                          <span>
                            <strong>Rede ativa</strong>
                            <small>Exibir este perfil na loja.</small>
                          </span>
                        </label>
                      </div>

                      <div className="modal-acoes">
                        <button
                          type="button"
                          className="botao-cancelar"
                          onClick={() => {
                            setFormRedeSocialAberto(false);
                            setRedeSocialEditando(null);
                            setErroRedeSocial("");
                          }}
                          disabled={salvandoRedeSocial}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="botao-primario"
                          disabled={salvandoRedeSocial}
                        >
                          {salvandoRedeSocial ? (
                            <LoaderCircle size={15} className="girando" />
                          ) : (
                            <Check size={15} />
                          )}
                          {salvandoRedeSocial
                            ? "Salvando..."
                            : redeSocialEditando
                              ? "Salvar rede"
                              : "Cadastrar rede"}
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              </div>
            )}
          </section>
        </div>
      )}

      <style jsx>{estilos}</style>
    </main>
  );
}

const estilos = `
.footer-admin{width:100%;max-width:1320px;margin:0 auto;padding:26px clamp(14px,2.5vw,30px) 40px;color:#f5edf1;font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif;box-sizing:border-box}
.footer-admin *{box-sizing:border-box}
.pagina-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:22px}
.breadcrumb{display:flex;align-items:center;gap:7px;margin-bottom:17px;color:#887782;font-size:10px}
.breadcrumb a{color:#bc91a6;text-decoration:none}.breadcrumb a:hover{color:#f2d7e2}
.titulo-principal{display:flex;align-items:center;gap:13px}
.titulo-icone{width:46px;height:46px;display:grid;place-items:center;border:1px solid #624453;border-radius:13px;background:linear-gradient(145deg,#49313e,#30232d);color:#e4aabe}
.titulo-principal h1{margin:3px 0 5px;color:#f7edf2;font-size:23px;font-weight:750;letter-spacing:-.5px}
.titulo-principal p{margin:0;color:#a994a0;font-size:11px}
.sobrelinha{display:block;color:#c18da4;font-size:8px;font-weight:800;letter-spacing:1.4px}
.botao-primario{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:38px;padding:0 15px;border:1px solid #b96e88;border-radius:9px;background:linear-gradient(135deg,#c47d96,#a95b78);color:#fff;font-size:11px;font-weight:750;box-shadow:0 7px 18px rgba(169,91,120,.16);cursor:pointer;transition:transform .15s,filter .15s}
.botao-primario:hover{filter:brightness(1.08);transform:translateY(-1px)}.botao-primario:disabled{opacity:.55;cursor:not-allowed;transform:none}
.acoes-topo{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.botao-configuracao{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:38px;padding:0 14px;border:1px solid #80566d;border-radius:9px;background:linear-gradient(135deg,#493442,#352632);color:#f0cbd9;font-size:11px;font-weight:750;cursor:pointer;transition:background .15s,border-color .15s,transform .15s}.botao-configuracao:hover{background:#563c4d;border-color:#c0849d;transform:translateY(-1px)}.botao-json{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:38px;padding:0 14px;border:1px solid #765065;border-radius:9px;background:#30232e;color:#e7c6d4;font-size:11px;font-weight:750;cursor:pointer;transition:background .15s,border-color .15s}.botao-json:hover{background:#493141;border-color:#ad718b}
.mensagem{display:flex;align-items:center;gap:10px;padding:11px 13px;margin:0 0 15px;border:1px solid;border-radius:9px;font-size:11px}
.mensagem>span{flex:1}.mensagem button{display:grid;place-items:center;border:0;background:transparent;color:inherit;cursor:pointer}
.mensagem-erro{border-color:#74434e;background:#321f29;color:#f0a9b6}.mensagem-sucesso{border-color:#38604d;background:#1c3029;color:#a8dfbd}
.indicadores{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:17px}
.indicador{display:flex;align-items:center;gap:12px;min-height:82px;padding:15px;border:1px solid #493541;border-radius:12px;background:linear-gradient(145deg,#2c2029,#241b23);box-shadow:0 8px 20px rgba(0,0,0,.12)}
.indicador-icone{display:grid;place-items:center;width:39px;height:39px;flex:0 0 39px;border:1px solid #70495c;border-radius:11px;background:#49313f;color:#e7aac0}
.indicador-icone.verde{border-color:#426b57;background:#253c31;color:#a7d7b6}.indicador-icone.azul{border-color:#415c71;background:#263846;color:#a8c8e5}.indicador-icone.amarelo{border-color:#756142;background:#453623;color:#e0c08b}
.indicador small{display:block;margin-bottom:5px;color:#9e8995;font-size:8px;font-weight:750;letter-spacing:.65px}
.indicador strong{color:#f2e7ed;font-size:23px;font-weight:750;line-height:1}
.painel-listagem{overflow:hidden;border:1px solid #493541;border-radius:13px;background:#241c24;box-shadow:0 12px 28px rgba(0,0,0,.12)}
.listagem-topo{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:19px 20px;border-bottom:1px solid #3c2d37}
.listagem-topo h2{margin:4px 0;color:#f0e5eb;font-size:15px;font-weight:750}
.listagem-topo p{margin:0;color:#9f8a96;font-size:10px}
.botao-atualizar{display:inline-flex;align-items:center;gap:7px;padding:8px 11px;border:1px solid #4a3945;border-radius:8px;background:#30242e;color:#c9b5c1;font-size:10px;font-weight:650;cursor:pointer}
.botao-atualizar:hover{background:#3c2b38}.botao-atualizar:disabled{opacity:.5;cursor:not-allowed}
.filtros{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #3c2d37;background:#291f28}
.busca{display:flex;align-items:center;gap:9px;width:min(450px,100%);height:36px;padding:0 11px;border:1px solid #4b3945;border-radius:8px;background:#201820;color:#9c8592}
.busca:focus-within{border-color:#a86b83;box-shadow:0 0 0 3px rgba(181,111,139,.1)}
.busca input{width:100%;border:0;outline:0;background:transparent;color:#eee2e9;font-size:10px}.busca input::placeholder{color:#806e79}
.busca button{display:grid;place-items:center;border:0;background:transparent;color:#b99aaa;cursor:pointer}
.filtro-status{display:flex;align-items:center;gap:4px;padding:3px;border:1px solid #483641;border-radius:8px;background:#211821}
.filtro-status button{padding:7px 11px;border:0;border-radius:6px;background:transparent;color:#9c8994;font-size:9px;font-weight:700;cursor:pointer}
.filtro-status button.selecionado{background:#684153;color:#f6dce7;box-shadow:0 2px 7px rgba(0,0,0,.16)}
.tabela-scroll{width:100%;overflow-x:auto}
.tabela-rodapes{width:100%;min-width:760px;border-collapse:collapse;text-align:left}
.tabela-rodapes th{padding:12px 16px;background:#2a2029;color:#8f7d89;font-size:8px;font-weight:800;letter-spacing:.7px;text-transform:uppercase}
.tabela-rodapes td{padding:13px 16px;border-top:1px solid #392b35;color:#c7b5c0;font-size:10px;vertical-align:middle}
.tabela-rodapes tbody tr:hover{background:#2b202a}
.configuracoes-listagem{margin:0 0 22px;padding:16px;border:1px solid #493541;border-radius:12px;background:#211923}
.configuracoes-listagem-topo{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 13px}
.configuracoes-listagem-topo h3{margin:4px 0 4px;color:#eadce4;font-size:13px;font-weight:750}
.configuracoes-listagem-topo p{margin:0;color:#a994a0;font-size:9px}
.configuracoes-total{flex:0 0 auto;padding:6px 9px;border:1px solid #65495a;border-radius:7px;background:#332631;color:#d9aabd;font-size:9px;font-weight:700}
.tabela-configuracoes{width:100%;min-width:980px;border-collapse:collapse;text-align:left}
.tabela-configuracoes th{padding:11px 13px;background:#2a2029;color:#8f7d89;font-size:8px;font-weight:800;letter-spacing:.65px;text-transform:uppercase}
.tabela-configuracoes td{padding:12px 13px;border-top:1px solid #392b35;color:#c7b5c0;font-size:9px;vertical-align:middle}
.tabela-configuracoes tbody tr:hover{background:#2b202a}
.configuracao-identidade{display:flex;min-width:150px;flex-direction:column;gap:4px}
.configuracao-identidade strong{color:#eadce4;font-size:10px}
.configuracao-identidade small{color:#8f7d88;font-size:8px}
.configuracao-descricao-tabela{display:block;max-width:260px;overflow:hidden;color:#bba9b4;text-overflow:ellipsis;white-space:nowrap}
.configuracao-logo-status,.configuracao-redes-contagem{display:inline-flex;align-items:center;gap:5px;color:#a9cfb5;font-size:9px;white-space:nowrap}
.configuracao-logo-status.sem-logo{color:#b8a4af}
.configuracao-redes-contagem{color:#d9b0c2}
.acao-mais-informacoes{min-width:120px!important;border-color:#684354!important;color:#e4b5c8!important;font-size:9px;font-weight:700}
.acao-mais-informacoes:hover{background:#422c39!important}
.configuracao-vazia{display:flex;align-items:center;gap:12px;padding:16px;border:1px dashed #624454;border-radius:9px;color:#d9aabd}
.configuracao-vazia>div{display:flex;flex:1;flex-direction:column;gap:4px}
.configuracao-vazia strong{color:#eadce4;font-size:10px}
.configuracao-vazia span{color:#a994a0;font-size:9px}
.separador-listagens{display:flex;align-items:center;gap:12px;margin:8px 0 14px;color:#9a8492;font-size:8px;font-weight:800;letter-spacing:1px}
.separador-listagens::after{height:1px;flex:1;background:#493541;content:""}
.rodape-identidade{display:flex;align-items:center;gap:10px;min-width:210px}
.rodape-thumb{display:grid;place-items:center;width:37px;height:37px;flex:0 0 37px;border:1px solid #634354;border-radius:10px;background:#3b2935;color:#e3aabe}
.rodape-identidade strong{display:block;margin-bottom:4px;color:#eadce4;font-size:11px;font-weight:700}
.rodape-identidade small{color:#8f7d88;font-size:9px}
.codigo{display:inline-flex;align-items:center;gap:4px;padding:5px 7px;border:1px solid #4b3946;border-radius:6px;background:#2c222b;color:#d3bdca;font-family:ui-monospace,SFMono-Regular,monospace;font-size:9px}
.data{color:#a994a0;font-size:9px}
.status{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-size:9px;font-weight:700}
.status i{width:6px;height:6px;border-radius:50%;background:#7e8b83;box-shadow:0 0 0 3px rgba(126,139,131,.1)}
.status.ativo{color:#9fd0b1}.status.ativo i{background:#68bd8a;box-shadow:0 0 0 3px rgba(104,189,138,.12)}
.status.inativo{color:#d79ba7}.status.inativo i{background:#c9788b;box-shadow:0 0 0 3px rgba(201,120,139,.12)}
.acoes{display:flex;align-items:center;justify-content:flex-end;gap:6px;white-space:nowrap}
.acoes button{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-width:29px;height:29px;padding:0 7px;border:1px solid #4b3945;border-radius:7px;background:#2b2029;color:#bfaebb;cursor:pointer;transition:background .15s,border-color .15s}
.acoes button:disabled{opacity:.45;cursor:not-allowed}
.acao-itens{color:#d9a5bc!important;border-color:#684354!important}.acao-itens span{font-size:9px;font-weight:700}.acao-itens:hover{background:#422c39}
.acao-editar{color:#e0c18e!important;border-color:#665044!important}.acao-editar:hover{background:#3b2b20}
.acao-ocultar{color:#c7acba!important}.acao-ocultar:hover{background:#3a2934}
.acao-ativar{color:#9fd0b1!important;border-color:#42654f!important}.acao-ativar:hover{background:#26382d}
.acao-excluir{color:#e69aaa!important;border-color:#69404a!important}.acao-excluir:hover{background:#3a2028}
.acoes-coluna{text-align:right}
.rodape-tabela{padding:12px 18px;border-top:1px solid #392832;color:#8f7d88;font-size:9px}.rodape-tabela strong{color:#d8c4ce}
.estado-vazio{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;min-height:220px;padding:30px;color:#8d7b87;text-align:center}
.estado-vazio strong{color:#d8c7d0;font-size:12px}.estado-vazio span{max-width:440px;color:#988490;font-size:10px;line-height:1.5}.estado-vazio .botao-primario{margin-top:7px}
.estado-vazio.compacto{min-height:160px}
.girando{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}

/* MODAIS */
.modal-fundo{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(10,7,11,.72);backdrop-filter:blur(5px)}
.modal-fundo-itens{z-index:1000}.modal-item-fundo{z-index:1010}
.modal-cartao{width:min(100%,560px);max-height:calc(100vh - 40px);overflow:auto;border:1px solid #624454;border-radius:15px;background:#261d26;color:#f2e7ed;box-shadow:0 25px 80px rgba(0,0,0,.45)}
.modal-itens{width:min(100%,860px)}
.modal-configuracao-fundo{z-index:1020}.modal-configuracao{width:min(100%,920px)}.configuracao-conteudo{max-height:calc(100vh - 125px);overflow:auto;padding:18px 20px 22px}.configuracao-conteudo>form{padding:0}.configuracao-secao-titulo{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 16px}.configuracao-secao-titulo h3{margin:4px 0 0;color:#f0e2e9;font-size:13px;font-weight:750}.configuracao-secao-titulo p{margin:5px 0 0;color:#a994a0;font-size:9px}.configuracao-status{padding:6px 9px;border:1px solid #65495a;border-radius:7px;background:#332631;color:#d9aabd;font-size:9px;font-weight:700}.configuracao-conteudo .campo textarea,.rede-formulario .campo select{width:100%;padding:10px 11px;border:1px solid #4d3a47;border-radius:8px;outline:0;background:#201821;color:#f1e5ec;font-family:inherit;font-size:11px;resize:vertical}.configuracao-conteudo .campo textarea:focus,.rede-formulario .campo select:focus{border-color:#b97891;box-shadow:0 0 0 3px rgba(185,120,145,.12)}.configuracao-preview-logo{display:flex;align-items:center;gap:14px;margin:0 0 14px;padding:10px 12px;border:1px solid #493541;border-radius:9px;background:#211923}.configuracao-preview-logo span{color:#a994a0;font-size:9px}.configuracao-preview-logo img{display:block;max-width:180px;max-height:65px;object-fit:contain}.redes-sociais-admin{margin-top:20px;padding-top:18px;border-top:1px solid #493541}.redes-titulo{align-items:flex-end}.redes-aviso{display:flex;align-items:flex-start;gap:9px;padding:12px;border:1px solid #66513a;border-radius:8px;background:#332a22;color:#dfc08e;font-size:10px;line-height:1.5}.redes-aviso svg{flex:0 0 auto}.redes-lista{display:flex;flex-direction:column;gap:8px}.rede-card{display:flex;align-items:center;gap:11px;padding:10px 11px;border:1px solid #473440;border-radius:9px;background:#2b2029}.rede-card.rede-inativa{opacity:.65}.rede-icone{display:grid;place-items:center;width:34px;height:34px;flex:0 0 34px;border:1px solid #70495c;border-radius:9px;background:#49313f;color:#e7aac0}.rede-dados{display:flex;flex:1;min-width:100px;flex-direction:column;gap:3px}.rede-dados strong{color:#eadde5;font-size:10px}.rede-dados a{overflow:hidden;color:#c997ad;font-size:9px;text-decoration:none;text-overflow:ellipsis;white-space:nowrap}.rede-dados a:hover{text-decoration:underline}.rede-dados small{color:#8f7d88;font-size:8px}.rede-card .acoes{margin-left:auto}.rede-formulario{margin-top:14px;padding:15px;border:1px solid #634657;border-radius:11px;background:#2b202a}.rede-formulario .configuracao-secao-titulo{margin-bottom:12px}.rede-formulario .campo{margin-bottom:12px}
.modal-item-form{width:min(100%,560px)}
.modal-importacao-json{width:min(100%,760px)}.modal-importacao-json form{padding:18px 20px 20px}.json-ajuda{display:flex;flex-direction:column;gap:5px;margin-bottom:13px;padding:11px 13px;border:1px solid #4b3946;border-radius:9px;background:#2b2029}.json-ajuda strong{color:#e8d8e1;font-size:10px}.json-ajuda span{color:#a994a0;font-size:9px;line-height:1.5}.json-ajuda code{color:#edbfd0;font-family:ui-monospace,SFMono-Regular,monospace}.botao-arquivo-json{display:inline-flex;align-items:center;gap:7px;width:max-content;min-height:33px;margin-bottom:10px;padding:0 11px;border:1px solid #614456;border-radius:7px;background:#382936;color:#e2b8c9;font-size:10px;font-weight:700;cursor:pointer}.botao-arquivo-json:hover{background:#493342}.input-arquivo-json{display:none}.campo-json{margin-bottom:10px}.campo-json textarea{display:block;width:100%;min-height:270px;resize:vertical;padding:12px;border:1px solid #4d3a47;border-radius:8px;outline:0;background:#17121a;color:#eadde5;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:10px;line-height:1.55;tab-size:2}.campo-json textarea:focus{border-color:#b97891;box-shadow:0 0 0 3px rgba(185,120,145,.12)}.campo-json textarea::placeholder{color:#7f6b79}.campo-json textarea:disabled{opacity:.6}.aviso-importacao{display:flex;align-items:flex-start;gap:8px;margin:8px 0 12px;padding:10px;border:1px solid #66513a;border-radius:8px;background:#332a22;color:#dfc08e;font-size:9px;line-height:1.5}.aviso-importacao svg{flex:0 0 auto;margin-top:1px}
.modal-topo{display:flex;align-items:center;gap:12px;padding:18px 20px;border-bottom:1px solid #493541}
.modal-icone{display:grid;place-items:center;width:38px;height:38px;flex:0 0 38px;border:1px solid #70495c;border-radius:10px;background:#49313f;color:#e7aac0}
.modal-topo>div:nth-child(2){flex:1;min-width:0}
.modal-topo h2{margin:0 0 4px;color:#f5eaf0;font-size:15px;font-weight:750}
.modal-topo p{margin:0;color:#a994a0;font-size:10px}
.fechar-modal{display:grid;place-items:center;width:32px;height:32px;border:1px solid #4a3945;border-radius:8px;background:#30242e;color:#c8b5c0;cursor:pointer}
.modal-cartao form{padding:18px 20px 20px}
.campo{display:flex;flex-direction:column;gap:7px;margin-bottom:15px}
.campo label{color:#cbb8c4;font-size:10px;font-weight:750}
.campo input{width:100%;height:38px;padding:0 11px;border:1px solid #4d3a47;border-radius:8px;outline:0;background:#201821;color:#f1e5ec;font-size:11px}
.campo input:focus{border-color:#b97891;box-shadow:0 0 0 3px rgba(185,120,145,.12)}
.campo input::placeholder{color:#776672}
.campo small{color:#907d89;font-size:9px;line-height:1.4}
.campos-duplos{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.campo-checkbox{display:flex;align-items:center;gap:10px;align-self:center;min-height:38px;margin-bottom:15px;padding:9px 11px;border:1px solid #493541;border-radius:8px;background:#2b202a;cursor:pointer}
.campo-checkbox input{width:15px;height:15px;accent-color:#b66e88}
.campo-checkbox span{display:flex;flex-direction:column;gap:3px}
.campo-checkbox strong{color:#e8d8e1;font-size:10px}
.campo-checkbox small{color:#9e8c97;font-size:9px}
.modal-acoes{display:flex;justify-content:flex-end;gap:9px;margin-top:8px;padding-top:15px;border-top:1px solid #493541}
.botao-cancelar{min-height:36px;padding:0 13px;border:1px solid #51404b;border-radius:8px;background:transparent;color:#cdbac5;font-size:10px;font-weight:700;cursor:pointer}
.botao-cancelar:hover{background:#30232c}.botao-cancelar:disabled{opacity:.5;cursor:not-allowed}
.itens-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 20px;border-bottom:1px solid #42323d}
.itens-toolbar>div{display:flex;flex-direction:column;gap:4px}.itens-toolbar strong{color:#e9dce4;font-size:11px}.itens-toolbar small{color:#998693;font-size:9px}
.mensagem.compacta{margin:12px 18px 0;padding:9px 10px;font-size:10px}
.lista-itens{display:flex;flex-direction:column;gap:8px;padding:14px 18px;max-height:48vh;overflow:auto}
.item-card{display:flex;align-items:center;gap:10px;min-height:68px;padding:10px;border:1px solid #473440;border-radius:10px;background:#2b2029}
.item-card.item-inativo{opacity:.68}
.item-arraste{color:#735e6c}
.item-ordem{display:flex;align-items:center;gap:7px;min-width:52px}
.item-ordem>span{display:grid;place-items:center;width:27px;height:27px;border:1px solid #5a4050;border-radius:7px;background:#3a2935;color:#e4b0c4;font-size:10px;font-weight:800}
.item-ordem>div{display:flex;flex-direction:column;gap:2px}
.item-ordem button{display:grid;place-items:center;width:18px;height:16px;padding:0;border:1px solid #4d3946;border-radius:4px;background:#332530;color:#bda7b5;cursor:pointer}
.item-ordem button:disabled{opacity:.3;cursor:not-allowed}
.item-principal{display:flex;flex:1;min-width:120px;flex-direction:column;gap:4px}
.item-principal strong{overflow:hidden;color:#eadde5;font-size:11px;text-overflow:ellipsis;white-space:nowrap}
.item-principal span{overflow:hidden;color:#ab96a3;font-size:9px;text-overflow:ellipsis;white-space:nowrap}
.item-principal small{color:#877480;font-size:8px}
.item-card .status{margin:0 8px}
.rodape-modal-itens{margin:0 18px 16px;padding-top:12px}
@media(max-width:900px){.indicadores{grid-template-columns:repeat(2,minmax(0,1fr))}.pagina-topo{align-items:flex-start;flex-direction:column}.acoes-topo{align-self:flex-end}.filtros{flex-wrap:wrap}.busca{max-width:none;flex:1}.itens-toolbar{align-items:flex-start;flex-direction:column}.itens-toolbar>.botao-primario{align-self:flex-end}}
@media(max-width:650px){.item-card{flex-wrap:wrap}.item-card .status{margin-left:auto}.item-card .acoes{width:100%;justify-content:flex-end}.item-principal{flex-basis:calc(100% - 120px)}}
@media(max-width:700px){.rede-card{flex-wrap:wrap}.rede-card .status{margin-left:auto}.rede-card .acoes{width:100%;justify-content:flex-end}.configuracao-conteudo{padding:14px}.configuracao-secao-titulo{align-items:flex-start;flex-direction:column}.configuracao-secao-titulo>.botao-primario{align-self:flex-end}}
@media(max-width:560px){.configuracoes-listagem{padding:10px}.configuracoes-listagem-topo{align-items:flex-start;flex-direction:column}.configuracao-vazia{align-items:flex-start;flex-wrap:wrap}.configuracao-vazia .botao-primario{margin-left:35px}.footer-admin{padding:18px 12px 28px}.titulo-principal h1{font-size:19px}.titulo-principal p{font-size:10px}.indicadores{gap:8px}.indicador{min-height:70px;padding:11px;gap:8px}.indicador-icone{width:33px;height:33px;flex-basis:33px}.indicador small{font-size:7px}.indicador strong{font-size:19px}.acoes-topo{width:100%;justify-content:flex-end}.listagem-topo{padding:15px;align-items:flex-start}.filtros{align-items:stretch;flex-direction:column;padding:12px}.busca{width:100%;max-width:none;min-height:36px}.filtro-status{width:100%}.filtro-status button{flex:1}.modal-fundo{padding:10px}.modal-cartao{max-height:calc(100vh - 20px)}.modal-topo{padding:15px}.modal-cartao form{padding:15px}.campos-duplos{grid-template-columns:1fr;gap:0}.itens-toolbar{padding:13px}.lista-itens{padding:10px}.item-card{gap:7px}.modal-acoes{flex-wrap:wrap}.modal-acoes button{flex:1}}
`;
