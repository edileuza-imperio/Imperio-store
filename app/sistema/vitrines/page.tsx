"use client";

import api from "@/Api/conectar";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiEye,
  FiGrid,
  FiPlus,
  FiEdit,
  FiLayers,
  FiCheckCircle,
  FiXCircle,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
} from "react-icons/fi";

import "../../../components/styles/sistema/vitrines.css";
import CadastrarVitrineModal from "@/components/pages/vitrine/Modal/CadastrarVitrineModal";

type Vitrine = {
  id_vitrine: number;
  nome: string;
  slug: string;
  titulo?: string | null;
  subtitulo?: string | null;
  tipo?: string | null;
  status_id: number;
  nivel_id?: number;
  ordem?: number;
  criado_em?: string | null;
};

const LIMITE_POR_PAGINA = 3;

export default function VitrinesPage() {
  const router = useRouter();

  const [vitrines, setVitrines] = useState<Vitrine[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [vitrineSelecionada, setVitrineSelecionada] = useState<number | null>(
    null
  );
  const [modalCadastrarAberto, setModalCadastrarAberto] = useState(false);

  useEffect(() => {
    carregarVitrines();
  }, []);

  async function carregarVitrines() {
    try {
      setLoading(true);

      const response = await api.get("/vitrines");
      const data = response.data;

      const lista = Array.isArray(data?.dados?.vitrines)
        ? data.dados.vitrines
        : Array.isArray(data?.vitrines)
          ? data.vitrines
          : Array.isArray(data?.dados)
            ? data.dados
            : Array.isArray(data)
              ? data
              : [];

      setVitrines(lista);
    } catch (error) {
      console.error("Erro ao carregar vitrines:", error);
      setVitrines([]);
    } finally {
      setLoading(false);
    }
  }

  const totalAtivas = useMemo(() => {
    return vitrines.filter((vitrine) => Number(vitrine.status_id) === 1).length;
  }, [vitrines]);

  const totalPaginas = useMemo(() => {
    return Math.max(1, Math.ceil(vitrines.length / LIMITE_POR_PAGINA));
  }, [vitrines.length]);

  const vitrinesExibidas = useMemo(() => {
    const inicio = (paginaAtual - 1) * LIMITE_POR_PAGINA;
    const fim = inicio + LIMITE_POR_PAGINA;

    return vitrines.slice(inicio, fim);
  }, [vitrines, paginaAtual]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  function selecionarVitrine(id: number) {
    setVitrineSelecionada((atual) => (atual === id ? null : id));
  }

  function verSelecionada() {
    if (!vitrineSelecionada) {
      alert("Selecione uma vitrine para visualizar.");
      return;
    }

    router.push(`/sistema/vitrines/${vitrineSelecionada}`);
  }

  function editarSelecionada() {
    if (!vitrineSelecionada) {
      alert("Selecione uma vitrine para editar.");
      return;
    }

    router.push(`/sistema/vitrines/${vitrineSelecionada}/editar`);
  }

  async function excluirSelecionada() {
    if (!vitrineSelecionada) {
      alert("Selecione uma vitrine para excluir.");
      return;
    }

    const confirmar = confirm("Deseja realmente excluir esta vitrine?");

    if (!confirmar) {
      return;
    }

    try {
      await api.delete(`/vitrine/${vitrineSelecionada}`);

      await carregarVitrines();

      setVitrineSelecionada(null);
      setPaginaAtual(1);

      alert("Vitrine excluída com sucesso.");
    } catch (error: any) {
      console.error("Erro ao excluir vitrine:", error);

      alert(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          "Erro ao excluir vitrine."
      );
    }
  }

  function voltarPagina() {
    setPaginaAtual((pagina) => Math.max(1, pagina - 1));
    setVitrineSelecionada(null);
  }

  function avancarPagina() {
    setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1));
    setVitrineSelecionada(null);
  }

  function formatarData(data?: string | null) {
    if (!data) return "—";

    const dataConvertida = new Date(data.replace(" ", "T"));

    if (Number.isNaN(dataConvertida.getTime())) {
      return data;
    }

    return dataConvertida.toLocaleString("pt-BR");
  }

  function statusTexto(statusId: number) {
    return Number(statusId) === 1 ? "Ativa" : "Inativa";
  }

  async function aoCadastrarVitrine() {
    await carregarVitrines();
    setPaginaAtual(1);
    setVitrineSelecionada(null);
  }

  if (loading) {
    return <div className="vitrines-loading">Carregando vitrines...</div>;
  }

  return (
    <main className="vitrines-container">
      <header className="vitrines-header">
        <div>
          <h1>
            <FiGrid />
            Vitrines
          </h1>

          <p>Selecione uma vitrine para visualizar ou editar.</p>
        </div>

        <div className="vitrines-stats">
          <span>{vitrines.length} vitrines</span>
          <span>{totalAtivas} ativas</span>
        </div>
      </header>

      {vitrineSelecionada && (
        <div className="vitrines-selected-alert">
          <FiCheckCircle />
          Vitrine selecionada para ação.
        </div>
      )}

      {vitrines.length === 0 ? (
        <div className="vitrines-empty">
          <FiLayers />
          <strong>Nenhuma vitrine encontrada</strong>
          <span>Cadastre sua primeira vitrine para exibir produtos no site.</span>

          <button
            type="button"
            onClick={() => setModalCadastrarAberto(true)}
            className="vitrines-empty-button"
          >
            <FiPlus />
            Cadastrar vitrine
          </button>
        </div>
      ) : (
        <>
          <section className="vitrines-grid">
            {vitrinesExibidas.map((vitrine) => {
              const selecionada = vitrineSelecionada === vitrine.id_vitrine;
              const ativa = Number(vitrine.status_id) === 1;

              return (
                <article
                  key={vitrine.id_vitrine}
                  className={`vitrines-card ${
                    selecionada ? "vitrines-card-selected" : ""
                  }`}
                  onClick={() => selecionarVitrine(vitrine.id_vitrine)}
                >
                  <label
                    className="vitrines-checkbox"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selecionada}
                      onChange={() => selecionarVitrine(vitrine.id_vitrine)}
                    />
                    <span />
                  </label>

                  <div className="vitrines-card-top">
                    <div className="vitrines-icon-box">
                      <FiGrid />
                    </div>

                    <span
                      className={`vitrines-badge ${
                        ativa
                          ? "vitrines-status-ativo"
                          : "vitrines-status-inativo"
                      }`}
                    >
                      {ativa ? <FiCheckCircle /> : <FiXCircle />}
                      {statusTexto(vitrine.status_id)}
                    </span>
                  </div>

                  <div className="vitrines-card-body">
                    <strong>{vitrine.nome}</strong>
                    <span className="vitrines-slug">/{vitrine.slug}</span>

                    <h2>{vitrine.titulo || "Sem título"}</h2>
                    <p>{vitrine.subtitulo || "Sem subtítulo cadastrado."}</p>
                  </div>

                  <div className="vitrines-meta">
                    <div>
                      <span>Tipo</span>
                      <strong>{vitrine.tipo || "—"}</strong>
                    </div>

                    <div>
                      <span>Ordem</span>
                      <strong>{vitrine.ordem ?? "—"}</strong>
                    </div>

                    <div>
                      <span>Criado em</span>
                      <strong>{formatarData(vitrine.criado_em)}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <div className="vitrines-pagination">
            <button
              type="button"
              onClick={voltarPagina}
              disabled={paginaAtual === 1}
            >
              <FiChevronLeft />
              Voltar
            </button>

            <span>
              Página {paginaAtual} de {totalPaginas}
            </span>

            <button
              type="button"
              onClick={avancarPagina}
              disabled={paginaAtual === totalPaginas}
            >
              Próxima
              <FiChevronRight />
            </button>
          </div>
        </>
      )}

      <div className="vitrines-floating-group">
        <button
          type="button"
          onClick={verSelecionada}
          className="vitrines-floating vitrines-floating-view"
          aria-label="Ver vitrine"
        >
          <FiEye />
        </button>

        <button
          type="button"
          onClick={editarSelecionada}
          className="vitrines-floating vitrines-floating-edit"
          aria-label="Editar vitrine"
        >
          <FiEdit />
        </button>

        <button
          type="button"
          onClick={excluirSelecionada}
          className="vitrines-floating vitrines-floating-delete"
          aria-label="Excluir vitrine"
        >
          <FiTrash2 />
        </button>

        <button
          type="button"
          onClick={() => setModalCadastrarAberto(true)}
          className="vitrines-floating vitrines-floating-add"
          aria-label="Cadastrar vitrine"
        >
          <FiPlus />
        </button>
      </div>

      <CadastrarVitrineModal
        aberto={modalCadastrarAberto}
        onFechar={() => setModalCadastrarAberto(false)}
        onCadastrado={aoCadastrarVitrine}
      />
    </main>
  );
}