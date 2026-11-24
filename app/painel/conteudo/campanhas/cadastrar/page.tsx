"use client";

import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronRight,
  Image as ImageIcon,
  LoaderCircle,
  Megaphone,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import conexao from "@/Services/Conexao/Conexao";
import ROTAS from "@/app/constants/rotas";

type StatusCatalogo = {
  id_status: number;
  grupo?: string;
  codigo?: string;
  nome: string;
  ativo?: boolean | number | string;
};

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

function extrairArray<T>(payload: any, chaveLista: string): T[] {
  const raiz = obterCorpoResposta(payload);
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

function validarResposta(resposta: any): void {
  const payload = obterCorpoResposta(resposta);

  if (
    payload?.sucesso === false ||
    payload?.dados?.sucesso === false ||
    (typeof payload?.status === "number" && payload.status >= 400) ||
    (typeof resposta?.status === "number" && resposta.status >= 400)
  ) {
    throw new Error(
      payload?.mensagem ||
        payload?.dados?.mensagem ||
        payload?.erro ||
        "A operação não foi concluída.",
    );
  }
}

function erroApi(error: any, padrao: string): string {
  return (
    error?.response?.data?.mensagem ||
    error?.response?.data?.erro ||
    error?.response?.data?.message ||
    error?.message ||
    padrao
  );
}

function gerarSlug(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function converterDataParaApi(valor: string): string | null {
  if (!valor) return null;
  // datetime-local fornece YYYY-MM-DDTHH:mm; o backend recebe formato SQL.
  return valor.replace("T", " ") + ":00";
}

export default function CadastrarCampanhaPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditado, setSlugEditado] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState("");
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [inicioEm, setInicioEm] = useState("");
  const [terminaEm, setTerminaEm] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [statusId, setStatusId] = useState("");
  const [statusDisponiveis, setStatusDisponiveis] = useState<StatusCatalogo[]>(
    [],
  );
  const [carregandoStatus, setCarregandoStatus] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  useEffect(() => {
    let montado = true;

    async function carregarStatus() {
      try {
        setCarregandoStatus(true);
        const resposta = await conexao.get(
          ROTAS.PERMISSOES.STATUS.LISTAR_POR_GRUPO("GERAL"),
          { withCredentials: true },
        );

        validarResposta(obterCorpoResposta(resposta));
        const lista = extrairArray<StatusCatalogo>(resposta, "status");

        if (!montado) return;

        const ativos = lista.filter(
          (item) =>
            item.ativo === undefined ||
            item.ativo === true ||
            item.ativo === 1 ||
            String(item.ativo).toLowerCase() === "true" ||
            String(item.ativo) === "1",
        );

        setStatusDisponiveis(ativos);

        const statusPadrao = ativos.find((item) =>
          ["ATIVO", "ATIVA"].includes(String(item.codigo ?? "").toUpperCase()),
        );

        if (statusPadrao) setStatusId(String(statusPadrao.id_status));
        else if (ativos.length > 0) setStatusId(String(ativos[0].id_status));
      } catch {
        // O status pode ser informado manualmente caso o catálogo não esteja disponível.
        if (montado) setStatusDisponiveis([]);
      } finally {
        if (montado) setCarregandoStatus(false);
      }
    }

    void carregarStatus();

    return () => {
      montado = false;
    };
  }, []);

  useEffect(() => {
    if (!sucesso) return;
    const temporizador = window.setTimeout(() => setSucesso(""), 4000);
    return () => window.clearTimeout(temporizador);
  }, [sucesso]);

  useEffect(() => {
    if (!arquivoImagem) {
      setPreviewImagem("");
      return;
    }
    const url = URL.createObjectURL(arquivoImagem);
    setPreviewImagem(url);
    return () => URL.revokeObjectURL(url);
  }, [arquivoImagem]);

  function selecionarImagem(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      setErro("Selecione um arquivo de imagem válido.");
      evento.target.value = "";
      return;
    }
    if (arquivo.size > 5 * 1024 * 1024) {
      setErro("A imagem deve ter no máximo 5 MB.");
      evento.target.value = "";
      return;
    }
    setErro("");
    setArquivoImagem(arquivo);
  }

  function alterarNome(valor: string) {
    setNome(valor);
    if (!slugEditado) setSlug(gerarSlug(valor));
  }

  async function cadastrarCampanha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setSucesso("");

    const nomeLimpo = nome.trim();
    const slugLimpo = gerarSlug(slug);

    if (!nomeLimpo) {
      setErro("Informe o nome da campanha.");
      return;
    }

    if (!slugLimpo) {
      setErro("Informe um slug válido para a campanha.");
      return;
    }

    if (
      !statusId ||
      !Number.isInteger(Number(statusId)) ||
      Number(statusId) <= 0
    ) {
      setErro("Selecione ou informe um status válido para a campanha.");
      return;
    }

    if (
      inicioEm &&
      terminaEm &&
      new Date(inicioEm).getTime() > new Date(terminaEm).getTime()
    ) {
      setErro("A data de término não pode ser anterior à data de início.");
      return;
    }

    try {
      setSalvando(true);
      if (!arquivoImagem) {
        setErro("Selecione uma foto para a campanha.");
        return;
      }

      let imagemFinal: string | null = null;

      // Envia o arquivo selecionado usando o endpoint de upload de banners.
      // O backend deve retornar o caminho da imagem para gravar em imagem_url.
      {
        setEnviandoImagem(true);
        const formularioImagem = new FormData();
        formularioImagem.append("imagem", arquivoImagem, arquivoImagem.name);
        const respostaUpload = await conexao.post(
          ROTAS.CAMPANHAS.PAINEL.UPLOAD,
          formularioImagem,
          {
            withCredentials: true,
            // A instância conexao pode ter application/json como padrão.
            // Para este POST, informe multipart/form-data para o Axios
            // reconhecer o FormData e enviar o arquivo no campo "imagem".
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );
        validarResposta(obterCorpoResposta(respostaUpload));
        const dadosUpload = obterCorpoResposta(respostaUpload);
        const fila: any[] = [dadosUpload];
        const vistos = new Set<any>();
        while (fila.length && !imagemFinal) {
          const atual = fila.shift();
          if (!atual || typeof atual !== "object" || vistos.has(atual))
            continue;
          vistos.add(atual);
          imagemFinal =
            atual.imagem_url ||
            atual.url ||
            atual.caminho ||
            atual.path ||
            atual.arquivo ||
            atual.nome_arquivo ||
            null;
          if (!imagemFinal)
            fila.push(atual.dados, atual.data, atual.resultado, atual.payload);
        }
        if (!imagemFinal)
          throw new Error(
            "A imagem foi enviada, mas a API não retornou o caminho do arquivo. Verifique o formato da resposta do endpoint de upload.",
          );
      }

      const payload = {
        status_id: Number(statusId),
        nome: nomeLimpo,
        slug: slugLimpo,
        descricao: descricao.trim() || null,
        imagem_url: imagemFinal,
        inicio_em: converterDataParaApi(inicioEm),
        termina_em: converterDataParaApi(terminaEm),
        ativo,
      };

      const resposta = await conexao.post(
        ROTAS.CAMPANHAS.PAINEL.CADASTRAR,
        payload,
        { withCredentials: true },
      );

      validarResposta(obterCorpoResposta(resposta));
      setSucesso("Campanha cadastrada com sucesso.");

      window.setTimeout(() => {
        router.push(ROTAS.PAGINAS.PAINEL.CAMPANHAS.LISTAR);
      }, 700);
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível cadastrar a campanha."));
    } finally {
      setSalvando(false);
      setEnviandoImagem(false);
    }
  }

  return (
    <main className="campanha-form-page">
      <header className="pagina-topo">
        <div>
          <div className="breadcrumb">
            <a href="/painel">Painel</a>
            <ChevronRight size={13} />
            <a href={ROTAS.PAGINAS.PAINEL.CAMPANHAS.LISTAR}>Conteúdo</a>
            <ChevronRight size={13} />
            <a href={ROTAS.PAGINAS.PAINEL.CAMPANHAS.LISTAR}>Campanhas</a>
            <ChevronRight size={13} />
            <span>Cadastrar</span>
          </div>

          <div className="titulo-principal">
            <div className="titulo-icone">
              <Megaphone size={23} />
            </div>
            <div>
              <h1>Nova campanha</h1>
              <p>Cadastre uma campanha promocional para sua loja.</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="botao-voltar"
          onClick={() => router.push(ROTAS.PAGINAS.PAINEL.CAMPANHAS.LISTAR)}
        >
          <ArrowLeft size={16} /> Voltar para campanhas
        </button>
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

      <form className="formulario-campanha" onSubmit={cadastrarCampanha}>
        <div className="formulario-colunas">
          <div className="coluna-principal">
            <section className="form-card">
              <div className="form-card-topo">
                <div className="form-card-icone">
                  <Megaphone size={18} />
                </div>
                <div>
                  <h2>Informações da campanha</h2>
                  <p>Defina o nome, endereço e apresentação da promoção.</p>
                </div>
              </div>

              <div className="campos">
                <label className="campo campo-largo">
                  <span>
                    Nome da campanha <b>*</b>
                  </span>
                  <input
                    value={nome}
                    onChange={(evento) => alterarNome(evento.target.value)}
                    placeholder="Ex.: Semana de ofertas"
                    maxLength={150}
                    required
                  />
                </label>

                <label className="campo campo-largo">
                  <span>
                    Slug / endereço da campanha <b>*</b>
                  </span>
                  <input
                    value={slug}
                    onChange={(evento) => {
                      setSlug(evento.target.value);
                      setSlugEditado(true);
                    }}
                    onBlur={() => setSlug(gerarSlug(slug))}
                    placeholder="semana-de-ofertas"
                    maxLength={180}
                    required
                  />
                  <small>
                    Endereço amigável: /campanhas/
                    {gerarSlug(slug) || "nome-da-campanha"}
                  </small>
                </label>

                <label className="campo campo-largo">
                  <span>Descrição</span>
                  <textarea
                    value={descricao}
                    onChange={(evento) => setDescricao(evento.target.value)}
                    placeholder="Descreva a campanha e as condições da promoção..."
                    rows={4}
                  />
                  <small>
                    Texto opcional para apresentar a campanha aos clientes.
                  </small>
                </label>
              </div>
            </section>
          </div>

          <aside className="coluna-imagem">
            <section className="form-card card-imagem">
              <div className="form-card-topo">
                <div className="form-card-icone">
                  <ImageIcon size={18} />
                </div>
                <div>
                  <h2>Foto da campanha</h2>
                  <p>
                    Selecione uma foto para representar esta promoção. A imagem
                    será enviada ao servidor.
                  </p>
                </div>
              </div>

              <label className="seletor-imagem" htmlFor="foto-campanha">
                {previewImagem ? (
                  <img src={previewImagem} alt="Prévia da imagem da campanha" />
                ) : (
                  <span className="placeholder-imagem">
                    <ImageIcon size={38} />
                    <strong>Adicione uma foto</strong>
                    <small>JPG, PNG, WEBP ou GIF</small>
                  </span>
                )}
                <span className="selo-upload">
                  <Upload size={14} /> Escolher foto
                </span>
              </label>
              <input
                id="foto-campanha"
                className="input-arquivo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={selecionarImagem}
                aria-required="true"
              />
              {arquivoImagem && (
                <div className="arquivo-selecionado">
                  <span>
                    <strong>{arquivoImagem.name}</strong>
                    <small>
                      {(arquivoImagem.size / 1024 / 1024).toFixed(2)} MB
                    </small>
                  </span>
                  <button
                    type="button"
                    onClick={() => setArquivoImagem(null)}
                    aria-label="Remover foto"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
              <small className="dica-imagem">
                Obrigatório: JPG, PNG, WEBP ou GIF, com até 5 MB. A foto será
                enviada ao servidor ao cadastrar.
              </small>
            </section>
          </aside>
        </div>

        <section className="form-card">
          <div className="form-card-topo">
            <div className="form-card-icone">
              <CalendarClock size={18} />
            </div>
            <div>
              <h2>Período e publicação</h2>
              <p>Configure quando a campanha estará disponível.</p>
            </div>
          </div>

          <div className="campos campos-duplos">
            <label className="campo">
              <span>Início da campanha</span>
              <input
                type="datetime-local"
                value={inicioEm}
                onChange={(evento) => setInicioEm(evento.target.value)}
              />
            </label>

            <label className="campo">
              <span>Término da campanha</span>
              <input
                type="datetime-local"
                value={terminaEm}
                onChange={(evento) => setTerminaEm(evento.target.value)}
                min={inicioEm || undefined}
              />
            </label>

            <label className="campo">
              <span>
                Status cadastral <b>*</b>
              </span>
              {statusDisponiveis.length > 0 ? (
                <select
                  value={statusId}
                  onChange={(evento) => setStatusId(evento.target.value)}
                  required
                >
                  <option value="">Selecione um status</option>
                  {statusDisponiveis.map((status) => (
                    <option key={status.id_status} value={status.id_status}>
                      {status.nome}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min="1"
                  value={statusId}
                  onChange={(evento) => setStatusId(evento.target.value)}
                  placeholder={
                    carregandoStatus
                      ? "Carregando status..."
                      : "Informe o ID do status"
                  }
                  required
                />
              )}
              <small>
                {carregandoStatus
                  ? "Consultando catálogo de status..."
                  : "Status obtido do catálogo geral, quando disponível."}
              </small>
            </label>

            <div className="campo campo-publicacao">
              <span>Publicação</span>
              <label className="switch-linha">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(evento) => setAtivo(evento.target.checked)}
                />
                <span className="switch-visual" />
                <span>
                  <strong>
                    {ativo ? "Campanha ativa" : "Campanha inativa"}
                  </strong>
                  <small>
                    {ativo
                      ? "A campanha poderá ser exibida conforme o período."
                      : "A campanha ficará desativada."}
                  </small>
                </span>
              </label>
            </div>
          </div>
        </section>

        <div className="acoes-formulario">
          <button
            type="button"
            className="botao-voltar"
            onClick={() => router.push(ROTAS.PAGINAS.PAINEL.CAMPANHAS.LISTAR)}
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="botao-primario"
            disabled={salvando || carregandoStatus}
          >
            {salvando ? (
              <LoaderCircle size={17} className="girando" />
            ) : (
              <Save size={17} />
            )}
            {enviandoImagem
              ? "Enviando foto..."
              : salvando
                ? "Salvando..."
                : "Cadastrar campanha"}
          </button>
        </div>
      </form>

      <style jsx>{estilos}</style>
    </main>
  );
}

const estilos = `
.campanha-form-page{width:100%;max-width:1120px;margin:0 auto;padding:26px clamp(14px,2.5vw,30px) 42px;color:#f5edf1;font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif;box-sizing:border-box}
.campanha-form-page *{box-sizing:border-box}
.campanha-form-page button{font:inherit;cursor:pointer}
.pagina-topo{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;margin-bottom:22px}
.breadcrumb{display:flex;align-items:center;gap:8px;margin-bottom:13px;color:#8e7c87;font-size:11px;flex-wrap:wrap}.breadcrumb a{color:#a8949e;text-decoration:none}.breadcrumb a:hover{color:#e9a1ba}
.titulo-principal{display:flex;align-items:center;gap:12px}.titulo-icone{width:46px;height:46px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid #684153;border-radius:12px;background:linear-gradient(135deg,#50303e,#30202a);color:#eda8c0}
.titulo-principal h1{margin:0 0 5px;color:#f8eff3;font-size:clamp(20px,2vw,26px);font-weight:750;letter-spacing:-.7px}.titulo-principal p{margin:0;color:#a894a0;font-size:12px}
.botao-voltar{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:39px;padding:9px 13px;border:1px solid #493440;border-radius:9px;background:#211a20;color:#cdbac5;font-size:10px;font-weight:650}.botao-voltar:hover{border-color:#936078;color:#f0b2c8}.botao-voltar:disabled{opacity:.5;cursor:not-allowed}
.botao-primario{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:10px 16px;border:1px solid #bd7894;border-radius:9px;background:linear-gradient(135deg,#a85f7b,#87445f);color:#fff;font-size:11px;font-weight:750;box-shadow:0 5px 16px #9b557526;transition:.2s}.botao-primario:hover{filter:brightness(1.12);transform:translateY(-1px)}.botao-primario:disabled{opacity:.6;cursor:not-allowed}
.mensagem{display:flex;align-items:center;gap:10px;padding:12px 14px;margin-bottom:14px;border:1px solid;border-radius:9px;font-size:11px}.mensagem span{flex:1}.mensagem button{display:flex;border:0;background:transparent;color:inherit}.mensagem-erro{background:#351c25;border-color:#75404f;color:#f2aabd}.mensagem-sucesso{background:#192b22;border-color:#365b46;color:#a8dfbd}
.formulario-campanha{display:flex;flex-direction:column;gap:15px}.form-card{padding:21px;border:1px solid #3f2b36;border-radius:13px;background:radial-gradient(circle at top right,rgba(126,65,91,.055),transparent 38%),#1c171b;box-shadow:0 8px 24px #0002}
.form-card-topo{display:flex;align-items:center;gap:11px;padding-bottom:16px;margin-bottom:18px;border-bottom:1px solid #392832}.form-card-icone{width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:1px solid #694153;border-radius:9px;background:#392630;color:#e9a1ba}.form-card-topo h2{margin:0 0 4px;color:#f1e7ec;font-size:13px}.form-card-topo p{margin:0;color:#94818d;font-size:10px}
.campos{display:grid;grid-template-columns:1fr;gap:16px}.campos-duplos{grid-template-columns:repeat(2,minmax(0,1fr))}.campo{display:flex;flex-direction:column;gap:7px;min-width:0}.campo-largo{grid-column:1/-1}.campo>span{color:#d8c7d0;font-size:10px;font-weight:700}.campo>span b{color:#e99ab6}.campo input,.campo textarea,.campo select{width:100%;min-height:40px;padding:10px 12px;border:1px solid #493440;border-radius:8px;outline:0;background:#151115;color:#f1e9ed;font:inherit;font-size:11px;transition:border-color .2s}.campo textarea{min-height:100px;resize:vertical;line-height:1.5}.campo input:focus,.campo textarea:focus,.campo select:focus{border-color:#a96b85;box-shadow:0 0 0 3px #a96b8518}.campo input::placeholder,.campo textarea::placeholder{color:#74636d}.campo small{color:#887681;font-size:9px;line-height:1.45}.campo-publicacao{justify-content:flex-start}
.switch-linha{display:flex;align-items:center;gap:11px;min-height:58px;padding:10px 12px;border:1px solid #493440;border-radius:8px;background:#171216;cursor:pointer}.switch-linha input{position:absolute;width:1px;height:1px;opacity:0}.switch-visual{position:relative;width:34px;height:19px;flex-shrink:0;border-radius:20px;background:#594650;transition:.2s}.switch-visual:after{content:"";position:absolute;top:3px;left:3px;width:13px;height:13px;border-radius:50%;background:#c8b4bf;transition:.2s}.switch-linha input:checked+.switch-visual{background:#a85f7b}.switch-linha input:checked+.switch-visual:after{left:18px;background:#fff}.switch-linha input:focus-visible+.switch-visual{outline:2px solid #e9a1ba;outline-offset:3px}.switch-linha>span:last-child{display:flex;flex-direction:column;gap:4px}.switch-linha strong{color:#e9dce3;font-size:10px}.switch-linha small{color:#887681;font-size:9px}
.acoes-formulario{display:flex;justify-content:flex-end;gap:9px;padding-top:4px}
.girando{animation:girar 1s linear infinite}@keyframes girar{to{transform:rotate(360deg)}}
.formulario-colunas{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:15px;align-items:start}.coluna-principal{min-width:0;display:flex;flex-direction:column;gap:15px}.coluna-imagem{min-width:0;position:sticky;top:18px}.card-imagem{padding:18px}.seletor-imagem{position:relative;display:flex;align-items:center;justify-content:center;width:100%;aspect-ratio:4/5;max-height:420px;overflow:hidden;border:1px dashed #765064;border-radius:12px;background:linear-gradient(145deg,#211820,#151115);cursor:pointer}.seletor-imagem>img{width:100%;height:100%;object-fit:cover}.placeholder-imagem{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#b78ca0}.placeholder-imagem strong{font-size:12px;color:#e4d4dc}.placeholder-imagem small{font-size:10px;color:#8e7b86}.selo-upload{position:absolute;right:10px;bottom:10px;display:flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #d28ba7;border-radius:8px;background:#9b5575;color:#fff;font-size:10px;font-weight:750;box-shadow:0 4px 14px #0005}.input-arquivo{display:none}.arquivo-selecionado{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:10px;padding:9px 10px;border:1px solid #493440;border-radius:8px;background:#171216}.arquivo-selecionado>span{display:flex;flex-direction:column;gap:3px;min-width:0}.arquivo-selecionado strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#e8d9e1;font-size:10px}.arquivo-selecionado small,.dica-imagem{color:#8f7b87;font-size:9px}.arquivo-selecionado button{display:flex;padding:7px;border:0;border-radius:7px;background:#39202a;color:#e9a1ba}.dica-imagem{display:block;margin-top:12px;line-height:1.5}
@media(max-width:900px){.formulario-colunas{grid-template-columns:minmax(0,1fr) 280px}}
@media(max-width:720px){.formulario-colunas{grid-template-columns:1fr}.coluna-imagem{position:static;grid-row:1}.seletor-imagem{aspect-ratio:16/9;max-height:300px}.pagina-topo{align-items:flex-start;flex-direction:column}.pagina-topo>.botao-voltar{align-self:flex-end}.form-card{padding:16px}.campos-duplos{grid-template-columns:1fr}}
@media(max-width:480px){.campanha-form-page{padding:18px 12px 28px}.titulo-principal h1{font-size:19px}.titulo-principal p{font-size:10px}.acoes-formulario{flex-direction:column-reverse}.acoes-formulario button{width:100%}}
`;
