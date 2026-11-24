"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronDown,
  CircleAlert,
  Code2,
  LayoutGrid,
  LoaderCircle,
  RotateCcw,
  Save,
  Settings2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import "./home-blocos-cadastro.css";

type TipoBloco = string;
type RegraReferencia = "obrigatoria" | "opcional" | "nenhuma";
type Registro = Record<string, unknown>;
type Opcao = {
  id: number;
  nome: string;
  codigo: string;
  ativo: boolean;
  grupo?: string;
};
type TipoBlocoOpcao = {
  valor: TipoBloco;
  nome: string;
  descricao: string;
  referencia: RegraReferencia;
  ordem: number;
};
type Formulario = {
  tipo: TipoBloco;
  referencia_id: string;
  titulo_customizado: string;
  descricao_customizada: string;
  ordem: string;
  status_id: string;
  ativo: boolean;
  inicio_em: string;
  fim_em: string;
};
const FORM_INICIAL: Formulario = {
  tipo: "",
  referencia_id: "",
  titulo_customizado: "",
  descricao_customizada: "",
  ordem: "1",
  status_id: "",
  ativo: true,
  inicio_em: "",
  fim_em: "",
};

const JSON_CONFIG_MODELO = JSON.stringify(
  {
    variante: "carousel",
    colunas_desktop: 4,
    colunas_mobile: 2,
    mostrar_titulo: true,
    mostrar_descricao: true,
    limite_itens: 8,
  },
  null,
  2,
);

const ROTAS_CONTEUDO: Record<string, { rota: string; chaves: string[] }> = {
  // Endpoint administrativo da API: GET /painel/banners.
  // A rota exige a permissão banners.gerenciar no backend.
  BANNER: {
    rota: ROTAS.BANNERS.PAINEL.LISTAR,
    chaves: ["banners", "banner", "itens", "registros"],
  },
  CATEGORIAS: {
    rota: ROTAS.CATEGORIAS.PAINEL.LISTAR,
    chaves: ["categorias", "itens"],
  },
  VITRINE: {
    rota: ROTAS.VITRINES.PAINEL.LISTAR,
    chaves: ["vitrines", "itens"],
  },
  CAMPANHA: {
    rota: ROTAS.CAMPANHAS.PAINEL.LISTAR,
    chaves: ["campanhas", "itens"],
  },
  CUPONS: { rota: ROTAS.CUPONS.PAINEL.LISTAR, chaves: ["cupons", "itens"] },
  MARCAS: { rota: ROTAS.MARCAS.PAINEL.LISTAR, chaves: ["marcas", "itens"] },
};

