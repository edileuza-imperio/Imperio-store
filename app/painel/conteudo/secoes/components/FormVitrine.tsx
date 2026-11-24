"use client";

import ROTAS from "@/app/constants/rotas";
import conexao from "@/Services/Conexao/Conexao";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  LayoutGrid,
  LoaderCircle,
  Save,
  Settings2,
  Tag,
  Type,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

interface Vitrine {
  status_id: number;
  id_vitrine: number;
  nome: string;
  codigo: string;
  titulo: string;
  descricao?: string | null;
  tipo: string;
  ordem: number;
  ativo: boolean | number | string;
}

interface FormularioVitrine {
  status_id: number;
  nome: string;
  codigo: string;
  titulo: string;
  descricao: string;
  tipo: string;
  ordem: number;
  ativo: boolean;
}

const FORMULARIO_INICIAL: FormularioVitrine = {
  status_id: 1,
  nome: "",
  codigo: "",
  titulo: "",
  descricao: "",
  tipo: "produtos",
  ordem: 0,
  ativo: true,
};

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function extrairDados<T>(resposta: unknown): T {
  let payload: unknown = resposta;

  if (ehObjeto(payload) && "data" in payload && !("dados" in payload)) {
    payload = payload.data;
  }

  if (typeof payload === "string") {
    const texto = payload.trim();
    try {
      payload = JSON.parse(texto);
    } catch {
      const inicio = texto.indexOf("{");
      const fim = texto.lastIndexOf("}");
      if (inicio < 0 || fim <= inicio) {
        throw new Error("A API retornou uma resposta inválida.");
      }
      payload = JSON.parse(texto.slice(inicio, fim + 1));
    }
  }

  if (ehObjeto(payload) && "dados" in payload) {
    return payload.dados as T;
  }

  return payload as T;
}

