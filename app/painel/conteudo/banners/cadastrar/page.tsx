"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  FileImage,
  Image as ImageIcon,
  ImagePlus,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";

import conexao from "@/Services/Conexao/Conexao";
import ImagemService from "@/Services/Imagem/ImagemService";
import ROTAS from "../../../../constants/rotas";

type Banner = {
  id_banner: number;
  status_id: number;
  titulo: string;
  descricao?: string | null;
  imagem_url: string;
  link_url?: string | null;
  posicao: string;
  ordem: number;
  inicio_em?: string | null;
  termina_em?: string | null;
  ativo: boolean | number | string;
};

type StatusCatalogo = {
  id_status: number;
  grupo?: string;
  codigo?: string;
  nome: string;
};

type FormularioBanner = {
  statusId: string;
  titulo: string;
  descricao: string;
  imagemUrl: string;
  linkUrl: string;
  posicao: string;
  ordem: string;
  inicioEm: string;
  terminaEm: string;
  ativo: boolean;
};

// O ServidorUpload do backend limita os arquivos a 5 MB.
const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

const TIPOS_IMAGEM_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const PAGINA_LISTAGEM = ROTAS.PAGINAS.PAINEL.BANNERS.LISTAR;

const INICIAL: FormularioBanner = {
  statusId: "1",
  titulo: "",
  descricao: "",
  imagemUrl: "",
  linkUrl: "",
  posicao: "principal",
  ordem: "0",
  inicioEm: "",
  terminaEm: "",
  ativo: true,
};

function extrairArray<T>(payload: any): T[] {
  const possibilidades = [
    payload?.dados?.dados,
    payload?.dados?.banners,
    payload?.dados?.status,
    payload?.data?.dados,
    payload?.data?.banners,
    payload?.data?.status,
    payload?.banners,
    payload?.status,
    payload?.data,
    payload?.dados,
    payload,
  ];

  return possibilidades.find(Array.isArray) ?? [];
}

/**
 * Algumas respostas da API chegam como JSON seguido de "null".
 * Extrai o primeiro objeto/array JSON completo sem tentar interpretar
 * propriedades da configuração do Axios como dados da API.
 */
function interpretarJson(texto: string): any {
  const inicio = texto.search(/[\[{]/);
  if (inicio < 0) return texto;

  const pilha: string[] = [];
  let emString = false;
  let escape = false;

  for (let i = inicio; i < texto.length; i += 1) {
    const caractere = texto[i];

    if (emString) {
      if (escape) {
        escape = false;
      } else if (caractere === "\\") {
        escape = true;
      } else if (caractere === '"') {
        emString = false;
      }
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
        const trecho = texto.slice(inicio, i + 1);
        try {
          return JSON.parse(trecho);
        } catch {
          return texto;
        }
      }
    }
  }

  return texto;
}

/** Normaliza resposta Axios, interceptor e JSON serializado. */
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
        "A operação não foi concluída.",
    );
  }
}

function erroApi(error: any, padrao: string): string {
  return (
    error?.response?.data?.mensagem ||
    error?.response?.data?.dados?.mensagem ||
    error?.response?.data?.erro ||
    error?.response?.data?.message ||
    error?.mensagem ||
    error?.message ||
    padrao
  );
}

function estaAtivo(valor: Banner["ativo"]): boolean {
  return (
    valor === true ||
    valor === 1 ||
    String(valor).toLowerCase() === "true" ||
    String(valor) === "1"
  );
}

function paraDateTimeLocal(valor?: string | null): string {
  return valor ? valor.replace(" ", "T").slice(0, 16) : "";
}

function paraDateTimeApi(valor: string): string | null {
  return valor ? `${valor.replace("T", " ")}:00` : null;
}

/**
 * Extrai somente campos de imagem da resposta da API.
 * Não percorre `config.url`, `request` ou outros metadados do Axios.
 */
