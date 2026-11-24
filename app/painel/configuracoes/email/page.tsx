"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";
import {
  MensagemTemplate,
  MensagemTemplatePayload,
} from "@/Services/Hooks/types/MensagemTemplate";
import {
  ativarMensagemTemplate,
  atualizarMensagemTemplate,
  buscarMensagemTemplate,
  buscarMensagemTemplatePorCodigo,
  cadastrarMensagemTemplate,
  desativarMensagemTemplate,
  listarMensagensTemplate,
} from "@/Services/Servicos/MensagemTemplateService";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

const FORMULARIO_INICIAL: MensagemTemplatePayload = {
  status_id: null,
  codigo: "",
  nome: "",
  canal: "email",
  assunto: "",
  conteudo: JSON.stringify(
    {
      titulo: "Que bom ter você por aqui!",
      mensagem:
        "Olá, {{nome}}! Seu cadastro foi realizado com sucesso. É um prazer ter você conosco!",
      dados: {},
    },
    null,
    2,
  ),
  ativo: true,
};

type IconeNome =
  | "mail"
  | "plus"
  | "search"
  | "edit"
  | "eye"
  | "power"
  | "arrow-left"
  | "x"
  | "save"
  | "send"
  | "check"
  | "alert";

function Icone({ nome }: { nome: IconeNome }) {
  const comum = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  const caminhos: Record<IconeNome, ReactNode> = {
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 5 5" />
      </>
    ),
    edit: (
      <>
        <path d="m4 16.5-.8 4.3 4.3-.8L20 7.5 16.5 4 4 16.5Z" />
        <path d="m14.8 5.7 3.5 3.5" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    power: (
      <>
        <path d="M12 2v10" />
        <path d="M6.2 5.8a8 8 0 1 0 11.6 0" />
      </>
    ),
    "arrow-left": (
      <>
        <path d="m15 18-6-6 6-6" />
        <path d="M9 12h12" />
      </>
    ),
    x: <path d="m18 6-12 12M6 6l12 12" />,
    save: (
      <>
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
        <path d="M17 21v-8H7v8M7 3v5h9" />
      </>
    ),
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    alert: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4m0 4h.01" />
      </>
    ),
  };

  return <svg {...comum}>{caminhos[nome]}</svg>;
}

interface StatusOpcao {
  id_status: number;
  grupo: string;
  codigo: string;
  nome: string;
  ativo: boolean | number;
}

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function extrairListaStatus(resposta: unknown): StatusOpcao[] {
  const raiz = resposta as any;
  const possiveis = [
    raiz,
    raiz?.dados,
    raiz?.data,
    raiz?.data?.dados,
    raiz?.data?.dados?.status,
    raiz?.dados?.status,
    raiz?.status,
    raiz?.data?.status,
  ];

  const lista = possiveis.find(Array.isArray) as any[] | undefined;
  if (!lista) return [];

  return lista
    .map((item) => item?.status ?? item)
    .filter((item) => item && Number(item.id_status) > 0)
    .map((item) => ({
      id_status: Number(item.id_status),
      grupo: String(item.grupo ?? ""),
      codigo: String(item.codigo ?? ""),
      nome: String(item.nome ?? item.codigo ?? ""),
      ativo: item.ativo === true || Number(item.ativo) === 1,
    }))
    .filter((item) => item.ativo);
}

function formatarData(valor?: string | null): string {
  if (!valor) return "—";
  const data = new Date(valor.replace(" ", "T"));
  if (Number.isNaN(data.getTime())) return valor;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
}

function extrairMensagemErro(erro: unknown): string {
  const qualquerErro = erro as {
    response?: {
      data?: { mensagem?: string; message?: string; erro?: string };
    };
    message?: string;
  };

  return (
    qualquerErro?.response?.data?.mensagem ||
    qualquerErro?.response?.data?.message ||
    qualquerErro?.response?.data?.erro ||
    qualquerErro?.message ||
    "Ocorreu um erro ao processar a solicitação."
  );
}