function ehObj(valor: unknown): valor is Registro {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/**
 * Normaliza respostas JSON da API.
 * Alguns endpoints PHP estão acrescentando um "null" depois do objeto JSON.
 * Nesse caso o Axios pode entregar o corpo como string porque o JSON inteiro
 * deixa de ser válido. Recuperamos somente o primeiro objeto/lista completo,
 * sem alterar respostas que já chegaram corretamente como objeto.
 */
function interpretarRespostaApi(origem: unknown): unknown {
  if (typeof origem !== "string") return origem;

  const texto = origem.replace(/^\uFEFF/, "").trim();
  if (!texto) return null;

  try {
    return JSON.parse(texto) as unknown;
  } catch {
    const inicioObjeto = texto.indexOf("{");
    const inicioLista = texto.indexOf("[");
    const inicios = [inicioObjeto, inicioLista].filter((i) => i >= 0);
    if (inicios.length === 0) return null;

    const inicio = Math.min(...inicios);
    const fim = Math.max(texto.lastIndexOf("}"), texto.lastIndexOf("]"));
    if (fim <= inicio) return null;

    try {
      return JSON.parse(texto.slice(inicio, fim + 1)) as unknown;
    } catch {
      console.error(
        "[HOME BLOCOS] A API retornou um corpo que não pôde ser interpretado como JSON.",
        texto,
      );
      return null;
    }
  }
}

function extrair(origem: unknown, chaves: string[]): Registro[] {
  let atual = interpretarRespostaApi(origem);
  for (let i = 0; i < 7; i += 1) {
    if (Array.isArray(atual)) return atual.filter(ehObj);
    if (!ehObj(atual)) return [];
    for (const chave of chaves) {
      if (Array.isArray(atual[chave])) {
        return (atual[chave] as unknown[]).filter(ehObj);
      }
    }
    atual = interpretarRespostaApi(
      atual.dados ?? atual.data ?? atual.resultado ?? atual.result,
    );
  }
  return [];
}

function mensagemErro(erro: unknown): string {
  if (ehObj(erro) && ehObj(erro.response) && ehObj(erro.response.data)) {
    const mensagem = erro.response.data.mensagem;
    if (typeof mensagem === "string" && mensagem.trim()) return mensagem;
  }
  return erro instanceof Error && erro.message
    ? erro.message
    : "Não foi possível concluir a operação.";
}

/**
 * Logs de diagnóstico do cadastro da Tela Inicial.
 * Não registra headers, cookies, tokens ou credenciais da conexão.
 */
function logInicio(
  etapa: string,
  metodo: string,
  rota: string,
  detalhes?: unknown,
) {
  console.groupCollapsed(
    `%c[UNIVERSO IMPÉRIO | HOME BLOCOS] ${etapa}`,
    "color:#8b3f5b;font-weight:bold",
  );
  console.info("Método:", metodo);
  console.info("Rota solicitada:", rota);
  if (detalhes !== undefined) console.info("Dados enviados:", detalhes);
  console.groupEnd();
}

function logSucesso(
  etapa: string,
  rota: string,
  resposta: unknown,
  normalizados?: unknown,
) {
  const response = ehObj(resposta) ? resposta : {};
  console.groupCollapsed(
    `%c[UNIVERSO IMPÉRIO | HOME BLOCOS] ${etapa} — SUCESSO`,
    "color:#16834a;font-weight:bold",
  );
  console.info("Rota:", rota);
  console.info("HTTP:", response.status ?? "status não informado");
  console.log("Resposta bruta da API:", response.data ?? resposta);
  if (normalizados !== undefined) {
    console.log("Dados após normalização:", normalizados);
    if (Array.isArray(normalizados)) console.table(normalizados);
  }
  console.groupEnd();
}

function logFalha(etapa: string, metodo: string, rota: string, erro: unknown) {
  const detalhes = ehObj(erro) ? erro : {};
  const response = ehObj(detalhes.response) ? detalhes.response : {};
  const config = ehObj(detalhes.config) ? detalhes.config : {};

  console.groupCollapsed(
    `%c[UNIVERSO IMPÉRIO | HOME BLOCOS] ${etapa} — ERRO`,
    "color:#c62828;font-weight:bold",
  );
  console.error("Mensagem:", mensagemErro(erro));
  console.error("Método:", config.method ?? metodo);
  console.error("Rota solicitada:", config.url ?? rota);
  console.error("HTTP:", response.status ?? "Sem resposta HTTP");
  console.error(
    "Resposta da API:",
    response.data ?? "A API não retornou response.data",
  );
  console.error("Erro original:", erro);
  console.groupEnd();
}

function ativo(valor: unknown): boolean {
  if (valor === undefined || valor === null) return true;
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;
  return ["1", "true", "sim", "ativo"].includes(
    String(valor).trim().toLowerCase(),
  );
}

function normalizarTipo(item: Registro): TipoBlocoOpcao | null {
  const codigo = String(item.codigo ?? item.tipo ?? "")
    .trim()
    .toUpperCase();
  const nome = String(item.nome ?? item.titulo ?? codigo).trim();
  const regraBruta = String(
    item.referencia ?? item.regra_referencia ?? "nenhuma",
  )
    .trim()
    .toLowerCase();
  const referencia: RegraReferencia = [
    "obrigatoria",
    "opcional",
    "nenhuma",
  ].includes(regraBruta)
    ? (regraBruta as RegraReferencia)
    : "nenhuma";
  if (!codigo || !nome) return null;
  return {
    valor: codigo,
    nome,
    descricao: String(item.descricao ?? "").trim(),
    referencia,
    ordem: Number(item.ordem ?? 0),
  };
}

function normalizarOpcaoConteudo(
  registro: Registro,
  tipo: TipoBloco,
): Opcao | null {
  const ids: Record<string, unknown> = {
    BANNER: registro.id_banner ?? registro.banner_id ?? registro.id,
    CATEGORIAS: registro.id_categoria ?? registro.categoria_id ?? registro.id,
    VITRINE: registro.id_vitrine ?? registro.id,
    CAMPANHA: registro.id_campanha ?? registro.id,
    CUPONS: registro.id_cupom ?? registro.cupom_id ?? registro.id,
    MARCAS: registro.id_marca ?? registro.marca_id ?? registro.id,
  };
  const id = Number(ids[tipo]);
  if (!Number.isInteger(id) || id <= 0) return null;

  const nomes: Record<string, unknown[]> = {
    BANNER: [
      registro.titulo,
      registro.nome,
      registro.codigo,
      registro.identificacao,
    ],
    CATEGORIAS: [
      registro.nome,
      registro.titulo,
      registro.nome_categoria,
      registro.codigo,
    ],
    VITRINE: [registro.nome, registro.titulo, registro.codigo],
    CAMPANHA: [
      registro.nome,
      registro.titulo,
      registro.titulo_publico,
      registro.slug,
      registro.codigo,
    ],
    CUPONS: [
      registro.nome,
      registro.titulo,
      registro.codigo,
      registro.nome_cupom,
    ],
    MARCAS: [
      registro.nome,
      registro.titulo,
      registro.nome_marca,
      registro.codigo,
    ],
  };
  const nome = String(
    nomes[tipo]?.find((valor) => typeof valor === "string" && valor.trim()) ??
      `${tipo} #${id}`,
  ).trim();

  return {
    id,
    nome,
    codigo: String(registro.codigo ?? registro.slug ?? "").trim(),
    ativo: ativo(
      registro.ativo ??
        registro.status_codigo ??
        registro.status_nome ??
        registro.status,
    ),
  };
}

function dataApi(valor: string): string | null {
  return valor ? `${valor.replace("T", " ")}:00` : null;
}

function slug(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function serializarConfiguracaoJson(valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "";

  try {
    const interpretado =
      typeof valor === "string" ? (JSON.parse(valor) as unknown) : valor;

    if (
      interpretado === null ||
      typeof interpretado !== "object" ||
      (!Array.isArray(interpretado) && !ehObj(interpretado))
    ) {
      return "";
    }

    return JSON.stringify(interpretado, null, 2) ?? "";
  } catch {
    return typeof valor === "string" ? valor : "";
  }
}

function interpretarConfiguracaoJson(
  texto: string,
): Record<string, unknown> | unknown[] | null {
  if (!texto.trim()) return null;

  let interpretado: unknown;
  try {
    interpretado = JSON.parse(texto) as unknown;
  } catch (erro) {
    const detalhe = erro instanceof Error ? erro.message : "sintaxe inválida";
    throw new Error(`O JSON contém um erro: ${detalhe}`);
  }

  if (interpretado === null || typeof interpretado !== "object") {
    throw new Error(
      "A configuração precisa ser um objeto { } ou uma lista [ ].",
    );
  }

  return interpretado as Record<string, unknown> | unknown[];
}

function validarTextoJson(texto: string): {
  valido: boolean;
  vazio: boolean;
  mensagem: string;
} {
  if (!texto.trim()) {
    return {
      valido: true,
      vazio: true,
      mensagem:
        "Configuração opcional vazia. O bloco será salvo sem propriedades extras.",
    };
  }

  try {
    const interpretado = JSON.parse(texto) as unknown;
    if (interpretado === null || typeof interpretado !== "object") {
      return {
        valido: false,
        vazio: false,
        mensagem: "Use um objeto JSON { } ou uma lista JSON [ ].",
      };
    }

    return {
      valido: true,
      vazio: false,
      mensagem:
        "JSON válido. Números, booleanos e valores nulos serão preservados.",
    };
  } catch (erro) {
    return {
      valido: false,
      vazio: false,
      mensagem: erro instanceof Error ? erro.message : "JSON inválido.",
    };
  }
}

export default function NovoHomeBlocoPage() {
  const router = useRouter();
  const [form, setForm] = useState<Formulario>(FORM_INICIAL);
  const [idEdicao, setIdEdicao] = useState<number | null>(null);
  const [tipos, setTipos] = useState<TipoBlocoOpcao[]>([]);
  const [status, setStatus] = useState<Opcao[]>([]);
  const [conteudos, setConteudos] = useState<Opcao[]>([]);
  const [configuracaoJsonTexto, setConfiguracaoJsonTexto] =
    useState<string>(JSON_CONFIG_MODELO);
  const validacaoJson = useMemo(
    () => validarTextoJson(configuracaoJsonTexto),
    [configuracaoJsonTexto],
  );
  const [carregandoTipos, setCarregandoTipos] = useState(true);
  const [carregandoStatus, setCarregandoStatus] = useState(true);
  const [carregandoConteudo, setCarregandoConteudo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const parametros = new URLSearchParams(window.location.search);
    const id = Number(parametros.get("id"));
    setIdEdicao(Number.isInteger(id) && id > 0 ? id : null);
    setPronto(true);
  }, []);

  // Tipos agora vêm do catálogo home_bloco_tipos no banco de dados.
  useEffect(() => {
    if (!pronto) return;
    let componenteAtivo = true;

    async function carregarTipos() {
      setCarregandoTipos(true);
      const rota = ROTAS.HOME_BLOCOS.PAINEL.LISTAR_TIPOS;
      logInicio("Carregar tipos do banco", "GET", rota);
      try {
        const resposta = await conexao.get(rota);
        const registrosBrutos = extrair(resposta.data, ["tipos", "itens"]);
        const lista = registrosBrutos
          .map(normalizarTipo)
          .filter((item): item is TipoBlocoOpcao => item !== null)
          .sort(
            (a, b) =>
              a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR"),
          );

        logSucesso("Carregar tipos do banco", rota, resposta, {
          quantidadeBruta: registrosBrutos.length,
          registrosBrutos,
          tiposNormalizados: lista,
        });
        if (!componenteAtivo) return;
        setTipos(lista);
        if (lista.length === 0) {
          setErro(
            "O catálogo de tipos está vazio. Execute o SQL home-bloco-tipos-catalogo.sql.",
          );
          return;
        }
        setForm((atual) =>
          atual.tipo && lista.some((item) => item.valor === atual.tipo)
            ? atual
            : { ...atual, tipo: lista[0].valor },
        );
      } catch (falha) {
        logFalha("Carregar tipos do banco", "GET", rota, falha);
        if (componenteAtivo) setErro(mensagemErro(falha));
      } finally {
        if (componenteAtivo) setCarregandoTipos(false);
      }
    }

    void carregarTipos();
    return () => {
      componenteAtivo = false;
    };
  }, [pronto]);

  useEffect(() => {
    if (!pronto) return;
    let componenteAtivo = true;

    async function carregarStatus() {
      const rota = ROTAS.PERMISSOES.STATUS.LISTAR;
      setCarregandoStatus(true);
      logInicio("Carregar status", "GET", rota);
      try {
        const resposta = await conexao.get(rota);
        const registrosBrutos = extrair(resposta.data, [
          "status",
          "statuses",
          "itens",
        ]);
        const lista = registrosBrutos
          .map((item) => ({
            id: Number(item.id_status ?? item.status_id ?? item.id),
            nome: String(item.nome ?? item.descricao ?? item.codigo ?? ""),
            codigo: String(item.codigo ?? ""),
            grupo: String(item.grupo ?? "Geral"),
            ativo: ativo(item.ativo),
          }))
          .filter((item) => item.id > 0 && item.nome);

        logSucesso("Carregar status", rota, resposta, {
          quantidadeBruta: registrosBrutos.length,
          registrosBrutos,
          statusNormalizados: lista,
        });
        if (componenteAtivo) {
          setStatus(lista);
          if (lista.length === 0) {
            setAviso(
              "Nenhum status foi retornado. Verifique a permissão status.gerenciar.",
            );
          }
        }
      } catch (falha) {
        logFalha("Carregar status", "GET", rota, falha);
        if (componenteAtivo) setErro(mensagemErro(falha));
      } finally {
        if (componenteAtivo) setCarregandoStatus(false);
      }
    }

    void carregarStatus();
    return () => {
      componenteAtivo = false;
    };
  }, [pronto]);

  useEffect(() => {
    if (!pronto || !form.tipo) return;
    const definicao = ROTAS_CONTEUDO[form.tipo];
    if (!definicao) {
      setConteudos([]);
      setCarregandoConteudo(false);
      return;
    }

    let componenteAtivo = true;
    setCarregandoConteudo(true);
    setConteudos([]);

    async function carregarConteudos() {
      logInicio(
        `Carregar conteúdo do tipo ${form.tipo}`,
        "GET",
        definicao.rota,
        {
          tipoSelecionado: form.tipo,
          chavesDeExtracao: definicao.chaves,
        },
      );
      try {
        const resposta = await conexao.get(definicao.rota);
        const registrosBrutos = extrair(resposta.data, definicao.chaves);
        const lista = registrosBrutos
          .map((item) => normalizarOpcaoConteudo(item, form.tipo))
          .filter((item): item is Opcao => item !== null)
          .sort(
            (a, b) =>
              Number(b.ativo) - Number(a.ativo) ||
              a.nome.localeCompare(b.nome, "pt-BR"),
          );

        logSucesso(
          `Carregar conteúdo do tipo ${form.tipo}`,
          definicao.rota,
          resposta,
          {
            tipoSelecionado: form.tipo,
            quantidadeBruta: registrosBrutos.length,
            registrosBrutos,
            conteudosNormalizados: lista,
          },
        );
        if (componenteAtivo) {
          setConteudos(lista);
          if (lista.length === 0) {
            setAviso(
              `Nenhum registro encontrado para ${form.tipo.toLowerCase()}.`,
            );
          }
        }
      } catch (falha) {
        logFalha(
          `Carregar conteúdo do tipo ${form.tipo}`,
          "GET",
          definicao.rota,
          falha,
        );
        if (componenteAtivo) {
          const statusHttp =
            ehObj(falha) && ehObj(falha.response)
              ? Number(falha.response.status)
              : 0;
          setErro(
            form.tipo === "BANNER" && statusHttp === 403
              ? "Sem permissão para consultar banners. Libere a permissão banners.gerenciar para este usuário."
              : mensagemErro(falha),
          );
        }
      } finally {
        if (componenteAtivo) setCarregandoConteudo(false);
      }
    }

    void carregarConteudos();
    return () => {
      componenteAtivo = false;
    };
  }, [form.tipo, pronto]);

  useEffect(() => {
    if (!pronto || idEdicao === null) return;
    const idBlocoAtual = idEdicao;
    let componenteAtivo = true;

    async function carregarBloco() {
      const rota = ROTAS.HOME_BLOCOS.PAINEL.BUSCAR_POR_ID(idBlocoAtual);
      logInicio("Carregar bloco para edição", "GET", rota, {
        id_bloco: idBlocoAtual,
      });
      try {
        const resposta = await conexao.get(rota);
        const raiz = ehObj(resposta.data) ? resposta.data : {};
        const dados = ehObj(raiz.dados) ? raiz.dados : raiz;
        const configuracaoTexto = serializarConfiguracaoJson(
          dados.configuracao_json,
        );
        logSucesso("Carregar bloco para edição", rota, resposta, {
          bloco: dados,
          configuracaoJson: configuracaoTexto,
        });

        if (!componenteAtivo) return;
        setForm({
          tipo: String(dados.tipo ?? "").toUpperCase(),
          referencia_id:
            dados.referencia_id === null || dados.referencia_id === undefined
              ? ""
              : String(dados.referencia_id),
          titulo_customizado: String(dados.titulo_customizado ?? ""),
          descricao_customizada: String(dados.descricao_customizada ?? ""),
          ordem: String(dados.ordem ?? 1),
          status_id: String(dados.status_id ?? ""),
          ativo: ativo(dados.ativo),
          inicio_em: String(dados.inicio_em ?? "")
            .replace(" ", "T")
            .slice(0, 16),
          fim_em: String(dados.fim_em ?? "")
            .replace(" ", "T")
            .slice(0, 16),
        });
        setConfiguracaoJsonTexto(configuracaoTexto);
      } catch (falha) {
        logFalha("Carregar bloco para edição", "GET", rota, falha);
        if (componenteAtivo) setErro(mensagemErro(falha));
      }
    }

    void carregarBloco();
    return () => {
      componenteAtivo = false;
    };
  }, [idEdicao, pronto]);

  const tipoAtual = useMemo(
    () => tipos.find((tipo) => tipo.valor === form.tipo) ?? null,
    [tipos, form.tipo],
  );

  function atualizar<K extends keyof Formulario>(
    campo: K,
    valor: Formulario[K],
  ) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  function alterarTipo(tipo: string) {
    setForm((atual) => ({ ...atual, tipo, referencia_id: "" }));
    setConteudos([]);
    setErro("");
    setAviso("");
  }

  function formatarConfiguracaoJson() {
    try {
      const interpretado = interpretarConfiguracaoJson(configuracaoJsonTexto);
      setConfiguracaoJsonTexto(
        interpretado === null
          ? ""
          : (JSON.stringify(interpretado, null, 2) ?? "{}"),
      );
      setErro("");
      setAviso("Configuração JSON formatada.");
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "Não foi possível formatar o JSON.",
      );
      setAviso("");
    }
  }

  function restaurarModeloJson() {
    setConfiguracaoJsonTexto(JSON_CONFIG_MODELO);
    setErro("");
    setAviso(
      "Modelo inicial restaurado. Revise as propriedades antes de salvar.",
    );
  }

  function limparConfiguracaoJson() {
    setConfiguracaoJsonTexto("");
    setErro("");
    setAviso(
      "Configuração avançada removida. O bloco será salvo sem JSON adicional.",
    );
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setAviso("");

    if (!tipoAtual) {
      setErro("Selecione um tipo de bloco carregado do catálogo do banco.");
      return;
    }

    const referencia = form.referencia_id.trim();
    if (tipoAtual.referencia === "obrigatoria" && !referencia) {
      setErro("Selecione o conteúdo cadastrado.");
      return;
    }
    if (
      referencia &&
      tipoAtual.referencia !== "nenhuma" &&
      !conteudos.some((conteudo) => conteudo.id === Number(referencia))
    ) {
      setErro("Selecione um registro válido na lista carregada pela API.");
      return;
    }
    if (
      tipoAtual.referencia !== "nenhuma" &&
      referencia &&
      (!Number.isInteger(Number(referencia)) || Number(referencia) <= 0)
    ) {
      setErro("A referência precisa ser um ID inteiro positivo.");
      return;
    }
    if (
      !form.status_id ||
      !status.some((item) => item.id === Number(form.status_id))
    ) {
      setErro("Selecione um status válido do catálogo.");
      return;
    }

    let configuracaoJson: Record<string, unknown> | unknown[] | null;
    try {
      configuracaoJson = interpretarConfiguracaoJson(configuracaoJsonTexto);
    } catch (falha) {
      setErro(
        falha instanceof Error
          ? falha.message
          : "A configuração JSON é inválida.",
      );
      return;
    }

    const ordem = Number(form.ordem);
    if (!Number.isInteger(ordem) || ordem < 0) {
      setErro("A ordem deve ser um número inteiro maior ou igual a zero.");
      return;
    }

    const payload = {
      pagina: "HOME",
      codigo: slug(form.titulo_customizado)
        ? `home-${form.tipo.toLowerCase()}-${slug(form.titulo_customizado)}`
        : undefined,
      tipo: form.tipo,
      referencia_id:
        tipoAtual.referencia === "nenhuma" || !referencia
          ? null
          : Number(referencia),
      titulo_customizado: form.titulo_customizado.trim() || null,
      descricao_customizada: form.descricao_customizada.trim() || null,
      ordem,
      status_id: Number(form.status_id),
      ativo: form.ativo,
      inicio_em: dataApi(form.inicio_em),
      fim_em: dataApi(form.fim_em),
      // Envia um objeto/array JSON real, não uma string de textarea.
      configuracao_json: configuracaoJson,
    };

    setSalvando(true);
    const metodo = idEdicao !== null ? "PUT" : "POST";
    const rota =
      idEdicao !== null
        ? ROTAS.HOME_BLOCOS.PAINEL.ATUALIZAR(idEdicao)
        : ROTAS.HOME_BLOCOS.PAINEL.CADASTRAR;
    // O roteador PHP resolve o argumento do controller pelo nome do parâmetro.
    // HomeBlocoController::cadastrar(array $dados) e atualizar(int $id, array $dados)
    // recebem o conteúdo dentro do envelope { dados: ... }.
    const corpoRequisicao = { dados: payload };

    logInicio(
      idEdicao !== null ? "Atualizar bloco" : "Cadastrar bloco",
      metodo,
      rota,
      corpoRequisicao,
    );
    try {
      const resposta =
        idEdicao !== null
          ? await conexao.put(rota, corpoRequisicao, {
              headers: { "Content-Type": "application/json" },
            })
          : await conexao.post(rota, corpoRequisicao, {
              headers: { "Content-Type": "application/json" },
            });
      logSucesso(
        idEdicao !== null ? "Atualizar bloco" : "Cadastrar bloco",
        rota,
        resposta,
        payload,
      );
      router.push("/painel/home-blocos");
      router.refresh();
    } catch (falha) {
      logFalha(
        idEdicao !== null ? "Atualizar bloco" : "Cadastrar bloco",
        metodo,
        rota,
        falha,
      );
      setErro(mensagemErro(falha));
    } finally {
      setSalvando(false);
    }
  }

  const podeSelecionarConteudo = tipoAtual?.referencia !== "nenhuma";

  return (
    <main className="home-blocos-page">
      <header className="hb-topbar">
        <div className="hb-breadcrumb">
          <Link href="/painel">Painel</Link>
          <span>/</span>
          <Link href="/painel/home-blocos">Tela inicial</Link>
          <span>/</span>
          <strong>
            {idEdicao ? `Editar bloco #${idEdicao}` : "Novo bloco"}
          </strong>
        </div>

        <span className="hb-version">
          UNIVERSO IMPÉRIO <b>V3</b>
        </span>
      </header>

      <section className="hb-content-panel hb-form-page">
        <div className="hb-form-hero">
          <div className="hb-form-hero-icon">
            <LayoutGrid size={22} />
          </div>
          <div className="hb-form-page-heading">
            <span className="hb-eyebrow">CONSTRUTOR DA PÁGINA INICIAL</span>
            <h1>
              {idEdicao ? `Editar bloco #${idEdicao}` : "Adicionar bloco"}
            </h1>
            <p>
              Organize o conteúdo da sua loja, escolha como ele será exibido e
              defina quando deverá aparecer.
            </p>
          </div>
          <div className="hb-hero-tag">
            <Sparkles size={14} />
            <span>Home dinâmica</span>
          </div>
        </div>

        <form onSubmit={salvar} className="hb-form">
          <div className="hb-form-sections">
            <section className="hb-section">
              <div className="hb-section-heading">
                <span className="hb-section-number">01</span>
                <div>
                  <h2>Conteúdo do bloco</h2>
                  <p>
                    Escolha o tipo e, quando necessário, o registro que será
                    exibido.
                  </p>
                </div>
              </div>

              <div className="hb-section-grid">
                <label className="hb-field hb-field-full">
                  <span>
                    Tipo de bloco <b>*</b>
                  </span>
                  <select
                    required
                    value={form.tipo}
                    onChange={(evento) => alterarTipo(evento.target.value)}
                    disabled={carregandoTipos || tipos.length === 0}
                  >
                    <option value="">
                      {carregandoTipos
                        ? "Carregando tipos do banco..."
                        : "Selecione o tipo de bloco"}
                    </option>
                    {tipos.map((tipo) => (
                      <option key={tipo.valor} value={tipo.valor}>
                        {tipo.nome} ({tipo.valor})
                      </option>
                    ))}
                  </select>
                  <small>
                    {carregandoTipos
                      ? "Consultando o catálogo home_bloco_tipos..."
                      : tipoAtual?.descricao ||
                        (tipos.length
                          ? `${tipos.length} tipo(s) disponível(is) no catálogo.`
                          : "Nenhum tipo disponível.")}
                  </small>
                </label>

                {podeSelecionarConteudo && tipoAtual && (
                  <label className="hb-field hb-field-full">
                    <span>
                      Conteúdo: {tipoAtual.nome}{" "}
                      {tipoAtual.referencia === "obrigatoria" ? (
                        <b>*</b>
                      ) : (
                        "(opcional)"
                      )}
                    </span>
                    <select
                      value={form.referencia_id}
                      onChange={(evento) =>
                        atualizar("referencia_id", evento.target.value)
                      }
                      disabled={
                        carregandoConteudo || !ROTAS_CONTEUDO[form.tipo]
                      }
                      required={tipoAtual.referencia === "obrigatoria"}
                    >
                      <option value="">
                        {carregandoConteudo
                          ? "Carregando registros..."
                          : tipoAtual.referencia === "obrigatoria"
                            ? `Selecione ${tipoAtual.nome.toLowerCase()}`
                            : "Usar todos (sem referência específica)"}
                      </option>
                      {conteudos.map((conteudo) => (
                        <option key={conteudo.id} value={String(conteudo.id)}>
                          {conteudo.nome} · ID #{conteudo.id}
                          {conteudo.codigo ? ` · ${conteudo.codigo}` : ""}
                          {!conteudo.ativo ? " · Inativo" : ""}
                        </option>
                      ))}
                    </select>
                    <small>
                      {carregandoConteudo
                        ? "Consultando registros cadastrados..."
                        : !ROTAS_CONTEUDO[form.tipo]
                          ? "Este tipo ainda precisa de uma rota de consulta de conteúdo no frontend."
                          : tipoAtual.referencia === "obrigatoria"
                            ? `${conteudos.length} registro(s) disponível(is). É necessário selecionar um.`
                            : `${conteudos.length} registro(s) encontrado(s). Você pode usar o conjunto geral.`}
                    </small>
                  </label>
                )}

                {tipoAtual && (
                  <div className="hb-type-summary hb-field-full">
                    <span className="hb-type-summary-icon">
                      <Sparkles size={16} />
                    </span>
                    <div>
                      <strong>{tipoAtual.nome}</strong>
                      <p>
                        {tipoAtual.referencia === "obrigatoria"
                          ? "Este tipo exige a seleção de um conteúdo cadastrado."
                          : tipoAtual.referencia === "opcional"
                            ? "Você pode selecionar um conteúdo específico ou utilizar todos os registros."
                            : "Este tipo utiliza o conteúdo personalizado do próprio bloco."}
                      </p>
                    </div>
                    <span className="hb-type-code">{tipoAtual.valor}</span>
                  </div>
                )}
              </div>
            </section>

            <section className="hb-section">
              <div className="hb-section-heading">
                <span className="hb-section-number">02</span>
                <div>
                  <h2>Apresentação</h2>
                  <p>
                    Defina o título, a descrição e a posição deste bloco na
                    página.
                  </p>
                </div>
              </div>

              <div className="hb-section-grid">
                <label className="hb-field">
                  <span>
                    Ordem de exibição <b>*</b>
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={form.ordem}
                    onChange={(evento) =>
                      atualizar("ordem", evento.target.value)
                    }
                    placeholder="Ex.: 1"
                  />
                  <small>Blocos com menor número aparecem primeiro.</small>
                </label>

                <label className="hb-field">
                  <span>Título personalizado</span>
                  <input
                    maxLength={180}
                    value={form.titulo_customizado}
                    onChange={(evento) =>
                      atualizar("titulo_customizado", evento.target.value)
                    }
                    placeholder="Ex.: Produtos em destaque"
                  />
                </label>

                <label className="hb-field hb-field-full">
                  <span>Descrição personalizada</span>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={form.descricao_customizada}
                    onChange={(evento) =>
                      atualizar("descricao_customizada", evento.target.value)
                    }
                    placeholder="Escreva uma frase curta para acompanhar o conteúdo..."
                  />
                  <small>Até 500 caracteres. Campo opcional.</small>
                </label>
              </div>
            </section>

            <section className="hb-section">
              <div className="hb-section-heading">
                <span className="hb-section-number">03</span>
                <div>
                  <h2>Publicação</h2>
                  <p>
                    Controle o status e o período em que o bloco ficará
                    disponível.
                  </p>
                </div>
              </div>

              <div className="hb-section-grid">
                <label className="hb-field hb-field-full">
                  <span>
                    Status do bloco <b>*</b>
                  </span>
                  <select
                    required
                    value={form.status_id}
                    onChange={(evento) =>
                      atualizar("status_id", evento.target.value)
                    }
                    disabled={carregandoStatus}
                  >
                    <option value="">
                      {carregandoStatus
                        ? "Carregando status..."
                        : "Selecione o status"}
                    </option>
                    {status.map((item) => (
                      <option
                        key={item.id}
                        value={String(item.id)}
                        disabled={!item.ativo}
                      >
                        {item.grupo ?? "Geral"} · {item.nome}
                        {item.codigo ? ` (${item.codigo})` : ""} · #{item.id}
                      </option>
                    ))}
                  </select>
                  <small>
                    {carregandoStatus
                      ? "Consultando catálogo de status..."
                      : `${status.length} status encontrado(s).`}
                  </small>
                </label>

                <label className="hb-field">
                  <span>Início da publicação</span>
                  <div className="hb-input-icon">
                    <CalendarClock size={16} />
                    <input
                      type="datetime-local"
                      value={form.inicio_em}
                      onChange={(evento) =>
                        atualizar("inicio_em", evento.target.value)
                      }
                    />
                  </div>
                  <small>Deixe vazio para iniciar sem agendamento.</small>
                </label>

                <label className="hb-field">
                  <span>Fim da publicação</span>
                  <div className="hb-input-icon">
                    <CalendarClock size={16} />
                    <input
                      type="datetime-local"
                      value={form.fim_em}
                      onChange={(evento) =>
                        atualizar("fim_em", evento.target.value)
                      }
                    />
                  </div>
                  <small>Deixe vazio para não definir encerramento.</small>
                </label>

                <label
                  className={`hb-publish-toggle ${form.ativo ? "is-active" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={form.ativo}
                    onChange={(evento) =>
                      atualizar("ativo", evento.target.checked)
                    }
                  />
                  <span className="hb-publish-switch" aria-hidden="true" />
                  <span className="hb-publish-copy">
                    <strong>
                      {form.ativo ? "Bloco publicado" : "Bloco não publicado"}
                    </strong>
                    <small>
                      {form.ativo
                        ? "O bloco poderá aparecer na página pública conforme o período definido."
                        : "O bloco ficará oculto para os visitantes da loja."}
                    </small>
                  </span>
                  <span className="hb-publish-status">
                    {form.ativo ? "ATIVO" : "INATIVO"}
                  </span>
                </label>
              </div>
            </section>

            <details className="hb-json-details">
              <summary className="hb-json-summary">
                <span className="hb-section-number hb-section-number-muted">
                  <Settings2 size={16} />
                </span>
                <span className="hb-json-summary-copy">
                  <strong>Configurações avançadas</strong>
                  <small>
                    Personalize as propriedades técnicas enviadas em
                    configuracao_json.
                  </small>
                </span>
                <span
                  className={`hb-json-count ${
                    validacaoJson.valido ? "is-valid" : "is-invalid"
                  }`}
                >
                  {validacaoJson.vazio
                    ? "Opcional"
                    : validacaoJson.valido
                      ? "JSON válido"
                      : "JSON inválido"}
                </span>
                <ChevronDown className="hb-json-chevron" size={18} />
              </summary>

              <div className="hb-json-editor">
                <div className="hb-json-heading">
                  <div>
                    <strong>Editor de configuração</strong>
                    <small>
                      Edite o objeto ou a lista JSON diretamente. Deixe vazio se
                      este bloco não precisar de propriedades extras.
                    </small>
                  </div>
                  <div className="hb-json-toolbar">
                    <button
                      type="button"
                      className="hb-button hb-button-light"
                      onClick={formatarConfiguracaoJson}
                      disabled={
                        !configuracaoJsonTexto.trim() || !validacaoJson.valido
                      }
                    >
                      <Check size={15} /> Formatar JSON
                    </button>
                    <button
                      type="button"
                      className="hb-button hb-button-light"
                      onClick={restaurarModeloJson}
                    >
                      <RotateCcw size={15} /> Restaurar modelo
                    </button>
                    <button
                      type="button"
                      className="hb-button hb-button-light"
                      onClick={limparConfiguracaoJson}
                      disabled={!configuracaoJsonTexto.trim()}
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="hb-json-code-frame">
                  <div className="hb-json-codebar">
                    <span className="hb-json-filename">
                      <Code2 size={14} /> configuracao_json
                    </span>
                    <span>
                      JSON · {configuracaoJsonTexto.split("\n").length} linha(s)
                    </span>
                  </div>
                  <textarea
                    className="hb-json-code"
                    value={configuracaoJsonTexto}
                    onChange={(evento) => {
                      setConfiguracaoJsonTexto(evento.target.value);
                      setErro("");
                      setAviso("");
                    }}
                    spellCheck={false}
                    autoCapitalize="off"
                    autoComplete="off"
                    autoCorrect="off"
                    rows={17}
                    aria-label="Editor de configuração JSON"
                    placeholder={JSON_CONFIG_MODELO}
                  />
                </div>

                <div
                  className={`hb-json-validation ${
                    validacaoJson.valido ? "is-valid" : "is-invalid"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {validacaoJson.valido ? (
                    <Check size={15} />
                  ) : (
                    <CircleAlert size={15} />
                  )}
                  <span>{validacaoJson.mensagem}</span>
                </div>
                <small className="hb-json-help">
                  O conteúdo é validado antes do envio e convertido para um
                  objeto ou lista JSON real. Valores numéricos, booleanos e
                  nulos não são transformados em texto.
                </small>
              </div>
            </details>
          </div>

          {aviso && (
            <div className="hb-alert hb-alert-success">
              <span>{aviso}</span>
            </div>
          )}

          {erro && (
            <div className="hb-alert hb-alert-error">
              <CircleAlert size={17} />
              <span>{erro}</span>
            </div>
          )}

          <div className="hb-form-actions">
            <Link
              className="hb-button hb-button-light"
              href="/painel/home-blocos"
            >
              Cancelar
            </Link>
            <button
              className="hb-button hb-button-primary"
              type="submit"
              disabled={
                salvando ||
                carregandoTipos ||
                carregandoStatus ||
                !tipoAtual ||
                !validacaoJson.valido
              }
            >
              {salvando ? (
                <LoaderCircle className="hb-spin" size={17} />
              ) : (
                <Save size={17} />
              )}
              {salvando
                ? "Salvando..."
                : idEdicao !== null
                  ? "Salvar alterações"
                  : "Criar bloco"}
            </button>
          </div>
        </form>
      </section>

      <footer className="hb-footer">
        <span>Universo Império V3</span>
        <span>Gerenciamento da página inicial</span>
        <Link href="/painel/home-blocos">
          Voltar aos blocos <ArrowLeft size={14} />
        </Link>
      </footer>
    </main>
  );
}