function extrairImagemUrl(resposta: any): string {
  const raiz = obterCorpoResposta(resposta);
  const envelopes = [
    "dados",
    "data",
    "resultado",
    "payload",
    "body",
    "arquivo",
  ];
  const chavesImagem = ["imagem_url", "imagemUrl", "caminho", "path"];
  const fila: any[] = [raiz];
  const visitados = new Set<any>();

  while (fila.length > 0) {
    const atual = fila.shift();
    if (!atual || typeof atual !== "object" || Array.isArray(atual)) continue;
    if (visitados.has(atual)) continue;
    visitados.add(atual);

    // Só aceita propriedades do corpo da API, nunca config.url do Axios.
    for (const chave of chavesImagem) {
      const valor = atual[chave];
      if (typeof valor === "string" && valor.trim()) {
        return valor.trim();
      }
    }

    // `url` só é considerada dentro do objeto de dados retornado pelo upload.
    if (atual !== raiz && typeof atual.url === "string" && atual.url.trim()) {
      const url = atual.url.trim();
      if (/\.(jpe?g|png|webp|gif|avif|svg)(\?.*)?$/i.test(url)) {
        return url;
      }
    }

    for (const chave of envelopes) {
      const filho = atual[chave];
      if (filho && typeof filho === "object") fila.push(filho);
      else if (typeof filho === "string") {
        const texto = filho.trim();
        if (texto.startsWith("{") || texto.startsWith("[")) {
          const json = interpretarJson(texto);
          if (json && typeof json === "object") fila.push(json);
        }
      }
    }
  }

  return "";
}

