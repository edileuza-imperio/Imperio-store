"use client";

import api from "@/Api/conectar";
import CadastrarVitrineModal from "@/components/pages/vitrine/Modal/CadastrarVitrineModal";
import "../../../components/styles/sistema/vitrines.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiEye,
  FiGrid,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";

type Vitrine = {
  id_vitrine: number;
  nome: string;
  slug: string;
  titulo?: string | null;
  subtitulo?: string | null;
  tipo?: string | null;
  status_id: number | string;
  nivel_id?: number | string | null;
  ordem?: number | string | null;
  criado_em?: string | null;
};

const LIMITE_POR_PAGINA = 3;

export default function VitrinesPage() {
  const router = useRouter();

  const [vitrines, setVitrines] = useState<Vitrine[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
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
      setErro("");

      const response = await api.get("/painel/vitrines");
      const lista = extrairListaVitrines(response.data);

      setVitrines(lista);
      setPaginaAtual(1);
      setVitrineSelecionada(null);
    } catch (error: any) {
      console.error("Erro ao carregar vitrines:", error);

      setVitrines([]);
      setErro(
        error?.response?.data?.mensagem ||
          error?.response?.data?.erro ||
          "Erro ao carregar vitrines."
      );
    } finally {
      setLoading(false);
    }
  }

  function extrairListaVitrines(data: any): Vitrine[] {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.dados?.vitrines)) {
      return data.dados.vitrines;
    }

    if (Array.isArray(data?.dados?.data)) {
      return data.dados.data;
    }

    if (Array.isArray(data?.dados?.items)) {
      return data.dados.items;
    }

    if (Array.isArray(data?.dados)) {
      return data.dados;
    }

    if (Array.isArray(data?.vitrines)) {
      return data.vitrines;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  }

  const totalAtivas = useMemo(() => {
    return vitrines.filter((vitrine) => Number(vitrine.status_id) === 1).length;
  }, [vitrines]);

  const totalInativas = useMemo(() => {
    return vitrines.filter((vitrine) => Number(vitrine.status_id) !== 1).length;
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

    const confirmar = window.confirm("Deseja realmente excluir esta vitrine?");

    if (!confirmar) {
      return;
    }

    try {
      await api.delete(`/painel/vitrine/${vitrineSelecionada}`);

      await carregarVitrines();

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
    if (!data) {
      return "—";
    }

    const dataConvertida = new Date(data.replace(" ", "T"));

    if (Number.isNaN(dataConvertida.getTime())) {
      return data;
    }

    return dataConvertida.toLocaleString("pt-BR");
  }

  function statusTexto(statusId: number | string) {
    return Number(statusId) === 1 ? "Ativa" : "Inativa";
  }

  async function aoCadastrarVitrine() {
    setModalCadastrarAberto(false);
    await carregarVitrines();
  }

  if (loading) {
    return (
      <main className="vitrines-container">
        <div className="vitrines-loading">Carregando vitrines...</div>
      </main>
    );
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
          <span>{totalInativas} inativas</span>
        </div>
      </header>

      {erro && (
        <div className="vitrines-selected-alert">
          <FiXCircle />
          {erro}
        </div>
      )}

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

          <span>
            {erro
              ? "Não foi possível carregar as vitrines. Tente atualizar."
              : "Cadastre sua primeira vitrine para exibir produtos no site."}
          </span>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={carregarVitrines}
              className="vitrines-empty-button"
            >
              <FiRefreshCw />
              Atualizar
            </button>

            <button
              type="button"
              onClick={() => setModalCadastrarAberto(true)}
              className="vitrines-empty-button"
            >
              <FiPlus />
              Cadastrar vitrine
            </button>
          </div>
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
                    <strong>{vitrine.nome || "Vitrine sem nome"}</strong>

                    <span className="vitrines-slug">
                      /{vitrine.slug || "sem-slug"}
                    </span>

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
          onClick={carregarVitrines}
          className="vitrines-floating vitrines-floating-view"
          aria-label="Atualizar vitrines"
          title="Atualizar vitrines"
        >
          <FiRefreshCw />
        </button>

        <button
          type="button"
          onClick={verSelecionada}
          className="vitrines-floating vitrines-floating-view"
          aria-label="Ver vitrine"
          title="Ver vitrine"
        >
          <FiEye />
        </button>

        <button
          type="button"
          onClick={editarSelecionada}
          className="vitrines-floating vitrines-floating-edit"
          aria-label="Editar vitrine"
          title="Editar vitrine"
        >
          <FiEdit />
        </button>

        <button
          type="button"
          onClick={excluirSelecionada}
          className="vitrines-floating vitrines-floating-delete"
          aria-label="Excluir vitrine"
          title="Excluir vitrine"
        >
          <FiTrash2 />
        </button>

        <button
          type="button"
          onClick={() => setModalCadastrarAberto(true)}
          className="vitrines-floating vitrines-floating-add"
          aria-label="Cadastrar vitrine"
          title="Cadastrar vitrine"
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