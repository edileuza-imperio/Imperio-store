"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiGrid,
  FiHash,
  FiInfo,
  FiLayers,
  FiLock,
  FiSave,
  FiTag,
  FiType,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import "@/components/styles/sistema/vitrine-modal.css";



import { Status, StatusFormulario } from "../types/vitrineTypes";

import {
  gerarSlug,
  getStatusId,
  getStatusLabel,
} from "../types/vitrineUtils";
import { carregarConfiguracoesModal, salvarNovaVitrine } from "../services/vitrineActions";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onCadastrado: () => void | Promise<void>;
};

const NIVEL_SISTEMA_ID = 1;
const NIVEL_SISTEMA_LABEL = "Sistema";

export default function CadastrarVitrineModal({
  aberto,
  onFechar,
  onCadastrado,
}: Props) {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [tipo, setTipo] = useState("produto");
  const [ordem, setOrdem] = useState(0);
  const [statusId, setStatusId] = useState(1);

  const [nivelSistemaNome, setNivelSistemaNome] =
    useState(NIVEL_SISTEMA_LABEL);

  const [statusLista, setStatusLista] = useState<Status[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  const [statusFormulario, setStatusFormulario] =
    useState<StatusFormulario>("idle");

  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (aberto) {
      carregarConfiguracoes();
    }
  }, [aberto]);

  const podeSalvar = useMemo(() => {
    return nome.trim().length >= 3 && slug.trim().length >= 3;
  }, [nome, slug]);

  async function carregarConfiguracoes() {
    try {
      setLoadingConfig(true);

      const configuracoes = await carregarConfiguracoesModal();

      setNivelSistemaNome(
        configuracoes.nivelSistema?.nome || NIVEL_SISTEMA_LABEL
      );

      setStatusLista(configuracoes.statusLista);
      setStatusId(configuracoes.statusPadrao);
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);

      setStatusLista([]);
      setNivelSistemaNome(NIVEL_SISTEMA_LABEL);
      setStatusId(1);
    } finally {
      setLoadingConfig(false);
    }
  }

  function alterarNome(valor: string) {
    setNome(valor);

    if (!slugManual) {
      setSlug(gerarSlug(valor));
    }
  }

  function alterarSlug(valor: string) {
    setSlugManual(true);
    setSlug(gerarSlug(valor));
  }

  function limparFormulario() {
    setNome("");
    setSlug("");
    setSlugManual(false);
    setTitulo("");
    setSubtitulo("");
    setTipo("produto");
    setOrdem(0);
    setStatusId(1);
    setNivelSistemaNome(NIVEL_SISTEMA_LABEL);
    setStatusFormulario("idle");
    setMensagem("");
  }

  function fecharModal() {
    if (statusFormulario === "salvando") return;

    limparFormulario();
    onFechar();
  }

  async function salvarVitrine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!podeSalvar) {
      setStatusFormulario("erro");
      setMensagem("Preencha pelo menos o nome e o slug da vitrine.");
      return;
    }

    try {
      setStatusFormulario("salvando");
      setMensagem("");

      await salvarNovaVitrine({
        nome: nome.trim(),
        slug: gerarSlug(slug),
        titulo: titulo.trim() || nome.trim(),
        subtitulo: subtitulo.trim() || null,
        tipo,
        status_id: Number(statusId),
        nivel_id: NIVEL_SISTEMA_ID,
        ordem: Number(ordem),
      });

      setStatusFormulario("sucesso");
      setMensagem("Vitrine criada com sucesso.");

      await onCadastrado();

      setTimeout(() => {
        limparFormulario();
        onFechar();
      }, 550);
    } catch (error: any) {
      console.error("Erro ao cadastrar vitrine:", error);

      setStatusFormulario("erro");
      setMensagem(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          "Erro ao cadastrar vitrine."
      );
    }
  }

  if (!aberto) return null;

  return (
    <div className="vitrine-modal-overlay" onMouseDown={fecharModal}>
      <section
        className="vitrine-modal vitrine-modal-compact"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="vitrine-modal-header">
          <div>
            <span>Nova vitrine</span>

            <h2>
              <FiGrid />
              Cadastrar vitrine
            </h2>

            <p>
              Crie uma vitrine para organizar produtos, campanhas ou categorias.
            </p>
          </div>

          <button type="button" onClick={fecharModal} aria-label="Fechar modal">
            <FiX />
          </button>
        </header>

        {mensagem && (
          <div
            className={`vitrine-modal-alert ${
              statusFormulario === "sucesso"
                ? "vitrine-modal-alert-success"
                : "vitrine-modal-alert-error"
            }`}
          >
            {statusFormulario === "sucesso" ? <FiCheckCircle /> : <FiXCircle />}
            {mensagem}
          </div>
        )}

        <form className="vitrine-modal-form" onSubmit={salvarVitrine}>
          <div className="vitrine-modal-preview">
            <div className="vitrine-modal-preview-icon">
              <FiGrid />
            </div>

            <div>
              <span>Prévia da vitrine</span>
              <strong>{titulo || nome || "Nome da vitrine"}</strong>
              <p>
                {subtitulo ||
                  "Subtítulo público da vitrine aparecerá aqui."}
              </p>
            </div>
          </div>

          <div className="vitrine-modal-section-title">
            <FiInfo />
            <div>
              <strong>Dados principais</strong>
              <span>Nome, slug e textos públicos da vitrine.</span>
            </div>
          </div>

          <div className="vitrine-modal-grid">
            <label className="vitrine-modal-field">
              <span>Nome *</span>

              <div>
                <FiType />
                <input
                  type="text"
                  value={nome}
                  onChange={(event) => alterarNome(event.target.value)}
                  placeholder="Ex: Vitrine Dia dos Namorados"
                />
              </div>
            </label>

            <label className="vitrine-modal-field">
              <span>Slug *</span>

              <div>
                <FiHash />
                <input
                  type="text"
                  value={slug}
                  onChange={(event) => alterarSlug(event.target.value)}
                  placeholder="vitrine-dia-dos-namorados"
                />
              </div>
            </label>

            <label className="vitrine-modal-field vitrine-modal-full">
              <span>Título público</span>

              <div>
                <FiTag />
                <input
                  type="text"
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  placeholder="Especial Dia dos Namorados ❤️"
                />
              </div>
            </label>

            <label className="vitrine-modal-field vitrine-modal-full">
              <span>Subtítulo público</span>

              <textarea
                value={subtitulo}
                onChange={(event) => setSubtitulo(event.target.value)}
                placeholder="Texto curto que aparece abaixo do título."
                rows={3}
              />
            </label>
          </div>

          <div className="vitrine-modal-section-title">
            <FiLayers />
            <div>
              <strong>Configurações</strong>
              <span>
                {loadingConfig
                  ? "Carregando status..."
                  : "O nível fica travado em Sistema."}
              </span>
            </div>
          </div>

          <div className="vitrine-modal-grid vitrine-modal-grid-small">
            <label className="vitrine-modal-field">
              <span>Tipo</span>

              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="produto">Produto</option>
                <option value="campanha">Campanha</option>
                <option value="categoria">Categoria</option>
                <option value="misto">Misto</option>
              </select>
            </label>

            <label className="vitrine-modal-field">
              <span>Ordem</span>

              <input
                type="number"
                value={ordem}
                onChange={(event) => setOrdem(Number(event.target.value))}
                min={0}
              />
            </label>

            <label className="vitrine-modal-field">
              <span>Nível</span>

              <div className="vitrine-modal-locked-field">
                <FiLock />
                <input
                  type="text"
                  value={`${NIVEL_SISTEMA_ID} - ${nivelSistemaNome}`}
                  disabled
                  readOnly
                />
              </div>
            </label>

            <label className="vitrine-modal-field">
              <span>Status</span>

              <select
                value={statusId}
                onChange={(event) => setStatusId(Number(event.target.value))}
                disabled={loadingConfig}
              >
                {statusLista.length === 0 ? (
                  <>
                    <option value={1}>Ativo</option>
                    <option value={2}>Inativo</option>
                  </>
                ) : (
                  statusLista.map((status) => {
                    const id = getStatusId(status);

                    return (
                      <option key={id} value={id}>
                        {getStatusLabel(status)}
                      </option>
                    );
                  })
                )}
              </select>
            </label>
          </div>

          <footer className="vitrine-modal-actions">
            <button
              type="button"
              onClick={fecharModal}
              className="vitrine-modal-cancel"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!podeSalvar || statusFormulario === "salvando"}
              className="vitrine-modal-submit"
            >
              <FiSave />
              {statusFormulario === "salvando" ? "Salvando..." : "Cadastrar"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}