function formatarTamanho(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function CadastroBannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const inputImagemRef = useRef<HTMLInputElement>(null);

  const id = searchParams.get("id");
  const editando = id !== null && Number(id) > 0;

  const [formulario, setFormulario] = useState<FormularioBanner>(INICIAL);

  const [statusDisponiveis, setStatusDisponiveis] = useState<StatusCatalogo[]>(
    [],
  );

  const [arquivoImagem, setArquivoImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState("");
  const [arrastandoImagem, setArrastandoImagem] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const [respostaStatus, respostaBanners] = await Promise.all([
        conexao
          .get(ROTAS.PERMISSOES.STATUS.LISTAR_POR_GRUPO("GERAL"), {
            withCredentials: true,
          })
          .catch(() => null),

        editando
          ? conexao.get(ROTAS.BANNERS.PAINEL.LISTAR, { withCredentials: true })
          : Promise.resolve(null),
      ]);

      let statuses: StatusCatalogo[] = [];

      if (respostaStatus) {
        const dadosStatus = obterCorpoResposta(respostaStatus);
        validarResposta(dadosStatus);

        statuses = extrairArray<StatusCatalogo>(dadosStatus);

        setStatusDisponiveis(statuses);
      }

      const statusAtivo = statuses.find(
        (item) =>
          item.codigo === "ATIVO" &&
          (item.grupo === undefined || item.grupo === "GERAL"),
      );

      const statusInicial = String(
        statusAtivo?.id_status ?? statuses[0]?.id_status ?? 1,
      );

      if (editando && respostaBanners) {
        const dadosBanners = obterCorpoResposta(respostaBanners);
        validarResposta(dadosBanners);

        const banner = extrairArray<Banner>(dadosBanners).find(
          (item) => Number(item.id_banner) === Number(id),
        );

        if (!banner) {
          throw new Error("Banner não encontrado.");
        }

        setFormulario({
          statusId: String(banner.status_id ?? statusInicial),
          titulo: banner.titulo ?? "",
          descricao: banner.descricao ?? "",
          imagemUrl: banner.imagem_url ?? "",
          linkUrl: banner.link_url ?? "",
          posicao: banner.posicao ?? "principal",
          ordem: String(banner.ordem ?? 0),
          inicioEm: paraDateTimeLocal(banner.inicio_em),
          terminaEm: paraDateTimeLocal(banner.termina_em),
          ativo: estaAtivo(banner.ativo),
        });
      } else {
        setFormulario({
          ...INICIAL,
          statusId: statusInicial,
        });
      }
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível carregar os dados do banner."));
    } finally {
      setCarregando(false);
    }
  }, [editando, id]);

  useEffect(() => {
    void carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    if (!arquivoImagem) {
      setPreviewImagem(formulario.imagemUrl);
      return;
    }

    const urlTemporaria = URL.createObjectURL(arquivoImagem);

    setPreviewImagem(urlTemporaria);

    return () => {
      URL.revokeObjectURL(urlTemporaria);
    };
  }, [arquivoImagem, formulario.imagemUrl]);

  function atualizar<K extends keyof FormularioBanner>(
    campo: K,
    valor: FormularioBanner[K],
  ) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function validarArquivo(arquivo?: File): arquivo is File {
    if (!arquivo) return false;

    if (!TIPOS_IMAGEM_PERMITIDOS.includes(arquivo.type)) {
      setErro("Formato não permitido. Envie JPG, PNG, WEBP ou GIF.");

      return false;
    }

    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
      setErro("A imagem ultrapassa o limite de 5 MB.");
      return false;
    }

    setErro("");
    setArquivoImagem(arquivo);

    return true;
  }

  function aoSelecionarImagem(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];

    if (arquivo) {
      validarArquivo(arquivo);
    }

    evento.target.value = "";
  }

  function aoSoltarImagem(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastandoImagem(false);

    const arquivo = evento.dataTransfer.files?.[0];

    if (arquivo) {
      validarArquivo(arquivo);
    }
  }

  async function enviarImagem(): Promise<string> {
    if (!arquivoImagem) {
      return formulario.imagemUrl.trim();
    }

    const dadosImagem = new FormData();

    dadosImagem.append("imagem", arquivoImagem);

    const resposta = await conexao.post(
      ROTAS.BANNERS.PAINEL.UPLOAD,
      dadosImagem,
      {
        withCredentials: true,
        // Remove o Content-Type JSON padrão da instância Axios.
        // O navegador define o multipart boundary automaticamente.
        headers: {
          "Content-Type": undefined,
          Accept: "application/json",
        },
      },
    );

    // `conexao` pode devolver o corpo diretamente pelo interceptor Axios.
    // Também funciona quando retorna a resposta Axios tradicional.
    const corpoUpload = obterCorpoResposta(resposta);

    validarResposta(corpoUpload);

    // Procura imagem_url dentro do corpo normalizado e de seus envelopes.
    // Nunca consulta resposta.config.url, que é o endereço do endpoint de upload.
    const imagemUrl = extrairImagemUrl(corpoUpload);

    if (!imagemUrl) {
      throw new Error(
        "O upload respondeu, mas o JSON não contém um caminho de imagem. Confira a resposta do POST /painel/banners/upload no console ou na aba Network.",
      );
    }

    return imagemUrl;
  }

  async function salvarBanner(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (salvando) return;

    const statusId = Number(formulario.statusId);

    if (!Number.isInteger(statusId) || statusId <= 0) {
      setErro("Selecione um status válido para o banner.");
      return;
    }

    if (!formulario.titulo.trim() || !formulario.posicao.trim()) {
      setErro("Informe o título e a posição do banner.");
      return;
    }

    if (!arquivoImagem && !formulario.imagemUrl.trim()) {
      setErro("Selecione uma imagem para o banner.");
      return;
    }

    if (
      formulario.inicioEm &&
      formulario.terminaEm &&
      formulario.terminaEm < formulario.inicioEm
    ) {
      setErro("A data final precisa ser posterior à data inicial.");
      return;
    }

    try {
      setSalvando(true);
      setErro("");

      // Primeiro envia o arquivo físico para a API.
      const imagemUrl = await enviarImagem();

      // Depois grava o caminho retornado no cadastro do banner.
      const dados = {
        statusId,
        titulo: formulario.titulo.trim(),
        imagemUrl,
        descricao: formulario.descricao.trim() || null,
        linkUrl: formulario.linkUrl.trim() || null,
        posicao: formulario.posicao.trim(),
        ordem: Number(formulario.ordem) || 0,
        inicioEm: paraDateTimeApi(formulario.inicioEm),
        terminaEm: paraDateTimeApi(formulario.terminaEm),
        ativo: formulario.ativo,
      };

      if (editando) {
        const resposta = await conexao.put(
          ROTAS.BANNERS.PAINEL.ATUALIZAR(Number(id)),
          dados,
          { withCredentials: true },
        );

        validarResposta(obterCorpoResposta(resposta));
      } else {
        const resposta = await conexao.post(
          ROTAS.BANNERS.PAINEL.CADASTRAR,
          dados,
          { withCredentials: true },
        );

        validarResposta(obterCorpoResposta(resposta));
      }

      router.push(PAGINA_LISTAGEM);
    } catch (error: any) {
      setErro(erroApi(error, "Não foi possível salvar o banner."));
    } finally {
      setSalvando(false);
    }
  }

  const previewImagemSrc = ImagemService.resolver(previewImagem);

  return (
    <main className="cadastro-banner">
      <header className="topo">
        <button
          type="button"
          className="voltar"
          onClick={() => router.push(PAGINA_LISTAGEM)}
        >
          <ArrowLeft size={17} />
          Voltar para banners
        </button>

        <div className="titulo">
          <span className="icone">
            <ImageIcon size={22} />
          </span>

          <div>
            <h1>{editando ? "Editar banner" : "Cadastrar banner"}</h1>

            <p>
              Envie a imagem e configure o destino e o período de exibição na
              loja.
            </p>
          </div>
        </div>
      </header>

      {erro && (
        <div className="mensagem-erro" role="alert">
          <AlertCircle size={17} />

          <span>{erro}</span>

          <button
            type="button"
            onClick={() => setErro("")}
            aria-label="Fechar erro"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {carregando ? (
        <div className="carregando">
          <LoaderCircle className="girando" size={23} />
          Carregando formulário...
        </div>
      ) : (
        <form className="formulario-layout" onSubmit={salvarBanner}>
          {/* CARTÃO DE UPLOAD À ESQUERDA */}
          <aside className="cartao-imagem">
            <div className="cartao-cabecalho">
              <span className="cartao-icone">
                <FileImage size={19} />
              </span>

              <div>
                <h2>Imagem do banner</h2>
                <p>Envie o arquivo que será exibido na loja.</p>
              </div>
            </div>

            <div
              className={`area-upload ${
                arrastandoImagem ? "arrastando" : ""
              } ${previewImagem ? "com-imagem" : ""}`}
              onDragOver={(evento) => {
                evento.preventDefault();
                setArrastandoImagem(true);
              }}
              onDragLeave={() => setArrastandoImagem(false)}
              onDrop={aoSoltarImagem}
            >
              {previewImagemSrc ? (
                <div className="preview-imagem">
                  <Image
                    src={previewImagemSrc}
                    alt="Pré-visualização do banner"
                    width={1280}
                    height={720}
                    unoptimized
                    style={{
                      display: "block",
                      width: "100%",
                      maxHeight: 260,
                      aspectRatio: "16 / 9",
                      objectFit: "contain",
                      borderRadius: 7,
                      background: "#100d10",
                    }}
                  />

                  <span className="preview-selo">
                    <Check size={13} />
                    Imagem selecionada
                  </span>
                </div>
              ) : (
                <div className="upload-vazio">
                  <span className="upload-icone">
                    <ImagePlus size={29} />
                  </span>

                  <strong>Adicione a imagem do banner</strong>

                  <small>
                    Arraste o arquivo para cá ou escolha no computador.
                  </small>
                </div>
              )}

              <input
                ref={inputImagemRef}
                className="input-arquivo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={aoSelecionarImagem}
                aria-label="Selecionar imagem do banner"
              />

              <button
                className="botao-upload"
                type="button"
                onClick={() => inputImagemRef.current?.click()}
                disabled={salvando}
              >
                <Upload size={16} />

                {previewImagem ? "Trocar imagem" : "Selecionar imagem"}
              </button>
            </div>

            <div className="dicas-upload">
              <div>
                <Check size={14} />
                JPG, PNG, WEBP ou GIF
              </div>

              <div>
                <Check size={14} />
                Tamanho máximo: 5 MB
              </div>

              <div>
                <Check size={14} />A imagem será enviada ao servidor
              </div>
            </div>

            {arquivoImagem && (
              <div className="arquivo-selecionado">
                <FileImage size={17} />

                <span>
                  <strong>{arquivoImagem.name}</strong>
                  <small>{formatarTamanho(arquivoImagem.size)}</small>
                </span>

                <button
                  type="button"
                  title="Remover arquivo escolhido"
                  aria-label="Remover arquivo escolhido"
                  onClick={() => setArquivoImagem(null)}
                  disabled={salvando}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </aside>

          {/* CAMPOS À DIREITA */}
          <div className="coluna-campos">
            <section className="secao">
              <h2>Informações do banner</h2>

              <div className="campo">
                <label htmlFor="titulo">
                  Título <b>*</b>
                </label>

                <input
                  id="titulo"
                  value={formulario.titulo}
                  onChange={(evento) =>
                    atualizar("titulo", evento.target.value)
                  }
                  maxLength={160}
                  required
                  placeholder="Ex.: Coleção de Natal"
                />
              </div>

              <div className="campo">
                <label htmlFor="descricao">Descrição</label>

                <textarea
                  id="descricao"
                  rows={3}
                  value={formulario.descricao}
                  onChange={(evento) =>
                    atualizar("descricao", evento.target.value)
                  }
                  maxLength={500}
                  placeholder="Texto complementar do banner..."
                />
              </div>

              <div className="campo">
                <label htmlFor="link">Link de destino</label>

                <input
                  id="link"
                  type="url"
                  value={formulario.linkUrl}
                  onChange={(evento) =>
                    atualizar("linkUrl", evento.target.value)
                  }
                  maxLength={700}
                  placeholder="https://... ou /categoria"
                />
              </div>
            </section>

            <section className="secao">
              <h2>Exibição e publicação</h2>

              <div className="duas-colunas">
                <div className="campo">
                  <label htmlFor="posicao">
                    Posição <b>*</b>
                  </label>

                  <input
                    id="posicao"
                    list="posicoes"
                    value={formulario.posicao}
                    onChange={(evento) =>
                      atualizar("posicao", evento.target.value)
                    }
                    maxLength={60}
                    required
                  />

                  <datalist id="posicoes">
                    <option value="principal" />
                    <option value="secundario" />
                    <option value="promocional" />
                  </datalist>
                </div>

                <div className="campo">
                  <label htmlFor="ordem">Ordem de exibição</label>

                  <input
                    id="ordem"
                    type="number"
                    min="0"
                    value={formulario.ordem}
                    onChange={(evento) =>
                      atualizar("ordem", evento.target.value)
                    }
                  />
                </div>
              </div>

              <div className="duas-colunas">
                <div className="campo">
                  <label htmlFor="inicio">Início da publicação</label>

                  <input
                    id="inicio"
                    type="datetime-local"
                    value={formulario.inicioEm}
                    onChange={(evento) =>
                      atualizar("inicioEm", evento.target.value)
                    }
                  />
                </div>

                <div className="campo">
                  <label htmlFor="termino">Término da publicação</label>

                  <input
                    id="termino"
                    type="datetime-local"
                    value={formulario.terminaEm}
                    onChange={(evento) =>
                      atualizar("terminaEm", evento.target.value)
                    }
                  />
                </div>
              </div>

              <div className="duas-colunas status-ativo">
                <div className="campo">
                  <label htmlFor="status">Status cadastral</label>

                  <select
                    id="status"
                    value={formulario.statusId}
                    onChange={(evento) =>
                      atualizar("statusId", evento.target.value)
                    }
                    required
                  >
                    {statusDisponiveis.length === 0 && (
                      <option value="1">Status #1 (padrão)</option>
                    )}

                    {statusDisponiveis.map((status) => (
                      <option key={status.id_status} value={status.id_status}>
                        {status.nome} ({status.codigo || status.id_status})
                      </option>
                    ))}
                  </select>
                </div>

                <label className="ativo">
                  <span>
                    <strong>
                      {formulario.ativo ? "Banner ativo" : "Banner inativo"}
                    </strong>

                    <small>
                      {formulario.ativo
                        ? "Pode ser exibido conforme o período e o status."
                        : "Não será exibido no site."}
                    </small>
                  </span>

                  <input
                    type="checkbox"
                    checked={formulario.ativo}
                    onChange={(evento) =>
                      atualizar("ativo", evento.target.checked)
                    }
                  />
                </label>
              </div>
            </section>

            <footer className="acoes">
              <button
                type="button"
                className="cancelar"
                onClick={() => router.push(PAGINA_LISTAGEM)}
                disabled={salvando}
              >
                Cancelar
              </button>

              <button type="submit" className="salvar" disabled={salvando}>
                {salvando ? (
                  <LoaderCircle size={16} className="girando" />
                ) : (
                  <Check size={16} />
                )}

                {salvando
                  ? "Enviando imagem e salvando..."
                  : editando
                    ? "Salvar alterações"
                    : "Cadastrar banner"}
              </button>
            </footer>
          </div>
        </form>
      )}

      <style jsx>{`
        .cadastro-banner {
          width: 100%;
          max-width: 1420px;
          margin: 0 auto;
          padding: 24px clamp(14px, 2.5vw, 30px) 40px;
          color: #f5edf1;
          font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif;
          box-sizing: border-box;
        }

        .cadastro-banner * {
          box-sizing: border-box;
        }

        .topo {
          margin-bottom: 20px;
        }

        .voltar {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 16px;
          padding: 8px 11px;
          border: 1px solid #493440;
          border-radius: 8px;
          background: #211a20;
          color: #cdbac5;
          font-size: 11px;
          cursor: pointer;
        }

        .voltar:hover {
          border-color: #a96b85;
          color: #fff;
        }

        .titulo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .icone {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          border: 1px solid #694153;
          border-radius: 11px;
          background: #392630;
          color: #e9a1ba;
          flex-shrink: 0;
        }

        .titulo h1 {
          margin: 0 0 5px;
          color: #f8eff3;
          font-size: 23px;
          letter-spacing: -0.5px;
        }

        .titulo p {
          margin: 0;
          color: #a894a0;
          font-size: 12px;
        }

        .formulario-layout {
          display: grid;
          grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }

        .cartao-imagem,
        .secao {
          border: 1px solid #3f2b36;
          border-radius: 12px;
          background: linear-gradient(145deg, #211a20, #1b161b);
          box-shadow: 0 8px 24px #0002;
        }

        .cartao-imagem {
          padding: 19px;
          position: sticky;
          top: 18px;
        }

        .cartao-cabecalho {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 17px;
        }

        .cartao-icone {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border: 1px solid #694153;
          border-radius: 10px;
          background: #392630;
          color: #e9a1ba;
          flex-shrink: 0;
        }

        .cartao-cabecalho h2 {
          margin: 0 0 4px;
          color: #f1e7ec;
          font-size: 13px;
        }

        .cartao-cabecalho p {
          margin: 0;
          color: #988590;
          font-size: 9px;
          line-height: 1.5;
        }

        .area-upload {
          min-height: 260px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 15px;
          padding: 14px;
          border: 1px dashed #765064;
          border-radius: 11px;
          background: rgba(21, 17, 21, 0.72);
          transition: 0.2s;
        }

        .area-upload.arrastando {
          border-color: #e9a1ba;
          background: #392630;
        }

        .area-upload.com-imagem {
          padding: 10px;
          border-style: solid;
        }

        .upload-vazio {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 10px;
          padding: 18px 8px;
        }

        .upload-icone {
          width: 64px;
          height: 64px;
          display: grid;
          place-items: center;
          border: 1px solid #694153;
          border-radius: 18px;
          background: #392630;
          color: #e9a1ba;
        }

        .upload-vazio strong {
          color: #eadde4;
          font-size: 12px;
        }

        .upload-vazio small {
          max-width: 230px;
          color: #92808b;
          font-size: 9px;
          line-height: 1.6;
        }

        .input-arquivo {
          display: none;
        }

        .botao-upload {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 39px;
          padding: 9px 14px;
          border: 1px solid #bd7894;
          border-radius: 8px;
          background: linear-gradient(135deg, #a85f7b, #87445f);
          color: #fff;
          font-size: 10px;
          font-weight: 750;
          cursor: pointer;
        }

        .botao-upload:hover {
          filter: brightness(1.12);
        }

        .botao-upload:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .preview-imagem {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 9px;
        }

        .preview-imagem img {
          display: block;
          width: 100%;
          max-height: 260px;
          aspect-ratio: 16 / 9;
          object-fit: contain;
          border-radius: 7px;
          background: #100d10;
        }

        .preview-selo {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border: 1px solid #365b46;
          border-radius: 20px;
          background: #192b22;
          color: #a8dfbd;
          font-size: 8px;
        }

        .dicas-upload {
          display: grid;
          gap: 8px;
          margin-top: 15px;
        }

        .dicas-upload div {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #9e8b96;
          font-size: 9px;
        }

        .dicas-upload svg {
          color: #8ed0a8;
          flex-shrink: 0;
        }

        .arquivo-selecionado {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-top: 15px;
          padding: 10px;
          border: 1px solid #493440;
          border-radius: 8px;
          background: #171216;
          color: #d9c8d1;
        }

        .arquivo-selecionado > svg {
          color: #e9a1ba;
          flex-shrink: 0;
        }

        .arquivo-selecionado span {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .arquivo-selecionado strong {
          overflow: hidden;
          color: #e8dce3;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .arquivo-selecionado small {
          color: #95838e;
          font-size: 8px;
        }

        .arquivo-selecionado button {
          display: grid;
          place-items: center;
          width: 27px;
          height: 27px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #cda7b8;
          cursor: pointer;
        }

        .arquivo-selecionado button:hover {
          background: #392630;
          color: #fff;
        }

        .coluna-campos {
          display: grid;
          gap: 16px;
          min-width: 0;
        }

        .secao {
          padding: 20px;
        }

        .secao h2 {
          margin: 0 0 18px;
          color: #f1e7ec;
          font-size: 14px;
        }

        .campo {
          display: flex;
          flex-direction: column;
          gap: 7px;
          margin-bottom: 14px;
          min-width: 0;
        }

        .campo:last-child {
          margin-bottom: 0;
        }

        .campo label {
          color: #d8c8d0;
          font-size: 10px;
          font-weight: 700;
        }

        .campo label b {
          color: #ed8fae;
        }

        .campo input,
        .campo textarea,
        .campo select {
          width: 100%;
          min-width: 0;
          padding: 10px 11px;
          border: 1px solid #493440;
          border-radius: 8px;
          outline: 0;
          background: #151115;
          color: #f1e9ed;
          font: inherit;
          font-size: 10px;
        }

        .campo input,
        .campo select {
          height: 40px;
        }

        .campo textarea {
          resize: vertical;
          line-height: 1.5;
        }

        .campo input:focus,
        .campo textarea:focus,
        .campo select:focus {
          border-color: #b57491;
          box-shadow: 0 0 0 3px #d589a617;
        }

        .duas-colunas {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .status-ativo {
          align-items: end;
        }

        .ativo {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          align-self: stretch;
          min-height: 59px;
          margin-bottom: 14px;
          padding: 10px 12px;
          border: 1px solid #493440;
          border-radius: 8px;
          background: #211a20;
        }

        .ativo span {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .ativo strong {
          color: #e4d6de;
          font-size: 10px;
        }

        .ativo small {
          color: #8f7d88;
          font-size: 8px;
          line-height: 1.4;
        }

        .ativo input {
          width: 17px;
          height: 17px;
          flex-shrink: 0;
          accent-color: #b87591;
        }

        .acoes {
          display: flex;
          justify-content: flex-end;
          gap: 9px;
          padding-top: 2px;
        }

        .cancelar,
        .salvar {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 10px 15px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 750;
          cursor: pointer;
        }

        .cancelar {
          border: 1px solid #493440;
          background: transparent;
          color: #cdbac5;
        }

        .cancelar:hover {
          background: #30232c;
        }

        .salvar {
          border: 1px solid #bd7894;
          background: linear-gradient(135deg, #a85f7b, #87445f);
          color: #fff;
        }

        .salvar:hover {
          filter: brightness(1.1);
        }

        .cancelar:disabled,
        .salvar:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .mensagem-erro {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 14px;
          padding: 12px;
          border: 1px solid #75404f;
          border-radius: 8px;
          background: #351c25;
          color: #f2aabd;
          font-size: 10px;
        }

        .mensagem-erro span {
          flex: 1;
        }

        .mensagem-erro button {
          display: grid;
          place-items: center;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .carregando {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-height: 220px;
          color: #cdbac5;
          font-size: 12px;
        }

        .girando {
          animation: girar 1s linear infinite;
        }

        @keyframes girar {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .formulario-layout {
            grid-template-columns: minmax(240px, 310px) minmax(0, 1fr);
            gap: 12px;
          }

          .cartao-imagem,
          .secao {
            padding: 15px;
          }

          .area-upload {
            min-height: 230px;
          }
        }

        @media (max-width: 700px) {
          .formulario-layout {
            grid-template-columns: 1fr;
          }

          .cartao-imagem {
            position: static;
          }

          .area-upload {
            min-height: 220px;
          }

          .preview-imagem img {
            max-height: 300px;
          }

          .titulo h1 {
            font-size: 20px;
          }
        }

        @media (max-width: 480px) {
          .duas-colunas {
            grid-template-columns: 1fr;
            gap: 0;
          }

          .secao {
            padding: 15px;
          }

          .acoes {
            flex-direction: column-reverse;
          }

          .acoes button {
            width: 100%;
          }

          .titulo p {
            font-size: 10px;
          }
        }
      `}</style>
    </main>
  );
}
