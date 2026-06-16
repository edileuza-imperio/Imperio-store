"use client";

import api from "@/Api/conectar";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FiCheckCircle,
  FiGrid,
  FiHash,
  FiInfo,
  FiLayers,
  FiSave,
  FiTag,
  FiType,
  FiX,
  FiXCircle,
} from "react-icons/fi";

import "@/components/styles/sistema/vitrine-modal.css";

type Props = {
  aberto: boolean;
  onFechar: () => void;
  onCadastrado: () => void | Promise<void>;
};

type StatusFormulario = "idle" | "salvando" | "sucesso" | "erro";

type Nivel = {
  id_nivel?: number;
  idNivel?: number;
  id?: number;
  nome: string;
  codigo?: string;
};

type Status = {
  id_status?: number;
  idStatus?: number;
  id?: number;
  nome: string;
  codigo?: string;
};

export default function CadastrarVitrineModal({
  aberto,
  onFechar,
  onCadastrado,
}: Props) {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [tipo, setTipo] = useState("produto");
  const [ordem, setOrdem] = useState(0);
  const [nivelId, setNivelId] = useState(1);
  const [statusId, setStatusId] = useState(1);

  const [niveis, setNiveis] = useState<Nivel[]>([]);
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

  function getNivelId(nivel: Nivel) {
    return Number(nivel.id_nivel ?? nivel.idNivel ?? nivel.id ?? 0);
  }

  function getStatusId(status: Status) {
    return Number(status.id_status ?? status.idStatus ?? status.id ?? 0);
  }

  async function carregarConfiguracoes() {
    try {
      setLoadingConfig(true);

      const response = await api.get("/configuracoes");
      const data = response.data;

      const niveisApi = Array.isArray(data?.dados?.niveis)
        ? data.dados.niveis
        : [];

      const statusApi = Array.isArray(data?.dados?.status)
        ? data.dados.status
        : [];

      setNiveis(niveisApi);
      setStatusLista(statusApi);

      const nivelPadrao = niveisApi[0];
      const statusAtivo =
        statusApi.find((item: Status) =>
          String(item.codigo || item.nome).toLowerCase().includes("ativo")
        ) || statusApi[0];

      if (nivelPadrao) setNivelId(getNivelId(nivelPadrao));
      if (statusAtivo) setStatusId(getStatusId(statusAtivo));
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      setNiveis([]);
      setStatusLista([]);
    } finally {
      setLoadingConfig(false);
    }
  }

  function gerarSlug(texto: string) {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function alterarNome(valor: string) {
    setNome(valor);

    if (!slug.trim()) {
      setSlug(gerarSlug(valor));
    }
  }

  function limparFormulario() {
    setNome("");
    setSlug("");
    setTitulo("");
    setSubtitulo("");
    setTipo("produto");
    setOrdem(0);
    setNivelId(1);
    setStatusId(1);
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

      await api.post("/vitrine", {
        nome: nome.trim(),
        slug: gerarSlug(slug),
        titulo: titulo.trim() || nome.trim(),
        subtitulo: subtitulo.trim() || null,
        tipo,
        status_id: Number(statusId),
        nivel_id: Number(nivelId),
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
        className="vitrine-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="vitrine-modal-header">
          <div>
            <span>Nova vitrine</span>

            <h2>
              <FiGrid />
              Cadastrar vitrine
            </h2>

            <p>Crie uma vitrine para organizar produtos, campanhas ou categorias.</p>
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
                  onChange={(e) => alterarNome(e.target.value)}
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
                  onChange={(e) => setSlug(gerarSlug(e.target.value))}
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
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Especial Dia dos Namorados ❤️"
                />
              </div>
            </label>

            <label className="vitrine-modal-field vitrine-modal-full">
              <span>Subtítulo público</span>

              <textarea
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
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
                  ? "Carregando níveis e status..."
                  : "Tipo, ordem, nível e status vindos da API."}
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
                onChange={(e) => setOrdem(Number(e.target.value))}
                min={0}
              />
            </label>

            <label className="vitrine-modal-field">
              <span>Nível</span>

              <select
                value={nivelId}
                onChange={(e) => setNivelId(Number(e.target.value))}
                disabled={loadingConfig}
              >
                {niveis.length === 0 ? (
                  <option value={1}>Nível 1</option>
                ) : (
                  niveis.map((nivel) => {
                    const id = getNivelId(nivel);

                    return (
                      <option key={id} value={id}>
                        {nivel.nome}
                        {nivel.codigo ? ` - ${nivel.codigo}` : ""}
                      </option>
                    );
                  })
                )}
              </select>
            </label>

            <label className="vitrine-modal-field">
              <span>Status</span>

              <select
                value={statusId}
                onChange={(e) => setStatusId(Number(e.target.value))}
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
                        {status.nome}
                        {status.codigo ? ` - ${status.codigo}` : ""}
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