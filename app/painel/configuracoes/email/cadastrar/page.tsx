"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";
import type { MensagemTemplatePayload } from "@/Services/Hooks/types/MensagemTemplate";

interface StatusOpcao {
  id_status: number;
  grupo: string;
  codigo: string;
  nome: string;
  ativo: boolean;
}

const INICIAL: MensagemTemplatePayload = {
  status_id: null,
  codigo: "",
  nome: "",
  canal: "email",
  assunto: "",
  conteudo: "",
  ativo: true,
};

function extrairListaStatus(resposta: unknown): StatusOpcao[] {
  const raiz = resposta as any;
  const possiveis = [
    raiz,
    raiz?.dados,
    raiz?.status,
    raiz?.dados?.status,
    raiz?.data,
    raiz?.data?.dados,
    raiz?.data?.status,
    raiz?.data?.dados?.status,
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

function mensagemErro(erro: unknown): string {
  const e = erro as {
    response?: { data?: { mensagem?: string; message?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.mensagem ||
    e?.response?.data?.message ||
    e?.message ||
    "Não foi possível cadastrar o template."
  );
}

function slugTemplate(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 55);
}

function gerarCodigo(nome: string): string {
  const slug = slugTemplate(nome);
  if (!slug) return "";
  const numero = String(Math.floor(Math.random() * 90) + 10);
  return `tem-${slug}-${numero}`;
}

export default function CadastrarMensagemTemplatePage() {
  const router = useRouter();
  const [formulario, setFormulario] =
    useState<MensagemTemplatePayload>(INICIAL);
  const [status, setStatus] = useState<StatusOpcao[]>([]);
  const [carregandoStatus, setCarregandoStatus] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [codigoEditadoManualmente, setCodigoEditadoManualmente] =
    useState(false);
  const [copiado, setCopiado] = useState(false);
  const [mensagemImportacao, setMensagemImportacao] = useState("");
  const [modoCadastro, setModoCadastro] = useState<"json" | "formulario">(
    "json",
  );
  const [jsonCompleto, setJsonCompleto] = useState("");
  const [quantidadeCatalogo, setQuantidadeCatalogo] = useState(0);
  const [tituloForm, setTituloForm] = useState("Olá, {{nome}}!");
  const [mensagemForm, setMensagemForm] = useState(
    "Sua solicitação foi atualizada.",
  );
  const [rodapeForm, setRodapeForm] = useState(
    "Obrigado por escolher o Universo Império.",
  );
  const [assinaturaForm, setAssinaturaForm] = useState(
    "Equipe Universo Império",
  );
  const [camposForm, setCamposForm] = useState<
    Array<{ id: number; chave: string; valor: string }>
  >([{ id: 1, chave: "numero_pedido", valor: "{{numero_pedido}}" }]);

  const jsonValido = useMemo(() => {
    if (!formulario.conteudo.trim()) return false;
    try {
      const valor = JSON.parse(formulario.conteudo);
      return (
        valor !== null && typeof valor === "object" && !Array.isArray(valor)
      );
    } catch {
      return false;
    }
  }, [formulario.conteudo]);

  const atualizarConteudo = useCallback((conteudo: string) => {
    setFormulario((atual) => ({ ...atual, conteudo }));
    setMensagemImportacao("");
  }, []);

  useEffect(() => {
    let cancelado = false;

    async function carregarStatus() {
      try {
        const resposta = await conexao.get(
          ROTAS.PERMISSOES.STATUS.LISTAR_POR_GRUPO("GERAL"),
        );
        if (!cancelado) {
          const opcoes = extrairListaStatus(resposta.data);
          setStatus(opcoes);
          const ativo = opcoes.find(
            (item) => item.codigo.toUpperCase() === "ATIVO",
          );
          if (ativo) {
            setFormulario((atual) => ({
              ...atual,
              status_id: atual.status_id ?? ativo.id_status,
            }));
          }
        }
      } catch (e) {
        if (!cancelado) setErro(mensagemErro(e));
      } finally {
        if (!cancelado) setCarregandoStatus(false);
      }
    }

    void carregarStatus();
    return () => {
      cancelado = true;
    };
  }, []);

  function alterarNome(nome: string) {
    setFormulario((atual) => ({
      ...atual,
      nome,
      codigo: codigoEditadoManualmente ? atual.codigo : gerarCodigo(nome),
    }));
  }

  function gerarNovoCodigo() {
    setCodigoEditadoManualmente(false);
    setFormulario((atual) => ({ ...atual, codigo: gerarCodigo(atual.nome) }));
  }

  function formatarJson() {
    try {
      const objeto = JSON.parse(formulario.conteudo);
      atualizarConteudo(JSON.stringify(objeto, null, 2));
      setErro("");
    } catch {
      setErro(
        "O conteúdo não é um JSON válido. Confira a estrutura antes de formatar.",
      );
    }
  }

  function inserirModeloJson() {
    const modelo = {
      titulo: "Olá, {{nome}}!",
      mensagem: "Sua solicitação foi atualizada.",
      dados: {
        numero_pedido: "{{numero_pedido}}",
      },
    };
    atualizarConteudo(JSON.stringify(modelo, null, 2));
    setErro("");
  }

  /**
   * Importa um arquivo JSON.
   *
   * Aceita dois formatos:
   * 1. JSON completo, com "identificacao" e "conteudo", preenchendo as seções 01 e 02.
   * 2. JSON simples, preenchendo somente o editor da seção 02.
   */
  async function importarArquivoJson(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const arquivo = input.files?.[0];

    if (!arquivo) return;

    setErro("");
    setMensagemImportacao("");

    try {
      if (!arquivo.name.toLowerCase().endsWith(".json")) {
        throw new Error("Selecione um arquivo com extensão .json.");
      }

      const texto = await arquivo.text();
      const raiz = JSON.parse(texto);

      if (raiz === null || typeof raiz !== "object" || Array.isArray(raiz)) {
        throw new Error("O arquivo precisa conter um objeto JSON.");
      }

      const possuiEnvelope =
        Object.prototype.hasOwnProperty.call(raiz, "identificacao") ||
        Object.prototype.hasOwnProperty.call(raiz, "conteudo");

      const identificacao = possuiEnvelope ? (raiz.identificacao ?? {}) : raiz;

      let conteudoImportado = possuiEnvelope
        ? raiz.conteudo
        : Object.prototype.hasOwnProperty.call(raiz, "conteudo")
          ? raiz.conteudo
          : undefined;

      // Se não houver envelope nem campos de identificação,
      // considera o próprio arquivo como conteúdo do template.
      const possuiDadosIdentificacao = [
        "nome",
        "codigo",
        "canal",
        "status_id",
        "assunto",
        "ativo",
      ].some((chave) => Object.prototype.hasOwnProperty.call(raiz, chave));

      if (!possuiEnvelope && !possuiDadosIdentificacao) {
        conteudoImportado = raiz;
      }

      if (typeof conteudoImportado === "string") {
        conteudoImportado = JSON.parse(conteudoImportado);
      }

      if (
        conteudoImportado !== undefined &&
        (conteudoImportado === null ||
          typeof conteudoImportado !== "object" ||
          Array.isArray(conteudoImportado))
      ) {
        throw new Error('O campo "conteudo" precisa ser um objeto JSON.');
      }

      if (
        possuiEnvelope &&
        (!raiz.conteudo || typeof raiz.conteudo !== "object") &&
        typeof raiz.conteudo !== "string"
      ) {
        throw new Error('O JSON completo precisa possuir o campo "conteudo".');
      }

      const nome =
        typeof identificacao.nome === "string" ? identificacao.nome : undefined;

      const codigo =
        typeof identificacao.codigo === "string"
          ? identificacao.codigo
          : undefined;

      const statusId = Number(identificacao.status_id);

      setFormulario((atual) => ({
        ...atual,
        ...(nome !== undefined ? { nome } : {}),
        ...(codigo !== undefined
          ? { codigo }
          : nome
            ? { codigo: gerarCodigo(nome) }
            : {}),
        canal: "email",
        ...(typeof identificacao.assunto === "string"
          ? { assunto: identificacao.assunto }
          : {}),
        ...(Number.isInteger(statusId) && statusId > 0
          ? { status_id: statusId }
          : {}),
        ...(typeof identificacao.ativo === "boolean"
          ? { ativo: identificacao.ativo }
          : {}),
        ...(conteudoImportado !== undefined
          ? {
              conteudo: JSON.stringify(conteudoImportado, null, 2),
            }
          : {}),
      }));

      setMensagemImportacao(
        possuiEnvelope
          ? "JSON importado: identificação e conteúdo foram preenchidos."
          : "JSON importado para o editor de conteúdo.",
      );
    } catch (erroImportacao) {
      setErro(
        erroImportacao instanceof Error
          ? erroImportacao.message
          : "Não foi possível importar o arquivo JSON.",
      );
    } finally {
      // Permite selecionar novamente o mesmo arquivo.
      input.value = "";
    }
  }

  function montarConteudoFormulario() {
    const dados: Record<string, string> = {};
    camposForm.forEach((campo) => {
      const chave = campo.chave.trim();
      if (chave) dados[chave] = campo.valor;
    });
    return {
      titulo: tituloForm,
      mensagem: mensagemForm,
      dados,
      rodape: { mensagem: rodapeForm, assinatura: assinaturaForm },
    };
  }

  function montarEnvelope() {
    return {
      identificacao: {
        nome: formulario.nome,
        codigo: formulario.codigo,
        canal: formulario.canal,
        status_id: formulario.status_id,
        assunto: formulario.assunto ?? "",
        ativo: formulario.ativo,
      },
      conteudo: montarConteudoFormulario(),
    };
  }

  function trocarParaJson() {
    if (modoCadastro === "json") return;
    setJsonCompleto(JSON.stringify(montarEnvelope(), null, 2));
    setModoCadastro("json");
    setErro("");
  }

  function trocarParaFormulario() {
    if (modoCadastro === "formulario") return;
    try {
      const envelope = JSON.parse(
        jsonCompleto || JSON.stringify(montarEnvelope()),
      );
      if (
        !envelope.identificacao ||
        !envelope.conteudo ||
        typeof envelope.conteudo !== "object" ||
        Array.isArray(envelope.conteudo)
      ) {
        throw new Error(
          'O JSON precisa conter "identificacao" e "conteudo" como objetos.',
        );
      }
      const ident = envelope.identificacao;
      const conteudo = envelope.conteudo;
      setFormulario((atual) => ({
        ...atual,
        nome: String(ident.nome ?? ""),
        codigo: String(ident.codigo ?? ""),
        canal: String(ident.canal ?? "email"),
        status_id:
          Number(ident.status_id) > 0
            ? Number(ident.status_id)
            : atual.status_id,
        assunto: String(ident.assunto ?? ""),
        ativo: typeof ident.ativo === "boolean" ? ident.ativo : true,
        conteudo: JSON.stringify(conteudo, null, 2),
      }));
      setTituloForm(String(conteudo.titulo ?? ""));
      setMensagemForm(String(conteudo.mensagem ?? ""));
      setRodapeForm(String(conteudo.rodape?.mensagem ?? ""));
      setAssinaturaForm(String(conteudo.rodape?.assinatura ?? ""));
      const dados =
        conteudo.dados && typeof conteudo.dados === "object"
          ? conteudo.dados
          : {};
      setCamposForm(
        Object.entries(dados).map(([chave, valor], index) => ({
          id: index + 1,
          chave,
          valor: String(valor ?? ""),
        })),
      );
      setModoCadastro("formulario");
      setErro("");
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não foi possível converter o JSON.",
      );
    }
  }

  async function importarJsonCompleto(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    try {
      if (!arquivo.name.toLowerCase().endsWith(".json")) {
        throw new Error("Selecione um arquivo com extensão .json.");
      }

      const objeto = JSON.parse(await arquivo.text());
      if (!objeto || typeof objeto !== "object" || Array.isArray(objeto)) {
        throw new Error("O arquivo precisa conter um objeto JSON.");
      }

      // Catálogo: { descricao, templates: [{ identificacao, conteudo }, ...] }
      if (Array.isArray(objeto.templates)) {
        if (objeto.templates.length === 0) {
          throw new Error(
            'O catálogo possui a propriedade "templates", mas está vazio.',
          );
        }

        objeto.templates.forEach((item: any, indice: number) => {
          if (!item?.identificacao || typeof item.identificacao !== "object") {
            throw new Error(
              `Template ${indice + 1}: falta o objeto "identificacao".`,
            );
          }
          if (
            !item?.conteudo ||
            typeof item.conteudo !== "object" ||
            Array.isArray(item.conteudo)
          ) {
            throw new Error(
              `Template ${indice + 1}: o campo "conteudo" precisa ser um objeto.`,
            );
          }
          if (!String(item.identificacao.nome ?? "").trim()) {
            throw new Error(
              `Template ${indice + 1}: informe o nome na identificação.`,
            );
          }
        });

        setQuantidadeCatalogo(objeto.templates.length);
        setJsonCompleto(JSON.stringify(objeto, null, 2));
        setMensagemImportacao(
          `Catálogo importado: ${objeto.templates.length} templates encontrados. Ao salvar, cada um será cadastrado individualmente.`,
        );
        setErro("");
        return;
      }

      // Template individual: { identificacao, conteudo }
      if (!objeto.identificacao || typeof objeto.identificacao !== "object") {
        throw new Error(
          'JSON não reconhecido. Use um template individual com "identificacao" e "conteudo", ou um catálogo com "templates".',
        );
      }
      if (
        !objeto.conteudo ||
        typeof objeto.conteudo !== "object" ||
        Array.isArray(objeto.conteudo)
      ) {
        throw new Error(
          'O template individual precisa conter "conteudo" como objeto.',
        );
      }
      if (!String(objeto.identificacao.nome ?? "").trim()) {
        throw new Error('Informe "identificacao.nome" no JSON.');
      }

      setQuantidadeCatalogo(0);
      setJsonCompleto(JSON.stringify(objeto, null, 2));
      setMensagemImportacao(
        `Template individual "${objeto.identificacao.nome}" importado. Será cadastrado apenas um template.`,
      );
      setErro("");
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Não foi possível importar o arquivo JSON.",
      );
      setMensagemImportacao("");
      setQuantidadeCatalogo(0);
    } finally {
      input.value = "";
    }
  }

  function adicionarCampoFormulario() {
    setCamposForm((atuais) => [
      ...atuais,
      {
        id: Date.now() + Math.random(),
        chave: "",
        valor: "",
      },
    ]);
  }

  async function copiarConteudo() {
    try {
      await navigator.clipboard.writeText(formulario.conteudo);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      setErro("Não foi possível copiar o conteúdo automaticamente.");
    }
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    const statusAtivo =
      status.find((item) => item.codigo.toUpperCase() === "ATIVO") ?? status[0];

    const enviarTemplate = async (item: any): Promise<void> => {
      const identificacao = item.identificacao ?? {};
      const conteudo = item.conteudo;

      if (!String(identificacao.nome ?? "").trim()) {
        throw new Error("Existe um template sem nome na identificação.");
      }
      if (
        !conteudo ||
        typeof conteudo !== "object" ||
        Array.isArray(conteudo)
      ) {
        throw new Error(
          `O conteúdo do template "${identificacao.nome}" é inválido.`,
        );
      }

      const statusInformado = Number(identificacao.status_id);
      const statusId =
        Number.isInteger(statusInformado) && statusInformado > 0
          ? statusInformado
          : (statusAtivo?.id_status ?? formulario.status_id);

      if (!statusId) {
        throw new Error(
          `Não foi encontrado um status válido para "${identificacao.nome}". Verifique o grupo GERAL.`,
        );
      }

      const nome = String(identificacao.nome).trim();
      const codigo =
        String(identificacao.codigo ?? "").trim() || gerarCodigo(nome);
      const payload: MensagemTemplatePayload = {
        status_id: statusId,
        codigo,
        nome,
        canal: String(identificacao.canal ?? "email").trim() || "email",
        assunto: String(identificacao.assunto ?? "").trim() || null,
        conteudo: JSON.stringify(conteudo),
        ativo:
          typeof identificacao.ativo === "boolean" ? identificacao.ativo : true,
      };

      await conexao.post(
        ROTAS.MENSAGENS_TEMPLATES.CADASTRAR,
        { dados: payload },
        { headers: { "Content-Type": "application/json" } },
      );
    };

    if (modoCadastro === "json") {
      let raiz: any;
      try {
        raiz = JSON.parse(jsonCompleto);
      } catch {
        setErro(
          "O JSON informado é inválido. Corrija a estrutura antes de cadastrar.",
        );
        return;
      }

      // Importação em lote pelo catálogo: envia cada template individualmente à mesma rota.
      if (Array.isArray(raiz?.templates)) {
        const itens = raiz.templates;
        if (!itens.length) {
          setErro('O catálogo não possui itens na propriedade "templates".');
          return;
        }

        setSalvando(true);
        let cadastrados = 0;
        const falhas: string[] = [];
        try {
          for (let i = 0; i < itens.length; i++) {
            const item = itens[i];
            const nome = String(
              item?.identificacao?.nome ?? `Template ${i + 1}`,
            );
            try {
              await enviarTemplate(item);
              cadastrados++;
            } catch (e) {
              falhas.push(`${nome}: ${mensagemErro(e)}`);
            }
          }

          if (falhas.length) {
            setMensagemImportacao(
              `${cadastrados} de ${itens.length} templates cadastrados. Os itens com erro não foram concluídos.`,
            );
            setErro(`Falhas no catálogo:\n${falhas.join("\n")}`);
          } else {
            setMensagemImportacao(
              `Sucesso! ${cadastrados} templates foram cadastrados individualmente.`,
            );
            router.push("/painel/configuracoes/email");
            router.refresh();
          }
        } finally {
          setSalvando(false);
        }
        return;
      }

      // Cadastro individual.
      if (
        !raiz?.identificacao ||
        !raiz?.conteudo ||
        typeof raiz.conteudo !== "object" ||
        Array.isArray(raiz.conteudo)
      ) {
        setErro(
          'O JSON precisa ser um template individual com "identificacao" e "conteudo", ou um catálogo com "templates".',
        );
        return;
      }

      setSalvando(true);
      try {
        await enviarTemplate(raiz);
        router.push("/painel/configuracoes/email");
        router.refresh();
      } catch (e) {
        setErro(mensagemErro(e));
      } finally {
        setSalvando(false);
      }
      return;
    }

    // Cadastro pelo formulário visual.
    const dadosBase = {
      ...formulario,
      conteudo: JSON.stringify(montarConteudoFormulario()),
    };
    const payload: MensagemTemplatePayload = {
      ...dadosBase,
      codigo: dadosBase.codigo.trim(),
      nome: dadosBase.nome.trim(),
      canal: dadosBase.canal.trim(),
      assunto: dadosBase.assunto?.trim() || null,
    };

    if (!payload.codigo || !payload.nome || !payload.conteudo.trim()) {
      setErro("Preencha o código, o nome e o conteúdo do template.");
      return;
    }
    if (!payload.status_id) {
      setErro("Selecione um status cadastrado no banco de dados.");
      return;
    }

    setSalvando(true);
    try {
      await conexao.post(
        ROTAS.MENSAGENS_TEMPLATES.CADASTRAR,
        { dados: payload },
        { headers: { "Content-Type": "application/json" } },
      );
      router.push("/painel/configuracoes/email");
      router.refresh();
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="template-page">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="page-header">
        <div className="breadcrumb">
          <span className="breadcrumb-dot" />
          <Link href="/painel/configuracoes">CONFIGURAÇÕES</Link>
          <span className="breadcrumb-separator">/</span>
          <Link href="/painel/configuracoes/email">TEMPLATES</Link>
          <span className="breadcrumb-separator">/</span>
          <strong> NOVO TEMPLATE</strong>
        </div>

        <div className="header-content">
          <div>
            <span className="overline">CENTRAL DE COMUNICAÇÃO</span>
            <h1>Criar template</h1>
            <p>
              Configure uma mensagem reutilizável para as comunicações
              automáticas do Universo Império.
            </p>
          </div>
          <div className="header-mark" aria-hidden="true">
            <span>UI</span>
            <i />
          </div>
        </div>
      </header>

      {erro && (
        <div className="alert-error" role="alert">
          <span className="alert-icon">!</span>
          <span>{erro}</span>
          <button
            type="button"
            onClick={() => setErro("")}
            aria-label="Fechar aviso"
          >
            ×
          </button>
        </div>
      )}

      <div className="mode-switch">
        <div className="mode-switch-copy">
          <strong>Como deseja cadastrar o template?</strong>
          <small>
            Escolha entre um JSON completo ou o preenchimento por formulário.
          </small>
        </div>
        <div className="mode-buttons">
          <button
            type="button"
            className={modoCadastro === "json" ? "selected" : ""}
            onClick={trocarParaJson}
            disabled={salvando}
          >
            {"{ }"} Cadastro por JSON
          </button>
          <button
            type="button"
            className={modoCadastro === "formulario" ? "selected" : ""}
            onClick={trocarParaFormulario}
            disabled={salvando}
          >
            ☷ Cadastro por formulário
          </button>
        </div>
      </div>

      <form className="template-layout" onSubmit={salvar}>
        <div className="main-column">
          {modoCadastro === "formulario" && (
            <section className="panel">
              <div className="panel-heading">
                <div className="heading-icon">01</div>
                <div>
                  <span className="section-kicker">IDENTIFICAÇÃO</span>
                  <h2>Informações principais</h2>
                  <p>Defina como o template será identificado pelo sistema.</p>
                </div>
              </div>

              <div className="fields-grid">
                <label className="field field-wide">
                  <span className="field-label">
                    Nome do template <b>*</b>
                  </span>
                  <input
                    value={formulario.nome}
                    onChange={(event) => alterarNome(event.target.value)}
                    placeholder="Ex.: Pedido confirmado"
                    maxLength={140}
                    required
                    disabled={salvando}
                  />
                  <small>
                    O código é sugerido automaticamente conforme você digita.
                  </small>
                </label>

                <label className="field">
                  <span className="field-label">
                    Código interno <b>*</b>
                  </span>
                  <div className="input-action">
                    <input
                      value={formulario.codigo}
                      onChange={(event) => {
                        setCodigoEditadoManualmente(true);
                        setFormulario((atual) => ({
                          ...atual,
                          codigo: event.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, ""),
                        }));
                      }}
                      placeholder="tem-pedido-confirmado-42"
                      maxLength={80}
                      required
                      disabled={salvando}
                    />
                    <button
                      type="button"
                      className="icon-button"
                      onClick={gerarNovoCodigo}
                      title="Gerar outro código"
                      aria-label="Gerar outro código"
                      disabled={salvando || !formulario.nome.trim()}
                    >
                      ↻
                    </button>
                  </div>
                  <small>
                    Formato: tem-nome-do-template-00. O número é aleatório.
                  </small>
                </label>

                <label className="field">
                  <span className="field-label">Canal</span>
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
                  </select>
                </label>

                <label className="field">
                  <span className="field-label">
                    Status <b>*</b>
                  </span>
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
                    {status.map((item) => (
                      <option key={item.id_status} value={item.id_status}>
                        {item.nome} ({item.codigo})
                      </option>
                    ))}
                  </select>
                  <small>Opções carregadas do grupo GERAL.</small>
                </label>

                <label className="field">
                  <span className="field-label">Assunto do e-mail</span>
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
              </div>
            </section>
          )}

          {modoCadastro === "json" ? (
            <section className="panel editor-panel">
              <div className="panel-heading editor-heading">
                <div className="heading-icon">{"{ }"}</div>
                <div>
                  <span className="section-kicker">JSON COMPLETO</span>
                  <h2>Identificação + conteúdo</h2>
                  <p>Cadastre as seções 01 e 02 em um único arquivo JSON.</p>
                </div>
              </div>
              <div className="editor-toolbar">
                <div className="json-mode-label">
                  <span className="format-symbol">{"{ }"}</span>
                  <strong>EDITOR JSON COMPLETO</strong>
                  <small>identificacao + conteudo</small>
                </div>
                <div className="editor-actions">
                  <label
                    htmlFor="arquivo-template-json-completo"
                    className="json-file-button"
                  >
                    ⇧ Selecionar JSON
                  </label>
                  <input
                    id="arquivo-template-json-completo"
                    type="file"
                    accept=".json,application/json"
                    onChange={importarJsonCompleto}
                    disabled={salvando}
                    className="json-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        setJsonCompleto(
                          JSON.stringify(JSON.parse(jsonCompleto), null, 2),
                        );
                        setErro("");
                      } catch {
                        setErro("O JSON completo é inválido.");
                      }
                    }}
                    disabled={salvando || !jsonCompleto.trim()}
                  >
                    ↕ Formatar JSON
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(jsonCompleto);
                        setCopiado(true);
                        window.setTimeout(() => setCopiado(false), 1800);
                      } catch {
                        setErro("Não foi possível copiar o JSON.");
                      }
                    }}
                    disabled={!jsonCompleto}
                  >
                    {copiado ? "✓ Copiado" : "Copiar"}
                  </button>
                </div>
              </div>
              {mensagemImportacao && (
                <div className="import-success" role="status">
                  ✓ {mensagemImportacao}
                </div>
              )}
              <div className="editor-meta">
                <span>
                  <i className="status-indicator" /> JSON COMPLETO
                </span>
                <span>{jsonCompleto.length} caracteres</span>
              </div>
              <textarea
                className="code-editor"
                value={jsonCompleto}
                onChange={(event) => setJsonCompleto(event.target.value)}
                placeholder={
                  '{\\n  "identificacao": {\\n    "nome": "Pedido confirmado",\\n    "codigo": "tem-pedido-confirmado-31",\\n    "canal": "email",\\n    "status_id": 1,\\n    "assunto": "Pedido {{numero_pedido}} confirmado",\\n    "ativo": true\\n  },\\n  "conteudo": {\\n    "titulo": "Olá, {{nome}}!",\\n    "mensagem": "Seu pedido foi confirmado."\\n  }\\n}'
                }
                spellCheck={false}
                rows={24}
                required
                disabled={salvando}
                aria-label="JSON completo do template"
              />
              <div className="editor-footer">
                <span className="editor-help">
                  Aceita template individual (<code>identificacao</code> +{" "}
                  <code>conteudo</code>) ou catálogo (<code>templates</code> com
                  vários itens).
                </span>
                <span
                  className={
                    jsonCompleto.trim()
                      ? "validation valid"
                      : "validation invalid"
                  }
                >
                  {jsonCompleto.trim()
                    ? "JSON para validação no cadastro"
                    : "JSON não preenchido"}
                </span>
              </div>
            </section>
          ) : (
            <section className="panel editor-panel">
              <div className="panel-heading editor-heading">
                <div className="heading-icon">02</div>
                <div>
                  <span className="section-kicker">FORMULÁRIO DE CONTEÚDO</span>
                  <h2>Monte sua mensagem</h2>
                  <p>
                    Preencha os campos e adicione quantas variáveis dinâmicas
                    precisar.
                  </p>
                </div>
              </div>
              <div className="fields-grid">
                <label className="field field-wide">
                  <span className="field-label">Título da mensagem</span>
                  <input
                    value={tituloForm}
                    onChange={(e) => setTituloForm(e.target.value)}
                    placeholder="Olá, {{nome}}!"
                    disabled={salvando}
                  />
                </label>
                <label className="field field-wide">
                  <span className="field-label">Mensagem</span>
                  <textarea
                    className="form-message-input"
                    value={mensagemForm}
                    onChange={(e) => setMensagemForm(e.target.value)}
                    rows={4}
                    disabled={salvando}
                  />
                </label>
              </div>
              <div className="dynamic-fields-heading">
                <div>
                  <strong>Dados dinâmicos</strong>
                  <small>Ex.: numero_pedido → {"{{numero_pedido}}"}</small>
                </div>
                <button
                  type="button"
                  className="add-field-button"
                  onClick={adicionarCampoFormulario}
                  disabled={salvando}
                >
                  ＋ Adicionar campo
                </button>
              </div>
              {camposForm.map((campo) => (
                <div className="dynamic-field-row" key={campo.id}>
                  <label className="field">
                    <span className="field-label">Nome da variável</span>
                    <input
                      value={campo.chave}
                      onChange={(e) =>
                        setCamposForm((atuais) =>
                          atuais.map((item) =>
                            item.id === campo.id
                              ? {
                                  ...item,
                                  chave: e.target.value.replace(
                                    /[^a-zA-Z0-9_]/g,
                                    "_",
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                      placeholder="numero_pedido"
                      disabled={salvando}
                    />
                  </label>
                  <label className="field">
                    <span className="field-label">Valor / marcador</span>
                    <input
                      value={campo.valor}
                      onChange={(e) =>
                        setCamposForm((atuais) =>
                          atuais.map((item) =>
                            item.id === campo.id
                              ? { ...item, valor: e.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="{{numero_pedido}}"
                      disabled={salvando}
                    />
                  </label>
                  <button
                    type="button"
                    className="remove-field-button"
                    onClick={() =>
                      setCamposForm((atuais) =>
                        atuais.filter((item) => item.id !== campo.id),
                      )
                    }
                    disabled={salvando}
                    aria-label="Remover campo"
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="fields-grid footer-fields">
                <label className="field field-wide">
                  <span className="field-label">Texto do rodapé</span>
                  <input
                    value={rodapeForm}
                    onChange={(e) => setRodapeForm(e.target.value)}
                    disabled={salvando}
                  />
                </label>
                <label className="field field-wide">
                  <span className="field-label">Assinatura</span>
                  <input
                    value={assinaturaForm}
                    onChange={(e) => setAssinaturaForm(e.target.value)}
                    disabled={salvando}
                  />
                </label>
              </div>
              <div className="form-json-preview">
                <strong>Prévia do conteúdo que será salvo</strong>
                <pre>{JSON.stringify(montarConteudoFormulario(), null, 2)}</pre>
              </div>
            </section>
          )}

          <section className="panel settings-panel">
            <div className="panel-heading compact-heading">
              <div className="heading-icon">03</div>
              <div>
                <span className="section-kicker">PUBLICAÇÃO</span>
                <h2>Disponibilidade</h2>
                <p>
                  Controle se este template poderá ser utilizado pelo sistema.
                </p>
              </div>
            </div>
            <label className="toggle-row">
              <span className="toggle-copy">
                <strong>Manter template ativo</strong>
                <small>
                  Templates ativos ficam disponíveis para os processos de envio.
                </small>
              </span>
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
              <span className="toggle-ui" />
            </label>
          </section>

          <footer className="form-footer">
            <Link
              href="/painel/configuracoes/email"
              className="button button-secondary"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="button button-primary"
              disabled={salvando || carregandoStatus || status.length === 0}
            >
              {salvando
                ? quantidadeCatalogo > 0
                  ? "Cadastrando catálogo..."
                  : "Salvando template..."
                : quantidadeCatalogo > 0
                  ? `Cadastrar ${quantidadeCatalogo} templates`
                  : "Salvar template"}
              {!salvando && <span aria-hidden="true">→</span>}
            </button>
          </footer>
        </div>

        <aside className="side-column">
          <div className="side-card identity-card">
            <span className="side-kicker">RESUMO DO TEMPLATE</span>
            <div className="preview-icon">✉</div>
            <h3>{formulario.nome.trim() || "Novo template"}</h3>
            <p>{formulario.assunto || "Sem assunto definido"}</p>
            <div className="summary-divider" />
            <div className="summary-line">
              <span>Canal</span>
              <strong>E-mail</strong>
            </div>
            <div className="summary-line">
              <span>Formato</span>
              <strong>
                {modoCadastro === "json" ? "JSON completo" : "Formulário"}
              </strong>
            </div>
            <div className="summary-line">
              <span>Status</span>
              <strong
                className={formulario.ativo ? "active-label" : "inactive-label"}
              >
                {formulario.ativo ? "Ativo" : "Inativo"}
              </strong>
            </div>
          </div>

          <div className="side-card guidance-card">
            <span className="guidance-icon">✦</span>
            <h3>Dica para um bom template</h3>
            <p>
              Mantenha o conteúdo claro, utilize variáveis para personalizar a
              mensagem e teste o formato antes de cadastrar.
            </p>
          </div>

          <div className="side-note">
            <span>ⓘ</span>
            <p>
              O código interno identifica o template nas integrações e rotinas
              do backend.
            </p>
          </div>
        </aside>
      </form>

      <style jsx>{`
        .mode-switch {
          max-width: 1240px;
          margin: 0 auto 16px;
          padding: 15px 18px;
          border: 1px solid #44313f;
          border-radius: 12px;
          background: linear-gradient(
            145deg,
            rgba(42, 30, 42, 0.97),
            rgba(29, 22, 31, 0.98)
          );
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .mode-switch-copy {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .mode-switch-copy strong {
          color: #fff5fa;
          font-size: 12px;
        }
        .mode-switch-copy small {
          color: #a997a5;
          font-size: 10px;
        }
        .mode-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .mode-buttons button,
        .add-field-button {
          border: 1px solid #68445a;
          border-radius: 7px;
          padding: 9px 12px;
          color: #e8c5d7;
          background: #2b222e;
          font-size: 10px;
          font-weight: 750;
          cursor: pointer;
        }
        .mode-buttons button.selected,
        .add-field-button {
          color: #fff8fc;
          background: linear-gradient(135deg, #bd7198, #914b70);
          border-color: #d48caf;
        }
        .json-file-button {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border: 1px solid #79516a;
          border-radius: 6px;
          color: #f0c4d8;
          background: #402d3d;
          font-size: 9px;
          font-weight: 750;
          cursor: pointer;
        }
        .json-file-input {
          display: none;
        }
        .editor-help {
          color: #a997a5;
          font-size: 9px;
          line-height: 1.6;
        }
        .editor-help code {
          color: #f0b6d0;
        }
        .import-success {
          margin: 10px 0;
          padding: 9px 11px;
          border: 1px solid #397b5a;
          border-radius: 7px;
          color: #a9e5bf;
          background: #173b2c;
          font-size: 9px;
        }
        .form-message-input {
          width: 100%;
          box-sizing: border-box;
          padding: 11px 12px;
          border: 1px solid #594354;
          border-radius: 7px;
          outline: none;
          color: #f7edf3;
          background: #19141c;
          font: inherit;
          font-size: 11px;
          resize: vertical;
        }
        .dynamic-fields-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 22px 0 12px;
          padding-bottom: 11px;
          border-bottom: 1px solid #493746;
        }
        .dynamic-fields-heading div {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .dynamic-fields-heading strong {
          color: #eadce5;
          font-size: 11px;
        }
        .dynamic-fields-heading small {
          color: #a997a5;
          font-size: 9px;
        }
        .dynamic-field-row {
          display: grid;
          grid-template-columns: 1fr 1fr 34px;
          align-items: end;
          gap: 10px;
          margin-bottom: 12px;
        }
        .remove-field-button {
          width: 34px;
          height: 40px;
          border: 1px solid #8b4d60;
          border-radius: 7px;
          color: #ffc5d0;
          background: #482630;
          font-size: 20px;
          cursor: pointer;
        }
        .footer-fields {
          margin-top: 20px;
        }
        .form-json-preview {
          margin-top: 20px;
          padding: 12px;
          border: 1px solid #493746;
          border-radius: 8px;
          background: #151118;
        }
        .form-json-preview strong {
          color: #d9a6bf;
          font-size: 10px;
        }
        .form-json-preview pre {
          max-height: 230px;
          overflow: auto;
          color: #eadde6;
          font:
            10px/1.7 ui-monospace,
            monospace;
          white-space: pre-wrap;
        }
        .template-page {
          position: relative;
          isolation: isolate;
          min-height: 100%;
          overflow: hidden;
          padding: 30px clamp(16px, 4vw, 48px) 54px;
          color: #f7edf2;
          box-sizing: border-box;
          background: #171219;
        }
        .ambient {
          position: absolute;
          z-index: -1;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.12;
          pointer-events: none;
        }
        .ambient-one {
          top: -230px;
          right: 8%;
          background: #c66b98;
        }
        .ambient-two {
          top: 520px;
          left: -300px;
          background: #9c5879;
        }
        .page-header {
          max-width: 1240px;
          margin: 0 auto 27px;
        }
        .breadcrumb {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          margin-bottom: 22px;
          color: #d69ab7;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.25px;
        }
        .breadcrumb a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s;
        }
        .breadcrumb a:hover {
          color: #fff;
        }
        .breadcrumb strong {
          color: #f2d6e4;
        }
        .breadcrumb-separator {
          color: #725465;
        }
        .breadcrumb-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #d78caf;
          box-shadow: 0 0 13px #d78caf88;
        }
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        .overline,
        .section-kicker,
        .side-kicker {
          color: #d18aaa;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1.5px;
        }
        h1 {
          margin: 8px 0 7px;
          color: #fff8fb;
          font-size: clamp(29px, 3vw, 38px);
          line-height: 1.1;
          letter-spacing: -1.5px;
        }
        .header-content p {
          max-width: 620px;
          margin: 0;
          color: #ad9ca8;
          font-size: 12px;
          line-height: 1.7;
        }
        .header-mark {
          position: relative;
          display: grid;
          place-items: center;
          flex: 0 0 62px;
          width: 62px;
          height: 62px;
          border: 1px solid #75465f;
          border-radius: 19px;
          color: #f1c5d9;
          background: linear-gradient(145deg, #392432, #211923);
          box-shadow: 0 12px 35px #0003;
        }
        .header-mark span {
          font-family: Georgia, serif;
          font-size: 23px;
          font-weight: 700;
        }
        .header-mark i {
          position: absolute;
          right: 9px;
          bottom: 9px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #d98fb3;
        }
        .template-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 260px;
          align-items: start;
          gap: 19px;
          max-width: 1240px;
          margin: 0 auto;
        }
        .main-column {
          display: grid;
          gap: 17px;
          min-width: 0;
        }
        .panel,
        .side-card {
          border: 1px solid #44313f;
          border-radius: 13px;
          background: linear-gradient(
            145deg,
            rgba(42, 30, 42, 0.97),
            rgba(29, 22, 31, 0.98)
          );
          box-shadow: 0 14px 38px #00000018;
        }
        .panel {
          padding: 23px 24px;
        }
        .panel-heading {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding-bottom: 19px;
          margin-bottom: 19px;
          border-bottom: 1px solid #493746;
        }
        .heading-icon {
          display: grid;
          place-items: center;
          flex: 0 0 34px;
          height: 34px;
          border: 1px solid #68445a;
          border-radius: 9px;
          color: #e5a8c5;
          background: #382637;
          font-size: 10px;
          font-weight: 850;
        }
        .panel-heading h2 {
          margin: 5px 0 4px;
          color: #fff5fa;
          font-size: 17px;
          letter-spacing: -0.35px;
        }
        .panel-heading p {
          margin: 0;
          color: #a997a5;
          font-size: 10px;
          line-height: 1.6;
        }
        .fields-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 17px 15px;
        }
        .field {
          display: flex;
          flex-direction: column;
          min-width: 0;
          gap: 7px;
        }
        .field-wide {
          grid-column: 1 / -1;
        }
        .field-label {
          color: #e8dce5;
          font-size: 10px;
          font-weight: 750;
        }
        .field-label b {
          color: #e6a0bf;
        }
        .field input,
        .field select {
          width: 100%;
          min-width: 0;
          height: 41px;
          box-sizing: border-box;
          padding: 0 12px;
          border: 1px solid #594354;
          border-radius: 7px;
          outline: none;
          color: #f7edf3;
          background: #19141c;
          font: inherit;
          font-size: 11px;
          transition:
            border-color 0.2s,
            box-shadow 0.2s;
        }
        .field input::placeholder {
          color: #786978;
        }
        .field input:focus,
        .field select:focus {
          border-color: #c77da4;
          box-shadow: 0 0 0 3px #bd67951c;
        }
        .field small {
          color: #958493;
          font-size: 9px;
          line-height: 1.5;
          font-weight: 400;
        }
        .input-action {
          display: flex;
          gap: 7px;
        }
        .input-action input {
          flex: 1;
        }
        .icon-button {
          width: 41px;
          flex: 0 0 41px;
          border: 1px solid #68445a;
          border-radius: 7px;
          color: #f0c4d8;
          background: #382637;
          font-size: 21px;
          cursor: pointer;
        }
        .icon-button:hover:not(:disabled) {
          background: #513349;
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .editor-panel {
          padding-bottom: 19px;
        }
        .editor-heading {
          margin-bottom: 16px;
        }
        .editor-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 13px;
        }
        .json-mode-label {
          display: flex;
          align-items: center;
          gap: 9px;
          color: #d4a0b8;
        }
        .json-mode-label strong {
          font-size: 9px;
          letter-spacing: 0.8px;
        }
        .json-mode-label small {
          color: #958493;
          font-size: 9px;
        }
        .format-symbol {
          color: #e8a7c4;
          font-family: monospace;
          font-size: 13px;
        }
        .editor-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 13px;
        }
        .json-file-input {
          display: none;
        }
        .json-file-button {
          display: inline-flex;
          align-items: center;
          padding: 5px 9px;
          border: 1px solid #79516a;
          border-radius: 6px;
          color: #f0c4d8;
          background: #402d3d;
          font-size: 9px;
          font-weight: 750;
          cursor: pointer;
          transition:
            background 0.2s,
            color 0.2s;
        }
        .json-file-button:hover {
          color: #fff;
          background: #594052;
        }
        .json-file-button.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }
        .import-success {
          margin: 0 0 10px;
          padding: 9px 11px;
          border: 1px solid #426b54;
          border-radius: 7px;
          color: #a9dfba;
          background: #203629;
          font-size: 9px;
          line-height: 1.5;
        }
        .editor-actions button {
          padding: 5px 0;
          border: 0;
          color: #d6a1ba;
          background: transparent;
          font-size: 9px;
          font-weight: 750;
          cursor: pointer;
        }
        .editor-actions button:hover {
          color: #fff;
        }
        .editor-meta {
          display: flex;
          justify-content: space-between;
          padding: 9px 12px;
          border: 1px solid #493746;
          border-bottom: 0;
          border-radius: 8px 8px 0 0;
          color: #968493;
          background: #211a24;
          font-size: 8px;
          letter-spacing: 0.7px;
        }
        .editor-meta > span:first-child {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #d4a0b8;
          font-weight: 800;
        }
        .status-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #8fc9a4;
          box-shadow: 0 0 7px #8fc9a477;
        }
        .code-editor {
          display: block;
          width: 100%;
          min-height: 310px;
          box-sizing: border-box;
          resize: vertical;
          padding: 16px;
          border: 1px solid #493746;
          border-radius: 0 0 8px 8px;
          outline: none;
          color: #eadde6;
          background: #151118;
          font:
            11px/1.8 ui-monospace,
            SFMono-Regular,
            Menlo,
            monospace;
          tab-size: 2;
          white-space: pre;
          transition:
            border-color 0.2s,
            box-shadow 0.2s;
        }
        .code-editor:focus {
          border-color: #bd789c;
          box-shadow: 0 0 0 3px #bd67951c;
        }
        .code-editor::placeholder {
          color: #766777;
        }
        .editor-footer {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding-top: 9px;
          color: #988796;
          font-size: 9px;
        }
        .validation {
          font-weight: 800;
        }
        .validation.valid {
          color: #8ec8a4;
        }
        .validation.invalid {
          color: #e6a0a9;
        }
        .variables-tip {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-top: 17px;
          padding: 12px;
          border: 1px solid #594052;
          border-radius: 8px;
          background: #302332;
        }
        .tip-icon {
          display: grid;
          place-items: center;
          flex: 0 0 30px;
          height: 30px;
          border-radius: 8px;
          color: #e7b1ca;
          background: #4a3044;
          font-family: monospace;
        }
        .variables-tip strong {
          color: #ead9e3;
          font-size: 9px;
        }
        .variables-tip p {
          margin: 4px 0 0;
          color: #aa98a6;
          font-size: 9px;
          line-height: 1.5;
        }
        .variables-tip code {
          color: #f0b6d0;
          font-size: 9px;
        }
        .variables-tip button {
          margin-left: auto;
          padding: 7px 9px;
          border: 1px solid #79516a;
          border-radius: 6px;
          color: #f0c4d8;
          background: #402d3d;
          font-size: 8px;
          font-weight: 750;
          cursor: pointer;
          white-space: nowrap;
        }
        .compact-heading {
          padding-bottom: 15px;
          margin-bottom: 14px;
        }
        .toggle-row {
          position: relative;
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
        }
        .toggle-copy {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 4px;
        }
        .toggle-copy strong {
          color: #eadde6;
          font-size: 10px;
        }
        .toggle-copy small {
          color: #9e8d9b;
          font-size: 9px;
          line-height: 1.5;
        }
        .toggle-row input {
          position: absolute;
          right: 0;
          width: 38px;
          height: 22px;
          opacity: 0;
          cursor: pointer;
        }
        .toggle-ui {
          position: relative;
          width: 38px;
          height: 22px;
          flex: 0 0 38px;
          border-radius: 30px;
          background: #514351;
          transition: background 0.2s;
        }
        .toggle-ui::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #e7dce5;
          transition: transform 0.2s;
        }
        .toggle-row input:checked + .toggle-ui {
          background: #a85e84;
        }
        .toggle-row input:checked + .toggle-ui::after {
          transform: translateX(16px);
          background: #fff;
        }
        .toggle-row input:focus-visible + .toggle-ui {
          outline: 2px solid #e7a8c5;
          outline-offset: 3px;
        }
        .form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 3px;
        }
        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-height: 42px;
          padding: 0 17px;
          border-radius: 7px;
          font-size: 10px;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
          transition:
            transform 0.2s,
            background 0.2s;
        }
        .button:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .button-primary {
          border: 1px solid #d48caf;
          color: #fff8fc;
          background: linear-gradient(135deg, #bd7198, #914b70);
          box-shadow: 0 7px 18px #a6537b2b;
        }
        .button-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #cf83a8, #a75b81);
        }
        .button-secondary {
          border: 1px solid #594354;
          color: #e5d7e1;
          background: #2b222e;
        }
        .side-column {
          display: grid;
          gap: 13px;
        }
        .side-card {
          padding: 17px;
        }
        .side-kicker {
          font-size: 8px;
        }
        .preview-icon {
          display: grid;
          place-items: center;
          width: 39px;
          height: 39px;
          margin: 17px 0 11px;
          border: 1px solid #77506a;
          border-radius: 11px;
          color: #edb5ce;
          background: #402c3e;
          font-size: 17px;
        }
        .identity-card h3 {
          margin: 0 0 5px;
          color: #fff4fa;
          font-size: 14px;
          overflow-wrap: anywhere;
        }
        .identity-card > p {
          margin: 0;
          color: #a995a4;
          font-size: 9px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }
        .summary-divider {
          height: 1px;
          margin: 15px 0 12px;
          background: #493746;
        }
        .summary-line {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          margin-top: 10px;
          color: #a996a5;
          font-size: 9px;
        }
        .summary-line strong {
          color: #eadde6;
          font-weight: 750;
        }
        .summary-line .active-label {
          color: #91cba7;
        }
        .summary-line .inactive-label {
          color: #d8a2a9;
        }
        .guidance-card {
          background: linear-gradient(145deg, #382738, #28202c);
        }
        .guidance-icon {
          color: #e6a8c4;
          font-size: 18px;
        }
        .guidance-card h3 {
          margin: 9px 0 6px;
          color: #f5e7ef;
          font-size: 11px;
        }
        .guidance-card p {
          margin: 0;
          color: #b6a2b1;
          font-size: 9px;
          line-height: 1.7;
        }
        .side-note {
          display: flex;
          gap: 9px;
          padding: 12px;
          border: 1px solid #493746;
          border-radius: 9px;
          color: #d5a0b9;
          background: #211a24;
        }
        .side-note span {
          font-size: 12px;
        }
        .side-note p {
          margin: 0;
          color: #a895a4;
          font-size: 9px;
          line-height: 1.6;
        }
        .alert-error {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          max-width: 1240px;
          box-sizing: border-box;
          padding: 12px 14px;
          margin: 0 auto 15px;
          border: 1px solid #9b5368;
          border-radius: 8px;
          color: #ffd5dc;
          background: #482630;
          font-size: 10px;
          line-height: 1.6;
        }
        .alert-icon {
          display: grid;
          place-items: center;
          flex: 0 0 17px;
          height: 17px;
          border-radius: 50%;
          color: #49232e;
          background: #f0a6b8;
          font-weight: 900;
        }
        .alert-error button {
          margin-left: auto;
          border: 0;
          color: #ffd5dc;
          background: transparent;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
        }
        @media (max-width: 900px) {
          .template-layout {
            grid-template-columns: minmax(0, 1fr) 220px;
          }
          .panel {
            padding: 19px;
          }
        }
        @media (max-width: 720px) {
          .mode-switch {
            align-items: flex-start;
            flex-direction: column;
          }
          .dynamic-field-row {
            grid-template-columns: 1fr;
          }
          .remove-field-button {
            width: 100%;
          }
          .template-page {
            padding: 22px 14px 36px;
          }
          .template-layout {
            grid-template-columns: 1fr;
          }
          .side-column {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .side-note {
            grid-column: 1 / -1;
          }
          .header-mark {
            display: none;
          }
        }
        @media (max-width: 520px) {
          .fields-grid {
            grid-template-columns: 1fr;
          }
          .field-wide {
            grid-column: auto;
          }
          .panel {
            padding: 16px;
          }
          .editor-toolbar {
            align-items: flex-start;
            flex-direction: column;
          }
          .variables-tip {
            align-items: flex-start;
            flex-wrap: wrap;
          }
          .variables-tip button {
            margin-left: 41px;
          }
          .side-column {
            grid-template-columns: 1fr;
          }
          .form-footer {
            flex-direction: column-reverse;
          }
          .form-footer .button {
            width: 100%;
            box-sizing: border-box;
          }
          .editor-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