function gerarCodigo(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function converterAtivo(valor: unknown): boolean {
  if (typeof valor === "boolean") return valor;
  if (typeof valor === "number") return valor === 1;
  return ["1", "true", "sim", "ativo"].includes(
    String(valor).trim().toLowerCase(),
  );
}

function mensagemErro(erro: unknown, padrao: string): string {
  if (ehObjeto(erro) && ehObjeto(erro.response)) {
    const resposta = erro.response.data;
    if (ehObjeto(resposta) && typeof resposta.mensagem === "string") {
      return resposta.mensagem;
    }
  }

  return erro instanceof Error && erro.message ? erro.message : padrao;
}

interface FormVitrineProps {
  id?: number;
  modal?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function FormVitrine({
  id,
  modal = false,
  onSuccess,
  onCancel,
}: FormVitrineProps) {
  const router = useRouter();
  const editando = typeof id === "number" && id > 0;

  const [formulario, setFormulario] =
    useState<FormularioVitrine>(FORMULARIO_INICIAL);
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [codigoPersonalizado, setCodigoPersonalizado] = useState(editando);

  useEffect(() => {
    let ativo = true;

    async function carregarVitrine() {
      if (!editando || !id) {
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro("");

      try {
        const resposta = await conexao.get(
          ROTAS.VITRINES.PAINEL.BUSCAR_POR_ID(id),
        );
        const dados = extrairDados<{ vitrine?: Vitrine }>(resposta);
        const vitrine = dados?.vitrine;

        if (!vitrine) throw new Error("Vitrine não encontrada.");
        if (!ativo) return;

        setFormulario({
          status_id: Number(vitrine.status_id || 1),
          nome: vitrine.nome || "",
          codigo: vitrine.codigo || "",
          titulo: vitrine.titulo || "",
          descricao: vitrine.descricao || "",
          tipo: vitrine.tipo || "produtos",
          ordem: Number(vitrine.ordem || 0),
          ativo: converterAtivo(vitrine.ativo),
        });
      } catch (e) {
        if (ativo) {
          setErro(
            mensagemErro(e, "Não foi possível carregar os dados da seção."),
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarVitrine();
    return () => {
      ativo = false;
    };
  }, [editando, id]);

  function atualizarNome(nome: string) {
    setFormulario((atual) => ({
      ...atual,
      nome,
      codigo: codigoPersonalizado ? atual.codigo : gerarCodigo(nome),
    }));
  }

  function cancelar() {
    if (onCancel) {
      onCancel();
    } else {
      router.push(ROTAS.PAGINAS.PAINEL.SECOES.LISTAR);
    }
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro("");
    setAviso("");

    const nome = formulario.nome.trim();
    const titulo = formulario.titulo.trim();
    const codigo = gerarCodigo(formulario.codigo || formulario.nome);

    if (!nome || !titulo || !codigo) {
      setErro("Preencha o nome interno, o título e o código da seção.");
      return;
    }

    setSalvando(true);

    const payload: FormularioVitrine = {
      ...formulario,
      nome,
      titulo,
      codigo,
      descricao: formulario.descricao.trim(),
      ordem: Number(formulario.ordem),
    };

    try {
      if (editando && id) {
        await conexao.put(ROTAS.VITRINES.PAINEL.ATUALIZAR(id), payload);
        setAviso("Seção atualizada com sucesso.");
      } else {
        await conexao.post(ROTAS.VITRINES.PAINEL.CADASTRAR, payload);
        setAviso("Seção criada com sucesso.");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(ROTAS.PAGINAS.PAINEL.SECOES.LISTAR);
        router.refresh();
      }
    } catch (e) {
      setErro(mensagemErro(e, "Não foi possível salvar a seção."));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className={modal ? "vitrine-form-overlay" : "vitrine-form-page"}>
        <div
          className={
            modal
              ? "vitrine-form-dialog vitrine-form-loading"
              : "vitrine-form-shell vitrine-form-loading"
          }
        >
          <LoaderCircle className="vitrine-spin" size={26} />
          <strong>Carregando dados da seção...</strong>
        </div>
      </main>
    );
  }

  return (
    <main
      className={modal ? "vitrine-form-overlay" : "vitrine-form-page"}
      onMouseDown={
        modal
          ? (evento) => {
              if (evento.target === evento.currentTarget) cancelar();
            }
          : undefined
      }
    >
      <div
        className={modal ? "vitrine-form-dialog" : "vitrine-form-shell"}
        role={modal ? "dialog" : undefined}
        aria-modal={modal ? true : undefined}
        aria-labelledby={modal ? "vitrine-form-title" : undefined}
      >
        {!modal && (
          <nav className="vitrine-breadcrumb" aria-label="Caminho de navegação">
            <span>Painel</span>
            <span className="vitrine-breadcrumb-separator">/</span>
            <span>Conteúdo</span>
            <span className="vitrine-breadcrumb-separator">/</span>
            <button type="button" onClick={cancelar}>
              Seções
            </button>
            <span className="vitrine-breadcrumb-separator">/</span>
            <strong>{editando ? "Editar seção" : "Nova seção"}</strong>
          </nav>
        )}

        <header className="vitrine-form-header">
          <div className="vitrine-form-title-wrap">
            <span className="vitrine-form-icon">
              <LayoutGrid size={22} />
            </span>
            <div>
              <span className="vitrine-form-eyebrow">
                CONTEÚDO · PÁGINA INICIAL
              </span>
              <h1 id={modal ? "vitrine-form-title" : undefined}>
                {editando ? "Editar seção" : "Criar seção da vitrine"}
              </h1>
              <p>
                Organize como os conteúdos e produtos serão apresentados na
                loja.
              </p>
            </div>
          </div>

          {modal ? (
            <button
              type="button"
              className="vitrine-icon-button"
              onClick={cancelar}
              aria-label="Fechar edição"
              disabled={salvando}
            >
              <X size={19} />
            </button>
          ) : (
            <button
              type="button"
              className="vitrine-button vitrine-button-secondary"
              onClick={cancelar}
            >
              <ArrowLeft size={16} />
              Voltar para seções
            </button>
          )}
        </header>

        {erro && (
          <div className="vitrine-alert vitrine-alert-error" role="alert">
            <span>{erro}</span>
            <button
              type="button"
              onClick={() => setErro("")}
              aria-label="Fechar erro"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {aviso && (
          <div className="vitrine-alert vitrine-alert-success" role="status">
            <Check size={17} />
            <span>{aviso}</span>
          </div>
        )}

        <form className="vitrine-form-layout" onSubmit={salvar}>
          <div className="vitrine-form-grid">
            <section className="vitrine-card vitrine-card-identificacao">
              <div className="vitrine-card-heading">
                <span className="vitrine-card-icon">
                  <Type size={19} />
                </span>
                <div>
                  <h2>Identificação da seção</h2>
                  <p>
                    Defina os nomes e identificadores utilizados no painel e na
                    loja.
                  </p>
                </div>
                <span className="vitrine-card-step">01</span>
              </div>

              <div className="vitrine-fields">
                <label className="vitrine-field vitrine-field-full">
                  <span>
                    Nome interno <b>*</b>
                  </span>
                  <input
                    value={formulario.nome}
                    onChange={(e) => atualizarNome(e.target.value)}
                    placeholder="Ex.: Mais vendidos"
                    required
                    maxLength={150}
                    disabled={salvando}
                  />
                  <small>
                    Nome utilizado para localizar a seção no painel
                    administrativo.
                  </small>
                </label>

                <label className="vitrine-field vitrine-field-full">
                  <span>
                    Título exibido na loja <b>*</b>
                  </span>
                  <input
                    value={formulario.titulo}
                    onChange={(e) =>
                      setFormulario((atual) => ({
                        ...atual,
                        titulo: e.target.value,
                      }))
                    }
                    placeholder="Ex.: Os favoritos dos clientes"
                    required
                    maxLength={180}
                    disabled={salvando}
                  />
                  <small>
                    Texto principal que será apresentado aos visitantes.
                  </small>
                </label>

                <label className="vitrine-field vitrine-field-full">
                  <span>
                    Código da seção <b>*</b>
                  </span>
                  <div className="vitrine-input-with-icon">
                    <Tag size={16} />
                    <input
                      value={formulario.codigo}
                      onChange={(e) => {
                        setCodigoPersonalizado(true);
                        setFormulario((atual) => ({
                          ...atual,
                          codigo: gerarCodigo(e.target.value),
                        }));
                      }}
                      placeholder="mais-vendidos"
                      required
                      maxLength={100}
                      disabled={salvando}
                    />
                  </div>
                  <small>
                    Identificador amigável. É sugerido automaticamente pelo
                    nome, mas pode ser ajustado.
                  </small>
                </label>
              </div>
            </section>

            <section className="vitrine-card vitrine-card-exibicao">
              <div className="vitrine-card-heading">
                <span className="vitrine-card-icon">
                  <Settings2 size={19} />
                </span>
                <div>
                  <h2>Exibição e publicação</h2>
                  <p>Configure o formato, a posição e a disponibilidade.</p>
                </div>
                <span className="vitrine-card-step">02</span>
              </div>

              <div className="vitrine-fields vitrine-fields-two">
                <label className="vitrine-field vitrine-field-full">
                  <span>Tipo de seção</span>
                  <div className="vitrine-select-wrap">
                    <select
                      value={formulario.tipo}
                      onChange={(e) =>
                        setFormulario((atual) => ({
                          ...atual,
                          tipo: e.target.value,
                        }))
                      }
                      disabled={salvando}
                    >
                      <option value="produtos">Vitrine de produtos</option>
                      <option value="categorias">Categorias</option>
                      <option value="marcas">Marcas</option>
                      <option value="conteudo">Bloco de conteúdo</option>
                    </select>
                    <ChevronDown size={16} />
                  </div>
                  <small>Define o tipo de conteúdo exibido nesta área.</small>
                </label>

                <label className="vitrine-field vitrine-field-full">
                  <span>Ordem de exibição</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={formulario.ordem}
                    onChange={(e) =>
                      setFormulario((atual) => ({
                        ...atual,
                        ordem: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    disabled={salvando}
                  />
                  <small>Seções com menor número aparecem primeiro.</small>
                </label>
              </div>

              <div
                className={`vitrine-publication-card ${formulario.ativo ? "is-active" : "is-inactive"}`}
              >
                <span className="vitrine-publication-icon">
                  <Eye size={19} />
                </span>
                <span className="vitrine-publication-copy">
                  <strong>
                    {formulario.ativo
                      ? "Seção publicada"
                      : "Seção não publicada"}
                  </strong>
                  <small>
                    {formulario.ativo
                      ? "Esta seção está habilitada para aparecer na loja."
                      : "Esta seção ficará oculta para os visitantes."}
                  </small>
                </span>
                <label className="vitrine-switch" aria-label="Publicar seção">
                  <input
                    type="checkbox"
                    checked={formulario.ativo}
                    onChange={(e) =>
                      setFormulario((atual) => ({
                        ...atual,
                        ativo: e.target.checked,
                      }))
                    }
                    disabled={salvando}
                  />
                  <span />
                </label>
              </div>

              <div className="vitrine-preview-note">
                <span className="vitrine-preview-dot" />
                <span>As alterações serão aplicadas à seção após salvar.</span>
              </div>
            </section>

            <section className="vitrine-card vitrine-card-descricao">
              <div className="vitrine-card-heading">
                <span className="vitrine-card-icon">
                  <Type size={19} />
                </span>
                <div>
                  <h2>Descrição complementar</h2>
                  <p>
                    Opcional: adicione contexto para a seção na página da loja.
                  </p>
                </div>
                <span className="vitrine-card-step">03</span>
              </div>

              <label className="vitrine-field">
                <span>Descrição</span>
                <textarea
                  value={formulario.descricao}
                  onChange={(e) =>
                    setFormulario((atual) => ({
                      ...atual,
                      descricao: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Ex.: Uma seleção especial de produtos escolhidos para você."
                  maxLength={500}
                  disabled={salvando}
                />
                <small>
                  {formulario.descricao.length}/500 caracteres. Esse texto é
                  opcional.
                </small>
              </label>
            </section>
          </div>

          <footer className="vitrine-form-actions">
            <div className="vitrine-form-security">
              <span>
                <Check size={15} />
              </span>
              <div>
                <strong>
                  {editando ? "Edição de seção" : "Cadastro de seção"}
                </strong>
                <small>
                  Os dados serão enviados com sua sessão administrativa.
                </small>
              </div>
            </div>

            <div className="vitrine-form-action-buttons">
              <button
                type="button"
                className="vitrine-button vitrine-button-secondary"
                onClick={cancelar}
                disabled={salvando}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="vitrine-button vitrine-button-primary"
                disabled={salvando}
              >
                {salvando ? (
                  <LoaderCircle className="vitrine-spin" size={17} />
                ) : (
                  <Save size={17} />
                )}
                {salvando
                  ? "Salvando..."
                  : editando
                    ? "Salvar alterações"
                    : "Criar seção"}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </main>
  );
}
