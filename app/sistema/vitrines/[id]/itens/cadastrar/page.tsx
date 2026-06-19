"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

type Campanha = {
  id_campanha?: number;
  idCampanha?: number;
  id?: number;
  titulo?: string;
  nome?: string;
  slug?: string;
  descricao?: string | null;
  banner?: string | null;
  status_id?: number;
  statusid?: number;
};

type Produto = {
  id_produto?: number;
  idProduto?: number;
  id?: number;
  nome?: string;
  titulo?: string;
  slug?: string;
  descricao?: string | null;
  imagem?: string | null;
  status_id?: number;
  statusid?: number;
};

type TipoItem = "produto" | "campanha";

export default function CadastrarItemVitrinePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const tipo = (searchParams.get("tipo") || "campanha") as TipoItem;

  const ehCampanha = tipo === "campanha";
  const ehProduto = tipo === "produto";

  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setSelecionadas([]);
    setBusca("");

    if (ehCampanha) {
      carregarCampanhas();
      return;
    }

    if (ehProduto) {
      carregarProdutos();
      return;
    }

    setLoading(false);
  }, [tipo]);

  async function carregarCampanhas() {
    try {
      setLoading(true);

      const response = await api.get("/campanhas");
      const data = response.data;

      const lista = Array.isArray(data?.dados?.campanhas)
        ? data.dados.campanhas
        : Array.isArray(data?.campanhas)
          ? data.campanhas
          : Array.isArray(data?.dados)
            ? data.dados
            : Array.isArray(data)
              ? data
              : [];

      setCampanhas(lista);
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error);
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  }

  async function carregarProdutos() {
    try {
      setLoading(true);

      const response = await api.get("/produtos");
      const data = response.data;

      const lista = Array.isArray(data?.dados?.produtos)
        ? data.dados.produtos
        : Array.isArray(data?.produtos)
          ? data.produtos
          : Array.isArray(data?.dados)
            ? data.dados
            : Array.isArray(data)
              ? data
              : [];

      setProdutos(lista);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  function atualizarLista() {
    if (ehCampanha) {
      carregarCampanhas();
      return;
    }

    carregarProdutos();
  }

  function getCampanhaId(campanha: Campanha) {
    return Number(campanha.id_campanha ?? campanha.idCampanha ?? campanha.id ?? 0);
  }

  function getProdutoId(produto: Produto) {
    return Number(produto.id_produto ?? produto.idProduto ?? produto.id ?? 0);
  }

  function getCampanhaTitulo(campanha: Campanha) {
    return campanha.titulo || campanha.nome || "Campanha sem título";
  }

  function getProdutoTitulo(produto: Produto) {
    return produto.nome || produto.titulo || "Produto sem nome";
  }

  function getStatusId(item: Campanha | Produto) {
    return Number(item.status_id ?? item.statusid ?? 1);
  }

  const campanhasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return campanhas;

    return campanhas.filter((campanha) => {
      const texto = `
        ${campanha.titulo || ""}
        ${campanha.nome || ""}
        ${campanha.slug || ""}
        ${campanha.descricao || ""}
      `.toLowerCase();

      return texto.includes(termo);
    });
  }, [campanhas, busca]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return produtos;

    return produtos.filter((produto) => {
      const texto = `
        ${produto.nome || ""}
        ${produto.titulo || ""}
        ${produto.slug || ""}
        ${produto.descricao || ""}
      `.toLowerCase();

      return texto.includes(termo);
    });
  }, [produtos, busca]);

  function alternarSelecao(idItem: number) {
    if (!idItem) return;

    setSelecionadas((atual) => {
      if (atual.includes(idItem)) {
        return atual.filter((item) => item !== idItem);
      }

      return [...atual, idItem];
    });
  }

  async function salvarItens() {
    if (!id) return;

    if (selecionadas.length === 0) {
      alert(
        ehCampanha
          ? "Selecione pelo menos uma campanha."
          : "Selecione pelo menos um produto."
      );
      return;
    }

    try {
      setSalvando(true);

      for (const itemId of selecionadas) {
        await api.post(`/vitrine/${id}/item`, {
          produto_id: ehProduto ? itemId : null,
          campanha_id: ehCampanha ? itemId : null,
          categoria_id: null,
          status_id: 1,
          nivel_id: 1,
        });
      }

      alert(
        ehCampanha
          ? "Campanhas adicionadas com sucesso."
          : "Produtos adicionados com sucesso."
      );

      router.push(`/sistema/vitrines/${id}`);
    } catch (error: any) {
      console.error("Erro ao adicionar itens:", error);

      const mensagem =
        error?.response?.data?.mensagem ||
        error?.response?.data?.erro ||
        "Erro ao adicionar itens na vitrine.";

      alert(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  const totalEncontrados = ehCampanha
    ? campanhasFiltradas.length
    : produtosFiltrados.length;

  if (!ehCampanha && !ehProduto) {
    return (
      <main className="vitrine-detalhe-container">
        <div className="vitrine-detalhe-empty">
          <FiGrid />
          <strong>Tipo de item inválido</strong>
          <span>Use ?tipo=campanha ou ?tipo=produto na URL.</span>

          <Link
            href={`/sistema/vitrines/${id}`}
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
            href={`/sistema/vitrines/${id}`}
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
          aria-label={
            ehCampanha ? "Adicionar campanhas selecionadas" : "Adicionar produtos selecionados"
          }
          title={
            ehCampanha ? "Adicionar campanhas selecionadas" : "Adicionar produtos selecionados"
          }
          disabled={salvando || selecionadas.length === 0}
        >
          <FiSave />
        </button>
      </div>
    </main>
  );
}