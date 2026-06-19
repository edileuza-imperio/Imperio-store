"use client";

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

import {
  buscarItensVitrineComProdutos,
  buscarVitrine,
  descricaoDoItem,
  ehVitrineCampanha,
  formatarData,
  formatarPreco,
  nomeDoItem,
  removerItemVitrine,
  statusTexto,
  tipoDoItem,
  type Vitrine,
  type VitrineItem,
} from "../services/vitrineDetalheService";

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

      const vitrineData = await buscarVitrine(id);

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

      const lista = await buscarItensVitrineComProdutos(id);

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

  const ehVitrineDeCampanhas = useMemo(() => {
    return ehVitrineCampanha(vitrine);
  }, [vitrine]);

  const textoItens = ehVitrineDeCampanhas ? "campanhas" : "produtos";
  const textoItemSingular = ehVitrineDeCampanhas ? "campanha" : "produto";

  const linkAdicionarItem = useMemo(() => {
    if (!vitrine) return "#";

    const base = `/sistema/vitrines/${vitrine.id_vitrine}/itens/cadastrar`;

    return ehVitrineDeCampanhas
      ? `${base}?tipo=campanha`
      : `${base}?tipo=produto`;
  }, [vitrine, ehVitrineDeCampanhas]);

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

    router.push(
      `/sistema/vitrines/${vitrine.id_vitrine}/itens/${itemSelecionado}/editar`
    );
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

      await removerItemVitrine(itemId);
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
        <div className="vitrine-detalhe-loading">
          <span />
          <p>Carregando vitrine...</p>
        </div>
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
      <header className="vitrine-detalhe-hero">
        <div className="vitrine-detalhe-hero-content">
          <Link href="/sistema/vitrines" className="vitrine-detalhe-back">
            <FiArrowLeft />
            Voltar para vitrines
          </Link>

          <div className="vitrine-detalhe-title-row">
            <div className="vitrine-detalhe-hero-icon">
              <FiGrid />
            </div>

            <div>
              <span className="vitrine-detalhe-label">Vitrine</span>

              <h1>{vitrine.titulo || vitrine.nome}</h1>

              <p>
                {vitrine.subtitulo ||
                  `Organize e destaque seus ${textoItens} no site.`}
              </p>
            </div>
          </div>
        </div>

        <div className="vitrine-detalhe-hero-actions">
          <button
            type="button"
            onClick={carregarTudo}
            className="vitrine-detalhe-action-secondary"
          >
            <FiRefreshCw />
            Atualizar
          </button>

          <Link
            href={`/sistema/vitrines/${vitrine.id_vitrine}/editar`}
            className="vitrine-detalhe-action-primary"
          >
            <FiEdit />
            Editar vitrine
          </Link>
        </div>
      </header>

      <section className="vitrine-detalhe-resumo-grid">
        <div className="vitrine-detalhe-resumo-card">
          <span>Total de {textoItens}</span>
          <strong>{resumo.total}</strong>
          <small>Cadastrados na vitrine</small>
        </div>

        <div className="vitrine-detalhe-resumo-card">
          <span>Ativos</span>
          <strong>{resumo.ativos}</strong>
          <small>Aparecendo no site</small>
        </div>

        <div className="vitrine-detalhe-resumo-card">
          <span>Inativos</span>
          <strong>{resumo.inativos}</strong>
          <small>Ocultos da vitrine</small>
        </div>

        <div className="vitrine-detalhe-resumo-card">
          <span>Tipo</span>
          <strong>{vitrine.tipo || "Produto"}</strong>
          <small>Formato da vitrine</small>
        </div>
      </section>

      <section className="vitrine-detalhe-section-title">
        <div>
          <h2>
            <FiLayers />
            {ehVitrineDeCampanhas ? "Campanhas da vitrine" : "Produtos da vitrine"}
          </h2>

          <p>
            {resumo.total} {textoItens} cadastrados • Página {paginaAtual} de{" "}
            {totalPaginas}
          </p>
        </div>

        <Link href={linkAdicionarItem} className="vitrine-detalhe-add-inline">
          <FiPlus />
          Adicionar {textoItemSingular}
        </Link>
      </section>

      {itemSelecionado && (
        <div className="vitrine-detalhe-selected-alert">
          <FiCheckCircle />
          Item selecionado para ação.
        </div>
      )}

      {loadingItens ? (
        <div className="vitrine-detalhe-loading vitrine-detalhe-loading-small">
          <span />
          <p>Carregando itens...</p>
        </div>
      ) : itens.length === 0 ? (
        <div className="vitrine-detalhe-empty">
          <FiPackage />

          <strong>
            {ehVitrineDeCampanhas
              ? "Nenhuma campanha adicionada"
              : "Nenhum produto adicionado"}
          </strong>

          <span>
            {ehVitrineDeCampanhas
              ? "Selecione campanhas promocionais para aparecerem nesta vitrine."
              : "Selecione produtos para aparecerem nesta vitrine."}
          </span>

          <Link href={linkAdicionarItem} className="vitrine-detalhe-empty-button">
            <FiPlus />
            Adicionar {textoItemSingular}
          </Link>
        </div>
      ) : (
        <>
          <section className="vitrine-detalhe-grid">
            {itensPaginados.map((item) => {
              const selecionado = itemSelecionado === item.id_vitrine_item;
              const ativo = Number(item.status_id) === 1;
              const preco = formatarPreco(item.produto_preco);

              return (
                <article
                  key={item.id_vitrine_item}
                  className={`vitrine-detalhe-card ${
                    selecionado ? "vitrine-detalhe-card-selected" : ""
                  }`}
                  onClick={() => selecionarItem(item.id_vitrine_item)}
                >
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

                    <p>{descricaoDoItem(item, textoItemSingular)}</p>
                  </div>

                  <div className="vitrine-detalhe-clean-meta">
                    <div>
                      <span>ID da vitrine</span>
                      <strong>#{item.id_vitrine_item}</strong>
                    </div>

                    {item.produto_id && (
                      <div>
                        <span>ID produto</span>
                        <strong>#{item.produto_id}</strong>
                      </div>
                    )}

                    {preco && (
                      <div>
                        <span>Preço</span>
                        <strong>{preco}</strong>
                      </div>
                    )}
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
                  Página <strong>{paginaAtual}</strong> de{" "}
                  <strong>{totalPaginas}</strong>
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
                  {Number(vitrine.status_id) === 1 ? (
                    <FiCheckCircle />
                  ) : (
                    <FiXCircle />
                  )}
                  {statusTexto(vitrine.status_id)}
                </span>

                <span className="vitrine-detalhe-slug">/{vitrine.slug}</span>
              </div>

              <h4>{vitrine.titulo || vitrine.nome}</h4>

              <p>
                {vitrine.subtitulo ||
                  "Sem subtítulo cadastrado para esta vitrine."}
              </p>
            </div>
          </div>

          <div className="vitrine-detalhe-info-grid">
            <div>
              <span>Tipo</span>
              <strong>{vitrine.tipo || "—"}</strong>
            </div>

            <div>
              <span>Total</span>
              <strong>{resumo.total}</strong>
            </div>

            <div>
              <span>Ativos</span>
              <strong>{resumo.ativos}</strong>
            </div>

            <div>
              <span>Inativos</span>
              <strong>{resumo.inativos}</strong>
            </div>

            <div>
              <span>Criada em</span>
              <strong>{formatarData(vitrine.criado_em)}</strong>
            </div>

            <div>
              <span>Atualizada em</span>
              <strong>{formatarData(vitrine.atualizado_em)}</strong>
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
          href={linkAdicionarItem}
          className="vitrine-detalhe-floating vitrine-detalhe-floating-add"
          aria-label={`Adicionar ${textoItemSingular}`}
          title={`Adicionar ${textoItemSingular}`}
        >
          <FiPlus />
        </Link>
      </div>
    </main>
  );
}