"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiEdit,
  FiEye,
  FiGrid,
  FiInfo,
  FiLayers,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";

import "../../../../components/styles/sistema/vitrine-detalhe.css";

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
  atualizado_em?: string | null;
};

type VitrineItem = {
  id_vitrine_item: number;
  vitrine_id: number;
  produto_id?: number | null;
  campanha_id?: number | null;
  categoria_id?: number | null;
  titulo_personalizado?: string | null;
  subtitulo_personalizado?: string | null;
  imagem_personalizada?: string | null;
  status_id: number;
  nivel_id?: number;
  criado_em?: string | null;
  atualizado_em?: string | null;
  produto_nome?: string | null;
  campanha_nome?: string | null;
  categoria_nome?: string | null;
};

export default function VitrineDetalhePage() {
  const params = useParams();
  const router = useRouter();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [vitrine, setVitrine] = useState<Vitrine | null>(null);
  const [itens, setItens] = useState<VitrineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItens, setLoadingItens] = useState(false);
  const [removendoItem, setRemovendoItem] = useState<number | null>(null);
  const [itemSelecionado, setItemSelecionado] = useState<number | null>(null);
  const [mostrarInfo, setMostrarInfo] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const itensPorPagina = 3;

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setPaginaAtual(1);
    setItemSelecionado(null);
    setMostrarInfo(false);
  }, [id]);

  async function carregarVitrine() {
    if (!id) return;

    try {
      setLoading(true);

      const response = await api.get(`/vitrine/${id}`);
      const data = response.data;

      const vitrineData =
        data?.dados?.vitrine ??
        data?.vitrine ??
        data?.dados ??
        data ??
        null;

      setVitrine(vitrineData);
    } catch (error) {
      console.error("Erro ao carregar vitrine:", error);
      setVitrine(null);
    } finally {
      setLoading(false);
    }
  }

  async function carregarItens() {
    if (!id) return;

    try {
      setLoadingItens(true);

      const response = await api.get(`/vitrine/${id}/itens`);
      const data = response.data;

      const lista = Array.isArray(data?.dados?.itens)
        ? data.dados.itens
        : Array.isArray(data?.itens)
          ? data.itens
          : Array.isArray(data?.dados)
            ? data.dados
            : Array.isArray(data)
              ? data
              : [];

      setItens(lista);
    } catch (error) {
      console.error("Erro ao carregar itens da vitrine:", error);
      setItens([]);
    } finally {
      setLoadingItens(false);
    }
  }

  async function carregarTudo() {
    await Promise.all([carregarVitrine(), carregarItens()]);
  }

  const resumo = useMemo(() => {
    return {
      total: itens.length,
      ativos: itens.filter((item) => Number(item.status_id) === 1).length,
      inativos: itens.filter((item) => Number(item.status_id) !== 1).length,
    };
  }, [itens]);

  const totalPaginas = useMemo(() => {
    return Math.max(1, Math.ceil(itens.length / itensPorPagina));
  }, [itens.length]);

  const itensPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;

    return itens.slice(inicio, fim);
  }, [itens, paginaAtual]);

  useEffect(() => {
    if (paginaAtual > totalPaginas) {
      setPaginaAtual(totalPaginas);
    }
  }, [paginaAtual, totalPaginas]);

  function formatarData(data?: string | null) {
    if (!data) return "—";

    const dataConvertida = new Date(data.replace(" ", "T"));

    if (Number.isNaN(dataConvertida.getTime())) {
      return data;
    }

    return dataConvertida.toLocaleString("pt-BR");
  }

  function statusTexto(statusId?: number) {
    return Number(statusId) === 1 ? "Ativo" : "Inativo";
  }

  function nomeDoItem(item: VitrineItem) {
    return (
      item.titulo_personalizado ||
      item.produto_nome ||
      item.campanha_nome ||
      item.categoria_nome ||
      (item.produto_id ? `Produto #${item.produto_id}` : null) ||
      (item.campanha_id ? `Campanha #${item.campanha_id}` : null) ||
      (item.categoria_id ? `Categoria #${item.categoria_id}` : null) ||
      `Item #${item.id_vitrine_item}`
    );
  }

  function tipoDoItem(item: VitrineItem) {
    if (item.produto_id) return "Produto";
    if (item.campanha_id) return "Campanha";
    if (item.categoria_id) return "Categoria";
    return "Personalizado";
  }

  function selecionarItem(idItem: number) {
    setItemSelecionado((atual) => (atual === idItem ? null : idItem));
  }

  function mudarPagina(novaPagina: number) {
    if (novaPagina < 1 || novaPagina > totalPaginas) return;

    setPaginaAtual(novaPagina);
    setItemSelecionado(null);
  }

  function verItemSelecionado() {
    if (!vitrine || !itemSelecionado) {
      alert("Selecione um item para visualizar.");
      return;
    }

    router.push(`/sistema/vitrines/${vitrine.id_vitrine}/itens/${itemSelecionado}`);
  }

  function editarItemSelecionado() {
    if (!vitrine || !itemSelecionado) {
      alert("Selecione um item para editar.");
      return;
    }

    router.push(`/sistema/vitrines/${vitrine.id_vitrine}/itens/${itemSelecionado}/editar`);
  }

  async function excluirItemSelecionado() {
    if (!itemSelecionado) {
      alert("Selecione um item para remover.");
      return;
    }

    await excluirItem(itemSelecionado);
    setItemSelecionado(null);
  }

  async function excluirItem(itemId: number) {
    const confirmar = window.confirm("Deseja remover este item da vitrine?");

    if (!confirmar) return;

    try {
      setRemovendoItem(itemId);

      await api.delete(`/vitrine/item/${itemId}`);
      await carregarItens();
    } catch (error: any) {
      console.error("Erro ao remover item:", error);

      const mensagem =
        error?.response?.data?.mensagem ||
        error?.response?.data?.erro ||
        "Erro ao remover item da vitrine.";

      alert(mensagem);
    } finally {
      setRemovendoItem(null);
    }
  }

  if (loading) {
    return (
      <main className="vitrine-detalhe-container">
        <p className="vitrine-detalhe-info">Carregando vitrine...</p>
      </main>
    );
  }

  if (!vitrine) {
    return (
      <main className="vitrine-detalhe-container">
        <div className="vitrine-detalhe-empty">
          <FiGrid />
          <strong>Vitrine não encontrada</strong>
          <span>Não conseguimos localizar essa vitrine.</span>

          <Link href="/sistema/vitrines" className="vitrine-detalhe-empty-button">
            <FiArrowLeft />
            Voltar para vitrines
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="vitrine-detalhe-container">
      <header className="vitrine-detalhe-header">
        <div>
          <Link href="/sistema/vitrines" className="vitrine-detalhe-back">
            <FiArrowLeft />
            Voltar para vitrines
          </Link>

          <h1>
            <FiGrid />
            {vitrine.nome}
          </h1>

          <p>Gerencie os itens exibidos nesta vitrine.</p>
        </div>

        <button type="button" onClick={carregarTudo} className="vitrine-detalhe-refresh">
          <FiRefreshCw />
          Atualizar
        </button>
      </header>

      <section className="vitrine-detalhe-section-title">
        <div>
          <h2>
            <FiLayers />
            Itens da vitrine
          </h2>

          <p>
            {itens.length} itens cadastrados • Página {paginaAtual} de {totalPaginas}
          </p>
        </div>

        {itens.length > itensPorPagina && (
          <div className="vitrine-detalhe-page-select">
            <span>Página</span>

            <select
              value={paginaAtual}
              onChange={(e) => mudarPagina(Number(e.target.value))}
            >
              {Array.from({ length: totalPaginas }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {index + 1} de {totalPaginas}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {itemSelecionado && (
        <div className="vitrine-detalhe-selected-alert">
          <FiCheckCircle />
          Item selecionado para ação.
        </div>
      )}

      {loadingItens ? (
        <p className="vitrine-detalhe-info">Carregando itens...</p>
      ) : itens.length === 0 ? (
        <div className="vitrine-detalhe-empty">
          <FiPackage />
          <strong>Nenhum item cadastrado</strong>
          <span>Adicione produtos, campanhas ou categorias nesta vitrine.</span>

          <Link
            href={`/sistema/vitrines/${vitrine.id_vitrine}/itens/cadastrar`}
            className="vitrine-detalhe-empty-button"
          >
            <FiPlus />
            Adicionar primeiro item
          </Link>
        </div>
      ) : (
        <>
          <section className="vitrine-detalhe-grid">
            {itensPaginados.map((item) => {
              const selecionado = itemSelecionado === item.id_vitrine_item;
              const ativo = Number(item.status_id) === 1;

              return (
                <article
                  key={item.id_vitrine_item}
                  className={`vitrine-detalhe-card ${
                    selecionado ? "vitrine-detalhe-card-selected" : ""
                  }`}
                  onClick={() => selecionarItem(item.id_vitrine_item)}
                >
                  <label
                    className="vitrine-detalhe-checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selecionado}
                      onChange={() => selecionarItem(item.id_vitrine_item)}
                    />
                    <span />
                  </label>

                  <div className="vitrine-detalhe-card-top">
                    <div className="vitrine-detalhe-card-icon">
                      <FiPackage />
                    </div>

                    <span
                      className={`vitrine-detalhe-badge ${
                        ativo
                          ? "vitrine-detalhe-status-ativo"
                          : "vitrine-detalhe-status-inativo"
                      }`}
                    >
                      {ativo ? <FiCheckCircle /> : <FiXCircle />}
                      {statusTexto(item.status_id)}
                    </span>
                  </div>

                  <div className="vitrine-detalhe-card-body">
                    <span className="vitrine-detalhe-type">{tipoDoItem(item)}</span>

                    <strong>{nomeDoItem(item)}</strong>

                    <p>
                      {item.subtitulo_personalizado ||
                        "Sem descrição personalizada para este item."}
                    </p>
                  </div>

                  <div className="vitrine-detalhe-meta">
                    <div>
                      <span>ID</span>
                      <strong>#{item.id_vitrine_item}</strong>
                    </div>

                    <div>
                      <span>Produto</span>
                      <strong>{item.produto_id ?? "—"}</strong>
                    </div>

                    <div>
                      <span>Campanha</span>
                      <strong>{item.campanha_id ?? "—"}</strong>
                    </div>

                    <div>
                      <span>Categoria</span>
                      <strong>{item.categoria_id ?? "—"}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {itens.length > itensPorPagina && (
            <div className="vitrine-detalhe-pagination">
              <button
                type="button"
                disabled={paginaAtual === 1}
                onClick={() => mudarPagina(paginaAtual - 1)}
              >
                <FiChevronLeft />
                Anterior
              </button>

              <div className="vitrine-detalhe-pagination-center">
                <span>
                  Página <strong>{paginaAtual}</strong> de <strong>{totalPaginas}</strong>
                </span>

                <select
                  value={paginaAtual}
                  onChange={(e) => mudarPagina(Number(e.target.value))}
                >
                  {Array.from({ length: totalPaginas }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      Página {index + 1}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={paginaAtual === totalPaginas}
                onClick={() => mudarPagina(paginaAtual + 1)}
              >
                Próxima
                <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {mostrarInfo && (
        <div className="vitrine-detalhe-info-popup">
          <div className="vitrine-detalhe-info-popup-header">
            <div>
              <span>Resumo</span>
              <h3>Informações da vitrine</h3>
            </div>

            <button type="button" onClick={() => setMostrarInfo(false)}>
              <FiXCircle />
            </button>
          </div>

          <div className="vitrine-detalhe-info-cover">
            <div className="vitrine-detalhe-info-cover-icon">
              <FiGrid />
            </div>

            <div>
              <div className="vitrine-detalhe-info-tags">
                <span
                  className={`vitrine-detalhe-badge ${
                    Number(vitrine.status_id) === 1
                      ? "vitrine-detalhe-status-ativo"
                      : "vitrine-detalhe-status-inativo"
                  }`}
                >
                  {Number(vitrine.status_id) === 1 ? <FiCheckCircle /> : <FiXCircle />}
                  {statusTexto(vitrine.status_id)}
                </span>

                <span className="vitrine-detalhe-slug">/{vitrine.slug}</span>
              </div>

              <h4>{vitrine.titulo || vitrine.nome}</h4>

              <p>
                {vitrine.subtitulo || "Sem subtítulo cadastrado para esta vitrine."}
              </p>
            </div>
          </div>

          <div className="vitrine-detalhe-info-grid">
            <div>
              <span>Tipo</span>
              <strong>{vitrine.tipo || "—"}</strong>
            </div>

            <div>
              <span>Ordem</span>
              <strong>{vitrine.ordem ?? "—"}</strong>
            </div>

            <div>
              <span>Nível</span>
              <strong>{vitrine.nivel_id ?? "—"}</strong>
            </div>

            <div>
              <span>Total de itens</span>
              <strong>{resumo.total}</strong>
            </div>

            <div>
              <span>Itens ativos</span>
              <strong>{resumo.ativos}</strong>
            </div>

            <div>
              <span>Itens inativos</span>
              <strong>{resumo.inativos}</strong>
            </div>

            <div>
              <span>Criada em</span>
              <strong>{formatarData(vitrine.criado_em)}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="vitrine-detalhe-floating-group">
        <button
          type="button"
          onClick={() => setMostrarInfo((atual) => !atual)}
          className="vitrine-detalhe-floating vitrine-detalhe-floating-info-button"
          aria-label="Informações da vitrine"
        >
          <FiInfo />
        </button>

        <button
          type="button"
          onClick={verItemSelecionado}
          className="vitrine-detalhe-floating vitrine-detalhe-floating-view"
          aria-label="Ver item"
        >
          <FiEye />
        </button>

        <button
          type="button"
          onClick={editarItemSelecionado}
          className="vitrine-detalhe-floating vitrine-detalhe-floating-edit"
          aria-label="Editar item"
        >
          <FiEdit />
        </button>

        <button
          type="button"
          onClick={excluirItemSelecionado}
          className="vitrine-detalhe-floating vitrine-detalhe-floating-delete"
          aria-label="Remover item"
          disabled={!!removendoItem}
        >
          <FiTrash2 />
        </button>

        <Link
          href={`/sistema/vitrines/${vitrine.id_vitrine}/itens/cadastrar`}
          className="vitrine-detalhe-floating vitrine-detalhe-floating-add"
          aria-label="Adicionar item"
        >
          <FiPlus />
        </Link>
      </div>
    </main>
  );
}