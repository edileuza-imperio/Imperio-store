"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiGrid,
  FiHash,
  FiInfo,
  FiLayers,
  FiSave,
  FiTag,
  FiType,
  FiXCircle,
} from "react-icons/fi";

import "../../../components/styles/sistema/vitrine-cadastrar.css";

type StatusFormulario = "idle" | "salvando" | "sucesso" | "erro";

export default function CadastrarVitrinePage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [tipo, setTipo] = useState("produto");
  const [ordem, setOrdem] = useState(0);
  const [nivelId, setNivelId] = useState(1);
  const [statusId, setStatusId] = useState(1);

  const [statusFormulario, setStatusFormulario] =
    useState<StatusFormulario>("idle");
  const [mensagem, setMensagem] = useState("");

  const podeSalvar = useMemo(() => {
    return nome.trim().length >= 3 && slug.trim().length >= 3;
  }, [nome, slug]);

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

  async function salvarVitrine(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!podeSalvar) {
      setStatusFormulario("erro");
      setMensagem("Preencha pelo menos o nome e o slug da vitrine.");
      return;
    }

    try {
      setStatusFormulario("salvando");
      setMensagem("");

      const payload = {
        nome: nome.trim(),
        slug: gerarSlug(slug),
        titulo: titulo.trim() || nome.trim(),
        subtitulo: subtitulo.trim() || null,
        tipo,
        status_id: Number(statusId),
        nivel_id: Number(nivelId),
        ordem: Number(ordem),
      };

      const response = await api.post("/vitrine", payload);

      const idCriado =
        response.data?.id_vitrine ||
        response.data?.dados?.id_vitrine ||
        response.data?.id ||
        null;

      setStatusFormulario("sucesso");
      setMensagem("Vitrine criada com sucesso.");

      setTimeout(() => {
        if (idCriado) {
          router.push(`/sistema/vitrines/${idCriado}`);
        } else {
          router.push("/sistema/vitrines");
        }
      }, 700);
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

  return (
    <main className="vitrine-cadastrar-container">
      <header className="vitrine-cadastrar-header">
        <div>
          <Link href="/sistema/vitrines" className="vitrine-cadastrar-back">
            <FiArrowLeft />
            Voltar para vitrines
          </Link>

          <h1>
            <FiGrid />
            Cadastrar vitrine
          </h1>

          <p>Crie uma nova vitrine para exibir produtos, campanhas ou categorias.</p>
        </div>
      </header>

      {mensagem && (
        <div
          className={`vitrine-cadastrar-alert ${
            statusFormulario === "sucesso"
              ? "vitrine-cadastrar-alert-success"
              : "vitrine-cadastrar-alert-error"
          }`}
        >
          {statusFormulario === "sucesso" ? <FiCheckCircle /> : <FiXCircle />}
          {mensagem}
        </div>
      )}

      <form className="vitrine-cadastrar-form" onSubmit={salvarVitrine}>
        <section className="vitrine-cadastrar-card">
          <div className="vitrine-cadastrar-card-title">
            <div>
              <FiInfo />
            </div>

            <section>
              <h2>Dados principais</h2>
              <p>Essas informações identificam a vitrine dentro do painel.</p>
            </section>
          </div>

          <div className="vitrine-cadastrar-grid">
            <label className="vitrine-cadastrar-field">
              <span>Nome da vitrine *</span>

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

            <label className="vitrine-cadastrar-field">
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

            <label className="vitrine-cadastrar-field">
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

            <label className="vitrine-cadastrar-field vitrine-cadastrar-field-full">
              <span>Subtítulo público</span>

              <textarea
                value={subtitulo}
                onChange={(e) => setSubtitulo(e.target.value)}
                placeholder="Texto curto que aparece abaixo do título da vitrine."
                rows={4}
              />
            </label>
          </div>
        </section>

        <section className="vitrine-cadastrar-card">
          <div className="vitrine-cadastrar-card-title">
            <div>
              <FiLayers />
            </div>

            <section>
              <h2>Configurações</h2>
              <p>Defina tipo, ordem, nível e status da vitrine.</p>
            </section>
          </div>

          <div className="vitrine-cadastrar-grid vitrine-cadastrar-grid-small">
            <label className="vitrine-cadastrar-field">
              <span>Tipo</span>

              <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                <option value="produto">Produto</option>
                <option value="campanha">Campanha</option>
                <option value="categoria">Categoria</option>
                <option value="misto">Misto</option>
              </select>
            </label>

            <label className="vitrine-cadastrar-field">
              <span>Ordem</span>

              <input
                type="number"
                value={ordem}
                onChange={(e) => setOrdem(Number(e.target.value))}
                min={0}
              />
            </label>

            <label className="vitrine-cadastrar-field">
              <span>Nível</span>

              <input
                type="number"
                value={nivelId}
                onChange={(e) => setNivelId(Number(e.target.value))}
                min={1}
              />
            </label>

            <label className="vitrine-cadastrar-field">
              <span>Status</span>

              <select
                value={statusId}
                onChange={(e) => setStatusId(Number(e.target.value))}
              >
                <option value={1}>Ativo</option>
                <option value={2}>Inativo</option>
              </select>
            </label>
          </div>
        </section>

        <div className="vitrine-cadastrar-actions">
          <Link href="/sistema/vitrines" className="vitrine-cadastrar-cancel">
            Cancelar
          </Link>

          <button
            type="submit"
            disabled={!podeSalvar || statusFormulario === "salvando"}
            className="vitrine-cadastrar-submit"
          >
            <FiSave />
            {statusFormulario === "salvando" ? "Salvando..." : "Cadastrar vitrine"}
          </button>
        </div>
      </form>
    </main>
  );
}