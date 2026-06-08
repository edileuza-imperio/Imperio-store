"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiClock,
  FiEdit,
  FiEye,
  FiGrid,
  FiLayers,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiTag,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi";

import styles from "./VitrineDetalhe.module.css";

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

  useEffect(() => {
    carregarTudo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const resumo = useMemo(() => {
    return {
      total: itens.length,
      ativos: itens.filter((item) => Number(item.status_id) === 1).length,
      inativos: itens.filter((item) => Number(item.status_id) !== 1).length,
    };
  }, [itens]);

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

  function statusClasse(statusId?: number) {
    return Number(statusId) === 1 ? styles.statusAtivo : styles.statusInativo;
  }

  function statusIcone(statusId?: number) {
    return Number(statusId) === 1 ? <FiCheckCircle /> : <FiXCircle />;
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
      <main className={styles.container}>
        <p className={styles.info}>Carregando vitrine...</p>
      </main>
    );
  }

  if (!vitrine) {
    return (
      <main className={styles.container}>
        <div className={styles.empty}>
          <FiGrid />
          <strong>Vitrine não encontrada</strong>
          <span>Não conseguimos localizar essa vitrine.</span>

          <Link href="/sistema/vitrines" className={styles.emptyButton}>
            <FiArrowLeft />
            Voltar para vitrines
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/sistema/vitrines" className={styles.backLink}>
            <FiArrowLeft />
            Voltar para vitrines
          </Link>

          <h1 className={styles.title}>
            <FiGrid />
            {vitrine.nome}
          </h1>

          <p className={styles.subtitle}>
            Visualize os detalhes da vitrine e gerencie os itens exibidos nela.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={carregarTudo}
            className={styles.refreshButton}
          >
            <FiRefreshCw />
            Atualizar
          </button>

          <Link
            href={`/sistema/vitrines/${vitrine.id_vitrine}/editar`}
            className={styles.editHeaderButton}
          >
            <FiEdit />
            Editar vitrine
          </Link>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroIcon}>
          <FiGrid />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroTop}>
            <span className={`${styles.badge} ${statusClasse(vitrine.status_id)}`}>
              {statusIcone(vitrine.status_id)}
              {statusTexto(vitrine.status_id)}
            </span>

            <span className={styles.slug}>/{vitrine.slug}</span>
          </div>

          <h2>{vitrine.titulo || "Sem título cadastrado"}</h2>

          <p>{vitrine.subtitulo || "Sem subtítulo cadastrado para esta vitrine."}</p>
        </div>
      </section>

      <section className={styles.stats}>
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
          <span>Criada em</span>
          <strong>{formatarData(vitrine.criado_em)}</strong>
        </div>
      </section>

      <section className={styles.itemSummary}>
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
      </section>

      <section className={styles.sectionHeader}>
        <div>
          <h2>
            <FiLayers />
            Itens da vitrine
          </h2>
          <p>Produtos, campanhas ou categorias vinculadas nesta vitrine.</p>
        </div>

        <Link
          href={`/sistema/vitrines/${vitrine.id_vitrine}/itens/cadastrar`}
          className={styles.addItemButton}
        >
          <FiPlus />
          Adicionar item
        </Link>
      </section>

      {loadingItens ? (
        <p className={styles.info}>Carregando itens...</p>
      ) : itens.length === 0 ? (
        <div className={styles.emptyItems}>
          <FiPackage />
          <strong>Nenhum item cadastrado</strong>
          <span>Adicione produtos, campanhas ou categorias nesta vitrine.</span>

          <Link
            href={`/sistema/vitrines/${vitrine.id_vitrine}/itens/cadastrar`}
            className={styles.emptyButton}
          >
            <FiPlus />
            Adicionar primeiro item
          </Link>
        </div>
      ) : (
        <section className={styles.itemsGrid}>
          {itens.map((item) => (
            <article key={item.id_vitrine_item} className={styles.itemCard}>
              <div className={styles.itemTop}>
                <div className={styles.itemIcon}>
                  <FiPackage />
                </div>

                <span className={`${styles.badge} ${statusClasse(item.status_id)}`}>
                  {statusIcone(item.status_id)}
                  {statusTexto(item.status_id)}
                </span>
              </div>

              <div className={styles.itemBody}>
                <span className={styles.itemType}>{tipoDoItem(item)}</span>

                <strong>{nomeDoItem(item)}</strong>

                <p>
                  {item.subtitulo_personalizado ||
                    "Sem descrição personalizada para este item."}
                </p>
              </div>

              <div className={styles.itemMeta}>
                <div>
                  <span>ID do item</span>
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

              <div className={styles.itemActions}>
                <Link
                  href={`/sistema/vitrines/${vitrine.id_vitrine}/itens/${item.id_vitrine_item}`}
                  className={styles.viewButton}
                >
                  <FiEye />
                  Ver
                </Link>

                <Link
                  href={`/sistema/vitrines/${vitrine.id_vitrine}/itens/${item.id_vitrine_item}/editar`}
                  className={styles.editButton}
                >
                  <FiEdit />
                  Editar
                </Link>

                <button
                  type="button"
                  onClick={() => excluirItem(item.id_vitrine_item)}
                  className={styles.deleteButton}
                  disabled={removendoItem === item.id_vitrine_item}
                >
                  {removendoItem === item.id_vitrine_item ? (
                    <>
                      <FiRefreshCw />
                      Removendo...
                    </>
                  ) : (
                    <>
                      <FiTrash2 />
                      Remover
                    </>
                  )}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <Link
        href={`/sistema/vitrines/${vitrine.id_vitrine}/itens/cadastrar`}
        className={styles.floatButton}
      >
        <FiPlus />
        <span>Adicionar item</span>
      </Link>
    </main>
  );
}