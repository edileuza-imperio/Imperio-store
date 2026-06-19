"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiGrid,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSave,
  FiSearch,
  FiXCircle,
} from "react-icons/fi";

import "../../../../../../components/styles/sistema/vitrine-detalhe.css";

import {
  getCampanhaId,
  getCampanhaTitulo,
  getProdutoId,
  getProdutoTitulo,
  getStatusId,
  TipoItem,
} from "../../../services/vitrineItemService";

import { useVitrineItens } from "../../../services/Hooks/useVitrineItens";

export default function CadastrarItemVitrinePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const tipoParam = searchParams.get("tipo");

  const tipo: TipoItem =
    tipoParam === "produto" || tipoParam === "campanha"
      ? tipoParam
      : "produto";

  const {
    vitrineId,
    ehCampanha,
    ehProduto,
    campanhasFiltradas,
    produtosFiltrados,
    totalEncontrados,
    selecionadas,
    busca,
    loading,
    salvando,
    setBusca,
    carregarItens,
    atualizarLista,
    alternarSelecao,
    salvarItens,
  } = useVitrineItens({
    id,
    tipo,
    onSucesso: () => {
      router.push(`/sistema/vitrines/${vitrineId}`);
    },
  });

  useEffect(() => {
    if (!id) return;

    carregarItens();
  }, [id, tipo]);

  if (!ehCampanha && !ehProduto) {
    return (
      <main className="vitrine-detalhe-container">
        <div className="vitrine-detalhe-empty">
          <FiGrid />
          <strong>Tipo de item inválido</strong>
          <span>Use ?tipo=campanha ou ?tipo=produto na URL.</span>

          <Link
            href={`/sistema/vitrines/${vitrineId}`}
            className="vitrine-detalhe-empty-button"
          >
            <FiArrowLeft />
            Voltar para vitrine
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="vitrine-detalhe-container">
      <header className="vitrine-detalhe-header">
        <div>
          <Link
            href={`/sistema/vitrines/${vitrineId}`}
            className="vitrine-detalhe-back"
          >
            <FiArrowLeft />
            Voltar para vitrine
          </Link>

          <h1>
            {ehCampanha ? <FiGrid /> : <FiPackage />}
            {ehCampanha ? "Selecionar campanhas" : "Selecionar produtos"}
          </h1>

          <p>
            {ehCampanha
              ? "Escolha as campanhas promocionais que vão aparecer dentro desta vitrine."
              : "Escolha os produtos que vão aparecer dentro desta vitrine."}
          </p>
        </div>

        <button
          type="button"
          onClick={atualizarLista}
          className="vitrine-detalhe-refresh"
          disabled={loading}
        >
          <FiRefreshCw />
          Atualizar
        </button>
      </header>

      <section className="vitrine-detalhe-section-title">
        <div>
          <h2>{ehCampanha ? "Campanhas disponíveis" : "Produtos disponíveis"}</h2>

          <p>
            {totalEncontrados} {ehCampanha ? "campanhas" : "produtos"} encontrados •{" "}
            {selecionadas.length} selecionados
          </p>
        </div>

        <div className="vitrine-detalhe-page-select">
          <FiSearch />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={ehCampanha ? "Buscar campanha..." : "Buscar produto..."}
          />
        </div>
      </section>

      {selecionadas.length > 0 && (
        <div className="vitrine-detalhe-selected-alert">
          <FiCheckCircle />
          {selecionadas.length}{" "}
          {ehCampanha ? "campanha(s)" : "produto(s)"} selecionado(s).
        </div>
      )}

      {loading ? (
        <p className="vitrine-detalhe-info">
          {ehCampanha ? "Carregando campanhas..." : "Carregando produtos..."}
        </p>
      ) : ehCampanha && campanhasFiltradas.length === 0 ? (
        <div className="vitrine-detalhe-empty">
          <FiXCircle />
          <strong>Nenhuma campanha encontrada</strong>
          <span>Cadastre uma campanha primeiro para depois adicionar na vitrine.</span>

          <Link
            href="/sistema/campanhas/cadastrar"
            className="vitrine-detalhe-empty-button"
          >
            <FiPlus />
            Criar campanha
          </Link>
        </div>
      ) : ehProduto && produtosFiltrados.length === 0 ? (
        <div className="vitrine-detalhe-empty">
          <FiXCircle />
          <strong>Nenhum produto encontrado</strong>
          <span>Cadastre um produto primeiro para depois adicionar na vitrine.</span>

          <Link
            href="/sistema/produtos/cadastrar"
            className="vitrine-detalhe-empty-button"
          >
            <FiPlus />
            Criar produto
          </Link>
        </div>
      ) : (
        <section className="vitrine-detalhe-grid">
          {ehCampanha &&
            campanhasFiltradas.map((campanha) => {
              const campanhaId = getCampanhaId(campanha);
              const selecionada = selecionadas.includes(campanhaId);
              const ativa = getStatusId(campanha) === 1;

              return (
                <article
                  key={campanhaId}
                  onClick={() => alternarSelecao(campanhaId)}
                  className={`vitrine-detalhe-card ${
                    selecionada ? "vitrine-detalhe-card-selected" : ""
                  }`}
                >
                  <label
                    className="vitrine-detalhe-checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selecionada}
                      onChange={() => alternarSelecao(campanhaId)}
                    />
                    <span />
                  </label>

                  <div className="vitrine-detalhe-card-top">
                    <div className="vitrine-detalhe-card-icon">
                      <FiGrid />
                    </div>

                    <span
                      className={`vitrine-detalhe-badge ${
                        ativa
                          ? "vitrine-detalhe-status-ativo"
                          : "vitrine-detalhe-status-inativo"
                      }`}
                    >
                      {ativa ? <FiCheckCircle /> : <FiXCircle />}
                      {ativa ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <div className="vitrine-detalhe-card-body">
                    <span className="vitrine-detalhe-type">Campanha</span>
                    <strong>{getCampanhaTitulo(campanha)}</strong>
                    <p>{campanha.descricao || "Sem descrição cadastrada."}</p>
                  </div>

                  <div className="vitrine-detalhe-meta">
                    <div>
                      <span>ID</span>
                      <strong>#{campanhaId}</strong>
                    </div>

                    <div>
                      <span>Slug</span>
                      <strong>{campanha.slug || "—"}</strong>
                    </div>
                  </div>
                </article>
              );
            })}

          {ehProduto &&
            produtosFiltrados.map((produto) => {
              const produtoId = getProdutoId(produto);
              const selecionada = selecionadas.includes(produtoId);
              const ativo = getStatusId(produto) === 1;

              return (
                <article
                  key={produtoId}
                  onClick={() => alternarSelecao(produtoId)}
                  className={`vitrine-detalhe-card ${
                    selecionada ? "vitrine-detalhe-card-selected" : ""
                  }`}
                >
                  <label
                    className="vitrine-detalhe-checkbox"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selecionada}
                      onChange={() => alternarSelecao(produtoId)}
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
                      {ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className="vitrine-detalhe-card-body">
                    <span className="vitrine-detalhe-type">Produto</span>
                    <strong>{getProdutoTitulo(produto)}</strong>
                    <p>{produto.descricao || "Sem descrição cadastrada."}</p>
                  </div>

                  <div className="vitrine-detalhe-meta">
                    <div>
                      <span>ID</span>
                      <strong>#{produtoId}</strong>
                    </div>

                    <div>
                      <span>Slug</span>
                      <strong>{produto.slug || "—"}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
        </section>
      )}

      <div className="vitrine-detalhe-floating-group">
        <button
          type="button"
          onClick={salvarItens}
          className="vitrine-detalhe-floating vitrine-detalhe-floating-add"
          disabled={salvando || selecionadas.length === 0}
        >
          <FiSave />
        </button>
      </div>
    </main>
  );
}