function lerConteudoJson(conteudo: string): Record<string, unknown> {
  let valor: unknown;

  try {
    valor = JSON.parse(conteudo);
  } catch {
    throw new Error("O conteúdo do template precisa ser um JSON válido.");
  }

  if (!ehObjeto(valor)) {
    throw new Error("O conteúdo do template precisa ser um objeto JSON.");
  }

  if (typeof valor.titulo !== "string" || !valor.titulo.trim()) {
    throw new Error('Informe o campo "titulo" no JSON.');
  }

  if (typeof valor.mensagem !== "string" || !valor.mensagem.trim()) {
    throw new Error('Informe o campo "mensagem" no JSON.');
  }

  if (!ehObjeto(valor.dados)) {
    throw new Error(
      'O campo "dados" deve ser um objeto JSON. Use "dados": {} quando não houver detalhes.',
    );
  }

  return valor;
}

function obterVariaveis(conteudo: string): string[] {
  const correspondencias = Array.from(
    conteudo.matchAll(/\{\{([\w.-]+)\}\}/g),
  ).map((match) => match[1]);

  return Array.from(new Set(correspondencias)).filter(
    (chave) => chave.toLowerCase() !== "nome",
  );
}

function rotuloVariavel(chave: string): string {
  return chave
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letra) => letra.toLocaleUpperCase("pt-BR"));
}

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function gerarHtmlPreview(template: MensagemTemplate): string {
  try {
    const conteudo = lerConteudoJson(template.conteudo);
    const substituirExemplo = (texto: string) =>
      escaparHtml(texto).replace(
        /\{\{([\w.-]+)\}\}/g,
        (_match, chave: string) =>
          chave.toLowerCase() === "nome"
            ? "Cliente"
            : `[${rotuloVariavel(chave)}]`,
      );

    const titulo = substituirExemplo(String(conteudo.titulo ?? ""));
    const mensagem = substituirExemplo(String(conteudo.mensagem ?? "")).replace(
      /\n/g,
      "<br>",
    );

    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:28px 14px;background:#f7f2ef;font-family:Arial,sans-serif;color:#38242c"><main style="max-width:600px;margin:auto;padding:28px;background:#fffaf7;border:1px solid #eadcda;border-radius:12px"><h2 style="margin:0 0 18px;color:#a75d70">${titulo}</h2><p style="font-size:15px;line-height:1.8">${mensagem}</p><hr style="margin-top:28px;border:0;border-top:1px solid #eadcda"><p style="text-align:center;color:#8b7b82;font-size:12px">Universo Império</p></main></body></html>`;
  } catch {
    return "<!doctype html><html lang='pt-BR'><body style='font-family:Arial;padding:24px;color:#8b263d'>Não foi possível montar a pré-visualização. Verifique o JSON do template.</body></html>";
  }
}

