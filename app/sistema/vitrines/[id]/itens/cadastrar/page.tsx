"use client";

import api from "@/Api/conectar";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiGrid,
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

export default function CadastrarItemVitrinePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const tipo = searchParams.get("tipo") || "produto";

  const ehCampanha = tipo === "campanha";

  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [selecionadas, setSelecionadas] = useState<number[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (ehCampanha) {
      carregarCampanhas();
      return;
    }

    setLoading(false);
  }, [ehCampanha]);

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

  function getCampanhaId(campanha: Campanha) {
    return Number(
      campanha.id_campanha ??
        campanha.idCampanha ??
        campanha.id ??
        0
    );
  }

  function getCampanhaTitulo(campanha: Campanha) {
    return campanha.titulo || campanha.nome || "Campanha sem título";
  }

  function getStatusId(campanha: Campanha) {
    return Number(campanha.status_id ?? campanha.statusid ?? 1);
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

  function alternarCampanha(idCampanha: number) {
    if (!idCampanha) return;

    setSelecionadas((atual) => {
      if (atual.includes(idCampanha)) {
        return atual.filter((item) => item !== idCampanha);
      }

      return [...atual, idCampanha];
    });
  }

  async function salvarCampanhas() {
    if (!id) return;

    if (selecionadas.length === 0) {
      alert("Selecione pelo menos uma campanha.");
      return;
    }

    try {
      setSalvando(true);

      for (const campanhaId of selecionadas) {
        await api.post(`/vitrine/${id}/item`, {
          campanha_id: campanhaId,
          produto_id: null,
          categoria_id: null,
          status_id: 1,
          nivel_id: 1,
        });
      }

      alert("Campanhas adicionadas com sucesso.");
      router.push(`/sistema/vitrines/${id}`);
    } catch (error: any) {
      console.error("Erro ao adicionar campanhas:", error);

      const mensagem =
        error?.response?.data?.mensagem ||
        error?.response?.data?.erro ||
        "Erro ao adicionar campanhas na vitrine.";

      alert(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  if (!ehCampanha) {
    return (
      <main className="vitrine-detalhe-container">
        <div className="vitrine-detalhe-empty">
          <FiGrid />
          <strong>Tipo de item ainda não configurado</strong>
          <span>
            Esta tela foi preparada para adicionar campanhas. Use
            ?tipo=campanha na URL.
          </span>

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
            <FiGrid />
            Selecionar campanhas
          </h1>

          <p>
            Escolha as campanhas promocionais que vão aparecer dentro desta
            vitrine.
          </p>
        </div>

        <button
          type="button"
          onClick={carregarCampanhas}
          className="vitrine-detalhe-refresh"
          disabled={loading}
        >
          <FiRefreshCw />
          Atualizar
        </button>
      </header>

      <section className="vitrine-detalhe-section-title">
        <div>
          <h2>Campanhas disponíveis</h2>

          <p>
            {campanhasFiltradas.length} campanhas encontradas •{" "}
            {selecionadas.length} selecionadas
          </p>
        </div>

        <div className="vitrine-detalhe-page-select">
          <FiSearch />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar campanha..."
          />
        </div>
      </section>

      {selecionadas.length > 0 && (
        <div className="vitrine-detalhe-selected-alert">
          <FiCheckCircle />
          {selecionadas.length} campanha(s) selecionada(s).
        </div>
      )}

      {loading ? (
        <p className="vitrine-detalhe-info">Carregando campanhas...</p>
      ) : campanhasFiltradas.length === 0 ? (
        <div className="vitrine-detalhe-empty">
          <FiXCircle />
          <strong>Nenhuma campanha encontrada</strong>
          <span>
            Cadastre uma campanha primeiro para depois adicionar na vitrine.
          </span>

          <Link
            href="/sistema/campanhas/cadastrar"
            className="vitrine-detalhe-empty-button"
          >
            <FiPlus />
            Criar campanha
          </Link>
        </div>
      ) : (
        <section className="vitrine-detalhe-grid">
          {campanhasFiltradas.map((campanha) => {
            const campanhaId = getCampanhaId(campanha);
            const selecionada = selecionadas.includes(campanhaId);
            const ativa = getStatusId(campanha) === 1;

            return (
              <article
                key={campanhaId}
                onClick={() => alternarCampanha(campanhaId)}
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
                    onChange={() => alternarCampanha(campanhaId)}
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
        </section>
      )}

      <div className="vitrine-detalhe-floating-group">
        <button
          type="button"
          onClick={salvarCampanhas}
          className="vitrine-detalhe-floating vitrine-detalhe-floating-add"
          aria-label="Adicionar campanhas selecionadas"
          title="Adicionar campanhas selecionadas"
          disabled={salvando || selecionadas.length === 0}
        >
          <FiSave />
        </button>
      </div>
    </main>
  );
}