export default function ConfiguracaoEmailPage() {
  const router = useRouter();

  const [templates, setTemplates] = useState<MensagemTemplate[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "ativos" | "inativos">(
    "todos",
  );
  const [modalAberto, setModalAberto] = useState(false);
  const [visualizacaoAberta, setVisualizacaoAberta] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [templateSelecionado, setTemplateSelecionado] =
    useState<MensagemTemplate | null>(null);
  const [formulario, setFormulario] =
    useState<MensagemTemplatePayload>(FORMULARIO_INICIAL);
  const [statusDisponiveis, setStatusDisponiveis] = useState<StatusOpcao[]>([]);
  const [carregandoStatus, setCarregandoStatus] = useState(false);

  const [modalEnviarAberto, setModalEnviarAberto] = useState(false);
  const [templateEnvio, setTemplateEnvio] = useState<MensagemTemplate | null>(
    null,
  );
  const [destinatario, setDestinatario] = useState("");
  const [nomeDestinatario, setNomeDestinatario] = useState("");
  const [variaveisEnvio, setVariaveisEnvio] = useState<Record<string, string>>(
    {},
  );
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [erroEnvio, setErroEnvio] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      setTemplates(await listarMensagensTemplate());
    } catch (e) {
      setErro(extrairMensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    let cancelado = false;

    async function carregarStatus() {
      setCarregandoStatus(true);
      try {
        const resposta = await conexao.get(
          ROTAS.PERMISSOES.STATUS.LISTAR_POR_GRUPO("GERAL"),
        );
        if (!cancelado) setStatusDisponiveis(extrairListaStatus(resposta.data));
      } catch (e) {
        if (!cancelado) {
          console.error("[EMAIL] Erro ao carregar status:", e);
          setErro("Não foi possível carregar os status cadastrados no banco.");
        }
      } finally {
        if (!cancelado) setCarregandoStatus(false);
      }
    }

    void carregarStatus();
    return () => {
      cancelado = true;
    };
  }, []);

  const templatesFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return templates.filter((template) => {
      const correspondeBusca =
        !termo ||
        template.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        template.codigo.toLocaleLowerCase("pt-BR").includes(termo) ||
        (template.assunto ?? "").toLocaleLowerCase("pt-BR").includes(termo);

      const correspondeFiltro =
        filtro === "todos" ||
        (filtro === "ativos" && template.ativo) ||
        (filtro === "inativos" && !template.ativo);

      return correspondeBusca && correspondeFiltro;
    });
  }, [templates, busca, filtro]);

  const contadores = useMemo(
    () => ({
      total: templates.length,
      ativos: templates.filter((item) => item.ativo).length,
      inativos: templates.filter((item) => !item.ativo).length,
    }),
    [templates],
  );

  function abrirNovo() {
    setErro("");
    setSucesso("");
    router.push("/painel/configuracoes/email/cadastrar");
  }

  async function abrirEdicao(id: number) {
    setErro("");
    setSucesso("");

    try {
      const template = await buscarMensagemTemplate(id);
      setEditandoId(id);
      setFormulario({
        status_id: template.status_id ?? null,
        codigo: template.codigo,
        nome: template.nome,
        canal: template.canal,
        assunto: template.assunto ?? "",
        conteudo: template.conteudo,
        ativo: template.ativo,
      });
      setModalAberto(true);
    } catch (e) {
      setErro(extrairMensagemErro(e));
    }
  }

  function fecharModalEdicao() {
    if (salvando) return;
    setModalAberto(false);
    setEditandoId(null);
    setFormulario(FORMULARIO_INICIAL);
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    let conteudoNormalizado: string;

    try {
      const objeto = lerConteudoJson(formulario.conteudo);
      conteudoNormalizado = JSON.stringify(objeto, null, 2);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Conteúdo JSON inválido.");
      return;
    }

    const payload: MensagemTemplatePayload = {
      ...formulario,
      codigo: formulario.codigo.trim(),
      nome: formulario.nome.trim(),
      canal: formulario.canal.trim().toLowerCase(),
      assunto: formulario.assunto?.trim() || null,
      conteudo: conteudoNormalizado,
      status_id: formulario.status_id ? Number(formulario.status_id) : null,
      ativo: Boolean(formulario.ativo),
    };

    if (!payload.codigo || !payload.nome) {
      setErro("Preencha o código e o nome do template.");
      return;
    }

    if (payload.assunto && payload.assunto.length > 255) {
      setErro("O assunto deve ter no máximo 255 caracteres.");
      return;
    }

    if (payload.status_id === null) {
      setErro("Selecione um status para o template.");
      return;
    }

    setSalvando(true);

    try {
      if (editandoId !== null) {
        await atualizarMensagemTemplate(editandoId, payload);
        setSucesso("Template atualizado com sucesso.");
      } else {
        await cadastrarMensagemTemplate(payload);
        setSucesso("Template cadastrado com sucesso.");
      }

      setModalAberto(false);
      setFormulario(FORMULARIO_INICIAL);
      setEditandoId(null);
      await carregar();
    } catch (e) {
      setErro(extrairMensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(template: MensagemTemplate) {
    const acao = template.ativo ? "desativar" : "ativar";
    if (
      !window.confirm(`Deseja realmente ${acao} o template "${template.nome}"?`)
    )
      return;

    setErro("");
    setSucesso("");

    try {
      if (template.ativo) {
        await desativarMensagemTemplate(template.id_template);
      } else {
        await ativarMensagemTemplate(template.id_template);
      }

      setSucesso(
        `Template ${template.ativo ? "desativado" : "ativado"} com sucesso.`,
      );
      await carregar();
    } catch (e) {
      setErro(extrairMensagemErro(e));
    }
  }

  function abrirEnvioEmail(template: MensagemTemplate) {
    if (!template.ativo || template.canal.toLowerCase() !== "email") {
      setErro(
        "Somente templates ativos do canal de e-mail podem ser enviados.",
      );
      return;
    }

    const chaves = obterVariaveis(template.conteudo);
    setTemplateEnvio(template);
    setDestinatario("");
    setNomeDestinatario("");
    setVariaveisEnvio(Object.fromEntries(chaves.map((chave) => [chave, ""])));
    setErroEnvio("");
    setModalEnviarAberto(true);
  }

  function fecharEnvioEmail() {
    if (enviandoEmail) return;
    setModalEnviarAberto(false);
    setTemplateEnvio(null);
    setDestinatario("");
    setNomeDestinatario("");
    setVariaveisEnvio({});
    setErroEnvio("");
  }

  async function enviarEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErroEnvio("");

    if (!templateEnvio) {
      setErroEnvio("Selecione um template para enviar.");
      return;
    }

    const email = destinatario.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErroEnvio("Informe um endereço de e-mail válido.");
      return;
    }

    if (
      /\{\{nome\}\}/i.test(templateEnvio.conteudo) &&
      !nomeDestinatario.trim()
    ) {
      setErroEnvio("Informe o nome do destinatário.");
      return;
    }

    const variavelVazia = Object.entries(variaveisEnvio).find(
      ([, valor]) => !valor.trim(),
    );
    if (variavelVazia) {
      setErroEnvio(`Preencha a variável ${rotuloVariavel(variavelVazia[0])}.`);
      return;
    }

    setEnviandoEmail(true);

    try {
      const resposta = await conexao.post(
        ROTAS.MENSAGENS_TEMPLATES.ENVIAR_EMAIL,
        {
          dados: {
            codigo: templateEnvio.codigo,
            para: email,
            nome: nomeDestinatario.trim(),
            variaveis: variaveisEnvio,
          },
        },
      );

      if (resposta.data?.sucesso === false) {
        throw new Error(
          resposta.data?.mensagem || "Não foi possível enviar o e-mail.",
        );
      }

      setModalEnviarAberto(false);
      setTemplateEnvio(null);
      setDestinatario("");
      setNomeDestinatario("");
      setVariaveisEnvio({});
      setSucesso(resposta.data?.mensagem || "E-mail enviado com sucesso.");
    } catch (e) {
      setErroEnvio(extrairMensagemErro(e));
    } finally {
      setEnviandoEmail(false);
    }
  }

  async function abrirVisualizacao(template: MensagemTemplate) {
    setTemplateSelecionado(template);
    setVisualizacaoAberta(true);

    try {
      const atualizado = await buscarMensagemTemplatePorCodigo(template.codigo);
      setTemplateSelecionado(atualizado);
    } catch {
      // Mantém os dados da listagem se a consulta por código falhar.
    }
  }

  const variaveisDoTemplateEnvio = templateEnvio
    ? obterVariaveis(templateEnvio.conteudo)
    : [];

  return (
    <main className="email-page">
      <header className="email-header">
        <div>
          <div className="email-breadcrumb">
            <span className="email-breadcrumb__dot" />
            <Link href="/painel/configuracoes">CONFIGURAÇÕES</Link>
            <span>/</span>
            <strong>COMUNICAÇÃO</strong>
          </div>
          <h1>Templates de e-mail</h1>
          <p>
            Crie e mantenha os modelos de mensagens utilizados nas comunicações
            automáticas do Universo Império.
          </p>
        </div>
        <button
          className="email-button email-button--primary"
          onClick={abrirNovo}
        >
          <Icone nome="plus" /> Novo template
        </button>
      </header>

      <section className="email-stats" aria-label="Resumo dos templates">
        <article className="email-stat">
          <span>Total de templates</span>
          <strong>{contadores.total}</strong>
          <small>Modelos cadastrados</small>
        </article>
        <article className="email-stat">
          <span>Ativos</span>
          <strong>{contadores.ativos}</strong>
          <small>Disponíveis para utilização</small>
        </article>
        <article className="email-stat">
          <span>Inativos</span>
          <strong>{contadores.inativos}</strong>
          <small>Desativados temporariamente</small>
        </article>
      </section>

      {erro && (
        <div className="email-alert email-alert--error" role="alert">
          <span>{erro}</span>
          <button onClick={() => setErro("")} aria-label="Fechar mensagem">
            <Icone nome="x" />
          </button>
        </div>
      )}
      {sucesso && (
        <div className="email-alert email-alert--success" role="status">
          <span>{sucesso}</span>
          <button onClick={() => setSucesso("")} aria-label="Fechar mensagem">
            <Icone nome="x" />
          </button>
        </div>
      )}

      <section className="email-panel">
        <div className="email-panel__top">
          <div>
            <span className="email-eyebrow">BIBLIOTECA DE MENSAGENS</span>
            <h2>Modelos cadastrados</h2>
            <p>
              Gerencie assunto, conteúdo e disponibilidade de cada template.
            </p>
          </div>
          <button
            className="email-button email-button--secondary"
            onClick={() => void carregar()}
            disabled={carregando}
          >
            {carregando ? "Atualizando..." : "Atualizar lista"}
          </button>
        </div>

        <div className="email-toolbar">
          <label className="email-search">
            <Icone nome="search" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por nome, código ou assunto..."
            />
          </label>
          <div className="email-filters" aria-label="Filtrar templates">
            {(["todos", "ativos", "inativos"] as const).map((opcao) => (
              <button
                key={opcao}
                type="button"
                className={filtro === opcao ? "is-active" : ""}
                onClick={() => setFiltro(opcao)}
              >
                {opcao === "todos"
                  ? "Todos"
                  : opcao === "ativos"
                    ? "Ativos"
                    : "Inativos"}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <div className="email-empty">
            <span className="email-spinner" />
            Carregando templates...
          </div>
        ) : templatesFiltrados.length === 0 ? (
          <div className="email-empty">
            <span className="email-empty__icon">
              <Icone nome="mail" />
            </span>
            <strong>Nenhum template encontrado</strong>
            <p>
              {templates.length === 0
                ? "Cadastre o primeiro modelo de e-mail para começar."
                : "Tente alterar a busca ou o filtro selecionado."}
            </p>
            {templates.length === 0 && (
              <button
                className="email-button email-button--primary"
                onClick={abrirNovo}
              >
                <Icone nome="plus" /> Criar primeiro template
              </button>
            )}
          </div>
        ) : (
          <div className="email-table-wrap">
            <table className="email-table">
              <thead>
                <tr>
                  <th>Template</th>
                  <th>Código</th>
                  <th>Canal</th>
                  <th>Atualizado em</th>
                  <th>Status</th>
                  <th className="email-table__actions-heading">Ações</th>
                </tr>
              </thead>
              <tbody>
                {templatesFiltrados.map((template) => (
                  <tr key={template.id_template}>
                    <td>
                      <div className="email-template-name">
                        <span className="email-template-icon">
                          <Icone nome="mail" />
                        </span>
                        <div>
                          <strong>{template.nome}</strong>
                          <small>
                            {template.assunto || "Sem assunto definido"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code>{template.codigo}</code>
                    </td>
                    <td>
                      <span className="email-channel">{template.canal}</span>
                    </td>
                    <td>{formatarData(template.atualizado_em)}</td>
                    <td>
                      <span
                        className={`email-status ${template.ativo ? "email-status--active" : "email-status--inactive"}`}
                      >
                        {template.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="email-actions">
                        <button
                          title="Visualizar template"
                          aria-label={`Visualizar ${template.nome}`}
                          onClick={() => void abrirVisualizacao(template)}
                        >
                          <Icone nome="eye" />
                        </button>
                        {template.ativo &&
                          template.canal.toLowerCase() === "email" && (
                            <button
                              title="Enviar e-mail"
                              aria-label={`Enviar ${template.nome}`}
                              onClick={() => abrirEnvioEmail(template)}
                            >
                              <Icone nome="send" />
                            </button>
                          )}
                        <button
                          title="Editar template"
                          aria-label={`Editar ${template.nome}`}
                          onClick={() => void abrirEdicao(template.id_template)}
                        >
                          <Icone nome="edit" />
                        </button>
                        <button
                          title={
                            template.ativo
                              ? "Desativar template"
                              : "Ativar template"
                          }
                          aria-label={
                            template.ativo
                              ? `Desativar ${template.nome}`
                              : `Ativar ${template.nome}`
                          }
                          onClick={() => void alternarStatus(template)}
                        >
                          <Icone nome="power" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalAberto && (
        <div
          className="email-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fecharModalEdicao();
          }}
        >
          <section
            className="email-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-modal-title"
          >
            <header className="email-modal__header">
              <div>
                <span className="email-eyebrow">EDIÇÃO</span>
                <h2 id="email-modal-title">Editar template</h2>
              </div>
              <button
                type="button"
                className="email-icon-button"
                onClick={fecharModalEdicao}
                disabled={salvando}
                aria-label="Fechar"
              >
                <Icone nome="x" />
              </button>
            </header>
            <form onSubmit={salvar} className="email-form">
              <div className="email-form-grid">
                <label>
                  Código
                  <input
                    value={formulario.codigo}
                    onChange={(event) =>
                      setFormulario((atual) => ({
                        ...atual,
                        codigo: event.target.value.trim(),
                      }))
                    }
                    maxLength={80}
                    required
                    disabled={salvando || editandoId !== null}
                  />
                  <small>Identificador único utilizado pelo backend.</small>
                </label>
                <label>
                  Nome do template
                  <input
                    value={formulario.nome}
                    onChange={(event) =>
                      setFormulario((atual) => ({
                        ...atual,
                        nome: event.target.value,
                      }))
                    }
                    maxLength={140}
                    required
                    disabled={salvando}
                  />
                </label>
                <label>
                  Canal
                  <select
                    value={formulario.canal}
                    onChange={(event) =>
                      setFormulario((atual) => ({
                        ...atual,
                        canal: event.target.value,
                      }))
                    }
                    disabled={salvando}
                  >
                    <option value="email">E-mail</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                  </select>
                  <small>
                    O banco valida os valores permitidos pela coluna ENUM.
                  </small>
                </label>
                <label>
                  Status
                  <select
                    value={formulario.status_id ?? ""}
                    onChange={(event) =>
                      setFormulario((atual) => ({
                        ...atual,
                        status_id: event.target.value
                          ? Number(event.target.value)
                          : null,
                      }))
                    }
                    disabled={salvando || carregandoStatus}
                    required
                  >
                    <option value="">
                      {carregandoStatus
                        ? "Carregando status..."
                        : "Selecione um status"}
                    </option>
                    {statusDisponiveis.map((status) => (
                      <option key={status.id_status} value={status.id_status}>
                        {status.nome} ({status.codigo})
                      </option>
                    ))}
                  </select>
                  <small>
                    Opções carregadas do banco de dados (grupo GERAL).
                  </small>
                </label>
                <label className="email-form-grid__full">
                  Assunto do e-mail
                  <input
                    value={formulario.assunto ?? ""}
                    onChange={(event) =>
                      setFormulario((atual) => ({
                        ...atual,
                        assunto: event.target.value,
                      }))
                    }
                    placeholder="Seu pedido foi confirmado!"
                    maxLength={255}
                    disabled={salvando}
                  />
                </label>
                <label className="email-form-grid__full">
                  Conteúdo do template
                  <textarea
                    value={formulario.conteudo}
                    onChange={(event) =>
                      setFormulario((atual) => ({
                        ...atual,
                        conteudo: event.target.value,
                      }))
                    }
                    rows={13}
                    required
                    disabled={salvando}
                    spellCheck={false}
                  />
                  <small>
                    Informe um objeto JSON com titulo, mensagem e dados. Use{" "}
                    {"{{nome}}"} para personalizar.
                  </small>
                </label>
                <label className="email-checkbox">
                  <input
                    type="checkbox"
                    checked={formulario.ativo}
                    onChange={(event) =>
                      setFormulario((atual) => ({
                        ...atual,
                        ativo: event.target.checked,
                      }))
                    }
                    disabled={salvando}
                  />
                  Template ativo
                </label>
              </div>
              {erro && (
                <div className="email-alert email-alert--error" role="alert">
                  {erro}
                </div>
              )}
              <footer className="email-modal__footer">
                <button
                  type="button"
                  className="email-button email-button--secondary"
                  onClick={fecharModalEdicao}
                  disabled={salvando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="email-button email-button--primary"
                  disabled={
                    salvando ||
                    carregandoStatus ||
                    statusDisponiveis.length === 0
                  }
                >
                  <Icone nome="save" />
                  {salvando ? "Salvando..." : "Salvar template"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {modalEnviarAberto && templateEnvio && (
        <div
          className="email-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fecharEnvioEmail();
          }}
        >
          <section
            className="email-modal email-modal--send"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-send-title"
          >
            <header className="email-modal__header">
              <div>
                <span className="email-eyebrow">ENVIO MANUAL</span>
                <h2 id="email-send-title">Enviar e-mail</h2>
                <p>
                  Template: <strong>{templateEnvio.nome}</strong>
                </p>
              </div>
              <button
                type="button"
                className="email-icon-button"
                onClick={fecharEnvioEmail}
                disabled={enviandoEmail}
                aria-label="Fechar"
              >
                <Icone nome="x" />
              </button>
            </header>
            <form onSubmit={enviarEmail} className="email-form">
              <div className="email-form-grid">
                <label className="email-form-grid__full">
                  E-mail do destinatário
                  <input
                    type="email"
                    value={destinatario}
                    onChange={(event) => setDestinatario(event.target.value)}
                    placeholder="cliente@email.com"
                    maxLength={190}
                    autoComplete="email"
                    required
                    disabled={enviandoEmail}
                  />
                </label>
                <label className="email-form-grid__full">
                  Nome do destinatário
                  <input
                    value={nomeDestinatario}
                    onChange={(event) =>
                      setNomeDestinatario(event.target.value)
                    }
                    placeholder="Nome utilizado em {{nome}}"
                    maxLength={140}
                    required={/\{\{nome\}\}/i.test(templateEnvio.conteudo)}
                    disabled={enviandoEmail}
                  />
                </label>
                {variaveisDoTemplateEnvio.map((chave) => (
                  <label className="email-form-grid__full" key={chave}>
                    {rotuloVariavel(chave)}
                    <input
                      value={variaveisEnvio[chave] ?? ""}
                      onChange={(event) =>
                        setVariaveisEnvio((atual) => ({
                          ...atual,
                          [chave]: event.target.value,
                        }))
                      }
                      required
                      disabled={enviandoEmail}
                      placeholder={`Informe ${rotuloVariavel(chave).toLowerCase()}`}
                    />
                  </label>
                ))}
              </div>
              {erroEnvio && (
                <div className="email-alert email-alert--error" role="alert">
                  {erroEnvio}
                </div>
              )}
              <footer className="email-modal__footer">
                <button
                  type="button"
                  className="email-button email-button--secondary"
                  onClick={fecharEnvioEmail}
                  disabled={enviandoEmail}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="email-button email-button--primary"
                  disabled={enviandoEmail}
                >
                  <Icone nome="send" />
                  {enviandoEmail ? "Enviando..." : "Enviar e-mail"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {visualizacaoAberta && templateSelecionado && (
        <div
          className="email-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget)
              setVisualizacaoAberta(false);
          }}
        >
          <section
            className="email-modal email-modal--preview"
            role="dialog"
            aria-modal="true"
            aria-labelledby="email-preview-title"
          >
            <header className="email-modal__header">
              <div>
                <span className="email-eyebrow">PRÉ-VISUALIZAÇÃO</span>
                <h2 id="email-preview-title">{templateSelecionado.nome}</h2>
                <p>{templateSelecionado.assunto || "Sem assunto definido"}</p>
              </div>
              <button
                type="button"
                className="email-icon-button"
                onClick={() => setVisualizacaoAberta(false)}
                aria-label="Fechar"
              >
                <Icone nome="x" />
              </button>
            </header>
            <div className="email-preview-meta">
              <span>
                <strong>Código:</strong> {templateSelecionado.codigo}
              </span>
              <span>
                <strong>Canal:</strong> {templateSelecionado.canal}
              </span>
            </div>
            <iframe
              className="email-preview-frame"
              title="Pré-visualização do e-mail"
              sandbox=""
              srcDoc={gerarHtmlPreview(templateSelecionado)}
            />
            <footer className="email-modal__footer">
              <button
                className="email-button email-button--secondary"
                onClick={() => setVisualizacaoAberta(false)}
              >
                Fechar
              </button>
              <button
                className="email-button email-button--primary"
                onClick={() => {
                  setVisualizacaoAberta(false);
                  void abrirEdicao(templateSelecionado.id_template);
                }}
              >
                <Icone nome="edit" /> Editar template
              </button>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
 